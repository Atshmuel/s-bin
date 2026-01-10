import { deleteOrgByIdApi } from "@/services/apiOrganizations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";


export function useDeleteOrg() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { mutate: deleteOrgById, isPending: isDeleting } = useMutation({
        mutationFn: deleteOrgByIdApi,
        onSuccess: () => {
            toast.success(t('toasts.orgDeletedSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToDeleteOrg'))
        },
    });
    return { deleteOrgById, isDeleting };
}
