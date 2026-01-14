import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useMe } from "@/hooks/users/auth/useMe"
import { ArrowLeft, ArrowRight, Check, CircleCheck, Copy, Info, Wifi } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

function AddBin() {
    const { me } = useMe()
    const { isRight } = useAppSide();
    const { t } = useTranslation();

    const [api, setApi] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [copiedOwnerId, setCopiedOwnerId] = useState(false);

    const ownerId = me?.org ?? me?.id;

    const handleCopyOwnerId = async () => {
        try {
            await navigator.clipboard.writeText(ownerId);
            setCopiedOwnerId(true);
            toast.success(t("pages.addBin.toasts.ownerIdCopied"));
            setTimeout(() => setCopiedOwnerId(false), 2000);
        } catch (e) {
            toast.error(t("pages.addBin.toasts.copyFailed"));
        }
    };

    const handleNext = () => {
        if (api) {
            api.scrollNext();
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (api) {
            api.scrollPrev();
            setCurrentStep(prev => prev - 1);
        }
    };

    const NextIcon = isRight ? ArrowRight : ArrowLeft;
    const PrevIcon = isRight ? ArrowLeft : ArrowRight;

    return (
        <div className="flex justify-center items-center">
            <Carousel allowDrag={false} setApi={setApi}>
                <CarouselContent isRight={isRight} className="max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[700px] p-1">
                    {/* Step 1: Power on and connect to bin WiFi */}
                    <CarouselItem key={1}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wifi className="h-5 w-5" />
                                    {t("pages.addBin.stepOne.title")}
                                </CardTitle>
                                <CardDescription>
                                    {t("pages.addBin.stepOne.description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                    <p className="font-medium">{t("pages.addBin.stepOne.instructions")}:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                        <li>{t("pages.addBin.stepOne.step1")}</li>
                                        <li>{t("pages.addBin.stepOne.step2")}</li>
                                        <li>{t("pages.addBin.stepOne.step3")}</li>
                                    </ol>
                                </div>
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepOne.attention")}</AlertTitle>
                                    <AlertDescription className="text-sm">
                                        {t("pages.addBin.stepOne.captivePortalNote")}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleNext}>
                                    {t("pages.addBin.navigation.next")}
                                    <NextIcon className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </CarouselItem>

                    {/* Step 2: Copy Owner ID */}
                    <CarouselItem key={2}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("pages.addBin.stepTwo.title")}</CardTitle>
                                <CardDescription>{t("pages.addBin.stepTwo.description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg space-y-3">
                                    <p className="font-medium text-sm">{t("pages.addBin.stepTwo.ownerIdLabel")}:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-background p-3 rounded border text-sm font-mono break-all">
                                            {ownerId}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopyOwnerId}
                                            className="shrink-0"
                                        >
                                            {copiedOwnerId ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <Alert variant="destructive">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepTwo.important")}</AlertTitle>
                                    <AlertDescription className="text-sm">
                                        {t("pages.addBin.stepTwo.pasteNote")}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={handlePrev}>
                                    <PrevIcon className="h-4 w-4" />
                                    {t("pages.addBin.navigation.back")}
                                </Button>
                                <Button onClick={handleNext}>
                                    {t("pages.addBin.navigation.next")}
                                    <NextIcon className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </CarouselItem>

                    {/* Step 3: Fill in the form on the bin */}
                    <CarouselItem key={3}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("pages.addBin.stepThree.title")}</CardTitle>
                                <CardDescription>{t("pages.addBin.stepThree.description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                    <p className="font-medium">{t("pages.addBin.stepThree.formFields")}:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        <li>{t("pages.addBin.stepThree.field1")}</li>
                                        <li>{t("pages.addBin.stepThree.field2")}</li>
                                        <li>{t("pages.addBin.stepThree.field3")}</li>
                                    </ul>
                                </div>
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepThree.afterSubmit")}</AlertTitle>
                                    <AlertDescription className="text-sm">
                                        {t("pages.addBin.stepThree.afterSubmitNote")}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={handlePrev}>
                                    <PrevIcon className="h-4 w-4" />
                                    {t("pages.addBin.navigation.back")}
                                </Button>
                                <Button onClick={handleNext}>
                                    {t("pages.addBin.navigation.next")}
                                    <NextIcon className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </CarouselItem>

                    {/* Step 4: Done */}
                    <CarouselItem key={4}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CircleCheck className="h-5 w-5 text-primary" />
                                    {t("pages.addBin.stepFour.title")}
                                </CardTitle>
                                <CardDescription>
                                    {t("pages.addBin.stepFour.description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                                    <p className="font-medium text-primary">{t("pages.addBin.stepFour.whatHappensNow")}:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        <li>{t("pages.addBin.stepFour.process1")}</li>
                                        <li>{t("pages.addBin.stepFour.process2")}</li>
                                        <li>{t("pages.addBin.stepFour.process3")}</li>
                                    </ul>
                                </div>
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepFour.timeoutNote")}</AlertTitle>
                                    <AlertDescription className="text-sm">
                                        {t("pages.addBin.stepFour.timeoutDescription")}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                            <CardFooter className="flex justify-start">
                                <Button variant="outline" onClick={handlePrev}>
                                    <PrevIcon className="h-4 w-4" />
                                    {t("pages.addBin.navigation.back")}
                                </Button>
                            </CardFooter>
                        </Card>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div>
    )
}

export default AddBin
