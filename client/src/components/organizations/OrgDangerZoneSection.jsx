import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useDeleteOrg } from "@/hooks/organizations/useDeleteOrg";

// Deleting the organization (owners only), confirmed by typing its name;
// back to the organizations table afterwards.
function OrgDangerZoneSection({ id, organization }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { deleteOrgById, isDeleting } = useDeleteOrg();

    return (
        <SettingsSection id={id} danger title={t("components.accountPage.danger.title")}
            description={t("components.accountPage.danger.description")}>
            <SettingsRow label={t("components.orgSettingsPage.danger.delete")} description={t("pages.organizationsList.deletion.confirmationDescription")}>
                <ConfirmDeleteDialog
                    trigger={<Button disabled={isDeleting} variant="outline_destructive">{isDeleting ? <Spinner /> : t("delete")}</Button>}
                    title={t("pages.organizationsList.deletion.confirmationTitle")}
                    description={t("pages.organizationsList.deletion.confirmationDescription")}
                    inputLabel={t("confirmations.typeUserName", { userName: organization.name })}
                    confirmWords={[organization.name]}
                    isDeleting={isDeleting}
                    onConfirm={() => deleteOrgById({ orgId: organization._id }, { onSuccess: () => navigate("/organizations", { replace: true }) })}
                />
            </SettingsRow>
        </SettingsSection>
    );
}

export default OrgDangerZoneSection;
