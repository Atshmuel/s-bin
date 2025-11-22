import { loginUser } from "@/services/apiUsers";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";


export function useLogin() {
    const navigate = useNavigate();
    const { mutate: login, isPending: isLoggingIn } = useMutation({
        mutationFn: ({ email, password }) => loginUser({ email, password }),
        onSuccess: () => {
            navigate("/", { replace: true });
        },
        onError: (error) => {
            throw error
        },
    });
    return { login, isLoggingIn };
}
