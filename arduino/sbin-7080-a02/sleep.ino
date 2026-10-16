#include "globals.h"

namespace {
constexpr time_t MIN_VALID_EPOCH = 1735689600;
constexpr uint64_t MICROSECONDS_PER_SECOND = 1000000ULL;
constexpr time_t GPS_REFRESH_INTERVAL_SECONDS = 31LL * 24 * 60 * 60;
constexpr uint32_t FALLBACK_SLEEP_SECONDS = 20;

// Anchoring the mesh window to the slot (see waitForSlotStart()). The sleep
// clock's drift changed by up to ~7,600 ppm between cycles and the estimate
// missed it by up to ~5,400 ppm, so a slot sleep ends this early on purpose...
constexpr uint64_t SLOT_LEAD_PPM = 8000;
// ...plus the modem boot and network time sync after the wake (~10 s).
constexpr uint64_t SLOT_LEAD_SYNC_SECONDS = 30;
constexpr uint64_t MAX_SLOT_LEAD_SECONDS = 600;
// Shorter sleeps (development intervals) drift by only a few seconds.
constexpr uint64_t MIN_LEAD_SLEEP_SECONDS = 600;
// The light sleep ends this long before the slot to re-read network time.
constexpr int64_t SLOT_RESYNC_SECONDS = 5;
// A timer wake further than this before the slot is not that slot's wake.
constexpr int64_t MAX_SLOT_WAIT_SECONDS = 900;

// Time spent in light sleep this boot; not counted as awake time.
uint32_t lightSleptMs = 0;

int64_t epochMsNow() {
    struct timeval now;
    gettimeofday(&now, nullptr);
    return static_cast<int64_t>(now.tv_sec) * 1000LL + now.tv_usec / 1000;
}

// How early a slot sleep ends on purpose: enough for the drift to change by
// SLOT_LEAD_PPM over the sleep, plus the time to sync the clock after waking.
uint32_t slotLeadSeconds(uint64_t sleepSeconds) {
    if (sleepSeconds < MIN_LEAD_SLEEP_SECONDS) {
        return 0;
    }
    const uint64_t lead = sleepSeconds * SLOT_LEAD_PPM / 1000000ULL + SLOT_LEAD_SYNC_SECONDS;
    return static_cast<uint32_t>(min(lead, MAX_SLOT_LEAD_SECONDS));
}

// Reads the modem's network time as a UTC epoch (1 s resolution).
bool readNetworkEpoch(time_t& utcEpoch) {
    int year = 0;
    int month = 0;
    int day = 0;
    int hour = 0;
    int minute = 0;
    int second = 0;
    float timezoneOffset = 0;
    if (!modem.getNetworkTime(
            &year,
            &month,
            &day,
            &hour,
            &minute,
            &second,
            &timezoneOffset) ||
        year < 2025 || month < 1 || month > 12 ||
        day < 1 || day > 31 || hour < 0 || hour > 23 ||
        minute < 0 || minute > 59 || second < 0 || second > 60 ||
        timezoneOffset < -14 || timezoneOffset > 14) {
        return false;
    }
    setenv("TZ", "UTC0", 1);
    tzset();

    struct tm networkTime = {};
    networkTime.tm_year = year - 1900;
    networkTime.tm_mon = month - 1;
    networkTime.tm_mday = day;
    networkTime.tm_hour = hour;
    networkTime.tm_min = minute;
    networkTime.tm_sec = second;
    utcEpoch = mktime(&networkTime) - static_cast<time_t>(timezoneOffset * 3600.0f);
    return true;
}

// Returns only if the USB Serial Monitor stays connected for the whole wait.
// While connected the clock runs on the crystal, so the wait lasts until the
// slot itself; a deep sleep ends leadSeconds before it.
void sleepOrWaitOnUsb(uint64_t sleepSeconds, uint32_t leadSeconds) {
    if (Serial) {
        Serial.printf(
            "🛠️ USB Serial Monitor is connected; waiting %llu seconds until the next report attempt.\n",
            static_cast<unsigned long long>(sleepSeconds)
        );
        Serial.flush();
        const unsigned long waitStartedAt = millis();
        const uint64_t requestedWaitMs = sleepSeconds * 1000ULL;
        while (Serial && millis() - waitStartedAt < requestedWaitMs) {
            delay(100);
        }
        if (Serial) {
            return;
        }

        const uint64_t elapsedSeconds = (millis() - waitStartedAt) / 1000ULL;
        if (elapsedSeconds >= sleepSeconds) {
            return;
        }
        sleepSeconds -= elapsedSeconds;
    }

    if (modem.testAT(1000) && !modem.poweroff()) {
        Serial.println("⚠️ Modem did not confirm power-off before ESP32 deep sleep.");
    }

    sleepLeadSeconds = leadSeconds < sleepSeconds ? leadSeconds : 0;
    sleepSeconds -= sleepLeadSeconds;
    const uint64_t correctedSleepSeconds = applyDriftCorrection(sleepSeconds);
    Serial.printf(
        "💤 Deep sleep for %llu seconds (timer %llu s, drift %+ld ppm, %lu s before the slot) before the next report attempt.\n",
        static_cast<unsigned long long>(sleepSeconds),
        static_cast<unsigned long long>(correctedSleepSeconds),
        static_cast<long>(driftPpm),
        static_cast<unsigned long>(sleepLeadSeconds)
    );

    lastAwakeSeconds = (millis() - lightSleptMs + 999UL) / 1000UL;
    markSleepStart();
    esp_sleep_enable_timer_wakeup(correctedSleepSeconds * MICROSECONDS_PER_SECOND);
    esp_deep_sleep_start();
}
}

bool isSystemClockValid() {
    return time(nullptr) >= MIN_VALID_EPOCH;
}

bool synchronizeClockFromNetwork(unsigned long timeoutMs) {
    const unsigned long startedAt = millis();

    if (!modem.waitForNetwork(timeoutMs)) {
        Serial.println("⚠️ Cellular network unavailable for clock synchronization.");
        return isSystemClockValid();
    }

    for (uint8_t attempt = 0; attempt < 5 && millis() - startedAt < timeoutMs; attempt++) {
        time_t utcEpoch = 0;
        if (readNetworkEpoch(utcEpoch)) {
            const time_t deviceEpoch = time(nullptr);
            recordWakeTiming(deviceEpoch, utcEpoch);
            recordClockDrift(deviceEpoch, utcEpoch);
            struct timeval timeValue = {utcEpoch, 0};
            if (settimeofday(&timeValue, nullptr) == 0) {
                clockSyncedFromNetwork = true;
                Serial.println("✅ Clock synchronized from the cellular network.");
                return true;
            }
        }
        delay(1000);
    }

    Serial.println("⚠️ Could not read valid network time; using the retained RTC clock if available.");
    setenv("TZ", "UTC0", 1);
    tzset();
    return isSystemClockValid();
}

bool shouldRefreshGpsLocation() {
    if (!hasGpsFix || lastGpsAttemptEpoch <= 0 || !isSystemClockValid()) {
        return true;
    }

    time_t now = time(nullptr);
    return difftime(now, lastGpsAttemptEpoch) >= GPS_REFRESH_INTERVAL_SECONDS;
}

void recordGpsAttempt() {
    if (!isSystemClockValid()) {
        return;
    }

    lastGpsAttemptEpoch = time(nullptr);
    preferences.begin("credentials", false);
    preferences.putLong64("gpsAttempt", static_cast<int64_t>(lastGpsAttemptEpoch));
    preferences.end();
}

void saveLastKnownLocation() {
    if (!isSystemClockValid()) {
        Serial.println("⚠️ GPS fix acquired, but clock is invalid; location timestamp was not saved.");
        return;
    }

    lastGpsUpdateEpoch = time(nullptr);
    lastGpsAttemptEpoch = lastGpsUpdateEpoch;
    preferences.begin("credentials", false);
    preferences.putFloat("gpsLat", latitude);
    preferences.putFloat("gpsLon", longitude);
    preferences.putLong64("gpsEpoch", static_cast<int64_t>(lastGpsUpdateEpoch));
    preferences.putLong64("gpsAttempt", static_cast<int64_t>(lastGpsAttemptEpoch));
    preferences.end();
}

// The sleep clock drifts by minutes over 12 hours and the drift changes from
// cycle to cycle, so a slot sleep ends sleepLeadSeconds early on purpose. Once
// network time says exactly how long is left, this waits out the rest in light
// sleep (the modem in its own sleep mode) and returns on the slot: the mesh
// window opens on it to about a second, wherever the drifting clock woke the
// gateway. A late wake returns at once.
void waitForSlotStart() {
    if (esp_sleep_get_wakeup_cause() != ESP_SLEEP_WAKEUP_TIMER || sleepLeadSeconds == 0 ||
        nextWakeEpoch == 0 || !clockSyncedFromNetwork) {
        return;
    }
    int64_t untilSlotMs = static_cast<int64_t>(nextWakeEpoch) * 1000LL - epochMsNow();
    if (untilSlotMs <= 0) {
        Serial.printf("⚠️ Reached the slot %lld s late; opening the mesh window now.\n",
                      static_cast<long long>(-untilSlotMs / 1000));
        return;
    }
    if (untilSlotMs > MAX_SLOT_WAIT_SECONDS * 1000LL) {
        return;
    }

    const int64_t sleepMs = untilSlotMs - SLOT_RESYNC_SECONDS * 1000LL;
    if (sleepMs > 1000) {
        Serial.printf("⏳ %lld s until the slot; light sleep with the modem asleep.\n",
                      static_cast<long long>(untilSlotMs / 1000));
        Serial.flush();
        modem.sleepEnable(true);
        digitalWrite(BOARD_MODEM_DTR_PIN, HIGH);
        // The light-sleep timer runs on the same RC clock as deep sleep.
        const uint64_t timerMs = sbinmesh::applyDriftCorrection(static_cast<uint64_t>(sleepMs), driftPpm);
        const uint32_t sleepStartedMs = millis();
        esp_sleep_enable_timer_wakeup(timerMs * 1000ULL);
        esp_light_sleep_start();
        lightSleptMs += millis() - sleepStartedMs;

        // DTR low for at least 50 ms wakes the modem; then leave its sleep mode.
        digitalWrite(BOARD_MODEM_DTR_PIN, LOW);
        delay(100);
        modem.testAT(1000);
        modem.sleepEnable(false);
        // The system clock also ran on the RC clock; take it from the network again.
        time_t utcEpoch = 0;
        if (readNetworkEpoch(utcEpoch)) {
            struct timeval timeValue = {utcEpoch, 0};
            settimeofday(&timeValue, nullptr);
        } else {
            Serial.println("⚠️ Could not re-read network time after the wait; using the sleep clock.");
        }
        untilSlotMs = static_cast<int64_t>(nextWakeEpoch) * 1000LL - epochMsNow();
    }
    if (untilSlotMs > 0) {
        delay(static_cast<uint32_t>(untilSlotMs));
    }
    Serial.println("🎯 Slot reached; opening the mesh window on time.");
}

void enterDeepSleepUntilNextReport() {
    const unsigned long awakeWindowMs = meshAwakeWindowSeconds * 1000UL;
    const unsigned long awakeMs = millis();
    if (awakeMs < awakeWindowMs) {
        Serial.printf(
            "⏱️ Holding the awake window for %lu more ms before sleep.\n",
            awakeWindowMs - awakeMs
        );
        while (millis() < awakeWindowMs) {
            delay(50);
        }
    }

    const bool clockValid = isSystemClockValid();
    const uint64_t now = clockValid ? static_cast<uint64_t>(time(nullptr)) : 0;
    uint64_t wakeEpoch = nextWakeEpoch;
    uint64_t sleepSeconds = 0;
    uint32_t leadSeconds = 0;

    if (clockValid && wakeEpoch > now) {
        sleepSeconds = wakeEpoch - now;
        leadSeconds = slotLeadSeconds(sleepSeconds);
    } else {
        sleepSeconds = scheduledSleepDurationSeconds > 0
            ? scheduledSleepDurationSeconds
            : FALLBACK_SLEEP_SECONDS;
        if (clockValid) {
            wakeEpoch = now + sleepSeconds;
            nextWakeEpoch = wakeEpoch;
            preferences.begin("credentials", false);
            preferences.putULong64("nextWake", nextWakeEpoch);
            preferences.end();
        }
        Serial.printf(
            "⚠️ No future server wake time; using local %llu-second sleep before retrying.\n",
            static_cast<unsigned long long>(sleepSeconds)
        );
    }

    sleepOrWaitOnUsb(sleepSeconds, leadSeconds);
}

void enterDeepSleepForSetupRetry(uint32_t sleepSeconds, const char* reason) {
    Serial.printf(
        "❌ %s; sleeping %lu seconds before retrying.\n",
        reason,
        static_cast<unsigned long>(sleepSeconds)
    );
    sleepOrWaitOnUsb(sleepSeconds, 0);
    // USB stayed connected, so no deep sleep happened; restart to retry setup.
    ESP.restart();
}
