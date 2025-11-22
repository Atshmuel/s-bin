import { Navigate } from "react-router-dom";
import { toast } from "sonner";

function GlobalErrorFallback({ error }) {
    toast.error(error?.message || "Somthing went wrong")
    return (<Navigate to="/error" replace />)
}

export default GlobalErrorFallback
