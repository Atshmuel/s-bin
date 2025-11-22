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

import { Skeleton } from "../ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useMe } from "@/hooks/users/auth/useMe";

function UserManagment({ user }) {
    const { me } = useMe()
    const userManagment = useForm({
        defaultValues: {
            status: user ? user.status : me.status,
            role: user ? user.role : me.role
        }
    })

    const { isDirty } = userManagment.formState;

    function handleUpdate(data) {
        console.log(data);
    }

    return (
        <Card className="min-w-[330px] max-w-[400px] h-fit">
            <CardHeader className='text-center'>
                <CardTitle className="mb-1">Account managment</CardTitle>
                <CardDescription>Update user's status and role</CardDescription>
            </CardHeader>
            <Separator className="mb-5" />
            <FormProvider {...userManagment}>
                <form onSubmit={userManagment.handleSubmit(handleUpdate)} >
                    <CardContent className="overflow-auto max-h-[calc(100dvh-270px)] space-y-4">
                        <div className="space-y-6">
                            <FormField
                                name="role"
                                control={userManagment.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>User Role</Label>
                                        <FormControl>
                                            <ToggleGroup className="mt-3 border-[0.1px] border-primary  rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => field.onChange(value)}>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="user">User</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="technician">Technician</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="admin">Admin</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="owner">Owner</ToggleGroupItem>
                                            </ToggleGroup>
                                        </FormControl>
                                        <FormDescription>
                                            This field will grant the user additional permissions.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="status"
                                control={userManagment.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>User Status</Label>
                                        <FormControl>
                                            <ToggleGroup className="mt-3 border-[0.1px] border-primary  rounded-md w-fit" type="single" value={field.value} onValueChange={(value) => field.onChange(value)}>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="pending">Pending</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="active">Active</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="inactive">Inactive</ToggleGroupItem>
                                                <ToggleGroupItem className='data-[state=on]:bg-primary data-[state=on]:text-accent' value="suspended">Suspended</ToggleGroupItem>
                                            </ToggleGroup>
                                        </FormControl>
                                        <FormDescription>
                                            Changing this field may result in the user being blocked.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />
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
        </Card>
    )
}

export default UserManagment
