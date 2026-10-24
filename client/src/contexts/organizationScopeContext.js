import { createContext } from "react";
import { SELECTED_ORG_STORAGE_KEY } from "@/utils/constants";

// The organization an owner picked on the dashboard and the analytics page,
// shared by both (OrganizationScopeProvider; read it with useSelectedOrg) and
// remembered in this browser until logout.
export const OrganizationScopeContext = createContext();

export function readStoredOrg() {
    try {
        return localStorage.getItem(SELECTED_ORG_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function storeOrg(orgId) {
    try {
        if (orgId) localStorage.setItem(SELECTED_ORG_STORAGE_KEY, orgId);
        else localStorage.removeItem(SELECTED_ORG_STORAGE_KEY);
    } catch {
        // Kept for this visit only.
    }
}
