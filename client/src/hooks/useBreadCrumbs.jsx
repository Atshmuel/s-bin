import { useLocation } from "react-router-dom";


const breadcrumbMap = {
    "dashboard": "Dashboard",
};

export function useBreadcrumbsData() {
    const { pathname } = useLocation();
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, idx) => {
        const path = "/" + segments.slice(0, idx + 1).join("/");
        return {
            label: breadcrumbMap[seg] ?? seg,
            path,
        };
    });
}
