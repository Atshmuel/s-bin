import { useEffect, useState } from "react";
import { DarkModeContext } from "./darkModeContext";

function DarkModeProvider({ children }) {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const localStorageValue = localStorage.getItem('isDarkMode');

    const isLocalView = (localStorageValue !== null && localStorageValue !== "undefined")
        ? JSON.parse(localStorageValue)
        : prefersDarkScheme.media === '(prefers-color-scheme: dark)';

    const [isDark, setIsDark] = useState(isLocalView)

    useEffect(() => {
        isDark ? document.body.classList.add('dark') : document.body.classList.remove('dark');
    }, [isDark]);

    function applyDarkMode(value) {
        localStorage.setItem("isDarkMode", JSON.stringify(value));
        setIsDark(value);
    }

    return <DarkModeContext.Provider value={{ isDark, applyDarkMode }}>{children}</DarkModeContext.Provider>
}

export { DarkModeProvider }
