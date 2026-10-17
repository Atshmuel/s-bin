import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import { useAppSide } from "@/contexts/AppSideProvider"

// The bins whose last report this device relayed over the mesh.
function ConnectedLeaves({ leaves }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()

    if (!leaves.length) {
        return <p className="text-muted-foreground">{t('components.binCard.noConnectedLeaves')}</p>
    }

    return leaves.map(leaf => (
        <div key={leaf._id} className="flex justify-between items-center gap-2">
            <Link to={`/bins/${leaf._id}`} className="truncate"><Button className={"p-0 m-0 h-fit"} variant={'link'}>{leaf.binName}</Button></Link>
            <span className="text-xs text-muted-foreground text-end">
                <span dir="ltr">{leaf.status?.connection?.rssi ?? '-'} dBm</span> · {t('components.binCard.hops')}: {leaf.status?.connection?.hops ?? '-'}
                <br />
                {new Date(leaf.status?.updatedAt).toLocaleString(isRight ? 'en-US' : 'he-IL', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
        </div>
    ))
}

export default ConnectedLeaves
