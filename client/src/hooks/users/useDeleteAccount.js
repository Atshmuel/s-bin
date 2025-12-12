import { deleteAccount } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useDeleteAccount() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { mutate: deleteUserAccount, isPending: isDeleting } = useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            toast.success('Account deleted successfully')
            queryClient.removeQueries();
            navigate("/login", { replace: true });

        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete your account")
        },
    });
    return { deleteUserAccount, isDeleting };
}
