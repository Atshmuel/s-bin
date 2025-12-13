import { getAllUserBins, getBinsInUserRadius } from "@/services/apiBins";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";


export function useBins() {
    const [searchParams] = useSearchParams();

    let { radius, minLevel, maxLevel, health, coordinates } = Object.fromEntries([...searchParams]);

    const { data, isPending: isLoadingBins, error: binsError } = useQuery({
        queryKey: ['all-bins', { radius, minLevel, maxLevel, health, coordinates }],
        queryFn: () => {
            if (coordinates !== undefined && radius !== undefined && minLevel !== undefined && maxLevel !== undefined && health !== undefined) {

                return getBinsInUserRadius({ coordinates: coordinates.split(',').map(Number), radius: +radius, minLevel: +minLevel, maxLevel: +maxLevel, health })
            } else {
                return getAllUserBins()
            }
        },
        refetchInterval: 60000,
    })


    if (!data && binsError) {
        return toast.error(binsError.message || "Failed to load bins.");
    }



    const allBins = data?.binsData
    return { allBins, isLoadingBins, binsError }
}