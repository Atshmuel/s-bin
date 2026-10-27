import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { updateThresholdSettingsApi } from "@/services/apiOrganizations";
import { STATUS_COLORS } from "@/utils/binHelpers";
import { DEFAULT_THRESHOLDS, THRESHOLD_MIN_GAP, THRESHOLD_SETTINGS } from "@/utils/constants";

const FIELDS = Object.keys(THRESHOLD_SETTINGS);
const GROUPS = Object.freeze([
    { key: "fullness", warning: "fullnessWarning", critical: "fullnessCritical" },
    { key: "battery", warning: "batteryWarning", critical: "batteryCritical" },
]);

const asForm = (thresholds) => Object.fromEntries(FIELDS.map(field => [field, String(thresholds?.[field] ?? DEFAULT_THRESHOLDS[field])]));

// What is wrong with the values, as the server checks them: a field out of
// range or not whole, or a warning too close to (or past) its critical.
function problemOf(form, t) {
    for (const field of FIELDS) {
        const [, min, max] = THRESHOLD_SETTINGS[field];
        const value = Number(form[field]);
        if (form[field].trim() === "" || !Number.isInteger(value) || value < min || value > max) {
            return t("components.orgSettingsPage.thresholds.invalidRange", { field: t(`components.orgSettingsPage.thresholds.fields.${field}`), min, max });
        }
    }
    if (Number(form.fullnessCritical) - Number(form.fullnessWarning) < THRESHOLD_MIN_GAP) {
        return t("components.orgSettingsPage.thresholds.fullnessGap", { gap: THRESHOLD_MIN_GAP });
    }
    if (Number(form.batteryWarning) - Number(form.batteryCritical) < THRESHOLD_MIN_GAP) {
        return t("components.orgSettingsPage.thresholds.batteryGap", { gap: THRESHOLD_MIN_GAP });
    }
    return null;
}

// The 0-100% scale in its three colors: fullness turns warning and critical
// going up, a battery going down.
function ScaleBar({ group, form }) {
    const warning = Number(form[group.warning]), critical = Number(form[group.critical]);
    const parts = group.key === "fullness"
        ? [["good", warning], ["warning", critical - warning], ["critical", 100 - critical]]
        : [["critical", critical], ["warning", warning - critical], ["good", 100 - warning]];
    return (
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
            {parts.map(([status, width]) => (
                <div key={status} style={{ width: `${Math.max(width, 0)}%`, backgroundColor: STATUS_COLORS[status] }} />
            ))}
        </div>
    );
}

// The organization's fullness and battery cut-offs: they color its devices,
// set its reports' severity, "almost full", "due soon", the nightly plan and
// the alerts. Saved together; owners for any organization, admins for their own.
function OrgThresholdsSection({ id, organization }) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const saved = asForm(organization.thresholds);
    const [form, setForm] = useState(saved);
    const isChanged = FIELDS.some(field => form[field] !== saved[field]);
    const defaults = asForm(DEFAULT_THRESHOLDS);
    const isDefault = FIELDS.every(field => form[field] === defaults[field]);
    const problem = problemOf(form, t);

    const mutation = useMutation({
        mutationFn: updateThresholdSettingsApi,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
            // The dashboard and analytics count with them.
            queryClient.invalidateQueries({ queryKey: ["overview-section"] });
        },
        onError: (error) => toast.error(error.message),
    });
    const save = () => mutation.mutate({
        orgId: organization._id,
        ...Object.fromEntries(FIELDS.filter(field => form[field] !== saved[field]).map(field => [field, Number(form[field])])),
    });

    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.thresholds.title")} description={t("components.orgSettingsPage.thresholds.description")}
            footer={isChanged && (
                <>
                    <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => setForm(saved)}>
                        {t("components.accountPage.cancel")}
                    </Button>
                    <Button type="button" disabled={Boolean(problem) || mutation.isPending} onClick={save}>
                        {mutation.isPending ? <Spinner /> : t("components.accountPage.save")}
                    </Button>
                </>
            )}>
            {GROUPS.map(group => (
                <SettingsRow key={group.key} label={t(`components.orgSettingsPage.thresholds.${group.key}`)}
                    description={t(`components.orgSettingsPage.thresholds.${group.key}Hint`)}>
                    <div className="flex w-full flex-col gap-2 sm:w-64">
                        <div className="flex gap-3">
                            {[group.warning, group.critical].map(field => {
                                const [, min, max] = THRESHOLD_SETTINGS[field];
                                return (
                                    <label key={field} className="flex flex-1 flex-col gap-1 text-sm">
                                        {t(`components.orgSettingsPage.thresholds.${field.endsWith("Warning") ? "warning" : "critical"}`)}
                                        <div className="flex items-center gap-1">
                                            <Input type="number" min={min} max={max} step={1} value={form[field]} disabled={mutation.isPending}
                                                onChange={(event) => setForm(current => ({ ...current, [field]: event.target.value }))} />
                                            <span className="text-muted-foreground">%</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                        {!problem && <ScaleBar group={group} form={form} />}
                    </div>
                </SettingsRow>
            ))}
            {problem && <p role="alert" className="px-6 pb-4 text-xs text-destructive">{problem}</p>}
            {/* Fills in the defaults; Save applies them, like any change. */}
            {!isDefault && (
                <div className="px-6 pb-4">
                    <Button type="button" variant="outline" size="sm" disabled={mutation.isPending} onClick={() => setForm(defaults)}>
                        <RotateCcw data-icon="inline-start" />
                        {t("components.orgSettingsPage.thresholds.reset")}
                    </Button>
                </div>
            )}
        </SettingsSection>
    );
}

export default OrgThresholdsSection;
