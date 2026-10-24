import { useState } from "react";
import { OrganizationScopeContext, readStoredOrg, storeOrg } from "./organizationScopeContext";

// Keeps the owner's pick; null means all organizations.
export function OrganizationScopeProvider({ children }) {
    const [storedOrgId, setStoredOrgId] = useState(readStoredOrg);
    const setSelectedOrgId = (orgId) => {
        setStoredOrgId(orgId);
        storeOrg(orgId);
    };
    return (
        <OrganizationScopeContext.Provider value={{ storedOrgId, setSelectedOrgId }}>
            {children}
        </OrganizationScopeContext.Provider>
    );
}
