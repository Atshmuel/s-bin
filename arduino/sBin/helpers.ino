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