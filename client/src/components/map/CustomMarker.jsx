import { useMapSettings } from '@/contexts/mapContext';
import L from 'leaflet'
import { Trash2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server'
import { Marker, Popup, useMap } from 'react-leaflet';


// shiftX moves the icon sideways in pixels, for devices that share a location.
function CustomMarker({ icon = Trash2, position, popup, offsetX = 0, offsetY = -18, strokeWidth = 2.5, size = 24, color = 'black', shiftX = 0 }) {
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
            iconAnchor: [size / 2 - shiftX, size],
        });
    }, [icon, strokeWidth, size, color, shiftX]);

    const offset = L.point(offsetX + shiftX, offsetY);

    // Fly to the marker without ever zooming out: zooming out would fold it into a
    // marker group and close its popup.
    function handleClick() {
        if (flyEnabled)
            map.flyTo(position, Math.max(map.getZoom(), 14), {
                animate: true,
                duration: 1
            })
    }


    // markerColor travels in the marker's options, for the color of a marker group.
    return <Marker position={position} icon={customIcon} markerColor={color} eventHandlers={{ click: handleClick }} >
        <Popup offset={offset}>{popup}</Popup>
    </Marker>;
}
export default CustomMarker
