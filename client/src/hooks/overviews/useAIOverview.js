import { useQuery } from '@tanstack/react-query';
import { getAIOverviewStream } from '../../services/apiOverview';
export function useAIOverview(onStreamUpdate) {
    return useQuery({
        queryKey: ['aiOverview'],
        queryFn: ({ signal }) => getAIOverviewStream(onStreamUpdate, signal),
        enabled: true,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
        retry: false,
        refetchOnWindowFocus: false,
    });
}