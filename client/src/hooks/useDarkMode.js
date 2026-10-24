import { useContext } from "react";
import { DarkModeContext } from "@/contexts/darkModeContext";

export function useDarkMode() {
    const context = useContext(DarkModeContext);
    if (context === undefined) throw new Error('DarkModeContext was used outside of the provider')
    return context
}
