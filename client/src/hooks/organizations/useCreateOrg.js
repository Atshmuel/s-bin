import { createOrgApi } from "@/services/apiOrganizations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export function useCreateOrg() {
    const queryClient = useQueryClient();
    const { mutateAsync: createOrg, isPending: isCreatingOrg } = useMutation({
        mutationFn: createOrgApi,
        onSuccess: () => {
            toast.success('User created successfully')
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create user's account")
        },
    });
    return { createOrg, isCreatingOrg };
}
