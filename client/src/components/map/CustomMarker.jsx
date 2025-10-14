import { useMapSettings } from '@/contexts/mapContext';
import L from 'leaflet'
import React, { useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server'
import { Marker, Popup, useMap } from 'react-leaflet';


function CustomMarker({ icon, position, popup, offsetX = 0, offsetY = -18, strokeWidth = 2.5, size = 24, color = 'black' }) {
    const { flyEnabled } = useMapSettings()
    const map = useMap();
    const customIcon = useMemo(() => {
        const iconMarkup = renderToStaticMarkup(
            React.createElement(icon, { strokeWidth, size, color })
        );

        return L.divIcon({
            html: iconMarkup,
            className: "lucide-marker",
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
        });
    }, [icon, strokeWidth, size, color]);

    const offset = L.point(offsetX, offsetY);

    function handleClick() {
        if (flyEnabled)
            map.flyTo(position, 14, {
                animate: true,
                duration: 1
            })
    }


    return <Marker position={position} icon={customIcon} eventHandlers={{ click: handleClick }} >
        <Popup offset={offset}>{popup}</Popup>
    </Marker>;
}
export default CustomMarker
