import { useQuery } from '@tanstack/react-query';
import { getAIOverviewStream } from '../../services/apiOverview';
import { useSelectedOrg } from '@/hooks/organizations/useSelectedOrg';

// The card shows a failure itself (AIInsights), so there is no toast.
export function useAIOverview() {
    const { selectedOrgId } = useSelectedOrg()
    const {
        data,
        isPending: isLoadingAIOverview,
        error: aiOverviewError,
    } = useQuery({
        queryKey: ['aiOverview', selectedOrgId],
        queryFn: () => getAIOverviewStream(selectedOrgId),
        enabled: true,
        gcTime: 1000 * 60 * 60,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const insights = data?.insights || []
    return { insights, isLoadingAIOverview, aiOverviewError };
}
