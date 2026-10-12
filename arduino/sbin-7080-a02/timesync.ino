#include "globals.h"

// The deep-sleep timer and the system clock both run on the ESP32-S3's internal
// RC oscillator during sleep (this board has no 32 kHz crystal), which runs
// about +0.5% fast. Each network time sync measures that drift over the sleep
// that just ended, and the next sleep request is stretched to cancel it. The
// math is shared with the mesh leaves in the SbinMesh library.

namespace {
constexpr time_t MIN_VALID_EPOCH_FOR_DRIFT = 1735689600;
// Network time has 1 s resolution, so shorter sleeps are too noisy to measure.
constexpr int64_t MIN_DRIFT_MEASUREMENT_SECONDS = 3600;
constexpr int32_t MAX_ABS_DRIFT_PPM = 20000;
// Flash is rewritten only when the estimate moves this much.
constexpr int32_t DRIFT_SAVE_THRESHOLD_PPM = 200;
}

uint64_t applyDriftCorrection(uint64_t sleepSeconds) {
    return sbinmesh::applyDriftCorrection(sleepSeconds, driftPpm);
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

    int32_t measuredPpm = 0;
    int64_t realSlept = 0;
    const sbinmesh::DriftMeasurement result = sbinmesh::measureDriftPpm(
        static_cast<int64_t>(deviceEpoch),
        static_cast<int64_t>(referenceEpoch),
        static_cast<int64_t>(sleepStartedEpoch),
        static_cast<int64_t>(millis() / 1000UL),
        MIN_DRIFT_MEASUREMENT_SECONDS,
        MAX_ABS_DRIFT_PPM,
        measuredPpm,
        realSlept
    );
    sleepStartedEpoch = 0;
    if (result == sbinmesh::DRIFT_IMPLAUSIBLE) {
        Serial.printf(
            "⚠️ Ignoring implausible clock drift of %+ld ppm.\n",
            static_cast<long>(measuredPpm)
        );
    }
    if (result != sbinmesh::DRIFT_MEASURED) {
        return;
    }

    driftPpm = sbinmesh::blendDriftPpm(driftPpm, driftMeasured, measuredPpm);
    driftMeasured = true;
    Serial.printf(
        "⏱️ Clock drift: measured %+ld ppm over %lld s; using %+ld ppm.\n",
        static_cast<long>(measuredPpm),
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
