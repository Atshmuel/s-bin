
import { OVERVIEW_EP, SERVER_URL } from "@/utils/constants";

export async function getOverviews() {
    const res = await fetch(`${SERVER_URL}/${OVERVIEW_EP}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getBinsStatusOverviews() {
    const res = await fetch(`${SERVER_URL}/${OVERVIEW_EP}/binstatus`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function getAIOverviewStream(onChunk, signal) {
    const res = await fetch(`${SERVER_URL}/${OVERVIEW_EP}/ai-ov`, {
        method: "GET",
        credentials: "include",
        signal,
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || "Failed to fetch AI overview");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                try {
                    const data = JSON.parse(trimmedLine.replace('data: ', ''));
                    onChunk(data);
                } catch (error) {
                    console.error("Error parsing AI chunk", error);
                }
            }
        }
    }

    return { status: "success" };
}