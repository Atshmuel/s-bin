import { getVariant } from "@/utils/binHelpers"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Copy, Info, MapPin, Pencil, Trash2, Wrench, Check, X } from "lucide-react"
import { Badge } from "../ui/badge"
import { Link } from "react-router-dom"
import { Separator } from "../ui/separator"
import { toast } from "sonner"
import { MobileTooltip } from "../ui/mobile-tooltip"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import Battery from "./Battary"
import { Spinner } from "../ui/spinner"
import EmptyCard from "../EmptyCard"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { useState, useRef, useEffect } from "react"
import InputLabel from "../InputLabel"
import { useDeleteBin } from "@/hooks/bins/useDeleteBin"
import { useTranslation } from "react-i18next"
import { useAppSide } from "@/contexts/AppSideProvider"
import { Textarea } from "../ui/textarea"
import { useUpdateBinMaintenance, useUpdateBinName } from "@/hooks/bins/useUpdateBin"
import { useMe } from "@/hooks/users/auth/useMe";

function BinCard({ bin, actions = true, handleLocationClick, isLoading = true, ...props }) {
    const [deleteInput, setDeleteInput] = useState('')
    const { deleteBin, isDeleting } = useDeleteBin()
    const { t } = useTranslation()
    const { isRight, side } = useAppSide()

    const [note, setNote] = useState('')
    const { updateMaintenance, isUpdating } = useUpdateBinMaintenance()

    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')
    const { updateName, isUpdating: isUpdatingName } = useUpdateBinName()
    const nameInputRef = useRef(null)

    const { me } = useMe();
    const isUser = me?.role === 'user'

    function handleCopyDeviceKey() {
        navigator.clipboard.writeText(bin?.deviceKey)
        toast.success('Copied device key to your clipboard!')
    }

    function handleCopyOwnerId() {
        navigator.clipboard.writeText(bin?.ownerId)
        toast.success('Copied owner ID to your clipboard!')
    }

    function handleSaveNote() {
        if (!note.trim()) return;
        updateMaintenance(
            { id: bin._id, notes: note },
            { onSuccess: () => setNote('') }
        );
    }

    function handleStartEditName() {
        setEditedName(bin.binName)
        setIsEditingName(true)
    }

    function handleCancelEditName() {
        setIsEditingName(false)
        setEditedName('')
    }

    function handleSaveName() {
        if (!editedName.trim() || editedName === bin.binName) {
            handleCancelEditName()
            return
        }
        updateName(
            { id: bin._id, name: editedName.trim() },
            { onSuccess: () => setIsEditingName(false) }
        )
    }

    function handleNameKeyDown(e) {
        if (e.key === 'Enter') {
            handleSaveName()
        } else if (e.key === 'Escape') {
            handleCancelEditName()
        }
    }

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus()
            nameInputRef.current.select()
        }
    }, [isEditingName])

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
                                    {isEditingName ? (
                                        <div className="flex items-center gap-2">
                                            <Trash2 size={20} />
                                            <input
                                                ref={nameInputRef}
                                                type="text"
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value.slice(0, 25))}
                                                onKeyDown={handleNameKeyDown}
                                                className="border rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary"
                                                maxLength={25}
                                                disabled={isUpdatingName}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4"
                                                onClick={handleSaveName}
                                                disabled={isUpdatingName}
                                            >
                                                {isUpdatingName ? <Spinner className="size-4" /> : <Check size={16} className="text-green-600" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4"
                                                onClick={handleCancelEditName}
                                                disabled={isUpdatingName}
                                            >
                                                <X size={16} className="text-red-600" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <MobileTooltip content={t('components.binCard.clickToEditName')}>
                                            <h3
                                                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                                                onClick={handleStartEditName}
                                            >
                                                <Trash2 size={20} />
                                                <span className="truncate max-w-40 md:max-w-65">{bin.binName}</span>
                                                <Pencil size={14} className="text-muted-foreground " />
                                            </h3>
                                        </MobileTooltip>
                                    )}
                                </div>
                                <div className="flex flex-row justify-center items-center gap-3">
                                    <Battery level={bin.status.battery} />
                                    <Badge variant={getVariant(bin.status.health)}>
                                        {t(`levels.${bin.status.health}`)}
                                    </Badge>
                                </div>
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
                                    <MobileTooltip content={bin.deviceKey}>
                                        <div onClick={handleCopyDeviceKey} className="flex gap-2 cursor-copy">
                                            <Copy size={18} />
                                            ************
                                        </div>
                                    </MobileTooltip>
                                </div>

                                <div className="flex flex-row justify-between">
                                    <span className="font-medium">{t('components.binCard.ownerId')}:</span>
                                    <MobileTooltip content={bin.ownerId}>
                                        <div onClick={handleCopyOwnerId} className="flex gap-2 items-center max-w-[200px] cursor-copy">
                                            <Copy size={16} className="shrink-0" />
                                            <span className="truncate">{bin.ownerId}</span>
                                        </div>
                                    </MobileTooltip>
                                </div>

                                <div className="flex flex-row justify-between">
                                    <span className="font-medium">{t('components.binCard.location')}:</span>
                                    {handleLocationClick ?
                                        <MobileTooltip content={t('components.binCard.locationTooltip')}>
                                            <div onClick={handleLocationClick} className="flex flex-row gap-2 cursor-pointer">
                                                <MapPin size={18} />
                                                <span>{bin.location.coordinates.join(", ")}</span>
                                            </div>
                                        </MobileTooltip>
                                        : <div className="flex flex-row gap-2">
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
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="">{t('components.binCard.maintenance.techNote')}:</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(bin.maintenance.lastServiceAt).toLocaleString(isRight ? 'en-US' : 'he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>
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
                                {!isUser && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="cursor-pointer flex-1 py-6" size="sm">
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
