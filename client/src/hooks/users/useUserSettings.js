import { getUserSettings } from "@/services/apiUsers";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "./auth/useMe";

export function useUserSettings() {
    const { me } = useMe()
    const { id } = me
    const {
        data,
        isPending: isLoadingSettings,
        error: settingsError,
    } = useQuery({
        queryKey: ["user-settings"],
        queryFn: () => getUserSettings({ id }),
    });

    if (!data) throw new Error("Cloud not load user settings");

    const settings = data?.settings
    return { settings, isLoadingSettings, settingsError };
}
