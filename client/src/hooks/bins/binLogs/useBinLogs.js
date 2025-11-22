import { getAllLogs } from "@/services/apiLogs";
import { useQuery } from "@tanstack/react-query";


export function useLogs() {
    const { data, isPending: isLoadingLogs, error: logsError } = useQuery({
        queryKey: ['all-logs'],
        queryFn: getAllLogs,
    })


    const allLogs = data?.logs

    return { allLogs, isLoadingLogs, logsError }
}