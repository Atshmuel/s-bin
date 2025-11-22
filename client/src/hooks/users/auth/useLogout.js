import { logoutUser } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { mutate: logout, isPending: isLoggingOut } = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.removeQueries();
            navigate("/login", { replace: true });
        },
        onError: (error) => {
            throw error
        },
    });

    return { logout, isLoggingOut };
}