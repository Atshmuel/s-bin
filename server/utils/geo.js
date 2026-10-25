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

const EARTH_RADIUS_M = 6371008.8;

// The distance in meters between two [lng, lat] locations.
export function distanceMeters([lng1, lat1], [lng2, lat2]) {
    const rad = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// Whether a value is a [lng, lat] location.
export function isLngLat(location) {
    return Array.isArray(location) && location.length === 2 &&
        location.every(value => typeof value === "number" && Number.isFinite(value)) &&
        Math.abs(location[0]) <= 180 && Math.abs(location[1]) <= 90;
}
