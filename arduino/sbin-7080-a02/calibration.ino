#include "globals.h"

namespace {
constexpr unsigned long CALIBRATION_DURATION_MS = 20000;
constexpr int MAX_SENSOR_DISTANCE_MM = 10000;
}

bool calibrateBinDepth() {
    Serial.println("Starting empty-bin calibration for 20 seconds.");
    Serial.println("Keep the bin empty and unobstructed during calibration.");

    int maxDistanceMm = 0;
    unsigned long startedAt = millis();

    while (millis() - startedAt < CALIBRATION_DURATION_MS) {
        int distanceMm = getDistanceMm();
        if (distanceMm > maxDistanceMm && distanceMm <= MAX_SENSOR_DISTANCE_MM) {
            maxDistanceMm = distanceMm;
        }
        delay(100);
    }

    if (maxDistanceMm <= 0) {
        Serial.println("❌ No valid A02 readings; calibration was not saved.");
        return false;
    }

    binDepthMm = maxDistanceMm;
    preferences.begin("credentials", false);
    preferences.putInt("binDepthMm", binDepthMm);
    preferences.end();

    Serial.print("✅ Empty-bin reference saved: ");
    Serial.print(binDepthMm);
    Serial.println(" mm");
    return true;
}

int calculateFillLevel(int distanceMm) {
    if (binDepthMm <= 0 || distanceMm <= 0) {
        return -1;
    }

    float fullThresholdMm = binDepthMm * 0.10f;
    float effectiveRangeMm = binDepthMm - fullThresholdMm;
    if (effectiveRangeMm <= 0) {
        return -1;
    }

    float fillAmountMm = binDepthMm - distanceMm;
    int level = static_cast<int>((fillAmountMm / effectiveRangeMm) * 100.0f);
    return constrain(level, 0, 100);
}
