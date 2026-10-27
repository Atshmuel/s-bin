import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useAppSide } from "@/hooks/useAppSide";
import { useMapExtent } from "@/hooks/bins/useMapBins";
import { updateMapSettingsApi } from "@/services/apiOrganizations";
import { CLUSTER_UNTIL_ZOOM, CLUSTER_ZOOM_RANGE } from "@/utils/constants";
import { toLatLng } from "@/utils/geo";

const ZOOMS = Array.from({ length: CLUSTER_ZOOM_RANGE[1] - CLUSTER_ZOOM_RANGE[0] + 1 }, (_, i) => CLUSTER_ZOOM_RANGE[0] + i);
const FALLBACK_CENTER = Object.freeze([31.5, 34.9]);

// Kilometres a map `widthPx` wide shows at a zoom and latitude (Web Mercator:
// 156,543 m per pixel at zoom 0 on the equator).
function kmAcross(zoom, lat, widthPx) {
    return widthPx * 156543.03 * Math.cos(lat * Math.PI / 180) / 2 ** zoom / 1000;
}

// Keeps the example at the chosen zoom, and reports how wide it is in pixels.
function ExampleZoom({ center, zoom, onWidth }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
        onWidth(map.getSize().x);
    }, [map, center, zoom, onWidth]);
    return null;
}

// How the organization's map shows its devices: the zoom from which each one
// shows on its own (below it, nearby ones group), saved on change, with an
// example of that zoom around the depot (or the organization's devices) and
// about how many kilometres it spans. Owners for any organization, admins
// for their own.
function OrgMapSection({ id, organization }) {
    const { t } = useTranslation();
    const { isRight } = useAppSide();
    const queryClient = useQueryClient();
    const saved = organization.clusterUntilZoom ?? CLUSTER_UNTIL_ZOOM;
    const [zoom, setZoom] = useState(saved);
    const [widthPx, setWidthPx] = useState(null);
    const depot = organization.depot?.location;
    const { extent } = useMapExtent({ enabled: !depot, orgId: organization._id });
    const center = useMemo(() => depot ? toLatLng(depot)
        : extent ? [(extent.south + extent.north) / 2, (extent.west + extent.east) / 2] : FALLBACK_CENTER, [depot, extent]);

    const mutation = useMutation({
        mutationFn: updateMapSettingsApi,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
        },
        onError: (error) => { toast.error(error.message); setZoom(saved); },
    });
    const save = (value) => {
        setZoom(value);
        mutation.mutate({ orgId: organization._id, clusterUntilZoom: value });
    };
    const km = widthPx ? kmAcross(zoom, center[0], widthPx) : null;

    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.map.title")} description={t("components.orgSettingsPage.map.description")}>
            <SettingsRow label={t("components.orgSettingsPage.map.clusterZoom")} description={t("components.orgSettingsPage.map.clusterZoomHint")}>
                <Select value={String(zoom)} disabled={mutation.isPending} onValueChange={(value) => save(Number(value))}>
                    <SelectTrigger isRight={isRight} className="w-full sm:w-56" aria-label={t("components.orgSettingsPage.map.clusterZoom")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ZOOMS.map(option => (
                            <SelectItem isRight={isRight} key={option} value={String(option)}>
                                {t(`components.orgSettingsPage.map.zooms.${option}`, { zoom: option })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </SettingsRow>
            {/* The example: a still map at exactly the chosen zoom. */}
            <div className="px-6 pb-5">
                <div className="h-48 overflow-hidden rounded-lg border">
                    <MapContainer center={center} zoom={zoom} className="isolate size-full" zoomControl={false} dragging={false}
                        scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} attributionControl={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ExampleZoom center={center} zoom={zoom} onWidth={setWidthPx} />
                        {depot && <CircleMarker center={center} radius={6} pathOptions={{ color: "#16a34a", fillOpacity: 0.8 }} />}
                    </MapContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    {km !== null && t("components.orgSettingsPage.map.example", {
                        km: km >= 10 ? Math.round(km) : km.toFixed(1),
                        place: t(depot ? "components.orgSettingsPage.map.aroundDepot" : "components.orgSettingsPage.map.aroundDevices"),
                    })}
                </p>
            </div>
        </SettingsSection>
    );
}

export default OrgMapSection;
