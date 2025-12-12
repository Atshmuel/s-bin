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


    const users = data?.users
    return { users, isLoadingUsers, usersError };
}
