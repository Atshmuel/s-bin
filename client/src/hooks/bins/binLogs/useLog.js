import { getLog } from "@/services/apiLogs";
import { useQuery } from "@tanstack/react-query";


export function useLog(id, withBin = true) {
    const { data, isPending: isLoadingLog, error: logError } = useQuery({
        queryKey: ['log', id],
        queryFn: () => getLog({ id, withBin }),
        enabled: !!id
    })



    const log = data?.log

    return { log, isLoadingLog, logError }
}