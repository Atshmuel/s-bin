#include "globals.h"

const char apn[] = "internet";

XPowersPMU PMU;
HardwareSerial SerialModem(1);
HardwareSerial SerialSensor(2);
TinyGsm modem(SerialModem);
TinyGsmClient gsmClient(modem);
PubSubClient mqttClient(gsmClient);

Preferences preferences;
DNSServer dnsServer;
WebServer configServer(80);

String DeviceMac = "";
String ownerId = "";
String deviceKey = "";
float latitude = 0;
float longitude = 0;
bool hasGpsFix = false;
bool gpsModeActive = false;
bool configurationPortalActive = false;
int binDepthMm = 0;
bool pmuAvailable = false;
RTC_DATA_ATTR uint8_t sensorFailureCycles = 0;
RTC_DATA_ATTR uint8_t pmuFailureCycles = 0;
RTC_DATA_ATTR uint8_t gpsFailureCycles = 0;
time_t lastGpsAttemptEpoch = 0;
RTC_DATA_ATTR uint64_t nextWakeEpoch = 0;
RTC_DATA_ATTR uint32_t scheduleAckCounter = 0;
time_t lastGpsUpdateEpoch = 0;
unsigned long gpsAcquisitionStartedAt = 0;
bool gpsAttemptDue = false;
bool gpsFixUpdatedThisCycle = false;
