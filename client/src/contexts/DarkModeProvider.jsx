import { useEffect, useState } from "react";
import { DarkModeContext } from "./darkModeContext";

const STORAGE_KEY = "isDarkMode";
const SYSTEM_DARK = "(prefers-color-scheme: dark)";

// The choice is dark (true), light (false) or the device's (null), as the
// user's settings keep it; this browser remembers it for the login page.
function readStoredChoice() {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return typeof value === "boolean" ? value : null;
    } catch {
        return null;
    }
}

function DarkModeProvider({ children }) {
    const [choice, setChoice] = useState(readStoredChoice);
    const [systemDark, setSystemDark] = useState(() => window.matchMedia(SYSTEM_DARK).matches);
    const isDark = choice ?? systemDark;

    // Follows the device while the choice is the device's.
    useEffect(() => {
        const query = window.matchMedia(SYSTEM_DARK);
        const onChange = (event) => setSystemDark(event.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        document.body.classList.toggle("dark", isDark);
    }, [isDark]);

    function applyDarkMode(value) {
        const next = typeof value === "boolean" ? value : null;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Kept for this visit only.
        }
        setChoice(next);
    }

    return <DarkModeContext.Provider value={{ isDark, applyDarkMode }}>{children}</DarkModeContext.Provider>
}

export { DarkModeProvider }
