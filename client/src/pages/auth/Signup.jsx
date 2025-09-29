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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NavLink } from "react-router-dom";
import Terms from "@/components/Terms";


function Signup() {
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
    return (<div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
                <CardTitle >
                    Create an account
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Let's get started. Fill in the details below to create your account.
                </p>
            </CardHeader>
            <CardContent>


                <FormProvider {...form}>

                    <form onSubmit={form.handleSubmit(data => console.log(data))} className="space-y-4">
                        <FormField
                            name="name"
                            control={form.control}
                            rules={{
                                required: "Name is required", validate: {
                                    notEmpty: (value) =>
                                        value.trim().length > 0 || "Name cannot be empty or only spaces",
                                    fullName: (value) => {
                                        const parts = value.trim().split(/\s+/); // מפרק לפי רווחים
                                        return parts.length >= 2 || "Please enter first and last name";
                                    },
                                }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <InputLabel {...field} placeholder=" " type="text">
                                        Full name
                                    </InputLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                minLength: {
                                    value: 8,
                                    message: "Password must be at least 8 characters long",
                                },
                                maxLength: {
                                    value: 30,
                                    message: "Password must not exceed 30 characters",
                                },
                                validate: {
                                    hasLowercase: (value) =>
                                        /[a-z]/.test(value) ||
                                        "Password must include at least one lowercase letter",
                                    hasUppercase: (value) =>
                                        /[A-Z]/.test(value) ||
                                        "Password must include at least one uppercase letter",
                                    hasNumber: (value) =>
                                        /[0-9]/.test(value) ||
                                        "Password must include at least one number",
                                    hasSpecial: (value) =>
                                        /[!@#$%^&*]/.test(value) ||
                                        "Password must include at least one special character (!@#$%^&*)",
                                },
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

                        <FormField
                            name="confirmPassword"
                            control={form.control}
                            rules={{
                                required: "Please confirm your password",
                                validate: (value) =>
                                    value === form.getValues("password") || "Passwords do not match",
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <InputLabel
                                        {...field}
                                        placeholder=" "
                                        type={showPassword ? "text" : "password"}
                                    >
                                        Confirm Password
                                    </InputLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormField
                            name="terms"
                            control={form.control}
                            rules={{
                                required: "Accept terms is required",
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
                                            <Terms title={'Accept terms and conditions'} />
                                        </Label>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <Button
                            type="submit"
                            className="w-full cursor-pointer"
                        >
                            Sign up
                        </Button>
                    </form>

                </FormProvider>

            </CardContent>
            <CardFooter>

                <p className="w-full text-center text-sm text-muted-foreground p-0 m-0">
                    Already have account?
                    <Button variant='link' className={'m-0 px-1'}>
                        <NavLink to={'/login'}>Sign-in</NavLink>
                    </Button>
                </p>

            </CardFooter>
        </Card>
    </div>
    )
}

export default Signup
