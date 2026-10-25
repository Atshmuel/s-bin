import { AttributionControl, MapContainer, TileLayer } from "react-leaflet"
import MapControls from "./controls/MapControls"
import MapKeyPanel from "./controls/MapKeyPanel"
import { useMapSettings } from "@/hooks/useMapSettings"
import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { MAP_FIT_MAX_ZOOM } from "@/utils/constants"

// `bounds` ([[south, west], [north, east]]) opens the map around a box
// instead of at `center` and `zoom`.
function MapComponent({ children, center, zoom = 13, bounds, legend = false, legendForm = false, isLoading = false, ...props }) {
    const { tile, setMap } = useMapSettings()

    const tileUrl = tile === "default"
        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

    const attribution = tile === "default"
        ? '&copy; OpenStreetMap contributors'
        : 'Tiles &copy; Esri &mdash; Source: Esri, USGS'


    if (isLoading) {
        return <Card className="h-full w-full relative">
            <Skeleton className="h-full w-full" />
        </Card>
    }

    return (
        // The attribution sits at the top right, leaving both bottom corners to
        // the map's panel buttons at the same height. `isolate` keeps Leaflet's
        // layer z-indexes (up to 1000) inside the map, so dialogs open above it.
        <MapContainer {...(bounds ? { bounds, boundsOptions: { maxZoom: MAP_FIT_MAX_ZOOM, padding: [32, 32] } } : { center, zoom })}
            minZoom={4} className="isolate h-full w-full relative" ref={setMap}
            attributionControl={false} {...props}>
            <AttributionControl position="topright" />
            <TileLayer attribution={attribution} url={tileUrl} />
            {legend ? <MapControls legendForm={legendForm} /> : null}
            {legend ? <MapKeyPanel /> : null}
            {children}
        </MapContainer>
    )
}

export default MapComponent
