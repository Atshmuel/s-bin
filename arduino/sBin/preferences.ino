#include "globals.h"

// Useful for clearing all stored preferences during reset command from server
void clearPreferences() {
  preferences.begin("credentials", false);
  preferences.clear();
  preferences.end();
}

void saveDeviceKey(String key) {
  preferences.begin("credentials", false);
  preferences.putString("deviceKey", key);
  preferences.end();
}

void saveSetupData(String wifiSsid, String wifiPass, String owner) {
  preferences.begin("credentials", false);
  preferences.putString("ssid", wifiSsid);
  preferences.putString("password", wifiPass);
  preferences.putString("ownerId", owner);
  preferences.end();
}

void loadPreferences() {
  preferences.begin("credentials", true);
  ssid = preferences.getString("ssid", "");
  password = preferences.getString("password", "");
  ownerId = preferences.getString("ownerId", "");
  deviceKey = preferences.getString("deviceKey", "");
  preferences.end();
}

void preferencesSetup() {
  loadPreferences();
  if(ssid != "" && password != "" && ownerId != "" && deviceKey != ""){
    currentMode = NORMAL_MODE;
  } else {
    currentMode = SETUP_MODE;
  }
}