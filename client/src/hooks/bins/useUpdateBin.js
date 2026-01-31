import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBinMaintenance, updateBinName } from "../../services/apiBins"
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useUpdateBinMaintenance() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: updateMaintenance, isPending: isUpdating } = useMutation({
        mutationFn: updateBinMaintenance,
        onSuccess: () => {
            toast.success(t("toasts.maintenanceUpdatedSuccessfully"));
            queryClient.invalidateQueries({ queryKey: ["bin"] });
        },
        onError: (error) => {
            toast.error(error.message || t("toast.failedToUpdateMaintenance"));
        }
    });

    return { updateMaintenance, isUpdating };
}


export function useUpdateBinName() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: updateName, isPending: isUpdating } = useMutation({
        mutationFn: updateBinName,
        onSuccess: () => {
            toast.success(t("toasts.binNameUpdatedSuccessfully"));
            queryClient.invalidateQueries({ queryKey: ["bin"] });
        },
        onError: (error) => {
            toast.error(error.message || t("toasts.failedToUpdateBinName"));
        }
    });
    return { updateName, isUpdating };
}