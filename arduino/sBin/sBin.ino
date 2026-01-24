#include "globals.h"



//should send logs every 4 hours or if battery is low or fill level is high
unsigned long lastLogTime = 0;
const unsigned long LOG_INTERVAL = 14400000; // 4 hours in milliseconds
const unsigned long URGENT_LOG_INTERVAL = 3600000;  // 1 hour in milliseconds
const unsigned long CRITICAL_LOG_INTERVAL = 1800000; // 30 minutes
const unsigned long REGISTER_INTERVAL = 10000; // 10 seconds
unsigned long lastRegisterTime = 0;

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
    Serial.println("In Setup Mode");
    while (gpsSerial.available() > 0)
      if (gps.encode(gpsSerial.read()))
      displayLocationInfo();

    if (millis() > 5000 && gps.charsProcessed() < 10) {
      Serial.println(F("No GPS detected: check wiring."));
      while(true);
  }
    delay(1000);

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
    // Update simulation values
    // updateTelemetrySimulation();
    fillLevel = getFillLevel();

    // Normal operation: send logs periodically
    if (millis() - lastLogTime > LOG_INTERVAL || (health == "critical" && millis() - lastLogTime > CRITICAL_LOG_INTERVAL) ||(fillLevel >= 80 && millis() - lastLogTime > URGENT_LOG_INTERVAL)) {
      Serial.println("Sending periodic log...");
      // Simulate level/battery for now or read from sensors
      // int fillLevel = readUltrasonic(); 
      // int bat = readBattery();
      
      publishLog(fillLevel, battery, health);
      lastLogTime = millis();
    }
    
    delay(1000);
  
    break;

  case RESET:
    /* code */
    break;
  default:
    break;
  }
}