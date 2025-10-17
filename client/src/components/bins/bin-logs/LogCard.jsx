import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card"
import { CalendarClock, GaugeCircle, InfoIcon, Trash2 } from "lucide-react"

function LogCard({ log, ...props }) {
    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Log {log.id} Details</span>
                    <InfoIcon color={`${log.case === 'info' ? 'oklch(0.723 0.219 149.579)' : 'oklch(0.577 0.245 27.325)'}`} size={20} />
                </CardTitle>
                <CardDescription>
                    {log.type} – {new Date(log.timestamp).toLocaleString()}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-2">
                        <Trash2 size={16} /> Bin Code:
                    </span>
                    <span>{log.binCode}</span>
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
                        <CalendarClock size={16} /> Time:
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div>
                    <span className="font-medium">Message:</span>
                    <p className="text-muted-foreground mt-1">{log.message}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default LogCard
