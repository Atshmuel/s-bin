import { useQuery } from '@tanstack/react-query';
import { getAIOverviewStream } from '../../services/apiOverview';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useSelectedOrg } from '@/hooks/organizations/useSelectedOrg';

export function useAIOverview() {
    const { t } = useTranslation()
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


    if (!data && aiOverviewError) {
        return toast.error(aiOverviewError.message || t("toasts.failedToLoadOverview"));
    }

    const insights = data?.insights || []
    return { insights, isLoadingAIOverview, aiOverviewError };
}
