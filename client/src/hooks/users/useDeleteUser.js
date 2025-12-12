import { deleteUserById } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useDeleteUser() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { mutate: deleteUser, isPending: isDeleting } = useMutation({
        mutationFn: deleteUserById,
        onSuccess: (_, variables) => {
            toast.success('User deleted successfully')
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
            navigate("/users", { replace: true });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete user's account")
        },
    });
    return { deleteUser, isDeleting };
}
