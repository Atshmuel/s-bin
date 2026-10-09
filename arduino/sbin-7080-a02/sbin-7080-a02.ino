#include "globals.h"

void setup() {
    Serial.begin(115200);
uint32_t serialStart = millis();
    while (!Serial && (millis() - serialStart < 4000)) {
        delay(10);
    }
    delay(500); // השהיית ייצוב קצרה

    Serial.println("\n=================================");
    Serial.println("  S-Bin SIM7080 A02 Firmware     ");
    Serial.println("=================================");
    Serial.printf("USB Serial monitor: %s\n", Serial ? "connected" : "not connected");

    initializePowerManagement();

    initializeSensor();
    DeviceMac = getChipMac();
    loadDeviceSettings();

    if (ownerId.length() == 0) {
        while (!startConfigurationPortal()) {
            Serial.println("Retrying configuration access point in 5 seconds.");
            delay(5000);
        }
        return;
    }

    if (!initializeModem()) {
        while (1) {
            Serial.println("60 seconds to initializeModem.");
            delay(60000);
            ESP.restart();
        }
    }

    if (!synchronizeClockFromNetwork()) {
        while (!isSystemClockValid()) {
            Serial.println("⏳ Waiting for valid network time before scheduling reports.");
            synchronizeClockFromNetwork();
            delay(10000);
        }
    }

    if (binDepthMm <= 0) {
        while (!calibrateBinDepth()) {
            Serial.println("⚠️ Calibration failed; retrying in 5 seconds.");
            delay(5000);
        }
    }

    gpsAttemptDue = shouldRefreshGpsLocation();
    if (gpsAttemptDue) {
        Serial.println("🛰️ Monthly GPS refresh is due.");
        recordGpsAttempt();
        if (startGpsAcquisition()) {
            gpsAcquisitionStartedAt = millis();
        } else {
            Serial.println("❌ Could not start monthly GPS refresh.");
        }
    } else {
        Serial.println("📍 Using the saved location; GPS refresh is not due.");
    }

    setupMqtt();
}

void loop() {
    if (configurationPortalActive) {
        handleConfigurationPortal();
        return;
    }

    if (gpsModeActive) {
        bool fixAcquired = updateGpsLocation();
        if (fixAcquired) {
            Serial.printf("✅ GPS fix saved: %.6f, %.6f\n", latitude, longitude);
            if (!stopGpsAcquisition()) {
                Serial.println("❌ Could not disable GNSS; cellular data remains off.");
            }
        } else if (millis() - gpsAcquisitionStartedAt >= 300000UL) {
            Serial.println("⚠️ GPS refresh timed out after 5 minutes.");
            if (!stopGpsAcquisition()) {
                Serial.println("❌ Could not disable GNSS after timeout.");
            }
        } else {
            Serial.println("⏳ Waiting for the monthly GPS fix.");
            delay(5000);
            return;
        }

    }

    int distanceMm = getDistanceMm();
    bool sensorOk = distanceMm > 0 && calculateFillLevel(distanceMm) >= 0;
    if (!sensorOk) {
        Serial.println("⚠️ Sensor Read Error; fill level will be reported as unavailable.");
    }

    uint16_t batteryMillivolts = readBatteryMillivolts();
    bool pmuOk = pmuAvailable && batteryMillivolts > 0;
    int batteryPercent = readBatteryPercent();
    String health = updateDeviceHealth(
        sensorOk,
        pmuOk,
        gpsAttemptDue,
        !gpsAttemptDue || gpsFixUpdatedThisCycle
    );
    String healthMessage = getDeviceHealthMessage(distanceMm);

    Serial.printf(
        "Health: %s; battery: %u mV (%d%%), distance: %d mm\n",
        health.c_str(),
        batteryMillivolts,
        batteryPercent,
        distanceMm
    );
    if (hasGpsFix) {
        Serial.printf("GPS: %.6f, %.6f\n", latitude, longitude);
    } else {
        Serial.println("⚠️ No saved GPS location is available yet.");
    }

    constexpr unsigned long MAX_REPORT_WINDOW_MS = 120000UL;
    unsigned long reportStartedAt = millis();
    bool cellularReady = false;
    while (millis() - reportStartedAt < MAX_REPORT_WINDOW_MS) {
        if (maintainCellularConnection()) {
            cellularReady = true;
            break;
        }
        delay(1000);
    }

    bool mqttReady = false;
    if (cellularReady) {
        while (millis() - reportStartedAt < MAX_REPORT_WINDOW_MS) {
            maintainMqttConnection();
            mqttClient.loop();
            if (mqttClient.connected()) {
                mqttReady = true;
                break;
            }
            delay(250);
        }
    }

    bool reportSent = false;
    if (mqttReady && hasGpsFix) {
        if (deviceKey.length() > 0) {
            uint32_t previousAckCount = scheduleAckCounter;
            reportSent = publishTelemetry(distanceMm, batteryPercent, health, healthMessage);
            if (reportSent) {
                unsigned long ackWaitStartedAt = millis();
                while (scheduleAckCounter == previousAckCount &&
                       millis() - ackWaitStartedAt < 15000UL) {
                    mqttClient.loop();
                    delay(100);
                }
            }
        } else {
            while (millis() - reportStartedAt < MAX_REPORT_WINDOW_MS) {
                mqttClient.loop();
                if (deviceKey.length() > 0) {
                    uint32_t previousAckCount = scheduleAckCounter;
                    reportSent = publishTelemetry(distanceMm, batteryPercent, health, healthMessage);
                    if (reportSent) {
                        unsigned long ackWaitStartedAt = millis();
                        while (scheduleAckCounter == previousAckCount &&
                               millis() - ackWaitStartedAt < 15000UL) {
                            mqttClient.loop();
                            delay(100);
                        }
                    }
                    break;
                }
                publishRegistration(batteryPercent);
                mqttClient.loop();
                delay(250);
            }
        }
    } else if (!hasGpsFix) {
        Serial.println("❌ Cannot register/report until the first GPS location is acquired.");
    }

    Serial.println(reportSent ? "✅ Reporting cycle completed." : "⚠️ Reporting cycle ended without a telemetry report.");
    constexpr unsigned long INSTRUCTION_CHECK_TIMEOUT_MS = 10000UL;
    if (deviceKey.length() > 0) {
        requestInstructionCheck(INSTRUCTION_CHECK_TIMEOUT_MS);
    }
    enterDeepSleepUntilNextReport();
}
