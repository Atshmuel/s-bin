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
import { useTranslation } from "react-i18next"

function NewEntitySheet({ isExpanded }) {
    const { create, isCreating } = useCreateUser()
    const { createOrg, isCreatingOrg } = useCreateOrg()
    const { t } = useTranslation();


    const [isUserCreation, setIsUserCreation] = useState(true);
    const { me, isOwner } = useMe()
    const { side, isRight } = useAppSide()

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
            <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="user">{t("user")}</ToggleGroupItem>
            <ToggleGroupItem className='w-full data-[state=on]:bg-primary data-[state=on]:text-accent' value="org">{t("organization")}</ToggleGroupItem>
        </ToggleGroup> : null
    }

    return (
        <Sheet >
            <SheetTrigger asChild>
                <Button size={isExpanded ? 'default' : 'icon'}>{isExpanded ? <div className={`flex  items-center ${isRight ? '' : 'flex-row-reverse'} gap-2`}><LucidePlus /> <span>{t("newEntity.title")}</span></div> : <LucidePlus />}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
                <SheetHeader>
                    <SheetTitle className={'text-sm  md:text-lg'}>{isUserCreation ? t("newEntity.createNewUser") : t("newEntity.createNewOrganization")}</SheetTitle>
                    <SheetDescription> {isUserCreation ? t("newEntity.createNewUserSubtitle") : t("newEntity.createNewOrganizationSubtitle")}</SheetDescription>
                    <ul className={`text-muted-foreground text-sm pt-1 ${isRight ? "ml-5" : "mr-5"}  list-disc space-y-1`}>
                        <li>{t("newEntity.fillInputs")}</li>
                        <li>{t("newEntity.submitSheet")}</li>
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
                    <Button form="create-entity-form" type="submit">
                        {isUserCreation ? t("newEntity.createNewUser") : t("newEntity.createNewOrganization")}</Button>
                    <Button type='button' onClick={handleReset} variant="outline_destructive">{t("reset")}</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet >

    )
}

export default NewEntitySheet
