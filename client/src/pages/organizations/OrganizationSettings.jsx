import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrgDeviceSettingsForm from "@/components/organizations/OrgDeviceSettingsForm";
import { getMeshSettings } from "@/services/apiMeshSettings";

// An admin's own organization; owners manage every organization from the list.
function OrganizationSettings() {
    const { t } = useTranslation();
    const settingsQuery = useQuery({
        queryKey: ["mesh-settings"],
        queryFn: getMeshSettings,
    });
    const organization = settingsQuery.data?.organizations?.[0];

    return (
        <main className="space-y-6 sm:p-10">
            <div>
                <h1 className="text-2xl font-bold">{t("components.orgSettings.title")}</h1>
                <p className="mt-2 text-muted-foreground">
                    {t("components.orgSettings.description")}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{organization?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    {settingsQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" />
                            {t("loading")}
                        </div>
                    ) : settingsQuery.isError ? (
                        <p role="alert" className="text-sm text-destructive">
                            {settingsQuery.error.message}
                        </p>
                    ) : !organization ? (
                        <p className="text-sm text-muted-foreground">
                            {t("components.orgSettings.empty")}
                        </p>
                    ) : (
                        <OrgDeviceSettingsForm
                            key={`${organization._id}-${organization.meshAwakeWindowSeconds}-${organization.reportIntervalMinutes}-${organization.reportStartHour}`}
                            organization={organization}
                        />
                    )}
                </CardContent>
            </Card>
        </main>
    );
}

export default OrganizationSettings;
