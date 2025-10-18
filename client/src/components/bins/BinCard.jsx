import { getVariant } from "@/utils/binHelpers"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Copy, MapPin, Trash2, Wrench } from "lucide-react"
import { Badge } from "../ui/badge"
import { Link } from "react-router-dom"
import { Separator } from "../ui/separator"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

function BinCard({ bin, actions = true, handleLocationClick, ...props }) {

    function handleCopyDeviceKey() {
        navigator.clipboard.writeText(bin.deviceKey)
        toast.success('Copied device key to your clipboard!')
    }

    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <h3 className="flex items-center gap-2">
                        <Trash2 size={20} />
                        <span>{bin.binName}</span>
                    </h3>
                    <Badge variant={getVariant(bin.status.health)}>
                        {bin.status.health.toUpperCase()}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Last updated: {new Date(bin.status.updatedAt).toLocaleString()}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 text-sm">
                <div className="space-y-3">

                    <div className="flex flex-row justify-between">
                        <span className="font-medium">Fill Level:</span>
                        <span>{bin.status.level}%</span>
                    </div>

                    <div className="flex flex-row justify-between">
                        <span className="font-medium">Device Key:</span>
                        <Tooltip >
                            <TooltipTrigger className="cursor-copy" asChild>
                                <div onClick={handleCopyDeviceKey} className="flex gap-2">
                                    <Copy size={18} />
                                    ************
                                </div></TooltipTrigger>
                            <TooltipContent>{bin.deviceKey}</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="flex flex-row justify-between">
                        <span className="font-medium">Owner ID:</span>
                        <span className="truncate max-w-[200px]">{bin.ownerId}</span>
                    </div>

                    <div className="flex flex-row justify-between">
                        <span className="font-medium">Location:</span>
                        {handleLocationClick ? <Tooltip>
                            <TooltipTrigger asChild>
                                <div onClick={handleLocationClick} className="flex flex-row gap-2 cursor-pointer">
                                    <MapPin size={18} />
                                    <span>{bin.location.coordinates.join(", ")}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                Locate the bin on the map
                            </TooltipContent>
                        </Tooltip> : <div className="flex flex-row gap-2">
                            <span>{bin.location.coordinates.join(", ")}</span>
                        </div>}
                    </div>
                </div>

                <Separator />

                {bin.maintenance && (
                    <div className="space-y-2.5">
                        <p className="text-sm md:text-base font-medium flex gap-2">
                            <Wrench size={18} /> <span>Maintenance:</span>
                        </p>
                        <div className="flex justify-between">
                            <span>Last Service:</span>
                            <span>{new Date(bin.maintenance.lastServiceAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Next Service:</span>
                            <span>{new Date(bin.maintenance.nextServiceAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Technician:</span>
                            <Link to={`/user/${bin.maintenance.technicianId}`}><Button className={"p-0 m-0 h-fit"} variant={'link'}>See profile</Button></Link>
                        </div>
                        {(bin.maintenance.notes && <div>
                            <span className="">Technician note:</span>
                            <p className="mt-2 text-sm italic text-muted-foreground">
                                “{bin.maintenance.notes}”
                            </p>
                        </div>
                        )}
                    </div>
                )}
            </CardContent>

            {actions && (
                <CardFooter className="flex justify-center gap-4">
                    <Button className="flex-1" variant="destructive">
                        Delete
                    </Button>
                    <Button className="flex-1">Edit</Button>
                </CardFooter>
            )}
        </Card>
    )
}

export default BinCard
