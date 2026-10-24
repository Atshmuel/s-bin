import { useTranslation } from "react-i18next"
import SettingsLayout from "@/components/settings/SettingsLayout"
import AccountHeader from "./AccountHeader"

// The account page: whose account it is, then its sections, named from
// components.accountPage.nav.<id>.
function AccountLayout({ user, isSelf, sections }) {
    const { t } = useTranslation()
    return (
        <SettingsLayout header={<AccountHeader user={user} isSelf={isSelf} />} sections={sections}
            sectionName={id => t(`components.accountPage.nav.${id}`)} listLabel={t("components.accountPage.nav.label")} />
    )
}

export default AccountLayout
