import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormProvider, useForm } from "react-hook-form";
import { FormControl, FormField, FormItem } from "../ui/form";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { ToggleGroup } from "@radix-ui/react-toggle-group";
import { ToggleGroupItem } from "../ui/toggle-group";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "../ui/select";

function UserSettingForm() {
    const userSettings = useForm({
        defaultValues: {
            isDark: true,
            notifications: {
                email: true
            },
            alertLevel: {
                health: "warning",
                level: 50 //note the value that will be sent to the server is an array, therefore make the convertion in client side before fetching the the server (server will not allow array as level)
            },
            language: "en"
        }
    });

    const { isDirty } = userSettings.formState;

    return (
        <Card className="min-w-[350px] max-w-[400px]  h-fit">
            <CardHeader className='text-center'>
                <CardTitle className="mb-1">Preferences & Settings</CardTitle>
                <CardDescription>Customize your experience by updating your settings</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <CardContent className="overflow-scroll max-h-[63vh]">
                <FormProvider {...userSettings}>
                    <form onSubmit={userSettings.handleSubmit(data => console.log(data))} className="space-y-4">
                        <div>
                            <h2 className='mb-6'>Interface Settings</h2>
                            <div className="space-y-4">
                                <FormField
                                    name="isDark"
                                    control={userSettings.control}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-4 leading-4">
                                            <FormControl>
                                                <Switch className="m-0" checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <Label>Enable Dark Theme</Label>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="language"
                                    control={userSettings.control}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-4 leading-4">
                                            <Label className='min-w-max'>Language Preference</Label>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Appliction Language" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value='he'>עברית</SelectItem>
                                                    <SelectItem value='en'>English</SelectItem>
                                                </SelectContent>

                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Separator />
                        <div>
                            <h2 className='mb-6'>Notifications</h2>
                            <div className="space-y-6">
                                <FormField
                                    name="notifications.email"
                                    control={userSettings.control}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-4">
                                            <FormControl>
                                                <Switch className="m-0" checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <Label>Enable Email Notifications</Label>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="alertLevel.health"
                                    control={userSettings.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Bin Health Alert</Label>
                                            <FormControl>
                                                <ToggleGroup className="mt-3 border-[0.1px] rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => field.onChange(value)}>
                                                    <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="good">Good</ToggleGroupItem>
                                                    <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="warning">Warning</ToggleGroupItem>
                                                    <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="critical">Critical</ToggleGroupItem>
                                                </ToggleGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="alertLevel.level"
                                    control={userSettings.control}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-4">
                                            <FormControl>
                                                <Slider className='w-[55%] m-0' max={100} step={1} value={[field.value]} onValueChange={(value) => field.onChange(value)} />
                                            </FormControl>
                                            <Label>Bins Alert Level</Label>
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>


                        <Separator />

                        <Button
                            disabled={!isDirty}
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
