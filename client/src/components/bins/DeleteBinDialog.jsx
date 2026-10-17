import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Spinner } from "../ui/spinner"
import InputLabel from "../InputLabel"
import { useDeleteBin } from "@/hooks/bins/useDeleteBin"
import { useAppSide } from "@/contexts/AppSideProvider"

// Deleting a bin asks the user to type "delete" first.
function DeleteBinDialog({ bin, triggerClassName = "cursor-pointer flex-1 py-6" }) {
    const { t } = useTranslation()
    const { isRight, side } = useAppSide()
    const [deleteInput, setDeleteInput] = useState('')
    const { deleteBin, isDeleting } = useDeleteBin()

    return (
        <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
            <DialogTrigger asChild>
                <Button className={triggerClassName} variant='outline_destructive' size='sm'>{t('delete')}
                </Button>
            </DialogTrigger>
            <DialogContent side={side}>
                <DialogHeader isRight={isRight} className="pt-6">
                    <DialogTitle>{t('confirmations.confirmationTitle')}</DialogTitle>
                    <DialogDescription isRight={!isRight}>{t('confirmations.confirmationDescription')}</DialogDescription>
                </DialogHeader>
                <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}>{t('confirmations.typeDelete')}</InputLabel>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                    <DialogClose asChild>
                        <Button disabled={isDeleting} className="cursor-pointer" variant='outline'>{t('cancel')}</Button>
                    </DialogClose>
                    <Button className="cursor-pointer" disabled={(deleteInput.toLowerCase() !== 'delete' && deleteInput.toLowerCase() !== 'מחק') || isDeleting} variant='destructive' onClick={() => deleteBin({ id: bin._id })
                    }>{isDeleting ? <Spinner /> : t('delete')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteBinDialog
