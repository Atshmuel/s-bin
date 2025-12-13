import { MapContainer, TileLayer } from "react-leaflet"
import MapLegend from "./MapLegend"
import { useMapSettings } from "@/contexts/mapContext"
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
        <MapContainer center={center} zoom={zoom} className="h-full w-full relative" ref={setMap} {...props}>
            <TileLayer attribution={attribution} url={tileUrl} />
            {legend ? <MapLegend legendForm={legendForm} /> : null}
            {children}
        </MapContainer>
    )
}

export default MapComponent
