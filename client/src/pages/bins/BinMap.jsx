import CustomMarker from "@/components/map/CustomMarker"
import MapComponent from "@/components/map/MapComponent"
import { Badge } from "@/components/ui/badge";
import { useBins } from "@/hooks/bins/useBins";
import { getColor, getVariant } from "@/utils/binHelpers";
import Battery from "../../components/bins/Battary"
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSide } from "@/contexts/AppSideProvider";



function BinMap({ zoom, center, legend = true, legendForm = true, binsToUse = null }) {
    const { allBins, isLoadingBins } = useBins()
    const { t } = useTranslation()
    const { isRight } = useAppSide()

    if (!binsToUse) {
        binsToUse = allBins
    }
    const [searchParams] = useSearchParams();

    const binId = searchParams.get("binId")
    const zoomFromUrl = Number(searchParams.get("zoom"))
    const locationFromUrl = searchParams.get("coordinates")?.split(",").map(Number)

    if (binId) {
        binsToUse = binsToUse.filter(bin => bin._id === binId)
    }


    return (
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-300 h-full w-full">
            <MapComponent center={locationFromUrl ? locationFromUrl : center ? center : binsToUse && binsToUse.length ? binsToUse[0].location.coordinates : [32.0853, 34.7818]} zoom={zoomFromUrl ? zoomFromUrl : zoom ?? 11} legend={legend} legendForm={legendForm} isLoading={isLoadingBins} >
                {binsToUse?.map((bin) => (
                    <CustomMarker key={bin._id} position={bin.location.coordinates} color={getColor(bin.status.level)} popup={
                        <div className="flex flex-col space-y-2 text-sm relative">
                            <Badge className={`absolute top-3.5 right-0`} variant={getVariant(bin.status.health)}>{t(`levels.${bin.status.health}`)}</Badge>
                            <div className={`font-bold text-lg flex items-center gap-3 h-11 ${isRight ? "" : "flex-row-reverse"}`}>
                                <span>{bin.binName}</span>
                                <Battery level={bin.status.level} />
                            </div>
                            <div className={`flex flex-col ${isRight ? "" : "text-right"}`}>
                                <p className="!my-1">{t("fillLevel")}: <span className={`font-semibold`}>{bin.status.level}%</span></p>
                                <p className="!my-1">{t("lastUpdated")}: {new Date(bin.status.updatedAt).toLocaleString(isRight ? "en-US" : "he-IL")}</p>
                                <Link to={`/bins/${bin._id}`} className="w-fit self-end underline !text-primary font-extrabold">{t("viewBin")}</Link>
                            </div>
                        </div>
                    } />

                ))}
            </MapComponent>
        </div >
    )
}

export default BinMap
