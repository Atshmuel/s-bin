import PasswordForm from "@/components/userPageComponents/passwordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserSettingForm from "@/components/userPageComponents/userSettingForm"


function UserProfile() {
    return (
        <div className="h-full flex gap-4 ">
            <div className="flex flex-col gap-4 ">
                <ProfileForm />
                <PasswordForm />
            </div>
            <UserSettingForm />
        </div>
    )
}

export default UserProfile
