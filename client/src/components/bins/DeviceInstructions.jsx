import { format } from "date-fns";
import { LoaderCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppSide } from "@/contexts/AppSideProvider";
import { cn } from "@/lib/utils";
import {
    useCancelInstruction,
    useDeviceInstructions,
    useEnqueueInstruction,
} from "@/hooks/bins/instructions/useDeviceInstructions";
import { isGateway } from "@/utils/binHelpers";
import { formatReportSchedule } from "@/utils/orgSettings";

const INSTRUCTION_TYPES = ["report_now", "stay_awake", "calibrate_empty_bin"];
const MAX_AWAKE_MINUTES = 60;
const PAGE_SIZE = 5;
const DATE_FORMAT = "yyyy-MM-dd HH:mm";
// The last report to the second, as on the bin page's tile.
const REPORT_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
const STATUS_VARIANTS = {
    pending: "pending",
    completed: "default",
    failed: "destructive",
    cancelled: "secondary",
};

// The device reports results as codes (and the server marks stale ones
// "expired"); unknown codes are shown as they are.
function formatResult(result, t) {
    const depth = /^empty_depth_mm_(\d+)$/.exec(result);
    if (depth) {
        return t("components.deviceInstructions.results.emptyDepth", { cm: Math.round(Number(depth[1]) / 10) });
    }
    return t(`components.deviceInstructions.results.${result}`, { defaultValue: result });
}

// Instructions for one device. They are queued on the server and delivered
// when the device next reports, so the card says when that will be.
function DeviceInstructions({ bin, className }) {
    const { t, i18n } = useTranslation();
    const { isRight } = useAppSide();
    // Calibration needs the A02 sensor: every bin has one, including a bin that
    // relays for leaves; only a gateway does not.
    const instructionTypes = isGateway(bin)
        ? INSTRUCTION_TYPES.filter((type) => type !== "calibrate_empty_bin")
        : INSTRUCTION_TYPES;
    const [instructionType, setInstructionType] = useState(instructionTypes[0]);
    const [durationMinutes, setDurationMinutes] = useState("5");
    const [showCalibrationConfirmation, setShowCalibrationConfirmation] = useState(false);
    const [page, setPage] = useState(0);

    const { instructions, isLoadingInstructions, instructionsError } = useDeviceInstructions(bin._id);
    const { enqueueInstruction, isEnqueuing } = useEnqueueInstruction(bin._id);
    const { cancelInstruction, isCancelling } = useCancelInstruction(bin._id);

    // Older commands stay reachable (the server returns the latest 100), so a
    // pending one beyond the first page can still be cancelled.
    const pageCount = Math.max(1, Math.ceil(instructions.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount - 1);
    const pageInstructions = instructions.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    // A leaf reports through another bin over the mesh, and instructions can't
    // reach it that way yet.
    const viaMesh = bin.status?.connection?.via === "mesh";
    const duration = Number(durationMinutes);
    const durationInvalid = instructionType === "stay_awake" &&
        (!Number.isInteger(duration) || duration < 1 || duration > MAX_AWAKE_MINUTES);

    const enqueueSelectedInstruction = () => enqueueInstruction({
        binId: bin._id,
        type: instructionType,
        durationMinutes: duration,
    });

    return (
        // Sending on one side and what was sent on the other.
        <div className={cn("grid gap-4", !viaMesh && "lg:grid-cols-2", className)}>
            <Card>
                <CardHeader>
                    <CardTitle>{t("components.deviceInstructions.title")}</CardTitle>
                    {viaMesh ? (
                        <CardDescription>{t("components.deviceInstructions.meshNotSupported")}</CardDescription>
                    ) : (
                        <CardDescription className="flex flex-col gap-1">
                            <span className="block">{t("components.deviceInstructions.deliveryNote")}</span>
                            {bin.reportSchedule && (
                                <span className="block">
                                    {t("components.deviceInstructions.schedule", {
                                        schedule: formatReportSchedule(
                                            bin.reportSchedule.reportIntervalMinutes,
                                            bin.reportSchedule.reportStartHour,
                                            t,
                                            i18n.language,
                                        ),
                                    })}
                                </span>
                            )}
                            {bin.status?.updatedAt && (
                                <span className="block">
                                    {t("components.deviceInstructions.lastReport")}{" "}
                                    <span dir="ltr">{format(new Date(bin.status.updatedAt), REPORT_TIME_FORMAT)}</span>
                                </span>
                            )}
                        </CardDescription>
                    )}
                </CardHeader>
                {!viaMesh && (
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                                <div className="flex flex-col gap-2 sm:w-72">
                                    <label className="text-sm font-medium" htmlFor="instruction-type">
                                        {t("components.deviceInstructions.instruction")}
                                    </label>
                                    <Select value={instructionType} onValueChange={setInstructionType}>
                                        <SelectTrigger id="instruction-type" isRight={isRight}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instructionTypes.map((type) => (
                                                <SelectItem isRight={isRight} key={type} value={type}>
                                                    {t(`components.deviceInstructions.types.${type}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {instructionType === "stay_awake" && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium" htmlFor="awake-duration">
                                            {t("components.deviceInstructions.duration")}
                                        </label>
                                        <Input
                                            id="awake-duration"
                                            className="w-28"
                                            type="number"
                                            min={1}
                                            max={MAX_AWAKE_MINUTES}
                                            step={1}
                                            value={durationMinutes}
                                            onChange={(event) => setDurationMinutes(event.target.value)}
                                        />
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    className="cursor-pointer self-start sm:self-auto"
                                    disabled={isEnqueuing || durationInvalid}
                                    onClick={() => {
                                        if (instructionType === "calibrate_empty_bin") {
                                            setShowCalibrationConfirmation(true);
                                        } else {
                                            enqueueSelectedInstruction();
                                        }
                                    }}
                                >
                                    {isEnqueuing ? <LoaderCircle className="animate-spin" /> : <Send />}
                                    {t("components.deviceInstructions.send")}
                                </Button>
                            </div>
                            {instructionType === "stay_awake" && (
                                <p className="text-xs text-muted-foreground">
                                    {t("components.deviceInstructions.durationLimit")}
                                </p>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
            {!viaMesh && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t("components.deviceInstructions.recentTitle")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingInstructions ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <LoaderCircle className="size-4 animate-spin" />
                                {t("loading")}
                            </div>
                        ) : instructionsError ? (
                            <p role="alert" className="text-sm text-destructive">
                                {instructionsError.message}
                            </p>
                        ) : instructions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t("components.deviceInstructions.emptyQueue")}
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {pageInstructions.map((instruction) => (
                                    <li key={instruction._id} className="flex items-start justify-between gap-3 py-3">
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {t(`components.deviceInstructions.types.${instruction.type}`, {
                                                        defaultValue: instruction.type,
                                                    })}
                                                </span>
                                                <Badge variant={STATUS_VARIANTS[instruction.status] ?? "secondary"}>
                                                    {t(`components.deviceInstructions.statuses.${instruction.status}`)}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                <span dir="ltr">{format(new Date(instruction.createdAt), DATE_FORMAT)}</span>
                                                {instruction.type === "stay_awake" &&
                                                    Number.isInteger(instruction.payload?.durationSeconds) && (
                                                        <> · {t("components.deviceInstructions.durationValue", {
                                                            count: instruction.payload.durationSeconds / 60,
                                                        })}</>
                                                    )}
                                            </p>
                                            {instruction.result && (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatResult(instruction.result, t)}
                                                </p>
                                            )}
                                        </div>
                                        {instruction.status === "pending" && (
                                            <Button
                                                type="button"
                                                variant="outline_destructive"
                                                size="sm"
                                                disabled={isCancelling}
                                                onClick={() => cancelInstruction({
                                                    binId: bin._id,
                                                    instructionId: instruction._id,
                                                })}
                                            >
                                                <X />
                                                {t("components.deviceInstructions.cancel")}
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {pageCount > 1 && (
                            <div className="flex items-center justify-between gap-2 pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 0}
                                    onClick={() => setPage(currentPage - 1)}
                                >
                                    {t("globalTable.previous")}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {currentPage + 1} {t("globalTable.tablePage")} {pageCount}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === pageCount - 1}
                                    onClick={() => setPage(currentPage + 1)}
                                >
                                    {t("globalTable.next")}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={showCalibrationConfirmation} onOpenChange={setShowCalibrationConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("components.deviceInstructions.calibrationConfirmationTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("components.deviceInstructions.calibrationConfirmationDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                setShowCalibrationConfirmation(false);
                                enqueueSelectedInstruction();
                            }}
                        >
                            {t("components.deviceInstructions.confirmCalibration")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default DeviceInstructions;
