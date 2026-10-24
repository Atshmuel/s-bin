import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { updateFleetSettingsApi } from "@/services/apiOrganizations";
import {
    MAX_TRUCK_CAPACITY_KG, MAX_TRUCK_TYPES, MAX_TRUCKS_PER_TYPE, MIN_TRUCK_CAPACITY_KG, TRUCK_NAME_MAX_LENGTH, TRUCK_PRESETS,
} from "@/utils/constants";
import { truckName } from "@/utils/orgSettings";

const asForm = (fleet, t) => fleet.map(({ _id, name, preset, count, capacityKg }) =>
    ({ _id, name: truckName({ name, preset }, t), preset, count: String(count), capacityKg: String(capacityKg) }))

function isValidType({ name, count, capacityKg }) {
    const trucks = Number(count), kg = Number(capacityKg)
    return name.trim().length > 0 && Number.isInteger(trucks) && trucks >= 1 && trucks <= MAX_TRUCKS_PER_TYPE &&
        Number.isInteger(kg) && kg >= MIN_TRUCK_CAPACITY_KG && kg <= MAX_TRUCK_CAPACITY_KG
}

// The organization's garbage trucks, by type: how many and how much waste one
// carries, which its daily routes are planned for. A type starts from a
// common class (its payload at the low end of the class's range) or custom;
// every value stays editable. The list is saved as a whole.
function OrgFleetSection({ id, organization }) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const saved = asForm(organization.fleet ?? [], t)
    const [fleet, setFleet] = useState(saved)
    const isChanged = JSON.stringify(fleet) !== JSON.stringify(saved)
    const isValid = fleet.every(isValidType)

    const mutation = useMutation({
        mutationFn: updateFleetSettingsApi,
        onSuccess: () => {
            toast.success(t("components.orgSettings.saved"))
            queryClient.invalidateQueries({ queryKey: ["mesh-settings"] })
        },
        onError: (error) => toast.error(error.message),
    })

    const update = (index, field) => (event) =>
        setFleet(current => current.map((type, i) => i === index ? { ...type, [field]: event.target.value } : type))
    const add = (preset) => setFleet(current => [...current, {
        name: preset === "custom" ? "" : t(`components.orgSettingsPage.fleet.presets.${preset}`),
        preset,
        count: "1",
        capacityKg: String(TRUCK_PRESETS[preset]?.capacityKg ?? TRUCK_PRESETS.medium.capacityKg),
    }])
    const remove = (index) => setFleet(current => current.filter((_, i) => i !== index))
    const save = () => mutation.mutate({
        orgId: organization._id,
        fleet: fleet.map(({ _id, name, preset, count, capacityKg }) =>
            ({ _id, name: name.trim(), preset, count: Number(count), capacityKg: Number(capacityKg) })),
    })

    const validTypes = fleet.filter(isValidType)
    const trucks = validTypes.reduce((sum, type) => sum + Number(type.count), 0)
    const tons = validTypes.reduce((sum, type) => sum + Number(type.count) * Number(type.capacityKg), 0) / 1000

    return (
        <SettingsSection id={id} title={t("components.orgSettingsPage.fleet.title")}
            description={fleet.length ? t("components.orgSettingsPage.fleet.total", { trucks, tons: tons.toLocaleString() })
                : t("components.orgSettingsPage.fleet.description")}
            footer={isChanged && (
                <>
                    <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={() => setFleet(saved)}>
                        {t("components.accountPage.cancel")}
                    </Button>
                    <Button type="button" disabled={!isValid || mutation.isPending} onClick={save}>
                        {mutation.isPending ? <Spinner /> : t("components.accountPage.save")}
                    </Button>
                </>
            )}>
            {fleet.map((type, index) => {
                const preset = TRUCK_PRESETS[type.preset]
                return (
                    <div key={type._id ?? `new-${index}`} className="flex flex-col gap-3 px-6 py-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <Input value={type.name} onChange={update(index, "name")} maxLength={TRUCK_NAME_MAX_LENGTH}
                                    placeholder={t("components.orgSettingsPage.fleet.name")} aria-label={t("components.orgSettingsPage.fleet.name")}
                                    className="w-full sm:w-72" disabled={mutation.isPending} />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {preset
                                        ? t("components.orgSettingsPage.fleet.presetHint", { axles: preset.axles, tons: preset.maxTotalTons })
                                        : t("components.orgSettingsPage.fleet.custom")}
                                </p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={mutation.isPending}
                                aria-label={t("components.orgSettingsPage.fleet.remove")}>
                                <Trash2 />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex flex-col gap-1 text-sm">
                                {t("components.orgSettingsPage.fleet.count")}
                                <Input type="number" min={1} max={MAX_TRUCKS_PER_TYPE} step={1} value={type.count}
                                    onChange={update(index, "count")} className="w-28" disabled={mutation.isPending} />
                            </label>
                            <label className="flex flex-col gap-1 text-sm">
                                {t("components.orgSettingsPage.fleet.capacity")}
                                <Input type="number" min={MIN_TRUCK_CAPACITY_KG} max={MAX_TRUCK_CAPACITY_KG} step={100} value={type.capacityKg}
                                    onChange={update(index, "capacityKg")} className="w-36" disabled={mutation.isPending} />
                            </label>
                        </div>
                        {!isValidType(type) && (
                            <p role="alert" className="text-xs text-destructive">
                                {t("components.orgSettingsPage.fleet.invalid", {
                                    max: MAX_TRUCKS_PER_TYPE, minKg: MIN_TRUCK_CAPACITY_KG, maxKg: MAX_TRUCK_CAPACITY_KG,
                                })}
                            </p>
                        )}
                    </div>
                )
            })}
            <div className="px-6 py-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" disabled={fleet.length >= MAX_TRUCK_TYPES || mutation.isPending}>
                            <Plus /> {t("components.orgSettingsPage.fleet.add")}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {Object.entries(TRUCK_PRESETS).map(([key, preset]) => (
                            <DropdownMenuItem key={key} onSelect={() => add(key)}>
                                <div className="flex flex-col">
                                    <span>{t(`components.orgSettingsPage.fleet.presets.${key}`)}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {t("components.orgSettingsPage.fleet.presetOption", {
                                            axles: preset.axles, tons: preset.maxTotalTons, kg: preset.capacityKg.toLocaleString(),
                                        })}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem onSelect={() => add("custom")}>{t("components.orgSettingsPage.fleet.custom")}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </SettingsSection>
    )
}

export default OrgFleetSection
