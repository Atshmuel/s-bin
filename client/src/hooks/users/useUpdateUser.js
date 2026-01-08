import { updateUserPassword, updateUserRole, updateUserStatus, updateUserNameOrEmail, updateUserOrgAndManager } from "@/services/apiUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";


export function useUpdateUserInfo() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: updateInfo, isPending: isUpdatingInfo } = useMutation({
        mutationFn: updateUserNameOrEmail,
        onSuccess: () => {
            toast.success(t('toasts.updatedInformationSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["user"] });

        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdateInformation'))
        },
    });
    return { updateInfo, isUpdatingInfo };
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
        mutationFn: updateUserRole,
        onSuccess: (_, variables) => {
            toast.success(t('toasts.updatedRoleSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdateRole'))
        },
    });
    return { updateRole, isUpdatingRole };
}

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: updateUserStatus,
        onSuccess: (_, variables) => {
            toast.success(t('toasts.updatedStatusSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdateStatus'))
        },
    });
    return { updateStatus, isUpdatingStatus };
}

export function useUpdateUserPassword() {
    const { t } = useTranslation();

    const { mutate: updatePassword, isPending: isUpdatingPassword } = useMutation({
        mutationFn: updateUserPassword,
        onSuccess: () => {
            toast.success(t('toasts.updatedPasswordSuccessfully'))
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdatePassword'))
        },
    });
    return { updatePassword, isUpdatingPassword };
}

export function useUpdateOrgAndManager() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { mutate: updateOrgAndManager, isPending: isUpdatingOrgAndManager } = useMutation({
        mutationFn: updateUserOrgAndManager,
        onSuccess: () => (_, variables) => {
            toast.success(t('toasts.updatedOrgAndManagerSuccessfully'))
            queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdateOrgAndManager'))
        },
    });
    return { updateOrgAndManager, isUpdatingOrgAndManager };
}