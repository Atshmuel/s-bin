import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { useDeleteUser } from "@/hooks/users/useDeleteUser";
import { Spinner } from "../ui/spinner";
import { useParams } from "react-router-dom";
import { useDeleteAccount } from "@/hooks/users/useDeleteAccount";
import { useTranslation } from "react-i18next";
import ConfirmDeleteDialog from "../ConfirmDeleteDialog";

function DangerZone({ user, isAdmin = false }) {
    const { id } = useParams()
    const { t } = useTranslation();

    const userName = user.name
    const { deleteUser, isDeleting } = useDeleteUser()
    const { deleteUserAccount, isDeleting: isDeletingAccount } = useDeleteAccount()
    function handleAccountDeletion() {
        if (isAdmin && !id) {
            deleteUserAccount()
        } else {
            deleteUser({ id: user._id })
        }
    }

    return (
        <Card className={`min-w-[330px] max-w-[400px] h-fit`}>
            <CardHeader className=' text-center relative'>
                <CardTitle className='text-destructive font-extrabold'>{t("components.dangerZoneCard.title")}</CardTitle>
                <CardDescription>{t("components.dangerZoneCard.subTitle")}</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <CardContent className="overflow-auto max-h-[60vh] space-y-4 pb-4">
                <div className="flex justify-between">
                    <Label>
                        {isAdmin ? t('components.dangerZoneCard.deleteUserAccount') : t('components.dangerZoneCard.deleteYourAccount')}
                    </Label>
                    <ConfirmDeleteDialog
                        trigger={
                            <Button disabled={isDeletingAccount || isDeleting} className="cursor-pointer" variant='outline_destructive' size='sm'>
                                {isDeletingAccount || isDeleting ? <Spinner /> : t("delete")}
                            </Button>
                        }
                        title={t('confirmations.confirmationTitle')}
                        description={<>
                            {isAdmin ? t('confirmations.confirmationDescriptionUser') : t('confirmations.confirmationDescriptionYour')}
                            <br />
                            {t("confirmations.confirmationUserName", { userName })}
                        </>}
                        inputLabel={t("confirmations.typeUserName", { userName })}
                        confirmWords={[userName]}
                        isDeleting={isDeleting || isDeletingAccount}
                        onConfirm={handleAccountDeletion}
                    />
                </div>
                <Separator className="mt-6" />
            </CardContent>
            <CardFooter>
                <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1 text-destructive">{t("components.dangerZoneCard.note")}</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>{t("components.dangerZoneCard.warning")}</li>
                    </ul>
                </div>
            </CardFooter>
        </Card>
    )
}

export default DangerZone
