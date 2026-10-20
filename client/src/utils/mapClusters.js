import L from "leaflet"
import { STATUS_COLORS } from "./binHelpers"


const STATUS_RANK = {
    [STATUS_COLORS.good]: 0,
    [STATUS_COLORS.warning]: 1,
    [STATUS_COLORS.critical]: 2,
}

// A group's marker: the count of its devices, ringed in the color of its most
// urgent device, so a full bin is not hidden inside a group.
export function createClusterIcon(cluster) {
    const colors = cluster.getAllChildMarkers().map((marker) => marker.options.markerColor)
    const worst = colors.reduce(
        (current, color) => ((STATUS_RANK[color] ?? 0) > (STATUS_RANK[current] ?? 0) ? color : current),
        STATUS_COLORS.good,
    )
    return L.divIcon({
        html: `<div class="bin-cluster" style="--cluster-color: ${worst}">${cluster.getChildCount()}</div>`,
        className: "",
        iconSize: [44, 44],
    })
}
