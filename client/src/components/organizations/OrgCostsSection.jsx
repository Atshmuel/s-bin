import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { updateCostSettingsApi } from "@/services/apiOrganizations";
import { COST_SETTINGS } from "@/utils/constants";

const FIELDS = Object.keys(COST_SETTINGS);

const asForm = (costs) => Object.fromEntries(FIELDS.map(field => [field, String(costs?.[field] ?? COST_SETTINGS[field][0])]));

function isValidCost(field, value) {
    const [, min, max] = COST_SETTINGS[field];
    const number = Number(value);
    return value.trim() !== "" && Number.isFinite(number) && number >= min && number <= max;
}

// What collecting costs the organization, in ₪: diesel, the crew's hour,
// disposal by the tonne (the landfill levy and the site's own fee), the system
// a month, and how often bins were emptied before it, which the savings are
// counted against. Each starts from a common figure; saved together.
// Owners for any organization, admins for their own.
function OrgCostsSection({ id, organization }) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const saved = asForm(organization.costs);
    const [costs, setCosts] = useState(saved);
    const isChanged = FIELDS.some(field => costs[field] !== saved[field]);
    const isValid = FIELDS.every(field => isValidCost(field, costs[field]));

    const mutation = useMutation({
        mutationFn: updateCostSettingsApi,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
            // The money counts with them.
            queryClient.invalidateQueries({ queryKey: ["overview-section", "costs"] });
        },
        onError: (error) => toast.error(error.message),
    });
    const save = () => mutation.mutate({
        orgId: organization._id,
        ...Object.fromEntries(FIELDS.filter(field => costs[field] !== saved[field]).map(field => [field, Number(costs[field])])),
    });

    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.costs.title")} description={t("components.orgSettingsPage.costs.description")}
            footer={isChanged && (
                <>
                    <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => setCosts(saved)}>
                        {t("components.accountPage.cancel")}
                    </Button>
                    <Button type="button" disabled={!isValid || mutation.isPending} onClick={save}>
                        {mutation.isPending ? <Spinner /> : t("components.accountPage.save")}
                    </Button>
                </>
            )}>
            {FIELDS.map(field => {
                const [, min, max] = COST_SETTINGS[field];
                const label = t(`components.orgSettingsPage.costs.fields.${field}.label`);
                const isFieldValid = isValidCost(field, costs[field]);
                return (
                    <SettingsRow key={field} label={label} description={t(`components.orgSettingsPage.costs.fields.${field}.hint`)}>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Input type="number" min={min} max={max} step="any" value={costs[field]} aria-label={label} aria-invalid={!isFieldValid}
                                    className="w-32" disabled={mutation.isPending}
                                    onChange={(event) => setCosts(current => ({ ...current, [field]: event.target.value }))} />
                                <span className="text-sm whitespace-nowrap text-muted-foreground">{t(`components.orgSettingsPage.costs.fields.${field}.unit`)}</span>
                            </div>
                            {!isFieldValid && (
                                <p role="alert" className="text-xs text-destructive">
                                    {t("components.orgSettingsPage.costs.invalid", { min: min.toLocaleString(), max: max.toLocaleString() })}
                                </p>
                            )}
                        </div>
                    </SettingsRow>
                );
            })}
        </SettingsSection>
    );
}

export default OrgCostsSection;
