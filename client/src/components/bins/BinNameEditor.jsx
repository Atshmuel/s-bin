import { Check, Pencil, RadioTower, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import { MobileTooltip } from "../ui/mobile-tooltip"
import { Spinner } from "../ui/spinner"
import { useUpdateBinName } from "@/hooks/bins/useUpdateBin"
import { useMe } from "@/hooks/users/auth/useMe"
import { isGateway } from "@/utils/binHelpers"

// The device's name with its type's icon; admins rename it inline.
function BinNameEditor({ bin }) {
    const { t } = useTranslation()
    const { isAdmin } = useMe()
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')
    const { updateName, isUpdating: isUpdatingName } = useUpdateBinName()
    const nameInputRef = useRef(null)
    const NameIcon = isGateway(bin) ? RadioTower : Trash2

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

    if (!isAdmin) {
        return (
            <h3 className="flex items-center gap-2">
                <NameIcon size={20} />
                <span className="truncate max-w-40 md:max-w-65">{bin.binName}</span>
            </h3>
        )
    }

    if (isEditingName) {
        return (
            <div className="flex items-center gap-2">
                <NameIcon size={20} />
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
        )
    }

    return (
        <MobileTooltip content={t('components.binCard.clickToEditName')}>
            <h3
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                onClick={handleStartEditName}
            >
                <NameIcon size={20} />
                <span className="truncate max-w-40 md:max-w-65">{bin.binName}</span>
                <Pencil size={14} className="text-muted-foreground " />
            </h3>
        </MobileTooltip>
    )
}

export default BinNameEditor
