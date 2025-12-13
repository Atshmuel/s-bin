import { useMe } from "@/hooks/users/auth/useMe";
import { useEffect } from "react"
import { Spinner } from "./ui/spinner";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";




export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { me, meError, isLoadingMe } = useMe();

  useEffect(() => {
    if (meError) {
      toast.error(meError?.message)
      navigate('/login', { replace: true });
    }
  }, [meError, navigate]);

  if (isLoadingMe)
    return (
      <main className="w-full h-dvh flex justify-center items-center">
        <Spinner className={'size-24'} />
      </main>
    );

  if (me) {
    return children

  }
}
