#include "globals.h"



//should send logs every 1 minute or if battery is low or fill level is high
unsigned long lastLogTime = 0;
const unsigned long LOG_INTERVAL = 5000; // 5 sec in milliseconds
const unsigned long URGENT_LOG_INTERVAL = 1000;  // 1 minute in milliseconds
const unsigned long CRITICAL_LOG_INTERVAL = 9999000; // 1 minute in milliseconds
const unsigned long REGISTER_INTERVAL = 10000; // 10 seconds
unsigned long lastRegisterTime = 0;

static unsigned long lastBatteryDrop = 0;
const unsigned long DROP_INTERVAL = 300000; // 5 minutes in milliseconds


unsigned long wifiStartTime = 0;
unsigned long registerStartTime = 0;


void setup() {
  Serial.begin(115200);
  delay(5000);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, RXD2, TXD2);
  // clearPreferences();
  DeviceMac = getChipMac();
  Serial.println("Device MAC: " + DeviceMac);
  preferencesSetup();
  setupMqttTopics(); // Initialize topics with correct MAC
  if(currentMode == SETUP_MODE){
    WifiSetUp(); 
  //start wifi in AP mode to get user credentials if ssid and password are stroed in preferences we can skip this step and go to normal mode
  //Note this step will also start the web server to get user credentials and ownerId from user
  }

  if(currentMode == REGISTER_MODE || currentMode == NORMAL_MODE || currentMode == CALIBRATION_MODE){
    connectToWifi(ssid, password);
    scaleSetup(); // Initialize the scale
  }
  
}

void loop() {
  if (currentMode == REGISTER_MODE || currentMode == NORMAL_MODE || currentMode == CALIBRATION_MODE) {
    if (!mqttClient.connected()) {
      connectMqtt();
    }
    mqttClient.loop();
  }

  switch (currentMode)
  {
  case SETUP_MODE:
    break;

  case WIFI_CONFIG_MODE:
    // Process DNS requests (Captive Portal)
    dnsServer.processNextRequest();
    // Process HTTP requests
    server.handleClient();
    break;

  case REGISTER_MODE:
    // Handle Registration Timeout
    if (registerStartTime == 0) {
      registerStartTime = millis();
    }
    if (millis() - registerStartTime > REGISTER_TIMEOUT) {
      Serial.println("Registration timed out. Resetting to factory settings...");
      clearPreferences();
      // Delay to allow serial message to be sent
      delay(1000); 
      ESP.restart();
    }
    // In register mode, we wait for the server to send us a key via MQTT ACK
    // We republish the registration request every few seconds until we get an ACK (handled in callback)
    if (millis() - lastRegisterTime > REGISTER_INTERVAL) {
      Serial.println("Sending Registration Request...");
      publishRegister();
      lastRegisterTime = millis();
    }
    break;

  case CALIBRATION_MODE:
    // Perform sensor calibration
    calibrateSensor(); 
    currentMode = NORMAL_MODE;
    // reset log timer to send first log immediately after calibration
    lastLogTime = millis() - LOG_INTERVAL; 
    break;

  case NORMAL_MODE:
    fillLevel = getFillLevel();
    updateGPS();
    scaleLoop(); // Call the scale loop to update weight readings
    //Simulate battery drain over time (for testing purposes)
    if (millis() - lastBatteryDrop > DROP_INTERVAL) {
      if (battery > 0) {
          battery -=0.005; 
      }
      lastBatteryDrop = millis();
    }
      if (fillLevel >= 80 || battery <= 20) {
        health = "critical";
      } else if ((fillLevel >= 50 && fillLevel < 80) || (battery <= 50 && battery > 20)) {
        health = "warning";
      } else {
        health = "good";
      }
    // Normal operation: send logs periodically
    if (millis() - lastLogTime > LOG_INTERVAL) {
      Serial.println("Sending periodic log...");
     
      publishLog(fillLevel, battery, health,currentWeight);
      lastLogTime = millis();
    }
    break;
  default:
    break;
  }
}