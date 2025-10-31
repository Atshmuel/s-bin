import InputLabel from "@/components/InputLabel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { CircleCheck, Eye, EyeOff, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

function AddBin() {
    const user = { id: "12421cs-d2d2-23f2-3r2t23f", role: "admin" }; //dummy user, replace with actual user from context/auth
    const [api, setApi] = useState(null);

    const [checking, setChecking] = useState(false);
    const [deviceConnected, setDeviceConnected] = useState(false);

    //wifi states
    const [ssid, setSsid] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);



    useEffect(() => {
        if (!api) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch("http://192.168.4.1/status", { method: "GET" });
                if (res.ok) {
                    toast.success("Connected to bin Wi-Fi. Proceeding to next step.");
                    setDeviceConnected(true);
                    api.scrollNext();
                    clearInterval(interval);
                }
            } catch (e) { }
        }, 2000);
        return () => clearInterval(interval);
    }, [api]);

    const handleSubmitWifi = async () => {
        setChecking(true);
        try {

            const res = await fetch("http://192.168.4.1/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wifi_ssid: ssid, wifi_password: password, ownerId: user.id }),
            });
            // Bin data being sent to the server after connecting to its Wi-Fi
            // {
            //   "macAddress": "EC:FA:11:9F:42",
            //   "userId": "64b2a8d4e1c9f...",
            //   "location": [40.7128, -74.0060]
            // }

            if (res.ok) {
                toast.success("Wi-Fi details sent successfully!");
                api.scrollNext()
            } else {
                toast.error("Failed to send Wi-Fi details. Try again.");
            }
        } catch (e) {
            toast.error("Device not reachable. Make sure you are connected to its Wi-Fi.");
        } finally {
            setChecking(false);
        }
    };



    return (
        <div className="flex justify-center items-center">
            <Carousel allowDrag={false} setApi={setApi}>
                <CarouselContent className="max-w-[370px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[700px] p-1">
                    {/* Step 1: Info */}
                    <CarouselItem key={1}>
                        <Card >
                            <CardHeader>
                                <CardTitle>Step 1: Power On & Connect to Bin Wi-Fi</CardTitle>
                                <CardDescription>
                                    Make sure your new bin is powered on. The LED should be blinking slowly.
                                    Connect your phone/computer to the network: <strong>Bin-Setup-XXXX</strong>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert variant="destructive">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="underline text-sm">Attention</AlertTitle>
                                    <AlertDescription>
                                        Keep the bin near your device for setup. <br />
                                        Once connected, the setup process will automatically continue.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button disabled={true} onClick={() => api.scrollNext()}> <Spinner /> Waiting for connection</Button>
                            </CardFooter>
                        </Card>
                    </CarouselItem>


                    {/* Step 2: Enter Wi-Fi */}
                    <CarouselItem key={2}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Step 2: Home Wi-Fi</CardTitle>
                                <CardDescription>Enter your home Wi-Fi credentials:</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <input
                                    className="w-full border rounded p-2"
                                    placeholder="WIFI SSID (name)"
                                    value={ssid}
                                    disabled={!deviceConnected || checking}
                                    onChange={(e) => setSsid(e.target.value)}
                                />
                                <div className="relative">
                                    <InputLabel value={password}
                                        disabled={!deviceConnected || checking}

                                        onChange={(e) => setPassword(e.target.value)} placeholder=" " type={showPassword && deviceConnected ? "text" : "password"} >WIFI Password</InputLabel>
                                    {showPassword && deviceConnected ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeOff onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-end justify-end">
                                <Button onClick={handleSubmitWifi} disabled={checking || !ssid || !password || !deviceConnected}>
                                    {checking ? <Spinner /> : "Connect Bin"}
                                </Button>
                                {!deviceConnected &&
                                    <span className="text-xs sm:text-sm text-destructive font-bold w-full">
                                        Device not connecting. <br />
                                        Please go back to step 2 and ensure you're connected to the bin's Wi-Fi.
                                    </span>}
                            </CardFooter>
                        </Card>
                    </CarouselItem>

                    {/* Step 3: Done */}
                    <CarouselItem key={3}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Step 3: Done</CardTitle>
                                <CardDescription>
                                    Your bin is now connected and registered!
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-row items-center text-primary font-semibold justify-center gap-2">
                                <CircleCheck className="m-0" />
                                <p className="">
                                    You can now see your bin in the dashboard with live updates.
                                </p>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div>
    )
}

export default AddBin
