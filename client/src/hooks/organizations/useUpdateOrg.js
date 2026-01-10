import { updateOrgNameApi } from "@/services/apiOrganizations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";


export function useUpdateOrgName() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: updateOrgName, isPending: isUpdatingOrgName } = useMutation({
        mutationFn: updateOrgNameApi,
        onSuccess: () => {
            toast.success(t('toasts.updatedOrgNameSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["organizations"] });

        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdateOrgName'))
        },
    });
    return { updateOrgName, isUpdatingOrgName };
}
