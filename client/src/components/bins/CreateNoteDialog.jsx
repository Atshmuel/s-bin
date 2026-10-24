import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Spinner } from "../ui/spinner"
import { Textarea } from "../ui/textarea"
import { useUpdateBinMaintenance } from "@/hooks/bins/useUpdateBin"
import { useAppSide } from "@/hooks/useAppSide"

// A maintenance note on the bin.
function CreateNoteDialog({ bin, triggerClassName = "cursor-pointer flex-1 py-6" }) {
    const { t } = useTranslation()
    const { isRight, side } = useAppSide()
    const [note, setNote] = useState('')
    const { updateMaintenance, isUpdating } = useUpdateBinMaintenance()

    function handleSaveNote() {
        if (!note.trim()) return;
        updateMaintenance(
            { id: bin._id, notes: note },
            { onSuccess: () => setNote('') }
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className={triggerClassName} size="sm">
                    {t('notes.create')}
                </Button>
            </DialogTrigger>

            <DialogContent side={side} className="sm:max-w-[425px]">
                <DialogHeader isRight={isRight} className="pt-6">
                    <DialogTitle>{t('notes.createTitle')}</DialogTitle>
                    <DialogDescription isRight={!isRight}>
                        {t('notes.createDescription')}
                    </DialogDescription>
                </DialogHeader>

                <Textarea
                    placeholder={t('notes.placeholder')}
                    className="min-h-[100px]"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />

                <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isUpdating}>
                            {t('cancel')}
                        </Button>
                    </DialogClose>

                    <Button type="submit" disabled={isUpdating || !note.trim()} onClick={handleSaveNote}>
                        {isUpdating ? <Spinner /> : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default CreateNoteDialog
