#include "globals.h"

bool initializeModem() {
    pinMode(BOARD_MODEM_DTR_PIN, OUTPUT);
    digitalWrite(BOARD_MODEM_DTR_PIN, LOW);

    SerialModem.begin(115200, SERIAL_8N1, BOARD_MODEM_RXD_PIN, BOARD_MODEM_TXD_PIN);
    delay(100);

    if (modem.testAT(1000)) {
        Serial.println("✅ Modem already responds to AT; skipping PWRKEY pulse.");
    } else {
        Serial.println("Modem is not responding to AT; powering it on.");
        pinMode(BOARD_MODEM_PWR_PIN, OUTPUT);
        digitalWrite(BOARD_MODEM_PWR_PIN, LOW);
        delay(100);
        digitalWrite(BOARD_MODEM_PWR_PIN, HIGH);
        delay(1000);
        digitalWrite(BOARD_MODEM_PWR_PIN, LOW);

        Serial.println("🚀 Booting SIM7080G...");
        unsigned long startedAt = millis();
        bool modemResponding = false;
        while (millis() - startedAt < 30000UL) {
            if (modem.testAT(500)) {
                modemResponding = true;
                break;
            }
            delay(500);
        }
        if (!modemResponding) {
            Serial.println("❌ No AT response after power-on. Check modem power, PWRKEY=41, and UART1 (RX=4, TX=5).");
            return false;
        }
    }

    if (!modem.init()) {
        if (!modem.testAT(1000)) {
            Serial.println("❌ Modem Init Failed: no AT response on UART1 (RX=4, TX=5).");
            Serial.println("Check modem power, PWRKEY=41, and UART wiring/pin selection.");
        } else {
            Serial.println("❌ Modem responds to AT, but TinyGSM initialization failed.");
            Serial.print("SIM status: ");
            Serial.println(static_cast<int>(modem.getSimStatus()));
            Serial.println("Check SIM insertion/lock and modem firmware.");
        }
        return false;
    }

    Serial.println("✅ SIM7080G modem initialized.");
    return true;
}

bool maintainCellularConnection() {
    if (!modem.isNetworkConnected()) {
        Serial.println("⚠️ Network connection lost. Reconnecting...");
        if (modem.waitForNetwork(10000L)) {
            Serial.println("🎉 Reconnected to Cellular Network!");
        } else {
            Serial.println("❌ Still searching for network...");
            return false;
        }
    }

    if (!modem.isGprsConnected()) {
        Serial.println("⚠️ GPRS disconnected. Connecting to APN...");
        if (!modem.gprsConnect(apn, "", "")) {
            Serial.println("❌ Failed to connect to the APN.");
            return false;
        }
        Serial.println("🎉 GPRS connected.");
    }

    return modem.isNetworkConnected() && modem.isGprsConnected();
}
