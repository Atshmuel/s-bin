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


function Login() {
    const [searchParams] = useSearchParams();
    const emailParam = searchParams.get('email');

    const { login, isLoggingIn } = useLogin()
    const [showPassword, setShowPassword] = useState(false);


    const form = useForm({
        defaultValues: {
            email: emailParam || "",
            password: ""
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
                    Login to your account
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Enter your email below to login to your account
                </p>
            </CardHeader>
            <CardContent>


                <FormProvider {...form}>

                    <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
                        <FormField
                            name="email"
                            control={form.control}
                            rules={{
                                required: "Email is required",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Invalid email address",
                                },
                                validate: {
                                    notEmpty: (value) =>
                                        value.trim().length > 0 || "Email cannot be empty or only spaces",
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <InputLabel {...field} placeholder=" " type="email">
                                        Email address
                                    </InputLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="password"
                            control={form.control}
                            rules={{
                                required: "Password is required",
                                minLength: { value: 6, message: "Password must be at least 6 characters" }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <InputLabel {...field} placeholder=" " type={showPassword ? "text" : "password"} >Password</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeOff onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
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
                            {isLoggingIn ? <Spinner /> : "Login"}
                        </Button>
                    </form>

                </FormProvider>

            </CardContent>
            <CardFooter>

                <div className="sm:flex text-center justify-between w-full">

                    <Button variant='link' className={'m-0 p-0'}>

                        <NavLink to={`/forgot-password${emailValue ? '?email=' + emailValue : ""}`}>Forgot your password?</NavLink>

                    </Button>
                    <p className="text-center text-sm text-muted-foreground p-0 m-0">
                        Don't have an account?
                        <Button variant='link' className={'m-0 px-1'}>
                            <NavLink to={'/signup'}>Sign-up</NavLink>
                        </Button>
                    </p>
                </div>
            </CardFooter>
        </Card>
    </div>
    )
}

export default Login
