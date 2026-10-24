import { CACHE_KEY, CACHE_TTL, LEGACY_CACHE_KEYS } from "./constants"

// One overview per scope: an organization's id, or "all" for an owner's
// whole fleet (and for users, who only ever see their own).
function scopeKey(orgId) {
    return orgId ?? "all"
}

function readAll() {
    try {
        const all = JSON.parse(localStorage.getItem(CACHE_KEY))
        return all && typeof all === "object" ? all : {}
    } catch {
        return {}
    }
}

function writeAll(all) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(all))
    } catch {
        // Not kept: the next visit asks again.
    }
}

export function getAICache(orgId) {
    const all = readAll()
    const entry = all[scopeKey(orgId)]
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        delete all[scopeKey(orgId)]
        writeAll(all)
        return null
    }
    return entry.data
}

export function setAICache(data, orgId) {
    if (!data?.insights?.length) return
    writeAll({ ...readAll(), [scopeKey(orgId)]: { data, timestamp: Date.now() } })
}

// On a language change and on logout, so no one sees an overview made for
// someone else or in the other language.
export function clearAICache() {
    try {
        for (const key of [CACHE_KEY, ...LEGACY_CACHE_KEYS]) localStorage.removeItem(key)
    } catch {
        // Nothing stored to clear.
    }
}
