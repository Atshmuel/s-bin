import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function userSettingForm() {
    return (
        <Card className="max-w-[400px]">
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>desc</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                asd
            </CardContent>
            <Separator />

            <CardFooter>
                footer
            </CardFooter>
        </Card>
    )
}

export default userSettingForm
