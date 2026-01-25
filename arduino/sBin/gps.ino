#include "globals.h"

// Track last GPS status print time
unsigned long lastGpsStatusTime = 0;
const unsigned long GPS_STATUS_INTERVAL = 5000; // Print status every 5 seconds

void updateGPS() {
  // Read and process all available GPS data
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      if (gps.location.isValid() && gps.location.isUpdated()) {
        float newLat = gps.location.lat();
        float newLng = gps.location.lng();
        
        // Only save if location actually changed (avoid unnecessary writes)
        if (newLat != lat || newLng != lng) {
          lat = newLat;
          lng = newLng;
          displayLocationInfo();
          saveLocation(lat, lng); 
        }
      }
    }
  }

  // Print GPS status periodically for debugging
  if (millis() - lastGpsStatusTime > GPS_STATUS_INTERVAL) {
    lastGpsStatusTime = millis();
    Serial.println(F("--- GPS Status ---"));
    Serial.print(F("Chars processed: ")); Serial.println(gps.charsProcessed());
    Serial.print(F("Sentences with fix: ")); Serial.println(gps.sentencesWithFix());
    Serial.print(F("Location valid: ")); Serial.println(gps.location.isValid() ? "YES" : "NO");
    Serial.print(F("Satellites: ")); Serial.println(gps.satellites.value());
    Serial.print(F("Current lat: ")); Serial.println(lat, 6);
    Serial.print(F("Current lng: ")); Serial.println(lng, 6);
    Serial.println(F("------------------"));
  }

  // Check if GPS hardware is not responding (only after 10 seconds)
  if (millis() > 10000 && gps.charsProcessed() < 10) {
    Serial.println(F("No GPS detected: check wiring."));
    // Don't block forever, just warn
  }
}

void displayLocationInfo() {
  if (gps.location.isValid()) {
    Serial.println(F("--- GPS Location Update ---"));
    Serial.print("Lat: "); Serial.println(lat, 6);
    Serial.print("Lng: "); Serial.println(lng, 6);
    Serial.print("Sats: "); Serial.println(gps.satellites.value());
    Serial.println(F("---------------------------"));
  }else {
    Serial.println(F("Waiting for GPS Fix..."));
  }
}