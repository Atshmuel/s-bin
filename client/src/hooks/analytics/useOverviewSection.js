import { getOverviewSection } from "@/services/apiAnalytics";
import { useQuery } from "@tanstack/react-query";

// Reports arrive hours apart, so a section stays fresh for a few minutes.
const ANALYTICS_STALE_MS = 5 * 60 * 1000;

// One overview section; `enabled` lets it load only once it is shown, and
// `refreshMs` reloads it on that interval (a dashboard left open).
export function useOverviewSection(section, { range, enabled = true, refreshMs } = {}) {
    const { data, isPending, error } = useQuery({
        queryKey: ["overview-section", section, range ?? null],
        queryFn: () => getOverviewSection({ section, range }),
        enabled,
        // Refreshed sections are also reloaded on returning to the tab.
        staleTime: refreshMs ? Math.min(refreshMs, ANALYTICS_STALE_MS) : ANALYTICS_STALE_MS,
        refetchInterval: refreshMs ?? false,
    });
    return { data, isLoading: isPending, error };
}
