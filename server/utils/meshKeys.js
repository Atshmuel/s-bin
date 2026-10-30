import { createHmac, randomBytes } from "node:crypto";
import { MESH_KEY_BYTES, MESH_KEY_ID_COUNT } from "./constants.js";

// The mesh's keys (2m). The server makes one secret for each organization and
// gives it to the organization's gateways; a leaf only gets keys derived from
// it, so a stolen leaf speaks only as itself. The firmware derives the same
// ones (SbinMeshAuth.cpp): keep the labels in step, the tests share its vectors.

const LEAF_KEY_LABEL = "S-Bin mesh leaf key v1";
const BEACON_KEY_LABEL = "S-Bin mesh beacon key v1";
const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export const isMacAddress = value => typeof value === "string" && MAC_ADDRESS_PATTERN.test(value);

// A key as 64 lowercase hex characters.
export const isMeshKey = value => typeof value === "string" && new RegExp(`^[0-9a-f]{${MESH_KEY_BYTES * 2}}$`).test(value);

export const generateMeshKey = () => randomBytes(MESH_KEY_BYTES).toString("hex");

// The generation after this one (IDs run 1 to 255 and wrap; 0 is no key).
export const nextMeshKeyId = id => ((Number.isInteger(id) ? id : 0) % MESH_KEY_ID_COUNT) + 1;

const hmacHex = (keyHex, data) => createHmac("sha256", Buffer.from(keyHex, "hex")).update(data).digest("hex");

// A leaf's own key, from the organization's key and the leaf's MAC (as the
// app shows a leaf's: the radio's own address).
export function deriveLeafKey(organizationKey, mac) {
    if (!isMeshKey(organizationKey) || !isMacAddress(mac)) {
        throw new Error("deriveLeafKey needs a mesh key and a MAC address.");
    }
    return hmacHex(organizationKey, Buffer.concat([Buffer.from(LEAF_KEY_LABEL), Buffer.from(mac.replaceAll(":", ""), "hex")]));
}

// The key every beacon of the organization is signed with.
export function deriveBeaconKey(organizationKey) {
    if (!isMeshKey(organizationKey)) throw new Error("deriveBeaconKey needs a mesh key.");
    return hmacHex(organizationKey, BEACON_KEY_LABEL);
}

const cArray = hex => `{${hex.match(/../g).map(byte => `0x${byte}`).join(", ")}}`;

// The keys of one leaf as the firmware's mesh_keys.h (see mesh_keys.example.h):
// flashed with the leaf's sketch, never committed.
export function meshKeysHeader({ organizationKey, keyId, mac }) {
    return [
        `// The mesh keys of the leaf ${mac}, made by server/scripts/mesh-keys.mjs.`,
        "// A secret: never commit this file.",
        "#pragma once",
        "#include <stdint.h>",
        "",
        `constexpr uint8_t MESH_KEY_ID = ${keyId};`,
        `constexpr uint8_t MESH_LEAF_KEY[32] = ${cArray(deriveLeafKey(organizationKey, mac))};`,
        `constexpr uint8_t MESH_BEACON_KEY[32] = ${cArray(deriveBeaconKey(organizationKey))};`,
        "",
    ].join("\n");
}
