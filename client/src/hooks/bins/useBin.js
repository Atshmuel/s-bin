import { getBin } from "@/services/apiBins";
import { useQuery } from "@tanstack/react-query";


// The bin's page data; its logs come page by page from useLogs.
export function useBin(id) {
    const { data, isPending: isLoadingBins, error: binsError } = useQuery({
        queryKey: ['bin', id],
        queryFn: () => getBin({ id }),
        enabled: !!id
    })


    const bin = data?.binData[0]

    return { bin, isLoadingBins, binsError }
}