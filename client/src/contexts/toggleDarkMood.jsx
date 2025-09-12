import { createContext, useContext, useState } from "react";

const ViewContext = createContext();

function ViewProvider({ children }) {
    const isLocalView = JSON.parse(localStorage.getItem('view')) || false

    const [isDark, setIsDark] = useState(isLocalView)

    function toggleView() {
        setIsDark(isDark => !isDark)
        JSON.stringify(localStorage.setItem('view', !isDark));
    }
    return <ViewContext.Provider value={{ isDark, toggleView }}>{children}</ViewContext.Provider>
}

function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) throw new Error('ViewContext was used outside of the provider')
    return context
}

export { ViewProvider, useView }