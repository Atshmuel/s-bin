import { getLogTypeOverviews } from "@/services/apiOverview";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useLogsTypeOV() {
    const {
        data,
        isPending: isLoadingLogTypeOV,
        error: logTypeOVError,
    } = useQuery({
        queryKey: ["logs-type-ov"],
        queryFn: getLogTypeOverviews,
    });


    if (!data && logTypeOVError) {
        return toast.error(logTypeOVError.message || "Failed to load logs type overviews.");
    }

    const logTypes = data?.logsByTypes || []
    return { logTypes, isLoadingLogTypeOV, logTypeOVError };
}
