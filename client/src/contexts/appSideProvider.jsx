import { createContext, useContext, useState } from "react";
import { useTranslation } from "react-i18next";

const AppSideContext = createContext();

function AppSideProvider({ children }) {
    const { i18n } = useTranslation()
    const [isRight, setIsRight] = useState(true);
    const [side, setSide] = useState("right");
    const [opSide, setOpSide] = useState("left");

    const toggleSide = (lang) => {
        i18n.changeLanguage(lang)
        setIsRight(!isRight);
        setSide(isRight ? "left" : "right");
        setOpSide(isRight ? "right" : "left");
    }

    return <AppSideContext.Provider value={{ side, isRight, opSide, toggleSide, language: i18n.language }}>{children}</AppSideContext.Provider>
}

function useAppSide() {
    const context = useContext(AppSideContext);
    if (context === undefined) throw new Error('AppSideContext was used outside of the provider')
    return context
}

export { AppSideProvider, useAppSide }