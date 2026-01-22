import { useMe } from "@/hooks/users/auth/useMe";
import { useEffect } from "react"
import { Spinner } from "./ui/spinner";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/users/useUserSettings";
import { useAppSide } from "@/contexts/AppSideProvider";
import { useDarkMode } from "@/contexts/darkModelContext";




export default function ProtectedRoute({ children, roles=[] }) {
  const navigate = useNavigate();
  const { me, meError, isLoadingMe } = useMe();
  const { isLoadingSettings, settings } = useUserSettings(me?.id)
  const { toggleSide, language } = useAppSide();

  const { applyDarkMode } = useDarkMode()


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

    applyDarkMode(settings?.isDark);

    document.documentElement.lang = language;
  }, [settings, language, toggleSide, applyDarkMode]);





  if (isLoadingMe || (me && isLoadingSettings))
    return (
      <main className="w-full h-dvh flex justify-center items-center">
        <Spinner className={'size-24'} />
      </main>
    );


  if (roles.length && !roles.includes(me.role)) {
    return navigate('/error', { replace: true });
  }


  if (me) {
    return children

  }
}
