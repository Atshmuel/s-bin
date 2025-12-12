import { deleteBinById } from "@/services/apiBins";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


export function useDeleteBin() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { mutate: deleteBin, isPending: isDeleting } = useMutation({
        mutationFn: deleteBinById,
        onSuccess: (_, variables) => {
            toast.success('Bin deleted successfully')
            queryClient.invalidateQueries({ queryKey: ["bin", variables.id] });
            navigate("/bins", { replace: true });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete bin")
        },
    });
    return { deleteBin, isDeleting };
}
