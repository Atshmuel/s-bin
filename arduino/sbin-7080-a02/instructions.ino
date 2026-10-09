#include "globals.h"

namespace {
bool loadCachedInstructionResult(
    const String& instructionId,
    String& status,
    String& result
) {
    preferences.begin("instCache", true);
    bool found = false;
    for (uint8_t slot = 0; slot < MAX_PENDING_INSTRUCTIONS; slot++) {
        String suffix(slot);
        if (preferences.getString(("id" + suffix).c_str()) == instructionId) {
            status = preferences.getString(("status" + suffix).c_str());
            result = preferences.getString(("result" + suffix).c_str());
            found = status.length() > 0;
            break;
        }
    }
    preferences.end();
    return found;
}

void saveCachedInstructionResult(
    const String& instructionId,
    const String& status,
    const String& result
) {
    preferences.begin("instCache", false);
    uint8_t slot = preferences.getUChar("next", 0) % MAX_PENDING_INSTRUCTIONS;
    String suffix(slot);
    preferences.putString(("id" + suffix).c_str(), instructionId);
    preferences.putString(("status" + suffix).c_str(), status);
    preferences.putString(("result" + suffix).c_str(), result);
    preferences.putUChar("next", (slot + 1) % MAX_PENDING_INSTRUCTIONS);
    preferences.end();
}

uint32_t processInstruction(const DeviceInstruction& instruction) {
    String status;
    String result;
    uint32_t awakeExtensionSeconds = 0;
    if (loadCachedInstructionResult(instruction.id, status, result)) {
        Serial.printf("↩️ Re-sending saved result for instruction %s.\n", instruction.id.c_str());
    } else if (instruction.type == "report_now") {
        Serial.printf("📊 Executing report_now instruction %s.\n", instruction.id.c_str());
        int distanceMm = getDistanceMm();
        bool sensorOk = distanceMm > 0 && calculateFillLevel(distanceMm) >= 0;
        uint16_t batteryMillivolts = readBatteryMillivolts();
        bool pmuOk = pmuAvailable && batteryMillivolts > 0;
        int batteryPercent = readBatteryPercent();
        String health = updateDeviceHealth(sensorOk, pmuOk, false, true);
        String healthMessage = getDeviceHealthMessage(distanceMm);

        if (!sensorOk) {
            Serial.println("⚠️ A02 reading failed during requested report.");
        }
        if (publishTelemetry(distanceMm, batteryPercent, health, healthMessage)) {
            status = "completed";
            result = "additional_report_published";
        } else {
            status = "failed";
            result = "additional_report_publish_failed";
        }
        saveCachedInstructionResult(instruction.id, status, result);
    } else if (instruction.type == "stay_awake") {
        if (instruction.durationSeconds == 0 ||
            instruction.durationSeconds > MAX_AWAKE_EXTENSION_SECONDS) {
            status = "failed";
            result = "invalid_awake_extension_duration";
        } else {
            status = "completed";
            awakeExtensionSeconds = instruction.durationSeconds;
            result = "awake_window_extended";
            Serial.printf(
                "⏱️ Staying awake for an additional %lu seconds.\n",
                static_cast<unsigned long>(awakeExtensionSeconds)
            );
        }
        saveCachedInstructionResult(instruction.id, status, result);
    } else {
        Serial.printf("⚠️ Unsupported instruction type: %s.\n", instruction.type.c_str());
        status = "failed";
        result = "unsupported_instruction_type";
        saveCachedInstructionResult(instruction.id, status, result);
    }

    if (!publishInstructionResult(instruction.id, status, result)) {
        Serial.printf("⚠️ Instruction %s remains pending on the server until its result is received.\n",
                      instruction.id.c_str());
    }
    return awakeExtensionSeconds;
}
}

void processPendingInstructions(unsigned long timeoutMs) {
    unsigned long deadline = millis() + timeoutMs;
    bool extendedAwakeWindow = false;
    while (static_cast<long>(deadline - millis()) > 0) {
        const unsigned long remaining = deadline - millis();
        const unsigned long checkTimeoutMs = extendedAwakeWindow
            ? min(remaining, 5000UL)
            : remaining;
        if (!requestInstructionCheck(checkTimeoutMs)) {
            if (!extendedAwakeWindow) {
                return;
            }

            maintainCellularConnection();
            maintainMqttConnection();
            const unsigned long retryWaitMs = min(deadline - millis(), 1000UL);
            const unsigned long waitStartedAt = millis();
            while (millis() - waitStartedAt < retryWaitMs) {
                mqttClient.loop();
                delay(50);
            }
            continue;
        }
        if (instructionCheckAllowsSleep) {
            if (!extendedAwakeWindow) {
                Serial.println("✅ No pending instructions; device may return to sleep.");
                return;
            }

            const unsigned long pollDelayMs = min(remaining, 5000UL);
            Serial.printf(
                "⏳ No pending instructions; checking again in %lu seconds.\n",
                pollDelayMs / 1000
            );
            const unsigned long waitStartedAt = millis();
            while (millis() - waitStartedAt < pollDelayMs) {
                mqttClient.loop();
                delay(50);
            }
            continue;
        }
        if (pendingInstructionCount == 0) {
            Serial.println("⚠️ Server response had no executable instruction; using the sleep fallback.");
            return;
        }

        for (uint8_t i = 0; i < pendingInstructionCount; i++) {
            if (static_cast<long>(deadline - millis()) <= 0) {
                Serial.println("⚠️ Instruction processing window expired; remaining instructions stay queued.");
                return;
            }
            const uint32_t extensionSeconds = processInstruction(pendingInstructions[i]);
            if (extensionSeconds > 0) {
                deadline = max(deadline, millis()) +
                           static_cast<unsigned long>(extensionSeconds) * 1000UL;
                extendedAwakeWindow = true;
            }
        }
    }
    Serial.println("⚠️ Instruction processing window expired; returning to sleep.");
}
