#include "globals.h"

namespace {
constexpr time_t MIN_VALID_EPOCH = 1735689600;
constexpr uint64_t MICROSECONDS_PER_SECOND = 1000000ULL;
constexpr time_t GPS_REFRESH_INTERVAL_SECONDS = 31LL * 24 * 60 * 60;
constexpr uint32_t FALLBACK_SLEEP_SECONDS = 20;

// Returns only if the USB Serial Monitor stays connected for the whole wait.
void sleepOrWaitOnUsb(uint64_t sleepSeconds) {
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

    const uint64_t correctedSleepSeconds = applyDriftCorrection(sleepSeconds);
    Serial.printf(
        "💤 Deep sleep for %llu seconds (timer %llu s, drift %+ld ppm) before the next report attempt.\n",
        static_cast<unsigned long long>(sleepSeconds),
        static_cast<unsigned long long>(correctedSleepSeconds),
        static_cast<long>(driftPpm)
    );

    lastAwakeSeconds = (millis() + 999UL) / 1000UL;
    markSleepStart();
    esp_sleep_enable_timer_wakeup(correctedSleepSeconds * MICROSECONDS_PER_SECOND);
    esp_deep_sleep_start();
}
}

bool isSystemClockValid() {
    return time(nullptr) >= MIN_VALID_EPOCH;
}

bool synchronizeClockFromNetwork(unsigned long timeoutMs) {
    int year = 0;
    int month = 0;
    int day = 0;
    int hour = 0;
    int minute = 0;
    int second = 0;
    float timezoneOffset = 0;
    const unsigned long startedAt = millis();

    if (!modem.waitForNetwork(timeoutMs)) {
        Serial.println("⚠️ Cellular network unavailable for clock synchronization.");
        return isSystemClockValid();
    }

    for (uint8_t attempt = 0; attempt < 5 && millis() - startedAt < timeoutMs; attempt++) {
        if (modem.getNetworkTime(
                &year,
                &month,
                &day,
                &hour,
                &minute,
                &second,
                &timezoneOffset) &&
            year >= 2025 && month >= 1 && month <= 12 &&
            day >= 1 && day <= 31 && hour >= 0 && hour <= 23 &&
            minute >= 0 && minute <= 59 && second >= 0 && second <= 60 &&
            timezoneOffset >= -14 && timezoneOffset <= 14) {
            setenv("TZ", "UTC0", 1);
            tzset();

            struct tm networkTime = {};
            networkTime.tm_year = year - 1900;
            networkTime.tm_mon = month - 1;
            networkTime.tm_mday = day;
            networkTime.tm_hour = hour;
            networkTime.tm_min = minute;
            networkTime.tm_sec = second;
            time_t utcEpoch = mktime(&networkTime) -
                              static_cast<time_t>(timezoneOffset * 3600.0f);
            recordClockDrift(time(nullptr), utcEpoch);
            struct timeval timeValue = {utcEpoch, 0};
            if (settimeofday(&timeValue, nullptr) == 0) {
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

    if (clockValid && wakeEpoch > now) {
        sleepSeconds = wakeEpoch - now;
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

    sleepOrWaitOnUsb(sleepSeconds);
}

void enterDeepSleepForSetupRetry(uint32_t sleepSeconds, const char* reason) {
    Serial.printf(
        "❌ %s; sleeping %lu seconds before retrying.\n",
        reason,
        static_cast<unsigned long>(sleepSeconds)
    );
    sleepOrWaitOnUsb(sleepSeconds);
    // USB stayed connected, so no deep sleep happened; restart to retry setup.
    ESP.restart();
}
