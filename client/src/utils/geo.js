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
