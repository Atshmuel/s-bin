import { useMapSettings } from '@/hooks/useMapSettings';
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
    // marker group and close its popup. The fly centers the marker together with
    // its popup, so a popup taller than half the map is not cut off at the top.
    function handleClick(event) {
        if (!flyEnabled) return
        const popup = event.target.getPopup()
        // Wait a frame for the popup's content to be drawn, to measure it.
        requestAnimationFrame(() => {
            const zoom = Math.max(map.getZoom(), 14)
            let shift = 0
            if (popup?.isOpen()) {
                // From the popup's top down to the marker's point, in pixels.
                const popupTop = popup.getElement().getBoundingClientRect().top - map.getContainer().getBoundingClientRect().top
                shift = (map.latLngToContainerPoint(position).y - popupTop) / 2
            }
            const center = map.unproject(map.project(position, zoom).subtract([0, shift]), zoom)
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1
            })
        })
    }


    // markerColor travels in the marker's options, for the color of a marker group.
    return <Marker position={position} icon={customIcon} markerColor={color} eventHandlers={{ click: handleClick }} >
        <Popup offset={offset}>{popup}</Popup>
    </Marker>;
}
export default CustomMarker
