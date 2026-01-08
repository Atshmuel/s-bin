import { forgotUserPassword, resetUserPasswordByToken, verifyUserForgetCode } from "@/services/apiUsers";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useForgot() {
    const { t } = useTranslation()
    const { mutate: forgot, isPending: isFetchingForgot } = useMutation({
        mutationFn: ({ email }) => forgotUserPassword({ email }),
        onSuccess: (_, variables) => {
            toast.success(t('toasts.forgotPasswordEmailSent'))
            if (variables.action) {
                variables.action()
            }
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToSendForgotPasswordEmail'))
        },
    });
    return { forgot, isFetchingForgot };
}

export function useOtp() {
    const { t } = useTranslation()
    const { mutate: otp, isPending: isVerifingOtp } = useMutation({
        mutationFn: ({ email, code }) => verifyUserForgetCode({ email, code }),
        onSuccess: (_, variables) => {
            toast.success(t('toasts.verificationCodeValid'))
            if (variables.action) {
                variables.action()
            }
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.verificationCodeInvalid'))
        },
    });
    return { otp, isVerifingOtp };
}

export function useUpdatePasswordByToken() {
    const navigate = useNavigate();
    const { t } = useTranslation()
    const { mutate: updatePassword, isPending: isUpdatingPassword } = useMutation({
        mutationFn: ({ password }) => resetUserPasswordByToken({ password }),
        onSuccess: (_, variables) => {
            toast.success(t('toasts.passwordUpdatedSuccessfully'))
            navigate(`/login${variables?.email ? '?email=' + variables?.email : ''}`, { replace: true })
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToUpdatePassword'))
        },
    });
    return { updatePassword, isUpdatingPassword };
}
