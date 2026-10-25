import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    createRoute, deleteRoute, finishRoute, getRoute, getRouteDrivers, getRoutes, markStopDone, skipStop, startRoute, undoSkipStop, undoStopDone,
    updateRoute,
} from "@/services/apiRoutes";

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

const DRIVE_ACTIONS = Object.freeze({
    start: startRoute, done: markStopDone, undo: undoStopDone, skip: skipStop, unskip: undoSkipStop, finish: finishRoute,
});

// One driving action ({ action, ...its fields }): the route comes back saved
// and replaces the one shown at once (it keeps the driver's name, which the
// server's reply leaves out).
export function useDriveRoute() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ action, ...fields }) => DRIVE_ACTIONS[action](fields),
        onSuccess: (data) => {
            queryClient.setQueryData(["route", data.route._id], (old) => ({ route: { ...data.route, driverName: old?.route?.driverName ?? null } }));
            queryClient.invalidateQueries({ queryKey: ["routes"] });
        },
        onError: (error) => toast.error(error.message),
    });
}

