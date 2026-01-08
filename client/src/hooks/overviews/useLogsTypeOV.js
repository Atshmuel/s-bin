import { getLogTypeOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useLogsTypeOV() {
    const { t } = useTranslation()

    const {
        data,
        isPending: isLoadingLogTypeOV,
        error: logTypeOVError,
    } = useQuery({
        queryKey: ["logs-type-ov"],
        queryFn: getLogTypeOverviews,
    });


    if (!data && logTypeOVError) {
        return toast.error(logTypeOVError.message || t('toasts.failToLoadTypes'));
    }

    const logTypes = data?.logsByTypes || []
    return { logTypes, isLoadingLogTypeOV, logTypeOVError };
}
