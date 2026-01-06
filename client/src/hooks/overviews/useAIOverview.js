import { useQuery } from '@tanstack/react-query';
import { getAIOverviewStream } from '../../services/apiOverview';
import { toast } from "sonner";

export function useAIOverview() {
    const {
        data,
        isPending: isLoadingAIOverview,
        error: aiOverviewError,
    } = useQuery({
        queryKey: ['aiOverview'],
        queryFn: getAIOverviewStream,
        enabled: true,
        gcTime: 1000 * 60 * 60,
        retry: false,
        refetchOnWindowFocus: false,
    });


    if (!data && aiOverviewError) {
        return toast.error(aiOverviewError.message || "Failed to load overview status.");
    }

    const insights = data?.insights || []
    return { insights, isLoadingAIOverview, aiOverviewError };
}
