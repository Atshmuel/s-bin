import { createOrgApi } from "@/services/apiOrganizations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";


export function useCreateOrg() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { mutateAsync: createOrg, isPending: isCreatingOrg } = useMutation({
        mutationFn: createOrgApi,
        onSuccess: () => {
            toast.success(t('toasts.organizationCreatedSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["organizations"] })
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToCreateOrganization'))
        },
    });
    return { createOrg, isCreatingOrg };
}
