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
