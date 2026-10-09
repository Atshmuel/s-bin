#include "globals.h"

namespace {
constexpr time_t MIN_VALID_EPOCH = 1735689600;
constexpr uint64_t MICROSECONDS_PER_SECOND = 1000000ULL;
constexpr time_t GPS_REFRESH_INTERVAL_SECONDS = 31LL * 24 * 60 * 60;
constexpr uint64_t DEEP_SLEEP_TEST_SECONDS = 60;
}

bool isSystemClockValid() {
    return time(nullptr) >= MIN_VALID_EPOCH;
}

bool synchronizeClockFromNetwork() {
    int year = 0;
    int month = 0;
    int day = 0;
    int hour = 0;
    int minute = 0;
    int second = 0;
    float timezoneOffset = 0;

    if (!modem.waitForNetwork(30000L)) {
        Serial.println("⚠️ Cellular network unavailable for clock synchronization.");
        return isSystemClockValid();
    }

    for (uint8_t attempt = 0; attempt < 5; attempt++) {
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
    if (Serial) {
        Serial.println("🛠️ USB Serial Monitor is connected; skipping Deep Sleep for debugging.");
        Serial.println("The next sensor/report cycle will start in 30 seconds.");
        Serial.flush();
        delay(DEEP_SLEEP_TEST_SECONDS * 1000ULL);
        return;
    }

    if (Serial) {
    Serial.println("🛠️ USB Serial Monitor is connected; skipping Deep Sleep...");
    delay(30000);
    return; // <-- מונע Deep Sleep!
    }

    if (!isSystemClockValid()) {
        Serial.println("❌ Valid clock unavailable; keeping device awake to preserve fixed report times.");
        return;
    }

    if (modem.testAT(1000) && !modem.poweroff()) {
        Serial.println("⚠️ Modem did not confirm power-off before ESP32 deep sleep.");
    }

    Serial.printf("🧪 Deep sleep test: sleeping for %llu seconds.\n",
                  static_cast<unsigned long long>(DEEP_SLEEP_TEST_SECONDS));

    esp_sleep_enable_timer_wakeup(DEEP_SLEEP_TEST_SECONDS * MICROSECONDS_PER_SECOND);
    esp_deep_sleep_start();
}
