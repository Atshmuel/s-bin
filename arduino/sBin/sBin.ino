#include "globals.h"


//should sand logs every 4 hours or if battery is low or fill level is high
unsigned long lastLogTime = 0;


void setup() {
  Serial.begin(115200);
  delay(6000);
  
  DeviceMac = getChipMac();
  Serial.println("Device MAC: " + DeviceMac);

  preferencesSetup();

  if(currentMode == SETUP_MODE){
    WifiSetUp(); 
    //start wifi in AP mode to get user credentials if ssid and password are stroed in preferences we can skip this step and go to normal mode
    //Note this step will also start the web server to get user credentials and ownerId from user
  }

  if(currentMode == NORMAL_MODE){
    connectToWifi(ssid, password);
  }



}

void loop() {

  switch (currentMode)
  {
  case SETUP_MODE:
    Serial.println("In Setup Mode");
    break;
  case WIFI_CONFIG_MODE:
    // Process DNS requests (Captive Portal)
    dnsServer.processNextRequest();
    // Process HTTP requests
    server.handleClient();
    break;
  case NORMAL_MODE:
    
    /* code */
    break;
  case RESET:
    /* code */
    break;
  default:
    break;
  }
}