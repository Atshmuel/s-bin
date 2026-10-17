import { useMe } from "@/hooks/users/auth/useMe";
import OrganizationsList from "./OrganizationsList";
import OrganizationSettings from "./OrganizationSettings";

// Owners manage every organization; an admin gets their own organization's settings.
function Organizations() {
    const { isOwner } = useMe();
    return isOwner ? <OrganizationsList /> : <OrganizationSettings />;
}

export default Organizations;
