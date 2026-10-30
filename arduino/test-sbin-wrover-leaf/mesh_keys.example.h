// The mesh keys of one leaf (2m). The real file is mesh_keys.h, next to this
// sketch, made for the board it is flashed to by the server's script:
//
//   cd server
//   node scripts/mesh-keys.mjs <organization ID> <this board's MAC> \
//        --out ../arduino/test-sbin-wrover-leaf/mesh_keys.h
//
// (the MAC as the app shows it for this leaf). The real file is a secret and is
// never committed; this one only shows its shape.
#pragma once
#include <stdint.h>

constexpr uint8_t MESH_KEY_ID = 1;
constexpr uint8_t MESH_KEY_MAC[6] = {0, 0, 0, 0, 0, 0};
constexpr uint8_t MESH_LEAF_KEY[32] = {0};
constexpr uint8_t MESH_BEACON_KEY[32] = {0};
