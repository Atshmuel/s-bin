import { getAllUserBins } from "@/services/apiBins";
import { useQuery } from "@tanstack/react-query";


export function useBins() {
    const { data, isPending: isLoadingBins, error: binsError } = useQuery({
        queryKey: ['all-bins'],
        queryFn: getAllUserBins,
        refetchInterval: 60000,
    })
    if (!data) throw new Error("Bins not found");


    const allBins = data?.binsData
    return { allBins, isLoadingBins, binsError }
}