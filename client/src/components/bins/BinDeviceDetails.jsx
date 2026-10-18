import { Copy, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { MobileTooltip } from "../ui/mobile-tooltip"
import { formatSleepDuration } from "@/utils/helpers"

// The device's sleep figures, keys and location, one row each.
function BinDeviceDetails({ bin, handleLocationClick }) {
    const { t } = useTranslation()

    function handleCopyDeviceKey() {
        navigator.clipboard.writeText(bin?.deviceKey)
        toast.success('Copied device key to your clipboard!')
    }

    function handleCopyOwnerId() {
        navigator.clipboard.writeText(bin?.ownerId)
        toast.success('Copied owner ID to your clipboard!')
    }

    return (
        <>
            {/* Only a device with a scale reports its state; a leaf has none. */}
            {bin.status.scale && (
                <div className="flex flex-row justify-between">
                    <span className="font-medium">{t('components.logCard.weight')}:</span>
                    <span>
                        {bin.status.scale === "ok" && typeof bin.status.weight === 'number'
                            ? `${bin.status.weight.toFixed(1)} ${t('units.kg')}`
                            : t(bin.status.scale === "failed" ? 'components.binCard.scaleFailed' : 'components.binCard.scaleUncalibrated')}
                    </span>
                </div>
            )}

            <div className="flex flex-row justify-between">
                <span className="font-medium">{t('lastAwakeTime')}:</span>
                <span>{bin.status.lastAwakeSeconds
                    ? formatSleepDuration(bin.status.lastAwakeSeconds, t)
                    : '-'}</span>
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
        </>
    )
}

export default BinDeviceDetails
