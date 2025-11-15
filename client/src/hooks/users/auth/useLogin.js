import { loginUser } from "@/services/apiUsers";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useLogin() {
    const navigate = useNavigate();
    const { mutate: login, isPending: isLoggingIn } = useMutation({
        mutationFn: ({ email, password }) => loginUser({ email, password }),
        onSuccess: () => {
            navigate("/", { replace: true });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    return { login, isLoggingIn };
}
