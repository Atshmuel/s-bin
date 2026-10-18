#pragma once

#include <stddef.h>
#include <stdint.h>

// Wire format shared by every S-Bin mesh node. All packets are packed and
// little-endian (every supported node is an ESP32), and fit in one ESP-NOW
// frame (250 bytes). Bump PROTOCOL_VERSION on any incompatible change.

namespace sbinmesh {

constexpr uint16_t PACKET_MAGIC = 0x4253;  // "SB"
constexpr uint8_t PROTOCOL_VERSION = 2;
constexpr uint8_t RADIO_CHANNEL = 1;
constexpr uint8_t DEFAULT_TTL = 4;
constexpr size_t MAX_FRAME_SIZE = 250;
constexpr size_t MAC_LENGTH = 6;

enum PacketType : uint8_t {
    PACKET_BEACON = 1,
    PACKET_DATA = 2,
    PACKET_ACK = 3,
};

enum AckStatus : uint8_t {
    ACK_STORED = 1,      // the gateway took custody of the reading
    ACK_DUPLICATE = 2,   // already stored earlier; the sender can drop it
    ACK_REJECTED = 3,    // will never be accepted; the sender should drop it
};

enum DataFlags : uint8_t {
    DATA_SENSOR_OK = 0x01,
    DATA_HAS_LOCATION = 0x02,
    DATA_CALIBRATION_FAILED = 0x04,
};

struct __attribute__((packed)) PacketHeader {
    uint16_t magic;
    uint8_t version;
    uint8_t type;
    uint32_t networkId;           // first 4 bytes of SHA-256(ownerId); a filter, not security
    uint8_t origin[MAC_LENGTH];   // node that created the packet
    uint32_t messageId;           // random per message; retries reuse it
    uint8_t hops;                 // radio hops travelled so far
    uint8_t ttl;                  // dropped when it reaches 0
};

// Broadcast by gateways (hopsToGateway = 0) during the mesh window.
struct __attribute__((packed)) BeaconPacket {
    PacketHeader header;
    uint8_t hopsToGateway;
    uint32_t beaconSeq;           // increases every cycle; only fresh routes are used
    uint64_t epochMs;             // sender's UTC time, the leaves' time source
    uint32_t nextWakeEpoch;       // when leaves should wake next (UTC seconds)
    uint8_t meshWindowSeconds;
    uint8_t parentMac[MAC_LENGTH];  // all zero for a gateway
};

// One telemetry reading from a leaf. The gateway turns it into the server's
// JSON log, including the health string built from the failure counters.
struct __attribute__((packed)) DataPacket {
    PacketHeader header;
    uint8_t flags;                // DataFlags
    uint8_t level;                // 0-100, valid when DATA_SENSOR_OK
    uint8_t battery;              // 0-100
    int16_t distanceMm;           // raw sensor distance, -1 when unavailable
    float latitude;               // valid when DATA_HAS_LOCATION
    float longitude;
    uint8_t sensorFailureCycles;
    uint8_t pmuFailureCycles;
    uint8_t gpsFailureCycles;
    uint16_t lastAwakeSeconds;    // previous cycle, 0 when unknown
    uint8_t meshAwakeWindowSeconds;
    int32_t driftPpm;
    // How long before this send the reading was taken: more than a cycle when
    // the leaf queued it after missing the gateway. An age rather than a time,
    // so it is right even before the leaf has learned the time.
    uint32_t ageSeconds;
};

// Sent back hop by hop along the path the DATA came from.
struct __attribute__((packed)) AckPacket {
    PacketHeader header;
    uint8_t ackedOrigin[MAC_LENGTH];
    uint32_t ackedMessageId;
    uint8_t status;               // AckStatus
};

static_assert(sizeof(PacketHeader) == 20, "PacketHeader layout changed");
static_assert(sizeof(BeaconPacket) <= MAX_FRAME_SIZE, "BeaconPacket too large");
static_assert(sizeof(DataPacket) <= MAX_FRAME_SIZE, "DataPacket too large");
static_assert(sizeof(AckPacket) <= MAX_FRAME_SIZE, "AckPacket too large");

}  // namespace sbinmesh
