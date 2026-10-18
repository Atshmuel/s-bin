import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import ConfirmDeleteDialog from "../ConfirmDeleteDialog"
import { useDeleteBin } from "@/hooks/bins/useDeleteBin"

// Deleting a bin asks the user to type "delete" first.
function DeleteBinDialog({ bin, triggerClassName = "cursor-pointer flex-1 py-6" }) {
    const { t } = useTranslation()
    const { deleteBin, isDeleting } = useDeleteBin()

    return (
        <ConfirmDeleteDialog
            trigger={<Button className={triggerClassName} variant='outline_destructive' size='sm'>{t('delete')}</Button>}
            title={t('confirmations.confirmationTitle')}
            description={t('confirmations.confirmationDescription')}
            inputLabel={t('confirmations.typeDelete')}
            isDeleting={isDeleting}
            onConfirm={() => deleteBin({ id: bin._id })}
        />
    )
}

export default DeleteBinDialog
