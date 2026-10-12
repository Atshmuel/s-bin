#include "globals.h"

bool initializePowerManagement() {
    if (!PMU.begin(Wire1, AXP2101_SLAVE_ADDRESS, PMU_I2C_SDA_PIN, PMU_I2C_SCL_PIN)) {
        Serial.println("❌ AXP2101 PMU initialization failed.");
        pmuAvailable = false;
        return false;
    }

    PMU.setChargingLedMode(XPOWERS_CHG_LED_OFF);
    PMU.setVbusCurrentLimit(XPOWERS_AXP2101_VBUS_CUR_LIM_1500MA);
    PMU.setDC3Voltage(3300);
    PMU.enableDC3();
    PMU.setBLDO2Voltage(3300);
    PMU.enableBLDO2();
    PMU.setALDO1Voltage(3300);
    PMU.enableALDO1();
    PMU.enableBattDetection();
    PMU.enableBattVoltageMeasure();
    PMU.enableVbusVoltageMeasure();

    pmuAvailable = true;
    Serial.println("✅ AXP2101 PMU Ready.");
    return true;
}

// Turns off the SIM7080 main (DC3) and GNSS antenna (BLDO2) rails for when the
// modem does not answer AT commands; initializePowerManagement() restores them.
void cutModemPower() {
    if (!pmuAvailable) {
        return;
    }
    PMU.disableBLDO2();
    PMU.disableDC3();
    Serial.println("🔌 Modem power rails turned off.");
}

uint16_t readBatteryMillivolts() {
    return pmuAvailable && PMU.isBatteryConnect() ? PMU.getBattVoltage() : 0;
}

int readBatteryPercent() {
    return pmuAvailable && PMU.isBatteryConnect() ? PMU.getBatteryPercent() : 0;
}

String updateDeviceHealth(bool sensorOk, bool pmuOk, bool gpsTested, bool gpsOk) {
    if (sensorOk) {
        sensorFailureCycles = 0;
    } else if (sensorFailureCycles < 2) {
        sensorFailureCycles++;
    }

    if (pmuOk) {
        pmuFailureCycles = 0;
    } else if (pmuFailureCycles < 2) {
        pmuFailureCycles++;
    }

    if (gpsTested) {
        if (gpsOk) {
            gpsFailureCycles = 0;
        } else if (gpsFailureCycles < 2) {
            gpsFailureCycles++;
        }
    }

    return healthFromFailureCounts(sensorFailureCycles, pmuFailureCycles, gpsFailureCycles);
}

String healthFromFailureCounts(uint8_t sensorFailures, uint8_t pmuFailures, uint8_t gpsFailures) {
    if (sensorFailures >= 2 || pmuFailures >= 2 || gpsFailures >= 2) {
        return "critical";
    }
    if (sensorFailures > 0 || pmuFailures > 0 || gpsFailures > 0) {
        return "warning";
    }
    return "good";
}

String getDeviceHealthMessage(int distanceMm) {
    return buildHealthMessage(
        sensorFailureCycles,
        pmuFailureCycles,
        gpsFailureCycles,
        binDepthMm <= 0 || lastCalibrationFailed,
        distanceMm
    );
}

// Shared by this bin's own reports and the readings it relays for mesh leaves.
String buildHealthMessage(
    uint8_t sensorFailures,
    uint8_t pmuFailures,
    uint8_t gpsFailures,
    bool calibrationFailed,
    int distanceMm
) {
    String message;
    if (sensorFailures > 0 && calibrationFailed) {
        message = "Empty-bin calibration failed (A02 distance: ";
        message += String(distanceMm);
        message += " mm)";
    } else if (sensorFailures > 0) {
        message = distanceMm <= 0
            ? "A02 sensor issue (distance: -1 mm) in "
            : "A02 fill-level calculation failed at distance ";
        if (distanceMm > 0) {
            message += String(distanceMm);
            message += " mm in ";
        }
        message += sensorFailures >= 2 ? "2 or more consecutive reporting cycles" : "the previous reporting cycle";
    }
    if (pmuFailures > 0) {
        if (message.length() > 0) {
            message += "; ";
        }
        message += "AXP2101 PMU or battery measurement failed in ";
        message += pmuFailures >= 2 ? "2 or more consecutive reporting cycles" : "the previous reporting cycle";
    }
    if (gpsFailures > 0) {
        if (message.length() > 0) {
            message += "; ";
        }
        message += "GNSS location refresh failed in ";
        message += gpsFailures >= 2 ? "2 or more consecutive monthly attempts" : "the previous monthly attempt";
    }
    return message;
}
