import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useAppSide } from "@/hooks/useAppSide";
import { useMe } from "@/hooks/users/auth/useMe";
import { updateFleetSettingsApi } from "@/services/apiOrganizations";
import { planDayNow } from "@/services/apiRoutes";
import { DEFAULT_ROUTE_PLANNING_HOUR } from "@/utils/constants";
import { formatHour } from "@/utils/orgSettings";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

// What the last nightly plan did, in a line: its routes and bins and what was
// left, or why it made none.
function lastPlanText(plan, t, language) {
    if (!plan) return t("components.orgSettingsPage.routePlanning.never");
    const at = new Date(plan.at).toLocaleString(language, { dateStyle: "short", timeStyle: "short" });
    if (plan.note && plan.note !== "noneFit") return t("components.orgSettingsPage.routePlanning.lastNote", { at, reason: t(`components.orgSettingsPage.routePlanning.notes.${plan.note}`) });
    return t("components.orgSettingsPage.routePlanning.last", { at, routes: plan.routes, stops: plan.stops, leftOut: plan.leftOut.toLocaleString() });
}

// The organization's nightly plan: whether its routes are planned every night
// and at what local hour (every free truck gets a route from the depot), what
// the last plan did, and planning today's routes now. Owners for any
// organization, admins for their own.
function OrgRoutePlanningSection({ id, organization }) {
    const { t, i18n } = useTranslation();
    const { isRight } = useAppSide();
    const { isOwner } = useMe();
    const queryClient = useQueryClient();
    const saved = organization.routePlanningHour === undefined ? DEFAULT_ROUTE_PLANNING_HOUR : organization.routePlanningHour;
    const [hour, setHour] = useState(saved);

    const settingsMutation = useMutation({
        mutationFn: updateFleetSettingsApi,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
        },
        onError: (error) => { toast.error(error.message); setHour(saved); },
    });
    const save = (value) => {
        setHour(value);
        settingsMutation.mutate({ orgId: organization._id, routePlanningHour: value });
    };

    const planMutation = useMutation({
        mutationFn: () => planDayNow({ org: isOwner ? organization._id : null }),
        onSuccess: ({ plan }) => {
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
            queryClient.invalidateQueries({ queryKey: ["routes"] });
            toast.success(lastPlanText(plan, t, i18n.language));
        },
        onError: (error) => toast.error(error.message),
    });

    const isOn = hour !== null;
    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.routePlanning.title")}
            description={t("components.orgSettingsPage.routePlanning.description")}>
            <SettingsRow label={t("components.orgSettingsPage.routePlanning.nightly")} description={t("components.orgSettingsPage.routePlanning.nightlyHint")}>
                <div className="flex items-center gap-3">
                    <Switch isRight={isRight} checked={isOn} disabled={settingsMutation.isPending} aria-label={t("components.orgSettingsPage.routePlanning.nightly")}
                        onCheckedChange={(checked) => save(checked ? DEFAULT_ROUTE_PLANNING_HOUR : null)} />
                    <Select value={isOn ? String(hour) : ""} disabled={!isOn || settingsMutation.isPending} onValueChange={(value) => save(Number(value))}>
                        <SelectTrigger isRight={isRight} className="w-28" aria-label={t("components.orgSettingsPage.routePlanning.hour")}>
                            <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                            {HOURS.map(option => <SelectItem isRight={isRight} key={option} value={String(option)}>{formatHour(option)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </SettingsRow>
            <SettingsRow label={t("components.orgSettingsPage.routePlanning.lastLabel")} description={lastPlanText(organization.lastAutoPlan, t, i18n.language)}>
                <Button type="button" variant="outline" disabled={planMutation.isPending} onClick={() => planMutation.mutate()}>
                    {planMutation.isPending ? <Spinner data-icon="inline-start" /> : <RouteIcon data-icon="inline-start" />}
                    {t("components.orgSettingsPage.routePlanning.planNow")}
                </Button>
            </SettingsRow>
        </SettingsSection>
    );
}

export default OrgRoutePlanningSection;
