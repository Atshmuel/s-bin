import { LucidePlus, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import UserInputs from "./UserInputs"
import BinsInputs from "./BinsInputs"

function NewEntitySheet({ isExpanded }) {
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
                <Button size={isExpanded ? 'default' : 'icon'}>{isExpanded ? <div className="flex  items-center gap-2"><span>Create New Entity</span><LucidePlus /></div> : <LucidePlus />}</Button>
            </SheetTrigger>
            <SheetContent>
                <form className="space-y-4 " onSubmit={entity === 'bins' ? onSubmitBins : onSubmitUser} >
                    <SheetHeader>
                        <SheetTitle>Create New Entity</SheetTitle>
                        <SheetDescription>Choose the entity you want to create</SheetDescription>
                        <ul className="text-muted-foreground text-sm pt-1 ml-5 list-disc space-y-1">
                            <li>First, Choose the entity you want to create</li>
                            <li>Second, Fill up the inputs</li>
                            <li>Third, Submit to save the changes</li>
                        </ul>
                        <ToggleGroup className="mx-auto mt-5 border-2 rounded-md w-fit" type="single" value={entity} onValueChange={(value) => setEntity(value)}>
                            <ToggleGroupItem className='min-w-20 data-[state=on]:bg-primary data-[state=on]:text-accent' value="user">User</ToggleGroupItem>
                            <ToggleGroupItem className='min-w-20 data-[state=on]:bg-primary data-[state=on]:text-accent' value="bins">Bins</ToggleGroupItem>
                        </ToggleGroup>
                    </SheetHeader>
                    <div className="px-4">
                        {entity === 'user' &&
                            <div className="max-h-[60vh] min-h-[60vh] overflow-auto">
                                <UserInputs form={userForm} />
                            </div>
                        }
                        {entity === 'bins' &&
                            <div className="max-h-[60vh] min-h-[60vh] overflow-auto gap-2 flex relative">
                                <BinsInputs form={binsForm} fields={fields} remove={remove} />
                                <Button
                                    type="button"
                                    size='icon'
                                    className="sticky top-0 right-5 rounded-full size-8"
                                    onClick={() =>
                                        append({ name: "", location: { type: "Point", coordinates: ['', ''] } })
                                    }
                                >
                                    <Plus />
                                </Button>
                            </div>}
                        <SheetFooter>
                            <Button type="submit">Create <span className="capitalize">{entity}</span></Button>
                            {/* <SheetClose asChild> */}
                            <Button type='button' onClick={handleReset} variant="outline_destructive">Reset</Button>
                            {/* </SheetClose> */}
                        </SheetFooter>
                    </div>
                </form>
            </SheetContent>

        </Sheet >

    )
}

export default NewEntitySheet
