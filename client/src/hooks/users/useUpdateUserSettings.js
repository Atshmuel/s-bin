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
        onSuccess: () => {
            toast.success(t('toasts.updatedSettingsSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["user-settings"] });

        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdateSettings'))
        },
    });
    return { updateSettings, isUpdatingSettings };
}
