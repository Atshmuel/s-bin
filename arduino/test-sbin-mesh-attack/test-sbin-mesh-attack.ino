// S-Bin mesh attack test (2m). TEST ONLY.
//
// Plays a compromised leaf against a real gateway: it hears one beacon, then in
// the same mesh window sends the gateway one genuine reading and a batch of
// forged ones. A forged reading the gateway accepts would be ACKed, so only the
// genuine one may be. Run it on the board whose keys are in mesh_keys.h (the
// WROVER), instead of the leaf sketch; copy that board's mesh_keys.h next to
// this file. The gateway has to open a window after the board is reset (RST).
//
// Board: "ESP32 Dev Module" (esp32:esp32:esp32). Serial monitor: 115200 baud.

#if __has_include("mesh_keys.h")
#include "mesh_keys.h"
#else
#error "mesh_keys.h is missing: copy this board's file from test-sbin-wrover-leaf."
#endif

#include <Preferences.h>
#include <SbinMesh.h>

using namespace sbinmesh;

namespace {
constexpr char ORGANIZATION_ID[] = "699760a44e48dff9a082101e";
// Another leaf's MAC, used as the origin the attacker claims (the second S3).
constexpr uint8_t VICTIM_MAC[MAC_LENGTH] = {0x28, 0x84, 0x85, 0x38, 0x66, 0x44};
constexpr uint32_t ACK_LISTEN_MS = 4000;
constexpr size_t FRAME_SIZE = sizeof(DataPacket) + TAG_LENGTH;
constexpr size_t CASE_COUNT = 11;

MeshRadio radio;
MeshAuth meshAuth;
Key leafKey;
Key beaconKey;
Preferences preferences;

struct Attack {
    const char* name;
    bool shouldBeAccepted;
    uint8_t frame[FRAME_SIZE];
    size_t length;
    uint32_t messageId;
    bool sent;
    bool acked;
};
Attack attacks[CASE_COUNT];
size_t attackCount = 0;

DataPacket makeReading(uint32_t nonce) {
    DataPacket reading = {};
    radio.initHeader(reading.header, PACKET_DATA);
    reading.beaconNonce = nonce;
    reading.flags = DATA_SENSOR_OK;
    reading.level = 42;
    reading.battery = 77;
    reading.distanceMm = 600;
    reading.diagnostics.firmwareVersion[0] = 2;
    return reading;
}

// Appends a tag made with `key` and `keyId` to the packet.
size_t signWith(DataPacket& packet, const Key& key, uint8_t keyId, uint8_t* out) {
    packet.header.keyId = keyId;
    memcpy(out, &packet, sizeof(packet));
    computeTag(key, out, sizeof(packet), out + sizeof(packet));
    return FRAME_SIZE;
}

Attack& add(const char* name, bool shouldBeAccepted, const DataPacket& packet) {
    Attack& attack = attacks[attackCount++];
    attack = {};
    attack.name = name;
    attack.shouldBeAccepted = shouldBeAccepted;
    attack.messageId = packet.header.messageId;
    return attack;
}

void buildAttacks(uint32_t nonce) {
    DataPacket packet;

    packet = makeReading(nonce);
    Attack* attack = &add("genuine reading (control)", true, packet);
    memcpy(attack->frame, &packet, sizeof(packet));
    attack->length = meshAuth.signData(attack->frame, sizeof(packet));

    packet = makeReading(nonce);
    attack = &add("one bit of the tag flipped", false, packet);
    attack->length = signWith(packet, leafKey, MESH_KEY_ID, attack->frame);
    attack->frame[sizeof(packet)] ^= 0x01;

    packet = makeReading(nonce);
    attack = &add("signed with the beacon key", false, packet);
    attack->length = signWith(packet, beaconKey, MESH_KEY_ID, attack->frame);

    Key random;
    for (size_t i = 0; i < KEY_LENGTH; i++) {
        random.bytes[i] = static_cast<uint8_t>(esp_random());
    }
    packet = makeReading(nonce);
    attack = &add("signed with a random key (an outsider)", false, packet);
    attack->length = signWith(packet, random, MESH_KEY_ID, attack->frame);

    packet = makeReading(nonce);
    attack = &add("key generation 2 (nobody holds it)", false, packet);
    attack->length = signWith(packet, leafKey, MESH_KEY_ID + 1, attack->frame);

    packet = makeReading(nonce ^ 0x5A5A5A5A);
    attack = &add("genuine tag, another window's nonce", false, packet);
    attack->length = signWith(packet, leafKey, MESH_KEY_ID, attack->frame);

    packet = makeReading(nonce);
    attack = &add("reading changed after it was signed", false, packet);
    attack->length = signWith(packet, leafKey, MESH_KEY_ID, attack->frame);
    attack->frame[offsetof(DataPacket, level)] = 99;

    packet = makeReading(nonce);
    attack = &add("no tag at all (an unsigned packet)", false, packet);
    memcpy(attack->frame, &packet, sizeof(packet));
    attack->length = sizeof(packet);

    packet = makeReading(nonce);
    attack = &add("tag cut by one byte", false, packet);
    attack->length = signWith(packet, leafKey, MESH_KEY_ID, attack->frame) - 1;

    packet = makeReading(nonce);
    memcpy(packet.header.origin, VICTIM_MAC, MAC_LENGTH);
    attack = &add("claims another leaf's MAC, signed with this key", false, packet);
    attack->length = signWith(packet, leafKey, MESH_KEY_ID, attack->frame);

    // A genuine reading kept from two runs ago (its window is long over).
    uint8_t old[FRAME_SIZE];
    if (preferences.getBytes("old2", old, FRAME_SIZE) == FRAME_SIZE) {
        packet = makeReading(nonce);
        attack = &add("genuine reading replayed from two windows ago", false, packet);
        memcpy(attack->frame, old, FRAME_SIZE);
        attack->length = FRAME_SIZE;
        memcpy(&attack->messageId, old + offsetof(PacketHeader, messageId), sizeof(uint32_t));
    }
}
}  // namespace

void setup() {
    Serial.begin(115200);
    delay(1500);
    Serial.println("=== S-Bin mesh attack test ===");

    if (!radio.begin(ORGANIZATION_ID)) {
        Serial.println("❌ Radio failed.");
        return;
    }
    memcpy(leafKey.bytes, MESH_LEAF_KEY, KEY_LENGTH);
    memcpy(beaconKey.bytes, MESH_BEACON_KEY, KEY_LENGTH);
    meshAuth.useLeafKeys(radio.macAddress(), leafKey, beaconKey, MESH_KEY_ID);
    radio.setAuth(&meshAuth);
    preferences.begin("attack", false);

    Serial.println("🔍 Waiting for a gateway beacon: press RST on the gateway.");
    ReceivedFrame frame;
    const BeaconPacket* beacon = nullptr;
    while (beacon == nullptr) {
        if (radio.receive(frame, 200)) {
            beacon = frame.as<BeaconPacket>(PACKET_BEACON);
        }
    }
    uint8_t gatewayMac[MAC_LENGTH];
    memcpy(gatewayMac, frame.sender, MAC_LENGTH);
    const uint32_t nonce = beacon->cycleNonce;
    char macText[18];
    formatMac(gatewayMac, macText);
    Serial.printf("📶 Beacon from %s, window %u s. Attacking.\n", macText, beacon->meshWindowSeconds);

    buildAttacks(nonce);
    for (size_t i = 0; i < attackCount; i++) {
        attacks[i].sent = radio.sendTo(gatewayMac, attacks[i].frame, attacks[i].length);
    }

    const uint32_t startedAt = millis();
    while (millis() - startedAt < ACK_LISTEN_MS) {
        if (!radio.receive(frame, 100)) {
            continue;
        }
        const AckPacket* ack = frame.as<AckPacket>(PACKET_ACK);
        if (ack == nullptr) {
            continue;
        }
        for (size_t i = 0; i < attackCount; i++) {
            if (attacks[i].messageId == ack->ackedMessageId) {
                attacks[i].acked = true;
            }
        }
    }

    size_t failures = 0;
    for (size_t i = 0; i < attackCount; i++) {
        const bool ok = attacks[i].sent && attacks[i].acked == attacks[i].shouldBeAccepted;
        failures += ok ? 0 : 1;
        Serial.printf("%s %-52s sent=%d acked=%d (expected %s)\n", ok ? "✅" : "❌", attacks[i].name,
                      attacks[i].sent, attacks[i].acked, attacks[i].shouldBeAccepted ? "ACK" : "no ACK");
    }
    if (attackCount < CASE_COUNT) {
        Serial.println("ℹ️ No old reading to replay yet: reset the gateway twice more and run again.");
    }
    Serial.printf(failures == 0 ? "✅ ALL %u CASES BEHAVED.\n" : "❌ %u CASE(S) FAILED.\n",
                  static_cast<unsigned>(failures == 0 ? attackCount : failures));

    // Keep the genuine reading to replay it two runs from now.
    uint8_t previous[FRAME_SIZE];
    if (preferences.getBytes("old1", previous, FRAME_SIZE) == FRAME_SIZE) {
        preferences.putBytes("old2", previous, FRAME_SIZE);
    }
    preferences.putBytes("old1", attacks[0].frame, FRAME_SIZE);
}

void loop() {
    delay(1000);
}
