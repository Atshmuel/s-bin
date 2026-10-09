#include "globals.h"

bool initializePowerManagement() {
    if (!PMU.begin(Wire1, AXP2101_SLAVE_ADDRESS, PMU_I2C_SDA_PIN, PMU_I2C_SCL_PIN)) {
        Serial.println("❌ AXP2101 PMU initialization failed.");
        pmuAvailable = false;
        return false;
    }

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

    if (sensorFailureCycles >= 2 || pmuFailureCycles >= 2 || gpsFailureCycles >= 2) {
        return "critical";
    }
    if (sensorFailureCycles > 0 || pmuFailureCycles > 0 || gpsFailureCycles > 0) {
        return "warning";
    }
    return "good";
}

String getDeviceHealthMessage(int distanceMm) {
    String message;
    if (sensorFailureCycles > 0) {
        message = distanceMm <= 0
            ? "A02 sensor issue (distance: -1 mm) in "
            : "A02 fill-level calculation failed at distance ";
        if (distanceMm > 0) {
            message += String(distanceMm);
            message += " mm in ";
        }
        message += sensorFailureCycles >= 2 ? "2 or more consecutive reporting cycles" : "the previous reporting cycle";
    }
    if (pmuFailureCycles > 0) {
        if (message.length() > 0) {
            message += "; ";
        }
        message += "AXP2101 PMU or battery measurement failed in ";
        message += pmuFailureCycles >= 2 ? "2 or more consecutive reporting cycles" : "the previous reporting cycle";
    }
    if (gpsFailureCycles > 0) {
        if (message.length() > 0) {
            message += "; ";
        }
        message += "GNSS location refresh failed in ";
        message += gpsFailureCycles >= 2 ? "2 or more consecutive monthly attempts" : "the previous monthly attempt";
    }
    return message;
}
