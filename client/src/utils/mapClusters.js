import L from "leaflet"
import { Trash2 } from "lucide-react"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { STATUS_COLORS } from "./binHelpers"

// Below street level the map groups nearby devices into one marker with their
// count; from this zoom on every device shows on its own.
export const CLUSTER_UNTIL_ZOOM = 16

const STATUS_RANK = {
    [STATUS_COLORS.good]: 0,
    [STATUS_COLORS.warning]: 1,
    [STATUS_COLORS.critical]: 2,
}

const binIconMarkup = renderToStaticMarkup(createElement(Trash2, { size: 14, strokeWidth: 2.5 }))

// A group's marker: a bin and the count, ringed in the color of its most
// urgent device, so a full bin is not hidden inside a group.
export function createClusterIcon(cluster) {
    const colors = cluster.getAllChildMarkers().map((marker) => marker.options.markerColor)
    const worst = colors.reduce(
        (current, color) => ((STATUS_RANK[color] ?? 0) > (STATUS_RANK[current] ?? 0) ? color : current),
        STATUS_COLORS.good,
    )
    return L.divIcon({
        html: `<div class="bin-cluster" style="--cluster-color: ${worst}">${binIconMarkup}<span>${cluster.getChildCount()}</span></div>`,
        className: "",
        iconSize: [44, 44],
    })
}
