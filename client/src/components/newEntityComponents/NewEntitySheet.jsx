import { LucidePlus, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"

import { useForm } from "react-hook-form"
import UserInputs from "./UserInputs"
import OrgInputs from './OrgInputs'
import { useCreateUser } from "@/hooks/users/useCreateUser"
import { useMe } from "@/hooks/users/auth/useMe"
import { useCreateOrg } from "@/hooks/organizations/useCreateOrg"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { useAppSide } from "@/contexts/AppSideProvider"

function NewEntitySheet({ isExpanded }) {
    const { create, isCreating } = useCreateUser()
    const { createOrg, isCreatingOrg } = useCreateOrg()

    const [isUserCreation, setIsUserCreation] = useState(true);
    const { me, isOwner } = useMe()
    const { side } = useAppSide()

    const userForm = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'user',
            status: 'active',
            org: !isOwner ? me.org : null,
            manager: null
        }
    })
    const orgForm = useForm({
        defaultValues: {
            name: ""
        }
    })

    function handleReset() {
        userForm.reset({
            name: '',
            email: '',
            password: '',
            role: 'user',
            status: 'active',
            org: !isOwner ? me.org : null,
            manager: null
        });

        orgForm.reset({
            name: ''
        })
    }

    const onSubmitUser = userForm.handleSubmit(async (data) => {
        const res = await create(data)
        if (res) {
            handleReset()
        }
    });

    const onSubmitOrg = orgForm.handleSubmit(async (data) => {
        const res = await createOrg(data)
        if (res) {
            handleReset()
        }
    })


    const ToggleView = () => {
        return isOwner ? <ToggleGroup disabled={isCreating} className="mt-3 border-[0.1px] border-primary rounded-md" type="single" value={isUserCreation ? "user" : "org"} onValueChange={(value) => {
            if (value) {
                setIsUserCreation(v => !v)
            }
        }}>
            <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="user">User</ToggleGroupItem>
            <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="org">Organization</ToggleGroupItem>
        </ToggleGroup> : null
    }

    return (
        <Sheet >
            <SheetTrigger asChild>
                <Button size={isExpanded ? 'default' : 'icon'}>{isExpanded ? <div className="flex  items-center gap-2"><LucidePlus /> <span>Create New entity</span></div> : <LucidePlus />}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
                <SheetHeader>
                    <SheetTitle className={'text-sm  md:text-lg'}>Create New {isUserCreation ? "User" : "Organization"}</SheetTitle>
                    <SheetDescription>Create new application {isUserCreation ? "user" : "organization"}</SheetDescription>
                    <ul className="text-muted-foreground text-sm pt-1 ml-5 list-disc space-y-1">
                        <li>Fill up the inputs</li>
                        <li>Submit to save the changes</li>
                    </ul>
                    <ToggleView />
                </SheetHeader>
                <form id="create-entity-form" className="space-y-4 h-[100%] overflow-auto relative" onSubmit={isUserCreation ? onSubmitUser : onSubmitOrg} >
                    <div className="px-4 relative">
                        <div className=" md:max-h-[68vh]  md:h-[68vh] overflow-auto">
                            {isUserCreation ?
                                <UserInputs form={userForm} isCreating={isCreating} />
                                :
                                <OrgInputs form={orgForm} isCreating={isCreatingOrg} />
                            }
                        </div>
                    </div>
                </form>
                <SheetFooter>
                    <Button form="create-entity-form" type="submit">Create <span className="capitalize">{isUserCreation ? "user" : "organization"}</span></Button>
                    <Button type='button' onClick={handleReset} variant="outline_destructive">Reset</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet >

    )
}

export default NewEntitySheet
