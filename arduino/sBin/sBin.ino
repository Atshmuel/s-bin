#include <Preferences.h>

#define SETUP_MODE 1
#define RESET 2
#define NORMAL_MODE 3
//will be use to store ssid,password,ownerId,deviceKey
Preferences preferences;


//ssid will be sent from user on setup along with password (wifi name and wifi password),
//ownerId (orgId),deviceKey (bin secret to access the server)
//after first setup all of this should be stored in the esp for power loss
String ssid, password, ownerId, deviceKey;

//Bin esp mac id
String DeviceMac;

int currentMode = SETUP_MODE;

//should sand logs every 4 hours or if battery is low or fill level is high
unsigned long lastLogTime = 0;

void preferencesSetup() {
  preferences.begin("credentials", true);
  ssid = preferences.getString("ssid", "");
  password = preferences.getString("password", "");
  ownerId = preferences.getString("ownerId", "");
  deviceKey = preferences.getString("deviceKey", "");
  preferences.end();

  if(ssid != "" && password != "" && ownerId != "" && deviceKey != ""){
    currentMode = NORMAL_MODE;
  } else {
    currentMode = SETUP_MODE;
  }
}

void setup() {
  Serial.begin(115200);
  delay(3000);
  
  DeviceMac = getChipMac();

  // preferencesSetup();
  currentMode = NORMAL_MODE; 
  if(currentMode == SETUP_MODE){
    WifiSetUp();
  }
  else if(currentMode == NORMAL_MODE){
    connectToWifi(ssid, password);
  }

}

void loop() {
  switch (currentMode)
  {
  case SETUP_MODE:
    /* code */
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