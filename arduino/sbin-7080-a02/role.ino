#include "globals.h"

DeviceRole deviceRole = ROLE_UNKNOWN;

namespace {
constexpr uint32_t ROLE_RETRY_SLEEP_SECONDS = 15UL * 60UL;

void saveDeviceRole(DeviceRole role) {
    deviceRole = role;
    preferences.begin("credentials", false);
    preferences.putUChar("role", role);
    preferences.end();
}
}

// Set by the become_leaf command; acted on at the end of the cycle that ran it.
bool becomeLeafAfterThisCycle = false;

// The become_leaf command, once its result is on its way: the device forgets
// its device key (the server gives its bin a new one) and wakes a second
// later as a leaf. Everything else stays: the organization, the location, the
// calibration and the organization key its leaf keys come from. A deep sleep,
// not a restart, so a result still queued in RTC memory goes out as a leaf.
void becomeLeafIfAsked() {
    if (!becomeLeafAfterThisCycle) {
        return;
    }
    preferences.begin("credentials", false);
    preferences.remove("deviceKey");
    preferences.putUChar("role", ROLE_LEAF);
    preferences.end();
    Serial.println("🌿 This device is now a mesh leaf; it wakes as one in a second.");
    Serial.flush();
    cutModemPower();
    esp_sleep_enable_timer_wakeup(1000000ULL);
    esp_deep_sleep_start();
}

// Gateway or leaf, once the setup page has given the organization. A device
// with a device key registered as a gateway and stays one: a SIM that fails
// later is a fault to report, not a reason to turn into a leaf the server does
// not know as one. Otherwise the SIM card decides, at the first start and, for
// a leaf, at every restart (not at a wake from deep sleep), since a SIM is put
// in with the device open and usually restarted; a leaf that finds one becomes
// a gateway and registers. The modem stays on after the check; a leaf turns it off.
void decideDeviceRole() {
    if (deviceKey.length() > 0) {
        if (deviceRole != ROLE_GATEWAY) {
            saveDeviceRole(ROLE_GATEWAY);
        }
        return;
    }
    const bool restarted = esp_reset_reason() != ESP_RST_DEEPSLEEP;
    if (deviceRole == ROLE_GATEWAY || (deviceRole == ROLE_LEAF && !restarted)) {
        return;
    }

    const SimCardState sim = probeSimCard();
    if (sim == SIM_PRESENT) {
        if (deviceRole == ROLE_LEAF) {
            Serial.println("📶 This leaf found a SIM card: it becomes a gateway and registers.");
        }
        saveDeviceRole(ROLE_GATEWAY);
    } else if (sim == SIM_ABSENT) {
        if (deviceRole != ROLE_LEAF) {
            Serial.println("🌿 No SIM card: this device is a mesh leaf.");
            saveDeviceRole(ROLE_LEAF);
        }
    } else if (deviceRole == ROLE_UNKNOWN) {
        // A modem that does not answer says nothing about the SIM: no role yet.
        cutModemPower();
        enterDeepSleepForSetupRetry(ROLE_RETRY_SLEEP_SECONDS, "Could not tell whether a SIM card is in");
    }
}
