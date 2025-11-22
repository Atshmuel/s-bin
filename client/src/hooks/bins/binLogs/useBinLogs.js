import { getAllLogs } from "@/services/apiLogs";
import { useQuery } from "@tanstack/react-query";


export function useLogs() {
    const { data, isPending: isLoadingLogs, error: logsError } = useQuery({
        queryKey: ['all-logs'],
        queryFn: getAllLogs,
    })
    if (!data) throw new Error("Failed to get logs");

    const allLogs = data?.logs

    return { allLogs, isLoadingLogs, logsError }
}