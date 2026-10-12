#include "globals.h"

// Mesh gateway: while the mesh window is open, a task on core 0 broadcasts
// beacons and takes custody of leaf readings, while setup()/loop() keep doing
// the blocking cellular work on core 1. Readings wait in RTC memory (they
// survive deep sleep) until the server confirms them over MQTT.

using namespace sbinmesh;

namespace {
constexpr uint8_t RELAY_QUEUE_SIZE = 16;
constexpr uint32_t BEACON_INTERVAL_MS = 500;
constexpr uint32_t MESH_TASK_STACK_BYTES = 6144;
constexpr unsigned long RELAY_RESULT_TIMEOUT_MS = 5000;
// A boot this close to the stored slot is the wake-up for that slot.
constexpr int64_t SLOT_MATCH_SECONDS = 600;

MeshRadio meshRadio;
DuplicateFilter duplicateFilter;
SemaphoreHandle_t relayQueueMutex = nullptr;
SemaphoreHandle_t meshWindowDone = nullptr;
volatile bool meshTaskRunning = false;
bool meshWindowStarted = false;
uint32_t meshWindowEndMs = 0;
uint64_t meshWindowSlotEpoch = 0;
}

RTC_DATA_ATTR RelayRecord relayQueue[RELAY_QUEUE_SIZE];
RTC_DATA_ATTR uint8_t relayQueueCount = 0;
RTC_DATA_ATTR uint32_t beaconSeq = 0;

namespace {
bool sameReading(const RelayRecord& record, const uint8_t origin[MAC_LENGTH], uint32_t messageId) {
    return record.data.header.messageId == messageId &&
           macEquals(record.data.header.origin, origin);
}

bool relayQueueContains(const uint8_t origin[MAC_LENGTH], uint32_t messageId) {
    xSemaphoreTake(relayQueueMutex, portMAX_DELAY);
    bool found = false;
    for (uint8_t i = 0; i < relayQueueCount && !found; i++) {
        found = sameReading(relayQueue[i], origin, messageId);
    }
    xSemaphoreGive(relayQueueMutex);
    return found;
}

void storeRelayRecord(const RelayRecord& record) {
    xSemaphoreTake(relayQueueMutex, portMAX_DELAY);
    if (relayQueueCount == RELAY_QUEUE_SIZE) {
        // Keep the newest readings; the oldest is the least useful.
        memmove(&relayQueue[0], &relayQueue[1], sizeof(RelayRecord) * (RELAY_QUEUE_SIZE - 1));
        relayQueueCount--;
        Serial.println("⚠️ Relay queue full; dropped the oldest leaf reading.");
    }
    relayQueue[relayQueueCount++] = record;
    xSemaphoreGive(relayQueueMutex);
}

void removeRelayRecord(const uint8_t origin[MAC_LENGTH], uint32_t messageId) {
    xSemaphoreTake(relayQueueMutex, portMAX_DELAY);
    for (uint8_t i = 0; i < relayQueueCount; i++) {
        if (sameReading(relayQueue[i], origin, messageId)) {
            memmove(&relayQueue[i], &relayQueue[i + 1], sizeof(RelayRecord) * (relayQueueCount - i - 1));
            relayQueueCount--;
            break;
        }
    }
    xSemaphoreGive(relayQueueMutex);
}

// The slot leaves should wake for next: the earliest known wake time after
// the slot this window belongs to. Before this cycle's server ack that is
// followingWakeEpoch; after it, the updated nextWakeEpoch.
uint32_t leafWakeEpochToAdvertise() {
    const uint64_t now = static_cast<uint64_t>(time(nullptr));
    const uint64_t after = max(meshWindowSlotEpoch, now);
    uint64_t best = 0;
    for (const uint64_t candidate : {nextWakeEpoch, followingWakeEpoch}) {
        if (candidate > after && (best == 0 || candidate < best)) {
            best = candidate;
        }
    }
    return static_cast<uint32_t>(best);
}

void sendBeacon() {
    if (!isSystemClockValid()) {
        return;  // leaves take their time from beacons; never send a bad one
    }
    BeaconPacket beacon = {};
    meshRadio.initHeader(beacon.header, PACKET_BEACON);
    beacon.hopsToGateway = 0;
    beacon.beaconSeq = beaconSeq;
    struct timeval now;
    gettimeofday(&now, nullptr);
    beacon.epochMs = static_cast<uint64_t>(now.tv_sec) * 1000ULL + now.tv_usec / 1000;
    beacon.nextWakeEpoch = leafWakeEpochToAdvertise();
    beacon.meshWindowSeconds = static_cast<uint8_t>(meshAwakeWindowSeconds);
    meshRadio.broadcast(&beacon, sizeof(beacon));
}

void handleMeshFrame(const ReceivedFrame& frame) {
    // Other gateways' beacons and stray ACKs are ignored by a gateway.
    const DataPacket* data = frame.as<DataPacket>(PACKET_DATA);
    if (data == nullptr) {
        return;
    }

    const uint8_t* origin = data->header.origin;
    const uint32_t messageId = data->header.messageId;
    const bool duplicate = duplicateFilter.checkAndRemember(origin, messageId) ||
                           relayQueueContains(origin, messageId);
    if (!duplicate) {
        RelayRecord record = {};
        record.data = *data;
        record.hops = static_cast<uint8_t>(data->header.hops + 1);
        record.rssi = frame.rssi;
        storeRelayRecord(record);
    }

    AckPacket ack = {};
    meshRadio.initHeader(ack.header, PACKET_ACK);
    memcpy(ack.ackedOrigin, origin, MAC_LENGTH);
    ack.ackedMessageId = messageId;
    ack.status = duplicate ? ACK_DUPLICATE : ACK_STORED;
    const bool acked = meshRadio.sendTo(frame.sender, &ack, sizeof(ack));

    char macText[18];
    formatMac(origin, macText);
    Serial.printf("%s Leaf %s reading %08lX (level %u%%, RSSI %d dBm)%s.\n",
                  duplicate ? "🔁 Duplicate of" : "📥 Stored", macText,
                  static_cast<unsigned long>(messageId), data->level, frame.rssi,
                  acked ? "" : "; ACK not confirmed");
}

void meshGatewayTask(void*) {
    uint32_t lastBeaconAt = millis() - BEACON_INTERVAL_MS;
    ReceivedFrame frame;
    while (static_cast<int32_t>(meshWindowEndMs - millis()) > 0) {
        if (millis() - lastBeaconAt >= BEACON_INTERVAL_MS) {
            sendBeacon();
            lastBeaconAt = millis();
        }
        if (meshRadio.receive(frame, 50)) {
            handleMeshFrame(frame);
        }
    }
    meshRadio.end();
    Serial.printf("📡 Mesh window closed; %u leaf reading(s) waiting for upload.\n", relayQueueCount);
    meshTaskRunning = false;
    xSemaphoreGive(meshWindowDone);
    vTaskDelete(nullptr);
}
}

// Opens this cycle's mesh window. Called first thing at boot and again at the
// start of each loop() cycle (cycles repeat without a reboot while USB is
// connected); it does nothing if the window was already opened this cycle.
void beginMeshWindow() {
    if (meshWindowStarted || ownerId.length() == 0) {
        return;
    }
    meshWindowStarted = true;
    if (relayQueueMutex == nullptr) {
        relayQueueMutex = xSemaphoreCreateMutex();
    }
    if (meshWindowDone == nullptr) {
        meshWindowDone = xSemaphoreCreateBinary();
    }
    if (relayQueueMutex == nullptr || meshWindowDone == nullptr ||
        !meshRadio.begin(ownerId.c_str())) {
        Serial.println("❌ Mesh radio unavailable; no mesh window this cycle.");
        return;
    }

    const int64_t now = static_cast<int64_t>(time(nullptr));
    meshWindowSlotEpoch =
        isSystemClockValid() && llabs(static_cast<int64_t>(nextWakeEpoch) - now) <= SLOT_MATCH_SECONDS
            ? nextWakeEpoch
            : 0;
    meshWindowEndMs = millis() + meshAwakeWindowSeconds * 1000UL;
    beaconSeq++;
    xSemaphoreTake(meshWindowDone, 0);
    meshTaskRunning = true;
    if (xTaskCreatePinnedToCore(meshGatewayTask, "meshGateway", MESH_TASK_STACK_BYTES,
                                nullptr, 2, nullptr, 0) != pdPASS) {
        meshTaskRunning = false;
        meshRadio.end();
        Serial.println("❌ Could not start the mesh task.");
        return;
    }
    Serial.printf("📡 Mesh window open for %lu s (beacon #%lu, leaves wake next at %lu).\n",
                  static_cast<unsigned long>(meshAwakeWindowSeconds),
                  static_cast<unsigned long>(beaconSeq),
                  static_cast<unsigned long>(leafWakeEpochToAdvertise()));
}

// Waits for the window to close, then uploads the readings received in it.
void endMeshWindow() {
    if (!meshWindowStarted) {
        return;
    }
    if (meshTaskRunning) {
        const uint32_t remainingMs = static_cast<int32_t>(meshWindowEndMs - millis()) > 0
            ? meshWindowEndMs - millis()
            : 0;
        xSemaphoreTake(meshWindowDone, pdMS_TO_TICKS(remainingMs + 5000));
    }
    meshWindowStarted = false;
    uploadRelayedReadings();
}

// Uploads queued leaf readings; each is removed only once the server answered.
void uploadRelayedReadings() {
    if (relayQueueMutex == nullptr || !mqttClient.connected() || deviceKey.length() == 0) {
        return;
    }
    while (true) {
        RelayRecord record;
        xSemaphoreTake(relayQueueMutex, portMAX_DELAY);
        const bool hasRecord = relayQueueCount > 0;
        if (hasRecord) {
            record = relayQueue[0];
        }
        xSemaphoreGive(relayQueueMutex);
        if (!hasRecord) {
            return;
        }

        const RelayUploadResult result = publishRelayRecord(record, RELAY_RESULT_TIMEOUT_MS);
        if (result == RELAY_NO_REPLY) {
            Serial.println("⚠️ No relay result from the server; leaf readings stay queued.");
            return;
        }
        removeRelayRecord(record.data.header.origin, record.data.header.messageId);
    }
}
