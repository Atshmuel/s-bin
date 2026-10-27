import { useQuery } from "@tanstack/react-query";
import { getMeshSettings } from "@/services/apiMeshSettings";
import { CLUSTER_UNTIL_ZOOM } from "@/utils/constants";

// The zoom from which the map shows each device on its own, per organization:
// `zoomFor(ownerId)` gives a device's organization's (an owner's map holds
// every organization, each grouping by its own). A device without one takes
// the viewer's only organization's, or the default; `deepest` is the largest
// of them, where the server's grid cells stop.
export function useClusterZoom() {
    const { data } = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings });
    const organizations = data?.organizations ?? [];
    const zooms = new Map(organizations.map(org => [String(org._id), org.clusterUntilZoom ?? CLUSTER_UNTIL_ZOOM]));
    const fallback = organizations.length === 1 ? zooms.values().next().value : CLUSTER_UNTIL_ZOOM;
    const zoomFor = (ownerId) => zooms.get(String(ownerId)) ?? fallback;
    const deepest = Math.max(fallback, ...zooms.values());
    return { zoomFor, deepest };
}
