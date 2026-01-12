#include <Preferences.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <TinyGPS++.h>


// ----- אובייקטים גלובליים -----
Preferences preferences;
WiFiClient espClient;
PubSubClient client(espClient);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2); 

// ----- משתנים גלובליים (נגישים ע"י wifi באמצעות extern) -----
String ssid = "";
String password = "";
String ownerId = "";
String deviceKey = "";
String macAddr = "";
bool shouldReboot = false;
bool inSetupMode = false;

// ----- טיימרים -----
unsigned long lastLogTime = 0;

// ================================================================
//                       MQTT Logic
// ================================================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  
  Serial.print("Msg: "); Serial.println(message);

  String ackTopic = "bins/ack/" + macAddr;
  if (String(topic) == ackTopic) {
    StaticJsonDocument<256> doc;
    deserializeJson(doc, message);
    
    if (doc.containsKey("deviceKey")) {
      String key = doc["deviceKey"].as<String>();
      preferences.begin("sbin", false);
      preferences.putString("devKey", key);
      preferences.end();
      deviceKey = key;
      Serial.println("Registered! Key saved.");
    }
  }
  // כאן ניתן להוסיף טיפול בפקודות (reset וכו')
}

void connectToMqtt() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "S-Bin-" + macAddr;
    
    if (client.connect(clientId.c_str())) {
      Serial.println("Connected");
      client.subscribe(("bins/ack/" + macAddr).c_str());
      client.subscribe(("bins/command/" + macAddr).c_str());
    } else {
      Serial.print("Failed rc="); Serial.print(client.state());
      Serial.println(" Retrying in 5s");
      delay(5000);
    }
  }
}

void registerDevice() {
  if (deviceKey.length() > 0) return;

  StaticJsonDocument<256> doc;
  doc["mac"] = macAddr;
  doc["orgId"] = ownerId;
  doc["battery"] = getBatteryLevel();
  
  JsonArray location = doc.createNestedArray("location");
  double lat, lng;
  readGPS(lat, lng);
  location.add(lat);
  location.add(lng);

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("bins/register", buffer);
}

void sendLog() {
  if (deviceKey.length() == 0) return;

  StaticJsonDocument<512> doc;
  doc["deviceKey"] = deviceKey;
  
  double lat, lng;
  readGPS(lat, lng);
  JsonArray location = doc.createNestedArray("location");
  location.add(lat);
  location.add(lng);

  int level = getBinLevel();
  int batt = getBatteryLevel();
  doc["level"] = level;
  doc["battery"] = batt;

  if (batt < 20 || level > 90) doc["health"] = "critical";
  else if (batt < 40 || level > 70) doc["health"] = "warning";
  else doc["health"] = "ok";

  char buffer[512];
  serializeJson(doc, buffer);
  
  String topic = "bins/" + macAddr + "/update/log";
  client.publish(topic.c_str(), buffer);
  Serial.println("Log Sent.");
}

// ================================================================
//                       Main Setup & Loop
// ================================================================

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // שימוש בפונקציה מתוך WifiHandler
  macAddr = getMacAddress();
  Serial.println("MAC: " + macAddr);

  // טעינת הגדרות
  preferences.begin("sbin", true);
  ssid = preferences.getString("ssid", "");
  password = preferences.getString("pass", "");
  ownerId = preferences.getString("orgId", "");
  deviceKey = preferences.getString("devKey", "");
  preferences.end();

  // החלטה אם לעבור למצב הגדרה או להתחבר
  if (ssid == "" || ownerId == "") {
    startAPMode(); // מוגדר ב-WifiHandler.h
  } else {
    // מנסה להתחבר, אם נכשל -> עובר ל-AP
    if (connectToWifi(ssid, password)) {
      client.setServer(MQTT_SERVER, MQTT_PORT);
      client.setCallback(mqttCallback);
    } else {
      startAPMode();
    }
  }
}

void loop() {
  // בדיקה אם צריך ריסט (מגיע מ-WifiHandler)
  if (shouldReboot) {
    delay(2000);
    ESP.restart();
  }

  // אם אנחנו במצב Setup
  if (inSetupMode) {
    handleWifiLoop(); // טיפול בבקשות שרת Web
    
    // הבהוב איטי לסימון מצב Setup
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      lastBlink = millis();
    }
    return;
  }

  // --- מצב מחובר (רגיל) ---
  
  if (!client.connected()) connectToMqtt();
  client.loop();

  // קריאת GPS רציפה
  while (gpsSerial.available() > 0) gps.encode(gpsSerial.read());

  // מכונת מצבים: הרשמה או דיווח
  if (deviceKey == "") {
    static unsigned long lastRegisterAttempt = 0;
    if (millis() - lastRegisterAttempt > 5000) {
      registerDevice();
      lastRegisterAttempt = millis();
    }
  } else {
    if (millis() - lastLogTime > LOG_INTERVAL) {
      sendLog();
      lastLogTime = millis();
    }
  }
}