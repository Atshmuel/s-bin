import { loginUser } from "@/services/apiUsers";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useLogin() {
    const { t } = useTranslation()

    const navigate = useNavigate();
    const { mutate: login, isPending: isLoggingIn } = useMutation({
        mutationFn: ({ email, password }) => loginUser({ email, password }),
        onSuccess: () => {
            toast.success(t('toasts.loginSuccessfully'))
            navigate("/", { replace: true });
        },
        onError: (error) => {
            toast.error(error.message || t('toasts.failedToLogin'))
        },
    });
    return { login, isLoggingIn };
}
