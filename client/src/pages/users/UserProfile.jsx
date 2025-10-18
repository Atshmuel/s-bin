import DangerZone from "@/components/userPageComponents/DangerZone"
import PasswordForm from "@/components/userPageComponents/passwordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserSettingForm from "@/components/userPageComponents/UserSettingForm"


function UserProfile() {
    //TODO - Change this profile to fit a user aceess not without permissions to change any data for the user this page is only an overview of the user and add more info about the user, as a final page we shoud have a page with lots of data about the user 
    //Note - components should not have the action buttons therefore you should update the components to know if the should or shouldnt display the actions and to disable the inputs accoring to that
    return (
        <div className="h-full flex flex-wrap gap-6 justify-center px-4 py-2 max-w-[1800px] ">
            <ProfileForm />
        </div>
    )
}

export default UserProfile
