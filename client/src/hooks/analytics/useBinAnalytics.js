import { getBinAnalytics } from "@/services/apiAnalytics";
import { useQuery } from "@tanstack/react-query";

// Reports arrive hours apart, so a section stays fresh for a few minutes.
const ANALYTICS_STALE_MS = 5 * 60 * 1000;

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
