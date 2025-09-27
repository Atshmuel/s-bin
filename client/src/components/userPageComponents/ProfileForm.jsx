import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { FormProvider, useForm } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

function ProfileForm() {
    const profileForm = useForm({
        defaultValues: {
            name: "Shmuel Dev",
            email: "email@gmail.com",
            status: "active",
            role: "owner"
        }
    });

    const { isDirty, isValid } = profileForm.formState;

    const nameValue = profileForm.watch('name') || "";
    const parts = nameValue.trim().split(/\s+/);

    let fallbackName = "NA";
    if (parts.length >= 2) {
        fallbackName = parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    } else if (parts.length === 1 && parts[0]) {
        fallbackName = parts[0][0].toUpperCase();
    }

    return (
        <Card className="min-w-[350px] max-w-[450px] min-h-[425px] h-fit">
            <CardHeader className='text-center flex flex-row justify-between relative'>
                {profileForm.getValues('role').length ? <Badge className="sticky top-14 m-0" variant={profileForm.getValues('role').toLocaleLowerCase()}>{profileForm.getValues('role')}</Badge> : null}
                <div>
                    <Avatar className="mx-auto mb-5 h-20 w-20 text-2xl rounded-full">
                        <AvatarImage src={profileForm.getValues('avatar')} alt={profileForm.watch('name')} />
                        <AvatarFallback>{fallbackName}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="mb-1">My Profile</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                </div>
                {profileForm.getValues('status') ? <Badge className="sticky top-14 m-0" variant={profileForm.getValues('status').toLocaleLowerCase()}>{profileForm.getValues('status')}</Badge> : null}
            </CardHeader>
            <Separator className="mb-5" />
            <CardContent className="overflow-scroll max-h-[63vh]">
                <FormProvider {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(data => console.log(data))} className="space-y-4">
                        <FormField
                            name="name"
                            control={profileForm.control}
                            rules={{
                                required: "Name is required", validate: {
                                    notEmpty: (value) =>
                                        value.trim().length > 0 || "Name cannot be empty or only spaces",
                                    fullName: (value) => {
                                        const parts = value.trim().split(/\s+/); // מפרק לפי רווחים
                                        return parts.length >= 2 || "Please enter first and last name";
                                    },
                                }
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Full Name</Label>
                                    <Input className="pb-2" {...field} placeholder="Full Name" type="text" />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            name="email"
                            control={profileForm.control}
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

export default ProfileForm
