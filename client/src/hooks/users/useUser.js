import { getUser } from "@/services/apiUsers";
import { useQuery } from "@tanstack/react-query";

export function useUser(id) {
    const {
        data,
        isPending: isLoadingUser,
        error: userError,
    } = useQuery({
        queryKey: ["user", id],
        queryFn: () => getUser({ id }),
        enabled: !!id,
    });

    const user = data?.userData
    return { user, isLoadingUser, userError };
}
