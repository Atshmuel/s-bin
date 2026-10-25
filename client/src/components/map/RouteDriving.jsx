import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet"
import { Check, CircleStop, Crosshair, Flag, Navigation, Shuffle, SkipForward, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MobileTooltip } from "@/components/ui/mobile-tooltip"
import { NAV_ARRIVED_METERS, NAV_FOLLOW_ZOOM } from "@/utils/constants"
import { distanceMeters, toLatLng } from "@/utils/geo"
import { loadedKg } from "@/utils/routes"

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

// The bar at the bottom while driving a stored route: the next stop to do (or
// the way back to the depot when none is left), how far it is, navigation to
// it, and marking it done, offered first once the driver is there; Skip for a
// bin that cannot be collected, Previous to undo the last Done or Skip (a stop
// marked or skipped by mistake), and "Re-order from here" for the stops still
// to do. With none left, Finish.
// `busy` disables the actions while one is saved.
export function DrivingBar({ route, position, following, busy, onFollow, onDone, onUndo, onSkip, onReorder, onStop, onFinish }) {
    const { t } = useTranslation()
    const next = route.stops.find(stop => stop.status === "planned")
    // The stop settled last, done or skipped, for Previous.
    const settledAt = stop => new Date(stop.status === "done" ? stop.claim?.at : stop.skippedAt).getTime() || 0
    const lastSettled = route.stops.filter(stop => stop.status !== "planned").sort((a, b) => settledAt(b) - settledAt(a))[0]
    const count = (status) => route.stops.filter(stop => stop.status === status).length
    const [doneCount, skippedCount, leftCount] = [count("done"), count("skipped"), count("planned")]
    const target = toLatLng(next ? next.location : route.end ?? route.start)
    const meters = position ? distanceMeters([position.lng, position.lat], next ? next.location : route.end ?? route.start) : null
    const arrived = next && meters !== null && meters <= NAV_ARRIVED_METERS
    const links = navigationLinks(target, position, window.matchMedia("(pointer: coarse)").matches)
    const distance = meters === null ? t("mapLegend.drive.locating")
        : meters < 1000 ? t("mapLegend.drive.meters", { count: Math.round(meters) })
            : t("mapLegend.drive.kilometers", { count: (meters / 1000).toFixed(1) })

    return (
        <div className="absolute inset-x-2 bottom-2 z-[1001] flex flex-col gap-2 rounded-lg border bg-background/95 p-3 text-sm shadow-lg backdrop-blur sm:inset-x-auto sm:left-1/2 sm:w-[30rem] sm:-translate-x-1/2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                        {next ? t("mapLegend.drive.next", { order: next.order, count: route.stops.length }) : t("mapLegend.drive.allDone")}
                    </p>
                    {/* The stop numbers are the driving order: done and skipped stops come before the next one. */}
                    <p className="text-xs text-muted-foreground">
                        {[t("mapLegend.drive.doneCount", { count: doneCount }),
                            ...(skippedCount ? [t("mapLegend.drive.skippedCount", { count: skippedCount })] : []),
                            t("mapLegend.drive.leftCount", { count: leftCount })].join(" · ")}
                    </p>
                    {route.truck?.capacityKg && route.loadKg != null && (
                        <p className="text-xs text-muted-foreground">
                            {t("mapLegend.drive.inTruck", { load: loadedKg(route).toLocaleString(), capacity: route.truck.capacityKg.toLocaleString() })}
                        </p>
                    )}
                    <p className="truncate font-semibold" dir="auto">{next ? next.binName : t("mapLegend.drive.backToDepot")}</p>
                    <p className="text-xs">{distance}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                    {!following && (
                        <MobileTooltip content={t("mapLegend.drive.followHint")}>
                            <Button type="button" size="sm" variant="outline" onClick={onFollow}>
                                <Crosshair data-icon="inline-start" />{t("mapLegend.drive.follow")}
                            </Button>
                        </MobileTooltip>
                    )}
                    {next && position && (
                        <MobileTooltip content={t("mapLegend.drive.reorderHint")}>
                            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onReorder}>
                                <Shuffle data-icon="inline-start" />{t("mapLegend.drive.reorder")}
                            </Button>
                        </MobileTooltip>
                    )}
                </div>
            </div>
            {/* Getting there, then what to do there. Each button's text says it; the
                tooltip (hover, or a tap on a phone) says what it will do. */}
            <div className="grid grid-cols-2 gap-2">
                <MobileTooltip content={t("mapLegend.drive.navigateHint", { app: "Waze" })}>
                    <Button type="button" size="sm" variant="secondary" asChild>
                        <a href={links.waze} target="_blank" rel="noreferrer"><Navigation data-icon="inline-start" />Waze</a>
                    </Button>
                </MobileTooltip>
                <MobileTooltip content={t("mapLegend.drive.navigateHint", { app: "Google Maps" })}>
                    <Button type="button" size="sm" variant="secondary" asChild>
                        <a href={links.google} target="_blank" rel="noreferrer"><Navigation data-icon="inline-start" />Google Maps</a>
                    </Button>
                </MobileTooltip>
            </div>
            {/* Done is the widest, for the thumb; the rest share the row under it. */}
            <div className="flex flex-col gap-2 border-t pt-2">
                {next ? (
                    <MobileTooltip content={t("mapLegend.drive.doneHint")}>
                        <Button type="button" className="w-full" variant={arrived ? "default" : "secondary"} disabled={busy} onClick={() => onDone(next)}>
                            <Check data-icon="inline-start" />{t("mapLegend.drive.done")}
                        </Button>
                    </MobileTooltip>
                ) : (
                    <MobileTooltip content={t("mapLegend.drive.finishHint")}>
                        <Button type="button" className="w-full" disabled={busy} onClick={onFinish}>
                            <Flag data-icon="inline-start" />{t("mapLegend.drive.finish")}
                        </Button>
                    </MobileTooltip>
                )}
                <div className="grid grid-cols-3 gap-2">
                    <MobileTooltip content={lastSettled
                        ? t(`mapLegend.drive.${lastSettled.status === "done" ? "previousHint" : "previousSkippedHint"}`, { order: lastSettled.order })
                        : t("mapLegend.drive.previousNone")}>
                        {/* A disabled button takes no pointer events: the span still shows the tooltip. */}
                        <span className="flex">
                            <Button type="button" size="sm" variant="outline" className="w-full" disabled={busy || !lastSettled} onClick={() => onUndo(lastSettled)}>
                                <Undo2 data-icon="inline-start" />{t("mapLegend.drive.previous")}
                            </Button>
                        </span>
                    </MobileTooltip>
                    <MobileTooltip content={t("mapLegend.drive.skipHint")}>
                        <span className="flex">
                            <Button type="button" size="sm" variant="outline" className="w-full" disabled={busy || !next} onClick={() => onSkip(next)}>
                                <SkipForward data-icon="inline-start" />{t("mapLegend.drive.skip")}
                            </Button>
                        </span>
                    </MobileTooltip>
                    <MobileTooltip content={t("mapLegend.drive.stopHint")}>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onStop}>
                            <CircleStop data-icon="inline-start" />{t("mapLegend.drive.stopShort")}
                        </Button>
                    </MobileTooltip>
                </div>
            </div>
        </div>
    )
}
