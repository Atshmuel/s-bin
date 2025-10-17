import { getVariant } from "@/utils/binHelpers"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Trash2 } from "lucide-react"
import { Badge } from "../ui/badge"

function BinCard({ bin, actions = true, ...props }) {
    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <h3 className="flex items-center gap-2"><Trash2 size={20} /> <span>{bin.binCode}</span></h3>
                    <Badge variant={getVariant(bin.status.health)}>
                        {bin.status.health.toUpperCase()}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Last updated: {new Date(bin.status.updatedAt).toLocaleString()}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="font-medium">Fill Level:</span>
                    <span>{bin.status.level}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{bin.location.coordinates.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium">Owner ID:</span>
                    <span className="truncate max-w-[220px]">{bin.ownerId}</span>
                </div>
                <div>
                    <span className="font-medium">Recent Level Logs:</span>
                    <ul className="mt-1 list-disc list-inside text-muted-foreground">
                        {bin.levelLogs.map((log, idx) => (
                            <li key={idx}>
                                {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {log.level}%
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
            {actions ? <CardFooter className='flex justify-center gap-4'>
                <Button className='flex-1' variant={'destructive'}>
                    Delete
                </Button>
                <Button className='flex-1'>
                    Edit
                </Button>
            </CardFooter> : null}
        </Card>
    )
}

export default BinCard
