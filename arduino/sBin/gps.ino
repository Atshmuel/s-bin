#include "globals.h"

// פונקציה לעדכון המשתנים הגלובליים מה-GPS
void updateGPS() {
  // קריאת נתונים מהחומרה
        Serial.println(String(lat) + "lat");
        Serial.println(String(lng) + "lng");

  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      if (gps.location.isValid()) {
        displayLocationInfo();
        lat = gps.location.lat();
        lng = gps.location.lng();
        saveLocation(lat, lng); // שמירת המיקום בזיכרון
      }
    }

  }
    if (millis() > 10000 && gps.charsProcessed() < 10) {
      
      Serial.println(F("No GPS detected: check wiring."));
      while(true);
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


  // Serial.println(F("-------------------------------------"));
  // Serial.println("\n Location Info:");

  // Serial.print("Latitude:  ");
  // Serial.print(gps.location.lat(), 6);
  // Serial.print(" ");
  // Serial.println(gps.location.rawLat().negative ? "S" : "N");

  // Serial.print("Longitude: ");
  // Serial.print(gps.location.lng(), 6);
  // Serial.print(" ");
  // Serial.println(gps.location.rawLng().negative ? "W" : "E");

  // Serial.print("Fix Quality: ");
  // Serial.println(gps.location.isValid() ? "Valid" : "Invalid");

  // Serial.print("Satellites: ");
  // Serial.println(gps.satellites.value());


  // Serial.print("Speed:      ");
  // Serial.print(gps.speed.kmph());
  // Serial.println(" km/h");

  // Serial.println(F("-------------------------------------"));
  //   delay(1000);
}