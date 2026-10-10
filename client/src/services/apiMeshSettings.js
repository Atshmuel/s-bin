import { BINS_EP, SERVER_URL } from "@/utils/constants";

async function parseResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || "Request failed.");
    }
    return data;
}

export async function getMeshSettings() {
    const response = await fetch(
        `${SERVER_URL}/${BINS_EP}/mesh-settings`,
        { credentials: "include" }
    );
    return parseResponse(response);
}

export async function updateMeshSettings({ orgId, meshAwakeWindowSeconds }) {
    const response = await fetch(
        `${SERVER_URL}/${BINS_EP}/mesh-settings/${orgId}`,
        {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meshAwakeWindowSeconds }),
        }
    );
    return parseResponse(response);
}
