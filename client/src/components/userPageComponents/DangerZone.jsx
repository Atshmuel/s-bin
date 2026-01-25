import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button";
import InputLabel from "../InputLabel";
import { Label } from "../ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useState } from "react";
import { useDeleteUser } from "@/hooks/users/useDeleteUser";
import { Spinner } from "../ui/spinner";
import { useParams } from "react-router-dom";
import { useDeleteAccount } from "@/hooks/users/useDeleteAccount";
import { useDeleteBinBatch } from "@/hooks/bins/useDeleteAllBins";
import { useBins } from "@/hooks/bins/useBins";
import { useAppSide } from "@/contexts/AppSideProvider";
import { useTranslation } from "react-i18next";

function DangerZone({ user, isAdmin = false }) {
    const { id } = useParams()
    const { isRight, side } = useAppSide()
    const { t } = useTranslation();

    const userName = user.name
    const [deleteInput, setDeleteInput] = useState("");
    const { deleteUser, isDeleting } = useDeleteUser()
    const { deleteUserAccount, isDeleting: isDeletingAccount } = useDeleteAccount()
    const { deleteBins, isDeleting: isDeletingBins } = useDeleteBinBatch()
    // const { allBins } = useBins()

    // function handleBinsDeletion() {
    //     const binIds = allBins.filter(b => {
    //         return b.ownerId === id || b.ownerId === user._id
    //     }).map(b => b._id)

    //     deleteBins({ binIds })
    // }

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
                {/* <div className="flex justify-between">
                    <Label>{isAdmin ? t("components.dangerZoneCard.deleteUserBins") : t("components.dangerZoneCard.deleteYourBins")}</Label>
                    <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
                        <DialogTrigger asChild>
                            <Button disabled={isDeletingAccount || isDeleting || isDeletingBins} className="cursor-pointer" variant='outline_destructive' size='sm'>{isDeletingAccount || isDeleting || isDeletingBins ? <Spinner /> : t("delete")}</Button>
                        </DialogTrigger>
                        <DialogContent side={side}>
                            <DialogHeader className="pt-6" isRight={isRight}>
                                <DialogTitle>{t('confirmations.confirmationTitle')}</DialogTitle>
                                <DialogDescription isRight={!isRight}>
                                    {t('confirmations.typeDeleteAllDesc', { case: isAdmin ? "user's" : "your" })}</DialogDescription>
                            </DialogHeader>
                            <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}>{t("confirmations.typeDeleteAll")}</InputLabel>
                            <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                                <DialogClose asChild>
                                    <Button className="cursor-pointer" variant='outline'>{t("cancel")}</Button>
                                </DialogClose>
                                <Button className="cursor-pointer" disabled={(deleteInput.toLowerCase() !== t("confirmations.deleteAllConfirmWord").toLowerCase()) || isDeletingBins || isDeleting || isDeletingAccount} variant='destructive' onClick={handleBinsDeletion}>{isDeleting || isDeletingBins || isDeletingAccount ? <Spinner /> : t("delete")}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div> */}
                <div className="flex justify-between">
                    <Label>
                        {isAdmin ? t('components.dangerZoneCard.deleteUserAccount') : t('components.dangerZoneCard.deleteYourAccount')}
                    </Label>
                    <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
                        <DialogTrigger asChild>
                            <Button disabled={isDeletingAccount || isDeleting || isDeletingBins} className="cursor-pointer" variant='outline_destructive' size='sm'>
                                {isDeletingAccount || isDeleting || isDeletingBins ? <Spinner /> : t("delete")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent side={side}>
                            <DialogHeader className="pt-6" isRight={isRight}>
                                <DialogTitle>{t('confirmations.confirmationTitle')}</DialogTitle>
                                <DialogDescription isRight={!isRight}>{isAdmin ? t('confirmations.confirmationDescriptionUser') : t('confirmations.confirmationDescriptionYour')}
                                    <br />
                                    {t("confirmations.confirmationUserName", { userName })}</DialogDescription>
                            </DialogHeader>
                            <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}>
                                {t("confirmations.typeUserName", { userName })}
                            </InputLabel>
                            <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                                <DialogClose asChild>
                                    <Button className="cursor-pointer" variant='outline'>{t("cancel")}</Button>
                                </DialogClose>
                                <Button className="cursor-pointer" disabled={deleteInput.toLowerCase() !== userName.toLowerCase() || isDeletingBins || isDeleting || isDeletingAccount} onClick={handleAccountDeletion} variant='destructive'>
                                    {isDeletingBins || isDeleting || isDeletingAccount ? <Spinner /> : t("delete")}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
