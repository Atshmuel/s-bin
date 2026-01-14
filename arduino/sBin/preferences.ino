#include "globals.h"

// Useful for clearing all stored preferences during reset command from server
void clearPreferences() {
  preferences.begin("credentials", false);
  preferences.clear();
  preferences.end();
  ESP.restart()
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
  Serial.println("Loaded Preferences:");
  Serial.println("SSID: " + ssid);
  Serial.println("Password: " + password);
  Serial.println("Owner ID: " + ownerId);
  Serial.println("Device Key: " + deviceKey);
  if(ssid != "" && password != "" && ownerId != ""){
    if (deviceKey != "") {
      currentMode = NORMAL_MODE;
    } else {
      currentMode = REGISTER_MODE;
    }
  } else {
    currentMode = SETUP_MODE;
  }
}