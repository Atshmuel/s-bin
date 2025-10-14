import { useState } from 'react'
import { Marker, Popup, useMapEvents, } from 'react-leaflet'

export function LocationMarker({ onSetLocation, popupText = "Selected Location" }) {

    const [position, setPosition] = useState(null)
    useMapEvents({
        click(e) {
            setPosition(e.latlng)
            if (onSetLocation) onSetLocation(e.latlng)
        }
    })

    return position ? <Marker position={position}>
        <Popup>{popupText}: {position.lat},{position.lng}</Popup>
    </Marker> : null
}