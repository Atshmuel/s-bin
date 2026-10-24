import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppSideContext } from "./appSideContext";

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

    // Set initial side based on browser language
    useEffect(() => {
        const browserLang =
            navigator.languages?.[0] || navigator.language || "en";

        const lang = browserLang.split("-")[0];

        if (lang === "he") {
            toggleSide(lang)
            document.documentElement.lang = lang;
        }
        // Once, on load: toggleSide flips the side, so running it again would undo it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <AppSideContext.Provider value={{ side, isRight, opSide, toggleSide, language: i18n.language }}>{children}</AppSideContext.Provider>
}

export { AppSideProvider }
