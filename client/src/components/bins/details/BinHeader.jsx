import { useTranslation } from "react-i18next"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DeviceRoleBadge from "@/components/bins/DeviceRoleBadge"
import HealthBadge from "@/components/bins/HealthBadge"
import { formatReportSchedule } from "@/utils/orgSettings"

// The first tile on the bin page: what the device is, its health and when it
// reports. Renaming and the other actions live in the Actions tab.
function BinHeader({ bin, className }) {
    const { t, i18n } = useTranslation()

    return (
        <Card className={className}>
            <CardHeader className="flex flex-col gap-3">
                <CardTitle className="truncate text-xl">{bin.binName}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                    <DeviceRoleBadge bin={bin} />
                    <HealthBadge health={bin.status.health} faults={bin.status.faults} message={bin.status.healthMessage} />
                </div>
                {bin.reportSchedule && (
                    <CardDescription>
                        {t('components.orgSettings.reportsAt', {
                            schedule: formatReportSchedule(
                                bin.reportSchedule.reportIntervalMinutes,
                                bin.reportSchedule.reportStartHour,
                                t,
                                i18n.language,
                            ),
                        })}
                    </CardDescription>
                )}
            </CardHeader>
        </Card>
    )
}

export default BinHeader
