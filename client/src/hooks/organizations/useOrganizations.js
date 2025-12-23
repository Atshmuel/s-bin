import { getOrganizations } from "@/services/apiOrganizations";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "../users/auth/useMe";

export function useOrganizations() {
    const { isOwner } = useMe()
    const {
        data,
        isPending: isLoadingOrgs,
        error: orgsError,
    } = useQuery({
        queryKey: ["organizations"],
        queryFn: getOrganizations,
        staleTime: Infinity,
        gcTime: Infinity,
        enabled: isOwner
    });
    return { data, isLoadingOrgs, orgsError };
}
