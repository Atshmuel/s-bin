import { AttributionControl, MapContainer, TileLayer } from "react-leaflet"
import MapControls from "./controls/MapControls"
import MapKeyPanel from "./controls/MapKeyPanel"
import { useMapSettings } from "@/hooks/useMapSettings"
import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

function MapComponent({ children, center, zoom = 13, legend = false, legendForm = false, isLoading = false, ...props }) {
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
        // the map's panel buttons at the same height.
        <MapContainer center={center} zoom={zoom} minZoom={4} className="h-full w-full relative" ref={setMap}
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
