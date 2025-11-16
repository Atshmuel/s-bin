import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormProvider, useForm } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem } from "../ui/form";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { ToggleGroup } from "@radix-ui/react-toggle-group";
import { ToggleGroupItem } from "../ui/toggle-group";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "../ui/select";
import { useUserSettings } from "@/hooks/users/useUserSettings";
import { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle } from "lucide-react";

function UserSettingForm() {
    const { settingsError, isLoadingSettings, settings } = useUserSettings()
    const userSettings = useForm({
        defaultValues: {
            isDark: true,
            notifications: {
                email: true
            },
            alertLevel: {
                health: "warning",
                severity: "warning",
                daysBeforeMaintenance: [60],
                level: [50]
            },
            language: "en"
        }
    });

    useEffect(() => {
        if (settings) {
            userSettings.reset({
                isDark: settings.isDark,
                notifications: { email: settings.notifications.email },
                alertLevel: settings.alertLevel,
                language: settings.language
            });
        }
    }, [settings, userSettings]);

    const { isDirty } = userSettings.formState;


    function handleUpdateSettings(data) {

        //TODO - level and daysBeforeMaintenance value that will be sent to the server is an arrays (each), therefore make the convertion in client side before fetching the the server (server will not allow array as level) and when fetcing to get the settings make sure to convert from number to array of number 
        console.log(data);

    }

    return (
        <Card className="min-w-[330px] max-w-[400px] h-fit">
            <CardHeader className='text-center'>
                <CardTitle className="mb-1">Preferences & Settings</CardTitle>
                <CardDescription>Customize your experience by updating your settings</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            {settingsError ?
                <CardContent>
                    <div className="flex justify-center items-center gap-4">
                        <AlertCircle />
                        <p>Failed to get your settings, please try to reload the page in few seconds</p>
                    </div>
                </CardContent>
                :
                !isLoadingSettings ?
                    <FormProvider {...userSettings}>
                        <form onSubmit={userSettings.handleSubmit(handleUpdateSettings)} >
                            <CardContent className="overflow-auto max-h-[calc(100dvh-270px)] space-y-4">
                                <div>
                                    <h2 className='mb-6'>Interface Settings</h2>
                                    <div className="space-y-4">
                                        <FormField
                                            name="isDark"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center gap-4 leading-4">
                                                        <FormControl>
                                                            <Switch className="m-0" checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <Label>Enable Dark Theme</Label>
                                                    </div>
                                                    <FormDescription>
                                                        This will change the default theme for your interface between light and dark mode.
                                                    </FormDescription>
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
                                                        <ToggleGroup className="mt-3 border-[0.1px] border-primary  rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => field.onChange(value)}>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="good">Good</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="warning">Warning</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="critical">Critical</ToggleGroupItem>
                                                        </ToggleGroup>
                                                    </FormControl>
                                                    <FormDescription>
                                                        Health level of the bin that you want to get notified from.
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            name="alertLevel.level"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem >
                                                    <div className="flex flex-col items-start gap-4">
                                                        <Label>Bins Alert Level: <span>{field.value}</span></Label>
                                                        <FormControl>
                                                            <Slider className='w-[55%] m-0' min={10} max={100} step={5} value={[field.value]} onValueChange={(value) => field.onChange(value)} />
                                                        </FormControl>
                                                    </div>
                                                    <FormDescription>
                                                        The fill percentage of the bin at which you want to receive notifications.
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name="alertLevel.severity"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label>Log Severity Alert</Label>
                                                    <FormControl>
                                                        <ToggleGroup className="mt-3 border-[0.1px] border-primary rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => field.onChange(value)}>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="info">Info</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="warning">Warning</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="critical">Critical</ToggleGroupItem>
                                                        </ToggleGroup>
                                                    </FormControl>
                                                    <FormDescription>
                                                        Bin log severity that you want to get notified from.
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name="alertLevel.daysBeforeMaintenance"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem >
                                                    <div className="flex flex-col items-start gap-4">
                                                        <Label>Maintenance Notification (days): <span>{field.value}</span></Label>
                                                        <FormControl>
                                                            <Slider className='w-[55%] m-0' min={7} max={60} step={1} value={[field.value]} onValueChange={(value) => field.onChange(value)} />
                                                        </FormControl>

                                                    </div>
                                                    <FormDescription>
                                                        Days in advance to receive a maintenance alert.
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <Separator />
                            </CardContent>
                            <CardFooter>
                                <Button
                                    disabled={!isDirty}
                                    type="submit"
                                    className="cursor-pointer w-full px-3 py-1"
                                >
                                    Update
                                </Button>
                            </CardFooter>
                        </form>
                    </FormProvider>
                    :
                    <div className="flex flex-col space-y-10 mb-10">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex justify-center gap-2 w-full">
                                <Skeleton className={'h-5 w-7/12'} />
                                <Skeleton className={'h-5 w-2/12'} />
                            </div>
                        ))}
                    </div>
            }
        </Card>
    )
}

export default UserSettingForm
