import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormProvider, useForm } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Button } from "../ui/button";
import { useState } from "react";
import InputLabel from "../InputLabel";
import { Eye, EyeOff } from "lucide-react";
import { useUpdateUserPassword } from "@/hooks/users/useUpdateUser";
import { Spinner } from "../ui/spinner";
import { useAppSide } from "@/contexts/AppSideProvider";
import { useTranslation } from "react-i18next";

function PasswordForm({ user, isAdmin = false }) {
    const { updatePassword, isUpdatingPassword } = useUpdateUserPassword()
    const { t } = useTranslation();

    const [showPassword, setShowPassword] = useState(false);
    const { isRight } = useAppSide();

    const passwordForm = useForm({
        defaultValues: {
            oldPassword: isAdmin ? '12345678!Qq' : '',
            password: '',
            confirmPassword: ''
        }
    });

    const handleSubmit = passwordForm.handleSubmit(data => {
        const res = updatePassword({ oldPassword: data.oldPassword, newPassword: data.password, id: user._id })
        if (res) {
            passwordForm.reset({
                oldPassword: isAdmin ? '12345678!Qq' : '',
                password: '',
                confirmPassword: ''
            })
        }
    })



    const { isValid } = passwordForm.formState;

    return (
        <Card className="flex-[1_1_400px] min-w-[330px] max-w-[400px] h-fit">
            <CardHeader className='text-center'>
                <CardTitle>{t(isAdmin ? "components.passwordFormCard.updateUserPassword" : "components.passwordFormCard.updateYourPassword")}</CardTitle>
                <CardDescription>
                    {t("components.passwordFormCard.description", { entity: isAdmin ? "user's" : 'your' })}
                </CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <FormProvider {...passwordForm}>
                <form onSubmit={handleSubmit} >
                    <CardContent className="overflow-auto max-h-[60vh] space-y-4">
                        <FormField
                            name="oldPassword"
                            control={passwordForm.control}
                            rules={{
                                required: t("components.passwordFormCard.oldPasswordRequired"),
                                minLength: {
                                    value: 8,
                                    message: t("components.passwordFormCard.minLength"),
                                },
                                maxLength: {
                                    value: 30,
                                    message: t("components.passwordFormCard.maxLength"),
                                },
                                validate: {
                                    hasLowercase: (value) =>
                                        /[a-z]/.test(value) ||
                                        t("components.passwordFormCard.hasLowercase"),
                                    hasUppercase: (value) =>
                                        /[A-Z]/.test(value) ||
                                        t("components.passwordFormCard.hasUppercase"),
                                    hasNumber: (value) =>
                                        /[0-9]/.test(value) ||
                                        t("components.passwordFormCard.hasNumber"),
                                    hasSpecial: (value) =>
                                        /[!@#$%^&*]/.test(value) ||
                                        t("components.passwordFormCard.hasSpecial"),
                                },
                            }}
                            render={({ field }) => (
                                <FormItem
                                    className={isAdmin ? "hidden" : ""}
                                >
                                    <div className="relative">
                                        <InputLabel disabled={isUpdatingPassword} {...field} placeholder=" " type={showPassword ? "text" : "password"} >{t("components.passwordFormCard.oldPassword")}</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)}
                                            className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} /> :
                                            <EyeOff onClick={() => setShowPassword(show => !show)} className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} />}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="password"
                            control={passwordForm.control}
                            rules={{
                                required: t("components.passwordFormCard.newPasswordRequired"),
                                minLength: {
                                    value: 8,
                                    message: t("components.passwordFormCard.minLength"),
                                },
                                maxLength: {
                                    value: 30,
                                    message: t("components.passwordFormCard.maxLength"),
                                },
                                validate: {
                                    hasLowercase: (value) =>
                                        /[a-z]/.test(value) ||
                                        t("components.passwordFormCard.hasLowercase"),
                                    hasUppercase: (value) =>
                                        /[A-Z]/.test(value) ||
                                        t("components.passwordFormCard.hasUppercase"),
                                    hasNumber: (value) =>
                                        /[0-9]/.test(value) ||
                                        t("components.passwordFormCard.hasNumber"),
                                    hasSpecial: (value) =>
                                        /[!@#$%^&*]/.test(value) ||
                                        t("components.passwordFormCard.hasSpecial"),
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <InputLabel disabled={isUpdatingPassword} {...field} placeholder=" " type={showPassword ? "text" : "password"} >{t("components.passwordFormCard.newPassword")}</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)}
                                            className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} /> :
                                            <EyeOff onClick={() => setShowPassword(show => !show)} className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} />}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="confirmPassword"
                            control={passwordForm.control}
                            rules={{
                                required: t("components.passwordFormCard.confirmPasswordRequired"),
                                validate: (value) =>
                                    value === passwordForm.getValues("password") || t("components.passwordFormCard.passwordsDoNotMatch"),
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <InputLabel disabled={isUpdatingPassword} {...field} placeholder=" " type={showPassword ? "text" : "password"} >{t("components.passwordFormCard.confirmPassword")}</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)}
                                            className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} /> :
                                            <EyeOff onClick={() => setShowPassword(show => !show)} className={`absolute top-3 ${isRight ? 'right-3' : "left-3 "}`} />}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator className="mt-6" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">{t("components.passwordFormCard.requirementsTitle")}</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>{t("components.passwordFormCard.minLength")}</li>
                                <li>{t("components.passwordFormCard.maxLength")}</li>
                                <li>{t("components.passwordFormCard.lowercase")}</li>
                                <li>{t("components.passwordFormCard.uppercase")}</li>
                                <li>{t("components.passwordFormCard.number")}</li>
                                <li>{t("components.passwordFormCard.special")}</li>
                            </ul>
                        </div>
                        <Separator />

                    </CardContent>
                    <CardFooter>
                        <Button
                            disabled={!isValid || isUpdatingPassword}
                            type="submit"
                            className="cursor-pointer w-full px-3 py-1"
                        >
                            {isUpdatingPassword ? <Spinner /> : t("components.passwordFormCard.button")}
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card >
    )
}

export default PasswordForm
