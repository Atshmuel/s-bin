// S-Bin simulated mesh leaf for an ESP32-WROVER test board.
// TEST ONLY: remove this sketch once real leaf boards run the LilyGO firmware.
//
// Stands in for a bin without a SIM until the SIM-less LilyGO arrives. It has
// no Wi-Fi uplink and no real sensors: every cycle it wakes on the schedule it
// learned from a gateway beacon, sends a fake reading over ESP-NOW LR, waits
// for the gateway's ACK and deep-sleeps until the next slot.
//
// Board: "ESP32 Dev Module" (esp32:esp32:esp32). Serial monitor: 115200 baud.

#include <SbinMesh.h>
#include <esp_sleep.h>
#include <sys/time.h>
#include <time.h>

using namespace sbinmesh;

namespace {
// Must match the organization ID entered in the gateway's setup portal; nodes
// of other organizations ignore each other.
constexpr char ORGANIZATION_ID[] = "699760a44e48dff9a082101e";

constexpr time_t MIN_VALID_EPOCH = 1735689600;
constexpr uint64_t MICROSECONDS_PER_SECOND = 1000000ULL;
// First boot, or after losing the gateway: without a clock or schedule the
// leaf cannot know when the gateway's short window is, so it listens through
// a whole 12-hour cycle. Fine for this USB-powered test board; real leaves
// rely on a pole gateway's long window instead.
constexpr uint32_t COLD_JOIN_LISTEN_MS = 12UL * 60UL * 60UL * 1000UL + 30UL * 60UL * 1000UL;
constexpr uint32_t COLD_JOIN_RETRY_SLEEP_SECONDS = 15UL * 60UL;
// A learned slot period outside this range is treated as a bad schedule.
constexpr uint32_t MIN_SCHEDULE_PERIOD_SECONDS = 60;
constexpr uint32_t MAX_SCHEDULE_PERIOD_SECONDS = 24UL * 60UL * 60UL;
// Never schedule a wake closer than this; it means the schedule is stale.
constexpr uint32_t MIN_SLEEP_TO_SLOT_SECONDS = 15;
// After a missed beacon the leaf keeps following the slot pattern; only this
// many misses in a row send it back to a cold join.
constexpr uint8_t MAX_MISSED_CYCLES = 6;
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
// Residual assumed right after the first drift measurement: the WROVER's drift
// changed by up to ~9,000 ppm between cycles, and the guard covers twice this.
constexpr uint32_t FIRST_RESIDUAL_PPM = 5000;
// Floor for the residual: temperature and the gateway's own clock still vary.
constexpr uint32_t MIN_RESIDUAL_PPM = 500;
constexpr uint32_t LISTEN_SLACK_SECONDS = 5;
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
}  // namespace

// State kept across deep sleep (lost on power loss, which means a cold join).
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
RTC_DATA_ATTR uint8_t fakeLevel = 10;
RTC_DATA_ATTR uint8_t fakeBattery = 100;
RTC_DATA_ATTR DataPacket pendingReadings[MAX_PENDING_READINGS];
RTC_DATA_ATTR uint8_t pendingCount = 0;

MeshRadio radio;
uint8_t gatewayMac[MAC_LENGTH] = {};

int64_t nowMs() {
    struct timeval now;
    gettimeofday(&now, nullptr);
    return static_cast<int64_t>(now.tv_sec) * 1000 + now.tv_usec / 1000;
}

bool clockValid() {
    return time(nullptr) >= MIN_VALID_EPOCH;
}

void shiftClockMs(int64_t deltaMs) {
    const int64_t shiftedMs = nowMs() + deltaMs;
    struct timeval shifted = {
        static_cast<time_t>(shiftedMs / 1000),
        static_cast<suseconds_t>((shiftedMs % 1000) * 1000),
    };
    settimeofday(&shifted, nullptr);
}

void queueReading(const DataPacket& reading) {
    if (pendingCount == MAX_PENDING_READINGS) {
        // Keep the newest readings; the oldest is the least useful.
        memmove(&pendingReadings[0], &pendingReadings[1],
                sizeof(DataPacket) * (MAX_PENDING_READINGS - 1));
        pendingCount--;
    }
    pendingReadings[pendingCount++] = reading;
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
    return reading;
}

// Sets the clock from a gateway beacon and learns drift, guard and schedule.
// atScheduledSlot is false during a cold join, when the stored wake time is
// not the slot this beacon belongs to.
void applyBeacon(const BeaconPacket& beacon, const ReceivedFrame& frame, bool atScheduledSlot) {
    const int64_t beaconNowMs = static_cast<int64_t>(beacon.epochMs) +
                                (millis() - frame.receivedAtMs);
    const int64_t deviceNowMs = nowMs();
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

    struct timeval corrected = {
        static_cast<time_t>(beaconNowMs / 1000),
        static_cast<suseconds_t>((beaconNowMs % 1000) * 1000),
    };
    settimeofday(&corrected, nullptr);

    // Learn the slot period only from the slot this leaf actually woke for;
    // anything else (cold join, a schedule that changed) would be a guess.
    if (atScheduledSlot && beacon.nextWakeEpoch > nextWakeEpoch && nextWakeEpoch > 0) {
        const uint32_t period = beacon.nextWakeEpoch - nextWakeEpoch;
        if (period >= MIN_SCHEDULE_PERIOD_SECONDS && period <= MAX_SCHEDULE_PERIOD_SECONDS) {
            schedulePeriodSeconds = period;
        }
    }
    nextWakeEpoch = beacon.nextWakeEpoch;
    meshWindowSeconds = beacon.meshWindowSeconds;
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
            beacon->epochMs < static_cast<uint64_t>(MIN_VALID_EPOCH) * 1000ULL) {
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

// Sends one reading and waits for the gateway's ACK; retries reuse the same
// message ID so the gateway and server can recognise duplicates.
bool deliverReading(const DataPacket& reading) {
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
            const AckPacket* ack = frame.as<AckPacket>(PACKET_ACK);
            if (ack == nullptr || ack->ackedMessageId != reading.header.messageId ||
                !macEquals(ack->ackedOrigin, radio.macAddress())) {
                continue;
            }
            Serial.printf("✅ Reading %08lX acknowledged (status %u, level %u%%).\n",
                          static_cast<unsigned long>(reading.header.messageId), ack->status,
                          reading.level);
            return true;  // stored, duplicate or rejected: stop sending it either way
        }
        Serial.printf("⚠️ No ACK for reading %08lX (attempt %u).\n",
                      static_cast<unsigned long>(reading.header.messageId), attempt);
    }
    return false;
}

void sendPendingReadings() {
    uint8_t delivered = 0;
    while (delivered < pendingCount && deliverReading(pendingReadings[delivered])) {
        delivered++;
    }
    memmove(&pendingReadings[0], &pendingReadings[delivered],
            sizeof(DataPacket) * (pendingCount - delivered));
    pendingCount -= delivered;
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
    sleepStartedEpochMs = clockValid() ? nowMs() : 0;
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
        // sleeping a second at a time would just spin.
        usable = static_cast<time_t>(nextWakeEpoch) > now + MIN_SLEEP_TO_SLOT_SECONDS;
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
    Serial.println("\n=== S-Bin WROVER simulated mesh leaf ===");
    // Add the deep sleep that just ended to the sleep since the last beacon.
    if (sleepStartedEpochMs > 0) {
        const int64_t sleptMs = nowMs() - static_cast<int64_t>(millis()) - sleepStartedEpochMs;
        sleptSinceSyncMs += sleptMs;
        sleepStartedEpochMs = 0;
        // The clock ran fast by about driftPpm over that sleep: the timer was
        // stretched to match, so the wake is on time, but the clock now reads
        // ahead by the whole drift (minutes after 12 hours). Take the estimate
        // off, so the listen deadline and any rescheduling run on real time.
        if (driftMeasured) {
            const int64_t correctionMs = sleptMs * driftPpm / (1000000LL + driftPpm);
            shiftClockMs(-correctionMs);
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
        listenMs = static_cast<uint32_t>(max<int64_t>(listenUntilMs - nowMs(), 1000));
    }
    Serial.printf("%s Listening up to %lu s for a gateway beacon.\n",
                  coldJoin ? "🔍 Cold join:" : "👂", static_cast<unsigned long>(listenMs / 1000));

    const DataPacket reading = makeFakeReading();
    if (!waitForBeacon(listenMs, !coldJoin)) {
        missedCycles++;
        // The drift may have moved beyond the guard: widen it, but never past
        // the unknown-drift uncertainty (the guard covers twice the residual).
        residualPpm = min(max(residualPpm, MIN_RESIDUAL_PPM) * 2, UNKNOWN_DRIFT_PPM / 2);
        queueReading(reading);
        Serial.printf("⚠️ No beacon heard (%u missed cycle(s)); reading queued.\n", missedCycles);
        sleepUntilNextSlot();
    }

    queueReading(reading);
    sendPendingReadings();
    sleepUntilNextSlot();
}

void loop() {}
