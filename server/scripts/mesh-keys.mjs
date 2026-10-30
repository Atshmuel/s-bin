// Writes one leaf's mesh keys as the firmware's mesh_keys.h, from its
// organization's key (made first if the organization has none): for a bench
// leaf flashed with them. The keys go only to the file; nothing secret is printed.
//
//   node scripts/mesh-keys.mjs <organization ID> <leaf MAC> --out <mesh_keys.h> [--rotate]
//
// The MAC is the leaf's own, as the app shows it for a leaf. --rotate first
// makes a new generation of the organization's key: its gateways take it with
// their next report, and every leaf needs its keys made again.
import { existsSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import "../db/models/models.js";
import { ensureMeshKey, rotateMeshKey } from "../db/service/meshKeyService.js";
import { isMacAddress, meshKeysHeader } from "../utils/meshKeys.js";

dotenv.config({ quiet: true });

const args = process.argv.slice(2);
const rotate = args.includes("--rotate");
const outIndex = args.indexOf("--out");
const out = outIndex >= 0 ? args[outIndex + 1] : null;
const [orgId, mac] = args.filter((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--out");

if (!orgId || !mac || !out) {
    console.error("Usage: node scripts/mesh-keys.mjs <organization ID> <leaf MAC> --out <mesh_keys.h> [--rotate]");
    process.exit(1);
}
// Everything is checked before the key is touched: a --rotate must not happen for a typo.
if (!mongoose.Types.ObjectId.isValid(orgId)) {
    console.error("That is not an organization ID.");
    process.exit(1);
}
if (!isMacAddress(mac)) {
    console.error("That is not a MAC address (like 28:84:85:38:66:44).");
    process.exit(1);
}
if (!existsSync(dirname(out))) {
    console.error(`The folder of ${out} does not exist.`);
    process.exit(1);
}

await mongoose.connect(process.env.DB_URL);
try {
    const key = rotate ? await rotateMeshKey(orgId) : await ensureMeshKey(orgId);
    if (!key) {
        console.error("No such organization.");
        process.exit(1);
    }
    writeFileSync(out, meshKeysHeader({ organizationKey: key.meshKey, keyId: key.meshKeyId, mac }), { mode: 0o600 });
    console.log(`Wrote the keys of ${mac} (generation ${key.meshKeyId}${rotate ? ", rotated" : ""}) to ${out}.`);
} catch (error) {
    console.error(error?.message ?? error);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
