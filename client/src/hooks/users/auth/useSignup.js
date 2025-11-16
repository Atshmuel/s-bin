import { createUser } from "@/services/apiUsers";
import { useMutation } from "@tanstack/react-query";


export function useSignup() {
    const { mutateAsync: signup, isPending: isSigningup } = useMutation({
        mutationFn: ({ email, password, name }) => createUser({ email, password, name }),
    });
    return { signup, isSigningup };
}




