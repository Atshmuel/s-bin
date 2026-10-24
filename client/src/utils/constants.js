export const SERVER_URL = import.meta.env.VITE_API_URL;

export const BINS_EP = 'api/bins'
export const LOGS_EP = 'api/logs'
export const USERS_EP = 'api/users'
export const AUTH_EP = 'api/auth'
export const OVERVIEW_EP = 'api/overviews'
export const ORG_EP = 'api/organizations'

// The AI overview is kept in the browser this long (it is slow and costs a
// model call), one per organization an owner looks at; renaming the key drops
// overviews made from older instructions.
export const CACHE_KEY = 'aiOverviews'
export const LEGACY_CACHE_KEYS = Object.freeze(['aiCache', 'aiOverview'])
export const CACHE_TTL = 60 * 60 * 1000
// The organization an owner last picked on the dashboard and analytics page.
export const SELECTED_ORG_STORAGE_KEY = 'selectedOrganization'
// ---- Thresholds and limits. Every number that decides behaviour lives here;
// the shared ones match the server's (server/utils/constants.js).

const MINUTE_MS = 60 * 1000

// Fullness: the fill level or the weight against WEIGHT_REFERENCE_KG,
// whichever is closer to full, in %. Warning and critical color the map and
// mark a bin as filling up or almost full.
export const FULLNESS_WARNING_PERCENT = 50
export const FULLNESS_CRITICAL_PERCENT = 80
export const WEIGHT_REFERENCE_KG = 250
// The map search's fullness range before the user sets one: every bin, as the
// map shows them.
export const DEFAULT_SEARCH_FULLNESS = Object.freeze([0, 100])

// Battery, in %: low at warning, needs replacing at critical.
export const BATTERY_WARNING_PERCENT = 50
export const BATTERY_CRITICAL_PERCENT = 20

// Reporting schedule options and defaults. Every interval divides 24 hours.
export const MAX_MESH_AWAKE_WINDOW_SECONDS = 60
export const REPORT_INTERVAL_OPTIONS_MINUTES = Object.freeze([15, 30, 60, 120, 180, 240, 360, 720, 1440])
export const DEFAULT_REPORT_INTERVAL_MINUTES = 720
export const DEFAULT_REPORT_START_HOUR = 8

// Device commands; the known weight for a scale calibration is in grams, and
// the device checks the same range.
export const MAX_AWAKE_MINUTES = 60
export const MIN_SCALE_GRAMS = 100
export const MAX_SCALE_GRAMS = 200000
export const MAX_BIN_NAME_LENGTH = 25
export const INSTRUCTIONS_PAGE_SIZE = 5
// A bin page's logs table shows this many logs a page.
export const BIN_LOGS_PAGE_SIZE = 6
// Settings saved as they change wait this long after the last change, so
// quick clicks go out as one request.
export const SETTINGS_SAVE_DELAY_MS = 800
// The account page's section list marks the last section whose top passed a
// line this far below the top of the screen. Over the last stretch of
// scrolling (this share of the screen) the line slides down to the bottom,
// so short sections at the end each get their turn. A clicked section stays
// marked this long while the page scrolls to it.
export const SECTION_LINE_OFFSET_PX = 96
export const SECTION_LINE_SLIDE_SHARE = 0.6
export const SECTION_CLICK_HOLD_MS = 1000
// Password length, as the server checks it.
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 30

// Map. Below CLUSTER_UNTIL_ZOOM nearby devices group into one marker; the
// user's location marker stays USER_MARKER_MS after "My location". The map
// page loads the devices in view once the map stops moving for
// MAP_VIEW_DEBOUNCE_MS, and first opens around all of them, no closer than
// MAP_FIT_MAX_ZOOM (one device, or several at one spot, is a single point).
export const DEFAULT_RADIUS_KM = 5
export const MAX_RADIUS_KM = 100
export const CLUSTER_UNTIL_ZOOM = 13
export const USER_MARKER_MS = MINUTE_MS
export const MAP_VIEW_DEBOUNCE_MS = 300
export const MAP_FIT_MAX_ZOOM = 15

// Analytics ranges (days) and how fresh data stays. Devices report hours
// apart: lists refresh once a minute, a dashboard left open every two, and
// nothing refreshes while the tab is hidden.
export const ANALYTICS_RANGES_DAYS = Object.freeze([7, 30, 90])
export const ANALYTICS_STALE_MS = 5 * MINUTE_MS
export const DASHBOARD_REFRESH_MS = 2 * MINUTE_MS
export const LIST_REFRESH_MS = MINUTE_MS
// A pending command is refreshed until its device picks it up.
export const PENDING_INSTRUCTIONS_REFRESH_MS = 30 * 1000
