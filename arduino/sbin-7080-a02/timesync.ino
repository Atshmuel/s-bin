#include "globals.h"

// The deep-sleep timer and the system clock both run on the ESP32-S3's internal
// RC oscillator during sleep (this board has no 32 kHz crystal), which runs
// about +0.5% fast. Each network time sync measures that drift over the sleep
// that just ended, and the next sleep request is stretched to cancel it.

namespace {
constexpr time_t MIN_VALID_EPOCH_FOR_DRIFT = 1735689600;
// Network time has 1 s resolution, so shorter sleeps are too noisy to measure.
constexpr int64_t MIN_DRIFT_MEASUREMENT_SECONDS = 3600;
constexpr int32_t MAX_ABS_DRIFT_PPM = 20000;
// Flash is rewritten only when the estimate moves this much.
constexpr int32_t DRIFT_SAVE_THRESHOLD_PPM = 200;
}

uint64_t applyDriftCorrection(uint64_t sleepSeconds) {
    // A clock running fast by r fires after requested / (1 + r) real seconds.
    const int64_t adjustment =
        static_cast<int64_t>(sleepSeconds) * driftPpm / 1000000LL;
    const int64_t corrected = static_cast<int64_t>(sleepSeconds) + adjustment;
    return corrected > 0 ? static_cast<uint64_t>(corrected) : 1;
}

void markSleepStart() {
    const time_t now = time(nullptr);
    sleepStartedEpoch = now >= MIN_VALID_EPOCH_FOR_DRIFT
        ? static_cast<uint64_t>(now)
        : 0;
}

void recordClockDrift(time_t deviceEpoch, time_t referenceEpoch) {
    if (sleepStartedEpoch == 0 || deviceEpoch < MIN_VALID_EPOCH_FOR_DRIFT) {
        return;
    }

    // Time awake since boot runs on the accurate main crystal, so only the
    // deep-sleep part of the elapsed time carries the RC drift.
    const int64_t slept = static_cast<int64_t>(deviceEpoch) -
                          static_cast<int64_t>(sleepStartedEpoch) -
                          static_cast<int64_t>(millis() / 1000UL);
    sleepStartedEpoch = 0;
    if (slept < MIN_DRIFT_MEASUREMENT_SECONDS) {
        return;
    }

    const int64_t errorSeconds =
        static_cast<int64_t>(deviceEpoch) - static_cast<int64_t>(referenceEpoch);
    const int64_t realSlept = slept - errorSeconds;
    if (realSlept <= 0) {
        return;
    }
    const int64_t measuredPpm = errorSeconds * 1000000LL / realSlept;
    if (measuredPpm > MAX_ABS_DRIFT_PPM || measuredPpm < -MAX_ABS_DRIFT_PPM) {
        Serial.printf(
            "⚠️ Ignoring implausible clock drift of %+lld ppm.\n",
            static_cast<long long>(measuredPpm)
        );
        return;
    }

    driftPpm = driftMeasured
        ? static_cast<int32_t>((driftPpm + measuredPpm) / 2)
        : static_cast<int32_t>(measuredPpm);
    driftMeasured = true;
    Serial.printf(
        "⏱️ Clock drift: measured %+lld ppm over %lld s; using %+ld ppm.\n",
        static_cast<long long>(measuredPpm),
        static_cast<long long>(realSlept),
        static_cast<long>(driftPpm)
    );

    preferences.begin("credentials", false);
    const bool hasSavedDrift = preferences.isKey("driftPpm");
    const int32_t savedDriftPpm = preferences.getInt("driftPpm", 0);
    if (!hasSavedDrift || abs(driftPpm - savedDriftPpm) > DRIFT_SAVE_THRESHOLD_PPM) {
        preferences.putInt("driftPpm", driftPpm);
    }
    preferences.end();
}
