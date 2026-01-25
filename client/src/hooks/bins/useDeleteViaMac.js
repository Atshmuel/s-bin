import { deleteBinViaMac } from "@/services/apiBins";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useDeleteViaMac() {
    const { t } = useTranslation()
    const { mutate: deleteViaMac, isPending: isDeleting } = useMutation({
        mutationFn: deleteBinViaMac,
        onSuccess: () => {
            toast.success(t("toasts.binDeletedSuccessfully"))
        },
        onError: (error) => {
            toast.error(error.message || t("toasts.failedToDeleteBin"))
        },
    });
    return { deleteViaMac, isDeleting };
}