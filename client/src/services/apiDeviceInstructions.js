import { BINS_EP, SERVER_URL } from "@/utils/constants";

async function parseResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || "Request failed.");
    }
    return data;
}

export async function getDeviceInstructions(binId) {
    const response = await fetch(
        `${SERVER_URL}/${BINS_EP}/${binId}/instructions`,
        { credentials: "include" }
    );
    return parseResponse(response);
}

export async function enqueueDeviceInstruction({ binId, type, durationMinutes, meshWindowSeconds }) {
    const payload = type === "stay_awake"
        ? { durationSeconds: durationMinutes * 60 }
        : type === "set_mesh_awake_window"
            ? { durationSeconds: meshWindowSeconds }
            : {};
    const response = await fetch(
        `${SERVER_URL}/${BINS_EP}/${binId}/instructions`,
        {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, payload }),
        }
    );
    return parseResponse(response);
}

export async function cancelDeviceInstruction({ binId, instructionId }) {
    const response = await fetch(
        `${SERVER_URL}/${BINS_EP}/${binId}/instructions/${instructionId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );
    return parseResponse(response);
}
