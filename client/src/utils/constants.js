// const prod = true;
// export const SERVER_URL = prod
//     ? "https://api-smartbin.onrender.com"
//     : "http://localhost:3002";

export const SERVER_URL = import.meta.env.VITE_API_URL;

export const BINS_EP = 'api/bins'
export const LOGS_EP = 'api/logs'
export const USERS_EP = 'api/users'
export const AUTH_EP = 'api/auth'
export const OVERVIEW_EP = 'api/overviews'
export const ORG_EP = 'api/organizations'

export const CACHE_KEY = 'aiCache'
export const CACHE_TTL = 24 * 60 * 60 * 1000