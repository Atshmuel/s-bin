import { deleteBinById } from "@/services/apiBins";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useDeleteBin() {
    const navigate = useNavigate();
    const { t } = useTranslation()
    const queryClient = useQueryClient();
    const { mutate: deleteBin, isPending: isDeleting } = useMutation({
        mutationFn: deleteBinById,
        onSuccess: (_, variables) => {
            toast.success(t("toasts.binDeletedSuccessfully"))
            queryClient.invalidateQueries({ queryKey: ["bin", variables.id] });
            navigate("/bins", { replace: true });
        },
        onError: (error) => {
            toast.error(error.message || t("toasts.failedToDeleteBin"))
        },
    });
    return { deleteBin, isDeleting };
}
