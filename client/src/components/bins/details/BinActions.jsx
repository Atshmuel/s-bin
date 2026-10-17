import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import DeleteBinDialog from "@/components/bins/DeleteBinDialog"
import { useUpdateBinMaintenance, useUpdateBinName } from "@/hooks/bins/useUpdateBin"
import { useMe } from "@/hooks/users/auth/useMe"

const MAX_NAME_LENGTH = 25

// What can be done to the device: rename it and delete it (admins), and add a
// maintenance note (anyone but a regular user). Each card keeps its button at
// the bottom, on the end side.
function BinActions({ bin }) {
    const { t } = useTranslation()
    const { me, isAdmin } = useMe()
    const isUser = me?.role === 'user'

    const [name, setName] = useState(bin.binName)
    const { updateName, isUpdating: isUpdatingName } = useUpdateBinName()
    const trimmedName = name.trim()

    const [note, setNote] = useState('')
    const { updateMaintenance, isUpdating: isSavingNote } = useUpdateBinMaintenance()

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {isAdmin && (
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('pages.binDetails.actions.renameTitle')}</CardTitle>
                        <CardDescription>{t('pages.binDetails.actions.renameDescription', { count: MAX_NAME_LENGTH })}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <Input
                            aria-label={t('pages.binDetails.actions.renameTitle')}
                            value={name}
                            maxLength={MAX_NAME_LENGTH}
                            disabled={isUpdatingName}
                            onChange={(event) => setName(event.target.value.slice(0, MAX_NAME_LENGTH))}
                        />
                    </CardContent>
                    <CardFooter className="mt-auto justify-end">
                        <Button
                            className="cursor-pointer"
                            disabled={!trimmedName || trimmedName === bin.binName || isUpdatingName}
                            onClick={() => updateName({ id: bin._id, name: trimmedName })}
                        >
                            {isUpdatingName ? <Spinner /> : t('save')}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {!isUser && (
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('notes.createTitle')}</CardTitle>
                        <CardDescription>{t('notes.createDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <Textarea
                            placeholder={t('notes.placeholder')}
                            className="min-h-[100px]"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                        />
                    </CardContent>
                    <CardFooter className="mt-auto justify-end">
                        <Button
                            className="cursor-pointer"
                            disabled={!note.trim() || isSavingNote}
                            onClick={() => updateMaintenance({ id: bin._id, notes: note }, { onSuccess: () => setNote('') })}
                        >
                            {isSavingNote ? <Spinner /> : t('save')}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {isAdmin && (
                <Card className="flex flex-col border-destructive/50">
                    <CardHeader>
                        <CardTitle>{t('pages.binDetails.actions.deleteTitle')}</CardTitle>
                        <CardDescription>{t('pages.binDetails.actions.deleteDescription')}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto justify-end">
                        <DeleteBinDialog bin={bin} triggerClassName="cursor-pointer" />
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}

export default BinActions
