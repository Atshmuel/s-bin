import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import L from "leaflet"
import { Marker, Popup, useMap } from "react-leaflet"
import { SlidersHorizontal, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMapSettings } from "@/hooks/useMapSettings"
import { USER_MARKER_MS } from "@/utils/constants"
import MapDisplayOptions from "./MapDisplayOptions"
import MapSearchForm from "./MapSearchForm"

const LOCATION_ERRORS = { 1: "locationDenied", 2: "locationUnavailable", 3: "locationTimeout" }

// The map's actions: search and route (where the page allows them) and display
// options, behind one button in a corner; MapKeyPanel explains the colors.
function MapControls({ legendForm = false }) {
    const { t } = useTranslation()
    const map = useMap()
    const { openPanel, setOpenPanel } = useMapSettings()
    const isOpen = openPanel === "controls"
    const panelId = useId()
    const panelRef = useRef(null)
    const [userMarker, setUserMarker] = useState(null)

    // Clicks, drags and scrolls in the panel (a slider, its list) stay off the map.
    useEffect(() => {
        if (!panelRef.current) return
        L.DomEvent.disableClickPropagation(panelRef.current)
        L.DomEvent.disableScrollPropagation(panelRef.current)
    }, [isOpen])

    useEffect(() => {
        if (!userMarker) return
        const timer = setTimeout(() => setUserMarker(null), USER_MARKER_MS)
        return () => clearTimeout(timer)
    }, [userMarker])

    function locateMe() {
        if (!navigator.geolocation) {
            toast.error(t("mapLegend.errors.gepError"))
            return
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = { lat: position.coords.latitude, lng: position.coords.longitude }
                map.flyTo(location, 17)
                setUserMarker(location)
            },
            (error) => toast.error(t(`mapLegend.errors.${LOCATION_ERRORS[error.code] ?? "unknownError"}`)),
        )
    }

    return (
        // The column spans the map's height, so a panel scrolls inside it
        // instead of growing past the top.
        <div className="pointer-events-none absolute top-8 right-2 bottom-2 z-[400] flex flex-col items-end justify-end gap-2">
            {isOpen && (
                <div id={panelId} ref={panelRef}
                    className="pointer-events-auto flex min-h-0 w-72 max-w-[calc(100vw-3rem)] flex-col gap-4 overflow-y-auto rounded-lg border bg-background/95 p-4 text-foreground shadow-lg backdrop-blur">
                    {legendForm && (
                        <>
                            <MapSearchForm map={map} userMarker={userMarker} />
                            <Separator />
                        </>
                    )}
                    <MapDisplayOptions onLocate={locateMe} />
                </div>
            )}
            <Button type="button" size="icon" variant="secondary" className="pointer-events-auto shrink-0 shadow-md"
                aria-expanded={isOpen} aria-controls={panelId}
                aria-label={t(isOpen ? "mapLegend.close" : "mapLegend.open")}
                title={t(isOpen ? "mapLegend.close" : "mapLegend.open")}
                onClick={() => setOpenPanel(isOpen ? null : "controls")}>
                {isOpen ? <X /> : <SlidersHorizontal />}
            </Button>

            {userMarker && (
                <Marker position={userMarker}>
                    <Popup>{t("mapLegend.locations.youAreHere")}</Popup>
                </Marker>
            )}
        </div>
    )
}

export default MapControls
