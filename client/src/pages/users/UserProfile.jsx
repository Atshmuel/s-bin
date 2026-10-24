import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import AccessSection from "@/components/userPageComponents/AccessSection"
import AccountLayout from "@/components/userPageComponents/AccountLayout"
import DangerZoneSection from "@/components/userPageComponents/DangerZoneSection"
import LoadingProfile from "@/components/userPageComponents/LoadingProfile"
import NotificationsSection from "@/components/userPageComponents/NotificationsSection"
import ProfileSection from "@/components/userPageComponents/ProfileSection"
import SecuritySection from "@/components/userPageComponents/SecuritySection"
import { useMe } from "@/hooks/users/auth/useMe"
import { useUser } from "@/hooks/users/useUser"
import ErrorPage from "../generals/ErrorPage"

// Another user's account, for admins and owners. Only an owner may change
// someone else's name, email, settings or password, or delete an account
// above the user role (the server allows no one else), so an admin sees
// those read-only or not at all.
function UserProfile() {
    const { id } = useParams()
    const { t } = useTranslation()
    const { me, isAdmin, isOwner } = useMe()
    const { user, isLoadingUser, userError } = useUser(id)

    if (isLoadingUser) return <LoadingProfile />
    if (!isAdmin) {
        return <ErrorPage code={403} description={t('pages.userProfile.isNotAdmin')} navTo="/users" buttonText={t('pages.userProfile.errorButton')} />
    }
    if (userError) {
        return <ErrorPage code={500} description={t('pages.userProfile.failedToLoad')} navTo="/users" buttonText={t('pages.userProfile.errorButton')} />
    }

    const isSelf = user._id === me.id
    const sections = [
        { id: "profile", element: <ProfileSection id="profile" user={user} canEdit={isOwner || isSelf} /> },
        ...(!isSelf ? [{ id: "access", element: <AccessSection id="access" user={user} /> }] : []),
        ...(isOwner || isSelf ? [{ id: "notifications", element: <NotificationsSection id="notifications" user={user} isSelf={isSelf} /> }] : []),
        ...(isOwner || isSelf ? [{ id: "security", element: <SecuritySection id="security" user={user} isSelf={isSelf} /> }] : []),
        // An admin may delete only accounts with the user role.
        ...(isOwner || isSelf || user.role === "user"
            ? [{ id: "danger", element: <DangerZoneSection id="danger" user={user} isSelf={isSelf} /> }] : []),
    ]
    return <AccountLayout user={user} isSelf={isSelf} sections={sections} />
}

export default UserProfile
