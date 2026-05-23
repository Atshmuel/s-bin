import { getAllUserBins, getBinsInUserRadius } from "@/services/apiBins";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";


export function useBins(page = 1, limit = 10, search = "") {
    const [searchParams] = useSearchParams();
    const { t } = useTranslation()

    let { radius, minLevel, maxLevel, health, coordinates } = Object.fromEntries([...searchParams]);

    const { data, isPending: isLoadingBins, error: binsError } = useQuery({
        queryKey: ['all-bins', page, limit, search, { radius, minLevel, maxLevel, health, coordinates }],
        queryFn: () => {
            if (coordinates !== undefined && radius !== undefined && minLevel !== undefined && maxLevel !== undefined && health !== undefined) {

                return getBinsInUserRadius({ coordinates: coordinates.split(',').map(Number), radius: +radius, minLevel: +minLevel, maxLevel: +maxLevel, health })
            } else {
                return getAllUserBins(page, limit, search)
            }
        },
        refetchInterval: 3000,
        refetchIntervalInBackground: true,
    })


    if (!data && binsError) {
        return toast.error(binsError.message || t("toasts.failedLoadBins"));
    }



    const allBins = data?.binsData
    const totalBins = data?.total;
    return { allBins, totalBins, isLoadingBins, binsError }
}