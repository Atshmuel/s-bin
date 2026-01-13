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
int battery = 100;
