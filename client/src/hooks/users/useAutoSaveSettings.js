import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateUserSettings } from "./useUpdateUserSettings";
import { SETTINGS_SAVE_DELAY_MS } from "@/utils/constants";

// Saves a user's settings as they change. Each change goes into the cached
// settings at once (for one's own, ProtectedRoute applies it to the app);
// the request waits until the changes stop for SETTINGS_SAVE_DELAY_MS and
// carries them all. A change still waiting when the page closes is sent
// then. A failed save reloads the settings, which shows what was kept.
export function useAutoSaveSettings(userId, { isSelf }) {
    const queryClient = useQueryClient()
    const { updateSettings } = useUpdateUserSettings()
    const pending = useRef({})
    const timer = useRef(null)

    const flush = useCallback(() => {
        clearTimeout(timer.current)
        timer.current = null
        const change = pending.current
        pending.current = {}
        if (Object.keys(change).length === 0) return
        updateSettings({ configToServerModel: change, id: userId, isSelf, silent: true },
            { onError: () => queryClient.invalidateQueries({ queryKey: ["user-settings", userId] }) })
    }, [updateSettings, userId, isSelf, queryClient])

    // Leaving the page sends what is still waiting.
    useEffect(() => flush, [flush])

    return useCallback((change) => {
        queryClient.setQueryData(["user-settings", userId],
            old => old && { ...old, settings: { ...old.settings, ...change } })
        pending.current = { ...pending.current, ...change }
        clearTimeout(timer.current)
        timer.current = setTimeout(flush, SETTINGS_SAVE_DELAY_MS)
    }, [queryClient, userId, flush])
}
