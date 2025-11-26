import { updateUserPassword, updateUserRole, updateUserStatus, updateUserNameOrEmail } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";


export function useUpdateUserInfo() {
    const queryClient = useQueryClient();

    const { mutate: updateInfo, isPending: isUpdatingInfo } = useMutation({
        mutationFn: ({ email, name, id }) =>
            updateUserNameOrEmail(email, name, id),
        onSuccess: () => {
            toast.success('Updated information successfully')
            queryClient.invalidateQueries({ queryKey: ["user"] });

        },
        onError: (error) => {
            toast.error(error.message || "Could not login")
        },
    });
    return { updateInfo, isUpdatingInfo };
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
        mutationFn: ({ role, id }) =>
            updateUserRole({ role, id }),
        onSuccess: (_, variables) => {
            toast.success('Updated role successfully')
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
        },
        onError: (error) => {
            toast.error(error.message || "Could not login")
        },
    });
    return { updateRole, isUpdatingRole };
}

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();

    const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: ({ status, id }) =>
            updateUserStatus({ status, id }),
        onSuccess: (_, variables) => {
            toast.success('Updated status successfully')
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });


        },
        onError: (error) => {
            toast.error(error.message || "Could not login")
        },
    });
    return { updateStatus, isUpdatingStatus };
}

export function useUpdateUserPassword() {
    const queryClient = useQueryClient();

    const { mutate: updatePassword, isPending: isUpdatingPassword } = useMutation({
        mutationFn: ({ oldPassword, newPassword, id }) =>
            updateUserPassword(oldPassword, newPassword, id),
        onSuccess: () => {
            toast.success('Updated password successfully')
            queryClient.invalidateQueries({ queryKey: ["user"] });


        },
        onError: (error) => {
            toast.error(error.message || "Could not login")
        },
    });
    return { updatePassword, isUpdatingPassword };
}
