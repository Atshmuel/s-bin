import { Navigate, useSearchParams } from "react-router-dom";
import { useMe } from "@/hooks/users/auth/useMe";
import OrganizationsList from "./OrganizationsList";

// Owners see every organization in the table (an old ?id= link opens that
// organization's page); an admin goes straight to their own organization's
// settings.
function Organizations() {
    const { me, isOwner } = useMe();
    const [searchParams] = useSearchParams();
    const orgId = isOwner ? searchParams.get("id") : me.org;
    if (orgId) return <Navigate replace to={`/organizations/${orgId}/settings`} />;
    return <OrganizationsList />;
}

export default Organizations;
