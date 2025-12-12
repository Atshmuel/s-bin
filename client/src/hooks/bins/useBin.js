import { getBin } from "@/services/apiBins";
import { useQuery } from "@tanstack/react-query";


export function useBin(id, withLogs = true) {
    const { data, isPending: isLoadingBins, error: binsError } = useQuery({
        queryKey: ['bin', id],
        queryFn: () => getBin({ id, withLogs }),
        enabled: !!id
    })


    const bin = data?.binData[0]

    return { bin, isLoadingBins, binsError }
}