import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { useDeleteUser } from "@/hooks/users/useDeleteUser";
import { useDeleteAccount } from "@/hooks/users/useDeleteAccount";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";
import { SettingsRow, SettingsSection } from "./SettingsSection";

// Deleting the account: one's own, or (as an admin or owner) another user's.
// Confirmed by typing the account's email.
function DangerZoneSection({ id, user, isSelf }) {
    const { t } = useTranslation();
    const { deleteUser, isDeleting } = useDeleteUser()
    const { deleteUserAccount, isDeleting: isDeletingAccount } = useDeleteAccount()
    const busy = isDeleting || isDeletingAccount

    return (
        <SettingsSection id={id} danger title={t("components.accountPage.danger.title")}
            description={t("components.accountPage.danger.description")}>
            <SettingsRow label={isSelf ? t("components.accountPage.danger.deleteSelf") : t("components.accountPage.danger.deleteOther")}
                description={isSelf ? t("components.accountPage.danger.deleteSelfHint") : t("components.accountPage.danger.deleteOtherHint")}>
                <ConfirmDeleteDialog
                    trigger={
                        <Button disabled={busy} variant="outline_destructive">
                            {busy ? <Spinner /> : t("delete")}
                        </Button>
                    }
                    title={t("confirmations.confirmationTitle")}
                    description={<>
                        {isSelf ? t("confirmations.confirmationDescriptionYour") : t("confirmations.confirmationDescriptionUser")}
                        <br />
                        {t("confirmations.confirmationUserName", { userName: user.email })}
                    </>}
                    inputLabel={t("confirmations.typeUserName", { userName: user.email })}
                    confirmWords={[user.email]}
                    isDeleting={busy}
                    onConfirm={() => isSelf ? deleteUserAccount() : deleteUser({ id: user._id })}
                />
            </SettingsRow>
        </SettingsSection>
    )
}

export default DangerZoneSection
