import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useUpdateOrgName } from "@/hooks/organizations/useUpdateOrg";

// The organization's name (only an owner renames one) and its ID, which a
// device is set up with.
function OrgGeneralSection({ id, organization, canRename }) {
    const { t } = useTranslation();
    const { updateOrgName, isUpdatingOrgName } = useUpdateOrgName();
    const [name, setName] = useState(organization.name);
    const [copied, setCopied] = useState(false);
    const trimmed = name.trim();
    const isChanged = trimmed !== organization.name;

    async function copyId() {
        try {
            await navigator.clipboard.writeText(organization._id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t("pages.addBin.toasts.copyFailed"));
        }
    }

    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.general.title")}
            description={t("components.orgSettingsPage.general.description")}
            footer={canRename && isChanged && (
                <>
                    <Button type="button" variant="ghost" disabled={isUpdatingOrgName} onClick={() => setName(organization.name)}>
                        {t("components.accountPage.cancel")}
                    </Button>
                    <Button type="button" disabled={!trimmed || isUpdatingOrgName}
                        onClick={() => updateOrgName({ orgId: organization._id, name: trimmed })}>
                        {isUpdatingOrgName ? <Spinner /> : t("components.accountPage.save")}
                    </Button>
                </>
            )}>
            <SettingsRow label={t("components.orgSettingsPage.general.name")}
                description={canRename ? t("components.orgSettingsPage.general.nameHint") : t("components.orgSettingsPage.general.nameReadOnly")}>
                {canRename
                    ? <Input value={name} onChange={event => setName(event.target.value)} disabled={isUpdatingOrgName}
                        className="w-full sm:w-72" aria-label={t("components.orgSettingsPage.general.name")} />
                    : <p className="text-sm sm:text-end" dir="auto">{organization.name}</p>}
            </SettingsRow>
            <SettingsRow label={t("components.orgSettingsPage.general.orgId")} description={t("components.orgSettingsPage.general.orgIdHint")}>
                <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-xs" dir="ltr">{organization._id}</code>
                    <Button type="button" variant="ghost" size="icon" onClick={copyId} aria-label={t("components.orgSettingsPage.general.copyId")}>
                        {copied ? <Check /> : <Copy />}
                    </Button>
                </div>
            </SettingsRow>
        </SettingsSection>
    );
}

export default OrgGeneralSection;
