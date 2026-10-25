import { useEffect, useId, useRef } from "react"
import { useTranslation } from "react-i18next"
import L from "leaflet"
import { Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppSide } from "@/hooks/useAppSide"
import { useMapSettings } from "@/hooks/useMapSettings"
import MapColorKey from "./MapColorKey"

// What the map's colors and icons mean, behind its own button in the corner
// opposite the map's actions: the devices' key by default, or another map's
// (a route's) as children.
function MapKeyPanel({ children = <MapColorKey /> }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const { openPanel, setOpenPanel } = useMapSettings()
    const isOpen = openPanel === "key"
    const panelId = useId()
    const panelRef = useRef(null)

    // Clicks and scrolls in the panel stay off the map.
    useEffect(() => {
        if (!panelRef.current) return
        L.DomEvent.disableClickPropagation(panelRef.current)
        L.DomEvent.disableScrollPropagation(panelRef.current)
    }, [isOpen])

    return (
        // The column spans the map's height, so the key scrolls inside a small
        // map. Its button keeps to the left in Hebrew too.
        <div className={`pointer-events-none absolute top-24 bottom-2 left-2 z-[400] flex flex-col justify-end gap-2 ${isRight ? "items-start" : "items-end"}`}>
            {isOpen && (
                <div id={panelId} ref={panelRef}
                    className="pointer-events-auto min-h-0 w-64 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-lg border bg-background/95 p-4 text-foreground shadow-lg backdrop-blur">
                    {children}
                </div>
            )}
            <Button type="button" size="icon" variant="secondary" className="pointer-events-auto shrink-0 shadow-md"
                aria-expanded={isOpen} aria-controls={panelId}
                aria-label={t(isOpen ? "mapLegend.key.close" : "mapLegend.key.open")}
                title={t(isOpen ? "mapLegend.key.close" : "mapLegend.key.open")}
                onClick={() => setOpenPanel(isOpen ? null : "key")}>
                {isOpen ? <X /> : <Info />}
            </Button>
        </div>
    )
}

export default MapKeyPanel
