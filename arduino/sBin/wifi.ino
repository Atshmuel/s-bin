#include "globals.h"

String binsWifiName = "Bin-";
const byte DNS_PORT = 53;

const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE HTML>
<html>
<head>
  <title>Smart Bin Setup</title>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <style>
    :root {
      --bg-color: #f5f7fa;
      --bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
      --card-bg: #ffffff;
      --text-main: #1a1a1a;
      --text-secondary: #6b7280;
      --border-color: #e5e7eb;
      --input-bg: #fafafa;
      --input-focus-border: #22c55e;
      --primary-gradient: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      --button-text: #ffffff;
      --shadow-color: rgba(0,0,0,0.1);
      --header-border: #f0f0f0;
      --label-color: #9ca3af;
    }

    .dark-mode {
      --bg-color: #111827;
      --bg-gradient: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      --card-bg: #1f2937;
      --text-main: #f9fafb;
      --text-secondary: #d1d5db;
      --border-color: #374151;
      --input-bg: #374151;
      --input-focus-border: #4ade80;
      --header-border: #374151;
      --label-color: #9ca3af;
      --shadow-color: rgba(0,0,0,0.5);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg-gradient);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--text-main);
    }

    .controls-container {
      position: absolute;
      top: 20px;
      display: flex;
      gap: 10px;
      z-index: 10;
    }
    
    /* LTR languages: buttons on right. RTL languages: buttons on left */
    html[dir='ltr'] .controls-container { right: 20px; }
    html[dir='rtl'] .controls-container { left: 20px; }

    .icon-btn {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 5px var(--shadow-color);
      color: var(--text-main);
    }
    
    .icon-btn:hover {
      background-color: var(--input-bg);
    }

    .icon-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    
    .card {
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: 0 10px 40px var(--shadow-color);
      width: 100%;
      max-width: 420px;
      overflow: hidden;
      position: relative;
    }
    
    .card-header {
      padding: 32px 24px 16px;
      text-align: center;
      border-bottom: 1px solid var(--header-border);
    }
    
    .logo {
      width: 64px;
      height: 64px;
      background: var(--primary-gradient);
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
      color: var(--text-main);
      margin-bottom: 8px;
    }
    
    .card-description {
      font-size: 14px;
      color: var(--text-secondary);
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
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-size: 16px;
      background: var(--input-bg);
      color: var(--text-main);
      outline: none;
    }
    
    .form-group input:focus {
      border-color: var(--input-focus-border);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
    }
    
    .form-group label {
      position: absolute;
      top: 16px;
      font-size: 14px;
      color: var(--label-color);
      pointer-events: none;
      transition: all 0.2s ease;
    }

    /* Adjust label position based on direction */
    html[dir='ltr'] .form-group label { left: 16px; }
    html[dir='rtl'] .form-group label { right: 16px; }
    
    .form-group input:focus + label,
    .form-group input:not(:placeholder-shown) + label {
      top: 6px;
      font-size: 11px;
      color: var(--input-focus-border);
    }
    
    .btn {
      width: 100%;
      height: 48px;
      background: var(--primary-gradient);
      color: var(--button-text);
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
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
      color: var(--text-secondary);
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
  <div class='controls-container'>
    <button id='themeToggle' class='icon-btn' onclick='toggleTheme()' aria-label='Toggle Theme'>
      <!-- Sun Icon -->
      <svg id='sunIcon' style='display:none' viewBox='0 0 24 24'><path d='M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z'/></svg>
      <!-- Moon Icon -->
      <svg id='moonIcon' style='display:none' viewBox='0 0 24 24'><path d='M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z'/></svg>
    </button>
    <button id='langToggle' class='icon-btn' onclick='toggleLanguage()' aria-label='Switch Language'>
      <svg viewBox='0 0 24 24'><path d='M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z'/></svg>
    </button>
  </div>

  <div class='card'>
    <div class='card-header'>
      <div class='logo'>
        <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z'/>
        </svg>
      </div>
      <h1 class='card-title' data-i18n='title'>Smart Bin Setup</h1>
      <p class='card-description' data-i18n='description'>Enter setup details to activate the bin</p>
    </div>
    
    <div class='card-content'>
      <div id='status' class='status'></div>
      
      <form id='setupForm'>
        <div class='form-group'>
          <input type='text' id='wifi_ssid' name='wifi_ssid' placeholder=' ' required>
          <label for='wifi_ssid' data-i18n='ssid'>WiFi Name</label>
        </div>
        
        <div class='form-group'>
          <input type='password' id='wifi_password' name='wifi_password' placeholder=' ' required>
          <label for='wifi_password' data-i18n='password'>WiFi Password</label>
        </div>
        
        <div class='form-group'>
          <input type='text' id='ownerId' name='ownerId' placeholder=' ' required>
          <label for='ownerId' data-i18n='owner'>Organization ID</label>
        </div>
        
        <button type='submit' class='btn' id='submitBtn'>
          <span id='btnText' data-i18n='save'>Save & Enable</span>
        </button>
      </form>
    </div>
    
    <div class='card-footer'>
      <p class='device-info'><span data-i18n='device'>Device ID:</span> <span id='deviceMac'>%DEVICE_MAC%</span></p>
    </div>
  </div>

  <script>
    const translations = {
      en: {
        title: 'Smart Bin Setup',
        description: 'Enter setup details to activate the bin',
        ssid: 'WiFi Name',
        password: 'WiFi Password',
        owner: 'Organization ID',
        save: 'Save & Enable',
        device: 'Device ID:',
        statusSuccess: 'Settings saved successfully! Device restarting...',
        statusError: 'Saving Error',
        errorPrefix: 'Error: '
      },
      he: {
        title: 'הגדרת פח חכם',
        description: 'הזן את פרטי החיבור כדי להפעיל את הפח',
        ssid: 'שם רשת WiFi',
        password: 'סיסמת WiFi',
        owner: 'מזהה ארגון',
        save: 'שמור והפעל',
        device: 'מזהה מכשיר:',
        statusSuccess: 'ההגדרות נשמרו בהצלחה! המכשיר יופעל מחדש...',
        statusError: 'שגיאה בשמירה',
        errorPrefix: 'שגיאה: '
      }
    };

    let currentLang = 'en';
    let currentTheme = 'light';

    function init() {
      // Detect Browser Language
      const userLang = navigator.language || navigator.userLanguage; 
      currentLang = userLang.startsWith('he') ? 'he' : 'en';
      
      // Detect Browser Theme Preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        currentTheme = 'dark';
      }

      applyLanguage();
      applyTheme();
    }

    function toggleLanguage() {
      currentLang = currentLang === 'en' ? 'he' : 'en';
      applyLanguage();
    }

    function toggleTheme() {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme();
    }

    function applyLanguage() {
      document.documentElement.lang = currentLang;
      document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
      
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
          el.textContent = translations[currentLang][key];
        }
      });
    }

    function applyTheme() {
      if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('sunIcon').style.display = 'block';
        document.getElementById('moonIcon').style.display = 'none';
      } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('sunIcon').style.display = 'none';
        document.getElementById('moonIcon').style.display = 'block';
      }
    }

    document.getElementById('setupForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const btn = document.getElementById('submitBtn');
      const btnText = document.getElementById('btnText');
      const status = document.getElementById('status');
      const originalText = translations[currentLang].save;
      
      btn.disabled = true;
      btnText.innerHTML = '<span class=\'spinner\'></span>';
      
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
          status.textContent = translations[currentLang].statusSuccess;
          status.style.display = 'block';
        } else {
          throw new Error(result.message || translations[currentLang].statusError);
        }
      } catch (error) {
        status.className = 'status error';
        status.textContent = translations[currentLang].errorPrefix + error.message;
        status.style.display = 'block';
        btn.disabled = false;
        btnText.textContent = originalText;
      }
    });

    // Run init on load
    init();
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