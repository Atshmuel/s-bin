import DangerZone from "@/components/userPageComponents/DangerZone"
import LoadingProfile from "@/components/userPageComponents/LoadingProfile"
import PasswordForm from "@/components/userPageComponents/PasswordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserManagment from "@/components/userPageComponents/UserManagment"
import UserSettingForm from "@/components/userPageComponents/UserSettingForm"
import { useMe } from "@/hooks/users/auth/useMe"
import { useUser } from "@/hooks/users/useUser"
import { useParams } from "react-router-dom"
import ErrorPage from "../generals/ErrorPage"
import { useTranslation } from "react-i18next"


function UserProfile() {
    let { id } = useParams()
    const { t } = useTranslation()
    const { isAdmin } = useMe()

    const { user, isLoadingUser, userError } = useUser(id)


    if (isLoadingUser) {
        return <LoadingProfile />
    }

    if (!isAdmin) {
        return <ErrorPage code={403} description={t('pages.userProfile.isNotAdmin')} navTo="/users" buttonText={t('pages.userProfile.errorButton')} />
    }

    if (!isLoadingUser && userError) {
        return <ErrorPage code={500} description={t('pages.userProfile.failedToLoad')} navTo="/users" buttonText={t('pages.userProfile.errorButton')} />
    }



    return (
        <div className="h-full flex flex-wrap gap-6 justify-center px-1 py-2 max-w-[1800px] ">
            <div className="flex flex-col gap-4">
                <ProfileForm user={user} isAdmin={isAdmin} />
                <DangerZone user={user} isAdmin={isAdmin} />
            </div>
            <div className="flex flex-col gap-4">
                <PasswordForm user={user} isAdmin={isAdmin} />
                <UserManagment user={user} isAdmin={isAdmin} />
            </div>
            <UserSettingForm user={user} isAdmin={isAdmin} isSelf={false} />
        </div>
    )
}

export default UserProfile
