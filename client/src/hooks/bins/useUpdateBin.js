import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBinMaintenance } from "../../services/apiBins"
import { toast } from "sonner";

export function useUpdateBinMaintenance() {
    const queryClient = useQueryClient();

    const { mutate: updateMaintenance, isPending: isUpdating } = useMutation({
        mutationFn: updateBinMaintenance,
        onSuccess: () => {
            toast.success("Maintenance note saved successfully!");
            queryClient.invalidateQueries({ queryKey: ["bin"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save maintenance note");
        }
    });

    return { updateMaintenance, isUpdating };
}