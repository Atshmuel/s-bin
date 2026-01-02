import { createContext, useContext, useEffect, useState } from "react";

const AppSideContext = createContext();

function AppSideProvider({ children }) {
    const [isRight, setIsRight] = useState(true);
    const [side, setSide] = useState("right");

    useEffect(() => {
        const checkDirection = () => {
            const dir = document.documentElement.dir || getComputedStyle(document.documentElement).direction;
            const isRtl = dir === 'rtl';

            setIsRight(!isRtl);
            setSide(isRtl ? "left" : "right");
        };

        checkDirection();

        const observer = new MutationObserver(checkDirection);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });

        return () => observer.disconnect();
    }, []);

    return <AppSideContext.Provider value={{ side, isRight }}>{children}</AppSideContext.Provider>
}

function useAppSide() {
    const context = useContext(AppSideContext);
    if (context === undefined) throw new Error('AppSideContext was used outside of the provider')
    return context
}

export { AppSideProvider, useAppSide }