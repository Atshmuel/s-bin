import AccountLayout from "@/components/userPageComponents/AccountLayout"
import DangerZoneSection from "@/components/userPageComponents/DangerZoneSection"
import LoadingProfile from "@/components/userPageComponents/LoadingProfile"
import NotificationsSection from "@/components/userPageComponents/NotificationsSection"
import PreferencesSection from "@/components/userPageComponents/PreferencesSection"
import ProfileSection from "@/components/userPageComponents/ProfileSection"
import SecuritySection from "@/components/userPageComponents/SecuritySection"
import { useMe } from "@/hooks/users/auth/useMe"
import { useUser } from "@/hooks/users/useUser"
import ErrorPage from "../generals/ErrorPage"

// The signed-in user's own account.
function AccountProfile() {
    const { me } = useMe()
    const { user, isLoadingUser, userError } = useUser(me.id)

    if (isLoadingUser) return <LoadingProfile />
    if (userError) return <ErrorPage />

    return (
        <AccountLayout user={user} isSelf sections={[
            { id: "profile", element: <ProfileSection id="profile" user={user} canEdit /> },
            { id: "preferences", element: <PreferencesSection id="preferences" user={user} /> },
            { id: "notifications", element: <NotificationsSection id="notifications" user={user} isSelf /> },
            { id: "security", element: <SecuritySection id="security" user={user} isSelf /> },
            { id: "danger", element: <DangerZoneSection id="danger" user={user} isSelf /> },
        ]} />
    )
}

export default AccountProfile
