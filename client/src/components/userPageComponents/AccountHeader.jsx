import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"

function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return (parts.slice(0, 2).map(part => part[0].toUpperCase()).join("")) || "NA"
}

// Whose account this is: avatar, name, email, role and account status.
function AccountHeader({ user, isSelf }) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16 text-xl">
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                    {isSelf ? t("components.accountPage.header.self") : t("components.accountPage.header.other")}
                </p>
                <h1 className="truncate text-2xl font-semibold">{user.name}</h1>
                <p className="truncate text-sm text-muted-foreground"><span dir="ltr">{user.email}</span></p>
            </div>
            <div className="flex gap-2">
                {user.role && <Badge variant={user.role}>{t(`roles.${user.role}`)}</Badge>}
                {user.status && <Badge variant={user.status}>{t(`statuses.${user.status}`)}</Badge>}
            </div>
        </div>
    )
}

export default AccountHeader
