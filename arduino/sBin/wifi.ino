#include "globals.h"

String binsWifiName = "Bin-";

const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE HTML><html><head>
  <title>Bin Setup</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  </head><body>
  <h2>Bin Setup</h2>
 
</body></html>)rawliteral";


String getWIFIMacAddress() {
  return WiFi.macAddress();  
}

void handleRoot(){
    Serial.println("GET");

  server.send(200, "text/html", index_html);
}

void setupServer(){
  server.on("/", HTTP_GET, handleRoot);
  server.onNotFound(handleRoot);

  server.on("/setup", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  server.on("/status", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"ready\"}");
  });

  //Setup endpoint to receive wifi credentials and ownerId from user and save them in preferences
  server.on("/setup", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));

    if (error) {
        server.send(400, "application/json", "{\"status\":\"error\", \"message\":\"Invalid JSON\"}");
        return;
    }

    String wifiSsid = doc["wifi_ssid"];
    String wifiPass = doc["wifi_password"];
    String owner = doc["ownerId"];

    saveSetupData(wifiSsid, wifiPass, owner);

    server.send(200, "application/json", "{\"status\":\"saved\"}");

    delay(1000);

    // מעבר למצב רגיל
    ESP.restart();
  });
}



void WifiSetUp(){
  binsWifiName.concat(DeviceMac.substring(12)); 
  IPAddress localIp(192, 168, 4, 1);
  
  WiFi.softAPConfig(localIp, localIp, IPAddress(255, 255, 255, 0));
  WiFi.softAP(binsWifiName.c_str());

  Serial.println("Access Point \"" + binsWifiName + "\" started");

  
  setupServer();
  server.begin();
  wifiTime = millis();

  currentMode = WIFI_CONFIG_MODE;

}

void connectToWifi(String s, String p){

  Serial.print("Connecting to ");
  Serial.println(s);
  WiFi.begin(s.c_str(), p.c_str());

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}