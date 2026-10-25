import { Navigate } from "react-router-dom";
import { useMe } from "@/hooks/users/auth/useMe";

// The first page: a driver's routes, everyone else's dashboard.
function HomeRedirect() {
    const { isDriver } = useMe();
    return <Navigate replace to={isDriver ? "/routes" : "/dashboard"} />;
}

export default HomeRedirect;
