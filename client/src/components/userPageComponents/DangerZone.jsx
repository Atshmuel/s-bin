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

function DangerZone({ user, isAdmin = false }) {
    const { id } = useParams()
    const userName = user.name
    const [deleteInput, setDeleteInput] = useState("");
    const { deleteUser, isDeleting } = useDeleteUser()
    const { deleteUserAccount, isDeleting: isDeletingAccount } = useDeleteAccount()
    const { deleteBins, isDeleting: isDeletingBins } = useDeleteBinBatch()
    const { allBins } = useBins()

    function handleBinsDeletion() {
        const binIds = allBins.filter(b => {
            return b.ownerId === id || b.ownerId === user._id
        }).map(b => b._id)

        deleteBins({ binIds })
    }

    function handleAccountDeletion() {
        if (isAdmin && !id) {
            deleteUserAccount()
        } else {
            deleteUser({ id: user._id })
        }
    }

    return (
        <Card className={`min-w-[330px] max-w-[400px] h-fit`}>
            <CardHeader className='text-center relative'>
                <CardTitle className='text-destructive font-extrabold'>Danger Zone</CardTitle>
                <CardDescription>This section contains actions that will affect all your belongings; Please act carefully.</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <CardContent className="overflow-auto max-h-[60vh] space-y-4 pb-4">
                <div className="flex justify-between">
                    <Label>Delete {isAdmin ? 'User' : 'Your'} Bins</Label>
                    <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
                        <DialogTrigger asChild>
                            <Button disabled={isDeletingAccount || isDeleting || isDeletingBins} className="cursor-pointer" variant='outline_destructive' size='sm'>{isDeletingAccount || isDeleting || isDeletingBins ? <Spinner /> : 'Delete'}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                                <DialogDescription>This action will permanently delete all {isAdmin ? 'user' : 'your'} bins.
                                    To confirm, type "Delete All" in the field below.
                                    This action cannot be undone.</DialogDescription>
                            </DialogHeader>
                            <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}>Type: 'Delete All' to enable deletion</InputLabel>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button className="cursor-pointer" variant='outline'>Cancel</Button>
                                </DialogClose>
                                <Button className="cursor-pointer" disabled={deleteInput.toLowerCase() !== 'delete all' || isDeletingBins || isDeleting || isDeletingAccount} variant='destructive' onClick={handleBinsDeletion}>{isDeleting || isDeletingBins || isDeletingAccount ? <Spinner /> : 'Delete'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex justify-between">
                    <Label>Delete {isAdmin ? 'User' : 'Your'} Account</Label>
                    <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
                        <DialogTrigger asChild>
                            <Button disabled={isDeletingAccount || isDeleting || isDeletingBins} className="cursor-pointer" variant='outline_destructive' size='sm'>
                                {isDeletingAccount || isDeleting || isDeletingBins ? <Spinner /> : 'Delete'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                                <DialogDescription>This action will permanently delete all {isAdmin ? 'user' : 'your'} bins.
                                    To confirm, type {userName} in the field below.
                                    This action cannot be undone.</DialogDescription>
                            </DialogHeader>
                            <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}>Type: '{userName}' to enable deletion</InputLabel>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button className="cursor-pointer" variant='outline'>Cancel</Button>
                                </DialogClose>
                                <Button className="cursor-pointer" disabled={deleteInput.toLowerCase() !== userName.toLowerCase() || isDeletingBins || isDeleting || isDeletingAccount} onClick={handleAccountDeletion} variant='destructive'>
                                    {isDeletingBins || isDeleting || isDeletingAccount ? <Spinner /> : 'Delete'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <Separator className="mt-6" />
            </CardContent>
            <CardFooter>
                <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1 text-destructive">Note</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>All actions above cannot be undone. Please keep that in mind.</li>
                    </ul>
                </div>
            </CardFooter>
        </Card>
    )
}

export default DangerZone
