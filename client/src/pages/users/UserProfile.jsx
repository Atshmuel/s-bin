import DangerZone from "@/components/userPageComponents/DangerZone"
import PasswordForm from "@/components/userPageComponents/passwordForm"
import ProfileForm from "@/components/userPageComponents/ProfileForm"
import UserSettingForm from "@/components/userPageComponents/UserSettingForm"


function UserProfile() {
    return (
        <div className="h-full flex flex-wrap gap-6 justify-center px-4 py-2 max-w-[1800px] ">
            <div className="flex flex-col gap-4">
                <ProfileForm />
                <DangerZone userName={'Shmuel Dev'} />
            </div>
            <UserSettingForm />
            <PasswordForm />
        </div>
    )
}

export default UserProfile
