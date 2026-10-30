// S-Bin simulated mesh leaf for an ESP32-WROVER test board.
// TEST ONLY: remove this sketch once real leaf boards run the LilyGO firmware.
//
// Stands in for a bin without a SIM until the SIM-less LilyGO arrives. It has
// no Wi-Fi uplink and no real sensors: every cycle it wakes on the schedule it
// learned from a gateway beacon, sends a fake reading over ESP-NOW LR, waits
// for the gateway's ACK and deep-sleeps until the next slot.
//
// Board: "ESP32 Dev Module" (esp32:esp32:esp32). Serial monitor: 115200 baud.

#include <Preferences.h>
#include <SbinMesh.h>
#include <esp_sleep.h>
#include <sys/time.h>
#include <time.h>

using namespace sbinmesh;

namespace {
// Must match the organization ID entered in the gateway's setup portal; nodes
// of other organizations ignore each other.
constexpr char ORGANIZATION_ID[] = "699760a44e48dff9a082101e";

// This sketch's version, reported in its diagnostics (bump it for every flash).
constexpr uint8_t FIRMWARE_VERSION[3] = {1, 0, 0};

constexpr uint64_t MICROSECONDS_PER_SECOND = 1000000ULL;
// First boot, or after losing the gateway: without a clock or schedule the
// leaf cannot know when the gateway's short window is, so it listens through
// a whole 12-hour cycle. Fine for this USB-powered test board; real leaves
// rely on a pole gateway's long window instead. Slots keep the same local
// hour, so across a clock change one gap is an hour longer (13 hours): a
// 12.5-hour listen started after a flash on 2026-10-24 ended 3 minutes before
// the first winter-time slot.
constexpr uint32_t COLD_JOIN_LISTEN_MS = 13UL * 60UL * 60UL * 1000UL + 30UL * 60UL * 1000UL;
constexpr uint32_t COLD_JOIN_RETRY_SLEEP_SECONDS = 15UL * 60UL;
// A learned slot period outside this range is treated as a bad schedule.
constexpr uint32_t MIN_SCHEDULE_PERIOD_SECONDS = 60;
constexpr uint32_t MAX_SCHEDULE_PERIOD_SECONDS = 24UL * 60UL * 60UL;
// Never schedule a wake closer than this; it means the schedule is stale.
constexpr uint32_t MIN_SLEEP_TO_SLOT_SECONDS = 15;
// After this many missed beacons in a row the leaf stops following its slot
// pattern and listens until it hears the gateway again (a cold join). One:
// a miss usually means the schedule changed (an interval change reaches the
// gateway only after its next report, so leaves keep the old pattern for a
// cycle) or the gateway was down, and guessing the old pattern again only
// misses again; drift alone is covered by the guard.
constexpr uint8_t MAX_MISSED_CYCLES = 1;
// The guard is how much before the slot the leaf wakes and how long after the
// slot (plus the gateway's window) it keeps listening. Clock error grows with
// all the sleep since the last beacon, so the guard is a fraction of it: the
// clock uncertainty.
constexpr uint32_t MIN_GUARD_SECONDS = 10;
// Room for an unknown drift over a 12-hour sleep (~36 minutes at 5%).
constexpr uint32_t MAX_GUARD_SECONDS = 2400;
constexpr uint32_t GUARD_MARGIN_SECONDS = 5;
// Uncertainty while the drift is unknown, and the most missed beacons widen it
// to: the RC oscillator is specified to ±5%, and this board measured +1.3-3.5%.
constexpr uint32_t UNKNOWN_DRIFT_PPM = 50000;
// Residual assumed right after the first drift measurement, which can be off by
// far more than later ones: the WROVER measured +29,400 ppm over 80 minutes,
// then ran at +40,300 ppm for the next 3 hours (5,000 here missed that slot).
// The guard covers twice this; each catch halves it toward the measured error.
constexpr uint32_t FIRST_RESIDUAL_PPM = 15000;
// Floor for the residual: temperature and the gateway's own clock still vary.
// The WROVER's drift moved by up to 3,300 ppm between 12-hour cycles
// (+43,120 to +46,469 ppm), and halving down to 1,882 ppm left a 167 s guard
// that missed the slot; 2,500 keeps the guard at about 220 s on 12 hours,
// covering 5,000 ppm.
constexpr uint32_t MIN_RESIDUAL_PPM = 2500;
constexpr uint32_t LISTEN_SLACK_SECONDS = 5;
#if defined(ARDUINO_USB_CDC_ON_BOOT) && ARDUINO_USB_CDC_ON_BOOT
// An S3's native USB port disappears at every deep sleep (the WROVER's USB
// chip keeps its port), so on that build every boot waits this long for a
// Serial Monitor to (re)connect, or the first lines are lost. On battery it
// just times out; it uses up at most this much of the wake guard.
constexpr uint32_t USB_LOG_RECONNECT_WAIT_MS = 3000;
#endif
constexpr uint8_t SEND_ATTEMPTS = 3;
constexpr uint32_t ACK_TIMEOUT_MS = 1500;
constexpr uint8_t MAX_PENDING_READINGS = 4;
// Beacons carry milliseconds, but the gateway sets its own clock from 1 s
// network time, so its clock can jump by up to 1 s between cycles. Sleeps of
// 10+ minutes keep that below ~1,700 ppm per sample (averaged over cycles), so
// a few 10-minute dev cycles teach the drift before 12-hour sleeps.
constexpr int64_t MIN_DRIFT_MEASUREMENT_MS = 10LL * 60 * 1000;
// Above the RC oscillator's ±5%: a larger value means a bad reference time.
constexpr int32_t MAX_ABS_DRIFT_PPM = 60000;
// The drift is a property of the board, so it is also kept in flash (as on
// the gateway), rewritten only when the estimate moves this much.
constexpr char PREFERENCES_NAMESPACE[] = "leaf";
constexpr int32_t DRIFT_SAVE_THRESHOLD_PPM = 200;
}  // namespace

// A reading waiting for the gateway, and when it was taken by the device clock.
struct PendingReading {
    DataPacket packet;
    int64_t takenAtMs;
};

// State kept across deep sleep (lost on power loss or a reset, which means a
// cold join; only the drift is reloaded from flash).
RTC_DATA_ATTR bool driftLoaded = false;
RTC_DATA_ATTR uint32_t nextWakeEpoch = 0;
RTC_DATA_ATTR uint32_t schedulePeriodSeconds = 0;
RTC_DATA_ATTR uint32_t guardSeconds = MIN_GUARD_SECONDS;  // of the current sleep
RTC_DATA_ATTR uint32_t residualPpm = UNKNOWN_DRIFT_PPM;    // drift the estimate missed
RTC_DATA_ATTR uint8_t missedCycles = 0;
RTC_DATA_ATTR uint8_t meshWindowSeconds = 10;
RTC_DATA_ATTR int32_t driftPpm = 0;
RTC_DATA_ATTR bool driftMeasured = false;
RTC_DATA_ATTR int64_t sleepStartedEpochMs = 0;
// Deep sleep since the last beacon, by the device clock: the clock's error
// builds up only while asleep, since awake time runs on the main crystal.
RTC_DATA_ATTR int64_t sleptSinceSyncMs = 0;
// Drift estimate taken off the clock at each wake since the last beacon.
RTC_DATA_ATTR int64_t clockCorrectedSinceSyncMs = 0;
RTC_DATA_ATTR uint16_t lastAwakeSeconds = 0;
// The last beacon's RSSI and the beacons missed before it, for the diagnostics.
RTC_DATA_ATTR int8_t lastBeaconRssi = 0;
RTC_DATA_ATTR uint8_t missedBeforeBeacon = 0;
RTC_DATA_ATTR uint8_t fakeLevel = 10;
RTC_DATA_ATTR uint8_t fakeBattery = 100;
RTC_DATA_ATTR PendingReading pendingReadings[MAX_PENDING_READINGS];
RTC_DATA_ATTR uint8_t pendingCount = 0;
// The last server command run, so a gateway handing it over again (until the
// server has the result) does not run it twice.
RTC_DATA_ATTR uint8_t lastInstructionId[INSTRUCTION_ID_LENGTH] = {};

MeshRadio radio;
Preferences preferences;
uint8_t gatewayMac[MAC_LENGTH] = {};

bool clockValid() {
    return isValidEpoch(time(nullptr));
}

// After a power loss or a reset RTC memory starts over, but the board's drift
// is still known: it is loaded from flash, as uncertain as a first measurement.
// The schedule is not kept, so the leaf still cold-joins to find its slot; it
// then sleeps with a drift-corrected timer and a narrower guard than unknown
// drift needs, instead of learning the drift again over about two days.
void loadSavedDrift() {
    if (driftLoaded) {
        return;
    }
    driftLoaded = true;
    preferences.begin(PREFERENCES_NAMESPACE, false);
    if (preferences.isKey("driftPpm")) {
        driftPpm = preferences.getInt("driftPpm", 0);
        driftMeasured = true;
        residualPpm = FIRST_RESIDUAL_PPM;
        Serial.printf("⏱️ Clock drift %+ld ppm loaded from flash.\n", static_cast<long>(driftPpm));
    }
    preferences.end();
}

void saveDrift() {
    preferences.begin(PREFERENCES_NAMESPACE, false);
    if (!preferences.isKey("driftPpm") ||
        abs(driftPpm - preferences.getInt("driftPpm", 0)) > DRIFT_SAVE_THRESHOLD_PPM) {
        preferences.putInt("driftPpm", driftPpm);
    }
    preferences.end();
}

void queueReading(const DataPacket& reading) {
    if (pendingCount == MAX_PENDING_READINGS) {
        // Keep the newest readings; the oldest is the least useful.
        memmove(&pendingReadings[0], &pendingReadings[1],
                sizeof(PendingReading) * (MAX_PENDING_READINGS - 1));
        pendingCount--;
    }
    pendingReadings[pendingCount++] = {reading, epochMsNow()};
}

DataPacket makeFakeReading() {
    fakeLevel = static_cast<uint8_t>((fakeLevel + 7) % 101);
    fakeBattery = fakeBattery <= 20 ? 100 : static_cast<uint8_t>(fakeBattery - 1);

    DataPacket reading = {};
    radio.initHeader(reading.header, PACKET_DATA);
    reading.flags = DATA_SENSOR_OK;  // no location: the gateway's is used
    reading.level = fakeLevel;
    reading.battery = fakeBattery;
    reading.distanceMm = static_cast<int16_t>(1000 - fakeLevel * 8);
    reading.lastAwakeSeconds = lastAwakeSeconds;
    reading.meshAwakeWindowSeconds = meshWindowSeconds;
    reading.driftPpm = driftPpm;
    // This board has no battery gauge, sensor or scale: those diagnostics stay out.
    memcpy(reading.diagnostics.firmwareVersion, FIRMWARE_VERSION, sizeof(FIRMWARE_VERSION));
    reading.diagnostics.resetReason = static_cast<uint8_t>(esp_reset_reason());
    return reading;
}

// The link as it is when a reading goes out (it may have waited cycles).
void setLinkDiagnostics(DataPacket& reading) {
    reading.diagnostics.beaconRssi = lastBeaconRssi;
    reading.diagnostics.guardSeconds = static_cast<uint16_t>(min<uint32_t>(guardSeconds, UINT16_MAX));
    reading.diagnostics.missedCycles = missedBeforeBeacon;
    reading.diagnostics.residualPpm = static_cast<uint16_t>(min<uint32_t>(residualPpm, UINT16_MAX));
}

// Runs a command the gateway handed over (simulated: this leaf has no sensor
// or scale) and queues a fresh reading that carries the result.
void runInstruction(const AckPacket& ack) {
    if (ack.instructionType == INSTRUCTION_NONE ||
        memcmp(ack.instructionId, lastInstructionId, INSTRUCTION_ID_LENGTH) == 0) {
        return;
    }
    memcpy(lastInstructionId, ack.instructionId, INSTRUCTION_ID_LENGTH);

    DataPacket reading = makeFakeReading();
    memcpy(reading.resultId, ack.instructionId, INSTRUCTION_ID_LENGTH);
    switch (ack.instructionType) {
        case INSTRUCTION_REPORT_NOW:
            // The fresh reading is the extra report.
            reading.resultStatus = RESULT_COMPLETED;
            reading.resultCode = RESULT_REPORT_SENT;
            break;
        case INSTRUCTION_CALIBRATE_EMPTY_BIN:
            reading.resultStatus = RESULT_COMPLETED;
            reading.resultCode = RESULT_EMPTY_DEPTH;
            reading.resultValue = 1000;
            break;
        case INSTRUCTION_CALIBRATE_SCALE:
            reading.resultStatus = RESULT_FAILED;
            reading.resultCode = RESULT_SCALE_NOT_RESPONDING;
            break;
        default:
            reading.resultStatus = RESULT_FAILED;
            reading.resultCode = RESULT_UNSUPPORTED;
            break;
    }
    Serial.printf("🛠️ Ran command type %u: %s; the result rides on reading %08lX.\n",
                  ack.instructionType, reading.resultStatus == RESULT_COMPLETED ? "completed" : "failed",
                  static_cast<unsigned long>(reading.header.messageId));
    queueReading(reading);
}

// Sets the clock from a gateway beacon and learns drift, guard and schedule.
// atScheduledSlot is false during a cold join, when the stored wake time is
// not the slot this beacon belongs to.
void applyBeacon(const BeaconPacket& beacon, const ReceivedFrame& frame, bool atScheduledSlot) {
    const int64_t beaconNowMs = static_cast<int64_t>(beacon.epochMs) +
                                (millis() - frame.receivedAtMs);
    const int64_t deviceNowMs = epochMsNow();
    // The clock as the sleeps left it, before the wake-time drift corrections:
    // drift is measured on this, the error printed is what the estimate missed.
    const int64_t uncorrectedNowMs = deviceNowMs + clockCorrectedSinceSyncMs;
    const bool hadClock = clockValid();

    if (hadClock) {
        const int64_t errorMs = deviceNowMs - beaconNowMs;
        Serial.printf("🕒 Clock was off by %+lld ms.\n", static_cast<long long>(errorMs));
    }
    // Measured over all deep sleep since the last beacon, so a catch after a
    // missed slot and a cold-join retry teaches the drift too; that is how a
    // leaf whose drift is beyond its first guard learns it at all.
    if (hadClock && sleptSinceSyncMs > 0) {
        // Measured in milliseconds: the math is unit-free, and ms precision
        // makes short sleeps usable. The accumulated sleep is passed as one
        // sleep that ended at boot.
        int32_t measuredPpm = 0;
        int64_t realSleptMs = 0;
        const int64_t awakeMs = static_cast<int64_t>(millis());
        const DriftMeasurement result = measureDriftPpm(
            uncorrectedNowMs, beaconNowMs, uncorrectedNowMs - awakeMs - sleptSinceSyncMs, awakeMs,
            MIN_DRIFT_MEASUREMENT_MS, MAX_ABS_DRIFT_PPM, measuredPpm, realSleptMs);
        if (result == DRIFT_MEASURED) {
            // What the estimate did not predict (temperature, the gateway's own
            // clock) sets the next guard: it grows at once and halves per catch,
            // so a residual widened by missed beacons settles within a few
            // catches. The first measurement replaces the unknown-drift residual.
            residualPpm = driftMeasured
                ? max(static_cast<uint32_t>(abs(measuredPpm - driftPpm)), residualPpm / 2)
                : FIRST_RESIDUAL_PPM;
            driftPpm = blendDriftPpm(driftPpm, driftMeasured, measuredPpm);
            driftMeasured = true;
            saveDrift();
            Serial.printf("⏱️ Clock drift: measured %+ld ppm over %lld s; using %+ld ppm, residual %lu ppm.\n",
                          static_cast<long>(measuredPpm),
                          static_cast<long long>(realSleptMs / 1000),
                          static_cast<long>(driftPpm), static_cast<unsigned long>(residualPpm));
        } else if (result == DRIFT_IMPLAUSIBLE) {
            Serial.printf("⚠️ Ignoring implausible clock drift of %+ld ppm.\n",
                          static_cast<long>(measuredPpm));
        }
    }
    sleptSinceSyncMs = 0;
    clockCorrectedSinceSyncMs = 0;

    // Queued readings were timed on the clock being replaced; they move with
    // it, so a reading taken before the leaf had any time (a cold join) still
    // gets its real age.
    for (uint8_t i = 0; i < pendingCount; i++) {
        pendingReadings[i].takenAtMs += beaconNowMs - deviceNowMs;
    }
    setEpochMs(beaconNowMs);

    // A next wake further ahead than any schedule is stale; without one the
    // leaf searches for the gateway again later.
    const int64_t wakeAheadSeconds = static_cast<int64_t>(beacon.nextWakeEpoch) - beaconNowMs / 1000;
    const uint32_t advertisedWake =
        wakeAheadSeconds > 0 && wakeAheadSeconds <= MAX_WAKE_AHEAD_SECONDS ? beacon.nextWakeEpoch : 0;
    if (advertisedWake == 0) {
        Serial.printf("⚠️ Ignoring the beacon's next wake %lu.\n",
                      static_cast<unsigned long>(beacon.nextWakeEpoch));
    }
    // Learn the slot period only from the slot this leaf actually woke for;
    // anything else (cold join, a schedule that changed) would be a guess.
    if (atScheduledSlot && advertisedWake > nextWakeEpoch && nextWakeEpoch > 0) {
        const uint32_t period = advertisedWake - nextWakeEpoch;
        if (period >= MIN_SCHEDULE_PERIOD_SECONDS && period <= MAX_SCHEDULE_PERIOD_SECONDS) {
            schedulePeriodSeconds = period;
        }
    }
    nextWakeEpoch = advertisedWake;
    meshWindowSeconds = beacon.meshWindowSeconds;
    lastBeaconRssi = frame.rssi;
    missedBeforeBeacon = missedCycles;
    missedCycles = 0;
    memcpy(gatewayMac, frame.sender, MAC_LENGTH);
}

// Listens up to listenMs for a beacon sent directly by a gateway.
bool waitForBeacon(uint32_t listenMs, bool atScheduledSlot) {
    const uint32_t startedAt = millis();
    ReceivedFrame frame;
    while (millis() - startedAt < listenMs) {
        if (!radio.receive(frame, 100)) {
            continue;
        }
        const BeaconPacket* beacon = frame.as<BeaconPacket>(PACKET_BEACON);
        // Phase 1 is a star: only beacons straight from a gateway are used.
        if (beacon == nullptr || beacon->hopsToGateway != 0 ||
            !isValidEpoch(static_cast<int64_t>(beacon->epochMs / 1000))) {
            continue;
        }
        char macText[18];
        formatMac(frame.sender, macText);
        Serial.printf("📶 Beacon #%lu from gateway %s, RSSI %d dBm, next wake %lu, window %u s.\n",
                      static_cast<unsigned long>(beacon->beaconSeq), macText, frame.rssi,
                      static_cast<unsigned long>(beacon->nextWakeEpoch),
                      beacon->meshWindowSeconds);
        applyBeacon(*beacon, frame, atScheduledSlot);
        return true;
    }
    return false;
}

// Sends one reading and waits for the gateway's ACK, copied to `ack`; retries
// reuse the same message ID so the gateway and server can recognise duplicates.
bool deliverReading(const DataPacket& reading, AckPacket& ack) {
    for (uint8_t attempt = 1; attempt <= SEND_ATTEMPTS; attempt++) {
        if (!radio.sendTo(gatewayMac, &reading, sizeof(reading))) {
            Serial.printf("⚠️ Reading %08lX not confirmed by the radio (attempt %u).\n",
                          static_cast<unsigned long>(reading.header.messageId), attempt);
            continue;
        }
        const uint32_t startedAt = millis();
        ReceivedFrame frame;
        while (millis() - startedAt < ACK_TIMEOUT_MS) {
            if (!radio.receive(frame, 50)) {
                continue;
            }
            const AckPacket* received = frame.as<AckPacket>(PACKET_ACK);
            if (received == nullptr || received->ackedMessageId != reading.header.messageId ||
                !macEquals(received->ackedOrigin, radio.macAddress())) {
                continue;
            }
            ack = *received;
            Serial.printf("✅ Reading %08lX acknowledged (status %u, level %u%%, taken %lu s ago)%s.\n",
                          static_cast<unsigned long>(reading.header.messageId), ack.status,
                          reading.level, static_cast<unsigned long>(reading.ageSeconds),
                          ack.instructionType != INSTRUCTION_NONE ? ", with a command" : "");
            return true;  // stored, duplicate or rejected: stop sending it either way
        }
        Serial.printf("⚠️ No ACK for reading %08lX (attempt %u).\n",
                      static_cast<unsigned long>(reading.header.messageId), attempt);
    }
    return false;
}

// Sends the queue oldest first. A command in an ACK queues its result reading
// at the back, so it goes out in this window too when the gateway answers.
void sendPendingReadings() {
    while (pendingCount > 0) {
        PendingReading& pending = pendingReadings[0];
        pending.packet.ageSeconds =
            static_cast<uint32_t>(max<int64_t>(epochMsNow() - pending.takenAtMs, 0) / 1000);
        setLinkDiagnostics(pending.packet);
        AckPacket ack = {};
        if (!deliverReading(pending.packet, ack)) {
            break;
        }
        memmove(&pendingReadings[0], &pendingReadings[1], sizeof(PendingReading) * (pendingCount - 1));
        pendingCount--;
        runInstruction(ack);
    }
    if (pendingCount > 0) {
        Serial.printf("📦 %u reading(s) kept for the next cycle.\n", pendingCount);
    }
}

void deepSleepFor(uint64_t sleepSeconds) {
    const uint64_t timerSeconds = applyDriftCorrection(sleepSeconds, driftPpm);
    Serial.printf("💤 Deep sleep for %llu s (timer %llu s, drift %+ld ppm, guard %lu s).\n",
                  static_cast<unsigned long long>(sleepSeconds),
                  static_cast<unsigned long long>(timerSeconds), static_cast<long>(driftPpm),
                  static_cast<unsigned long>(guardSeconds));
    Serial.flush();
    radio.end();
    lastAwakeSeconds = static_cast<uint16_t>((millis() + 999UL) / 1000UL);
    sleepStartedEpochMs = clockValid() ? epochMsNow() : 0;
    esp_sleep_enable_timer_wakeup(timerSeconds * MICROSECONDS_PER_SECOND);
    esp_deep_sleep_start();
}

// Guard for a slot this much sleep after the last beacon: the clock
// uncertainty times that sleep.
uint32_t guardFor(uint64_t sleepSeconds) {
    const uint64_t uncertaintyPpm = driftMeasured
        ? 2ULL * max(residualPpm, MIN_RESIDUAL_PPM)
        : UNKNOWN_DRIFT_PPM;
    const uint64_t guard = sleepSeconds * uncertaintyPpm / 1000000ULL + GUARD_MARGIN_SECONDS;
    return static_cast<uint32_t>(constrain(guard, static_cast<uint64_t>(MIN_GUARD_SECONDS),
                                           static_cast<uint64_t>(MAX_GUARD_SECONDS)));
}

// Sleeps until the guard before the next slot, or retries a cold join.
void sleepUntilNextSlot() {
    const time_t now = time(nullptr);
    bool usable = clockValid() && nextWakeEpoch != 0 && missedCycles < MAX_MISSED_CYCLES;
    if (usable) {
        // After a missed beacon, assume the slot pattern continues.
        while (static_cast<time_t>(nextWakeEpoch) <= now + MIN_SLEEP_TO_SLOT_SECONDS &&
               schedulePeriodSeconds > 0) {
            nextWakeEpoch += schedulePeriodSeconds;
        }
        // A slot in the past or seconds away means the schedule is stale;
        // sleeping a second at a time would just spin. So does one further
        // ahead than any schedule.
        usable = static_cast<time_t>(nextWakeEpoch) > now + MIN_SLEEP_TO_SLOT_SECONDS &&
                 static_cast<time_t>(nextWakeEpoch) <= now + static_cast<time_t>(MAX_WAKE_AHEAD_SECONDS);
    }
    if (!usable) {
        Serial.println("🔍 No usable schedule; retrying a cold join later.");
        nextWakeEpoch = 0;
        deepSleepFor(COLD_JOIN_RETRY_SLEEP_SECONDS);
    }

    const uint64_t untilSlot = static_cast<time_t>(nextWakeEpoch) > now
        ? static_cast<uint64_t>(nextWakeEpoch - now)
        : 0;
    // After missed beacons the clock error keeps building over every sleep since
    // the last one, so the guard covers those sleeps too.
    guardSeconds = guardFor(untilSlot + static_cast<uint64_t>(sleptSinceSyncMs / 1000));
    const time_t wakeAt = static_cast<time_t>(nextWakeEpoch) - guardSeconds;
    deepSleepFor(wakeAt > now + 1 ? static_cast<uint64_t>(wakeAt - now) : 1);
}

void setup() {
    Serial.begin(115200);
#if defined(ARDUINO_USB_CDC_ON_BOOT) && ARDUINO_USB_CDC_ON_BOOT
    const uint32_t usbWaitStartedAt = millis();
    while (!Serial && millis() - usbWaitStartedAt < USB_LOG_RECONNECT_WAIT_MS) {
        delay(10);
    }
#endif
    Serial.println("\n=== S-Bin WROVER simulated mesh leaf ===");
    loadSavedDrift();
    // Add the deep sleep that just ended to the sleep since the last beacon.
    if (sleepStartedEpochMs > 0) {
        const int64_t sleptMs = epochMsNow() - static_cast<int64_t>(millis()) - sleepStartedEpochMs;
        sleptSinceSyncMs += sleptMs;
        sleepStartedEpochMs = 0;
        // The clock ran fast by about driftPpm over that sleep: the timer was
        // stretched to match, so the wake is on time, but the clock now reads
        // ahead by the whole drift (minutes after 12 hours). Take the estimate
        // off, so the listen deadline and any rescheduling run on real time.
        if (driftMeasured) {
            const int64_t correctionMs = driftAheadMs(sleptMs, driftPpm);
            setEpochMs(epochMsNow() - correctionMs);
            clockCorrectedSinceSyncMs += correctionMs;
        }
    }
    if (strcmp(ORGANIZATION_ID, "PUT_YOUR_ORGANIZATION_ID_HERE") == 0) {
        Serial.println("❌ Set ORGANIZATION_ID in the sketch to the gateway's organization ID.");
    }

    if (!radio.begin(ORGANIZATION_ID)) {
        deepSleepFor(COLD_JOIN_RETRY_SLEEP_SECONDS);
    }

    const bool coldJoin = !clockValid() || nextWakeEpoch == 0;
    uint32_t listenMs = COLD_JOIN_LISTEN_MS;
    if (!coldJoin) {
        const int64_t listenUntilMs = (static_cast<int64_t>(nextWakeEpoch) + guardSeconds +
                                       meshWindowSeconds + LISTEN_SLACK_SECONDS) * 1000;
        listenMs = static_cast<uint32_t>(constrain(listenUntilMs - epochMsNow(), static_cast<int64_t>(1000),
                                                   static_cast<int64_t>(COLD_JOIN_LISTEN_MS)));
    }
    Serial.printf("%s Listening up to %lu s for a gateway beacon.\n",
                  coldJoin ? "🔍 Cold join:" : "👂", static_cast<unsigned long>(listenMs / 1000));

    // Queued before listening, so a beacon that sets the clock moves its time too.
    queueReading(makeFakeReading());
    if (!waitForBeacon(listenMs, !coldJoin)) {
        missedCycles++;
        // The drift may have moved beyond the guard: widen it, but never past
        // the unknown-drift uncertainty (the guard covers twice the residual).
        residualPpm = min(max(residualPpm, MIN_RESIDUAL_PPM) * 2, UNKNOWN_DRIFT_PPM / 2);
        Serial.printf("⚠️ No beacon heard (%u missed cycle(s)); reading queued.\n", missedCycles);
        sleepUntilNextSlot();
    }

    sendPendingReadings();
    sleepUntilNextSlot();
}

void loop() {}
