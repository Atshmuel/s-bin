#include "globals.h"

bool startGpsAcquisition() {
    Serial.println("🛰️ Powering the SIM7080G active GNSS antenna.");
    modem.sendAT("+SGPIO=0,5,1,1");
    if (modem.waitResponse() != 1) {
        Serial.println("❌ Could not enable GNSS antenna power (AT+SGPIO).");
        return false;
    }

    Serial.println("🛰️ Enabling GNSS.");
    if (!modem.enableGPS()) {
        Serial.println("❌ Failed to enable GNSS.");
        modem.sendAT("+SGPIO=0,5,1,0");
        modem.waitResponse();
        return false;
    }

    gpsModeActive = true;
    return true;
}

bool stopGpsAcquisition() {
    if (!modem.disableGPS()) {
        return false;
    }

    modem.sendAT("+SGPIO=0,5,1,0");
    if (modem.waitResponse() != 1) {
        Serial.println("❌ GNSS stopped, but antenna power could not be disabled.");
        return false;
    }

    delay(1000);
    gpsModeActive = false;
    Serial.println("GNSS stopped; cellular data can now connect.");
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
