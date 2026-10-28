import { binModel } from "../models/models.js";
import { getOrgDeviceSettingsShared, organizationExist } from "./sharedService.js";
import { generateRandomToken } from "../../utils/helpers.js";
import { getNextReportSchedule } from "../../utils/deviceSchedule.js";
import { fromDeviceLocation } from "../../utils/geo.js";
import { createDeviceAccount } from "../../mqtt/brokerAccounts.js";

const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

function isDeviceLocation(location) {
    return Array.isArray(location) && location.length === 2 &&
        location.every(value => typeof value === "number" && Number.isFinite(value)) &&
        Math.abs(location[0]) <= 90 && Math.abs(location[1]) <= 180;
}

// Registers a new device in an organization: { mac, orgId, location (the
// device's [lat, lng]), battery, kind }. Returns { status, ... }: "registered"
// with its key and first schedule, "exists" (a known MAC never gets its key
// again), "invalid" or "no_organization". Shared by the HTTPS registration
// and the old MQTT one.
export async function registerDevice({ mac, orgId, location, battery, kind = "bin" }) {
    if (typeof mac !== "string" || !MAC_ADDRESS_PATTERN.test(mac) || !["bin", "gateway"].includes(kind) ||
        !isDeviceLocation(location) || typeof battery !== "number" || battery < 0 || battery > 100) {
        return { status: "invalid" };
    }
    if (!await organizationExist(orgId)) return { status: "no_organization" };
    if (await binModel.exists({ macAddress: mac })) return { status: "exists" };

    // Checked above in the device's [lat, lng]; stored as [lng, lat].
    const lngLat = fromDeviceLocation(location);
    const { meshAwakeWindowSeconds, reportIntervalMinutes, reportStartHour } = await getOrgDeviceSettingsShared(orgId);
    const { timeZone, nextWakeEpoch, followingWakeEpoch, sleepDurationSeconds } =
        getNextReportSchedule(lngLat, reportIntervalMinutes, reportStartHour);
    const deviceKey = generateRandomToken();
    // The MAC's first two bytes and the time keep new names apart, e.g. "Bin-1D:44-3125".
    const binName = `${kind === "gateway" ? "Gateway" : "Bin"}-${mac.slice(0, 5)}-${Date.now().toString().slice(-4)}`;
    try {
        await binModel.create({
            binName, kind, macAddress: mac, ownerId: orgId, deviceKey,
            location: { type: "Point", coordinates: lngLat },
            timezone: timeZone,
            status: { battery },
        });
    } catch (error) {
        // The same device registering twice at once.
        if (error?.code === 11000) return { status: "exists" };
        throw error;
    }
    // Its account on the private broker, before the device first connects.
    await createDeviceAccount(mac, deviceKey);
    return { status: "registered", deviceKey, timeZone, nextWakeEpoch, followingWakeEpoch, sleepDurationSeconds, meshAwakeWindowSeconds };
}
