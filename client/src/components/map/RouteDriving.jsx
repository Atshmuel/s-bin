import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet"
import { Check, CircleStop, Crosshair, Flag, Navigation, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { NAV_ARRIVED_METERS, NAV_FOLLOW_ZOOM } from "@/utils/constants"

const LOCATION_ERRORS = { 1: "locationDenied", 2: "locationUnavailable", 3: "locationTimeout" }

// Opens the way to a place in a navigation app, which gives the turn-by-turn
// directions. On a phone the app starts from the phone's own live position (a
// fixed start would make Google Maps preview the route instead of guiding).
// A computer's browser has no such position, so the driver's is passed as the
// start; Waze's documented link takes no start, so its live map does that.
function navigationLinks([lat, lng], from, onPhone) {
    if (onPhone || !from) {
        return {
            waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
            google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving&dir_action=navigate`,
        }
    }
    return {
        waze: `https://www.waze.com/live-map/directions?from=ll.${from.lat}%2C${from.lng}&to=ll.${lat}%2C${lng}`,
        google: `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${lat},${lng}&travelmode=driving`,
    }
}

// Inside the map while a route is driven: the phone's position, live, as a
// dot with its accuracy, and the map following it until the driver moves the
// map. The screen stays on meanwhile. Reports each position to `onPosition`.
export function DriverPosition({ following, onStopFollowing, onPosition }) {
    const { t } = useTranslation()
    const map = useMap()
    const [position, setPosition] = useState(null)
    const followingRef = useRef(following)
    followingRef.current = following

    useMapEvents({ dragstart: () => onStopFollowing() })

    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error(t("mapLegend.errors.gepError"))
            return
        }
        const watch = navigator.geolocation.watchPosition(
            ({ coords }) => {
                const next = { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }
                setPosition(next)
                onPosition(next)
                if (followingRef.current) map.setView([next.lat, next.lng], Math.max(map.getZoom(), NAV_FOLLOW_ZOOM))
            },
            (error) => toast.error(t(`mapLegend.errors.${LOCATION_ERRORS[error.code] ?? "unknownError"}`)),
            { enableHighAccuracy: true, maximumAge: 5000 },
        )
        return () => navigator.geolocation.clearWatch(watch)
    }, [map, onPosition, t])

    // Keeps the screen on, and asks again when the page comes back to view.
    useEffect(() => {
        let lock = null
        const request = async () => {
            try {
                if (document.visibilityState === "visible") lock = await navigator.wakeLock?.request("screen")
            } catch {
                // The screen may sleep; driving still works.
            }
        }
        request()
        document.addEventListener("visibilitychange", request)
        return () => {
            document.removeEventListener("visibilitychange", request)
            lock?.release().catch(() => { })
        }
    }, [])

    useEffect(() => {
        if (following && position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), NAV_FOLLOW_ZOOM))
    }, [following]) // eslint-disable-line react-hooks/exhaustive-deps -- recentres only when following is turned back on

    if (!position) return null
    return (
        <>
            <Circle center={[position.lat, position.lng]} radius={position.accuracy}
                pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.1 }} />
            <CircleMarker center={[position.lat, position.lng]} radius={8}
                pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }} />
        </>
    )
}

// The bar at the bottom while driving: the next stop (or the way back to the
// depot when all are done), how far it is, navigation to it, and marking it
// done, which is offered first once the driver is there. A stop marked done by
// mistake is reopened with Previous, the last one first. With every stop done,
// Finish clears the route and the map shows the bins again.
export function DrivingBar({ plan, position, following, onFollow, onDone, onUndo, onStop, onFinish, distanceTo }) {
    const { t } = useTranslation()
    const doneIds = plan.doneIds ?? []
    const next = plan.stops.find(stop => !doneIds.includes(stop._id))
    const lastDone = plan.stops.find(stop => stop._id === doneIds.at(-1))
    const target = next ? next.location.coordinates : plan.end ?? plan.start
    const meters = position ? distanceTo([position.lat, position.lng], target) : null
    const arrived = next && meters !== null && meters <= NAV_ARRIVED_METERS
    const links = navigationLinks(target, position, window.matchMedia("(pointer: coarse)").matches)
    const distance = meters === null ? t("mapLegend.drive.locating")
        : meters < 1000 ? t("mapLegend.drive.meters", { count: Math.round(meters) })
            : t("mapLegend.drive.kilometers", { count: (meters / 1000).toFixed(1) })

    return (
        <div className="absolute inset-x-2 bottom-2 z-[1001] flex flex-col gap-2 rounded-lg border bg-background/95 p-3 text-sm shadow-lg backdrop-blur sm:inset-x-auto sm:left-1/2 sm:w-[28rem] sm:-translate-x-1/2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                        {next ? t("mapLegend.drive.next", { order: next.order, count: plan.stops.length }) : t("mapLegend.drive.allDone")}
                    </p>
                    <p className="truncate font-semibold" dir="auto">{next ? next.binName : t("mapLegend.drive.backToDepot")}</p>
                    <p className="text-xs">{distance}</p>
                </div>
                {!following && (
                    <Button type="button" size="sm" variant="outline" onClick={onFollow}>
                        <Crosshair data-icon="inline-start" />{t("mapLegend.drive.follow")}
                    </Button>
                )}
            </div>
            {/* Getting there, then what to do there. */}
            <div className="grid grid-cols-2 gap-2">
                <Button type="button" size="sm" variant="secondary" asChild>
                    <a href={links.waze} target="_blank" rel="noreferrer"><Navigation data-icon="inline-start" />Waze</a>
                </Button>
                <Button type="button" size="sm" variant="secondary" asChild>
                    <a href={links.google} target="_blank" rel="noreferrer"><Navigation data-icon="inline-start" />Google Maps</a>
                </Button>
            </div>
            <div className="flex items-center gap-2 border-t pt-2">
                {lastDone && (
                    <Button type="button" size="sm" variant="outline" onClick={onUndo}
                        aria-label={t("mapLegend.drive.previousHint", { order: lastDone.order })}
                        title={t("mapLegend.drive.previousHint", { order: lastDone.order })}>
                        <Undo2 data-icon="inline-start" /><span className="max-sm:sr-only">{t("mapLegend.drive.previous")}</span>
                    </Button>
                )}
                {next ? (
                    <>
                        <Button type="button" size="sm" className="flex-1" variant={arrived ? "default" : "secondary"} onClick={() => onDone(next._id)}>
                            <Check data-icon="inline-start" />{t("mapLegend.drive.done")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="ms-auto text-destructive hover:text-destructive" onClick={onStop}>
                            <CircleStop data-icon="inline-start" />{t("mapLegend.drive.stop")}
                        </Button>
                    </>
                ) : (
                    <Button type="button" size="sm" className="flex-1" onClick={onFinish}>
                        <Flag data-icon="inline-start" />{t("mapLegend.drive.finish")}
                    </Button>
                )}
            </div>
        </div>
    )
}
