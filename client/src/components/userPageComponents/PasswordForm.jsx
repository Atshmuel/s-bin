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

function PasswordForm({ user, isAdmin = false }) {
    const { updatePassword, isUpdatingPassword } = useUpdateUserPassword()
    const [showPassword, setShowPassword] = useState(false);

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
                <CardTitle>Update {isAdmin ? 'User' : 'Your'} Password</CardTitle>
                <CardDescription>Keep your account safe by updating {isAdmin ? 'user' : 'your'} password</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <FormProvider {...passwordForm}>
                <form onSubmit={handleSubmit} >
                    <CardContent className="overflow-auto max-h-[60vh] space-y-4">
                        <FormField
                            name="oldPassword"
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
                                <FormItem
                                    className={isAdmin ? "hidden" : ""}
                                >
                                    <div className="relative">
                                        <InputLabel disabled={isUpdatingPassword} {...field} placeholder=" " type={showPassword ? "text" : "password"} >Old Password</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeOff onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                        <InputLabel disabled={isUpdatingPassword} {...field} placeholder=" " type={showPassword ? "text" : "password"} >New Password</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeOff onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
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
                                        <InputLabel disabled={isUpdatingPassword} {...field} placeholder=" " type={showPassword ? "text" : "password"} >Confirm New Password</InputLabel>
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeOff onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator className="mt-6" />
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
                        <Separator />

                    </CardContent>
                    <CardFooter>
                        <Button
                            disabled={!isValid || isUpdatingPassword}
                            type="submit"
                            className="cursor-pointer w-full px-3 py-1"
                        >
                            {isUpdatingPassword ? <Spinner /> : "Update Password"}
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card >
    )
}

export default PasswordForm
