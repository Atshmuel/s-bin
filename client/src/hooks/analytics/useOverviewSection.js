import { getOverviewSection } from "@/services/apiAnalytics";
import { useQuery } from "@tanstack/react-query";

// Reports arrive hours apart, so a section stays fresh for a few minutes.
const ANALYTICS_STALE_MS = 5 * 60 * 1000;

// One analytics page section; `enabled` lets it load only once it is shown.
export function useOverviewSection(section, { range, enabled = true } = {}) {
    const { data, isPending, error } = useQuery({
        queryKey: ["overview-section", section, range ?? null],
        queryFn: () => getOverviewSection({ section, range }),
        enabled,
        staleTime: ANALYTICS_STALE_MS,
    });
    return { data, isLoading: isPending, error };
}
