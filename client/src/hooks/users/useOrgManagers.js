import { getOrgManagers } from "@/services/apiUsers";
import { useQuery } from "@tanstack/react-query";

export function useOrgManagers(org = null) {
    const {
        data,
        isPending: isLoadingManagers,
        error: managersError,
    } = useQuery({
        queryKey: ["managers", org],
        queryFn: () => getOrgManagers({ org }),
        enabled: !!org
    });

    const managers = data?.managers || [];

    return { managers, isLoadingManagers, managersError };
}
