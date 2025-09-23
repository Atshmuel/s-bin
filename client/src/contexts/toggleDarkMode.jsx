import { useEffect } from "react";
import { createContext, useContext, useState } from "react";

const ViewContext = createContext();

function ViewProvider({ children }) {
    const isLocalView = JSON.parse(localStorage.getItem('view')) || false

    const [isDark, setIsDark] = useState(isLocalView)

    useEffect(() => {
        isDark ? document.body.classList.add('dark') : document.body.classList.remove('dark');
    }, [isDark]);

    function toggleView() {
        setIsDark(prev => {
            const newValue = !prev;
            localStorage.setItem('view', JSON.stringify(newValue));

            if (newValue) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }

            return newValue;
        });
    }
    return <ViewContext.Provider value={{ isDark, toggleView }}>{children}</ViewContext.Provider>
}

function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) throw new Error('ViewContext was used outside of the provider')
    return context
}

export { ViewProvider, useView }