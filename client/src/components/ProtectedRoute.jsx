import { useMe } from "@/hooks/users/auth/useMe";
import { useEffect } from "react"
import { Spinner } from "./ui/spinner";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/users/useUserSettings";
import { useAppSide } from "@/contexts/AppSideProvider";




export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { me, meError, isLoadingMe } = useMe();
  const { isLoadingSettings, settings } = useUserSettings(me?.id)
  const { toggleSide, language } = useAppSide();


  useEffect(() => {
    if (meError) {
      toast.error(meError?.message)
      navigate('/login', { replace: true });
    }
  }, [meError, navigate]);

  useEffect(() => {
    if (settings?.appLanguage && language !== settings.appLanguage) {
      toggleSide(settings.appLanguage)
    }

    document.documentElement.lang = language;
  }, [settings, language, toggleSide]);


  if (isLoadingMe || (me && isLoadingSettings))
    return (
      <main className="w-full h-dvh flex justify-center items-center">
        <Spinner className={'size-24'} />
      </main>
    );

  if (me) {
    return children

  }
}
