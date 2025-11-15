import { useMe } from "@/hooks/users/auth/useMe";
import { useEffect } from "react"
import { Spinner } from "./ui/spinner";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBins } from "@/hooks/bins/useBins";



export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { me, meError, isLoadingMe } = useMe();
  const { allBins, isLoadingBins, binsError } = useBins()

  useEffect(() => {
    if (meError || binsError) {
      toast.error(meError?.message)
      navigate('/login', { replace: true });
    }
  }, [meError, navigate, binsError]);

  if (isLoadingMe || isLoadingBins)
    return (
      <main className="w-full h-dvh flex justify-center items-center">
        <Spinner className={'size-24'} />
      </main>
    );



  if (me && allBins) return children;
}
