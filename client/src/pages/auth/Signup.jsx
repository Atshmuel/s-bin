import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, PartyPopper } from "lucide-react";
import InputLabel from "@/components/InputLabel";
import { FormProvider, useForm } from "react-hook-form";
import {
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NavLink } from "react-router-dom";
import Terms from "@/components/Terms";
import { useSignup } from "@/hooks/users/auth/useSignup";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useAppSide } from "@/contexts/AppSideProvider";
import { useTranslation } from "react-i18next";


function Signup() {
    const { signup, isSigningup } = useSignup()
    const { isRight } = useAppSide()
    const { t } = useTranslation()
    const [successfullyCreated, setSuccessfullyCreated] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            terms: false
        }
    });

    async function handleSignup(data) {
        try {
            const signedUp = await signup(data)
            if (signedUp) {
                setSuccessfullyCreated(true)
                toast.success(t("pages.signupPage.toasts.success"))
            }
        } catch (error) {
            if (error?.message) {
                if (error.message.includes('duplicate')) {
                    toast.error(t("pages.signupPage.toasts.errorDuplicate"))
                } else {
                    toast.error(t("pages.signupPage.toasts.errorGeneric"))
                }
            }

        }
    }

    return (<div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
                <CardTitle >
                    {successfullyCreated ? t("pages.signupPage.titles.accountCreated") : t("pages.signupPage.titles.createAccount")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    {successfullyCreated ? t("pages.signupPage.titles.activateSubtitle") : t("pages.signupPage.titles.createSubtitle")}
                </p>
            </CardHeader>
            <CardContent>

                {successfullyCreated ? <div className="flex gap-2"><PartyPopper /> {t("pages.signupPage.titles.verifyBody")}</div> :
                    <FormProvider {...form}>

                        <form onSubmit={form.handleSubmit((data) => handleSignup(data))} className="space-y-4">
                            <FormField
                                name="name"
                                control={form.control}
                                rules={{
                                    required: t("pages.signupPage.validation.nameRequired"), validate: {
                                        notEmpty: (value) =>
                                            value.trim().length > 0 || t("pages.signupPage.validation.nameNotEmpty"),
                                        fullName: (value) => {
                                            const parts = value.trim().split(/\s+/); // מפרק לפי רווחים
                                            return parts.length >= 2 || t("pages.signupPage.validation.fullNameCheck");
                                        },
                                    }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <InputLabel {...field} placeholder=" " type="text">
                                            {t("pages.signupPage.form.fullName")}
                                        </InputLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="email"
                                control={form.control}
                                rules={{
                                    required: t("pages.signupPage.validation.emailRequired"),
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: t("pages.signupPage.validation.emailInvalid"),
                                    },
                                    validate: {
                                        notEmpty: (value) =>
                                            value.trim().length > 0 || t("pages.signupPage.validation.emailNotEmpty"),
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <InputLabel {...field} placeholder=" " type="email">
                                            {t("pages.signupPage.form.email")}
                                        </InputLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="password"
                                control={form.control}
                                rules={{
                                    required: t("pages.signupPage.validation.passwordRequired"),
                                    minLength: {
                                        value: 8,
                                        message: t("pages.signupPage.validation.passwordMin"),
                                    },
                                    maxLength: {
                                        value: 30,
                                        message: t("pages.signupPage.validation.passwordMax"),
                                    },
                                    validate: {
                                        hasLowercase: (value) =>
                                            /[a-z]/.test(value) ||
                                            t("pages.signupPage.validation.passwordLower"),
                                        hasUppercase: (value) =>
                                            /[A-Z]/.test(value) ||
                                            t("pages.signupPage.validation.passwordUpper"),
                                        hasNumber: (value) =>
                                            /[0-9]/.test(value) ||
                                            t("pages.signupPage.validation.passwordNumber"),
                                        hasSpecial: (value) =>
                                            /[!@#$%^&*]/.test(value) ||
                                            t("pages.signupPage.validation.passwordSpecial"),
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="relative">
                                            <InputLabel {...field} placeholder=" " type={showPassword ? "text" : "password"} >{t("pages.signupPage.form.password")}</InputLabel>
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
                                control={form.control}
                                rules={{
                                    required: t("pages.signupPage.validation.confirmPasswordRequired"),
                                    validate: (value) =>
                                        value === form.getValues("password") || t("pages.signupPage.validation.passwordsNoMatch"),
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <InputLabel
                                            {...field}
                                            placeholder=" "
                                            type={showPassword ? "text" : "password"}
                                        >
                                            {t("pages.signupPage.form.confirmPassword")}
                                        </InputLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                name="terms"
                                control={form.control}
                                rules={{
                                    required: t("pages.signupPage.validation.termsRequired"),
                                }}
                                render={({ field }) => (
                                    <FormItem >
                                        <div className="flex items-center gap-2">

                                            <Checkbox
                                                id="terms"
                                                checked={field.value}
                                                className="m-0"
                                                onCheckedChange={field.onChange}
                                            />
                                            <Label htmlFor="terms" className="text-sm text-muted-foreground">
                                                <Terms title={t("pages.signupPage.form.acceptTerms")} />
                                            </Label>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={isSigningup}
                            >
                                {isSigningup ? <Spinner /> : t("pages.signupPage.form.submitButton")}
                            </Button>
                        </form>

                    </FormProvider>
                }
            </CardContent>
            <CardFooter>

                {successfullyCreated ? null : <p className="w-full text-center text-sm text-muted-foreground p-0 m-0">
                    {t("pages.signupPage.footer.alreadyHaveAccount")}
                    <Button variant='link' className={'m-0 px-1'}>
                        <NavLink to={'/login'}>{t("pages.signupPage.footer.login")}</NavLink>
                    </Button>
                </p>}

            </CardFooter>
        </Card>
    </div>
    )
}

export default Signup
