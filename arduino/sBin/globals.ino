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
float lat = 32.705433;
float lng = 35.254444;
int fillLevel = 0;
int battery = 100;
String health = "good";
