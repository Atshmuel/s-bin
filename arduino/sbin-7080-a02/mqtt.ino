#include "globals.h"

namespace {
constexpr char MQTT_SERVER[] = "broker.hivemq.com";
constexpr uint16_t MQTT_PORT = 1883;
constexpr uint16_t MQTT_BUFFER_SIZE = 512;
constexpr unsigned long MQTT_RETRY_INTERVAL_MS = 5000;
constexpr unsigned long REGISTRATION_INTERVAL_MS = 30000;

String registrationTopic = "bins/register";
String acknowledgementTopic;
String commandTopic;
String instructionCheckTopic;
String logTopic;
unsigned long lastMqttAttemptAt = 0;
unsigned long lastRegistrationAt = 0;
}

void setupMqtt() {
    acknowledgementTopic = "bins/ack/" + DeviceMac;
    commandTopic = "bins/command/" + DeviceMac;
    instructionCheckTopic = "bins/" + DeviceMac + "/update/instructions";
    logTopic = "bins/" + DeviceMac + "/update/log";

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

void requestInstructionCheck(unsigned long timeoutMs) {
    if (!mqttClient.connected() || deviceKey.length() == 0) {
        Serial.println("⚠️ Cannot check for server instructions; using the sleep fallback.");
        return;
    }

    StaticJsonDocument<128> doc;
    doc["deviceKey"] = deviceKey;
    char payload[160];
    size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 ||
        !mqttClient.publish(instructionCheckTopic.c_str(), payload, false)) {
        Serial.println("⚠️ Could not request server instructions; using the sleep fallback.");
        return;
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
        return;
    }
    if (!instructionCheckAllowsSleep) {
        Serial.println("⚠️ Server reported pending instructions, but instruction handling is not implemented; using the sleep fallback.");
        return;
    }

    Serial.println("✅ Server confirmed there are no pending instructions; returning to sleep.");
}

bool publishTelemetry(int distanceMm, int batteryPercent, const String& health, const String& healthMessage) {
    if (!mqttClient.connected() || !hasGpsFix || deviceKey.length() == 0) {
        return false;
    }

    int level = calculateFillLevel(distanceMm);
    bool sensorOk = level >= 0;

    StaticJsonDocument<384> doc;
    doc["deviceKey"] = deviceKey;
    doc["sensorOk"] = sensorOk;
    if (sensorOk) {
        doc["level"] = level;
    }
    doc["battery"] = batteryPercent;
    doc["health"] = health;
    doc["weight"] = 0;
    doc["location"][0] = latitude;
    doc["location"][1] = longitude;
    if (healthMessage.length() > 0) {
        doc["message"] = healthMessage;
    }

    char payload[384];
    size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0) {
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

    StaticJsonDocument<256> doc;
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
        if (doc["status"] == "instruction_check" &&
            doc["canSleep"].is<bool>()) {
            instructionCheckAllowsSleep = doc["canSleep"].as<bool>();
            instructionCheckCounter++;
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
