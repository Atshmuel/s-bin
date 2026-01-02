import { useMe } from "@/hooks/users/auth/useMe";
import { useEffect } from "react"
import { Spinner } from "./ui/spinner";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/users/useUserSettings";
import { useTranslation } from "react-i18next";




export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { me, meError, isLoadingMe } = useMe();
  const { i18n } = useTranslation();
  const { isLoadingSettings, settings } = useUserSettings(me?.id)


  useEffect(() => {
    if (meError) {
      toast.error(meError?.message)
      navigate('/login', { replace: true });
    }
  }, [meError, navigate]);

  useEffect(() => {
    if (settings?.appLanguage && i18n.language !== settings.appLanguage) {
      i18n.changeLanguage(settings.appLanguage);
    }

    document.documentElement.lang = i18n.language;
  }, [settings, i18n]);


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
