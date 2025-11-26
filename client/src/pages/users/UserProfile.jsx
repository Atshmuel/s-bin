import DangerZone from "@/components/userPageComponents/DangerZone"
import PasswordForm from "@/components/userPageComponents/passwordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserManagment from "@/components/userPageComponents/UserManagment"
import UserSettingForm from "@/components/userPageComponents/UserSettingForm"
import { useMe } from "@/hooks/users/auth/useMe"


function UserProfile() {
    //get the user id from route
    const { me } = useMe()
    const isAdmin = me.role === 'admin' || me.role === 'owner'
    //TODO - Change this profile to fit a user aceess not without permissions to change any data for the user this page is only an overview of the user and add more info about the user, as a final page we shoud have a page with lots of data about the user 
    //Note - components should not have the action buttons therefore you should update the components to know if the should or shouldnt display the actions and to disable the inputs accoring to that
    return (
        <div className="h-full flex flex-wrap gap-6 justify-center px-4 py-2 max-w-[1800px] ">
            <div className="flex flex-col gap-4">
                <ProfileForm isAdmin={isAdmin} />
                <DangerZone isAdmin={isAdmin} />
            </div>
            <div className="flex flex-col gap-4">
                <PasswordForm isAdmin={isAdmin} />
                <UserManagment />
            </div>
            <UserSettingForm isAdmin={isAdmin} />
        </div>
    )
}

export default UserProfile
