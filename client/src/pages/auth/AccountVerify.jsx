
import { Spinner } from "@/components/ui/spinner";
import { verifyNewUser } from "@/services/apiUsers";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

function AccountVerify() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate()
    const token = searchParams.get('token')


    const { data, isPending: isVerifing, isSuccess, error } = useQuery({
        queryKey: ['verify-user', token],
        queryFn: () => verifyNewUser({ token }),
    });

    useEffect(() => {
        if (isSuccess) {
            toast.success('Account verified, moving to login')
            navigate(`/login${data?.user?.email ? '?email=' + data?.user?.email : ''}`, { replace: true })
        }
        if (error) {
            toast.error('Failed to verify your account')
            navigate('/error', { replace: true })
        }
    }, [error, isSuccess, data, navigate])

    return <div className="h-dvh w-full flex justify-center items-center">
        {isVerifing ? <Spinner className={'size-24'} /> : null}
    </div>

}

export default AccountVerify




