import DangerZone from "@/components/userPageComponents/DangerZone"
import LoadingProfile from "@/components/userPageComponents/LoadingProfile"
import PasswordForm from "@/components/userPageComponents/passwordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserSettingForm from "@/components/userPageComponents/UserSettingForm"
import { useMe } from "@/hooks/users/auth/useMe"
import { useUser } from "@/hooks/users/useUser"
import ErrorPage from "../generals/ErrorPage"


function AccountProfile() {
    const { me } = useMe()
    const { user, isLoadingUser, userError } = useUser(me.id)

    if (isLoadingUser) {
        return <LoadingProfile />
    }

    if (!isLoadingUser && userError) {
        return <ErrorPage />
    }

    return (
        <div className="h-full flex flex-wrap gap-6 justify-center px-4 py-2 max-w-[1800px] ">
            <div className="flex flex-col gap-4">
                <ProfileForm user={user} />
                <DangerZone user={user} />
            </div>
            <UserSettingForm user={user} />
            <PasswordForm user={user} />
        </div>
    )
}

export default AccountProfile
