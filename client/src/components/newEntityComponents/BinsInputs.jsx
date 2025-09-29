import { FormProvider } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

function BinsInputs({ form, fields, remove }) {

    return (
        <FormProvider {...form}>
            <div className="space-y-4 w-10/12">
                {fields.map((field, index) => (
                    <div key={field.id} className="border border-primary/35 p-3 rounded space-y-3">
                        {/* Bin Code */}
                        <FormField
                            name={`bins.${index}.name`}
                            control={form.control}
                            rules={{
                                required: "Bin Code is required",
                                validate: (value) => {
                                    const codes = form.getValues("bins").map((b) => b.name);
                                    const duplicates = codes.filter((c) => c === value);
                                    return duplicates.length === 1 || "Bin Code must be unique";
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Bin Code</Label>
                                    <Input {...field} placeholder="BIN-123456" />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Latitude */}
                        <FormField
                            name={`bins.${index}.location.coordinates.0`}
                            control={form.control}
                            rules={{
                                required: "Latitude is required",
                                validate: (value) =>
                                    !isNaN(parseFloat(value)) || "Must be a number",
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Latitude</Label>
                                    <Input type="number" step="any" {...field} placeholder="32.0853" />
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
                                validate: (value) =>
                                    !isNaN(parseFloat(value)) || "Must be a number",
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Longitude</Label>
                                    <Input type="number" step="any" {...field} placeholder="34.7818" />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="button"
                            variant="outline_default"
                            onClick={() => remove(index)}
                        >
                            Remove Bin
                        </Button>
                    </div>
                ))}

                {/* <Button
                    type="button"
                    onClick={() =>
                        append({ name: "", location: { type: "Point", coordinates: ['', ''] } })
                    }
                >
                    Add Bin
                </Button> */}
            </div>
        </FormProvider>
    )
}

export default BinsInputs
