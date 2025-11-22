import { getMe } from "@/services/apiUsers";
import { useQuery } from "@tanstack/react-query";

export function useMe() {
    const {
        data,
        isPending: isLoadingMe,
        error: meError,
    } = useQuery({
        queryKey: ["me"],
        queryFn: getMe,
        staleTime: Infinity,
        gcTime: Infinity
    });
    if (!data) throw new Error("Cloud not load user information");

    const me = data?.user
    return { me, isLoadingMe, meError };
}
