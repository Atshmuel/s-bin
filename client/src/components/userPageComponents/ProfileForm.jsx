import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { FormProvider, useForm } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useMe } from "@/hooks/users/auth/useMe";

function ProfileForm({ user, isAdmin = false }) {

    const { me } = useMe()
    const { name, email, role, status } = user ? user : me
    const profileForm = useForm({
        defaultValues: {
            name,
            email,
            status,
            role,
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
        <Card className="min-w-[330px] max-w-[400px] h-fit">
            <CardHeader className='text-center flex flex-row justify-between relative'>
                {profileForm.getValues('role').length ? <Badge className="sticky top-14 m-0" variant={profileForm.getValues('role').toLocaleLowerCase()}>{profileForm.getValues('role')}</Badge> : null}
                <div>
                    <Avatar className="mx-auto mb-5 h-20 w-20 text-2xl rounded-full">
                        <AvatarImage src={profileForm.getValues('avatar')} alt={profileForm.watch('name')} />
                        <AvatarFallback>{fallbackName}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="mb-1">{isAdmin ? 'User' : 'My'} Profile</CardTitle>
                    <CardDescription>Update {isAdmin ? 'user' : 'your'} personal information</CardDescription>
                </div>
                <Tooltip>
                    <TooltipTrigger className="h-fit sticky top-14 m-0" asChild>
                        {profileForm.getValues('status') ? <Badge variant={profileForm.getValues('status').toLocaleLowerCase()}>{profileForm.getValues('status')}</Badge> : null}
                    </TooltipTrigger>
                    <TooltipContent side='bottom' >
                        <p>This tag shows the user’s status — whether they’re active, suspended, or waiting to be activated.</p>
                    </TooltipContent>
                </Tooltip>
            </CardHeader>
            <Separator className="mb-5" />
            <FormProvider {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(data => console.log(data))} >
                    <CardContent className="overflow-auto max-h-[60vh] space-y-4">
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
                                    <Input className="pb-2" {...field} placeholder="Email Address" type="text" />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Separator />
                    </CardContent>
                    <CardFooter>
                        <Button
                            disabled={(!isDirty || !isValid)}
                            type="submit"
                            className="cursor-pointer w-full px-3 py-1"
                        >
                            Update
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    )
}

export default ProfileForm
