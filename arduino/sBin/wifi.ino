#include "globals.h"

String binsWifiName = "Bin-";
const byte DNS_PORT = 53;

const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE HTML>
<html lang="he" dir="rtl">
<head>
  <title>Smart Bin Setup</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 420px;
      overflow: hidden;
    }
    
    .card-header {
      padding: 32px 24px 16px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .logo {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border-radius: 16px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo svg {
      width: 36px;
      height: 36px;
      fill: white;
    }
    
    .card-title {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    
    .card-description {
      font-size: 14px;
      color: #6b7280;
    }
    
    .card-content {
      padding: 24px;
    }
    
    .form-group {
      margin-bottom: 20px;
      position: relative;
    }
    
    .form-group input {
      width: 100%;
      height: 52px;
      padding: 24px 16px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 16px;
      background: #fafafa;
      transition: all 0.2s ease;
      outline: none;
    }
    
    .form-group input:focus {
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
      background: white;
    }
    
    .form-group label {
      position: absolute;
      right: 16px;
      top: 16px;
      font-size: 14px;
      color: #9ca3af;
      pointer-events: none;
      transition: all 0.2s ease;
    }
    
    .form-group input:focus + label,
    .form-group input:not(:placeholder-shown) + label {
      top: 6px;
      font-size: 11px;
      color: #22c55e;
    }
    
    .btn {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    .btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .card-footer {
      padding: 16px 24px 24px;
      text-align: center;
    }
    
    .device-info {
      font-size: 12px;
      color: #9ca3af;
    }
    
    .status {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      display: none;
    }
    
    .status.success {
      background: #dcfce7;
      color: #166534;
      display: block;
    }
    
    .status.error {
      background: #fee2e2;
      color: #991b1b;
      display: block;
    }
    
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="logo">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/>
        </svg>
      </div>
      <h1 class="card-title">הגדרת פח חכם</h1>
      <p class="card-description">הזן את פרטי החיבור כדי להפעיל את הפח</p>
    </div>
    
    <div class="card-content">
      <div id="status" class="status"></div>
      
      <form id="setupForm">
        <div class="form-group">
          <input type="text" id="wifi_ssid" name="wifi_ssid" placeholder=" " required>
          <label for="wifi_ssid">שם רשת WiFi</label>
        </div>
        
        <div class="form-group">
          <input type="password" id="wifi_password" name="wifi_password" placeholder=" " required>
          <label for="wifi_password">סיסמת WiFi</label>
        </div>
        
        <div class="form-group">
          <input type="text" id="ownerId" name="ownerId" placeholder=" " required>
          <label for="ownerId">מזהה ארגון</label>
        </div>
        
        <button type="submit" class="btn" id="submitBtn">
          <span id="btnText">שמור והפעל</span>
        </button>
      </form>
    </div>
    
    <div class="card-footer">
      <p class="device-info">מזהה מכשיר: <span id="deviceMac">%DEVICE_MAC%</span></p>
    </div>
  </div>

  <script>
    document.getElementById('setupForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const btn = document.getElementById('submitBtn');
      const btnText = document.getElementById('btnText');
      const status = document.getElementById('status');
      
      btn.disabled = true;
      btnText.innerHTML = '<span class="spinner"></span>';
      
      const data = {
        wifi_ssid: document.getElementById('wifi_ssid').value,
        wifi_password: document.getElementById('wifi_password').value,
        ownerId: document.getElementById('ownerId').value
      };
      
      try {
        const response = await fetch('/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'saved') {
          status.className = 'status success';
          status.textContent = 'ההגדרות נשמרו בהצלחה! המכשיר יופעל מחדש...';
          status.style.display = 'block';
        } else {
          throw new Error(result.message || 'שגיאה בשמירה');
        }
      } catch (error) {
        status.className = 'status error';
        status.textContent = 'שגיאה: ' + error.message;
        status.style.display = 'block';
        btn.disabled = false;
        btnText.textContent = 'שמור והפעל';
      }
    });
  </script>
</body>
</html>)rawliteral";


String getWIFIMacAddress() {
  return WiFi.macAddress();  
}

void handleRoot(){
  Serial.println("GET /");
  
  // Replace placeholder with actual device MAC
  String html = String(index_html);
  html.replace("%DEVICE_MAC%", DeviceMac);
  
  server.send(200, "text/html", html);
}

// Captive portal redirect handler
void handleCaptivePortal() {
  Serial.println("Captive Portal Redirect");
  server.sendHeader("Location", "http://192.168.4.1", true);
  server.send(302, "text/plain", "");
}


void setupServer(){
  server.on("/", HTTP_GET, handleRoot);
  
  // Captive portal detection endpoints
  server.on("/generate_204", HTTP_GET, handleCaptivePortal);      // Android
  server.on("/gen_204", HTTP_GET, handleCaptivePortal);           // Android
  server.on("/hotspot-detect.html", HTTP_GET, handleRoot);        // Apple iOS/macOS
  server.on("/library/test/success.html", HTTP_GET, handleRoot);  // Apple
  server.on("/ncsi.txt", HTTP_GET, handleCaptivePortal);          // Windows
  server.on("/connecttest.txt", HTTP_GET, handleCaptivePortal);   // Windows
  server.on("/redirect", HTTP_GET, handleCaptivePortal);          // Windows
  server.on("/fwlink", HTTP_GET, handleCaptivePortal);            // Windows
  
  // Catch all other requests
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

    Serial.println("Register now");
    String wifiSsid = doc["wifi_ssid"];
    String wifiPass = doc["wifi_password"];
    String owner = doc["ownerId"];

 Serial.println("Received Data:");
  Serial.println("SSID: " + wifiSsid);
  Serial.println("Pass: " + wifiPass);
  Serial.println("Owner: " + owner);

    saveSetupData(wifiSsid, wifiPass, owner);
    server.send(200, "application/json", "{\"status\":\"saved\"}");

    server.close();
    delay(3000);

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
  Serial.println("AP IP address: " + WiFi.softAPIP().toString());

  // Start DNS server - redirect all domains to our IP (Captive Portal)
  dnsServer.start(DNS_PORT, "*", localIp);
  Serial.println("DNS Server started - Captive Portal active");
  
  setupServer();
  server.begin();
  Serial.println("HTTP Server started");
  
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