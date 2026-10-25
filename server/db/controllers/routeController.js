import mongoose from 'mongoose'
import { organizationModel, routeModel, userModel } from '../models/models.js'
import { isLngLat } from '../../utils/geo.js'
import { DEFAULT_COLLECTION_FULLNESS, DEFAULT_TIME_ZONE, OPEN_ROUTE_STATUSES, ROLES, ROUTE_STATUSES, ROUTE_TYPES } from '../../utils/constants.js'
import {
    freeTruckUnit, HEALTH_FILTERS, organizationTimeZone, planRoute, releaseRoute, routeAccessFilter, RouteError, serviceDayOf,
} from '../service/routeService.js'

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const { ObjectId } = mongoose.Types

function sendError(res, error) {
    if (error instanceof RouteError) return res.status(error.status).json({ message: error.message, details: error.details })
    return res.status(500).json({ message: error?.message || 'Something went wrong with the routes.' })
}

// A stop count by a condition on each stop, for the routes table.
function countStops(condition) {
    return { $size: { $filter: { input: '$stops', as: 'stop', cond: condition } } }
}

// The routes of one service day (?day=YYYY-MM-DD, today in the organization's
// time zone by default), narrowed by ?status, ?truckTypeId and ?driverId.
// Owners see every organization's (?org= picks one), admins their own's,
// drivers only theirs. Light rows for a table: counts, not stops.
export async function listRoutes(req, res) {
    const access = routeAccessFilter(req.user)
    if (!access) return res.status(403).json({ message: 'Access denied' })
    const { day, status, truckTypeId, driverId } = req.query
    if (day !== undefined && !DAY_PATTERN.test(day)) return res.status(400).json({ message: 'day must be YYYY-MM-DD.' })
    if (status !== undefined && !ROUTE_STATUSES.includes(status)) {
        return res.status(400).json({ message: `status must be one of ${ROUTE_STATUSES.join(', ')}.` })
    }
    for (const [name, value] of Object.entries({ truckTypeId, driverId })) {
        if (value !== undefined && !ObjectId.isValid(value)) return res.status(400).json({ message: `Invalid ${name}.` })
    }

    try {
        let serviceDay = day
        if (!serviceDay) {
            const orgId = req.user.role === ROLES.OWNER ? req.user.selectedOrg : req.user.org
            const org = orgId ? await organizationModel.findById(orgId, { depot: 1 }).lean() : null
            serviceDay = serviceDayOf(new Date(), org ? await organizationTimeZone(org) : DEFAULT_TIME_ZONE)
        }
        const filter = {
            ...access,
            serviceDay,
            ...(status ? { status } : {}),
            ...(truckTypeId ? { 'truck.truckTypeId': new ObjectId(truckTypeId) } : {}),
            ...(driverId ? { driverId: new ObjectId(driverId) } : {}),
        }
        const routes = await routeModel.aggregate([
            { $match: filter },
            { $sort: { 'truck.name': 1, 'truck.unit': 1, createdAt: 1 } },
            { $lookup: { from: userModel.collection.name, localField: 'driverId', foreignField: '_id', as: 'driver', pipeline: [{ $project: { name: 1 } }] } },
            { $lookup: { from: organizationModel.collection.name, localField: 'orgId', foreignField: '_id', as: 'org', pipeline: [{ $project: { name: 1 } }] } },
            {
                $project: {
                    orgId: 1, orgName: { $first: '$org.name' }, type: 1, source: 1, status: 1, serviceDay: 1, truck: 1,
                    driverId: 1, driverName: { $first: '$driver.name' }, distanceMeters: 1, durationSeconds: 1, loadKg: 1,
                    leftOut: 1, fromDepot: 1, createdAt: 1, startedAt: 1, finishedAt: 1, cancelledAt: 1,
                    stopCount: { $size: '$stops' },
                    doneCount: countStops({ $eq: ['$$stop.status', 'done'] }),
                    skippedCount: countStops({ $eq: ['$$stop.status', 'skipped'] }),
                    confirmedCount: countStops({ $eq: ['$$stop.verification.status', 'confirmed'] }),
                    contradictedCount: countStops({ $eq: ['$$stop.verification.status', 'contradicted'] }),
                },
            },
        ])
        res.status(200).json({ serviceDay, routes })
    } catch (error) {
        sendError(res, error)
    }
}

// One route with its stops, for whoever may see it (see listRoutes).
export async function getRoute(req, res) {
    const access = routeAccessFilter(req.user)
    if (!access) return res.status(403).json({ message: 'Access denied' })
    try {
        const route = await routeModel.findOne({ ...access, _id: req.params.id }).lean()
        if (!route) return res.status(404).json({ message: 'Route not found.' })
        const driver = route.driverId ? await userModel.findById(route.driverId, { name: 1 }).lean() : null
        res.status(200).json({ route: { ...route, driverName: driver?.name ?? null } })
    } catch (error) {
        sendError(res, error)
    }
}

// Plans a route by hand and stores it (owners and admins): the same request as
// the map's route search (type, coordinates, radius, minLevel / maxLevel or
// health, truckTypeId), for the admin's organization or an owner's orgId. The
// route's bins are reserved for it; a collection with a truck takes that
// type's first truck still free today.
export async function createRoute(req, res) {
    const { type = 'collection', coordinates, radius, minLevel, maxLevel, health, orgId, truckTypeId } = req.body
    if (!ROUTE_TYPES.includes(type)) return res.status(400).json({ message: `type must be one of ${ROUTE_TYPES.join(', ')}.` })
    if (!isLngLat(coordinates)) return res.status(400).json({ message: 'coordinates must be [lng, lat].' })
    if (!Number.isFinite(radius) || radius <= 0) return res.status(400).json({ message: 'radius must be a positive number of meters.' })
    const fullnessRange = [minLevel, maxLevel].map((value, i) => value === undefined ? DEFAULT_COLLECTION_FULLNESS[i] : Number(value))
    if (fullnessRange.some(value => !Number.isFinite(value) || value < 0 || value > 100) || fullnessRange[0] > fullnessRange[1]) {
        return res.status(400).json({ message: 'minLevel and maxLevel must be 0-100, minLevel first.' })
    }
    const healthFilter = health ?? (type === 'maintenance' ? 'critical' : 'all')
    if (!HEALTH_FILTERS.includes(healthFilter)) {
        return res.status(400).json({ message: `health must be one of ${HEALTH_FILTERS.join(', ')}.` })
    }
    const planOrgId = req.user.role === ROLES.OWNER ? orgId : req.user.org
    if (!planOrgId || !ObjectId.isValid(planOrgId)) {
        return res.status(400).json({ message: 'A route belongs to an organization: send a valid orgId.' })
    }

    try {
        const org = await organizationModel.findById(planOrgId, { fleet: 1, depot: 1 }).lean()
        if (!org) return res.status(404).json({ message: 'Organization not found.' })
        let truckType = null
        if (type === 'collection' && truckTypeId !== undefined) {
            truckType = (org.fleet ?? []).find(truck => String(truck._id) === String(truckTypeId))
            if (!truckType) return res.status(404).json({ message: 'Truck type not found in the organization.' })
        }
        const result = await planRoute({ org, user: req.user, type, coordinates, radius, fullnessRange, healthFilter, truckType })
        if (result.reason) return res.status(200).json({ route: null, reason: result.reason, total: result.total })
        res.status(201).json({ route: result.toObject() })
    } catch (error) {
        sendError(res, error)
    }
}

// Changes an open route (owners and admins): its driver (a driver of the
// route's organization, or null to unassign), its truck type (one that can
// carry the route's load, taking that type's first truck free that day), or
// cancels it, which frees its bins.
export async function updateRoute(req, res) {
    const access = routeAccessFilter(req.user)
    if (!access) return res.status(403).json({ message: 'Access denied' })
    const { driverId, truckTypeId, status } = req.body
    if (status !== undefined && status !== 'cancelled') return res.status(400).json({ message: "status can only be set to 'cancelled'." })
    if (driverId !== undefined && driverId !== null && !ObjectId.isValid(driverId)) return res.status(400).json({ message: 'Invalid driverId.' })
    if (truckTypeId !== undefined && !ObjectId.isValid(truckTypeId)) return res.status(400).json({ message: 'Invalid truckTypeId.' })
    if (driverId === undefined && truckTypeId === undefined && status === undefined) {
        return res.status(400).json({ message: 'Send driverId, truckTypeId or status.' })
    }

    try {
        const route = await routeModel.findOne({ ...access, _id: req.params.id })
        if (!route) return res.status(404).json({ message: 'Route not found.' })
        if (!OPEN_ROUTE_STATUSES.includes(route.status)) return res.status(409).json({ message: `The route is ${route.status}.` })

        if (status === 'cancelled') {
            route.status = 'cancelled'
            route.cancelledAt = new Date()
            await route.save()
            await releaseRoute(route._id)
            return res.status(200).json({ route: route.toObject() })
        }
        if (driverId !== undefined) {
            if (driverId === null) {
                route.driverId = null
            } else {
                const driver = await userModel.findOne({ _id: driverId, role: ROLES.DRIVER, org: route.orgId, status: 'active' }, { _id: 1 }).lean()
                if (!driver) return res.status(400).json({ message: "The driver must be an active driver of the route's organization." })
                route.driverId = driver._id
            }
        }
        if (truckTypeId !== undefined && String(truckTypeId) !== String(route.truck?.truckTypeId)) {
            if (route.type !== 'collection') return res.status(400).json({ message: 'Only a collection route has a truck.' })
            const org = await organizationModel.findById(route.orgId, { fleet: 1 }).lean()
            const truckType = (org?.fleet ?? []).find(truck => String(truck._id) === String(truckTypeId))
            if (!truckType) return res.status(404).json({ message: 'Truck type not found in the organization.' })
            if ((route.loadKg ?? 0) > truckType.capacityKg) {
                return res.status(400).json({ message: `A ${truckType.name} carries ${truckType.capacityKg} kg; the route has ${route.loadKg} kg.` })
            }
            const unit = await freeTruckUnit(route.orgId, route.serviceDay, truckType)
            if (!unit) return res.status(409).json({ message: `Every ${truckType.name} (${truckType.count}) already has a route that day.` })
            route.truck = { truckTypeId: truckType._id, unit, name: truckType.name, preset: truckType.preset, capacityKg: truckType.capacityKg }
        }
        await route.save()
        res.status(200).json({ route: route.toObject() })
    } catch (error) {
        // The truck got a route meanwhile (one open route per truck a day).
        if (error?.code === 11000) return res.status(409).json({ message: 'That truck got another route meanwhile; try again.' })
        sendError(res, error)
    }
}

// The active drivers of an organization, for assigning routes (owners name
// the organization with ?org=, admins get their own's).
export async function listDrivers(req, res) {
    const orgId = req.user.role === ROLES.OWNER ? req.user.selectedOrg : req.user.org
    if (!orgId) return res.status(400).json({ message: 'Name the organization with ?org=.' })
    try {
        const drivers = await userModel.find({ org: orgId, role: ROLES.DRIVER, status: 'active' }, { name: 1 }).sort({ name: 1 }).lean()
        res.status(200).json({ drivers })
    } catch (error) {
        sendError(res, error)
    }
}
