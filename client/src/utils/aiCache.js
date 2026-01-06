const CACHE_KEY = 'aiCache'
const CACHE_TTL = 24 * 60 * 60 * 1000

export function getAICache() {
    const obj = localStorage.getItem(CACHE_KEY)
    if (!obj) return null

    try {
        const { data, timestamp } = JSON.parse(obj)

        const isExpired = Date.now() - timestamp > CACHE_TTL
        if (isExpired) {
            localStorage.removeItem(CACHE_KEY)
            return null
        }

        return data
    } catch {
        localStorage.removeItem(CACHE_KEY)
        return null
    }
}

export function setAICache(data) {
    localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
            data,
            timestamp: Date.now(),
        })
    )
}
