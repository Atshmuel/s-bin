#pragma once

#include <stdint.h>

// Shared by gateways and leaves: the names the server knows a restart by.

namespace sbinmesh {

// ESP-IDF's esp_reset_reason_t as the server's resetReason text.
const char* resetReasonName(uint8_t reason);

}  // namespace sbinmesh
