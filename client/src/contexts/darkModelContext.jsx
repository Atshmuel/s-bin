import { useEffect } from "react";
import { createContext, useContext, useState } from "react";

const DarkModeContext = createContext();

function DarkModeProvider({ children }) {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const isLocalView = JSON.parse(localStorage.getItem('isDarkMode'))

    const [isDark, setIsDark] = useState(isLocalView ?? prefersDarkScheme.matches)

    useEffect(() => {
        isDark ? document.body.classList.add('dark') : document.body.classList.remove('dark');
    }, [isDark]);


    function toggleView() {
        setIsDark(prev => {
            const newValue = !prev;
            localStorage.setItem('isDarkMode', JSON.stringify(newValue));

            if (newValue) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }

            return newValue;
        });
    }
    function applyDarkMode(value) {
        setIsDark(value);
        localStorage.setItem("isDarkMode", JSON.stringify(value));
    }

    return <DarkModeContext.Provider value={{ isDark, applyDarkMode, toggleView }}>{children}</DarkModeContext.Provider>
}

function useDarkMode() {
    const context = useContext(DarkModeContext);
    if (context === undefined) throw new Error('DarkModeContext was used outside of the provider')
    return context
}

export { DarkModeProvider, useDarkMode }