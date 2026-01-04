import { FormProvider } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";

function OrgInputs({ form, isCreating }) {
    const { t } = useTranslation();
    return (
        <FormProvider {...form} >
            <div className="space-y-4">
                <FormField
                    name="name"
                    control={form.control}
                    rules={{
                        required: t("newEntity.orgInputs.validation.name.required"), validate: {
                            notEmpty: (value) =>
                                value.trim().length > 0 || t("newEntity.orgInputs.validation.name.notEmpty"),
                            noWhitespace: (value) => {
                                return value.trim() === value || t("newEntity.orgInputs.validation.name.noWhitespace");
                            }
                        }
                    }
                    }
                    render={({ field }) => (
                        <FormItem>
                            <Label>{t("newEntity.orgInputs.fields.name.label")}</Label>
                            <Input disabled={isCreating} className="pb-2" {...field} placeholder={t("newEntity.orgInputs.fields.name.placeholder")} type="text" />
                            <FormMessage />
                        </FormItem>
                    )}
                />

            </div>
        </FormProvider>
    )
}

export default OrgInputs
