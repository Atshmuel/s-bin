import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputLabel from "@/components/InputLabel";
import { FormProvider, useForm } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { NavLink, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Eye, EyeClosed } from "lucide-react";


function ForgotPassword() {
    const [searchParams, setSearchParams] = useSearchParams();
    const emailParam = searchParams.get('email');

    const [showPassword, setShowPassword] = useState(false);
    const [api, setApi] = useState(null);

    const stepOneForm = useForm({
        defaultValues: {
            email: emailParam || '',
        }
    });
    const stepTwoForm = useForm({
        defaultValues: {
            otp: '',
        }
    });
    const stepThreeForm = useForm({
        defaultValues: {
            password: "",
            confirmPassword: "",
        }
    });


    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4 relative">
            <Carousel className="w-full max-w-md" setApi={setApi}>
                <CarouselContent>
                    <CarouselItem key={1}>
                        <Card className="w-full max-w-md shadow-lg">
                            <CardHeader>
                                <CardTitle >
                                    Forgot Password
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Enter your email address to receive a password reset code.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <FormProvider {...stepOneForm}>
                                    <form onSubmit={stepOneForm.handleSubmit(data => { console.log(data); api.scrollNext() })} className="space-y-6">
                                        <FormField
                                            name="email"
                                            control={stepOneForm.control}
                                            rules={{
                                                required: "Email is required",
                                                pattern: {
                                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Regex בסיסי לכתובת אימייל
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

                                        <Button
                                            type="submit"
                                            className="w-full cursor-pointer"
                                        >
                                            Send Reset Code
                                        </Button>
                                    </form>

                                </FormProvider>
                            </CardContent>
                            <CardFooter>
                                <div className="sm:flex text-center justify-between w-full">
                                    <p className="text-sm text-muted-foreground p-0 m-0">
                                        Remember your password?
                                        <Button variant='link'>
                                            <NavLink to={'/login'}>Sign-in</NavLink>
                                        </Button>
                                    </p>
                                    <p className="text-sm text-muted-foreground p-0 m-0">
                                        Don't have an account?
                                        <Button variant='link'>
                                            <NavLink to={'/signup'}>Sign-up</NavLink>
                                        </Button>
                                    </p>
                                </div>
                            </CardFooter>
                        </Card>
                    </CarouselItem>
                    <CarouselItem key={2}>
                        <Card className="w-full max-w-md shadow-lg">
                            <CardHeader>
                                <CardTitle >
                                    Forgot Password
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    One-Time Password                    </p>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <FormProvider {...stepTwoForm}>
                                    <form onSubmit={stepTwoForm.handleSubmit(data => { console.log(data); api.scrollNext() })} className="space-y-6">
                                        <FormField
                                            name="otp"
                                            control={stepTwoForm.control}
                                            rules={{
                                                required: "One-Time password is required",
                                                validate: {
                                                    isSixDigits: (value) =>
                                                        value.trim().length === 6 || "OTP must be 6 digits",
                                                },
                                            }}
                                            render={({ field }) => (
                                                <FormItem >
                                                    <FormControl >
                                                        <InputOTP pattern={REGEXP_ONLY_DIGITS} maxLength={6} {...field}>
                                                            <InputOTPGroup className="mx-auto">
                                                                <InputOTPSlot className="p-6 text-md" index={0} />
                                                                <InputOTPSlot className="p-6 text-md" index={1} />
                                                                <InputOTPSlot className="p-6 text-md" index={2} />
                                                                <InputOTPSlot className="p-6 text-md" index={3} />
                                                                <InputOTPSlot className="p-6 text-md" index={4} />
                                                                <InputOTPSlot className="p-6 text-md" index={5} />
                                                            </InputOTPGroup>
                                                        </InputOTP>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex flex-col-reverse gap-4">
                                            <Button
                                                type="button"
                                                variant='secondary'
                                                className="cursor-pointer px-3"
                                                onClick={() => api.scrollPrev()}>
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="cursor-pointer px-3"
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                    </form>
                                </FormProvider>
                            </CardContent>
                            <CardFooter className="pb-2">
                                <div className="sm:flex text-center justify-between w-full">
                                    <p className="text-sm text-muted-foreground p-0 m-0">
                                        Remember your password?
                                        <Button variant='link'>
                                            <NavLink to={'/login'}>Sign-in</NavLink>
                                        </Button>
                                    </p>
                                </div>
                            </CardFooter>
                        </Card>
                    </CarouselItem>
                    <CarouselItem key={3}>
                        <Card>
                            <CardHeader>
                                <CardTitle >
                                    Reset Password
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Enter your new password to reset your password.
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <FormProvider {...stepThreeForm}>
                                    <form onSubmit={stepThreeForm.handleSubmit(data => console.log(data))} className="space-y-4">
                                        <FormField
                                            name="password"
                                            control={stepThreeForm.control}
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
                                                        <InputLabel {...field} placeholder=" " type={showPassword ? "text" : "password"} >New Password</InputLabel>
                                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeClosed onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            name="confirmPassword"
                                            control={stepThreeForm.control}
                                            rules={{
                                                required: "Please confirm your password",
                                                validate: (value) =>
                                                    value === stepThreeForm.getValues("password") || "Passwords do not match",
                                            }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="relative">
                                                        <InputLabel {...field} placeholder=" " type={showPassword ? "text" : "password"} >New Confirm Password</InputLabel>
                                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeClosed onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            className="cursor-pointer w-full px-3 py-1"
                                        >
                                            Reset Password
                                        </Button>
                                    </form>
                                </FormProvider>
                            </CardContent>
                            <CardFooter>
                                <div className="sm:flex text-center justify-between w-full">
                                    <p className="text-sm text-muted-foreground p-0 m-0">
                                        Remember your password?
                                        <Button variant='link'>
                                            <NavLink to={'/login'}>Sign-in</NavLink>
                                        </Button>
                                    </p>
                                </div>
                            </CardFooter>
                        </Card>
                    </CarouselItem>
                </CarouselContent>
            </Carousel>
        </div >

    )
}

export default ForgotPassword
