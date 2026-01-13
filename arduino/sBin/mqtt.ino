#include "globals.h"


const char* mqttServer = "broker.hivemq.com"; 
const int mqttPort = 1883;


String REGISTER_TOPIC = "bins/register";
String ACK_TOPIC = "bins/ack/" + DeviceMac;
String COMMAND_TOPIC = "bins/command/" + DeviceMac;
String LOG_TOPIC = "bins/" + DeviceMac + "/update/log";


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
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String t = topic;
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];

  StaticJsonDocument<256> doc;
  deserializeJson(doc, msg);

  if (t == ACK_TOPIC && doc["deviceKey"]) {
    deviceKey = doc["deviceKey"].as<String>();
    saveDeviceKey(deviceKey);
    currentMode = NORMAL_MODE;
  }

  if (t == COMMAND_TOPIC && doc["command"] == "reset") {
    clearPreferences();
    ESP.restart();
  }
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