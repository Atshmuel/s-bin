import { deleteBinsBatch } from "@/services/apiBins";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeleteBinBatch() {
    const queryClient = useQueryClient();
    const { mutate: deleteBins, isPending: isDeleting } = useMutation({
        mutationFn: deleteBinsBatch,
        onSuccess: (_, variables) => {
            toast.success(`${variables.binIds.length} Bins deleted successfully`)
            queryClient.invalidateQueries({ queryKey: ["all-bins"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to bins")
        },
    });
    return { deleteBins, isDeleting };
}
