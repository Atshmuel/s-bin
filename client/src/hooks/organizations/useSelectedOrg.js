import { useContext } from "react";
import { OrganizationScopeContext } from "@/contexts/organizationScopeContext";
import { useMe } from "@/hooks/users/auth/useMe";

// The organization the overviews are narrowed to: the owner's pick, or null
// (all of them). Other users always see their own organization, so for them
// it is null too.
export function useSelectedOrg() {
    const context = useContext(OrganizationScopeContext);
    if (context === undefined) throw new Error("OrganizationScopeContext was used outside of the provider");
    const { isOwner } = useMe();
    return { selectedOrgId: isOwner ? context.storedOrgId : null, setSelectedOrgId: context.setSelectedOrgId, isOwner };
}
