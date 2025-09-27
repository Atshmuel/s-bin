import DangerZone from "@/components/userPageComponents/DangerZone"
import PasswordForm from "@/components/userPageComponents/passwordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserSettingForm from "@/components/userPageComponents/UserSettingForm"


function UserProfile() {
    return (
        <div className="h-full flex gap-6 ">
            <div className="space-y-6">
                <ProfileForm />
                <DangerZone userName={'Shmuel Dev'} />
            </div>
            <PasswordForm />
            <UserSettingForm />
        </div>
    )
}

export default UserProfile
