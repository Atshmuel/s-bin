import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSide } from "@/hooks/useAppSide"
import { useOrganizations } from "@/hooks/organizations/useOrganizations"
import { useQuery } from "@tanstack/react-query"
import { getMeshSettings } from "@/services/apiMeshSettings"
import { useMe } from "@/hooks/users/auth/useMe"
import { useRemainingHeight } from "@/hooks/useRemainingHeight"
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, CircleCheck, Copy, Info, KeyRound, ListChecks, Smartphone } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import ErrorPage from "../generals/ErrorPage"

const TOTAL_STEPS = 4
const key = name => `pages.addBin.${name}`

// One value the device's setup page asks for, with a copy button.
function CopyField({ label, value, placeholder, copied, onCopy, copyLabel }) {
    return (
        <div className="space-y-1.5">
            <p className="font-medium text-sm">{label}:</p>
            <div className="flex items-center gap-2">
                {value ? (
                    <code className="flex-1 bg-background p-3 rounded border text-sm font-mono tracking-wide break-all" dir="ltr">{value}</code>
                ) : (
                    <p className="flex-1 bg-background p-3 rounded border text-sm text-muted-foreground">{placeholder}</p>
                )}
                <Button variant="outline" size="icon" onClick={onCopy} className="shrink-0" disabled={!value} aria-label={copyLabel}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    )
}

function Checklist({ items }) {
    return (
        <ul className="space-y-2 text-sm text-muted-foreground">
            {items.map(item => (
                <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    )
}

function Note({ title, children, warning = false }) {
    const Icon = warning ? AlertTriangle : Info
    return (
        <Alert variant={warning ? "destructive" : "default"}>
            <Icon className="h-4 w-4" />
            <AlertTitle className="text-sm font-medium">{title}</AlertTitle>
            <AlertDescription className="text-sm">{children}</AlertDescription>
        </Alert>
    )
}

// A step of the wizard: its number, title and what to do, with Back / Next.
// Every step has the same height (what is left of the screen): a long one
// scrolls inside, so the buttons stay in one place from step to step.
function Step({ number, icon: Icon, name, height, children, onBack, onNext, nextLabel, footer }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    const NextIcon = isRight ? ArrowRight : ArrowLeft
    const PrevIcon = isRight ? ArrowLeft : ArrowRight
    return (
        <CarouselItem style={height ? { height } : undefined}>
            <Card className="flex h-full flex-col">
                <CardHeader>
                    <div className="text-xs text-muted-foreground">{t(key("progress"), { current: number, total: TOTAL_STEPS })}</div>
                    <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {t(key(`${name}.title`))}
                    </CardTitle>
                    <CardDescription>{t(key(`${name}.description`))}</CardDescription>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">{children}</CardContent>
                <CardFooter className={onBack ? "flex justify-between gap-2" : "flex justify-end"}>
                    {onBack && (
                        <Button variant="outline" onClick={onBack}>
                            <PrevIcon className="h-4 w-4" />
                            {t(key("navigation.back"))}
                        </Button>
                    )}
                    {onNext && (
                        <Button onClick={onNext}>
                            {nextLabel}
                            <NextIcon className="h-4 w-4" />
                        </Button>
                    )}
                    {footer}
                </CardFooter>
            </Card>
        </CarouselItem>
    )
}

// Adding a device: the bin joins an organization through its own setup page.
// A new device opens a Wi-Fi network of its own (only for this); a phone on it
// enters the organization's ID and registration code; the device then restarts
// and works over cellular: it takes a GPS fix, measures the empty bin,
// registers and reports.
function AddBin() {
    const { me, isOwner } = useMe()
    const { isRight } = useAppSide()
    const { t } = useTranslation()

    const [api, setApi] = useState(null)
    const [copied, setCopied] = useState(null)
    const [selectedOrgId, setSelectedOrgId] = useState(null)
    const { data: organizations, isLoadingOrgs, orgsError } = useOrganizations()

    // Owners have no organization of their own, so they pick the one the bin belongs to.
    const ownerId = isOwner ? selectedOrgId : me?.org ?? null
    // The organization's registration code, entered with its ID in the device's setup.
    const { data: settings } = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings })
    const registrationCode = settings?.organizations?.find(org => org._id === ownerId)?.registrationCode ?? null
    const waiting = ownerId ? t(key("stepOne.loading")) : t(key("stepOne.organizationRequired"))

    const copy = async (what, value) => {
        if (!value) return
        try {
            await navigator.clipboard.writeText(value)
            setCopied(what)
            toast.success(t(key(`toasts.${what}Copied`)))
            setTimeout(() => setCopied(null), 2000)
        } catch {
            toast.error(t(key("toasts.copyFailed")))
        }
    }
    const fields = (
        <div className="bg-muted p-4 rounded-lg space-y-3">
            <CopyField label={t(key("fields.orgId"))} value={ownerId} placeholder={waiting}
                copied={copied === "orgId"} onCopy={() => copy("orgId", ownerId)} copyLabel={t(key("fields.copyOrgId"))} />
            <CopyField label={t(key("fields.code"))} value={registrationCode} placeholder={waiting}
                copied={copied === "code"} onCopy={() => copy("code", registrationCode)} copyLabel={t(key("fields.copyCode"))} />
        </div>
    )
    const [panelRef, panelHeight] = useRemainingHeight({ minHeight: 420 })
    const next = () => api?.scrollNext()
    const back = () => api?.scrollPrev()

    if (!ownerId && !isOwner) {
        return <ErrorPage code={t(key("noOrganization.code"))} description={t(key("noOrganization.description"))}
            buttonText={t(key("noOrganization.buttonText"))} navTo="/" />
    }
    return (
        <div className="flex justify-center items-center">
            <div className="w-full max-w-[350px] sm:max-w-[450px] md:max-w-[550px] lg:max-w-[700px]">
                <Alert className="mb-3">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">{t(key("intro.title"))}</AlertTitle>
                    <AlertDescription className="text-sm">{t(key("intro.description"))}</AlertDescription>
                </Alert>
                <Carousel ref={panelRef} allowDrag={false} setApi={setApi}>
                    <CarouselContent isRight={isRight} className="max-w-[370px] sm:max-w-[470px] md:max-w-[570px] lg:max-w-[720px] p-1">
                        <Step number={1} height={panelHeight} icon={ListChecks} name="stepOne" onNext={next} nextLabel={t(key("navigation.ready"))}>
                            {isOwner && (
                                <div className="space-y-2">
                                    <p className="font-medium text-sm">{t(key("stepOne.organizationLabel"))}:</p>
                                    {isLoadingOrgs ? <Skeleton className="w-full h-10" /> : (
                                        <Select isRight={isRight} onValueChange={setSelectedOrgId} value={selectedOrgId ?? ""}>
                                            <SelectTrigger isRight={isRight} className="bg-background">
                                                <SelectValue placeholder={t(key("stepOne.organizationPlaceholder"))} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel isRight={isRight}>
                                                        {orgsError ? t(key("stepOne.organizationError")) : t(key("stepOne.organizationLabel"))}
                                                    </SelectLabel>
                                                    <div className="max-h-52 overflow-y-auto">
                                                        {!orgsError && organizations?.map(org => (
                                                            <SelectItem isRight={isRight} className="truncate" key={org._id} value={org._id}>{org.name}</SelectItem>
                                                        ))}
                                                    </div>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}
                            {fields}
                            <p className="text-xs text-muted-foreground">{t(key("stepOne.fieldsHint"))}</p>
                            <div className="bg-muted p-4 rounded-lg space-y-3">
                                <p className="font-medium text-sm">{t(key("stepOne.checklistTitle"))}</p>
                                <Checklist items={["empty", "power", "sky", "phone"].map(item => t(key(`stepOne.checklist.${item}`)))} />
                            </div>
                        </Step>

                        <Step number={2} height={panelHeight} icon={Smartphone} name="stepTwo" onBack={back} onNext={next} nextLabel={t(key("navigation.onSetupPage"))}>
                            <div className="bg-muted p-4 rounded-lg">
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    {["powerOn", "joinNetwork", "openPage"].map(item => <li key={item}>{t(key(`stepTwo.steps.${item}`))}</li>)}
                                </ol>
                            </div>
                            <Note title={t(key("stepTwo.noInternetTitle"))}>{t(key("stepTwo.noInternetNote"))}</Note>
                            <Note title={t(key("stepTwo.noNetworkTitle"))}>{t(key("stepTwo.noNetworkNote"))}</Note>
                        </Step>

                        <Step number={3} height={panelHeight} icon={KeyRound} name="stepThree" onBack={back} onNext={next} nextLabel={t(key("navigation.saved"))}>
                            {fields}
                            <div className="bg-muted p-4 rounded-lg">
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    {["enter", "save", "restart"].map(item => <li key={item}>{t(key(`stepThree.steps.${item}`))}</li>)}
                                </ol>
                            </div>
                        </Step>

                        <Step number={4} height={panelHeight} icon={CircleCheck} name="stepFour" onBack={back}
                            footer={<Button asChild><Link to="/bins">{t(key("navigation.toBins"))}</Link></Button>}>
                            <div className="bg-primary/10 p-4 rounded-lg space-y-3">
                                <p className="font-medium text-primary text-sm">{t(key("stepFour.whatHappens"))}</p>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    {["cellular", "gps", "measure", "register"].map(item => <li key={item}>{t(key(`stepFour.steps.${item}`))}</li>)}
                                </ol>
                            </div>
                            <Note title={t(key("stepFour.timeTitle"))}>{t(key("stepFour.timeNote"))}</Note>
                            <Note title={t(key("stepFour.calibrationTitle"))}>
                                <ul className="list-disc list-inside space-y-1">
                                    {["how", "notEmpty", "redo", "scale"].map(item => <li key={item}>{t(key(`stepFour.calibration.${item}`))}</li>)}
                                </ul>
                            </Note>
                            <Note warning title={t(key("stepFour.troubleshootTitle"))}>
                                <ul className="list-disc list-inside space-y-1">
                                    {["notListed", "noFix", "wrongDetails"].map(item => <li key={item}>{t(key(`stepFour.troubleshoot.${item}`))}</li>)}
                                </ul>
                            </Note>
                        </Step>
                    </CarouselContent>
                </Carousel>
            </div>
        </div>
    )
}

export default AddBin
