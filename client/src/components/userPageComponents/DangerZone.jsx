import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "../ui/button";
import InputLabel from "../InputLabel";
import { Label } from "../ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useState } from "react";

function DangerZone({ userName }) {
    const [deleteInput, setDeleteInput] = useState("");

    return (
        <Card className="min-w-[350px] max-w-[400px] h-fit">
            <CardHeader className='text-center relative'>
                <CardTitle className='text-destructive font-extrabold'>Danger Zone</CardTitle>
                <CardDescription>This section contains actions that will affect all your belongings; Please act carefully.</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <CardContent className="overflow-scroll max-h-[63vh] space-y-4">
                <div className="flex justify-between">
                    <Label>Delete Your Bins</Label>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant='destructive' size='sm'>Delete</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                                <DialogDescription>This action will permanently delete all your bins.
                                    To confirm, type "Delete All" in the field below.
                                    This action cannot be undone.</DialogDescription>
                            </DialogHeader>
                            <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}>Type: 'Delete All' to enable deletion</InputLabel>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant='outline'>Cancel</Button>
                                </DialogClose>
                                <Button disabled={deleteInput.toLowerCase() !== 'delete all'} variant='destructive'>Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex justify-between">
                    <Label>Delete Your Account</Label>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant='destructive' size='sm'>Delete</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                                <DialogDescription>This action will permanently delete all your bins.
                                    To confirm, type {userName} in the field below.
                                    This action cannot be undone.</DialogDescription>
                            </DialogHeader>
                            <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}>Type: '{userName}' to enable deletion</InputLabel>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant='outline'>Cancel</Button>
                                </DialogClose>
                                <Button disabled={deleteInput.toLowerCase() !== userName.toLowerCase()} variant='destructive'>Delete</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
            <Separator className="mb-4" />
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
