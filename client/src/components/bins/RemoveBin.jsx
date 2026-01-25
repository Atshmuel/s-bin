import { useAppSide } from "@/contexts/AppSideProvider";
import { useDeleteViaMac } from "@/hooks/bins/useDeleteViaMac";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import InputLabel from "../InputLabel";
import { Spinner } from "../ui/spinner";

function RemoveBin() {
    const { t } = useTranslation();
    const { isRight, side } = useAppSide()
    const { isMobile } = useAppSide();
    const [deleteInput, setDeleteInput] = useState("");
    const { deleteViaMac, isDeleting } = useDeleteViaMac()

    function handleDelete() {
        deleteViaMac(deleteInput);
    }

    return (
        <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
            <DialogTrigger asChild>
                <Button disabled={isDeleting} className="cursor-pointer" variant='outline_destructive' size='sm'>{isDeleting ? <Spinner /> : t("deleteViaMacButton")}</Button>
            </DialogTrigger>
            <DialogContent className={`${!isMobile ? "z-[999999]" : ""}`} side={side}>
                <DialogHeader className="pt-6" isRight={isRight}>
                    <DialogTitle>{t('confirmations.deleteViaMac')}</DialogTitle>
                </DialogHeader>
                <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}>{t("confirmations.typeMacAddress")}</InputLabel>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                    <DialogClose asChild>
                        <Button className="cursor-pointer" variant='outline'>{t("cancel")}</Button>
                    </DialogClose>
                    <Button className="cursor-pointer" disabled={deleteInput.length !== 17 || isDeleting} variant='destructive' onClick={handleDelete}>{isDeleting ? <Spinner /> : t("delete")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RemoveBin
