import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useMapSettings } from "@/contexts/mapContext"

// How the map looks and moves: satellite tiles, flying to a clicked marker,
// and the user's own location.
function MapDisplayOptions({ onLocate }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const { flyEnabled, setFlyEnabled, tile, setTile } = useMapSettings()

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Switch isRight={isRight} id="map-tile" checked={tile === "satellite"}
                    onCheckedChange={(checked) => setTile(checked ? "satellite" : "default")} />
                <Label htmlFor="map-tile" className="text-sm">{t("mapLegend.locations.toggleMapType")}</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch isRight={isRight} id="map-fly" checked={flyEnabled} onCheckedChange={setFlyEnabled} />
                <Label htmlFor="map-fly" className="text-sm">{t("mapLegend.locations.flyToLocation")}</Label>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onLocate}>
                <MapPin data-icon="inline-start" />
                {t("mapLegend.locations.myLocation")}
            </Button>
        </section>
    )
}

export default MapDisplayOptions
