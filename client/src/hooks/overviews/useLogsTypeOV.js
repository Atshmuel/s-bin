import { getLogTypeOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSelectedOrg } from "@/hooks/organizations/useSelectedOrg";

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


    if (!data && logTypeOVError) {
        return toast.error(logTypeOVError.message || t('toasts.failToLoadTypes'));
    }

    const logTypes = data?.logsByTypes || []
    return { logTypes, isLoadingLogTypeOV, logTypeOVError };
}
