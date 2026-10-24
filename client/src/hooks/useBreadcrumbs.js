import { useContext } from "react";
import { BreadcrumbContext } from "@/contexts/breadcrumbsContext";

export function useBreadcrumbs() {
    const ctx = useContext(BreadcrumbContext);
    if (!ctx) throw new Error("useBreadcrumbs must be used inside BreadcrumbProvider");
    return ctx;
}
