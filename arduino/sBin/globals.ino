#include "globals.h"

// Preferences
Preferences preferences;

// Credentials
String ssid = "";
String password = "";
String ownerId = "";
String deviceKey = "";

// Device
String DeviceMac = "";

//ultrasonic sensor
Ultrasonic ultrasonic(TRIG_PIN, ECHO_PIN);
long microsec = 0;
float distance = 0.0;

//gps
TinyGPSPlus gps;

// Mode
int currentMode = SETUP_MODE;

// MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Web Server
WebServer server(80);
DNSServer dnsServer;
long wifiTime = 0;

// Telemetry
float lat = 0.0;
float lng = 0.0;
int fillLevel = 0;
int binDepth = 0;
float battery = 100;
String health = "good";
