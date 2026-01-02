import { FormProvider } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState } from "react";
import InputLabel from "../InputLabel";
import { Eye, EyeOff } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { useMe } from "@/hooks/users/auth/useMe";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { useOrgManagers } from "@/hooks/users/useOrgManagers";
import { Skeleton } from "../ui/skeleton";
import { useOrganizations } from "@/hooks/organizations/useOrganizations";

function UserInputs({ form, isCreating }) {
    const { me, isOwner } = useMe();

    const [showPassword, setShowPassword] = useState(false);
    const { data: organizations, isLoadingOrgs, orgsError } = useOrganizations()

    const selectedOrgId = isOwner ? form.watch("org") : me.org;
    const { managers, isLoadingManagers, managersError } = useOrgManagers(selectedOrgId);

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
                            <Label>Full Name</Label>
                            <Input disabled={isCreating} className="pb-2" {...field} placeholder="Full Name" type="text" />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="email"
                    control={form.control}
                    rules={{
                        required: "Email is required",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email address",
                        },
                        validate: {
                            notEmpty: (value) =>
                                value.trim().length > 0 || "Email cannot be empty or only spaces",
                            noWhitespace: (value) => {
                                return value.trim() === value || "Email cannot start or end with whitespace";
                            }
                        },
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <Label>Email Address</Label>
                            <Input disabled={isCreating} className="pb-2" {...field} placeholder="Email Address" type="text" />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="password"
                    control={form.control}
                    rules={{
                        required: "Password is required",
                        minLength: {
                            value: 8,
                            message: "Password must be at least 8 characters long",
                        },
                        maxLength: {
                            value: 30,
                            message: "Password must not exceed 30 characters",
                        },
                        validate: {
                            hasLowercase: (value) =>
                                /[a-z]/.test(value) ||
                                "Password must include at least one lowercase letter",
                            hasUppercase: (value) =>
                                /[A-Z]/.test(value) ||
                                "Password must include at least one uppercase letter",
                            hasNumber: (value) =>
                                /[0-9]/.test(value) ||
                                "Password must include at least one number",
                            hasSpecial: (value) =>
                                /[!@#$%^&*]/.test(value) ||
                                "Password must include at least one special character (!@#$%^&*)",
                        },
                    }}
                    render={({ field }) => (
                        <FormItem>
                            <div className="relative">
                                <InputLabel disabled={isCreating}{...field} placeholder=" " type={showPassword ? "text" : "password"} >New Password</InputLabel>
                                {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeOff onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <Label>User Role</Label>
                            <FormControl>
                                <ToggleGroup disabled={isCreating} className="mt-3 border-[0.1px] border-primary rounded-md" type="single" value={field.value} onValueChange={(value) => {
                                    if (value) {
                                        field.onChange(value)
                                    }
                                }}>
                                    <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="user">User</ToggleGroupItem>
                                    <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="technician">Technician</ToggleGroupItem>
                                    <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="admin">Admin</ToggleGroupItem>
                                    {me.role === 'owner' ? <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="owner">Owner</ToggleGroupItem> : null}
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
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <Label>User Status</Label>
                            <FormControl>
                                <ToggleGroup disabled={isCreating} className="mt-3 border-[0.1px] border-primary rounded-md" type="single" value={field.value} onValueChange={(value) => {
                                    if (value) {
                                        field.onChange(value)
                                    }
                                }}>
                                    <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="pending">Pending</ToggleGroupItem>
                                    <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="active">Active</ToggleGroupItem>
                                    <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="inactive">Inactive</ToggleGroupItem>
                                    <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="suspended">Suspended</ToggleGroupItem>
                                </ToggleGroup>
                            </FormControl>
                            <FormDescription>
                                Changing this field may result in the user being blocked.
                            </FormDescription>
                        </FormItem>
                    )}
                />
                {isOwner ?
                    <FormField
                        name="org"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem className="px-1">
                                <Label>Organzation</Label>
                                <FormControl>
                                    {isLoadingOrgs ? <Skeleton className="w-full px-1 h-10" /> :
                                        <Select onValueChange={field.onChange}
                                            value={field.value ?? ""}
                                        >
                                            <SelectTrigger className="">
                                                <SelectValue placeholder="Select Organzation" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[1000]">
                                                <SelectGroup>
                                                    <SelectLabel>{orgsError ? "Failed to get organizations" : "Organizations"}</SelectLabel>
                                                    <div className="max-h-52 overflow-y-auto">
                                                        {!orgsError ? organizations?.map(m => (
                                                            <SelectItem className="capitalize max-w-[320px] truncate" key={m._id} value={m._id}>{m.name}</SelectItem>
                                                        )) : null}
                                                    </div>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>}
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    : null}
                <FormField
                    name="manager"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem className="px-1">
                            <Label>User's Manager</Label>
                            <FormControl>
                                {isLoadingManagers ? <Skeleton className="w-full px-1 h-10" /> :
                                    <Select onValueChange={field.onChange}
                                        value={field.value ?? ""}
                                    >
                                        <SelectTrigger className="">
                                            <SelectValue placeholder="Select Manager" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1000]">
                                            <SelectGroup>
                                                <SelectLabel>{managersError ? "Failed to get managers" : "Managers"}</SelectLabel>
                                                <div className="max-h-52 overflow-y-auto">
                                                    {!managersError ? managers?.map(m => (
                                                        <SelectItem className="capitalize" key={m._id} value={m._id} isbadged={m.role}>{m.name}</SelectItem>
                                                    )) : null}
                                                </div>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>}
                            </FormControl>
                        </FormItem>
                    )}
                />

            </div>
        </FormProvider>
    )
}

export default UserInputs
