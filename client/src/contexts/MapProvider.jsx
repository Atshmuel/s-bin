import { useRef, useState } from "react";
import { MapContext } from "./mapContext";

// Versioned: a plan saved before locations became [lng, lat] is not read back.
const ROUTE_PLAN_KEY = "routePlan:v2";

// The route shown on the map, kept for this tab so a refresh keeps it.
function readRoutePlan() {
    try {
        return JSON.parse(sessionStorage.getItem(ROUTE_PLAN_KEY));
    } catch {
        return null;
    }
}

function MapProvider({ children }) {
    const [tile, setTile] = useState("default")
    const [flyEnabled, setFlyEnabled] = useState(true)
    // Which of the map's corner panels is open ("controls" or "key"); one at
    // a time, so they never cover each other on a small map.
    const [openPanel, setOpenPanel] = useState(null);

    const [map, setMap] = useState(null);
    const mapContainerRef = useRef(null);
    // The planned route: its line, start and end, and stops in order; while
    // set, the map shows only the route.
    const [routePlan, setRoutePlanState] = useState(readRoutePlan);
    const setRoutePlan = (plan) => {
        setRoutePlanState(plan);
        try {
            if (plan) sessionStorage.setItem(ROUTE_PLAN_KEY, JSON.stringify(plan));
            else sessionStorage.removeItem(ROUTE_PLAN_KEY);
        } catch {
            // Kept until the page reloads.
        }
    };

    //must set mapContainerRef to use this method
    const scrollToMap = (location = []) => {
        if (mapContainerRef.current) {
            mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (map && location && location.length === 2) {
            map.flyTo(location, 14);
        }
    };






    return (
        <MapContext.Provider value={{
            tile, setTile, flyEnabled, setFlyEnabled, openPanel,
            setOpenPanel, map, setMap, mapContainerRef, scrollToMap, routePlan, setRoutePlan
        }}>
            {children}
        </MapContext.Provider>
    )
}

export { MapProvider }