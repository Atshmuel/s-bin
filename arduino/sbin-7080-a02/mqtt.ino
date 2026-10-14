#include "globals.h"

namespace {
constexpr char MQTT_SERVER[] = "broker.hivemq.com";
constexpr uint16_t MQTT_PORT = 1883;
constexpr uint16_t MQTT_BUFFER_SIZE = 1024;
constexpr unsigned long MQTT_RETRY_INTERVAL_MS = 5000;
constexpr unsigned long REGISTRATION_INTERVAL_MS = 30000;
// A report period outside this range is not a plausible schedule.
constexpr uint64_t MIN_SLOT_PERIOD_SECONDS = 60;
constexpr uint64_t MAX_SLOT_PERIOD_SECONDS = 24ULL * 60ULL * 60ULL;

String registrationTopic = "bins/register";
String acknowledgementTopic;
String commandTopic;
String instructionCheckTopic;
String logTopic;
String relayTopic;
unsigned long lastMqttAttemptAt = 0;
unsigned long lastRegistrationAt = 0;

// The relay upload currently waiting for the server's relay_result.
String waitingRelayLeafMac;
uint32_t waitingRelayMessageId = 0;
uint32_t relayResultCounter = 0;
bool relayResultAccepted = false;
}

void setupMqtt() {
    acknowledgementTopic = "bins/ack/" + DeviceMac;
    commandTopic = "bins/command/" + DeviceMac;
    instructionCheckTopic = "bins/" + DeviceMac + "/update/instructions";
    logTopic = "bins/" + DeviceMac + "/update/log";
    relayTopic = "bins/" + DeviceMac + "/update/relay";

    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);
    mqttClient.setKeepAlive(60);
    mqttClient.setSocketTimeout(15);
    if (!mqttClient.setBufferSize(MQTT_BUFFER_SIZE)) {
        Serial.println("❌ Failed to allocate the MQTT packet buffer.");
    }
}

void maintainMqttConnection() {
    if (mqttClient.connected()) {
        return;
    }
    if (millis() - lastMqttAttemptAt < MQTT_RETRY_INTERVAL_MS) {
        return;
    }

    lastMqttAttemptAt = millis();
    String clientId = "BinClient-" + DeviceMac;
    Serial.print("Connecting to MQTT...");

    if (!mqttClient.connect(clientId.c_str())) {
        Serial.print(" failed, state=");
        Serial.println(mqttClient.state());
        return;
    }

    Serial.println(" connected.");
    if (!mqttClient.subscribe(acknowledgementTopic.c_str())) {
        Serial.println("❌ Failed to subscribe to device acknowledgements.");
    }
    if (!mqttClient.subscribe(commandTopic.c_str())) {
        Serial.println("❌ Failed to subscribe to device commands.");
    }
}

void publishRegistration(int batteryPercent) {
    if (!mqttClient.connected() || !hasGpsFix || ownerId.length() == 0) {
        return;
    }
    if (lastRegistrationAt != 0 &&
        millis() - lastRegistrationAt < REGISTRATION_INTERVAL_MS) {
        return;
    }

    StaticJsonDocument<256> doc;
    doc["mac"] = DeviceMac;
    doc["orgId"] = ownerId;
    doc["battery"] = batteryPercent;
    doc["location"][0] = latitude;
    doc["location"][1] = longitude;

    char payload[256];
    size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || !mqttClient.publish(registrationTopic.c_str(), payload)) {
        Serial.println("❌ Failed to publish registration.");
        return;
    }

    lastRegistrationAt = millis();
    Serial.println("Registration published: " + String(payload));
}

bool requestInstructionCheck(unsigned long timeoutMs) {
    if (!mqttClient.connected() || deviceKey.length() == 0) {
        Serial.println("⚠️ Cannot check for server instructions; using the sleep fallback.");
        return false;
    }

    StaticJsonDocument<128> doc;
    doc["deviceKey"] = deviceKey;
    char payload[160];
    size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 ||
        !mqttClient.publish(instructionCheckTopic.c_str(), payload, false)) {
        Serial.println("⚠️ Could not request server instructions; using the sleep fallback.");
        return false;
    }

    const uint32_t previousCheckCount = instructionCheckCounter;
    instructionCheckAllowsSleep = false;
    Serial.printf("Checking for server instructions (up to %lu seconds)...\n", timeoutMs / 1000);

    unsigned long waitStartedAt = millis();
    while (instructionCheckCounter == previousCheckCount &&
           millis() - waitStartedAt < timeoutMs) {
        mqttClient.loop();
        delay(50);
    }

    if (instructionCheckCounter == previousCheckCount) {
        Serial.println("⚠️ No instruction response before timeout; returning to sleep.");
        return false;
    }
    if (!instructionResponseValid) {
        Serial.println("⚠️ Server instruction response was invalid; using the sleep fallback.");
        return false;
    }

    return true;
}

bool publishInstructionResult(
    const String& instructionId,
    const String& status,
    const String& result
) {
    if (!mqttClient.connected() || deviceKey.length() == 0) {
        Serial.println("⚠️ Cannot report instruction result; instruction will be retried.");
        return false;
    }

    StaticJsonDocument<320> doc;
    doc["deviceKey"] = deviceKey;
    doc["instructionId"] = instructionId;
    doc["status"] = status;
    doc["result"] = result;

    char payload[384];
    size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || !mqttClient.publish(
            ("bins/" + DeviceMac + "/update/instruction-result").c_str(),
            payload,
            false)) {
        Serial.println("⚠️ Failed to publish instruction result; instruction will be retried.");
        return false;
    }

    waitingInstructionResultId = instructionId;
    const uint32_t previousAckCount = instructionResultAckCounter;
    unsigned long waitStartedAt = millis();
    while (instructionResultAckCounter == previousAckCount &&
           millis() - waitStartedAt < 2000UL) {
        mqttClient.loop();
        delay(50);
    }
    waitingInstructionResultId = "";

    if (instructionResultAckCounter == previousAckCount) {
        Serial.println("⚠️ No server confirmation for instruction result; it will be retried.");
        return false;
    }
    return true;
}

// Uploads one leaf reading on this gateway's relay topic and waits for the
// server's relay_result. The server vouches for the leaf through this
// gateway's device key and creates the leaf bin in this organization.
RelayUploadResult publishRelayRecord(const RelayRecord& record, unsigned long timeoutMs) {
    if (!mqttClient.connected() || deviceKey.length() == 0) {
        return RELAY_NO_REPLY;
    }

    const sbinmesh::DataPacket& data = record.data;
    char leafMac[18];
    sbinmesh::formatMac(data.header.origin, leafMac);
    const bool sensorOk = (data.flags & sbinmesh::DATA_SENSOR_OK) != 0;

    StaticJsonDocument<768> doc;
    doc["deviceKey"] = deviceKey;
    doc["leafMac"] = leafMac;
    doc["messageId"] = data.header.messageId;
    doc["hops"] = record.hops;
    doc["rssi"] = record.rssi;
    JsonObject reading = doc["record"].to<JsonObject>();
    reading["health"] = healthFromFailureCounts(
        data.sensorFailureCycles, data.pmuFailureCycles, data.gpsFailureCycles);
    reading["sensorOk"] = sensorOk;
    if (sensorOk) {
        reading["level"] = data.level;
    }
    reading["battery"] = data.battery;
    reading["weight"] = 0;
    if (data.flags & sbinmesh::DATA_HAS_LOCATION) {
        reading["location"][0] = data.latitude;
        reading["location"][1] = data.longitude;
    }
    const String message = buildHealthMessage(
        data.sensorFailureCycles, data.pmuFailureCycles, data.gpsFailureCycles,
        (data.flags & sbinmesh::DATA_CALIBRATION_FAILED) != 0, data.distanceMm);
    if (message.length() > 0) {
        reading["message"] = message;
    }
    if (data.lastAwakeSeconds > 0) {
        reading["lastAwakeSeconds"] = data.lastAwakeSeconds;
    }
    if (data.driftPpm != 0) {
        reading["driftPpm"] = data.driftPpm;
    }
    if (data.meshAwakeWindowSeconds >= 1 &&
        data.meshAwakeWindowSeconds <= MAX_MESH_AWAKE_WINDOW_SECONDS) {
        reading["meshAwakeWindowSeconds"] = data.meshAwakeWindowSeconds;
    }

    char payload[768];
    const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload) ||
        !mqttClient.publish(relayTopic.c_str(), payload)) {
        Serial.printf("❌ Could not publish the relayed reading of %s.\n", leafMac);
        return RELAY_NO_REPLY;
    }

    waitingRelayLeafMac = leafMac;
    waitingRelayMessageId = data.header.messageId;
    const uint32_t previousResultCount = relayResultCounter;
    const unsigned long waitStartedAt = millis();
    while (relayResultCounter == previousResultCount && millis() - waitStartedAt < timeoutMs) {
        mqttClient.loop();
        delay(50);
    }
    waitingRelayLeafMac = "";
    if (relayResultCounter == previousResultCount) {
        return RELAY_NO_REPLY;
    }
    Serial.printf("%s Relayed reading %08lX of %s.\n",
                  relayResultAccepted ? "✅ Server stored" : "⚠️ Server rejected",
                  static_cast<unsigned long>(data.header.messageId), leafMac);
    return relayResultAccepted ? RELAY_ACCEPTED : RELAY_REJECTED;
}

bool publishTelemetry(int distanceMm, int batteryPercent, const String& health, const String& healthMessage) {
    if (!mqttClient.connected() || !hasGpsFix || deviceKey.length() == 0) {
        return false;
    }

    int level = calculateFillLevel(distanceMm);
    bool sensorOk = level >= 0;

    StaticJsonDocument<768> doc;
    doc["deviceKey"] = deviceKey;
    doc["sensorOk"] = sensorOk;
    if (sensorOk) {
        doc["level"] = level;
    }
    doc["battery"] = batteryPercent;
    if (scheduledSleepDurationSeconds > 0) {
        doc["sleepDurationSeconds"] = scheduledSleepDurationSeconds;
    }
    doc["meshAwakeWindowSeconds"] = meshAwakeWindowSeconds;
    if (lastAwakeSeconds > 0) {
        doc["lastAwakeSeconds"] = lastAwakeSeconds;
    }
    if (driftMeasured) {
        doc["driftPpm"] = driftPpm;
    }
    if (hasClockError) {
        doc["clockErrorSeconds"] = clockErrorSeconds;
    }
    if (hasWakeOffset) {
        doc["wakeOffsetSeconds"] = wakeOffsetSeconds;
    }
    doc["health"] = health;
    doc["weight"] = 0;
    doc["location"][0] = latitude;
    doc["location"][1] = longitude;
    if (healthMessage.length() > 0) {
        doc["message"] = healthMessage;
    }

    char payload[768];
    size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload) - 1) {
        Serial.println("❌ Failed to serialize telemetry.");
        return false;
    }
    if (payloadLength + strlen(logTopic.c_str()) + 7 > mqttClient.getBufferSize()) {
        Serial.printf(
            "❌ Telemetry packet too large: payload=%u bytes, MQTT buffer=%u bytes.\n",
            static_cast<unsigned>(payloadLength),
            mqttClient.getBufferSize()
        );
        return false;
    }
    if (!mqttClient.publish(logTopic.c_str(), payload)) {
        Serial.println("❌ MQTT client rejected telemetry publish.");
        return false;
    }

    Serial.println("Telemetry published: " + String(payload));
    return true;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String message;
    message.reserve(length);
    for (unsigned int i = 0; i < length; i++) {
        message += static_cast<char>(payload[i]);
    }

    StaticJsonDocument<1536> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) {
        Serial.print("❌ Invalid MQTT message: ");
        Serial.println(error.c_str());
        return;
    }

    String receivedTopic(topic);
    if (receivedTopic == acknowledgementTopic) {
        if (doc["deviceKey"].is<const char*>()) {
            deviceKey = doc["deviceKey"].as<String>();
            if (deviceKey.length() > 0) {
                saveDeviceKey(deviceKey);
                Serial.println("✅ Device key received and saved.");
            }
        }

        if (doc["nextWakeEpoch"].is<uint64_t>()) {
            uint64_t serverNextWakeEpoch = doc["nextWakeEpoch"].as<uint64_t>();
            if (serverNextWakeEpoch > static_cast<uint64_t>(time(nullptr))) {
                nextWakeEpoch = serverNextWakeEpoch;
                preferences.begin("credentials", false);
                preferences.putULong64("nextWake", nextWakeEpoch);
                preferences.end();
                scheduleAckCounter++;
                Serial.printf(
                    "✅ Next report scheduled at UTC epoch %llu.\n",
                    static_cast<unsigned long long>(nextWakeEpoch)
                );
            } else {
                Serial.println("⚠️ Server sent an invalid or expired nextWakeEpoch.");
            }
        }
        if (doc["followingWakeEpoch"].is<uint64_t>()) {
            uint64_t serverFollowingWakeEpoch = doc["followingWakeEpoch"].as<uint64_t>();
            if (serverFollowingWakeEpoch > nextWakeEpoch) {
                followingWakeEpoch = serverFollowingWakeEpoch;
                // Remember the report period so the next beacons can continue
                // the slot pattern even after a cycle without a server reply.
                const uint64_t period = followingWakeEpoch - nextWakeEpoch;
                if (doc["nextWakeEpoch"].as<uint64_t>() == nextWakeEpoch &&
                    period >= MIN_SLOT_PERIOD_SECONDS && period <= MAX_SLOT_PERIOD_SECONDS &&
                    period != slotPeriodSeconds) {
                    slotPeriodSeconds = static_cast<uint32_t>(period);
                    preferences.begin("credentials", false);
                    preferences.putUInt("slotPeriod", slotPeriodSeconds);
                    preferences.end();
                }
            } else {
                Serial.println("⚠️ Server sent a followingWakeEpoch that is not after nextWakeEpoch.");
            }
        }
        if (doc["sleepDurationSeconds"].is<uint32_t>()) {
            scheduledSleepDurationSeconds = doc["sleepDurationSeconds"].as<uint32_t>();
            preferences.begin("credentials", false);
            preferences.putUInt("sleepDuration", scheduledSleepDurationSeconds);
            preferences.end();
        }
        if (doc["meshAwakeWindowSeconds"].is<uint32_t>()) {
            uint32_t serverMeshAwakeWindowSeconds = doc["meshAwakeWindowSeconds"].as<uint32_t>();
            if (serverMeshAwakeWindowSeconds == 0 ||
                serverMeshAwakeWindowSeconds > MAX_MESH_AWAKE_WINDOW_SECONDS) {
                Serial.println("⚠️ Server sent an invalid meshAwakeWindowSeconds.");
            } else if (serverMeshAwakeWindowSeconds != meshAwakeWindowSeconds) {
                meshAwakeWindowSeconds = serverMeshAwakeWindowSeconds;
                preferences.begin("credentials", false);
                preferences.putUInt("meshAwake", meshAwakeWindowSeconds);
                preferences.end();
                Serial.printf(
                    "📡 Mesh awake window set to %lu seconds.\n",
                    static_cast<unsigned long>(meshAwakeWindowSeconds)
                );
            }
        }
        if (doc["status"] == "instruction_check" &&
            doc["canSleep"].is<bool>()) {
            instructionCheckAllowsSleep = doc["canSleep"].as<bool>();
            JsonArrayConst instructions = doc["instructions"].as<JsonArrayConst>();
            pendingInstructionCount = 0;
            instructionResponseValid = instructions.size() <= MAX_PENDING_INSTRUCTIONS;
            for (JsonObjectConst instruction : instructions) {
                if (pendingInstructionCount >= MAX_PENDING_INSTRUCTIONS ||
                    !instruction["id"].is<const char*>() ||
                    !instruction["type"].is<const char*>()) {
                    instructionResponseValid = false;
                    break;
                }
                pendingInstructions[pendingInstructionCount].id = instruction["id"].as<String>();
                pendingInstructions[pendingInstructionCount].type = instruction["type"].as<String>();
                JsonVariantConst durationSeconds = instruction["payload"]["durationSeconds"];
                pendingInstructions[pendingInstructionCount].durationSeconds =
                    durationSeconds.is<uint32_t>() ? durationSeconds.as<uint32_t>() : 0;
                if (pendingInstructions[pendingInstructionCount].id.length() == 0 ||
                    pendingInstructions[pendingInstructionCount].type.length() == 0) {
                    instructionResponseValid = false;
                    break;
                }
                pendingInstructionCount++;
            }
            instructionResponseValid =
                instructionResponseValid &&
                instructionCheckAllowsSleep == (pendingInstructionCount == 0);
            instructionCheckCounter++;
            if (pendingInstructionCount > 0) {
                Serial.printf(
                    "📥 Server returned %u pending instruction(s).\n",
                    pendingInstructionCount
                );
            }
        }
        if (doc["status"] == "instruction_result" &&
            doc["accepted"] == true &&
            doc["instructionId"].is<const char*>() &&
            waitingInstructionResultId == doc["instructionId"].as<String>()) {
            instructionResultAckCounter++;
        }
        if (doc["status"] == "relay_result" &&
            doc["leafMac"].is<const char*>() &&
            doc["messageId"].is<uint32_t>() &&
            doc["messageId"].as<uint32_t>() == waitingRelayMessageId &&
            waitingRelayLeafMac.equalsIgnoreCase(doc["leafMac"].as<const char*>())) {
            relayResultAccepted = doc["accepted"] == true;
            if (!relayResultAccepted && doc["reason"].is<const char*>()) {
                Serial.printf("⚠️ Relay rejected by the server: %s.\n",
                              doc["reason"].as<const char*>());
            }
            relayResultCounter++;
        }
        return;
    }

    if (receivedTopic == commandTopic && doc["command"] == "reset") {
        Serial.println("Reset command received; clearing device settings.");
        clearDeviceSettings();
        delay(1000);
        ESP.restart();
    }
}
