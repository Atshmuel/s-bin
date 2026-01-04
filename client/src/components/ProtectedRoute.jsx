import { useMe } from "@/hooks/users/auth/useMe";
import { useEffect, useRef } from "react"
import { Spinner } from "./ui/spinner";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDarkMode } from "@/contexts/darkModelContext";




export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { me, meError, isLoadingMe } = useMe();
  const { applyDarkMode } = useDarkMode()

  const isSynced = useRef(false);

  useEffect(() => {
    if (meError) {
      toast.error(meError?.message)
      navigate('/login', { replace: true });
    }
  }, [meError, navigate]);

  useEffect(() => {
    if (!me || typeof me.isDark !== "boolean") return;
    if (isSynced.current) return;

    applyDarkMode(me.isDark)
    isSynced.current = true;
  }, [me, applyDarkMode]);


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
