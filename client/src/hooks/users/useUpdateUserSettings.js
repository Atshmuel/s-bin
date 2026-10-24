import { updateUserSettings } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";


export function useUpdateUserSettings() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: updateSettings, isPending: isUpdatingSettings } = useMutation({
        mutationFn: ({ configToServerModel, id }) =>
            updateUserSettings(configToServerModel, id),
        // A setting saved as it is changed (`silent`, see useAutoSaveSettings)
        // is already in the cache: no toast, and no reload that could bring
        // back an older value while a newer change waits to be sent.
        onSuccess: (_, variables) => {
            if (variables?.silent) return
            toast.success(t('toasts.settingsUpdatedSuccessfully'))
            if (variables?.isSelf)
                queryClient.invalidateQueries({ queryKey: ["user-settings"] });

        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdateSettings'))
        },
    });
    return { updateSettings, isUpdatingSettings };
}
