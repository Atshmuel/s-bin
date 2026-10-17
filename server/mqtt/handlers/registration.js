import { getOrgDeviceSettingsShared, organizationExist } from "../../db/service/sharedService.js";
import { generateRandomToken } from "../../utils/helpers.js";
import { mqttClient } from "../mqttClient.js";
import { BIN_ACK_TOPIC } from "../mqttTopics.js";
import { binModel } from "../../db/models/models.js";
import { getNextReportSchedule } from "../../utils/deviceSchedule.js";

export async function handleRegistration({ mac, orgId, location, battery, kind = "bin" }) {
    try {
        if (!["bin", "gateway"].includes(kind)) {
            console.log("Invalid device kind:", kind);
            return;
        }

        const orgExist = await organizationExist(orgId)
        if (!orgExist) {
            console.log("Organization not found");
            return;
        }

        const existingBin = await binModel.findOne({ macAddress: mac });
        if (existingBin) {
            console.log("Bin already exists");
            return;
        }

        if (!Array.isArray(location) || location.length !== 2 ||
            typeof location[0] !== "number" || !Number.isFinite(location[0]) ||
            typeof location[1] !== "number" || !Number.isFinite(location[1]) ||
            location[0] < -90 || location[0] > 90 ||
            location[1] < -180 || location[1] > 180 ||
            typeof battery !== 'number' || battery < 0 || battery > 100) {
            console.log("Invalid location or battery data");
            return;
        }
        const { meshAwakeWindowSeconds, reportIntervalMinutes, reportStartHour } = await getOrgDeviceSettingsShared(orgId);
        const { timeZone, nextWakeEpoch, followingWakeEpoch, sleepDurationSeconds } =
            getNextReportSchedule(location, reportIntervalMinutes, reportStartHour);

        const deviceKey = generateRandomToken();
        // 0,5 to get first 5 chars for example: 1D:44:8E:A7:32:5D -> 1D:44 date used for uniqueness validity
        const binName = `${kind === "gateway" ? "Gateway" : "Bin"}-${mac.slice(0, 5)}-${Date.now().toString().slice(-4)}`;

        const newBin = await binModel.create({
            binName,
            kind,
            macAddress: mac,
            ownerId: orgId,
            deviceKey,
            location: {
                type: "Point",
                coordinates: location || [0, 0],
            },
            timezone: timeZone,
            status: {
                battery: battery
            }

        });
        console.log("Registered new bin via MQTT:", newBin);
        mqttClient.publish(
            `${BIN_ACK_TOPIC}/${mac}`,
            JSON.stringify({
                status: "registered",
                deviceKey,
                timeZone,
                nextWakeEpoch,
                followingWakeEpoch,
                sleepDurationSeconds,
                meshAwakeWindowSeconds,
            })
        );
    } catch (error) {
        console.error("Error registering bin via MQTT:", error);
    }
}
