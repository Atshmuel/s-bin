// A device's diagnostics, as its reports send them (an optional `diagnostics`
// object; a relayed leaf's come inside its record). Each field is checked on
// its own: a wrong or unknown one is dropped, never the report, so a firmware
// sending something new or broken can never cost a reading.

const integer = (min, max) => value => Number.isInteger(value) && value >= min && value <= max;
const number = (min, max) => value => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const oneOf = (...values) => value => values.includes(value);
const text = (pattern, maxLength) => value => typeof value === "string" && value.length <= maxLength && pattern.test(value);

const MAX_MILLIVOLTS = 6000;
const MAX_STAGE_MS = 60 * 60 * 1000;
const HX711_COUNTS = 1 << 24;

// What the ESP32 says restarted it (esp_reset_reason) and woke it (esp_sleep_get_wakeup_cause).
export const RESET_REASONS = Object.freeze([
    "poweron", "external", "software", "panic", "interrupt_wdt", "task_wdt", "other_wdt",
    "deepsleep", "brownout", "sdio", "usb", "jtag", "efuse", "power_glitch", "cpu_lockup", "unknown",
]);
export const WAKE_CAUSES = Object.freeze(["timer", "ext0", "ext1", "touchpad", "ulp", "gpio", "uart", "undefined", "other"]);
// The AXP2101's charger.
export const CHARGER_STATES = Object.freeze(["none", "trickle", "precharge", "constant_current", "constant_voltage", "done", "stopped"]);

// Time per stage of this cycle up to the report, in ms.
const STAGE_FIELDS = Object.freeze({
    modemMs: integer(0, MAX_STAGE_MS),
    networkMs: integer(0, MAX_STAGE_MS),
    mqttMs: integer(0, MAX_STAGE_MS),
    slotWaitMs: integer(0, MAX_STAGE_MS),
    gpsMs: integer(0, MAX_STAGE_MS),
});

// The serving cell, as the SIM7080's AT+CPSI? reports it.
const NETWORK_FIELDS = Object.freeze({
    system: text(/^[\w\s.-]+$/, 24),          // e.g. "LTE CAT-M1"
    operator: text(/^\d{3}-\d{2,3}$/, 7),     // MCC-MNC, e.g. "425-01"
    band: text(/^[\w-]+$/, 24),               // e.g. "EUTRAN-BAND3"
    cellId: integer(0, 0xFFFFFFFF),
    tac: integer(0, 0xFFFFFF),
    rsrp: integer(-160, -20),
    rsrq: integer(-40, 0),
    sinr: integer(-30, 50),
    rssi: integer(-130, 0),
});

const DIAGNOSTIC_FIELDS = Object.freeze({
    firmwareVersion: text(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/, 11),
    resetReason: oneOf(...RESET_REASONS),
    wakeCause: oneOf(...WAKE_CAUSES),
    // The AXP2101's power-off and power-on source registers, as bits.
    pmuOffSource: integer(0, 255),
    pmuOnSource: integer(0, 255),
    batteryMv: integer(0, MAX_MILLIVOLTS),
    vbusMv: integer(0, MAX_MILLIVOLTS),        // USB or solar input
    systemMv: integer(0, MAX_MILLIVOLTS),
    charger: oneOf(...CHARGER_STATES),
    chipTempC: number(-40, 125),
    pmuTempC: number(-40, 125),
    // The A02's samples this reading: how many answered and how far apart.
    distanceSamples: integer(0, 20),
    distanceSpreadMm: integer(0, 10000),
    // The HX711's samples, its median raw counts and the zero (empty) point.
    scaleSpreadCounts: integer(0, HX711_COUNTS),
    scaleRawCounts: integer(-HX711_COUNTS / 2, HX711_COUNTS / 2),
    scaleZeroCounts: integer(-HX711_COUNTS / 2, HX711_COUNTS / 2),
    // What the gateway published to MQTT in its previous cycle.
    bytesSentLastCycle: integer(0, 10_000_000),
    // A leaf: the gateway's beacon as it heard it, its listening guard, the
    // beacons missed in a row and the drift its estimate misses.
    beaconRssi: integer(-128, 0),
    guardSeconds: integer(0, 24 * 60 * 60),
    missedCycles: integer(0, 255),
    residualPpm: integer(0, 100000),
});

const NESTED_FIELDS = Object.freeze({ stages: STAGE_FIELDS, network: NETWORK_FIELDS });

function cleanObject(value, fields) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    const kept = Object.entries(fields).filter(([field, isValid]) => value[field] !== undefined && isValid(value[field]));
    return kept.length ? Object.fromEntries(kept.map(([field]) => [field, value[field]])) : null;
}

// The valid fields of a report's diagnostics, or null when none is.
export function cleanDiagnostics(value) {
    const flat = cleanObject(value, DIAGNOSTIC_FIELDS) ?? {};
    for (const [field, fields] of Object.entries(NESTED_FIELDS)) {
        const nested = cleanObject(value?.[field], fields);
        if (nested) flat[field] = nested;
    }
    return Object.keys(flat).length ? flat : null;
}
