import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { useUpdateUserInfo } from "@/hooks/users/useUpdateUser";
import { SettingsRow, SettingsSection } from "./SettingsSection";

// The name, editable on one's own account or by an owner (the server allows
// no one else), and the email, which is the account's sign-in and never
// changes.
function ProfileSection({ id, user, canEdit }) {
    const { t } = useTranslation();
    const { updateInfo, isUpdatingInfo } = useUpdateUserInfo()
    const form = useForm({ mode: "onChange", defaultValues: { name: user.name } });

    useEffect(() => {
        form.reset({ name: user.name });
    }, [user, form]);

    const { isDirty, isValid } = form.formState;
    const save = form.handleSubmit(data => updateInfo({ name: data.name.trim(), id: user._id }))

    return (
        <FormProvider {...form}>
            <form onSubmit={save}>
                <SettingsSection id={id} title={t("components.accountPage.profile.title")}
                    description={canEdit ? t("components.accountPage.profile.description") : t("components.accountPage.profile.readOnly")}
                    footer={canEdit && isDirty && (
                        <>
                            <Button type="button" variant="ghost" disabled={isUpdatingInfo} onClick={() => form.reset()}>
                                {t("components.accountPage.cancel")}
                            </Button>
                            <Button type="submit" disabled={!isValid || isUpdatingInfo}>
                                {isUpdatingInfo ? <Spinner /> : t("components.accountPage.save")}
                            </Button>
                        </>
                    )}>
                    <SettingsRow label={t("components.accountPage.profile.name")} description={t("components.accountPage.profile.nameHint")}>
                        {canEdit ? (
                            <FormField name="name" control={form.control}
                                rules={{
                                    required: t("components.profileFormCard.requiredName"),
                                    validate: {
                                        notEmpty: value => value.trim().length > 0 || t("components.profileFormCard.emptyNameError"),
                                        fullName: value => value.trim().split(/\s+/).length >= 2 || t("components.profileFormCard.fullNameError"),
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem className="w-full sm:w-80">
                                        <Input {...field} disabled={isUpdatingInfo} aria-label={t("components.accountPage.profile.name")} />
                                        <FormMessage />
                                    </FormItem>
                                )} />
                        ) : <p className="text-sm sm:text-end" dir="auto">{user.name}</p>}
                    </SettingsRow>
                    <SettingsRow label={t("components.accountPage.profile.email")} description={t("components.accountPage.profile.emailHint")}>
                        <p className="text-sm sm:text-end" dir="ltr">{user.email}</p>
                    </SettingsRow>
                </SettingsSection>
            </form>
        </FormProvider>
    )
}

export default ProfileSection
