import InputLabel from "@/components/InputLabel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Spinner } from "@/components/ui/spinner"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useMe } from "@/hooks/users/auth/useMe"
import { CircleCheck, Eye, EyeOff, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

function AddBin() {
    const { me } = useMe()
    const { isRight } = useAppSide();
    const { t } = useTranslation();

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
                    toast.success(t("pages.addBin.toasts.connected"));
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
                body: JSON.stringify({ wifi_ssid: ssid, wifi_password: password, ownerId: me?.org ?? me?.id }),
            });
            // Bin data being sent to the server after connecting to its Wi-Fi
            // {
            //   "macAddress": "EC:FA:11:9F:42",
            //   "ownerId": "64b2a8d4e1c9f...",
            //   "location": [40.7128, -74.0060]
            // }

            if (res.ok) {
                toast.success(t("pages.addBin.toasts.wifiDataSent"));
                api.scrollNext();
            } else {
                toast.error(t("pages.addBin.toasts.wifiDataFailed"));
            }
        } catch (e) {
            toast.error(t("pages.addBin.toasts.cannotReachBin"));
        } finally {
            setChecking(false);
        }
    };



    return (
        <div className="flex justify-center items-center">
            <Carousel allowDrag={false} setApi={setApi}>
                <CarouselContent isRight={isRight} className="max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[700px] p-1">
                    {/* Step 1: Info */}
                    <CarouselItem key={1}>
                        <Card >
                            <CardHeader>
                                <CardTitle>{t("pages.addBin.stepOne.title")}</CardTitle>
                                <CardDescription>
                                    {t("pages.addBin.stepOne.description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Alert variant="destructive">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="underline text-sm">{t("pages.addBin.stepOne.attention")}</AlertTitle>
                                    <AlertDescription>
                                        {t("pages.addBin.stepOne.keepNear")}
                                        <br />
                                        {t("pages.addBin.stepOne.autoContinue")}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button disabled={true} onClick={() => api.scrollNext()}> <Spinner /> {t("pages.addBin.stepOne.button")}</Button>
                            </CardFooter>
                        </Card>
                    </CarouselItem>


                    {/* Step 2: Enter Wi-Fi */}
                    <CarouselItem key={2}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("pages.addBin.stepTwo.title")}</CardTitle>
                                <CardDescription>{t("pages.addBin.stepTwo.description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <input
                                    className="w-full border rounded p-2"
                                    placeholder={t("pages.addBin.stepTwo.wifiNetwork")}
                                    value={ssid}
                                    disabled={!deviceConnected || checking}
                                    onChange={(e) => setSsid(e.target.value)}
                                />
                                <div className="relative">
                                    <InputLabel value={password}
                                        disabled={!deviceConnected || checking}

                                        onChange={(e) => setPassword(e.target.value)} placeholder=" " type={showPassword && deviceConnected ? "text" : "password"} >{t("pages.addBin.stepTwo.wifiPassword")}</InputLabel>
                                    {showPassword ? <Eye onClick={() => setShowPassword(show => !show)}
                                        className={`absolute top-3${isRight ? 'right-3' : "left-3"}`} /> :
                                        <EyeOff onClick={() => setShowPassword(show => !show)} className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} />}
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-end justify-end">
                                <Button onClick={handleSubmitWifi} disabled={checking || !ssid || !password || !deviceConnected}>
                                    {checking ? <Spinner /> : t("pages.addBin.stepTwo.button")}
                                </Button>
                                {!deviceConnected &&
                                    <span className="text-xs sm:text-sm text-destructive font-bold w-full mt-4">
                                        {t("pages.addBin.stepTwo.notConnected")}
                                    </span>}
                            </CardFooter>
                        </Card>
                    </CarouselItem>

                    {/* Step 3: Done */}
                    <CarouselItem key={3}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("pages.addBin.stepThree.title")}</CardTitle>
                                <CardDescription>
                                    {t("pages.addBin.stepThree.description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-row items-center text-primary font-semibold justify-center gap-2">
                                <CircleCheck className="m-0" />
                                <p className="">
                                    {t("pages.addBin.stepThree.descriptionTwo")}
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
