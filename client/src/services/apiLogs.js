import { LOGS_EP } from "@/utils/constants";
import { request } from "./request";

export function getAllLogs(page = 1, limit = 10, search = "") {
    return request(`${LOGS_EP}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
}

export function getLog({ id, withBin }) {
    return request(`${LOGS_EP}/${id}?withBin=${withBin}`);
}
