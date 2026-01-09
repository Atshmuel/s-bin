import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormProvider, useForm } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem } from "../ui/form";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { ToggleGroup } from "@radix-ui/react-toggle-group";
import { ToggleGroupItem } from "../ui/toggle-group";
import { useUpdateOrgAndManager, useUpdateUserRole, useUpdateUserStatus } from "@/hooks/users/useUpdateUser";
import { useEffect } from "react";
import { Spinner } from "../ui/spinner";
import { useMe } from "@/hooks/users/auth/useMe";
import { toast } from "sonner";
import { useOrgManagers } from "@/hooks/users/useOrgManagers";
import { useOrganizations } from "@/hooks/organizations/useOrganizations";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { useTranslation } from "react-i18next";

function UserManagment({ user, isAdmin = false }) {
    const { me, isOwner } = useMe()
    const { t } = useTranslation();

    const { updateRole, isUpdatingRole } = useUpdateUserRole()
    const { updateStatus, isUpdatingStatus } = useUpdateUserStatus()
    const { updateOrgAndManager, isUpdatingOrgAndManager } = useUpdateOrgAndManager()

    const userManagment = useForm({
        defaultValues: {
            status: user.status,
            role: user.role,
            org: user.org || me.org,
            manager: user.manager
        }
    })
    useEffect(() => {
        userManagment.reset({
            status: user.status,
            role: user.role,
            org: user.org || me.org,
            manager: user.manager
        });
    }, [user, userManagment]);

    const { data: organizations, isLoadingOrgs, orgsError } = useOrganizations()
    const selectedOrgId = isOwner ? userManagment.watch("org") : me.org;
    const { managers, isLoadingManagers, managersError } = useOrgManagers(selectedOrgId);


    const { isDirty } = userManagment.formState;

    function handleUpdate(data) {
        updateOrgAndManager({ userId: user._id, org: data.org || me.org, manager: data.manager })
        if (user._id === me.id) {
            toast.warning(t("components.userManagementCard.updateErrorSameUser"))
            return
        }
        user.role !== data.role ? updateRole({ role: data.role, id: user._id }) : null
        user.status !== data.status ? updateStatus({ status: data.status, id: user._id }) : null
    }

    if (!isAdmin) {
        return null
    }

    return (
        <Card className="min-w-[330px] max-w-[400px] h-fit">
            <CardHeader className='text-center'>
                <CardTitle className="mb-1">{t("components.userManagementCard.title")}</CardTitle>
                <CardDescription>{t("components.userManagementCard.description")}</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <FormProvider {...userManagment}>
                <form onSubmit={userManagment.handleSubmit(handleUpdate)} >
                    <CardContent className="overflow-auto max-h-[calc(100dvh-270px)] space-y-4">
                        <div className="space-y-6">
                            <FormField
                                name="role"
                                control={userManagment.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>{t("components.userManagementCard.roleField.label")}</Label>
                                        <FormControl>
                                            <ToggleGroup disabled={isUpdatingRole} className="mt-3 border-[0.1px] border-primary  rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => {
                                                if (value) {
                                                    field.onChange(value)
                                                }
                                            }}>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="user">{t("roles.user")}</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="technician">{t("roles.technician")}</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="admin">{t("roles.admin")}</ToggleGroupItem>
                                                {isOwner && <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="owner">{t("roles.owner")}</ToggleGroupItem>}
                                            </ToggleGroup>
                                        </FormControl>
                                        <FormDescription>
                                            {t("components.userManagementCard.roleField.description")}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="status"
                                control={userManagment.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>{t("components.userManagementCard.statusField.label")}</Label>
                                        <FormControl>
                                            <ToggleGroup disabled={isUpdatingStatus} className="mt-3 border-[0.1px] border-primary  rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => {
                                                if (value) {
                                                    field.onChange(value)
                                                }
                                            }}>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="pending">{t("statuses.pending")}</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="active">{t("statuses.active")}</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="inactive">{t("statuses.inactive")}</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="suspended">{t("statuses.suspended")}</ToggleGroupItem>
                                            </ToggleGroup>
                                        </FormControl>
                                        <FormDescription>
                                            {t("components.userManagementCard.statusField.description")}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
                            {isOwner ? <FormField
                                name="org"
                                control={userManagment.control}
                                render={({ field }) => (
                                    <FormItem className="px-1">
                                        <Label>{t("components.userManagementCard.organizationField.label")}</Label>
                                        <FormControl>
                                            {isLoadingOrgs ? <Skeleton className="w-full px-1 h-10" /> :
                                                <Select onValueChange={field.onChange}
                                                    value={field.value ?? ""}
                                                >
                                                    <SelectTrigger className="">
                                                        <SelectValue placeholder={t("components.userManagementCard.organizationField.placeholder")} />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[1000]">
                                                        <SelectGroup>
                                                            <SelectLabel>{orgsError ? t("components.userManagementCard.organizationField.error") : t("components.userManagementCard.organizationField.label")}</SelectLabel>
                                                            <div className="max-h-52 overflow-y-auto">
                                                                {!orgsError ? organizations?.map(m => (
                                                                    <SelectItem className="capitalize max-w-[320px] truncate" key={m._id} value={m._id}>{m.name}</SelectItem>
                                                                )) : null}
                                                            </div>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>}
                                        </FormControl>
                                    </FormItem>
                                )}
                            /> : null}
                            <FormField
                                name="manager"
                                control={userManagment.control}
                                render={({ field }) => (
                                    <FormItem className="px-1">
                                        <Label>{t("components.userManagementCard.managerField.label")}</Label>
                                        <FormControl>
                                            {isLoadingManagers ? <Skeleton className="w-full px-1 h-10" /> :
                                                <Select onValueChange={field.onChange}
                                                    value={field.value ?? ""}
                                                >
                                                    <SelectTrigger className="">
                                                        <SelectValue placeholder={t("components.userManagementCard.managerField.placeholder")} />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[1000]">
                                                        <SelectGroup>
                                                            <SelectLabel>{managersError ? t("components.userManagementCard.managerField.error") : t("components.userManagementCard.managerField.label")}</SelectLabel>
                                                            <div className="max-h-52 overflow-y-auto">
                                                                {!managersError ? managers?.map(m => (
                                                                    <SelectItem className="capitalize" key={m._id} value={m._id} isbadged={m.role}
                                                                        tranlatedBadge={t(`roles.${m.role}`)}>{m.name}</SelectItem>
                                                                )) : null}
                                                            </div>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>}
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Separator />
                    </CardContent>
                    <CardFooter>
                        <Button
                            disabled={!isDirty || isUpdatingRole || isUpdatingStatus || isUpdatingOrgAndManager}
                            type="submit"
                            className="cursor-pointer w-full px-3 py-1"
                        >
                            {isUpdatingRole || isUpdatingStatus || isUpdatingOrgAndManager ? <Spinner /> : t("components.userManagementCard.updateButton")}
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    )
}

export default UserManagment
