#pragma once

#include <stdint.h>

// Sleep-clock drift math shared by gateways (measured against network time)
// and leaves (measured against a gateway beacon). The ESP32 deep-sleep timer
// and system clock run on the internal RC oscillator, which drifts by about
// +0.5% on the boards measured so far.

namespace sbinmesh {

// Stretches (or shortens) a requested sleep so that a clock running fast by
// driftPpm wakes after sleepSeconds of real time.
uint64_t applyDriftCorrection(uint64_t sleepSeconds, int32_t driftPpm);

enum DriftMeasurement {
    DRIFT_MEASURED,
    DRIFT_NO_SLEEP,       // no recorded sleep start, or the sleep was too short
    DRIFT_IMPLAUSIBLE,    // outside maxAbsPpm; likely a bad reference time
};

// Measures drift over the last deep sleep. deviceEpoch is the device clock
// just before it is corrected to referenceEpoch; awakeSeconds is time spent
// awake since that sleep (it runs on the accurate main crystal).
DriftMeasurement measureDriftPpm(int64_t deviceEpoch,
                     int64_t referenceEpoch,
                     int64_t sleepStartedEpoch,
                     int64_t awakeSeconds,
                     int64_t minSleepSeconds,
                     int32_t maxAbsPpm,
                     int32_t& measuredPpm,
                     int64_t& realSleptSeconds);

// Averages a new measurement into the running estimate to smooth out
// temperature noise; the first measurement is used as is.
int32_t blendDriftPpm(int32_t currentPpm, bool hasCurrent, int32_t measuredPpm);

}  // namespace sbinmesh
