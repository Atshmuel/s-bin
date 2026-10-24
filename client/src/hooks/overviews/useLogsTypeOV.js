import { getLogTypeOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg";
import { useErrorToast } from "@/hooks/useErrorToast";

export function useLogsTypeOV() {
    const { t } = useTranslation()
    const { selectedOrgId } = useSelectedOrg()

    const {
        data,
        isPending: isLoadingLogTypeOV,
        error: logTypeOVError,
    } = useQuery({
        queryKey: ["logs-type-ov", selectedOrgId],
        queryFn: () => getLogTypeOverviews(selectedOrgId),
    });

    useErrorToast(data ? null : logTypeOVError, t('toasts.failToLoadTypes'), 'log-types-load')

    const logTypes = data?.logsByTypes || []
    return { logTypes, isLoadingLogTypeOV, logTypeOVError };
}
