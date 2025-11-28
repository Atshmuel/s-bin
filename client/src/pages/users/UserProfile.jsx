import DangerZone from "@/components/userPageComponents/DangerZone"
import LoadingProfile from "@/components/userPageComponents/LoadingProfile"
import PasswordForm from "@/components/userPageComponents/passwordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserManagment from "@/components/userPageComponents/UserManagment"
import UserSettingForm from "@/components/userPageComponents/UserSettingForm"
import { useMe } from "@/hooks/users/auth/useMe"
import { useUser } from "@/hooks/users/useUser"
import { useParams } from "react-router-dom"
import ErrorPage from "../generals/ErrorPage"


function UserProfile() {
    let { id } = useParams()
    const { isAdmin } = useMe()

    const { user, isLoadingUser, userError } = useUser(id)


    if (isLoadingUser) {
        return <LoadingProfile />
    }

    if (!isAdmin) {
        return <ErrorPage code={403} description="You are not allowed to see this page" navTo="/users" buttonText="Back to users" />
    }

    if (!isLoadingUser && userError) {
        return <ErrorPage code={500} description="Could not find the user you'r looking for" navTo="/users" buttonText="Back to users" />
    }



    return (
        <div className="h-full flex flex-wrap gap-6 justify-center px-4 py-2 max-w-[1800px] ">
            <div className="flex flex-col gap-4">
                <ProfileForm user={user} isAdmin={isAdmin} />
                <DangerZone user={user} isAdmin={isAdmin} />
            </div>
            <div className="flex flex-col gap-4">
                <PasswordForm user={user} isAdmin={isAdmin} />
                <UserManagment user={user} isAdmin={isAdmin} />
            </div>
            <UserSettingForm user={user} isAdmin={isAdmin} />
        </div>
    )
}

export default UserProfile
