import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormProvider, useForm } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Button } from "../ui/button";
import { useState } from "react";
import InputLabel from "../InputLabel";
import { Eye, EyeClosed } from "lucide-react";

function PasswordForm() {
    const [showPassword, setShowPassword] = useState(false);

    const passwordForm = useForm({
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });

    const { isValid } = passwordForm.formState;

    return (
        <Card className="min-w-[350px] max-w-[450px]  h-fit">
            <CardHeader className='text-center relative'>
                <CardTitle>Update Your Password</CardTitle>
                <CardDescription>Keep your account safe by updating your password</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <CardContent className="overflow-scroll max-h-[63vh]">
                <FormProvider {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(data => console.log(data))} className="space-y-4">
                        <FormField
                            name="password"
                            control={passwordForm.control}
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
                            control={passwordForm.control}
                            rules={{
                                required: "Please confirm your password",
                                validate: (value) =>
                                    value === passwordForm.getValues("password") || "Passwords do not match",
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <InputLabel {...field} placeholder=" " type={showPassword ? "text" : "password"} >Confirm New Password</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeClosed onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            disabled={!isValid}
                            type="submit"
                            className="cursor-pointer w-full px-3 py-1"
                        >
                            Update Password
                        </Button>
                    </form>
                </FormProvider>
            </CardContent>
            <Separator className="mb-4" />
            <CardFooter>
                <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Password requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>At least 8 characters</li>
                        <li>No more than 30 characters</li>
                        <li>At least one lowercase letter (a&ndash;z)</li>
                        <li>At least one uppercase letter (A&ndash;Z)</li>
                        <li>At least one number (0&ndash;9)</li>
                        <li>At least one special character (!@#$%^&*)</li>
                    </ul>
                </div>
            </CardFooter>
        </Card>
    )
}

export default PasswordForm
