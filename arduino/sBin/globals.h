#pragma once

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>  
#include <Preferences.h>  
#include "Ultrasonic.h"
#include <TinyGPSPlus.h>



// ===== Preferences =====
//will be use to store ssid,password,ownerId,deviceKey
extern Preferences preferences;

// ===== Bin Settings =====
extern int binDepth;

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
#define REGISTER_MODE 5
#define CALIBRATION_MODE 6

extern int currentMode;

// ===== Ultrasonic Pins =====
#define TRIG_PIN 4
#define ECHO_PIN 5

extern Ultrasonic ultrasonic;
extern long microsec;
extern float distance;

// ===== GPS =====
extern TinyGPSPlus gps;
#define RXD2 16
#define TXD2 17
#define GPS_BAUD 9600
#define gpsSerial Serial2


// ===== Network / MQTT =====
extern WiFiClient espClient;
extern PubSubClient mqttClient;

// ===== Web Server =====
extern WebServer server;
extern DNSServer dnsServer;
extern long wifiTime;

// ===== Telemetry =====
extern float lat;
extern float lng;
extern int fillLevel;
extern int battery;
extern String health;

// ===== Timeouts =====
#define WIFI_TIMEOUT 120000     // 2 minutes
#define REGISTER_TIMEOUT 120000 // 2 minutes

// ===== Function Prototypes =====
// helpers.ino
String getChipMac();
void saveCredentials(String s, String p, String o, String k);
void updateTelemetrySimulation();

// preferences.ino
void clearPreferences();
void saveDeviceKey(String key);
void saveSetupData(String wifiSsid, String wifiPass, String owner);
void saveBinDepth(int depth);
void loadPreferences();
void preferencesSetup();

// wifi.ino
void WifiSetUp();
void connectToWifi(String s, String p);

// mqtt.ino
void setupMqttTopics();
void connectMqtt();
void publishRegister();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void handleResetCommand();
void publishLog(int level, int battery, String health);

// ultrasonic.ino
void calibrateSensor();
int getFillLevel();

// gps.ino
void displayLocationInfo();



