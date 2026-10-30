#include "globals.h"

// The organization's mesh key (2m): the server gives it in the registration
// reply and in an ack, and it is kept in flash. The generation before stays
// valid for a rotation's sake (leaves not yet set up again still sign with it).
// It is only read at boot, before the mesh window's task starts, so the task
// never sees it change.

namespace {
sbinmesh::Key currentKey = {};
sbinmesh::Key previousKey = {};
uint8_t currentKeyId = 0;   // 0: no key yet
uint8_t previousKeyId = 0;
// A first key that arrived mid-cycle, after the mesh window was left out for want of it.
bool firstKeyThisCycle = false;
constexpr char RESTART_FLAG[] = "meshKeyRestart";

int hexDigit(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

// 64 hex characters and nothing else.
bool parseKeyHex(const char* hex, sbinmesh::Key& out) {
    if (hex == nullptr || strlen(hex) != sbinmesh::KEY_LENGTH * 2) {
        return false;
    }
    for (size_t i = 0; i < sbinmesh::KEY_LENGTH; i++) {
        const int high = hexDigit(hex[2 * i]);
        const int low = hexDigit(hex[2 * i + 1]);
        if (high < 0 || low < 0) {
            return false;
        }
        out.bytes[i] = static_cast<uint8_t>(high << 4 | low);
    }
    return true;
}
}

void loadMeshKeys() {
    preferences.begin("credentials", true);
    currentKeyId = preferences.getUChar("meshKeyId", 0);
    if (preferences.getBytes("meshKey", currentKey.bytes, sbinmesh::KEY_LENGTH) != sbinmesh::KEY_LENGTH) {
        currentKeyId = 0;
    }
    previousKeyId = preferences.getUChar("meshPrevId", 0);
    if (preferences.getBytes("meshPrevKey", previousKey.bytes, sbinmesh::KEY_LENGTH) != sbinmesh::KEY_LENGTH) {
        previousKeyId = 0;
    }
    preferences.end();
}

// The generation this gateway holds, reported to the server (0: none).
uint8_t meshKeyGeneration() {
    return currentKeyId;
}

void applyMeshKeys(sbinmesh::MeshAuth& auth) {
    auth.useOrganizationKey(currentKey, currentKeyId,
                            previousKeyId != 0 ? &previousKey : nullptr, previousKeyId);
}

// A key from the server's registration reply or ack. The one it replaces stays
// as the previous generation; the new one is used from the next boot on.
void storeMeshKeyFromServer(const char* keyHex, int keyId) {
    sbinmesh::Key key;
    if (keyId < 1 || keyId > 255 || !parseKeyHex(keyHex, key)) {
        Serial.println("⚠️ The server sent an invalid mesh key; ignored.");
        return;
    }
    if (keyId == currentKeyId) {
        return;
    }
    const bool hadKey = currentKeyId != 0;
    preferences.begin("credentials", false);
    if (hadKey) {
        preferences.putBytes("meshPrevKey", currentKey.bytes, sbinmesh::KEY_LENGTH);
        preferences.putUChar("meshPrevId", currentKeyId);
    }
    preferences.putBytes("meshKey", key.bytes, sbinmesh::KEY_LENGTH);
    preferences.putUChar("meshKeyId", static_cast<uint8_t>(keyId));
    preferences.end();
    if (hadKey) {
        previousKey = currentKey;
        previousKeyId = currentKeyId;
    }
    currentKey = key;
    currentKeyId = static_cast<uint8_t>(keyId);
    firstKeyThisCycle = !hadKey;
    Serial.printf("🔑 Mesh key generation %d saved%s.\n", keyId,
                  hadKey ? " (the one before stays valid; the new one is used from the next cycle)" : "");
}

// The first key arrives after this cycle's mesh window was left out for want
// of it: the cycle starts again, once, so the window runs with the key instead
// of leaves waiting a whole slot. The flag lives in flash (RAM does not survive
// a restart), so a key that cannot be loaded does not restart it forever.
void restartIfMeshKeyIsNew(bool meshWindowRan) {
    if (!firstKeyThisCycle || meshWindowRan) {
        return;
    }
    preferences.begin("credentials", false);
    const bool alreadyTried = preferences.getBool(RESTART_FLAG, false);
    if (!alreadyTried) {
        preferences.putBool(RESTART_FLAG, true);
    }
    preferences.end();
    if (alreadyTried) {
        Serial.println("⚠️ A mesh key arrived, but a restart for it did not open the window; waiting for the next slot.");
        return;
    }
    Serial.println("🔑 Restarting once, so the mesh window runs with the new key.");
    Serial.flush();
    delay(500);
    ESP.restart();
}

// A mesh window opened with the key: the restart (if any) worked.
void clearMeshKeyRestartFlag() {
    preferences.begin("credentials", false);
    if (preferences.isKey(RESTART_FLAG)) {
        preferences.remove(RESTART_FLAG);
    }
    preferences.end();
}
