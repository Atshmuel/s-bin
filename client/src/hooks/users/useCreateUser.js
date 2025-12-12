import { createUserAsAdmin } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export function useCreateUser() {
    const queryClient = useQueryClient();
    const { mutateAsync: create, isPending: isCreating } = useMutation({
        mutationFn: createUserAsAdmin,
        onSuccess: () => {
            toast.success('User created successfully')
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete user's account")
        },
    });
    return { create, isCreating };
}
