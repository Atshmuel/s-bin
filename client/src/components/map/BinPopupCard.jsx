import { format, formatDistanceToNow } from "date-fns"
import { he } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useAppSide } from "@/contexts/AppSideProvider"
import Battery from "@/components/bins/Battary"
import DeviceRoleBadge from "@/components/bins/DeviceRoleBadge"
import HealthBadge from "@/components/bins/HealthBadge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getColor } from "@/utils/binHelpers"
import { getDeviceRole } from "@/utils/deviceRoles"

// A device's popup on the map: what it is, its state and how it reaches the
// server. gatewayName and relayCount come from the other devices on the map.
function BinPopupCard({ bin, gatewayName, relayCount = 0 }) {
    const { t, i18n } = useTranslation()
    const { isRight } = useAppSide()
    const role = getDeviceRole(bin)
    const { level, levelValid, battery, updatedAt, connection } = bin.status
    const viaMesh = connection?.via === "mesh"

    return (
        // text-start: Leaflet aligns popup text to the left; follow the language instead.
        <div dir={isRight ? "ltr" : "rtl"} className="flex w-64 flex-col gap-3 text-sm text-start">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-2">
                    <span className="truncate text-base font-semibold">{bin.binName}</span>
                    <div className="w-fit"><DeviceRoleBadge bin={bin} /></div>
                </div>
                <HealthBadge health={bin.status.health} message={bin.status.healthMessage} />
            </div>

            <Separator />

            <dl className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2.5">
                {role !== "gateway" && (
                    <>
                        <dt className="text-muted-foreground">{t("fillLevel")}</dt>
                        <dd className="flex flex-col gap-1">
                            <span className="font-semibold">{levelValid === false ? t("sensorUnavailable") : `${level}%`}</span>
                            {levelValid !== false && (
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${Math.min(100, Math.max(0, level))}%`, backgroundColor: getColor(level, 'fill') }}
                                    />
                                </div>
                            )}
                        </dd>
                    </>
                )}

                <dt className="text-muted-foreground">{t("pages.binDetails.tiles.battery")}</dt>
                <dd className="flex items-center gap-1.5 font-semibold">
                    <span>{battery}%</span>
                    <Battery level={battery} />
                </dd>

                <dt className="text-muted-foreground">{t("pages.binDetails.tiles.lastReport")}</dt>
                <dd className="flex flex-col">
                    <span className="font-semibold">
                        {updatedAt
                            ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: i18n.language === 'he' ? he : undefined })
                            : t("pages.binDetails.tiles.never")}
                    </span>
                    {updatedAt && (
                        <span dir="ltr" className="self-start text-xs text-muted-foreground">
                            {format(new Date(updatedAt), 'yyyy-MM-dd HH:mm:ss')}
                        </span>
                    )}
                </dd>

                <dt className="text-muted-foreground">{t("pages.binDetails.tiles.connection")}</dt>
                <dd className="flex flex-col">
                    <span className="font-semibold">
                        {viaMesh ? t("pages.binDetails.tiles.mesh") : t("pages.binDetails.tiles.cellular")}
                    </span>
                    {viaMesh && (
                        <span className="text-xs text-muted-foreground">
                            {/* Isolated runs keep the name and signal in order inside Hebrew text. */}
                            {gatewayName && <>{t("pages.binDetails.tiles.via")} <bdi>{gatewayName}</bdi> · </>}
                            <span dir="ltr">{connection.rssi ?? '-'} dBm</span> · {t("components.binCard.hops")}: {connection.hops ?? '-'}
                        </span>
                    )}
                    {relayCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {t("pages.binDetails.tiles.relaysFor", { count: relayCount })}
                        </span>
                    )}
                </dd>
            </dl>

            {/* Leaflet colors every link in the map; the button keeps its own color. */}
            <Button asChild size="sm" className="self-end !text-primary-foreground">
                <Link to={`/bins/${bin._id}`}>{t("viewBin")}</Link>
            </Button>
        </div>
    )
}

export default BinPopupCard
