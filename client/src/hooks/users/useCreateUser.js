import { createUserAsAdmin } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";


export function useCreateUser() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { mutateAsync: create, isPending: isCreating } = useMutation({
        mutationFn: createUserAsAdmin,
        onSuccess: () => {
            toast.success(t('toasts.userCreatedSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["users"] })
            queryClient.invalidateQueries({ queryKey: ["managers"] });
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToCreateUser'))
        },
    });
    return { create, isCreating };
}
