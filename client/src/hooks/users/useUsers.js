import { getAllUsers } from "@/services/apiUsers";
import { useQuery } from "@tanstack/react-query";

export function useUsers() {
    const {
        data,
        isPending: isLoadingUsers,
        error: usersError,
    } = useQuery({
        queryKey: ["users"],
        queryFn: getAllUsers,
        staleTime: Infinity,
        gcTime: Infinity
    });
    if (!data) throw new Error("Cloud not load users information");

    const users = data?.users
    return { users, isLoadingUsers, usersError };
}
