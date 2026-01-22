#include "globals.h"

// Useful for clearing all stored preferences during reset command from server
void clearPreferences() {
  preferences.begin("credentials", false);
  preferences.clear();
  preferences.end();
  Serial.println("Preferences cleared.");
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
void saveBinDepth(int depth) {
preferences.begin("credentials", false);
  preferences.putInt("binDepth", depth);
  preferences.end();
}

void loadPreferences() {
  preferences.begin("credentials", true);
  ssid = preferences.getString("ssid", "");
  password = preferences.getString("password", "");
  ownerId = preferences.getString("ownerId", "");
  deviceKey = preferences.getString("deviceKey", "");
  binDepth = preferences.getInt("binDepth", 0);
  preferences.end();
}

void preferencesSetup() {
  loadPreferences();
  Serial.println("Loaded Preferences:");
  Serial.println("SSID: " + ssid);
  Serial.println("Password: " + password);
  Serial.println("Owner ID: " + ownerId);
  Serial.println("Device Key: " + deviceKey);
  Serial.println("Bin Depth: " + String(binDepth));
  if(ssid != "" && ownerId != ""){
    if (deviceKey != "") {
      if (binDepth == 0) {
        currentMode = CALIBRATION_MODE;
      } else {
        currentMode = NORMAL_MODE;
      }
    } else {
      currentMode = REGISTER_MODE;
    }
  } else {
    currentMode = SETUP_MODE;
  }
}