import { LucidePlus, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"

import { useForm } from "react-hook-form"
import UserInputs from "./UserInputs"
import { useIsMobile } from "@/hooks/use-mobile"

function NewEntitySheet({ isExpanded }) {
    const isMobile = useIsMobile()
    const userForm = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    })

    function handleReset() {
        userForm.reset({
            name: '',
            email: '',
            password: ''
        });
    }

    const onSubmitUser = userForm.handleSubmit((data) => {
        console.log("User form:", data);
    });

    return (
        <Sheet >
            <SheetTrigger asChild>
                <Button size={isExpanded ? 'default' : 'icon'}>{isExpanded ? <div className="flex  items-center gap-2"><LucidePlus /> <span>Create New User</span></div> : <LucidePlus />}</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className={'text-sm  md:text-lg'}>Create New User</SheetTitle>
                    <SheetDescription>Create new application user</SheetDescription>
                    <ul className="text-muted-foreground text-sm pt-1 ml-5 list-disc space-y-1">
                        <li>Fill up the inputs</li>
                        <li>Submit to save the changes</li>
                    </ul>
                </SheetHeader>
                <form id="create-entity-form" className="space-y-4 h-[100%] overflow-auto relative" onSubmit={onSubmitUser} >
                    <div className="px-4 relative">

                        <div className=" md:max-h-[54vh]  md:h-[54vh] overflow-auto">
                            <UserInputs form={userForm} />
                        </div>


                    </div>
                </form>
                <SheetFooter>
                    <Button form="create-entity-form" type="submit">Create <span className="capitalize">user</span></Button>
                    {/* <SheetClose asChild> */}
                    <Button type='button' onClick={handleReset} variant="outline_destructive">Reset</Button>
                    {/* </SheetClose> */}
                </SheetFooter>

            </SheetContent>

        </Sheet >

    )
}

export default NewEntitySheet
