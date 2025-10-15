import { createContext, useContext, useState } from "react";


const MapContext = createContext(null);

function MapProvider({ children }) {
    const [tile, setTile] = useState("default")
    const [flyEnabled, setFlyEnabled] = useState(true)
    const [isOpen, setIsOpen] = useState(false);


    return (
        <MapContext.Provider value={{ tile, setTile, flyEnabled, setFlyEnabled, isOpen, setIsOpen }}>
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