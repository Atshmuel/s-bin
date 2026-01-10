import { useEffect } from "react";
import { createContext, useContext, useState } from "react";

const DarkModeContext = createContext();

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

function useDarkMode() {
    const context = useContext(DarkModeContext);
    if (context === undefined) throw new Error('DarkModeContext was used outside of the provider')
    return context
}

export { DarkModeProvider, useDarkMode }