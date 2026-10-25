// The server sends and takes every location as [lng, lat] (GeoJSON order),
// while Leaflet, the address bar and people write [lat, lng]. A location is
// turned around here, where it meets one of them.

// The same location gives the same array: a marker given a new array on every
// render counts as moved, and the marker group takes it out and back in.
const latLngs = new WeakMap()
export function toLatLng(lngLat) {
    let latLng = latLngs.get(lngLat)
    if (!latLng) {
        latLng = [lngLat[1], lngLat[0]]
        latLngs.set(lngLat, latLng)
    }
    return latLng
}

export const toLngLat = ([lat, lng]) => [lng, lat]

const EARTH_RADIUS_M = 6371008.8

// The distance in meters between two [lng, lat] locations.
export function distanceMeters([lng1, lat1], [lng2, lat2]) {
    const rad = Math.PI / 180
    const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}
