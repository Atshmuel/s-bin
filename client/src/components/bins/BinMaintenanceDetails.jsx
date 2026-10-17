import { Info } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import { useAppSide } from "@/contexts/AppSideProvider"

// Service dates, the technician and their last note.
function BinMaintenanceDetails({ maintenance }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()

    return (
        <>
            <div className="flex justify-between">
                <span>{t('components.binCard.maintenance.lastService')}:</span>
                <span>{new Date(maintenance.lastServiceAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
                <span>{t('components.binCard.maintenance.nextService')}:</span>
                <span>{new Date(maintenance.nextServiceAt).toLocaleDateString()}</span>
            </div>
            {maintenance.technicianId ?
                <>
                    <div className="flex justify-between">
                        <span>{t('components.binCard.maintenance.technician')}:</span>
                        <Link to={`/user/${maintenance.technicianId}`}><Button className={"p-0 m-0 h-fit"} variant={'link'}>{t('components.binCard.maintenance.seeProfile')}</Button></Link>
                    </div>
                    {maintenance.notes && <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="">{t('components.binCard.maintenance.techNote')}:</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(maintenance.lastServiceAt).toLocaleString(isRight ? 'en-US' : 'he-IL', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' })}
                            </span>
                        </div>
                        <p className="mt-2 text-sm italic text-muted-foreground">
                            “{maintenance.notes}”
                        </p>
                    </div>
                    }
                </>
                :
                <div className="text-primary flex gap-4 text-base items-center">
                    <Info size={18} />
                    <p>{t('components.binCard.maintenance.notServedYet')}</p>
                </div>
            }
        </>
    )
}

export default BinMaintenanceDetails
