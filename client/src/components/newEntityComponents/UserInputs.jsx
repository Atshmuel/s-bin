import { FormProvider } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "../ui/form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState } from "react";
import InputLabel from "../InputLabel";
import { Eye, EyeOff } from "lucide-react";

function UserInputs({ form }) {
    const [showPassword, setShowPassword] = useState(false);

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
                            <Input className="pb-2" {...field} placeholder="Full Name" type="text" />
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
                            <Input className="pb-2" {...field} placeholder="Email Address" type="text" />
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
                                <InputLabel {...field} placeholder=" " type={showPassword ? "text" : "password"} >New Password</InputLabel>
                                {showPassword ? <Eye onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" /> : <EyeOff onClick={() => setShowPassword(show => !show)} className="absolute top-3 right-3" />}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

        </FormProvider>
    )
}

export default UserInputs
