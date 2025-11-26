import { getUserSettings } from "@/services/apiUsers";
import { useQuery } from "@tanstack/react-query";

export function useUserSettings(id) {
    const {
        data,
        isPending: isLoadingSettings,
        error: settingsError,

    } = useQuery({
        queryKey: ["user-settings", id],
        queryFn: () => getUserSettings({ id }),
        enabled: !!id,
    });



    const settings = data?.settings
    return { settings, isLoadingSettings, settingsError };
}
