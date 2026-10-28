import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsSection";
import { useUpdateOrgName } from "@/hooks/organizations/useUpdateOrg";
import { regenerateRegistrationCodeApi } from "@/services/apiOrganizations";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// The organization's name (only an owner renames one), and its ID and
// registration code, which a new device is set up with (the code can be
// replaced; devices registered already keep working).
function OrgGeneralSection({ id, organization, canRename }) {
    const { t } = useTranslation();
    const { updateOrgName, isUpdatingOrgName } = useUpdateOrgName();
    const [name, setName] = useState(organization.name);
    const [copied, setCopied] = useState(null);
    const trimmed = name.trim();
    const isChanged = trimmed !== organization.name;
    const queryClient = useQueryClient();
    const regenerate = useMutation({
        mutationFn: regenerateRegistrationCodeApi,
        onSuccess: () => {
            toast.success(t("components.orgSettingsPage.general.codeRegenerated"));
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] });
        },
        onError: (error) => toast.error(error.message),
    });

    async function copy(what, value) {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(what);
            setTimeout(() => setCopied(null), 2000);
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => copy("id", organization._id)} aria-label={t("components.orgSettingsPage.general.copyId")}>
                        {copied === "id" ? <Check /> : <Copy />}
                    </Button>
                </div>
            </SettingsRow>
            {organization.registrationCode && (
                <SettingsRow label={t("components.orgSettingsPage.general.registrationCode")} description={t("components.orgSettingsPage.general.registrationCodeHint")}>
                    <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm tracking-wider" dir="ltr">{organization.registrationCode}</code>
                        <Button type="button" variant="ghost" size="icon" onClick={() => copy("code", organization.registrationCode)}
                            aria-label={t("components.orgSettingsPage.general.copyCode")}>
                            {copied === "code" ? <Check /> : <Copy />}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" disabled={regenerate.isPending}
                                    aria-label={t("components.orgSettingsPage.general.regenerateCode")}>
                                    {regenerate.isPending ? <Spinner /> : <RefreshCw />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t("components.orgSettingsPage.general.regenerateTitle")}</AlertDialogTitle>
                                    <AlertDialogDescription>{t("components.orgSettingsPage.general.regenerateDescription")}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t("components.accountPage.cancel")}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => regenerate.mutate({ orgId: organization._id })}>
                                        {t("components.orgSettingsPage.general.regenerateConfirm")}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </SettingsRow>
            )}
        </SettingsSection>
    );
}

export default OrgGeneralSection;
