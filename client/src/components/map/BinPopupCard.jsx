import { useAppSide } from "@/contexts/AppSideProvider"
import { getVariant } from "@/utils/binHelpers"
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next"
import Battery from "../../components/bins/Battary"
import { Link } from "react-router-dom";
import { MobileTooltip } from "../ui/mobile-tooltip";


function BinPopupCard({ bin }) {
    const { t } = useTranslation()
    const { isRight } = useAppSide()
    return (
        <div className="flex flex-col space-y-2 text-sm relative">
            <Badge className={`absolute top-3.5 right-0`} variant={getVariant(bin.status.health)}>{t(`levels.${bin.status.health}`)}</Badge>
            <div className={`font-bold text-lg flex items-center gap-3 h-11 ${isRight ? "" : "flex-row-reverse"}`}>
                <MobileTooltip content={bin.binName} className={'z-999'}>
                    <span className="max-w-30 truncate">{bin.binName}</span>
                </MobileTooltip>
                <Battery level={bin.status.battery} />
            </div>
            <div className={`flex flex-col ${isRight ? "" : "text-right"}`}>
                <p className="!my-1">{t("fillLevel")}: <span className={`font-semibold`}>{bin.status.level}%</span></p>
                <p className="!my-1">{t("lastUpdated")}: {new Date(bin.status.updatedAt).toLocaleString(isRight ? "en-US" : "he-IL")}</p>
                <Link to={`/bins/${bin._id}`} className="w-fit self-end underline !text-primary font-extrabold">{t("viewBin")}</Link>
            </div>
        </div>
    )
}

export default BinPopupCard
