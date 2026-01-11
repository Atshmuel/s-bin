import { getVariant } from "@/utils/binHelpers"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Copy, Info, MapPin, Trash2, Wrench } from "lucide-react"
import { Badge } from "../ui/badge"
import { Link } from "react-router-dom"
import { Separator } from "../ui/separator"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import Battery from "./Battary"
import { Spinner } from "../ui/spinner"
import EmptyCard from "../EmptyCard"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { useState } from "react"
import InputLabel from "../InputLabel"
import { useDeleteBin } from "@/hooks/bins/useDeleteBin"
import { useTranslation } from "react-i18next"
import { useAppSide } from "@/contexts/AppSideProvider"
import { Textarea } from "../ui/textarea"
import { useUpdateBinMaintenance } from "@/hooks/bins/useUpdateBin"
import { useMe } from "@/hooks/users/auth/useMe";

function BinCard({ bin, actions = true, handleLocationClick, isLoading = true, ...props }) {
    const [deleteInput, setDeleteInput] = useState('')
    const { deleteBin, isDeleting } = useDeleteBin()
    const { t } = useTranslation()
    const { isRight } = useAppSide()

    const [note, setNote] = useState('')
    const { updateMaintenance, isUpdating } = useUpdateBinMaintenance()

    const { me } = useMe();
    const isTechnician = me?.role === 'technician'

    function handleCopyDeviceKey() {
        navigator.clipboard.writeText(bin?.deviceKey)
        toast.success('Copied device key to your clipboard!')
    }

    function handleSaveNote() {
        if (!note.trim()) return;
        updateMaintenance(
            { id: bin._id, notes: note },
            { onSuccess: () => setNote('') }
        );
    }

    return (
        <Card {...props}>
            {isLoading ?
                <div className="flex h-full justify-center items-center">
                    <Spinner className={"size-24"} />
                </div>
                : bin ?
                    <>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <div className="flex gap-3">
                                    <h3 className="flex items-center gap-2">
                                        <Trash2 size={20} />
                                        <span>{bin.binName}</span>
                                    </h3>

                                    <Battery level={bin.status.battery} />
                                </div>

                                <Badge variant={getVariant(bin.status.health)}>
                                    {t(`levels.${bin.status.health}`)}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                {t('lastUpdated')}: {new Date(bin.status.updatedAt).toLocaleString(isRight ? 'en-US' : 'he-IL')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 text-sm">
                            <div className="space-y-3">

                                <div className="flex flex-row justify-between">
                                    <span className="font-medium">{t('fillLevel')}:</span>
                                    <span>{bin.status.level}%</span>
                                </div>

                                <div className="flex flex-row justify-between">
                                    <span className="font-medium">{t('components.binCard.deviceKey')}:</span>
                                    <Tooltip >
                                        <TooltipTrigger className="cursor-copy" asChild>
                                            <div onClick={handleCopyDeviceKey} className="flex gap-2">
                                                <Copy size={18} />
                                                ************
                                            </div></TooltipTrigger>
                                        <TooltipContent>{bin.deviceKey}</TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="flex flex-row justify-between">
                                    <span className="font-medium">{t('components.binCard.ownerId')}:</span>
                                    <span className="truncate max-w-[200px]">{bin.ownerId}</span>
                                </div>

                                <div className="flex flex-row justify-between">
                                    <span className="font-medium">{t('components.binCard.location')}:</span>
                                    {handleLocationClick ? <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div onClick={handleLocationClick} className="flex flex-row gap-2 cursor-pointer">
                                                <MapPin size={18} />
                                                <span>{bin.location.coordinates.join(", ")}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t('components.binCard.locationTooltip')}
                                        </TooltipContent>
                                    </Tooltip> : <div className="flex flex-row gap-2">
                                        <span>{bin.location.coordinates.join(", ")}</span>
                                    </div>}
                                </div>
                            </div>

                            <Separator />

                            {bin.maintenance && (
                                <div className="space-y-2.5">
                                    <p className="text-sm md:text-base font-medium flex gap-2">
                                        <Wrench size={18} /> <span>{t('components.binCard.maintenance.title')}:</span>
                                    </p>
                                    <div className="flex justify-between">
                                        <span>{t('components.binCard.maintenance.lastService')}:</span>
                                        <span>{new Date(bin.maintenance.lastServiceAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('components.binCard.maintenance.nextService')}:</span>
                                        <span>{new Date(bin.maintenance.nextServiceAt).toLocaleDateString()}</span>
                                    </div>
                                    {bin.maintenance.technicianId ?
                                        <>
                                            <div className="flex justify-between">
                                                <span>{t('components.binCard.maintenance.technician')}:</span>
                                                <Link to={`/user/${bin.maintenance.technicianId}`}><Button className={"p-0 m-0 h-fit"} variant={'link'}>{t('components.binCard.maintenance.seeProfile')}</Button></Link>
                                            </div>
                                            {bin.maintenance.notes && <div>
                                                <span className="">{t('components.binCard.maintenance.techNote')}:</span>
                                                <p className="mt-2 text-sm italic text-muted-foreground">
                                                    “{bin.maintenance?.notes}”
                                                </p>
                                            </div>
                                            }
                                        </>
                                        :
                                        <div className="text-primary flex gap-4 text-base items-center">
                                            <Info size={18} />
                                            <p>{t('components.binCard.maintenance.notServedYet')}</p>
                                        </div>
                                    }
                                </div>
                            )}
                        </CardContent>
                        {actions && (
                            <CardFooter className={`flex justify-center ${isRight ? "" : "flex-row-reverse"} gap-2`}>
                                <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
                                    <DialogTrigger asChild>
                                        <Button className="cursor-pointer flex-1 py-6" variant='outline_destructive' size='sm'>{t('delete')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('confirmations.confirmationTitle')}</DialogTitle>
                                            <DialogDescription>{t('confirmations.confirmationDescription')}</DialogDescription>
                                        </DialogHeader>
                                        <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                                            onChange={(e) => setDeleteInput(e.target.value)}>{t('confirmations.typeDelete')}</InputLabel>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button disabled={isDeleting} className="cursor-pointer" variant='outline'>{t('cancel')}</Button>
                                            </DialogClose>
                                            <Button className="cursor-pointer" disabled={(deleteInput.toLowerCase() !== 'delete' && deleteInput.toLowerCase() !== 'מחק') || isDeleting} variant='destructive' onClick={() => deleteBin({ id: bin._id })
                                            }>{isDeleting ? <Spinner /> : t('delete')}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                {isTechnician && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="cursor-pointer flex-1 py-6" size="sm">
                                                {t('notes.create')}
                                            </Button>
                                        </DialogTrigger>

                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>{t('notes.createTitle')}</DialogTitle>
                                                <DialogDescription>
                                                    {t('notes.createDescription')}
                                                </DialogDescription>
                                            </DialogHeader>

                                            <Textarea
                                                placeholder={t('notes.placeholder')}
                                                className="min-h-[100px]"
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                            />

                                            <DialogFooter>
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
                                    </Dialog>)}

                            </CardFooter>
                        )}
                    </>
                    :
                    <EmptyCard title={t("components.binCard.emptyCard")} description={t("components.binCard.emptyDescription")} />
            }
        </Card>
    )
}

export default BinCard
