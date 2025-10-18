import { MapContainer, TileLayer } from "react-leaflet"
import MapLegend from "./MapLegend"
import { useMapSettings } from "@/contexts/mapContext"

function MapComponent({ children, center = [32.980, 35.500], zoom = 13, legend = false, legendForm = false, ...props }) {
    const { tile, setMap } = useMapSettings()

    const tileUrl = tile === "default"
        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

    const attribution = tile === "default"
        ? '&copy; OpenStreetMap contributors'
        : 'Tiles &copy; Esri &mdash; Source: Esri, USGS'

    return (
        <MapContainer center={center} zoom={zoom} className="h-full w-full relative" ref={setMap} {...props}>
            <TileLayer className=""
                attribution={attribution}
                url={tileUrl}
            />
            {legend ? <MapLegend legendForm={legendForm} /> : null}
            {children}
        </MapContainer>
    )
}

export default MapComponent
