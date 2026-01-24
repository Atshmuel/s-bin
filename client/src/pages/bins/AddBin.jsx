import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { useAppSide } from "@/contexts/AppSideProvider"
import { useMe } from "@/hooks/users/auth/useMe"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleCheck, Copy, Info, ListChecks, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import ErrorPage from "../generals/ErrorPage"

function AddBin() {
    const { me, isOwner } = useMe()
    const { isRight } = useAppSide();
    const { t } = useTranslation();

    const [api, setApi] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [copiedOwnerId, setCopiedOwnerId] = useState(false);

    const totalSteps = 4;
    const ownerId = me?.org ?? null



    const handleCopyOwnerId = async () => {
        if (!ownerId) {
            toast.error(t("pages.addBin.toasts.ownerIdNotReady"));
            return;
        }
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

    return ownerId || isOwner ?
        <div className="flex justify-center items-center" >
            <div className="w-full max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[700px]">
                <Alert className="mb-3">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">{t("pages.addBin.intro.title")}</AlertTitle>
                    <AlertDescription className="text-sm">
                        {t("pages.addBin.intro.description")}
                    </AlertDescription>
                </Alert>
                <Carousel allowDrag={false} setApi={setApi}>
                    <CarouselContent isRight={isRight} className="max-w-[370px] sm:max-w-[470px] md:max-w-[570px] lg:max-w-[720px] p-1">
                        {/* Step 1: Preparation - Gather all information before starting */}
                        <CarouselItem key={1}>
                            <Card>
                                <CardHeader>
                                    <div className="text-xs text-muted-foreground">{t("pages.addBin.progress", { current: 1, total: totalSteps })}</div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ListChecks className="h-5 w-5" />
                                        {t("pages.addBin.stepOne.title")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("pages.addBin.stepOne.description")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* WiFi Credentials Section */}
                                    <div className="bg-muted p-4 rounded-lg space-y-3">
                                        <p className="font-medium flex items-center gap-2">
                                            <Wifi className="h-4 w-4" />
                                            {t("pages.addBin.stepOne.wifiSection")}
                                        </p>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                                <span>{t("pages.addBin.stepOne.wifiName")}</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                                <span>{t("pages.addBin.stepOne.wifiPassword")}</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Owner ID Section */}
                                    <div className="bg-muted p-4 rounded-lg space-y-3">
                                        <p className="font-medium text-sm">{t("pages.addBin.stepOne.ownerIdLabel")}:</p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-background p-3 rounded border text-sm font-mono break-all">
                                                {ownerId || t("pages.addBin.stepOne.ownerIdLoading")}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleCopyOwnerId}
                                                className="shrink-0"
                                                disabled={!ownerId}
                                            >
                                                {copiedOwnerId ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{t("pages.addBin.stepOne.ownerIdHint")}</p>
                                        <p className="text-xs text-muted-foreground">{t("pages.addBin.stepOne.ownerIdPurpose")}</p>
                                    </div>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepOne.nextStepTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepOne.nextStepNote")}
                                        </AlertDescription>
                                    </Alert>

                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepOne.important")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepOne.importantNote")}
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button onClick={handleNext}>
                                        {t("pages.addBin.navigation.ready")}
                                        <NextIcon className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </CarouselItem>

                        {/* Step 2: Connect to Bin WiFi and Fill Form */}
                        <CarouselItem key={2}>
                            <Card>
                                <CardHeader>
                                    <div className="text-xs text-muted-foreground">{t("pages.addBin.progress", { current: 2, total: totalSteps })}</div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Wifi className="h-5 w-5" />
                                        {t("pages.addBin.stepTwo.title")}
                                    </CardTitle>
                                    <CardDescription>{t("pages.addBin.stepTwo.description")}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted p-4 rounded-lg space-y-3">
                                        <p className="font-medium">{t("pages.addBin.stepTwo.instructions")}:</p>
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                            <li>{t("pages.addBin.stepTwo.step1")}</li>
                                            <li>{t("pages.addBin.stepTwo.step2")}</li>
                                            <li>{t("pages.addBin.stepTwo.step3")}</li>
                                            <li>{t("pages.addBin.stepTwo.step4")}</li>
                                        </ol>
                                    </div>

                                    <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                                        <p className="font-medium text-primary">{t("pages.addBin.stepTwo.formFields")}:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            <li>{t("pages.addBin.stepTwo.field1")}</li>
                                            <li>{t("pages.addBin.stepTwo.field2")}</li>
                                            <li>{t("pages.addBin.stepTwo.field3")}</li>
                                        </ul>
                                    </div>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepTwo.wifiClarificationTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepTwo.wifiClarificationNote")}
                                        </AlertDescription>
                                    </Alert>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepTwo.noInternetTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepTwo.noInternetNote")}
                                        </AlertDescription>
                                    </Alert>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepTwo.captivePortalTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepTwo.captivePortalNote")}
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="outline" onClick={handlePrev}>
                                        <PrevIcon className="h-4 w-4" />
                                        {t("pages.addBin.navigation.back")}
                                    </Button>
                                    <Button onClick={handleNext}>
                                        {t("pages.addBin.navigation.formSubmitted")}
                                        <NextIcon className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </CarouselItem>

                        {/* Step 3: Wait for confirmation and return to local WiFi */}
                        <CarouselItem key={3}>
                            <Card>
                                <CardHeader>
                                    <div className="text-xs text-muted-foreground">{t("pages.addBin.progress", { current: 3, total: totalSteps })}</div>
                                    <CardTitle className="flex items-center gap-2">
                                        <WifiOff className="h-5 w-5" />
                                        {t("pages.addBin.stepThree.title")}
                                    </CardTitle>
                                    <CardDescription>{t("pages.addBin.stepThree.description")}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted p-4 rounded-lg space-y-3">
                                        <p className="font-medium">{t("pages.addBin.stepThree.whatHappens")}:</p>
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                            <li>{t("pages.addBin.stepThree.process1")}</li>
                                            <li>{t("pages.addBin.stepThree.process2")}</li>
                                            <li>{t("pages.addBin.stepThree.process3")}</li>
                                            <li>{t("pages.addBin.stepThree.process4")}</li>
                                        </ol>
                                    </div>

                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepThree.waitTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepThree.waitNote")}
                                        </AlertDescription>
                                    </Alert>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepThree.timeoutTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepThree.timeoutNote")}
                                        </AlertDescription>
                                    </Alert>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepThree.nextStepTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepThree.nextStepNote")}
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="outline" onClick={handlePrev}>
                                        <PrevIcon className="h-4 w-4" />
                                        {t("pages.addBin.navigation.back")}
                                    </Button>
                                    <Button onClick={handleNext}>
                                        {t("pages.addBin.navigation.windowClosed")}
                                        <NextIcon className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </CarouselItem>

                        {/* Step 4: Done - Return to local network */}
                        <CarouselItem key={4}>
                            <Card>
                                <CardHeader>
                                    <div className="text-xs text-muted-foreground">{t("pages.addBin.progress", { current: 4, total: totalSteps })}</div>
                                    <CardTitle className="flex items-center gap-2">
                                        <CircleCheck className="h-5 w-5 text-primary" />
                                        {t("pages.addBin.stepFour.title")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("pages.addBin.stepFour.description")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-primary/10 p-4 rounded-lg space-y-3">
                                        <p className="font-medium text-primary">{t("pages.addBin.stepFour.finalSteps")}:</p>
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                            <li>{t("pages.addBin.stepFour.final1")}</li>
                                            <li>{t("pages.addBin.stepFour.final2")}</li>
                                        </ol>
                                    </div>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-medium">{t("pages.addBin.stepFour.noteTitle")}</AlertTitle>
                                        <AlertDescription className="text-sm">
                                            {t("pages.addBin.stepFour.noteDescription")}
                                        </AlertDescription>
                                    </Alert>

                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <p className="font-medium text-sm">{t("pages.addBin.stepFour.troubleshootTitle")}</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            <li>{t("pages.addBin.stepFour.troubleshoot1")}</li>
                                            <li>{t("pages.addBin.stepFour.troubleshoot2")}</li>
                                        </ul>
                                    </div>
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
        </div>
        : <ErrorPage
            code={t("pages.addBin.noOrganization.code")}
            description={t("pages.addBin.noOrganization.description")}
            buttonText={t("pages.addBin.noOrganization.buttonText")}
            navTo="/" />


}

export default AddBin
