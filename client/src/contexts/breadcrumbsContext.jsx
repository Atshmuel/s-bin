import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const routeKeyMap = {
    dashboard: "dashboard",
    settings: "settings",
    users: "users",
    login: "login",
    profile: "profile",
    bins: "bins",
    analytics: "analytics",
    statistics: "statistics",
    support: "support",
    account: "account",
    logs: "logs",
    add: "add",
    map: "map"
};
const BreadcrumbContext = createContext();

export function BreadcrumbProvider({ children }) {
    const [crumbs, setBreadcrumbs] = useState([]);
    const [customBreadcrumbs, setCustomBreadcrumbs] = useState(null);
    const location = useLocation();
    const { t } = useTranslation();

    useEffect(() => {
        if (customBreadcrumbs) return;
        const segments = location.pathname.split("/").filter(Boolean);
        const autoCrumbs = segments.map((seg, idx) => {
            const translationKey = routeKeyMap[seg];
            const label = translationKey ? t(translationKey) : seg;
            return {
                label,
                path: "/" + segments.slice(0, idx + 1).join("/"),
            }
        });
        setBreadcrumbs(autoCrumbs);
    }, [location, customBreadcrumbs, t]);

    // When customBreadcrumbs changes, use them instead
    useEffect(() => {
        if (customBreadcrumbs) {
            setBreadcrumbs(customBreadcrumbs);
        }
    }, [customBreadcrumbs]);

    // reset custom breadcrumbs when location changes
    useEffect(() => {
        return () => setCustomBreadcrumbs(null);
    }, [location]);

    return (
        <BreadcrumbContext.Provider value={{ crumbs, setCustomBreadcrumbs }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumbs() {
    const ctx = useContext(BreadcrumbContext);
    if (!ctx) throw new Error("useBreadcrumbs must be used inside BreadcrumbProvider");
    return ctx;
}
