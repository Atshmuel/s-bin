import { createContext, useContext, useRef, useState } from "react";


const MapContext = createContext(null);

function MapProvider({ children }) {
    const [tile, setTile] = useState("default")
    const [flyEnabled, setFlyEnabled] = useState(true)
    const [isOpen, setIsOpen] = useState(false);

    const [map, setMap] = useState(null);
    const mapContainerRef = useRef(null);

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
            tile, setTile, flyEnabled, setFlyEnabled, isOpen,
            setIsOpen, map, setMap, mapContainerRef, scrollToMap
        }}>
            {children}
        </MapContext.Provider>
    )
}

function useMapSettings() {
    const context = useContext(MapContext);
    if (context === undefined) throw new Error('MapContext was used outside of the provider')
    return context
}

export { MapProvider, useMapSettings }