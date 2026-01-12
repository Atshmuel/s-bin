#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>

// ייבוא משתנים גלובליים מהקובץ הראשי
extern Preferences preferences;
extern bool shouldReboot;
extern bool inSetupMode;
extern String ssid;     // כדי שנוכל לעדכן במקרה של הגדרה חדשה
extern String password;
extern String ownerId;

WebServer server(80);

// פונקציית עזר: קבלת MAC
String getMacAddress() {
  uint8_t baseMac[6];
  esp_read_mac(baseMac, ESP_MAC_WIFI_STA);
  char baseMacChr[18] = {0};
  sprintf(baseMacChr, "%02X:%02X:%02X:%02X:%02X:%02X", baseMac[0], baseMac[1], baseMac[2], baseMac[3], baseMac[4], baseMac[5]);
  return String(baseMacChr);
}

// --- API Handlers ---

void handleStatus() {
  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void handleSetup() {
  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Body not received");
    return;
  }
  
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, server.arg("plain"));

  if (error) {
    server.send(400, "text/plain", "Invalid JSON");
    return;
  }

  String s_ssid = doc["wifi_ssid"];
  String s_pass = doc["wifi_password"];
  String s_owner = doc["ownerId"];

  if (s_ssid.length() > 0) {
    preferences.begin("sbin", false);
    preferences.putString("ssid", s_ssid);
    preferences.putString("pass", s_pass);
    preferences.putString("orgId", s_owner);
    preferences.end();
    
    server.send(200, "application/json", "{\"success\":true}");
    delay(1000);
    shouldReboot = true;
  } else {
    server.send(400, "application/json", "{\"success\":false, \"msg\":\"Empty SSID\"}");
  }
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

// --- פונקציות ניהול ---

void startAPMode() {
  inSetupMode = true;
  WiFi.mode(WIFI_AP);
  IPAddress apIP(192, 168, 4, 1);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  
  String apName = "Bin-Setup-" + getMacAddress().substring(12);
  WiFi.softAP(apName.c_str(), "");

  server.on("/status", HTTP_GET, handleStatus);
  server.on("/setup", HTTP_POST, handleSetup);
  server.onNotFound(handleNotFound);
  server.begin();
  
  Serial.println("AP Mode Started: " + apName);
  Serial.println("IP: " + WiFi.softAPIP().toString());
}

// מחזיר אמת אם התחבר בהצלחה
bool connectToWifi(String s_ssid, String s_pass) {
  Serial.print("Connecting WiFi: "); Serial.println(s_ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(s_ssid.c_str(), s_pass.c_str());
  
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // הבהוב בזמן חיבור
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected");
    digitalWrite(LED_PIN, HIGH);
    return true;
  } else {
    Serial.println("\nWiFi Connection Failed");
    return false;
  }
}

void handleWifiLoop() {
  server.handleClient();
}

