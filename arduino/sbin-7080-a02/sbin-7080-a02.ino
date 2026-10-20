#include "globals.h"

void setup() {
    Serial.begin(115200);
    const bool pmuReady = initializePowerManagement();
    // Only on USB power: a board on battery has no monitor to wait for. Also
    // after a power-on, whose first lines (why the PMU cut power) matter most.
    if (pmuReady && PMU.isVbusIn()) {
        const uint32_t waitStartedAt = millis();
        while (!Serial && millis() - waitStartedAt < USB_LOG_RECONNECT_WAIT_MS) {
            delay(10);
        }
    }

    Serial.println("\n=================================");
    Serial.println("  S-Bin SIM7080 A02 Firmware     ");
    Serial.println("=================================");
    Serial.printf("USB Serial monitor: %s\n", Serial ? "connected" : "not connected");
    Serial.println(pmuReady ? "✅ AXP2101 PMU Ready." : "❌ AXP2101 PMU initialization failed.");
    if (pmuReady) {
        readPmuPowerSources();
        Serial.println(pmuPowerSources);
    }

    initializeSensor();
    initializeScale();
    DeviceMac = getChipMac();
    loadDeviceSettings();

    if (ownerId.length() == 0) {
        while (!startConfigurationPortal()) {
            Serial.println("Retrying configuration access point in 5 seconds.");
            delay(5000);
        }
        return;
    }

    constexpr uint32_t MODEM_RETRY_SLEEP_SECONDS = 15UL * 60UL;
    if (!initializeModem()) {
        cutModemPower();
        enterDeepSleepForSetupRetry(MODEM_RETRY_SLEEP_SECONDS, "Modem initialization failed");
    }

    // Long enough for a cold cellular attach; the modem is powered off between retries.
    constexpr unsigned long CLOCK_SYNC_TIMEOUT_MS = 120000UL;
    constexpr uint32_t CLOCK_RETRY_SLEEP_SECONDS = 300;
    // On the network but without its time (the modem lost power and the network
    // has not sent the time yet), the report still goes out: the server's reply
    // sets the clock.
    if (!synchronizeClockFromNetwork(CLOCK_SYNC_TIMEOUT_MS) && !modem.isNetworkConnected()) {
        enterDeepSleepForSetupRetry(CLOCK_RETRY_SLEEP_SECONDS, "No valid network time");
    }

    // The slot sleep ended a few minutes early on purpose; wait for the slot
    // itself, so the window opens on it rather than wherever the drifting
    // sleep clock woke this gateway.
    waitForSlotStart();

    // Open the mesh window only now: leaves set their clocks from the beacons,
    // and after a deep sleep this gateway's clock is off by about the whole
    // sleep-clock drift until it is corrected from the network. The report
    // runs in parallel with the window.
    beginMeshWindow();

    // A failed calibration does not block reporting: the cycle reports
    // sensorOk=false with a calibration health message, and the next wake retries.
    constexpr uint8_t CALIBRATION_ATTEMPTS = 2;
    for (uint8_t attempt = 1; binDepthMm <= 0 && attempt <= CALIBRATION_ATTEMPTS; attempt++) {
        if (!calibrateBinDepth()) {
            Serial.printf("⚠️ Calibration attempt %u of %u failed.\n", attempt, CALIBRATION_ATTEMPTS);
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

    const DeviceReading reading = takeReading(gpsAttemptDue, !gpsAttemptDue || gpsFixUpdatedThisCycle, true);
    Serial.printf(
        "Health: %s; battery: %u mV (%d%%), distance: %d mm\n",
        reading.health.c_str(),
        reading.batteryMillivolts,
        reading.batteryPercent,
        reading.distanceMm
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
        // A new device registers first; the server's reply carries its device key.
        while (deviceKey.length() == 0 && millis() - reportStartedAt < MAX_REPORT_WINDOW_MS) {
            publishRegistration(reading.batteryPercent);
            serviceMqttFor(250);
        }
        if (deviceKey.length() > 0) {
            const uint32_t previousAckCount = scheduleAckCounter;
            reportSent = publishTelemetry(reading);
            if (reportSent) {
                waitForMqttReply(scheduleAckCounter, previousAckCount, 15000UL);
            }
        }
    } else if (!hasGpsFix) {
        Serial.println("❌ Cannot register/report until the first GPS location is acquired.");
    }

    Serial.println(reportSent ? "✅ Reporting cycle completed." : "⚠️ Reporting cycle ended without a telemetry report.");
    // Again mid-cycle: the boot and pre-sleep lines often miss a monitor.
    if (pmuPowerSources.length() > 0) {
        Serial.println(pmuPowerSources);
    }
    if (mqttReady) {
        uploadRelayedReadings();
    }
    constexpr unsigned long INSTRUCTION_CHECK_TIMEOUT_MS = 5000UL;
    if (deviceKey.length() > 0) {
        processPendingInstructions(INSTRUCTION_CHECK_TIMEOUT_MS);
    }
    endMeshWindow();
    enterDeepSleepUntilNextReport();
}
