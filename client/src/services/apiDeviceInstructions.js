import { BINS_EP } from "@/utils/constants";
import { request } from "./request";

export function getDeviceInstructions(binId) {
    return request(`${BINS_EP}/${binId}/instructions`);
}

export function enqueueDeviceInstruction({ binId, type, durationMinutes, grams }) {
    const payload = type === "stay_awake"
        ? { durationSeconds: durationMinutes * 60 }
        : type === "calibrate_scale"
            ? { grams }
            : {};
    return request(`${BINS_EP}/${binId}/instructions`, { method: "POST", body: { type, payload } });
}

export function cancelDeviceInstruction({ binId, instructionId }) {
    return request(`${BINS_EP}/${binId}/instructions/${instructionId}`, { method: "DELETE" });
}
