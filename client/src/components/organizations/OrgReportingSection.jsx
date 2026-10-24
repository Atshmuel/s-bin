import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useAppSide } from "@/hooks/useAppSide";
import { updateMeshSettings } from "@/services/apiMeshSettings";
import { formatHour, formatReportInterval, formatReportSchedule } from "@/utils/orgSettings";
import {
    DEFAULT_REPORT_INTERVAL_MINUTES,
    DEFAULT_REPORT_START_HOUR,
    MAX_MESH_AWAKE_WINDOW_SECONDS,
    REPORT_INTERVAL_OPTIONS_MINUTES,
} from "@/utils/constants";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

// When the organization's devices report and how long a mesh stays awake:
// owners edit any organization, admins their own (the server checks both).
function OrgReportingSection({ id, organization }) {
    const { t, i18n } = useTranslation();
    const { isRight } = useAppSide();
    const queryClient = useQueryClient();
    const saved = {
        seconds: String(organization.meshAwakeWindowSeconds),
        interval: String(organization.reportIntervalMinutes ?? DEFAULT_REPORT_INTERVAL_MINUTES),
        startHour: String(organization.reportStartHour ?? DEFAULT_REPORT_START_HOUR),
    };
    const [form, setForm] = useState(saved);
    const set = (field) => (value) => setForm(current => ({ ...current, [field]: value }));

    const updateMutation = useMutation({
        mutationFn: updateMeshSettings,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const seconds = Number(form.seconds);
    const interval = Number(form.interval);
    const hour = Number(form.startHour);
    const isInvalid = !Number.isInteger(seconds) || seconds < 1 || seconds > MAX_MESH_AWAKE_WINDOW_SECONDS ||
        !REPORT_INTERVAL_OPTIONS_MINUTES.includes(interval);
    const scheduleChanged = form.interval !== saved.interval || form.startHour !== saved.startHour;
    const isChanged = scheduleChanged || form.seconds !== saved.seconds;

    const save = () => updateMutation.mutate({
        orgId: organization._id,
        meshAwakeWindowSeconds: seconds,
        reportIntervalMinutes: interval,
        reportStartHour: hour,
    });

    const select = (field, options, format, label) => (
        <Select value={form[field]} onValueChange={set(field)} disabled={updateMutation.isPending}>
            <SelectTrigger isRight={isRight} className="w-full sm:w-48" aria-label={label}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map(option => (
                    <SelectItem isRight={isRight} key={option} value={String(option)}>{format(option)}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.reporting.title")}
            description={t("components.orgSettings.reportsAt", { schedule: formatReportSchedule(interval, hour, t, i18n.language) })}
            footer={isChanged && (
                <>
                    <Button type="button" variant="ghost" disabled={updateMutation.isPending} onClick={() => setForm(saved)}>
                        {t("components.accountPage.cancel")}
                    </Button>
                    <Button type="button" disabled={isInvalid || updateMutation.isPending} onClick={save}>
                        {updateMutation.isPending ? <Spinner /> : t("components.accountPage.save")}
                    </Button>
                </>
            )}>
            <SettingsRow label={t("components.orgSettings.reportInterval")} description={t("components.orgSettings.intervalNote")}>
                {select("interval", REPORT_INTERVAL_OPTIONS_MINUTES, minutes => formatReportInterval(minutes, t), t("components.orgSettings.reportInterval"))}
            </SettingsRow>
            <SettingsRow label={t("components.orgSettings.startHour")} description={t("components.orgSettingsPage.reporting.startHourHint")}>
                {select("startHour", HOURS, formatHour, t("components.orgSettings.startHour"))}
            </SettingsRow>
            <SettingsRow label={t("components.orgSettings.awakeTime")} description={t("components.orgSettings.awakeTimeNote")}>
                <Input type="number" min={1} max={MAX_MESH_AWAKE_WINDOW_SECONDS} step={1} className="w-full sm:w-28"
                    value={form.seconds} onChange={event => set("seconds")(event.target.value)}
                    disabled={updateMutation.isPending} aria-label={t("components.orgSettings.awakeTime")} />
            </SettingsRow>
            {scheduleChanged && (
                <p role="status" className="px-6 py-3 text-sm text-amber-600 dark:text-amber-400">
                    {t("components.orgSettings.changeNote")}
                </p>
            )}
        </SettingsSection>
    );
}

export default OrgReportingSection;
