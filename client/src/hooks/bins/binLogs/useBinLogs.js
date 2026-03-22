import { getAllLogs } from "@/services/apiLogs";
import { useQuery } from "@tanstack/react-query";


export function useLogs(page = 1, limit = 10) {
    const { data, isPending: isLoadingLogs, error: logsError } = useQuery({
        queryKey: ['all-logs', page, limit],
        queryFn: () => getAllLogs(page, limit),
    })


    const allLogs = data?.logs
    const totalLogs = data?.total

    return { allLogs, totalLogs, isLoadingLogs, logsError }
}