import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";



function Login() {

    const [showPassword, setShowPassword] = useState(false);

    return (<div className="flex items-center justify-center min-h-screen bg-background px-4">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
                <CardTitle className="text-center">התחברות</CardTitle>
            </CardHeader>
            <CardContent>
                <Form>
                    <div className="space-y-6">
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                placeholder=" "
                                className="peer"
                            />
                            <Label
                                htmlFor="email"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 cursor-text 
                                    peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base 
                                    peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-sm"
                            >
                                אימייל
                            </Label>
                        </div>
                        <div className="space-y-1">
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder=" "
                                    className="peer"
                                />
                                <Label
                                    htmlFor="password"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 cursor-text 
      peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base 
      peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-sm"
                                >
                                    סיסמה
                                </Label>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-muted-foreground hover:text-primary cursor-pointer text-sm flex items-center gap-1"
                                >
                                    {showPassword ? (
                                        <>
                                            <IoEyeOffOutline size={18} />
                                            הסתר סיסמה
                                        </>
                                    ) : (
                                        <>
                                            <IoEyeOutline size={18} />
                                            הצג סיסמה
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>


                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Checkbox id="remember" />
                                <Label htmlFor="remember">זכור אותי</Label>
                            </div>
                            <button
                                type="button"
                                onClick={() => alert("שכחתי סיסמה נלחץ")}
                                className="text-sm underline text-primary hover:text-primary/80 cursor-pointer"
                            >
                                שכחתי סיסמה
                            </button>
                        </div>

                        <Button
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() => alert("כניסה נלחץ")}
                        >
                            כניסה
                        </Button>
                    </div>
                </Form>
            </CardContent>
            <CardFooter>
                <p className="text-center text-sm text-muted-foreground w-full">
                    אין לך חשבון?{" "}
                    <button
                        type="button"
                        onClick={() => alert("הירשם נלחץ")}
                        className="underline text-primary hover:text-primary/80 cursor-pointer"
                    >
                        הירשם
                    </button>
                </p>
            </CardFooter>
        </Card>
    </div>
    )
}

export default Login
