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
import { useUserSettings } from "@/hooks/users/useUserSettings";
import { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useUpdateUserSettings } from "@/hooks/users/useUpdateUserSettings";
import { Spinner } from "../ui/spinner";
import { useAppSide } from "@/contexts/AppSideProvider";
import { useTranslation } from "react-i18next";
import { useDarkMode } from "@/contexts/darkModelContext";

function UserSettingForm({ user, isAdmin = false, isSelf }) {
    const { toggleSide, isRight } = useAppSide()
    const { t } = useTranslation();

    const { updateSettings, isUpdatingSettings } = useUpdateUserSettings()

    const { settingsError, isLoadingSettings, settings } = useUserSettings(user._id)
    const { isDark, applyDarkMode } = useDarkMode()
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
            appLanguage: "en"
        }
    });

    useEffect(() => {
        if (settings) {
            userSettings.reset({
                isDark: settings.isDark,
                notifications: settings.notifications,
                alertLevel: settings.alertLevel,
                appLanguage: settings.appLanguage
            });
        }
    }, [settings, userSettings]);

    const { isDirty } = userSettings.formState;

    useEffect(() => {
        if (isDirty) return;
        userSettings.setValue("isDark", isDark, {
            shouldDirty: false,
            shouldTouch: false,
        });
    }, [isDark, isDirty, userSettings]);


    function handleUpdateSettings(data) {
        const configToServerModel = {
            ...data,
            alertLevel: {
                ...data.alertLevel,
                level: Array.isArray(data.alertLevel.level) ? data.alertLevel.level[0] : data.alertLevel.level,
                daysBeforeMaintenance: Array.isArray(data.alertLevel.daysBeforeMaintenance) ? data.alertLevel.daysBeforeMaintenance[0] : data.alertLevel.daysBeforeMaintenance
            }
        }


        updateSettings({ configToServerModel, id: user._id, isSelf })
        if (data.appLanguage !== settings.appLanguage && isSelf) {
            toggleSide(data.appLanguage)
        }
        if (data.isDark !== isDark && isSelf) {
            applyDarkMode(data.isDark)
        }

    }

    return (
        <Card className="min-w-[330px] max-w-[400px] h-fit">
            <CardHeader className='text-center'>
                <CardTitle className="mb-1">{t("components.userSettingsCard.title")}</CardTitle>
                <CardDescription>{t("components.userSettingsCard.description", isAdmin ? { entity: t("user") } : { entity: t("your") })}</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            {settingsError ?
                <CardContent>
                    <div className="flex justify-center items-center gap-4">
                        <AlertCircle />
                        <p>{t("components.userSettingsCard.settingsError", isAdmin ? { entity: t("user") } : { entity: t("your") })}</p>
                    </div>
                </CardContent>
                :
                !isLoadingSettings ?
                    <FormProvider {...userSettings}>
                        <form onSubmit={userSettings.handleSubmit(handleUpdateSettings)} >
                            <CardContent className="overflow-auto max-h-[calc(100dvh-270px)] space-y-4">
                                <div>
                                    <h2 className='mb-6'>{t("components.userSettingsCard.sectionOne.title")}</h2>
                                    <div className="space-y-4">
                                        <FormField
                                            name="isDark"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center gap-4 leading-4">
                                                        <FormControl>
                                                            <Switch isRight={isRight} className="m-0" checked={field.value} onCheckedChange={field.onChange} />
                                                        </FormControl>
                                                        <Label>{t("components.userSettingsCard.sectionOne.fieldOne.label")}</Label>
                                                    </div>
                                                    <FormDescription>
                                                        {t("components.userSettingsCard.sectionOne.fieldOne.description", isAdmin ? { entity: t("user") } : { entity: t("your") })}
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name="appLanguage"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label>{t("components.userSettingsCard.sectionOne.fieldTwo.label")}</Label>
                                                    <FormControl>
                                                        <ToggleGroup className="mt-3 border-[0.1px] border-primary  rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => {
                                                            if (value) {
                                                                field.onChange(value)
                                                            }
                                                        }}>


                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="he">עברית</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="en">English</ToggleGroupItem>
                                                        </ToggleGroup>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h2 className='mb-6'>{t("components.userSettingsCard.sectionTwo.title")}</h2>
                                    <div className="space-y-6">
                                        <FormField
                                            name="notifications.email"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem className="flex items-center gap-4">
                                                    <FormControl>
                                                        <Switch isRight={isRight} className="m-0" checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <Label>{t("components.userSettingsCard.sectionTwo.fieldOne.label")}</Label>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name="alertLevel.health"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label>{t("components.userSettingsCard.sectionTwo.fieldTwo.label")}</Label>
                                                    <FormControl>
                                                        <ToggleGroup className={`mt-3 border-[0.1px] border-primary  rounded-md w-fit  ${isRight ? "" : "flex-row-reverse flex"}`} type="single" value={field.value} onValueChange={(value) => {
                                                            if (value) {
                                                                field.onChange(value)
                                                            }
                                                        }}>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="good">{t("levels.good")}</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="warning">{t("levels.warning")}</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="critical">{t("levels.critical")}</ToggleGroupItem>
                                                        </ToggleGroup>
                                                    </FormControl>
                                                    <FormDescription>
                                                        {t("components.userSettingsCard.sectionTwo.fieldTwo.description", isAdmin ? { entity: t("user") } : { entity: t("you") })}
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
                                                        <Label>{t("components.userSettingsCard.sectionTwo.fieldThree.label")}: <span>{field.value}</span></Label>
                                                        <FormControl>
                                                            <Slider className='w-[55%] m-0' min={10} max={100} step={5} value={[field.value]} onValueChange={(value) => field.onChange(value)} />
                                                        </FormControl>
                                                    </div>
                                                    <FormDescription>
                                                        {t("components.userSettingsCard.sectionTwo.fieldThree.description", isAdmin ? { entity: t("user") } : { entity: t("you") })}
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            name="alertLevel.severity"
                                            control={userSettings.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label>{t("components.userSettingsCard.sectionTwo.fieldFour.label")}</Label>
                                                    <FormControl>
                                                        <ToggleGroup className="mt-3 border-[0.1px] border-primary rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => {
                                                            if (value) {
                                                                field.onChange(value)
                                                            }
                                                        }}>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="info">{t("severities.info")}</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="warning">{t("severities.warning")}</ToggleGroupItem>
                                                            <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="critical">{t("severities.critical")}</ToggleGroupItem>
                                                        </ToggleGroup>
                                                    </FormControl>
                                                    <FormDescription>
                                                        {t("components.userSettingsCard.sectionTwo.fieldFour.description", isAdmin ? { entity: t("user") } : { entity: t("you") })}
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
                                                        <Label>{t("components.userSettingsCard.sectionTwo.fieldFive.label")}: <span>{field.value}</span></Label>
                                                        <FormControl>
                                                            <Slider className='w-[55%] m-0' min={7} max={60} step={1} value={[field.value]} onValueChange={(value) => field.onChange(value)} />
                                                        </FormControl>

                                                    </div>
                                                    <FormDescription>
                                                        {t("components.userSettingsCard.sectionTwo.fieldFive.description")}
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
                                    disabled={!isDirty || isUpdatingSettings}
                                    type="submit"
                                    className="cursor-pointer w-full px-3 py-1"
                                >
                                    {isUpdatingSettings ? <Spinner /> : t("components.userSettingsCard.updateButton")}
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

