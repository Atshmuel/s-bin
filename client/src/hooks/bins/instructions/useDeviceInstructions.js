import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    cancelDeviceInstruction,
    enqueueDeviceInstruction,
    getDeviceInstructions,
} from "@/services/apiDeviceInstructions";
import { PENDING_INSTRUCTIONS_REFRESH_MS as PENDING_REFRESH_MS } from "@/utils/constants";

// Devices pick instructions up only when they report (every 15 minutes to a
// day), so the queue is refreshed only while one is still pending.

export function useDeviceInstructions(binId) {
    const { data, isPending: isLoadingInstructions, error: instructionsError } = useQuery({
        queryKey: ["device-instructions", binId],
        queryFn: () => getDeviceInstructions(binId),
        enabled: !!binId,
        refetchInterval: (query) =>
            query.state.data?.instructions?.some((instruction) => instruction.status === "pending")
                ? PENDING_REFRESH_MS
                : false,
    });
    return { instructions: data?.instructions ?? [], isLoadingInstructions, instructionsError };
}

export function useEnqueueInstruction(binId) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: enqueueInstruction, isPending: isEnqueuing } = useMutation({
        mutationFn: enqueueDeviceInstruction,
        onSuccess: () => {
            toast.success(t("components.deviceInstructions.requestQueued"));
            queryClient.invalidateQueries({ queryKey: ["device-instructions", binId] });
        },
        onError: (error) => toast.error(error.message),
    });
    return { enqueueInstruction, isEnqueuing };
}

export function useCancelInstruction(binId) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: cancelInstruction, isPending: isCancelling } = useMutation({
        mutationFn: cancelDeviceInstruction,
        onSuccess: () => {
            toast.success(t("components.deviceInstructions.requestCancelled"));
            queryClient.invalidateQueries({ queryKey: ["device-instructions", binId] });
        },
        onError: (error) => toast.error(error.message),
    });
    return { cancelInstruction, isCancelling };
}
