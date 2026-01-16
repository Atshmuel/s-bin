#include "globals.h"

String getChipMac() {
  uint64_t mac64 = ESP.getEfuseMac();  
  uint8_t mac[6];
  
  for (int i = 0; i < 6; i++) {
    mac[i] = (mac64 >> (8*(5-i))) & 0xFF;
  }
  
  char macStr[18];
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X",
          mac[0], mac[1], mac[2],
          mac[3], mac[4], mac[5]);
  return String(macStr);
}

void saveCredentials(String s, String p, String o, String k) {
  preferences.begin("credentials", false);
  preferences.putString("ssid", s);
  preferences.putString("password", p);
  preferences.putString("ownerId", o);
  preferences.putString("deviceKey", k);
  preferences.end();
}

void updateTelemetrySimulation() {
  static unsigned long lastSimUpdate = 0;
  const unsigned long SIM_INTERVAL = 1740000; // 29 minutes

  if (millis() - lastSimUpdate > SIM_INTERVAL) {
    lastSimUpdate = millis();
    
    // Update simulated values
    fillLevel = random(0, 101); // 0-100
    battery = random(0, 101);   // 0-100
    
    int status = random(0, 3);   // 0-2
    health = status == 0 ? "good" : status == 1 ? "warning" : "critical";
   
    Serial.println("Updated simulation -> Level: " + String(fillLevel) + "%, Battery: " + String(battery) + "%" + ", Health: " + health);

  }
}