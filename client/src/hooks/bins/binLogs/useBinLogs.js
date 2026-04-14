import { getAllLogs } from "@/services/apiLogs";
import { useQuery } from "@tanstack/react-query";


export function useLogs(page = 1, limit = 10, search = "") {
    const { data, isPending: isLoadingLogs, error: logsError } = useQuery({
        queryKey: ['all-logs', page, limit, search],
        queryFn: () => getAllLogs(page, limit, search),
    })


    const allLogs = data?.logs
    const totalLogs = data?.total

    return { allLogs, totalLogs, isLoadingLogs, logsError }
}