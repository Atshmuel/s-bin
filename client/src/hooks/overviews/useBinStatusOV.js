import { getBinsStatusOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg";
import { useErrorToast } from "@/hooks/useErrorToast";

export function useBinStatusOV() {
    const { t } = useTranslation()
    const { selectedOrgId } = useSelectedOrg()
    const {
        data,
        isPending: isLoadingStatusOV,
        error: statusOVError,
    } = useQuery({
        queryKey: ["bins-status-ov", selectedOrgId],
        queryFn: () => getBinsStatusOverviews(selectedOrgId),
    });

    useErrorToast(data ? null : statusOVError, t('toasts.failToLoadStatus'), 'bins-status-load')

    const binsCount = data?.binsCount[0] || {}
    return { binsCount, isLoadingStatusOV, statusOVError };
}
