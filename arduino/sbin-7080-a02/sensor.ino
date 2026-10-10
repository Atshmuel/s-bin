#include "globals.h"

namespace {
constexpr uint32_t SENSOR_RESPONSE_TIMEOUT_MS = 350;
constexpr uint8_t SENSOR_FRAME_SIZE = 4;
constexpr uint8_t SENSOR_FRAME_HEADER = 0xFF;
}

void initializeSensor() {
    SerialSensor.begin(9600, SERIAL_8N1, SENSOR_RXD_PIN, SENSOR_TXD_PIN);
    Serial.println("✅ Sensor Serial Ready.");
}

int getDistanceMm() {
    while (SerialSensor.available() > 0) {
        SerialSensor.read();
    }

    SerialSensor.write(SENSOR_FRAME_HEADER);

    uint8_t sensorBuffer[SENSOR_FRAME_SIZE] = {};
    uint8_t frameLength = 0;
    const uint32_t startedAt = millis();
    while (millis() - startedAt < SENSOR_RESPONSE_TIMEOUT_MS) {
        if (SerialSensor.available() == 0) {
            delay(1);
            continue;
        }

        const int incoming = SerialSensor.read();
        if (incoming < 0) {
            continue;
        }
        const uint8_t value = static_cast<uint8_t>(incoming);
        if (frameLength == 0) {
            if (value == SENSOR_FRAME_HEADER) {
                sensorBuffer[frameLength++] = value;
            }
            continue;
        }

        sensorBuffer[frameLength++] = value;
        if (frameLength < SENSOR_FRAME_SIZE) {
            continue;
        }

        const uint8_t checksum =
            (sensorBuffer[0] + sensorBuffer[1] + sensorBuffer[2]) & 0xFF;
        if (checksum == sensorBuffer[3]) {
            return (sensorBuffer[1] << 8) | sensorBuffer[2];
        }

        frameLength = 0;
        for (uint8_t i = 1; i < SENSOR_FRAME_SIZE; i++) {
            if (sensorBuffer[i] == SENSOR_FRAME_HEADER) {
                frameLength = SENSOR_FRAME_SIZE - i;
                memmove(sensorBuffer, sensorBuffer + i, frameLength);
                break;
            }
        }
    }

    return -1;
}
