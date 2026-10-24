import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAppSide } from "@/hooks/useAppSide";
import { updateMeshSettings } from "@/services/apiMeshSettings";
import {
    formatHour,
    formatReportInterval,
    formatReportSchedule,
} from "@/utils/orgSettings";
import {
    DEFAULT_REPORT_INTERVAL_MINUTES,
    DEFAULT_REPORT_START_HOUR,
    MAX_MESH_AWAKE_WINDOW_SECONDS,
    REPORT_INTERVAL_OPTIONS_MINUTES,
} from "@/utils/constants";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

// An organization's mesh awake time and report schedule: owners edit any
// organization, admins their own (the server checks both).
function OrgDeviceSettingsForm({ organization, onSaved }) {
    const { t, i18n } = useTranslation();
    const { isRight } = useAppSide();
    const queryClient = useQueryClient();
    const savedInterval = organization.reportIntervalMinutes ?? DEFAULT_REPORT_INTERVAL_MINUTES;
    const savedStartHour = organization.reportStartHour ?? DEFAULT_REPORT_START_HOUR;
    const [seconds, setSeconds] = useState(String(organization.meshAwakeWindowSeconds));
    const [intervalMinutes, setIntervalMinutes] = useState(String(savedInterval));
    const [startHour, setStartHour] = useState(String(savedStartHour));

    const updateMutation = useMutation({
        mutationFn: updateMeshSettings,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
            onSaved?.();
        },
        onError: (error) => toast.error(error.message),
    });

    const value = Number(seconds);
    const interval = Number(intervalMinutes);
    const hour = Number(startHour);
    const isInvalid = !Number.isInteger(value) || value < 1 || value > MAX_MESH_AWAKE_WINDOW_SECONDS ||
        !REPORT_INTERVAL_OPTIONS_MINUTES.includes(interval);
    const scheduleChanged = interval !== savedInterval || hour !== savedStartHour;
    const isUnchanged = value === organization.meshAwakeWindowSeconds && !scheduleChanged;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`awake-${organization._id}`}>
                    {t("components.orgSettings.awakeTime")}
                </label>
                <Input
                    id={`awake-${organization._id}`}
                    className="w-28"
                    type="number"
                    min={1}
                    max={MAX_MESH_AWAKE_WINDOW_SECONDS}
                    step={1}
                    value={seconds}
                    onChange={(event) => setSeconds(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("components.orgSettings.awakeTimeNote")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`interval-${organization._id}`}>
                        {t("components.orgSettings.reportInterval")}
                    </label>
                    <Select value={intervalMinutes} onValueChange={setIntervalMinutes}>
                        <SelectTrigger id={`interval-${organization._id}`} isRight={isRight}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {REPORT_INTERVAL_OPTIONS_MINUTES.map((minutes) => (
                                <SelectItem isRight={isRight} key={minutes} value={String(minutes)}>
                                    {formatReportInterval(minutes, t)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor={`start-hour-${organization._id}`}>
                        {t("components.orgSettings.startHour")}
                    </label>
                    <Select value={startHour} onValueChange={setStartHour}>
                        <SelectTrigger id={`start-hour-${organization._id}`} isRight={isRight}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {HOURS.map((option) => (
                                <SelectItem isRight={isRight} key={option} value={String(option)}>
                                    {formatHour(option)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <p className="text-sm">
                {t("components.orgSettings.reportsAt", {
                    schedule: formatReportSchedule(interval, hour, t, i18n.language),
                })}
            </p>
            <p className="text-xs text-muted-foreground">{t("components.orgSettings.intervalNote")}</p>
            {scheduleChanged && (
                <p role="status" className="text-xs text-amber-600 dark:text-amber-400">
                    {t("components.orgSettings.changeNote")}
                </p>
            )}

            <Button
                type="button"
                disabled={isInvalid || isUnchanged || updateMutation.isPending}
                onClick={() => updateMutation.mutate({
                    orgId: organization._id,
                    meshAwakeWindowSeconds: value,
                    reportIntervalMinutes: interval,
                    reportStartHour: hour,
                })}
            >
                {updateMutation.isPending
                    ? <LoaderCircle className="animate-spin" />
                    : <Save />}
                {t("components.orgSettings.save")}
            </Button>
        </div>
    );
}

export default OrgDeviceSettingsForm;
