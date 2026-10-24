import { useContext } from "react";
import { MapContext } from "@/contexts/mapContext";

export function useMapSettings() {
    const context = useContext(MapContext);
    if (context === undefined) throw new Error('MapContext was used outside of the provider')
    return context
}
