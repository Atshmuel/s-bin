import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRoute, deleteRoute, getRoute, getRouteDrivers, getRoutes, updateRoute } from "@/services/apiRoutes";

export function useRoutes({ day, org } = {}) {
    const { data, isPending: isLoadingRoutes, error: routesError } = useQuery({
        queryKey: ["routes", { day, org }],
        queryFn: () => getRoutes({ day, org }),
    });
    return { routes: data?.routes, serviceDay: data?.serviceDay, isLoadingRoutes, routesError };
}

export function useRoute(id) {
    const { data, isPending: isLoadingRoute, error: routeError } = useQuery({
        queryKey: ["route", id],
        queryFn: () => getRoute({ id }),
        enabled: Boolean(id),
    });
    return { route: data?.route, isLoadingRoute, routeError };
}

export function useRouteDrivers(org, { enabled = true } = {}) {
    const { data, isPending: isLoadingDrivers } = useQuery({
        queryKey: ["route-drivers", org ?? null],
        queryFn: () => getRouteDrivers({ org }),
        enabled,
        staleTime: 60 * 1000,
    });
    return { drivers: data?.drivers ?? [], isLoadingDrivers };
}

// Changing or planning a route refreshes the lists and the route itself.
function useRouteMutation(mutationFn, onSuccess) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["routes"] });
            if (data?.route?._id) queryClient.invalidateQueries({ queryKey: ["route", data.route._id] });
            onSuccess?.(data, variables);
        },
        onError: (error) => toast.error(error.message),
    });
}

export function useUpdateRoute(onSuccess) {
    return useRouteMutation(updateRoute, onSuccess);
}

export function useCreateRoute(onSuccess) {
    return useRouteMutation(createRoute, onSuccess);
}

export function useDeleteRoute(onSuccess) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRoute,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["routes"] });
            queryClient.removeQueries({ queryKey: ["route", variables.id] });
            onSuccess?.(data, variables);
        },
        onError: (error) => toast.error(error.message),
    });
}
