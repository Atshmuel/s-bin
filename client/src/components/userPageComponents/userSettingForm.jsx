import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormProvider, useForm } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";

function UserSettingForm() {
    const userSettings = useForm({
        defaultValues: {
            isDark: true,
            notifications: {
                email: false
            },
            alertLevel: {
                health: "warning",
                level: 55
            },
            language: "en"
        }
    });

    const { isDirty, isValid } = userSettings.formState;

    return (
        <Card className="min-w-[350px] max-w-[450px] min-h-[425px] h-fit">
            <CardHeader className='text-center'>
                <CardTitle className="mb-1">My Preferences</CardTitle>
                <CardDescription>Tailor your preferences for the best experience</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <CardContent className="overflow-scroll max-h-[63vh]">
                <FormProvider {...userSettings}>
                    <form onSubmit={userSettings.handleSubmit(data => console.log(data))} className="space-y-4">
                        <FormField
                            name="theme"
                            control={userSettings.control}
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Application Theme</Label>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="email"
                            control={userSettings.control}
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
                                    <Label>Email Address</Label>
                                    <Input className="pb-2" {...field} placeholder="Full Name" type="text" />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            disabled={(!isDirty || !isValid)}
                            type="submit"
                            className="cursor-pointer w-full px-3 py-1"
                        >
                            Update
                        </Button>
                    </form>
                </FormProvider>
            </CardContent>
        </Card>
    )
}

export default UserSettingForm
