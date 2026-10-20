import { logoutUser } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { clearAICache } from "@/utils/aiCache";

export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { mutate: logout, isPending: isLoggingOut } = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.removeQueries();
            clearAICache();
            navigate("/login", { replace: true });
        },
        onError: (error) => {
            toast.error(error.message)
        },
    });

    return { logout, isLoggingOut };
}