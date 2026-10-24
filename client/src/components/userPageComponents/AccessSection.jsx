import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Spinner } from "../ui/spinner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useMe } from "@/hooks/users/auth/useMe";
import { useOrgManagers } from "@/hooks/users/useOrgManagers";
import { useOrganizations } from "@/hooks/organizations/useOrganizations";
import { useUpdateOrgAndManager, useUpdateUserRole, useUpdateUserStatus } from "@/hooks/users/useUpdateUser";
import { SegmentedChoice, SettingsRow, SettingsSection } from "./SettingsSection";

const STATUSES = Object.freeze(["pending", "active", "inactive", "suspended"]);

// What an admin or owner manages about another user: role, account status,
// organization (owners only) and manager. Only what changed is sent.
function AccessSection({ id, user }) {
    const { me, isOwner } = useMe()
    const { t } = useTranslation();
    const { updateRole, isUpdatingRole } = useUpdateUserRole()
    const { updateStatus, isUpdatingStatus } = useUpdateUserStatus()
    const { updateOrgAndManager, isUpdatingOrgAndManager } = useUpdateOrgAndManager()
    const isSaving = isUpdatingRole || isUpdatingStatus || isUpdatingOrgAndManager

    const values = { status: user.status, role: user.role, org: user.org || me.org, manager: user.manager }
    const form = useForm({ defaultValues: values })
    useEffect(() => {
        form.reset({ status: user.status, role: user.role, org: user.org || me.org, manager: user.manager });
    }, [user, form, me.org]);

    const { data: organizations, isLoadingOrgs, orgsError } = useOrganizations()
    const { managers, isLoadingManagers, managersError } = useOrgManagers(isOwner ? form.watch("org") : me.org);
    const { isDirty, dirtyFields } = form.formState;

    function save(data) {
        if (data.manager === user._id) {
            toast.error(t("components.userManagementCard.updateErrorSelfManager"))
            return
        }
        if (dirtyFields.org || dirtyFields.manager) {
            updateOrgAndManager({ userId: user._id, org: data.org || me.org, manager: data.manager })
        }
        if (user._id === me.id && (dirtyFields.role || dirtyFields.status)) {
            toast.warning(t("components.userManagementCard.updateErrorSameUser"))
            return
        }
        if (dirtyFields.role) updateRole({ role: data.role, id: user._id })
        if (dirtyFields.status) updateStatus({ status: data.status, id: user._id })
    }

    const roles = ["user", "technician", "admin", ...(isOwner ? ["owner"] : [])]
    const select = (name, { items, isLoading, error, placeholder, errorText }) => (
        <FormField name={name} control={form.control}
            render={({ field }) => (
                <FormItem className="w-full sm:w-64">
                    <FormControl>
                        {isLoading ? <Skeleton className="h-9 w-full" /> : (
                            <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isSaving}>
                                <SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
                                <SelectContent className="z-[1000]">
                                    <SelectGroup className="max-h-52 overflow-y-auto">
                                        {error ? <p className="px-2 py-1.5 text-sm text-destructive">{errorText}</p> : items}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    </FormControl>
                </FormItem>
            )} />
    )

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(save)}>
                <SettingsSection id={id} title={t("components.accountPage.access.title")}
                    description={t("components.accountPage.access.description")}
                    footer={isDirty && (
                        <>
                            <Button type="button" variant="ghost" disabled={isSaving} onClick={() => form.reset()}>
                                {t("components.accountPage.cancel")}
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Spinner /> : t("components.accountPage.save")}
                            </Button>
                        </>
                    )}>
                    <SettingsRow label={t("components.userManagementCard.roleField.label")} description={t("components.userManagementCard.roleField.description")}>
                        <FormField name="role" control={form.control} render={({ field }) => (
                            <SegmentedChoice value={field.value} onChange={field.onChange} disabled={isSaving}
                                label={t("components.userManagementCard.roleField.label")}
                                options={roles.map(value => ({ value, label: t(`roles.${value}`) }))} />
                        )} />
                    </SettingsRow>
                    <SettingsRow label={t("components.userManagementCard.statusField.label")} description={t("components.userManagementCard.statusField.description")}>
                        <FormField name="status" control={form.control} render={({ field }) => (
                            <SegmentedChoice value={field.value} onChange={field.onChange} disabled={isSaving}
                                label={t("components.userManagementCard.statusField.label")}
                                options={STATUSES.map(value => ({ value, label: t(`statuses.${value}`) }))} />
                        )} />
                    </SettingsRow>
                    {isOwner && (
                        <SettingsRow label={t("components.userManagementCard.organizationField.label")}
                            description={t("components.accountPage.access.organizationHint")}>
                            {select("org", {
                                isLoading: isLoadingOrgs, error: orgsError,
                                placeholder: t("components.userManagementCard.organizationField.placeholder"),
                                errorText: t("components.userManagementCard.organizationField.error"),
                                items: organizations?.map(org => (
                                    <SelectItem key={org._id} value={org._id} className="max-w-[320px] truncate">{org.name}</SelectItem>
                                )),
                            })}
                        </SettingsRow>
                    )}
                    <SettingsRow label={t("components.userManagementCard.managerField.label")}
                        description={t("components.accountPage.access.managerHint")}>
                        {select("manager", {
                            isLoading: isLoadingManagers, error: managersError,
                            placeholder: t("components.userManagementCard.managerField.placeholder"),
                            errorText: t("components.userManagementCard.managerField.error"),
                            items: managers?.map(manager => (
                                <SelectItem key={manager._id} value={manager._id} isbadged={manager.role}
                                    tranlatedBadge={t(`roles.${manager.role}`)}>{manager.name}</SelectItem>
                            )),
                        })}
                    </SettingsRow>
                </SettingsSection>
            </form>
        </FormProvider>
    )
}

export default AccessSection
