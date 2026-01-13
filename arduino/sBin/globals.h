#pragma once

#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>  

// ===== Preferences =====
//will be use to store ssid,password,ownerId,deviceKey
extern Preferences preferences;

// ===== Credentials =====
//ssid will be sent from user on setup along with password (wifi name and wifi password),
//ownerId (orgId),deviceKey (bin secret to access the server)
//after first setup all of this should be stored in the esp for power loss
extern String ssid;
extern String password;
extern String ownerId;
extern String deviceKey;

// ===== Device =====
//Bin esp mac id
extern String DeviceMac;

// ===== Modes =====
#define SETUP_MODE 1
#define RESET 2
#define NORMAL_MODE 3
#define WIFI_CONFIG_MODE 4

extern int currentMode;

// ===== Network / MQTT =====
extern WiFiClient espClient;
extern PubSubClient mqttClient;

// ===== Web Server =====
extern WebServer server;
extern long wifiTime;


