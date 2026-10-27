import mongoose from "mongoose";
import {
    CLUSTER_ZOOM_RANGE, DEFAULT_CLUSTER_UNTIL_ZOOM, DEFAULT_MESH_AWAKE_WINDOW_SECONDS, DEFAULT_REPORT_INTERVAL_MINUTES, DEFAULT_ROUTE_PLANNING_HOUR, DEFAULT_REPORT_START_HOUR,
    DEPOT_ADDRESS_MAX_LENGTH, MAX_MESH_AWAKE_WINDOW_SECONDS, MAX_TRUCK_CAPACITY_KG, MAX_TRUCK_TYPES,
    MAX_TRUCKS_PER_TYPE, MIN_TRUCK_CAPACITY_KG, REPORT_INTERVAL_OPTIONS_MINUTES, TRUCK_NAME_MAX_LENGTH, TRUCK_PRESETS,
} from "../../utils/constants.js";
import { isLngLat } from "../../utils/geo.js";

// A type of truck the organization runs: how many, and how much waste one
// carries (kg); `preset` is the class it started from, or custom.
const truckTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: TRUCK_NAME_MAX_LENGTH },
    preset: { type: String, enum: [...Object.keys(TRUCK_PRESETS), "custom"], default: "custom" },
    count: {
        type: Number, required: true, min: 1, max: MAX_TRUCKS_PER_TYPE,
        validate: { validator: Number.isInteger, message: "count must be an integer" },
    },
    capacityKg: {
        type: Number, required: true, min: MIN_TRUCK_CAPACITY_KG, max: MAX_TRUCK_CAPACITY_KG,
        validate: { validator: Number.isInteger, message: "capacityKg must be an integer" },
    },
});

// Where the trucks start and end their routes: [lng, lat], as bins store
// theirs, and an optional address.
const depotSchema = new mongoose.Schema({
    location: {
        type: [Number],
        required: true,
        validate: {
            validator: isLngLat,
            message: "location must be [lng, lat]",
        },
    },
    address: { type: String, trim: true, maxlength: DEPOT_ADDRESS_MAX_LENGTH, default: "" },
}, { _id: false });

// The last nightly plan: when, for which day, and what came of it; `note`
// names why it made no routes (no depot, no free truck, no bins due).
const lastAutoPlanSchema = new mongoose.Schema({
    at: Date,
    serviceDay: String,
    routes: Number,
    stops: Number,
    leftOut: Number,
    note: String,
}, { _id: false });

// Each organization's bins form their own ESP-NOW mesh, so all of them stay
// awake for the same minimum window after the shared wake-up time, and report
// on the same schedule (see the reporting schedule in utils/constants.js).

export const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    meshAwakeWindowSeconds: {
        type: Number,
        min: 1,
        max: MAX_MESH_AWAKE_WINDOW_SECONDS,
        default: DEFAULT_MESH_AWAKE_WINDOW_SECONDS,
        validate: {
            validator: Number.isInteger,
            message: "meshAwakeWindowSeconds must be an integer"
        }
    },
    reportIntervalMinutes: {
        type: Number,
        default: DEFAULT_REPORT_INTERVAL_MINUTES,
        validate: {
            validator: (value) => REPORT_INTERVAL_OPTIONS_MINUTES.includes(value),
            message: `reportIntervalMinutes must be one of ${REPORT_INTERVAL_OPTIONS_MINUTES.join(", ")}`
        }
    },
    reportStartHour: {
        type: Number,
        min: 0,
        max: 23,
        default: DEFAULT_REPORT_START_HOUR,
        validate: {
            validator: Number.isInteger,
            message: "reportStartHour must be an integer"
        }
    },
    fleet: {
        type: [truckTypeSchema],
        default: [],
        validate: { validator: fleet => fleet.length <= MAX_TRUCK_TYPES, message: `At most ${MAX_TRUCK_TYPES} truck types` },
    },
    depot: { type: depotSchema, default: null },
    // The local hour its routes are planned every night; null: never.
    routePlanningHour: {
        type: Number,
        min: 0,
        max: 23,
        default: DEFAULT_ROUTE_PLANNING_HOUR,
        validate: { validator: value => value === null || Number.isInteger(value), message: "routePlanningHour must be an hour or null" },
    },
    // The zoom from which the map shows each device on its own (below it, nearby ones group).
    clusterUntilZoom: {
        type: Number,
        min: CLUSTER_ZOOM_RANGE[0],
        max: CLUSTER_ZOOM_RANGE[1],
        default: DEFAULT_CLUSTER_UNTIL_ZOOM,
        validate: { validator: Number.isInteger, message: "clusterUntilZoom must be a whole zoom level" },
    },
    // What the last nightly plan did, for its settings ("why no routes today?").
    lastAutoPlan: { type: lastAutoPlanSchema, default: null },
});

