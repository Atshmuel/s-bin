import { forgotUserPassword, resetUserPasswordByToken, verifyUserForgetCode } from "@/services/apiUsers";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useForgot() {
    const { mutate: forgot, isPending: isFetchingForgot } = useMutation({
        mutationFn: ({ email }) => forgotUserPassword({ email }),
        onSuccess: (_, variables) => {
            toast.success('Email sent successfully, please check you email.')
            if (variables.action) {
                variables.action()
            }
        },
        onError: (error) => {
            throw error
        },
    });
    return { forgot, isFetchingForgot };
}

export function useOtp() {
    const { mutate: otp, isPending: isVerifingOtp } = useMutation({
        mutationFn: ({ email, code }) => verifyUserForgetCode({ email, code }),
        onSuccess: (_, variables) => {
            toast.success('OTP Code is correct.')
            if (variables.action) {
                variables.action()
            }
        },
        onError: (error) => {
            throw error
        },
    });
    return { otp, isVerifingOtp };
}

export function useUpdatePasswordByToken() {
    const navigate = useNavigate();
    const { mutate: updatePassword, isPending: isUpdatingPassword } = useMutation({
        mutationFn: ({ password }) => resetUserPasswordByToken({ password }),
        onSuccess: (_, variables) => {
            toast.success('Password updated successfully!')
            navigate(`/login${variables?.email ? '?email=' + variables?.email : ''}`, { replace: true })
        },
        onError: (error) => {
            throw error
        },
    });
    return { updatePassword, isUpdatingPassword };
}
