import { useEffect } from "react";
import { toast } from "sonner";

// Shows a request's error as a toast, once per error and under one id, so a
// retry that fails again replaces the toast instead of stacking another.
// For pages that have nowhere else to show the error.
export function useErrorToast(error, fallbackMessage, id) {
    useEffect(() => {
        if (error) toast.error(error.message || fallbackMessage, { id });
    }, [error, fallbackMessage, id]);
}
