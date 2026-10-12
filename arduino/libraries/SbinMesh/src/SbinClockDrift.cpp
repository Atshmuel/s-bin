#include "SbinClockDrift.h"

namespace sbinmesh {

uint64_t applyDriftCorrection(uint64_t sleepSeconds, int32_t driftPpm) {
    // A clock running fast by r fires after requested / (1 + r) real seconds.
    const int64_t adjustment =
        static_cast<int64_t>(sleepSeconds) * driftPpm / 1000000LL;
    const int64_t corrected = static_cast<int64_t>(sleepSeconds) + adjustment;
    return corrected > 0 ? static_cast<uint64_t>(corrected) : 1;
}

DriftMeasurement measureDriftPpm(int64_t deviceEpoch,
                                 int64_t referenceEpoch,
                                 int64_t sleepStartedEpoch,
                                 int64_t awakeSeconds,
                                 int64_t minSleepSeconds,
                                 int32_t maxAbsPpm,
                                 int32_t& measuredPpm,
                                 int64_t& realSleptSeconds) {
    if (sleepStartedEpoch <= 0) {
        return DRIFT_NO_SLEEP;
    }
    const int64_t slept = deviceEpoch - sleepStartedEpoch - awakeSeconds;
    if (slept < minSleepSeconds) {
        return DRIFT_NO_SLEEP;
    }

    const int64_t errorSeconds = deviceEpoch - referenceEpoch;
    realSleptSeconds = slept - errorSeconds;
    if (realSleptSeconds <= 0) {
        return DRIFT_IMPLAUSIBLE;
    }
    const int64_t ppm = errorSeconds * 1000000LL / realSleptSeconds;
    if (ppm > maxAbsPpm || ppm < -maxAbsPpm) {
        measuredPpm = static_cast<int32_t>(ppm > INT32_MAX ? INT32_MAX : ppm < INT32_MIN ? INT32_MIN : ppm);
        return DRIFT_IMPLAUSIBLE;
    }
    measuredPpm = static_cast<int32_t>(ppm);
    return DRIFT_MEASURED;
}

int32_t blendDriftPpm(int32_t currentPpm, bool hasCurrent, int32_t measuredPpm) {
    if (!hasCurrent) {
        return measuredPpm;
    }
    return static_cast<int32_t>((static_cast<int64_t>(currentPpm) + measuredPpm) / 2);
}

}  // namespace sbinmesh
