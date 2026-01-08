import { deleteUserById } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useDeleteUser() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { mutate: deleteUser, isPending: isDeleting } = useMutation({
        mutationFn: deleteUserById,
        onSuccess: () => {
            toast.success(t('toasts.userDeletedSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["users"] });
            navigate("/users", { replace: true });
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToDeleteUser'))
        },
    });
    return { deleteUser, isDeleting };
}
