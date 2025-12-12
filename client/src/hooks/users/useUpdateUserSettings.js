import { updateUserSettings } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export function useUpdateUserSettings() {
    const queryClient = useQueryClient();

    const { mutate: updateSettings, isPending: isUpdatingSettings } = useMutation({
        mutationFn: ({ configToServerModel, id }) =>
            updateUserSettings(configToServerModel, id),
        onSuccess: () => {
            toast.success('Updated settings successfully')
            queryClient.invalidateQueries({ queryKey: ["user-settings"] });

        },
        onError: (error) => {
            toast.error(error.message || "Could not login")
        },
    });
    return { updateSettings, isUpdatingSettings };
}
