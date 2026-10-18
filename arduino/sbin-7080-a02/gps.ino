#include "globals.h"

namespace {
// Switches the active GNSS antenna's power through the modem's GPIO.
void sendGnssAntennaPower(bool on) {
    modem.sendAT("+SGPIO=0,", MODEM_GPS_ENABLE_GPIO, ",1,",
                 on ? MODEM_GPS_ENABLE_LEVEL : 1 - MODEM_GPS_ENABLE_LEVEL);
}
}

bool startGpsAcquisition() {
    Serial.println("🛰️ Powering the SIM7080G active GNSS antenna.");
    sendGnssAntennaPower(true);
    if (modem.waitResponse() != 1) {
        Serial.println("❌ Could not enable GNSS antenna power (AT+SGPIO).");
        return false;
    }

    Serial.println("🛰️ Enabling GNSS.");
    if (!modem.enableGPS()) {
        Serial.println("❌ Failed to enable GNSS.");
        sendGnssAntennaPower(false);
        modem.waitResponse();
        return false;
    }

    gpsModeActive = true;
    return true;
}

bool stopGpsAcquisition() {
    const bool gpsDisabled = modem.disableGPS();
    if (!gpsDisabled) {
        Serial.println("❌ Could not disable GNSS.");
    }

    sendGnssAntennaPower(false);
    const bool antennaPowerDisabled = modem.waitResponse() == 1;
    if (!antennaPowerDisabled) {
        Serial.println("❌ GNSS stopped, but antenna power could not be disabled.");
    }

    delay(1000);
    gpsModeActive = false;
    if (!gpsDisabled || !antennaPowerDisabled) {
        return false;
    }

    Serial.println("GNSS and antenna power are off.");
    return true;
}

bool updateGpsLocation() {
    float newLatitude = 0;
    float newLongitude = 0;
    float speed = 0;
    float altitude = 0;
    int satellitesInView = 0;
    int satellitesUsed = 0;

    if (!modem.getGPS(
            &newLatitude,
            &newLongitude,
            &speed,
            &altitude,
            &satellitesInView,
            &satellitesUsed)) {
        Serial.println("⏳ Waiting for GPS fix before registration/telemetry.");
        return false;
    }

    if (newLatitude < -90 || newLatitude > 90 ||
        newLongitude < -180 || newLongitude > 180) {
        Serial.println("❌ GPS returned coordinates outside valid ranges.");
        return false;
    }

    latitude = newLatitude;
    longitude = newLongitude;
    hasGpsFix = true;
    gpsFixUpdatedThisCycle = true;
    saveLastKnownLocation();
    return true;
}
