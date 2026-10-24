import { useTranslation } from "react-i18next";
import { useAutoSaveSettings } from "@/hooks/users/useAutoSaveSettings";
import { useUserSettings } from "@/hooks/users/useUserSettings";
import { clearAICache } from "@/utils/aiCache";
import { SegmentedChoice, SettingsRow, SettingsSection } from "./SettingsSection";

const THEME_TO_SETTING = Object.freeze({ light: false, dark: true, system: null });

// The user's own theme and language, applied as they are picked and saved a
// moment later (useAutoSaveSettings).
function PreferencesSection({ id, user }) {
    const { t } = useTranslation();
    const { settings } = useUserSettings(user._id)
    const save = useAutoSaveSettings(user._id, { isSelf: true })
    const theme = settings?.isDark === true ? "dark" : settings?.isDark === false ? "light" : "system"

    function pickLanguage(next) {
        if (next === settings?.appLanguage) return
        clearAICache()
        save({ appLanguage: next })
    }

    return (
        <SettingsSection id={id} title={t("components.accountPage.preferences.title")}
            description={t("components.accountPage.preferences.description")}>
            <SettingsRow label={t("components.accountPage.preferences.theme")} description={t("components.accountPage.preferences.themeHint")}>
                <SegmentedChoice value={theme} onChange={next => save({ isDark: THEME_TO_SETTING[next] })}
                    disabled={!settings} label={t("components.accountPage.preferences.theme")}
                    options={["light", "dark", "system"].map(value => ({ value, label: t(`components.accountPage.preferences.${value}`) }))} />
            </SettingsRow>
            <SettingsRow label={t("components.accountPage.preferences.language")} description={t("components.accountPage.preferences.languageHint")}>
                <SegmentedChoice value={settings?.appLanguage ?? "en"} onChange={pickLanguage}
                    disabled={!settings} label={t("components.accountPage.preferences.language")}
                    options={[{ value: "he", label: "עברית" }, { value: "en", label: "English" }]} />
            </SettingsRow>
        </SettingsSection>
    )
}

export default PreferencesSection
