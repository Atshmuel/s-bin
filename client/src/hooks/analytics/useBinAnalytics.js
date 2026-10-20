import { getBinAnalytics } from "@/services/apiAnalytics";
import { useQuery } from "@tanstack/react-query";
import { ANALYTICS_STALE_MS } from "@/utils/constants";


// One bin page section; `enabled` lets a section load only once it is shown.
export function useBinAnalytics(binId, section, { range, enabled = true } = {}) {
    const { data, isPending, error } = useQuery({
        queryKey: ["bin-analytics", binId, section, range ?? null],
        queryFn: () => getBinAnalytics({ binId, section, range }),
        enabled: !!binId && enabled,
        staleTime: ANALYTICS_STALE_MS,
    });
    return { data, isLoading: isPending, error };
}
