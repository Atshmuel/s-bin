import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { useUpdateUserPassword } from "@/hooks/users/useUpdateUser";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/utils/constants";
import { SettingsRow, SettingsSection } from "./SettingsSection";

// What a new password needs, ticked off as it is typed.
const PASSWORD_RULES = Object.freeze([
    { key: "minLength", test: value => value.length >= PASSWORD_MIN_LENGTH },
    { key: "maxLength", test: value => value.length > 0 && value.length <= PASSWORD_MAX_LENGTH },
    { key: "lowercase", test: value => /[a-z]/.test(value) },
    { key: "uppercase", test: value => /[A-Z]/.test(value) },
    { key: "number", test: value => /[0-9]/.test(value) },
    { key: "special", test: value => /[!@#$%^&*]/.test(value) },
]);

const EMPTY = Object.freeze({ oldPassword: "", password: "", confirmPassword: "" });

// Changing one's own password takes the old one; an owner sets another
// user's without it (the only case the server allows for someone else).
function SecuritySection({ id, user, isSelf }) {
    const { t } = useTranslation();
    const { updatePassword, isUpdatingPassword } = useUpdateUserPassword()
    const [isOpen, setIsOpen] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const form = useForm({ mode: "onChange", defaultValues: EMPTY });
    const newPassword = form.watch("password") ?? "";

    function close() {
        form.reset(EMPTY);
        setShowPasswords(false);
        setIsOpen(false);
    }

    const save = form.handleSubmit(data => updatePassword(
        { newPassword: data.password, id: user._id, ...(isSelf ? { oldPassword: data.oldPassword } : {}) },
        { onSuccess: close },
    ))

    const passwordField = (name, label, rules, autoComplete) => (
        <FormField name={name} control={form.control} rules={rules}
            render={({ field }) => (
                <FormItem>
                    <Label htmlFor={`${id}-${name}`}>{label}</Label>
                    <Input {...field} id={`${id}-${name}`} type={showPasswords ? "text" : "password"} dir="ltr"
                        autoComplete={autoComplete} disabled={isUpdatingPassword} />
                    <FormMessage />
                </FormItem>
            )} />
    )

    return (
        <FormProvider {...form}>
            <form onSubmit={save}>
                <SettingsSection id={id} title={t("components.accountPage.security.title")}
                    description={isSelf ? t("components.accountPage.security.description") : t("components.accountPage.security.descriptionOther")}
                    footer={isOpen && (
                        <>
                            <Button type="button" variant="ghost" disabled={isUpdatingPassword} onClick={close}>
                                {t("components.accountPage.cancel")}
                            </Button>
                            <Button type="submit" disabled={!form.formState.isValid || isUpdatingPassword}>
                                {isUpdatingPassword ? <Spinner /> : t("components.accountPage.security.update")}
                            </Button>
                        </>
                    )}>
                    <SettingsRow label={t("components.accountPage.security.password")}
                        description={isSelf ? t("components.accountPage.security.passwordHint") : t("components.accountPage.security.passwordHintOther")}>
                        {!isOpen && (
                            <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
                                {isSelf ? t("components.accountPage.security.change") : t("components.accountPage.security.set")}
                            </Button>
                        )}
                    </SettingsRow>
                    {isOpen && (
                        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
                            <div className="flex flex-col gap-4">
                                {isSelf && passwordField("oldPassword", t("components.accountPage.security.oldPassword"),
                                    { required: t("components.passwordFormCard.oldPasswordRequired") }, "current-password")}
                                {passwordField("password", t("components.accountPage.security.newPassword"), {
                                    required: t("components.passwordFormCard.newPasswordRequired"),
                                    deps: ["confirmPassword"],
                                    validate: value => PASSWORD_RULES.every(rule => rule.test(value)) || t("components.accountPage.security.rulesNotMet"),
                                }, "new-password")}
                                {passwordField("confirmPassword", t("components.accountPage.security.confirmPassword"), {
                                    required: t("components.passwordFormCard.confirmPasswordRequired"),
                                    validate: value => value === form.getValues("password") || t("components.passwordFormCard.passwordsDoNotMatch"),
                                }, "new-password")}
                                <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setShowPasswords(show => !show)}>
                                    {showPasswords ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
                                    {showPasswords ? t("components.accountPage.security.hide") : t("components.accountPage.security.show")}
                                </Button>
                            </div>
                            <div>
                                <p className="mb-2 text-sm font-medium">{t("components.accountPage.security.rulesTitle")}</p>
                                <ul className="flex flex-col gap-1.5 text-sm">
                                    {PASSWORD_RULES.map(rule => {
                                        const met = rule.test(newPassword)
                                        return (
                                            <li key={rule.key} className={`flex items-center gap-2 ${met ? "text-primary" : "text-muted-foreground"}`}>
                                                {met ? <Check className="size-4 shrink-0" /> : <Circle className="size-4 shrink-0" />}
                                                {t(`components.accountPage.security.rules.${rule.key}`, { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}
                </SettingsSection>
            </form>
        </FormProvider>
    )
}

export default SecuritySection
