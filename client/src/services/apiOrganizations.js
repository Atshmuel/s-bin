import { ORG_EP, SERVER_URL } from "@/utils/constants";

export async function getOrganizations() {
    const res = await fetch(`${SERVER_URL}/${ORG_EP}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}


export async function createOrgApi({ name }) {
    const res = await fetch(`${SERVER_URL}/${ORG_EP}`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function deleteOrgByIdApi({ orgId }) {
    const res = await fetch(`${SERVER_URL}/${ORG_EP}/${orgId}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}

export async function updateOrgNameApi({ orgId, name }) {
    const res = await fetch(`${SERVER_URL}/${ORG_EP}/${orgId}`, {
        method: "PUT",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message);
    return data;
}