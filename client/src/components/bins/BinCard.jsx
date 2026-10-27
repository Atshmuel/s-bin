import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "../ui/card"
import { Trash2, Wrench } from "lucide-react"
import HealthBadge from "./HealthBadge"
import { Separator } from "../ui/separator"
import Battery from "./Battary"
import { Spinner } from "../ui/spinner"
import EmptyCard from "../EmptyCard"
import { useTranslation } from "react-i18next"
import { useAppSide } from "@/hooks/useAppSide"
import { useMe } from "@/hooks/users/auth/useMe";
import { isGateway } from "@/utils/binHelpers";
import BinNameEditor from "./BinNameEditor"
import BinDeviceDetails from "./BinDeviceDetails"
import BinMaintenanceDetails from "./BinMaintenanceDetails"
import ConnectedLeaves from "./ConnectedLeaves"
import CreateNoteDialog from "./CreateNoteDialog"
import DeleteBinDialog from "./DeleteBinDialog"
import DeviceRoleBadge from "./DeviceRoleBadge"
import { formatDate } from "@/utils/helpers"

function BinCard({ bin, actions = true, handleLocationClick, isLoading = true, ...props }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()

    const { me, isAdmin } = useMe();
    const isUser = me?.role === 'user'

    const gateway = isGateway(bin)

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
                                    <BinNameEditor bin={bin} />
                                </div>
                                <div className="flex flex-row justify-center items-center gap-3">
                                    <Battery level={bin.status.battery} ownerId={bin.ownerId} />
                                    <HealthBadge health={bin.status.health} message={bin.status.healthMessage} />
                                </div>
                            </CardTitle>
                            <CardDescription>
                                {t('lastUpdated')}: {formatDate(bin.status.updatedAt, isRight)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 text-sm">
                            <div className="space-y-3">

                                <div className="flex flex-row justify-between">
                                    <span className="font-medium">{t('components.binCard.deviceType')}:</span>
                                    <DeviceRoleBadge bin={bin} />
                                </div>
                                {!gateway &&
                                    <div className="flex flex-row justify-between">
                                        <span className="font-medium">{t('fillLevel')}:</span>
                                        <span>{bin.status.levelValid === false ? t('sensorUnavailable') : `${bin.status.level}%`}</span>
                                    </div>}

                                <BinDeviceDetails bin={bin} handleLocationClick={handleLocationClick} />
                            </div>

                            {/* A bin relaying for leaves lists them too; a gateway always shows the section. */}
                            {bin.connectedLeaves && (gateway || bin.connectedLeaves.length > 0) && (
                                <>
                                    <Separator />
                                    <div className="space-y-2.5">
                                        <p className="text-sm md:text-base font-medium flex gap-2">
                                            <Trash2 size={18} /> <span>{t('components.binCard.connectedLeaves')}:</span>
                                        </p>
                                        <ConnectedLeaves leaves={bin.connectedLeaves} />
                                    </div>
                                </>
                            )}

                            <Separator />

                            {bin.maintenance && (
                                <div className="space-y-2.5">
                                    <p className="text-sm md:text-base font-medium flex gap-2">
                                        <Wrench size={18} /> <span>{t('components.binCard.maintenance.title')}:</span>
                                    </p>
                                    <BinMaintenanceDetails maintenance={bin.maintenance} />
                                </div>
                            )}
                        </CardContent>
                        {actions && (
                            <CardFooter className={`flex justify-center ${isRight ? "" : "flex-row-reverse"} gap-2`}>
                                {isAdmin && <DeleteBinDialog bin={bin} />}
                                {!isUser && <CreateNoteDialog bin={bin} />}
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
