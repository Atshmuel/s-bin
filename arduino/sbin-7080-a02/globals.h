#pragma once

#if !defined(ARDUINO_USB_CDC_ON_BOOT) || !ARDUINO_USB_CDC_ON_BOOT
#error "Enable USB CDC On Boot for T-SIM7080G-S3 V1; GPIO43/44 are used by the A02 UART."
#endif

#define XPOWERS_CHIP_AXP2101
#include <XPowersLib.h>

#define TINY_GSM_MODEM_SIM7080
#define TINY_GSM_RX_BUFFER 1024
#include <TinyGsmClient.h>

#include <Arduino.h>
#include <ArduinoJson.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <WiFi.h>
#include <time.h>
#include <sys/time.h>
#include <esp_sleep.h>

// LilyGO T-SIM7080G-S3 V1 board pins
#define BOARD_MODEM_PWR_PIN 41
#define BOARD_MODEM_DTR_PIN 42
#define BOARD_MODEM_RXD_PIN 4
#define BOARD_MODEM_TXD_PIN 5

// AXP2101 PMU I2C pins on T-SIM7080G-S3 V1
#define PMU_I2C_SDA_PIN 15
#define PMU_I2C_SCL_PIN 7

// SIM7080 modem GPIO used to power the GNSS antenna
#define MODEM_GPS_ENABLE_GPIO 5
#define MODEM_GPS_ENABLE_LEVEL 1

// A02 sensor pins
#define SENSOR_RXD_PIN 44
#define SENSOR_TXD_PIN 43

extern const char apn[];

extern XPowersPMU PMU;
extern HardwareSerial SerialModem;
extern HardwareSerial SerialSensor;
extern TinyGsm modem;
extern TinyGsmClient gsmClient;
extern PubSubClient mqttClient;
extern Preferences preferences;
extern DNSServer dnsServer;
extern WebServer configServer;

extern String DeviceMac;
extern String ownerId;
extern String deviceKey;
extern float latitude;
extern float longitude;
extern bool hasGpsFix;
extern bool gpsModeActive;
extern bool configurationPortalActive;
extern int binDepthMm;
extern bool pmuAvailable;
extern uint8_t sensorFailureCycles;
extern uint8_t pmuFailureCycles;
extern uint8_t gpsFailureCycles;
extern time_t lastGpsAttemptEpoch;
extern time_t lastGpsUpdateEpoch;
extern uint64_t nextWakeEpoch;
extern uint32_t scheduleAckCounter;
extern unsigned long gpsAcquisitionStartedAt;
extern bool gpsAttemptDue;
extern bool gpsFixUpdatedThisCycle;

bool initializePowerManagement();
uint16_t readBatteryMillivolts();
int readBatteryPercent();
String updateDeviceHealth(bool sensorOk, bool pmuOk, bool gpsTested, bool gpsOk);
String getDeviceHealthMessage(int distanceMm);
bool synchronizeClockFromNetwork();
bool isSystemClockValid();
bool shouldRefreshGpsLocation();
void recordGpsAttempt();
void saveLastKnownLocation();
void enterDeepSleepUntilNextReport();
void initializeSensor();
bool initializeModem();
int getDistanceMm();
bool maintainCellularConnection();
bool startConfigurationPortal();
void handleConfigurationPortal();
void loadDeviceSettings();
void saveOwnerId(const String& id);
void saveDeviceKey(const String& key);
void clearDeviceSettings();
String getChipMac();
bool calibrateBinDepth();
int calculateFillLevel(int distanceMm);
bool startGpsAcquisition();
bool stopGpsAcquisition();
void setupMqtt();
void maintainMqttConnection();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishRegistration(int batteryPercent);
bool publishTelemetry(int distanceMm, int batteryPercent, const String& health, const String& healthMessage);
bool updateGpsLocation();
