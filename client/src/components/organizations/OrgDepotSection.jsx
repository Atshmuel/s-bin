import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useMapExtent } from "@/hooks/bins/useMapBins";
import { updateFleetSettingsApi } from "@/services/apiOrganizations";
import { DEPOT_ADDRESS_MAX_LENGTH, MAP_FIT_MAX_ZOOM } from "@/utils/constants";
import { toLatLng } from "@/utils/geo";

const FALLBACK_CENTER = Object.freeze([31.5, 34.9]);

function PickOnClick({ onPick }) {
    useMapEvents({ click: (event) => onPick([event.latlng.lng, event.latlng.lat]) });
    return null;
}

// Where the trucks start and end their routes: a spot clicked on the map,
// which opens on the depot or else around the organization's devices.
function OrgDepotSection({ id, organization }) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const saved = organization.depot ?? null;
    const [location, setLocation] = useState(saved?.location ?? null);
    const [address, setAddress] = useState(saved?.address ?? "");
    const { extent, isLoadingExtent } = useMapExtent({ enabled: !saved, orgId: organization._id });
    const isChanged = JSON.stringify(location) !== JSON.stringify(saved?.location ?? null) || address.trim() !== (saved?.address ?? "");

    const mutation = useMutation({
        mutationFn: updateFleetSettingsApi,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
        },
        onError: (error) => toast.error(error.message),
    });
    const save = (depot) => mutation.mutate({ orgId: organization._id, depot });
    const reset = () => {
        setLocation(saved?.location ?? null);
        setAddress(saved?.address ?? "");
    };

    const opening = saved ? { center: toLatLng(saved.location), zoom: MAP_FIT_MAX_ZOOM }
        : extent ? { bounds: [[extent.south, extent.west], [extent.north, extent.east]], boundsOptions: { maxZoom: MAP_FIT_MAX_ZOOM, padding: [24, 24] } }
            : { center: FALLBACK_CENTER, zoom: 8 };

    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.depot.title")}
            description={location
                ? t("components.orgSettingsPage.depot.at", { lat: location[1].toFixed(5), lng: location[0].toFixed(5) })
                : t("components.orgSettingsPage.depot.description")}
            footer={(isChanged || saved) && (
                <>
                    {saved && !isChanged && (
                        <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => save(null)}>
                            {t("components.orgSettingsPage.depot.remove")}
                        </Button>
                    )}
                    {isChanged && (
                        <>
                            <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={reset}>
                                {t("components.accountPage.cancel")}
                            </Button>
                            <Button type="button" disabled={!location || mutation.isPending} onClick={() => save({ location, address: address.trim() })}>
                                {mutation.isPending ? <Spinner /> : t("components.accountPage.save")}
                            </Button>
                        </>
                    )}
                </>
            )}>
            <div className="px-6 py-5">
                <p className="mb-3 text-sm text-muted-foreground">{t("components.orgSettingsPage.depot.hint")}</p>
                <div className="h-72 overflow-hidden rounded-lg border">
                    {!saved && isLoadingExtent ? <Skeleton className="size-full" /> : (
                        <MapContainer {...opening} className="size-full" scrollWheelZoom>
                            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <PickOnClick onPick={setLocation} />
                            {location && <CircleMarker center={toLatLng(location)} radius={10} pathOptions={{ color: "#16a34a", fillOpacity: 0.7 }} />}
                        </MapContainer>
                    )}
                </div>
            </div>
            <SettingsRow label={t("components.orgSettingsPage.depot.address")} description={t("components.orgSettingsPage.depot.addressHint")}>
                <Input value={address} onChange={event => setAddress(event.target.value)} maxLength={DEPOT_ADDRESS_MAX_LENGTH}
                    className="w-full sm:w-72" disabled={mutation.isPending} aria-label={t("components.orgSettingsPage.depot.address")} />
            </SettingsRow>
        </SettingsSection>
    );
}

export default OrgDepotSection;
