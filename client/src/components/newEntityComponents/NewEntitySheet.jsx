import { LucidePlus, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import UserInputs from "./UserInputs"
import BinsInputs from "./BinsInputs"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"

function NewEntitySheet({ isExpanded }) {
    const isMobile = useIsMobile()
    const [entity, setEntity] = useState('bins')
    const userForm = useForm({
        defaultValues: {
            name: '',
            email: '',
            passwrod: ''
        }
    })

    const binsForm = useForm({
        defaultValues: {
            bins: [{
                name: "", location: {
                    type: 'Point',
                    coordinates: ['', '']
                }
            }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: binsForm.control,
        name: "bins",
    });

    const onSubmitUser = userForm.handleSubmit((data) => {
        console.log("User form:", data);
    });

    const onSubmitBins = binsForm.handleSubmit((data) => {
        console.log("Bins form:", data);
    });

    function handleReset() {
        userForm.reset({
            name: '',
            email: '',
            passwrod: ''
        });
        binsForm.reset({
            bins: [{
                name: "",
                location: { type: 'Point', coordinates: ['', ''] }
            }]
        });
    }

    return (
        <Sheet >
            <SheetTrigger asChild>
                <Button size={isExpanded ? 'default' : 'icon'}>{isExpanded ? <div className="flex  items-center gap-2"><LucidePlus /> <span>Create New Entity</span></div> : <LucidePlus />}</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className={'text-sm  md:text-lg'}>Create New {entity === 'bins' ? 'Bin' : "User"}</SheetTitle>
                    <SheetDescription>Choose the entity you want to create (User/Bins)</SheetDescription>
                    <ul className="text-muted-foreground text-sm pt-1 ml-5 list-disc space-y-1">
                        <li>Choose the entity you want to create</li>
                        <li>Fill up the inputs</li>
                        <li>Submit to save the changes</li>
                    </ul>
                    <ToggleGroup className="mx-auto mt-2  md:mt-5 border-2 rounded-md w-fit" type="single" value={entity} onValueChange={(value) => setEntity(value)}>
                        <ToggleGroupItem className='min-w-20 data-[state=on]:bg-primary data-[state=on]:text-accent' value="user">User</ToggleGroupItem>
                        <ToggleGroupItem className='min-w-20 data-[state=on]:bg-primary data-[state=on]:text-accent' value="bins">Bins</ToggleGroupItem>
                    </ToggleGroup>
                </SheetHeader>
                <form id="create-entity-form" className="space-y-4 h-[100%] overflow-auto relative" onSubmit={entity === 'bins' ? onSubmitBins : onSubmitUser} >
                    <div className="px-4 relative">
                        {entity === 'user' &&
                            <div className=" md:max-h-[54vh]  md:h-[54vh] overflow-auto">
                                <UserInputs form={userForm} />
                            </div>
                        }
                        {entity === 'bins' &&
                            <div className={`space-y-4  md:flex  md:space-y-0  overflow-auto gap-2 pl-4 relative`}>
                                <BinsInputs form={binsForm} fields={fields} remove={remove} />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            size={isMobile ? '' : 'icon'}
                                            className={'w-11/12 md:fixed right-8 md:rounded-full md:size-8'}
                                            onClick={() =>
                                                append({ name: "", location: { type: "Point", coordinates: ['', ''] } })
                                            }
                                        >
                                            <Plus /> {isMobile ? 'Add More Bins' : ''}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-999"   >
                                        Add More Bin Inputs (You can add multiple bins at once)
                                    </TooltipContent>
                                </Tooltip>
                            </div>}
                    </div>
                </form>
                <SheetFooter>
                    <Button form="create-entity-form" type="submit">Create <span className="capitalize">{entity}</span></Button>
                    {/* <SheetClose asChild> */}
                    <Button type='button' onClick={handleReset} variant="outline_destructive">Reset</Button>
                    {/* </SheetClose> */}
                </SheetFooter>

            </SheetContent>

        </Sheet >

    )
}

export default NewEntitySheet
