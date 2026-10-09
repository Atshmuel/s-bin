#include "globals.h"

void initializeSensor() {
    SerialSensor.begin(9600, SERIAL_8N1, SENSOR_RXD_PIN, SENSOR_TXD_PIN);
    Serial.println("✅ Sensor Serial Ready.");
}

int getDistanceMm() {
    unsigned char sensorBuffer[4];

    while (SerialSensor.available() > 0) {
        SerialSensor.read();
    }

    SerialSensor.write(0xFF);
    delay(100);

    if (SerialSensor.available() >= 4) {
        if (SerialSensor.read() == 0xFF) {
            sensorBuffer[0] = 0xFF;
            sensorBuffer[1] = SerialSensor.read();
            sensorBuffer[2] = SerialSensor.read();
            sensorBuffer[3] = SerialSensor.read();

            byte sum = (sensorBuffer[0] + sensorBuffer[1] + sensorBuffer[2]) & 0xFF;
            if (sum == sensorBuffer[3]) {
                return (sensorBuffer[1] << 8) + sensorBuffer[2];
            }
        }
    }

    return -1;
}
