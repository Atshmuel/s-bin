import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { LoaderCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getAllUserBins } from "@/services/apiBins";
import {
    cancelDeviceInstruction,
    enqueueDeviceInstruction,
    getDeviceInstructions,
} from "@/services/apiDeviceInstructions";

const instructionTypes = ["report_now", "stay_awake"];

function InstructionTesting() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [binId, setBinId] = useState("");
    const [instructionType, setInstructionType] = useState(instructionTypes[0]);
    const [durationMinutes, setDurationMinutes] = useState("5");

    const binsQuery = useQuery({
        queryKey: ["instruction-test-bins"],
        queryFn: () => getAllUserBins(1, 100),
    });

    const instructionsQuery = useQuery({
        queryKey: ["device-instructions", binId],
        queryFn: () => getDeviceInstructions(binId),
        enabled: Boolean(binId),
        refetchInterval: 3000,
    });

    const enqueueMutation = useMutation({
        mutationFn: enqueueDeviceInstruction,
        onSuccess: () => {
            toast.success(t("pages.instructionTesting.requestQueued"));
            queryClient.invalidateQueries({ queryKey: ["device-instructions", binId] });
        },
        onError: (error) => toast.error(error.message),
    });

    const cancelMutation = useMutation({
        mutationFn: cancelDeviceInstruction,
        onSuccess: () => {
            toast.success(t("pages.instructionTesting.requestCancelled"));
            queryClient.invalidateQueries({ queryKey: ["device-instructions", binId] });
        },
        onError: (error) => toast.error(error.message),
    });

    const bins = binsQuery.data?.binsData ?? [];
    const instructions = instructionsQuery.data?.instructions ?? [];

    const statusVariant = {
        pending: "pending",
        completed: "default",
        failed: "destructive",
        cancelled: "secondary",
    };

    return (
        <main className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t("pages.instructionTesting.title")}</h1>
                <p className="mt-2 text-muted-foreground">
                    {t("pages.instructionTesting.description")}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("pages.instructionTesting.sendTitle")}</CardTitle>
                    <CardDescription>
                        {t("pages.instructionTesting.sendDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className={`grid gap-4 sm:items-end ${
                    instructionType === "stay_awake"
                        ? "sm:grid-cols-[1fr_1fr_1fr_auto]"
                        : "sm:grid-cols-[1fr_1fr_auto]"
                }`}>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="instruction-bin">
                            {t("pages.instructionTesting.bin")}
                        </label>
                        <Select value={binId} onValueChange={setBinId}>
                            <SelectTrigger id="instruction-bin">
                                <SelectValue placeholder={t("pages.instructionTesting.selectBin")} />
                            </SelectTrigger>
                            <SelectContent>
                                {bins.map((bin) => (
                                    <SelectItem key={bin._id} value={bin._id}>
                                        {bin.binName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {binsQuery.isLoading && (
                            <p className="text-sm text-muted-foreground">
                                {t("loading")}
                            </p>
                        )}
                        {binsQuery.isError && (
                            <p role="alert" className="text-sm text-destructive">
                                {binsQuery.error.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="instruction-type">
                            {t("pages.instructionTesting.instruction")}
                        </label>
                        <Select value={instructionType} onValueChange={setInstructionType}>
                            <SelectTrigger id="instruction-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {instructionTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {t(`pages.instructionTesting.types.${type}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {instructionType === "stay_awake" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="awake-duration">
                                {t("pages.instructionTesting.duration")}
                            </label>
                            <Input
                                id="awake-duration"
                                type="number"
                                min={1}
                                max={60}
                                step={1}
                                value={durationMinutes}
                                onChange={(event) => setDurationMinutes(event.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t("pages.instructionTesting.durationLimit")}
                            </p>
                        </div>
                    )}

                    <Button
                        type="button"
                        disabled={
                            !binId ||
                            enqueueMutation.isPending ||
                            binsQuery.isLoading ||
                            (instructionType === "stay_awake" &&
                                (!Number.isInteger(Number(durationMinutes)) ||
                                    Number(durationMinutes) < 1 ||
                                    Number(durationMinutes) > 60))
                        }
                        onClick={() => enqueueMutation.mutate({
                            binId,
                            type: instructionType,
                            durationMinutes: Number(durationMinutes),
                        })}
                    >
                        {enqueueMutation.isPending
                            ? <LoaderCircle className="animate-spin" />
                            : <Send />}
                        {t("pages.instructionTesting.send")}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("pages.instructionTesting.queueTitle")}</CardTitle>
                    <CardDescription>
                        {t("pages.instructionTesting.queueDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!binId ? (
                        <p className="text-sm text-muted-foreground">
                            {t("pages.instructionTesting.selectBinToView")}
                        </p>
                    ) : instructionsQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" />
                            {t("loading")}
                        </div>
                    ) : instructionsQuery.isError ? (
                        <p role="alert" className="text-sm text-destructive">
                            {instructionsQuery.error.message}
                        </p>
                    ) : instructions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {t("pages.instructionTesting.emptyQueue")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("pages.instructionTesting.instruction")}</TableHead>
                                    <TableHead>{t("pages.instructionTesting.status")}</TableHead>
                                    <TableHead>{t("pages.instructionTesting.createdAt")}</TableHead>
                                    <TableHead>{t("pages.instructionTesting.result")}</TableHead>
                                    <TableHead className="text-right">
                                        {t("pages.instructionTesting.actions")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {instructions.map((instruction) => (
                                    <TableRow key={instruction._id}>
                                        <TableCell>
                                            <div>
                                                {t(`pages.instructionTesting.types.${instruction.type}`, {
                                                    defaultValue: instruction.type,
                                                })}
                                                {instruction.type === "stay_awake" &&
                                                    Number.isInteger(instruction.payload?.durationSeconds) && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {t("pages.instructionTesting.durationValue", {
                                                                count: instruction.payload.durationSeconds / 60,
                                                            })}
                                                        </div>
                                                    )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[instruction.status] ?? "secondary"}>
                                                {t(`pages.instructionTesting.statuses.${instruction.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(instruction.createdAt), "yyyy-MM-dd HH:mm")}
                                        </TableCell>
                                        <TableCell>{instruction.result || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            {instruction.status === "pending" && (
                                                <Button
                                                    type="button"
                                                    variant="outline_destructive"
                                                    size="sm"
                                                    disabled={cancelMutation.isPending}
                                                    aria-label={t("pages.instructionTesting.cancel")}
                                                    onClick={() => cancelMutation.mutate({
                                                        binId,
                                                        instructionId: instruction._id,
                                                    })}
                                                >
                                                    <X />
                                                    {t("pages.instructionTesting.cancel")}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}

export default InstructionTesting;
