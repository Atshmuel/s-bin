import { useQuery } from "@tanstack/react-query";
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg";
import { getMeshSettings } from "@/services/apiMeshSettings";
import { DEFAULT_THRESHOLDS } from "@/utils/constants";

// The fullness and battery cut-offs that color the devices, per organization:
// `thresholdsFor(ownerId)` gives a device's organization's (an owner sees
// every organization, each by its own). `thresholds` are the ones a page
// without a device in hand shows (keys, descriptions): an owner's picked
// organization's, anyone else's own, or the defaults across organizations.
export function useThresholds() {
    const { selectedOrgId, isOwner } = useSelectedOrg();
    const { data } = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings });
    const organizations = data?.organizations ?? [];
    const byOrganization = new Map(organizations.map(org => [String(org._id), { ...DEFAULT_THRESHOLDS, ...org.thresholds }]));
    const own = isOwner ? byOrganization.get(String(selectedOrgId)) : byOrganization.values().next().value;
    const thresholds = own ?? DEFAULT_THRESHOLDS;
    const thresholdsFor = (ownerId) => byOrganization.get(String(ownerId)) ?? thresholds;
    return { thresholds, thresholdsFor };
}
