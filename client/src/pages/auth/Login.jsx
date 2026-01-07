import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import InputLabel from "@/components/InputLabel";
import { FormProvider, useForm } from "react-hook-form";
import {
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { NavLink, useSearchParams } from "react-router-dom";
import { useLogin } from "@/hooks/users/auth/useLogin";
import { Spinner } from "@/components/ui/spinner";
import { useAppSide } from "@/contexts/AppSideProvider";
import { useTranslation } from "react-i18next";


function Login() {
    const [searchParams] = useSearchParams();
    const { t } = useTranslation()
    const { isRight } = useAppSide();
    const emailParam = searchParams.get('email');

    const { login, isLoggingIn } = useLogin()
    const [showPassword, setShowPassword] = useState(false);


    const form = useForm({
        defaultValues: {
            email: emailParam || "nopro10@gmail.com",
            password: "12345678!Qq"
        }
    });

    function handleLogin(formData) {
        login(formData)
    }
    const emailValue = form.watch("email");


    return (<div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
                <CardTitle >
                    {t('pages.loginPage.title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    {t('pages.loginPage.description')}
                </p>
            </CardHeader>
            <CardContent>


                <FormProvider {...form}>

                    <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                        <FormField
                            name="email"
                            control={form.control}
                            rules={{
                                required: t("newEntity.userInputs.validation.email.required"),
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: t("newEntity.userInputs.validation.email.invalid"),
                                },
                                validate: {
                                    notEmpty: (value) =>
                                        value.trim().length > 0 || t("newEntity.userInputs.validation.email.notEmpty"),
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <InputLabel {...field} placeholder=" " type="email">
                                        {t("newEntity.userInputs.fields.email.label")}
                                    </InputLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="password"
                            control={form.control}
                            rules={{
                                required: t("pages.loginPage.validation.password.required"),
                                minLength: { value: 8, message: t("pages.loginPage.validation.password.minLength") }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <InputLabel {...field} placeholder=" " type={showPassword ? "text" : "password"} >{t("newEntity.userInputs.fields.password.label")}</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)}
                                            className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} /> :
                                            <EyeOff onClick={() => setShowPassword(show => !show)} className={`absolute top-3 ${isRight ? 'right-3' : "left-3"}`} />}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <Button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full cursor-pointer"
                        >
                            {isLoggingIn ? <Spinner /> : t("pages.loginPage.loginButton")}
                        </Button>
                    </form>

                </FormProvider>

            </CardContent>
            <CardFooter>

                <div className={`flex ${isRight ? "flex-row" : "flex-row-reverse"} text-center justify-between w-full`}>

                    <Button variant='link' className={'m-0 p-0'}>

                        <NavLink to={`/forgot-password${emailValue ? '?email=' + emailValue : ""}`}>{t("pages.loginPage.forgotPassword")}</NavLink>

                    </Button>
                    <p className="text-center text-sm text-muted-foreground p-0 m-0">
                        {t("pages.loginPage.noAccount")}
                        <Button variant='link' className={'m-0 px-1'}>
                            <NavLink to={'/signup'}>{t("pages.loginPage.signUp")}</NavLink>
                        </Button>
                    </p>
                </div>
            </CardFooter>
        </Card>
    </div>
    )
}

export default Login
