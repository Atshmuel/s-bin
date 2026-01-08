import { getBinsStatusOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useBinStatusOV() {
    const { t } = useTranslation()
    const {
        data,
        isPending: isLoadingStatusOV,
        error: statusOVError,
    } = useQuery({
        queryKey: ["bins-status-ov"],
        queryFn: getBinsStatusOverviews,
    });


    if (!data && statusOVError) {
        return toast.error(statusOVError.message || t('toasts.failToLoadStatus'));
    }
    const binsCount = data?.binsCount[0] || {}
    return { binsCount, isLoadingStatusOV, statusOVError };
}
