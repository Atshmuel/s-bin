import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMapBins, getMapExtent } from "@/services/apiBins";
import { LIST_REFRESH_MS } from "@/utils/constants";
import { useErrorToast } from "@/hooks/useErrorToast";
import { useTranslation } from "react-i18next";

// Rounded, so small moves share a request and a cache entry.
function roundBox(box) {
    return box && Object.fromEntries(Object.entries(box).map(([side, value]) => [side, Math.round(value * 1000) / 1000]))
}

// The map's view ({ south, west, north, east, zoom }): its devices, or for a
// crowded view the server's grid cells with their counts. What is shown
// stays while the next view loads.
export function useMapBins(box, { enabled = true } = {}) {
    const { t } = useTranslation()
    const rounded = roundBox(box)
    const { data, isFetching, error } = useQuery({
        queryKey: ["map-bins", rounded],
        queryFn: () => getMapBins(rounded),
        enabled: enabled && !!rounded,
        refetchInterval: LIST_REFRESH_MS,
        placeholderData: keepPreviousData,
    })
    useErrorToast(data ? null : error, t("toasts.failedLoadBins"), "map-bins-load")
    return { mapBins: data?.bins, mapCells: data?.cells, isFetchingMapBins: isFetching }
}

// The box around all the user's devices, where the map first opens; `orgId`
// narrows an owner's to one organization.
export function useMapExtent({ enabled = true, orgId = null } = {}) {
    const { data, isPending, error } = useQuery({
        queryKey: ["map-extent", orgId],
        queryFn: () => getMapExtent(orgId),
        enabled,
    })
    return { extent: data?.extent ?? null, isLoadingExtent: enabled && isPending && !error }
}
