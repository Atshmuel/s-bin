import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Switch } from "../ui/switch";
import { Skeleton } from "../ui/skeleton";
import { useAppSide } from "@/hooks/useAppSide";
import { useAutoSaveSettings } from "@/hooks/users/useAutoSaveSettings";
import { useUserSettings } from "@/hooks/users/useUserSettings";
import { SettingsRow, SettingsSection } from "./SettingsSection";

// The daily email report, switched on or off and saved a moment later
// (useAutoSaveSettings). Owners get every organization's report; everyone
// else, their organization's.
function NotificationsSection({ id, user, isSelf }) {
    const { t } = useTranslation();
    const { isRight } = useAppSide()
    const { settings, isLoadingSettings, settingsError } = useUserSettings(user._id)
    const save = useAutoSaveSettings(user._id, { isSelf })
    const setEmail = email => save({ notifications: { ...settings.notifications, email } })

    return (
        <SettingsSection id={id} title={t("components.accountPage.notifications.title")}
            description={isSelf ? t("components.accountPage.notifications.description") : t("components.accountPage.notifications.descriptionOther")}>
            <SettingsRow label={t("components.accountPage.notifications.dailyEmail")}
                description={user.role === "owner"
                    ? t("components.accountPage.notifications.dailyEmailOwner")
                    : t("components.accountPage.notifications.dailyEmailHint")}>
                {settingsError ? (
                    <span className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="size-4" />{t("components.accountPage.notifications.loadError")}
                    </span>
                ) : isLoadingSettings ? <Skeleton className="h-5 w-9 rounded-full" /> : (
                    <Switch isRight={isRight} checked={!!settings?.notifications?.email} onCheckedChange={setEmail}
                        aria-label={t("components.accountPage.notifications.dailyEmail")} />
                )}
            </SettingsRow>
        </SettingsSection>
    )
}

export default NotificationsSection
