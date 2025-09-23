import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeClosed } from "lucide-react";
import InputLabel from "@/components/InputLabel";
import { FormProvider, useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NavLink } from "react-router-dom";


function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
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

                    <form onSubmit={form.handleSubmit(data => console.log(data))} className="space-y-6">
                        <FormField
                            name="name"
                            control={form.control}
                            rules={{ required: "Name is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <InputLabel {...field} placeholder=" " type="email">
                                        Full name
                                    </InputLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="email"
                            control={form.control}
                            rules={{ required: "Email is required" }}
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
                                        {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeClosed onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                                    </div>
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
                                <FormItem className="flex items-center gap-2">
                                    <Checkbox
                                        id="terms"
                                        checked={field.value}
                                        className="m-0"
                                        onCheckedChange={field.onChange}
                                    />
                                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                                        <Button className={"m-0 p-0"} variant={'link'}>
                                            <NavLink to={'/terms'}>Accept terms and conditions</NavLink>
                                        </Button>
                                    </Label>
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
                    <Button variant='link' className={'m-0 px-1'}
                        onClick={() => alert("שכחתי סיסמה נלחץ")}
                    >
                        Sign in
                    </Button>
                </p>

            </CardFooter>
        </Card>
    </div>
    )
}

export default Signup
