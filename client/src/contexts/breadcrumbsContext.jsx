import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const breadcrumbMap = {
    dashboard: "Dashboard",
    settings: "Settings",
    users: "Users",
};

const BreadcrumbContext = createContext();

export function BreadcrumbProvider({ children }) {
    const [crumbs, setBreadcrumbs] = useState([]);
    const [customBreadcrumbs, setCustomBreadcrumbs] = useState(null);
    const location = useLocation();

    // Generate default crumbs from the current route
    useEffect(() => {
        if (customBreadcrumbs) return; // if custom set, don't override
        const segments = location.pathname.split("/").filter(Boolean);
        const autoCrumbs = segments.map((seg, idx) => ({
            label: breadcrumbMap[seg] || seg,
            path: "/" + segments.slice(0, idx + 1).join("/"),
        }));
        setBreadcrumbs(autoCrumbs);
    }, [location, customBreadcrumbs]);

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
