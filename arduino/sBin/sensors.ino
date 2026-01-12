// #ifndef SENSORS_H
// #define SENSORS_H

// #include <Arduino.h>
// #include <TinyGPS++.h>
// #include "Config.h"

// // הצהרה על אובייקטים חיצוניים (מוגדרים ב-SmartBin.ino)
// extern TinyGPSPlus gps;
// extern HardwareSerial gpsSerial;

// // --- המרת MAC ל-String ---
// String getMacAddress() {
//   uint8_t baseMac[6];
//   esp_read_mac(baseMac, ESP_MAC_WIFI_STA);
//   char baseMacChr[18] = {0};
//   sprintf(baseMacChr, "%02X:%02X:%02X:%02X:%02X:%02X", baseMac[0], baseMac[1], baseMac[2], baseMac[3], baseMac[4], baseMac[5]);
//   return String(baseMacChr);
// }

// // --- קריאת סוללה (0-100) ---
// int getBatteryLevel() {
//   int raw = analogRead(BATTERY_PIN);
//   // מיפוי גנרי - יש להתאים לחומרה הספציפית
//   int level = map(raw, 0, 4095, 0, 100); 
//   return constrain(level, 0, 100);
// }

// // --- קריאת חיישן מרחק (אחוז מלא) ---
// int getBinLevel() {
//   digitalWrite(TRIG_PIN, LOW);
//   delayMicroseconds(2);
//   digitalWrite(TRIG_PIN, HIGH);
//   delayMicroseconds(10);
//   digitalWrite(TRIG_PIN, LOW);
  
//   long duration = pulseIn(ECHO_PIN, HIGH);
//   int distanceCm = duration * 0.034 / 2;
  
//   // הנחה: פח ריק = 100 ס"מ, פח מלא = 10 ס"מ
//   int fullness = map(distanceCm, 100, 10, 0, 100); 
//   return constrain(fullness, 0, 100);
// }

// // --- קריאת GPS ---
// void readGPS(double &lat, double &lng) {
//   // קריאת המידע שמגיע מה-Serial
//   while (gpsSerial.available() > 0) {
//     gps.encode(gpsSerial.read());
//   }
  
//   if (gps.location.isValid()) {
//     lat = gps.location.lat();
//     lng = gps.location.lng();
//   } else {
//     // מיקום דיפולטיבי אם אין קליטה
//     lat = 32.0853; 
//     lng = 34.7818;
//   }
// }

// #endif