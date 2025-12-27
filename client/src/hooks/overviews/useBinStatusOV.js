import { getBinsStatusOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useBinStatusOV() {
    const {
        data,
        isPending: isLoadingStatusOV,
        error: statusOVError,
    } = useQuery({
        queryKey: ["bins-status-ov"],
        queryFn: getBinsStatusOverviews,
    });


    if (!data && statusOVError) {
        return toast.error(statusOVError.message || "Failed to load overview status.");
    }
    const binsCount = data?.binsCount[0] || {}
    return { binsCount, isLoadingStatusOV, statusOVError };
}
