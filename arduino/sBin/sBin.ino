#include "globals.h"


//should send logs every 4 hours or if battery is low or fill level is high
unsigned long lastLogTime = 0;
const unsigned long LOG_INTERVAL = 14400000; // 4 hours in milliseconds
const unsigned long CRITICAL_LOG_INTERVAL = 1800000; // 30 minutes
const unsigned long REGISTER_INTERVAL = 10000; // 10 seconds
unsigned long lastRegisterTime = 0;
const unsigned long WIFI_TIMEOUT = 120000; // 2 minutes
unsigned long wifiStartTime = 0;
const unsigned long REGISTER_TIMEOUT = 120000; // 2 minutes
unsigned long registerStartTime = 0;

void setup() {
  Serial.begin(115200);
  delay(5000);
  
  DeviceMac = getChipMac();
  Serial.println("Device MAC: " + DeviceMac);

  preferencesSetup();
  setupMqttTopics(); // Initialize topics with correct MAC

  if(currentMode == SETUP_MODE){
    WifiSetUp(); 
    //start wifi in AP mode to get user credentials if ssid and password are stroed in preferences we can skip this step and go to normal mode
    //Note this step will also start the web server to get user credentials and ownerId from user
  }

  if(currentMode == REGISTER_MODE || currentMode == NORMAL_MODE){
    connectToWifi(ssid, password);
  }
}

void loop() {
  if (currentMode == REGISTER_MODE || currentMode == NORMAL_MODE) {
    if (!mqttClient.connected()) {
      connectMqtt();
    }
    mqttClient.loop();
  }

  switch (currentMode)
  {
  case SETUP_MODE:
    Serial.println("In Setup Mode");
    break;

  case WIFI_CONFIG_MODE:
    // Process DNS requests (Captive Portal)
    dnsServer.processNextRequest();
    // Process HTTP requests
    server.handleClient();
    break;

  case REGISTER_MODE:
    // In register mode, we wait for the server to send us a key via MQTT ACK
    // We republish the registration request every few seconds until we get an ACK (handled in callback)
    if (millis() - lastRegisterTime > REGISTER_INTERVAL) {
      Serial.println("Sending Registration Request...");
      publishRegister();
      lastRegisterTime = millis();
    }
    break;

  case NORMAL_MODE:
    // Update simulation values
    updateTelemetrySimulation();

    // Normal operation: send logs periodically
    if (millis() - lastLogTime > LOG_INTERVAL || (health == "critical" && millis() - lastLogTime > CRITICAL_LOG_INTERVAL)) {
      Serial.println("Sending periodic log...");
      // Simulate level/battery for now or read from sensors
      // int fillLevel = readUltrasonic(); 
      // int bat = readBattery();
      
      publishLog(fillLevel, battery, health);
      lastLogTime = millis();
    }
    break;

  case RESET:
    /* code */
    break;
  default:
    break;
  }
}