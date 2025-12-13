import { getOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";

export function useOverviews() {
    const {
        data,
        isPending: isLoadingOverviews,
        error: overviewsError,
    } = useQuery({
        queryKey: ["overviews"],
        queryFn: getOverviews,
    });

    return { data, isLoadingOverviews, overviewsError };
}
