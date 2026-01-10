import { useQuery } from '@tanstack/react-query';
import { getAIOverviewStream } from '../../services/apiOverview';
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';

export function useAIOverview() {
    const { t } = useTranslation()
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
        return toast.error(aiOverviewError.message || t("toasts.failedToLoadOverview"));
    }

    const insights = data?.insights || []
    return { insights, isLoadingAIOverview, aiOverviewError };
}
