import { deleteAccount } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useDeleteAccount() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { mutate: deleteUserAccount, isPending: isDeleting } = useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            toast.success(t('toasts.accountDeletedSuccessfully'))
            queryClient.removeQueries();
            navigate("/login", { replace: true });

        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToDeleteAccount'))
        },
    });
    return { deleteUserAccount, isDeleting };
}
