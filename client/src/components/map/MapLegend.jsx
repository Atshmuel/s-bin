import { FormProvider, useForm } from "react-hook-form"
import { FormControl, FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import { MapPin, MenuSquare, Search, X } from "lucide-react"
import { useState } from "react"
import { Marker, Popup, useMapEvent } from "react-leaflet"
import { Switch } from "../ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMapSettings } from "@/contexts/mapContext"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { toast } from "sonner"

function MapLegend({ legendForm = false }) {
    const { flyEnabled, setFlyEnabled, tile, setTile, isOpen, setIsOpen } = useMapSettings()
    const mapp = useMapEvent({
        move: () => { setLocation(mapp.getCenter().lat.toFixed(3) + ", " + mapp.getCenter().lng.toFixed(3)) },
        zoom: () => setZoom(mapp.getZoom())
    })

    const [zoom, setZoom] = useState(mapp.getZoom());
    const [location, setLocation] = useState(mapp.getCenter().lat.toFixed(3) + ", " + mapp.getCenter().lng.toFixed(3));

    const isMobile = useIsMobile();

    const mapConfig = useForm({
        defaultValues: {
            radius: [50],
            level: [0, 100],
            health: 'all'
        }
    })
    //once again note that the radius an array on submittion because slider returns an array and the server expects a number, also note that the server expects a center point which we are not sending now
    const [userMarker, setUserMarker] = useState(null);

    function locateMe() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition((pos) => {
            const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            mapp.flyTo(latlng, 17);
            setUserMarker(latlng);
            setTimeout(() => { setUserMarker(null) }, 10000)

        }, (err) => {
            // Handle permission denied or other errors
            if (err.code === err.PERMISSION_DENIED) {
                toast.error("Location access is denied. Please enable it in your browser settings.")
            } else if (err.code === err.POSITION_UNAVAILABLE) {
                toast.error("Location information is unavailable.")
            } else if (err.code === err.TIMEOUT) {
                toast.error("Location request timed out. Try again.")
            } else {
                toast.error("An unknown error occurred while retrieving location.")
            }
        }
        )
    }

    function toggleTile() {
        if (tile === "default") {
            setTile("satellite");
        } else {
            setTile("default");
        }
    }


    return (

        <div className={`absolute flex flex-col justify-center items-center bottom-1.5 right-1.5 z-400 h-10 w-10 bg-accent rounded-md px-2 py-2 transition-all duration-500 ease-in-out  ${isOpen ? 'w-fit h-fit space-y-2' : ''}`}>
            <div className="self-end" onClick={() => setIsOpen(open => !open)}>{isOpen ? <X /> : <MenuSquare />}</div>
            <div className={`flex flex-col space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'opacity-0 max-h-0'}`}>
                {legendForm ? <FormProvider {...mapConfig}>
                    <form className="flex flex-col space-y-4 mb-4 justify-between items-center" onSubmit={mapConfig.handleSubmit(data => console.log(data))}>
                        <div className="flex flex-col gap-4">
                            <FormField
                                name="radius"
                                control={mapConfig.control}
                                render={({ field }) => (
                                    <FormItem >
                                        <div>
                                            <Label>Bins search range: <span>{field.value}</span></Label>
                                            <FormControl>
                                                <Slider className='w-full mt-4' min={1} max={1000} step={5} value={[field.value]} onValueChange={(value) => field.onChange(value)} onPointerDown={() => mapp.dragging.disable()}
                                                    onPointerUp={() => mapp.dragging.enable()} />
                                            </FormControl>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="level"
                                control={mapConfig.control}
                                render={({ field }) => (
                                    <FormItem >
                                        <div className="">
                                            <Label>Level between: <span>{field.value[0]} - {field.value[1]}</span></Label>
                                            <FormControl>
                                                <Slider
                                                    className="w-full mt-4"
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    value={field.value}
                                                    onValueChange={(value) => field.onChange(value)}
                                                    onPointerDown={() => mapp.dragging.disable()}
                                                    onPointerUp={() => mapp.dragging.enable()}
                                                />
                                            </FormControl>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="health"
                                control={mapConfig.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Bin Health Alert</Label>
                                        <FormControl>
                                            <ToggleGroup className="mt-3 border-[0.2px] border-primary rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => {
                                                if (value) {
                                                    field.onChange(value)
                                                }
                                            }}>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent rounded-br-none rounded-tr-none' value="good">Good</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent rounded-none' value="warning">Warning</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent rounded-none' value="critical">Critical</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent rounded-bl-none rounded-tl-none' value="all">All</ToggleGroupItem>
                                            </ToggleGroup>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button className='cursor-pointer w-full' type="submit"><Search /> Search</Button>

                    </form>
                </FormProvider> : null}
                <div className="flex flex-row items-center justify-between gap-3">
                    <div className="space-y-2">
                        <div className="flex items-center justify-start space-x-1.5">
                            <Switch checked={tile === 'satellite'}
                                onCheckedChange={toggleTile} id='tile' />
                            <Label className={'text-xs md:text-sm'} htmlFor="tile">Toggle Map Tile</Label>
                        </div>
                        <div className="flex items-center justify-start space-x-1.5">
                            <Switch checked={flyEnabled}
                                onCheckedChange={() => setFlyEnabled(f => !f)} id='fly-to' />
                            <Label className={'text-xs md:text-sm'} htmlFor="fly-to">Fly to marker</Label>
                        </div>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size='icon' className="rounded-full size-5 sm:size-7 cursor-pointer" onClick={locateMe}><MapPin /></Button>
                        </TooltipTrigger>
                        <TooltipContent side={isMobile ? "top" : "bottom"} className='z-400'>
                            <p>Locate Me</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div>
                    <div className="flex flex-row gap-1 text-xs sm:text-sm">Location:
                        <span>{location}</span>
                    </div>
                    <div className="flex flex-row gap-1 text-xs sm:text-sm">Zoom:
                        <span>{zoom.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {userMarker && (
                <Marker position={userMarker}>
                    <Popup>You are here!</Popup>
                </Marker>
            )}
        </div>
    )
}

export default MapLegend
