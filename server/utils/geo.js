import tzLookup from "tz-lookup";

// Every location the server stores, receives from the client or sends to it is
// GeoJSON order, [lng, lat]: what MongoDB's geo search, OSRM and VROOM read.
// Devices send [lat, lng]; that is turned around once, where their messages
// arrive (registration, telemetry, relay).
export function fromDeviceLocation([lat, lng]) {
    return [lng, lat];
}

// The time zone at a [lng, lat] location.
export function timeZoneAt([lng, lat]) {
    return tzLookup(lat, lng);
}

// Whether a value is a [lng, lat] location.
export function isLngLat(location) {
    return Array.isArray(location) && location.length === 2 &&
        location.every(value => typeof value === "number" && Number.isFinite(value)) &&
        Math.abs(location[0]) <= 180 && Math.abs(location[1]) <= 90;
}
