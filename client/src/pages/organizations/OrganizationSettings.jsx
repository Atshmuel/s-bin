import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import OrgDangerZoneSection from "@/components/organizations/OrgDangerZoneSection";
import OrgGeneralSection from "@/components/organizations/OrgGeneralSection";
import OrgReportingSection from "@/components/organizations/OrgReportingSection";
import SettingsLayout from "@/components/settings/SettingsLayout";
import LoadingProfile from "@/components/userPageComponents/LoadingProfile";
import { useMe } from "@/hooks/users/auth/useMe";
import { getMeshSettings } from "@/services/apiMeshSettings";
import ErrorPage from "../generals/ErrorPage";

// One organization's settings: an owner's for any organization (from the
// organizations table), an admin's for their own.
function OrganizationSettings() {
    const { id } = useParams();
    const { t } = useTranslation();
    const { isOwner } = useMe();
    const settingsQuery = useQuery({ queryKey: ["mesh-settings"], queryFn: getMeshSettings });
    const organization = settingsQuery.data?.organizations?.find(org => org._id === id);

    if (settingsQuery.isPending) return <LoadingProfile />;
    if (settingsQuery.isError) return <ErrorPage code={500} description={settingsQuery.error.message} navTo="/" buttonText={t("pages.userProfile.errorButton")} />;
    if (!organization) return <ErrorPage code={404} description={t("components.orgSettings.empty")} navTo="/" buttonText={t("pages.userProfile.errorButton")} />;

    const header = (
        <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted"><Building2 className="size-7" /></div>
            <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{t("components.orgSettingsPage.header")}</p>
                <h1 className="truncate text-2xl font-semibold" dir="auto">{organization.name}</h1>
            </div>
        </div>
    );
    // Keyed by the saved values, so a section's form starts again from them after a save.
    const reportingKey = `${organization.meshAwakeWindowSeconds}-${organization.reportIntervalMinutes}-${organization.reportStartHour}`;
    return (
        <SettingsLayout header={header} listLabel={t("components.orgSettingsPage.nav.label")}
            sectionName={sectionId => t(`components.orgSettingsPage.nav.${sectionId}`)}
            sections={[
                { id: "general", element: <OrgGeneralSection key={organization.name} id="general" organization={organization} canRename={isOwner} /> },
                { id: "reporting", element: <OrgReportingSection key={reportingKey} id="reporting" organization={organization} /> },
                ...(isOwner ? [{ id: "danger", element: <OrgDangerZoneSection id="danger" organization={organization} /> }] : []),
            ]} />
    );
}

export default OrganizationSettings;
