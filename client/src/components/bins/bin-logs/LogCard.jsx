import HealthBadge from "@/components/bins/HealthBadge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card"
import { Activity, CalendarClock, GaugeCircle, InfoIcon, Trash2 } from "lucide-react"
import EmptyCard from "@/components/EmptyCard"
import { Spinner } from "@/components/ui/spinner"
import { useTranslation } from "react-i18next"
import { useAppSide } from "@/contexts/AppSideProvider"
import { formatSleepDuration, formatDate } from "@/utils/helpers"
import { isGateway } from "@/utils/binHelpers"

function LogCard({ log, isLoading = true, ...props }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const isInfo = log?.severity === "info"
    const gateway = isGateway(log?.bin)
    const iconColor = isInfo ? 'oklch(0.723 0.219 149.579)' : 'oklch(0.577 0.245 27.325)'

    return (
        <Card {...props}>
            {isLoading ?
                <div className="flex h-full justify-center items-center">
                    <Spinner className={"size-24"} />
                </div>
                : log ?
                    <>

                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{t("components.logCard.log")} #{log._id} {t("components.logCard.details")}</span>
                                <InfoIcon color={iconColor} size={20} />
                            </CardTitle>
                            <CardDescription>
                                {t('types.' + log.type)} – {formatDate(log.createdAt, isRight)}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="font-medium flex items-center gap-2">
                                    <Trash2 size={16} /> {t("components.logCard.binId")}:
                                </span>
                                <span>{log.bin._id}</span>
                            </div>

                            {!gateway && <>
                                <div className="flex justify-between">
                                    <span className="font-medium flex items-center gap-2">
                                        <GaugeCircle size={16} /> {t("fillLevel")}:
                                    </span>
                                    <span>
                                        {log.oldLevel}% → <b>{log.newLevel == null ? t("sensorUnavailable") : `${log.newLevel}%`}</b>
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="font-medium flex items-center gap-2">
                                        <Activity size={16} /> {t("components.logCard.weight")}:
                                    </span>
                                    <span>
                                        {typeof log.weight === 'number' ? `${log.weight.toFixed(1)} ${t("units.kg")}` : '-'}
                                    </span>
                                </div>
                            </>}

                            <div className="flex justify-between">
                                <span className="font-medium flex items-center gap-2">
                                    <Activity size={16} /> {t("healthStatus")}:
                                </span>
                                <HealthBadge health={log.health} message={log.message} />
                            </div>

                            <div className="flex justify-between">
                                <span className="font-medium flex items-center gap-2">
                                    <CalendarClock size={16} /> {t("components.logCard.timestamp")}:
                                </span>
                                <span>
                                    {formatDate(log.createdAt, isRight, { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>

                            {log.lastAwakeSeconds != null && (
                                <div className="flex justify-between">
                                    <span className="font-medium">{t("lastAwakeTime")}:</span>
                                    <span>{formatSleepDuration(log.lastAwakeSeconds, t)}</span>
                                </div>
                            )}

                            {log.message &&
                                <div className="space-y-1">
                                    <span className="font-medium">{t("components.logCard.message")}:</span>
                                    <p>{log.message}</p>
                                </div>
                            }

                            <div className="flex justify-between">
                                <span className="font-medium">{t("components.logCard.logSource")}:</span>
                                <span className="capitalize">{t("sources." + log.source)}</span>
                            </div>
                        </CardContent>
                    </> :
                    <EmptyCard title={t("components.logCard.errorCard")} description={t("components.logCard.errorDescription")} />
            }
        </Card>
    )
}

export default LogCard
