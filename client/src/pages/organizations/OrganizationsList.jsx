
import DataTable from "../../components/DataTable"
import { Edit, Trash, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InputLabel from "@/components/InputLabel";
import { Spinner } from "@/components/ui/spinner";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";
import { useTranslation } from "react-i18next";
import { useDeleteOrg } from "@/hooks/organizations/useDeleteOrg";
import { useUpdateOrgName } from "@/hooks/organizations/useUpdateOrg";
import { useOrganizations } from "@/hooks/organizations/useOrganizations";
import { useSearchParams } from "react-router-dom";
import { useAppSide } from "@/contexts/AppSideProvider";
function OrganizationsList() {
    const { t } = useTranslation();
    const { deleteOrgById, isDeleting } = useDeleteOrg();
    const { updateOrgName, isUpdatingOrgName } = useUpdateOrgName();
    const { data, isLoadingOrgs, orgsError } = useOrganizations()
    const [searchParams] = useSearchParams();
    const searchId = searchParams.get('id') || '';
    const { isRight, side } = useAppSide()


    const columns = [
        {
            header: t('pages.organizationsList.columns.orgName'),
            accessorKey: 'name',
            id: 'Org name',
            enableSorting: true,
            size: 300,
        },
        {
            header: t('pages.organizationsList.columns.orgId'),
            accessorKey: '_id',
            id: 'Org id',
            enableSorting: true,
            size: 700,
            cell: ({ row }) => (
                <MobileTooltip content={row.original._id}>
                    <div
                        className="flex items-center gap-2 cursor-copy active:scale-95 transition-transform w-fit"
                        onClick={() => {
                            navigator.clipboard.writeText(row.original._id)
                            toast.success('Copied organization ID to clipboard!')
                        }}
                    >
                        <Copy size={16} />
                        <span>{row.original._id}</span>
                    </div>
                </MobileTooltip>
            )
        },
        {
            header: t('pages.organizationsList.columns.editOrgName'),
            cell: ({ row }) => {
                return RenameOrg(row.original._id)
            },
            size: 20,
        },
        {
            header: t('pages.organizationsList.columns.deleteOrg'),
            cell: ({ row }) => {
                return DeleteOrg(row.original._id)
            },
            size: 20,

        },
    ]

    function DeleteOrg(orgId) {
        const [deleteInput, setDeleteInput] = useState('')

        return <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
            <DialogTrigger asChild>
                <Button variant='destructive' className={'cursor-pointer'}><Trash /> {t("delete")}</Button>
            </DialogTrigger>
            <DialogContent side={side}>
                <DialogHeader isRight={isRight} className="pt-6">
                    <DialogTitle>{t("pages.organizationsList.deletion.confirmationTitle")}</DialogTitle>
                    <DialogDescription isRight={!isRight}>{t("pages.organizationsList.deletion.confirmationDescription")}</DialogDescription>
                </DialogHeader>
                <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}>{t("pages.organizationsList.deletion.typeDelete")}</InputLabel>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                    <DialogClose asChild>
                        <Button disabled={isDeleting} className="cursor-pointer" variant='outline'>{t("cancel")}</Button>
                    </DialogClose>
                    <Button className="cursor-pointer" disabled={(deleteInput.toLowerCase() !== 'מחק' && deleteInput.toLowerCase() !== 'delete') || isDeleting} variant='destructive' onClick={() => deleteOrgById({ orgId })
                    }>{isDeleting ? <Spinner /> : t("delete")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    }

    function RenameOrg(orgId) {
        const [renameInput, setRenameInput] = useState('')

        return <Dialog onOpenChange={(open) => !open && setRenameInput('')}>
            <DialogTrigger asChild>
                <Button className={'cursor-pointer'}><Edit /> {t("edit")}</Button>
            </DialogTrigger>
            <DialogContent side={side}>
                <DialogHeader className="pt-6">
                    <DialogTitle>{t("pages.organizationsList.rename.confirmationTitle")}</DialogTitle>
                    <DialogDescription isRight={!isRight}>{t("pages.organizationsList.rename.confirmationDescription")}</DialogDescription>
                </DialogHeader>
                <InputLabel id='name' placeholder=" " type='text' value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}>{t("pages.organizationsList.rename.label")}</InputLabel>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                    <DialogClose asChild>
                        <Button disabled={isUpdatingOrgName} className="cursor-pointer" variant='outline'>{t("cancel")}</Button>
                    </DialogClose>
                    <Button className="cursor-pointer" disabled={!renameInput.length || isUpdatingOrgName} onClick={() => updateOrgName({ orgId, name: renameInput })
                    }>{isUpdatingOrgName ? <Spinner /> : t("submit")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    }


    return (
        <div className="sm:p-10">
            <DataTable columns={columns} data={data ?? []} isLoading={isLoadingOrgs} error={orgsError} title={t('pages.organizationsList.title')} initialSearch={searchId} />
        </div>
    )
}

export default OrganizationsList
