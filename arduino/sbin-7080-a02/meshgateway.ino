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
// The server needs a few seconds per relayed reading (the public broker both
// ways and several database writes).
constexpr unsigned long RELAY_RESULT_TIMEOUT_MS = 10000;
// A slow reply does not end the upload: the reading is sent again (the server
// recognises the repeat by its message ID) until the server stays silent this
// many times in a row...
constexpr uint8_t RELAY_MAX_SILENT_REPLIES = 3;
// ...or this cycle's uploads (after the report and after the window) have run
// this long together, so a slow server cannot keep the gateway awake.
constexpr unsigned long RELAY_UPLOAD_BUDGET_MS = 60000;
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
// Relay upload time used this cycle, against RELAY_UPLOAD_BUDGET_MS.
unsigned long relayUploadSpentMs = 0;
}

RTC_DATA_ATTR RelayRecord relayQueue[RELAY_QUEUE_SIZE];
// The server's latest list of commands for this gateway's leaves (see
// setLeafInstructions()); guarded by relayQueueMutex like the relay queue.
RTC_DATA_ATTR LeafInstruction leafInstructions[MAX_LEAF_INSTRUCTIONS];
RTC_DATA_ATTR uint8_t leafInstructionCount = 0;
RTC_DATA_ATTR uint8_t relayQueueCount = 0;
RTC_DATA_ATTR uint32_t beaconSeq = 0;

namespace {
bool sameReading(const RelayRecord& record, const uint8_t origin[MAC_LENGTH], uint32_t messageId) {
    return record.data.header.messageId == messageId &&
           macEquals(record.data.header.origin, origin);
}

// The mutex guarding the relay queue and the leaf commands, shared by the mesh
// task and the MQTT callbacks; false when it could not be created.
bool ensureMeshMutex() {
    if (relayQueueMutex == nullptr) {
        relayQueueMutex = xSemaphoreCreateMutex();
    }
    return relayQueueMutex != nullptr;
}

// Puts the leaf's pending command, if any, into its ACK.
void attachLeafInstruction(AckPacket& ack, const uint8_t leafMac[MAC_LENGTH]) {
    xSemaphoreTake(relayQueueMutex, portMAX_DELAY);
    for (uint8_t i = 0; i < leafInstructionCount; i++) {
        if (macEquals(leafInstructions[i].leafMac, leafMac)) {
            memcpy(ack.instructionId, leafInstructions[i].id, INSTRUCTION_ID_LENGTH);
            ack.instructionType = leafInstructions[i].type;
            ack.instructionValue = leafInstructions[i].value;
            break;
        }
    }
    xSemaphoreGive(relayQueueMutex);
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
        if (candidate > after && candidate <= now + MAX_WAKE_AHEAD_SECONDS &&
            (best == 0 || candidate < best)) {
            best = candidate;
        }
    }
    // No fresh slot from the server (the last cycle got no reply, or a reset
    // cleared followingWakeEpoch): continue the stored slot pattern rather
    // than advertise 0 and send every leaf into a cold join.
    if (best == 0 && nextWakeEpoch > 0 && nextWakeEpoch <= after && slotPeriodSeconds > 0) {
        const uint64_t periodsAfter = (after - nextWakeEpoch) / slotPeriodSeconds + 1;
        best = nextWakeEpoch + periodsAfter * slotPeriodSeconds;
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
    beacon.epochMs = static_cast<uint64_t>(epochMsNow());
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
        // The leaf sends the reading's age; this gateway's clock is network
        // time (no window opens without it), so the reading's UTC time is fixed
        // here and stays right however long the record waits for upload.
        const time_t now = time(nullptr);
        if (isSystemClockValid() && static_cast<time_t>(data->ageSeconds) < now) {
            record.measuredAtEpoch = static_cast<uint32_t>(now - data->ageSeconds);
        }
        storeRelayRecord(record);
    }

    AckPacket ack = {};
    meshRadio.initHeader(ack.header, PACKET_ACK);
    memcpy(ack.ackedOrigin, origin, MAC_LENGTH);
    ack.ackedMessageId = messageId;
    ack.status = duplicate ? ACK_DUPLICATE : ACK_STORED;
    attachLeafInstruction(ack, origin);
    const bool acked = meshRadio.sendTo(frame.sender, &ack, sizeof(ack));

    char macText[18];
    formatMac(origin, macText);
    Serial.printf("%s Leaf %s reading %08lX (level %u%%, RSSI %d dBm, taken %lu s ago)%s%s%s.\n",
                  duplicate ? "🔁 Duplicate of" : "📥 Stored", macText,
                  static_cast<unsigned long>(messageId), data->level, frame.rssi,
                  static_cast<unsigned long>(data->ageSeconds),
                  data->resultStatus != RESULT_NONE ? ", with a command result" : "",
                  ack.instructionType != INSTRUCTION_NONE ? "; handed it a command" : "",
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

// Opens this cycle's mesh window, once the clock is synced at boot (every
// cycle is one boot: the board always deep-sleeps between cycles). Without
// network time this cycle (or the clock the server set,
// carried over) no window is opened: leaves would learn this gateway's
// drifted clock and wake at the wrong time.
void beginMeshWindow() {
    if (ownerId.length() == 0) {
        return;
    }
    if (!clockSynced) {
        Serial.println("⚠️ No network time this cycle; skipping the mesh window.");
        return;
    }
    meshWindowStarted = true;
    ensureMeshMutex();
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
    const unsigned long startedAt = millis();
    uint8_t silentReplies = 0;
    while (true) {
        const unsigned long usedMs = relayUploadSpentMs + (millis() - startedAt);
        if (usedMs >= RELAY_UPLOAD_BUDGET_MS) {
            Serial.printf("⚠️ Relay upload time is up; %u leaf reading(s) stay queued.\n", relayQueueCount);
            break;
        }
        RelayRecord record;
        xSemaphoreTake(relayQueueMutex, portMAX_DELAY);
        const bool hasRecord = relayQueueCount > 0;
        if (hasRecord) {
            record = relayQueue[0];
        }
        xSemaphoreGive(relayQueueMutex);
        if (!hasRecord) {
            break;
        }

        const unsigned long timeoutMs = min(RELAY_RESULT_TIMEOUT_MS, RELAY_UPLOAD_BUDGET_MS - usedMs);
        const RelayUploadResult result = publishRelayRecord(record, timeoutMs);
        if (result == RELAY_NO_REPLY) {
            if (++silentReplies >= RELAY_MAX_SILENT_REPLIES) {
                Serial.println("⚠️ No relay result from the server; leaf readings stay queued.");
                break;
            }
            Serial.println("⏳ No relay result yet; sending the reading again.");
            continue;
        }
        silentReplies = 0;
        removeRelayRecord(record.data.header.origin, record.data.header.messageId);
    }
    relayUploadSpentMs += millis() - startedAt;
}

// Replaces the leaf commands with the server's latest list (from the
// instruction check), which stays the reference: a command the server has
// finished or cancelled drops out at the next check.
void setLeafInstructions(const LeafInstruction* instructions, uint8_t count) {
    if (!ensureMeshMutex()) {
        return;
    }
    xSemaphoreTake(relayQueueMutex, portMAX_DELAY);
    leafInstructionCount = min(count, MAX_LEAF_INSTRUCTIONS);
    memcpy(leafInstructions, instructions, sizeof(LeafInstruction) * leafInstructionCount);
    xSemaphoreGive(relayQueueMutex);
    if (leafInstructionCount > 0) {
        Serial.printf("📥 Holding %u command(s) for leaves until their next reading.\n", leafInstructionCount);
    }
}
