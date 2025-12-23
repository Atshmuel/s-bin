import { FormProvider } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

function OrgInputs({ form, isCreating }) {
    return (
        <FormProvider {...form} >
            <div className="space-y-4">
                <FormField
                    name="name"
                    control={form.control}
                    rules={{
                        required: "Name is required", validate: {
                            notEmpty: (value) =>
                                value.trim().length > 0 || "Name cannot be empty or only spaces",
                            fullName: (value) => {
                                const parts = value.trim().split(/\s+/); // מפרק לפי רווחים
                                return parts.length >= 2 || "Please enter first and last name";
                            },
                            noWhitespace: (value) => {
                                return value.trim() === value || "Name cannot start or end with whitespace";
                            }
                        }
                    }
                    }
                    render={({ field }) => (
                        <FormItem>
                            <Label>Organization Name</Label>
                            <Input disabled={isCreating} className="pb-2" {...field} placeholder="Organization Name" type="text" />
                            <FormMessage />
                        </FormItem>
                    )}
                />

            </div>
        </FormProvider>
    )
}

export default OrgInputs
