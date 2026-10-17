import { Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppSide } from "@/contexts/AppSideProvider";
import { DEFAULT_REPORT_INTERVAL_MINUTES, DEFAULT_REPORT_START_HOUR, formatReportSchedule } from "@/utils/orgSettings";
import OrgDeviceSettingsForm from "./OrgDeviceSettingsForm";

// The organizations table cell: the current settings and a dialog to edit them.
function OrgSettingsDialog({ organization }) {
    const { t, i18n } = useTranslation();
    const { side, isRight } = useAppSide();
    const [open, setOpen] = useState(false);
    const interval = organization.reportIntervalMinutes ?? DEFAULT_REPORT_INTERVAL_MINUTES;
    const startHour = organization.reportStartHour ?? DEFAULT_REPORT_START_HOUR;

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t("components.orgSettings.summary", {
                    seconds: organization.meshAwakeWindowSeconds,
                    schedule: formatReportSchedule(interval, startHour, t, i18n.language),
                })}
            </span>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="cursor-pointer"><Settings /> {t("components.orgSettings.open")}</Button>
                </DialogTrigger>
                <DialogContent side={side}>
                    <DialogHeader isRight={isRight} className="pt-6">
                        <DialogTitle>{t("components.orgSettings.dialogTitle", { name: organization.name })}</DialogTitle>
                        <DialogDescription isRight={!isRight}>{t("components.orgSettings.description")}</DialogDescription>
                    </DialogHeader>
                    <OrgDeviceSettingsForm
                        key={`${organization._id}-${organization.meshAwakeWindowSeconds}-${interval}-${startHour}`}
                        organization={organization}
                        onSaved={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default OrgSettingsDialog;
