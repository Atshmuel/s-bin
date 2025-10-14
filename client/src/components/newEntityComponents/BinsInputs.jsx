import { FormProvider } from "react-hook-form";
import { FormDescription, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import MapComponent from "../map/MapComponent";
import { LocationMarker } from "../map/LocationMarker";
import { MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

function BinsInputs({ form, fields, remove }) {
    const isMobile = useIsMobile()
    return (
        <FormProvider {...form}>
            <div className="space-y-4 w-11/12 md:w-10/12">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col border border-primary/35 p-3 rounded space-y-3">
                        {/* Bin Code */}
                        <FormField
                            name={`bins.${index}.name`}
                            control={form.control}
                            rules={{
                                required: "Bin Name is required",
                                validate: (value) => {
                                    const codes = form.getValues("bins").map((b) => b.name);
                                    const duplicates = codes.filter((c) => c === value);
                                    return duplicates.length === 1 || "Bin Name must be unique";
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Bin Name</Label>
                                    <Input {...field} placeholder="BIN-123456" />
                                    <FormMessage />
                                    <FormDescription>The name will automatically start with “BIN-”.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />


                        <div className={`${isMobile ? '' : 'flex'}  gap-4 justify-end items-end`}>

                            {/* Latitude */}
                            <FormField
                                name={`bins.${index}.location.coordinates.0`}
                                control={form.control}
                                rules={{
                                    required: "Latitude is required",
                                    validate: (value) => {
                                        const num = parseFloat(value);
                                        if (isNaN(num)) return "Must be a number";
                                        if (num < -90 || num > 90) return "Latitude must be between -90 and 90";
                                        return true;
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Latitude</Label>
                                        <Input className="px-1.5" type="number" step="any" {...field} placeholder="32.0853" />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Longitude */}
                            <FormField
                                name={`bins.${index}.location.coordinates.1`}
                                control={form.control}
                                rules={{
                                    required: "Longitude is required",
                                    validate: (value) => {
                                        const num = parseFloat(value);
                                        if (isNaN(num)) return "Must be a number";
                                        if (num < -90 || num > 90) return "Latitude must be between -90 and 90";
                                        return true;
                                    },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Longitude</Label>
                                        <Input className="px-1.5" type="number" step="any" {...field} placeholder="34.7818" />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <AlertDialog >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button className={isMobile ? 'w-full my-2' : ''} size={isMobile ? '' : 'icon'}><MapPin /> {isMobile ? 'Choose Location' : ''}</Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-[999]">
                                        <p>Select Location On The Map</p>
                                    </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent className="z-[9999] w-10/12 sm:w-full" >
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Choose Location</AlertDialogTitle>
                                        <AlertDialogDescription>Choose location on the map to place you bin
                                        </AlertDialogDescription>
                                        {<div className="text-sm">
                                            <p>Currnet Location</p>
                                            <p className="text-muted-foreground">Lat:{form.watch('bins.' + index + '.location.coordinates.0') || ' 00.000'}, Lng:{form.watch('bins.' + index + '.location.coordinates.1') || ' 00.000'}</p>
                                        </div>}
                                    </AlertDialogHeader>
                                    <div className="w-full h-[400px] sm:h-[600px]">
                                        <MapComponent zoom={10} >
                                            <LocationMarker onSetLocation={(latlng) => {
                                                form.setValue('bins.' + index + '.location.coordinates.0', latlng.lat);
                                                form.setValue('bins.' + index + '.location.coordinates.1', latlng.lng);

                                            }} />
                                        </MapComponent>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={
                                            () => {
                                                form.setValue('bins.' + index + '.location.coordinates.0', '');
                                                form.setValue('bins.' + index + '.location.coordinates.1', '');
                                            }
                                        }>Cancel</AlertDialogCancel>
                                        <AlertDialogAction>Submit</AlertDialogAction>

                                    </AlertDialogFooter>
                                </AlertDialogContent>

                            </AlertDialog>
                        </div>

                        <Button
                            disabled={fields.length === 1}
                            type="button"
                            variant="outline_default"
                            onClick={() => remove(index)}
                        >
                            Remove Bin
                        </Button>
                    </div>
                ))}
            </div>
        </FormProvider >
    )
}

export default BinsInputs
