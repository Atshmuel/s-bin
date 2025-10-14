import { FormProvider, useForm } from "react-hook-form"
import { FormControl, FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"
import { Slider } from "../ui/slider"
import { Button } from "../ui/button"
import { MapPin, Search } from "lucide-react"
import { useState } from "react"
import { Marker, Popup, useMapEvent } from "react-leaflet"
import { Switch } from "../ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMapSettings } from "@/contexts/mapContext"

function MapLegend() {
    const { flyEnabled, setFlyEnabled, tile, setTile } = useMapSettings()
    const mapp = useMapEvent({
        move: () => { setLocation(mapp.getCenter().lat.toFixed(3) + ", " + mapp.getCenter().lng.toFixed(3)) },
        zoom: () => setZoom(mapp.getZoom())
    })

    const [zoom, setZoom] = useState(mapp.getZoom());
    const [location, setLocation] = useState(mapp.getCenter().lat.toFixed(3) + ", " + mapp.getCenter().lng.toFixed(3));

    const isMobile = useIsMobile();

    const mapConfig = useForm({
        defaultValues: {
            radius: 50,
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
                alert("Location access is denied. Please enable it in your browser settings.");
            } else if (err.code === err.POSITION_UNAVAILABLE) {
                alert("Location information is unavailable.");
            } else if (err.code === err.TIMEOUT) {
                alert("Location request timed out. Try again.");
            } else {
                alert("An unknown error occurred while retrieving location.");
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
        <div className={`flex flex-col space-y-4 z-400 absolute bottom-3 md:bottom-auto md:top-3 right-3 bg-accent rounded-md w-56 px-3 py-4`}>
            <FormProvider {...mapConfig}>
                <form className="flex gap-2 justify-between items-center" onSubmit={mapConfig.handleSubmit(data => console.log(data))}>
                    <FormField
                        name="radius"
                        control={mapConfig.control}
                        render={({ field }) => (
                            <FormItem >
                                <div className="flex-col w-40">
                                    <Label>Bins search range: <span>{field.value}</span></Label>
                                    <FormControl>
                                        <Slider className='w-full mt-4' min={1} max={1000} step={5} value={[field.value]} onValueChange={(value) => field.onChange(value)} onPointerDown={() => mapp.dragging.disable()}
                                            onPointerUp={() => mapp.dragging.enable()} />
                                    </FormControl>
                                </div>
                            </FormItem>
                        )}
                    />
                    <Button className='rounded-full size-7 cursor-pointer' type="submit" size='icon'><Search /></Button>

                </form>
            </FormProvider>
            <div className="flex flex-row items-center justify-between">
                <div className="space-y-2">
                    <div className="flex items-center justify-start space-x-1.5">
                        <Switch checked={tile === 'satellite'}
                            onCheckedChange={toggleTile} id='tile' />
                        <Label htmlFor="tile">Toggle Map Tile</Label>
                    </div>
                    <div className="flex items-center justify-start space-x-1.5">
                        <Switch checked={flyEnabled}
                            onCheckedChange={() => setFlyEnabled(f => !f)} id='fly-to' />
                        <Label htmlFor="fly-to">Fly to marker</Label>
                    </div>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size='icon' className="rounded-full size-7" onClick={locateMe}><MapPin /></Button>
                    </TooltipTrigger>
                    <TooltipContent side={isMobile ? "top" : "bottom"} className='z-400'>
                        <p>Locate Me</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div>
                <div className="flex flex-row gap-1 text-sm">Location:
                    <span>{location}</span>
                </div>
                <div className="flex flex-row gap-1 text-sm">Zoom:
                    <span>{zoom}</span>
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
