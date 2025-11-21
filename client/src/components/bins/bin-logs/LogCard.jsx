import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card"
import { Activity, CalendarClock, GaugeCircle, InfoIcon, Trash2 } from "lucide-react"
import { getVariant } from "@/utils/binHelpers"

function LogCard({ log, ...props }) {
    const isInfo = log.severity === "info"
    const iconColor = isInfo ? 'oklch(0.723 0.219 149.579)' : 'oklch(0.577 0.245 27.325)'


    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Log #{log._id} Details</span>
                    <InfoIcon color={iconColor} size={20} />
                </CardTitle>
                <CardDescription>
                    {log.type} – {new Date(log.createdAt).toLocaleString()}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-2">
                        <Trash2 size={16} /> Bin ID:
                    </span>
                    <span>{log.binId}</span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-2">
                        <GaugeCircle size={16} /> Fill Level:
                    </span>
                    <span>
                        {log.oldLevel}% → <b>{log.newLevel}%</b>
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-2">
                        <Activity size={16} /> Health:
                    </span>
                    <Badge variant={getVariant(log.health)}>{log.health}</Badge>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-2">
                        <CalendarClock size={16} /> Time:
                    </span>
                    <span>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium">Update Source:</span>
                    <span className="capitalize">{log.source}</span>
                </div>
            </CardContent>
        </Card>
    )
}

export default LogCard
