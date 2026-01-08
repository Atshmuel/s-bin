import { deleteBinsBatch } from "@/services/apiBins";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useDeleteBinBatch() {
    const { t } = useTranslation()
    const queryClient = useQueryClient();
    const { mutate: deleteBins, isPending: isDeleting } = useMutation({
        mutationFn: deleteBinsBatch,
        onSuccess: (_, variables) => {
            toast.success(`${variables.binIds.length} ${t("toasts.binsDeletedSuccessfully")}`);
            queryClient.invalidateQueries({ queryKey: ["all-bins"] });
        },
        onError: (error) => {
            toast.error(error.message || t("toasts.failedDeleteBins"))
        },
    });
    return { deleteBins, isDeleting };
}
