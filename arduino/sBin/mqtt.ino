#include "globals.h"


const char* mqttServer = "broker.hivemq.com"; 
const int mqttPort = 1883;

String REGISTER_TOPIC = "bins/register";
String ACK_TOPIC = "";
String COMMAND_TOPIC = "";
String LOG_TOPIC = "";

void setupMqttTopics() {
  ACK_TOPIC = "bins/ack/" + DeviceMac;
  COMMAND_TOPIC = "bins/command/" + DeviceMac;
  LOG_TOPIC = "bins/" + DeviceMac + "/update/log";
  
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(mqttCallback);
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "BinClient-";
    clientId += DeviceMac;
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
      
      if (currentMode == REGISTER_MODE) {
        // Subscribe to ACK to receive deviceKey
        mqttClient.subscribe(ACK_TOPIC.c_str());
        Serial.println("Subscribed to: " + ACK_TOPIC);
      } else if (currentMode == NORMAL_MODE) {
        // Subscribe to commands
        mqttClient.subscribe(COMMAND_TOPIC.c_str());
        Serial.println("Subscribed to: " + COMMAND_TOPIC);
      }
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void publishRegister() {
  StaticJsonDocument<256> doc;
  doc["mac"] = DeviceMac;
  doc["orgId"] = ownerId;
  doc["battery"] = battery;
  doc["location"][0] = lat;
  doc["location"][1] = lng;

  char buffer[256];
  serializeJson(doc, buffer);

  mqttClient.publish(REGISTER_TOPIC.c_str(), buffer);
  Serial.println("Registration sent: " + String(buffer));
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String t = topic;
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  
  Serial.println("Message arrived [" + t + "] " + msg);

  StaticJsonDocument<256> doc;
  deserializeJson(doc, msg);

  if (t == ACK_TOPIC && doc.containsKey("deviceKey")) {
    deviceKey = doc["deviceKey"].as<String>();
    Serial.println("Received Device Key: " + deviceKey);
    
    saveDeviceKey(deviceKey);
    Serial.println("Device Key saved. Restarting...");
    delay(1000);
    ESP.restart();
  }

  if (t == COMMAND_TOPIC && doc["command"] == "reset") {
    handleResetCommand();
  }
}

void handleResetCommand() {
  Serial.println("Received reset command. Clearing preferences and restarting...");
  
  // Clear any retained variables if necessary (though restart handles globals)
  ssid = "";
  password = "";
  ownerId = "";
  deviceKey = "";
  
  clearPreferences();
  
  delay(1000);
  ESP.restart();
}

void publishLog(int level, int battery, String health) {
  StaticJsonDocument<256> doc;
  doc["deviceKey"] = deviceKey;
  doc["level"] = level;
  doc["battery"] = battery;
  doc["health"] = health;
  doc["location"][0] = lat;
  doc["location"][1] = lng;

  char buffer[256];
  serializeJson(doc, buffer);

  mqttClient.publish(LOG_TOPIC.c_str(), buffer);
}