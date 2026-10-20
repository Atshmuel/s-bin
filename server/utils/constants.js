// User roles, as stored on users; ROLE_LEVEL ranks them.
export const ROLES = Object.freeze({
    OWNER: "owner",
    ADMIN: "admin",
    TECHNICIAN: "technician",
    USER: "user",
})

// Commands a mesh leaf can run; its gateway hands each over in the ACK to the
// leaf's next reading. stay_awake is not among them: a leaf can only talk
// while its gateway's mesh window is open, so staying awake gains nothing.
export const LEAF_INSTRUCTION_TYPES = Object.freeze(["report_now", "calibrate_empty_bin", "calibrate_scale"])

export const ROLE_LEVEL = {
    [ROLES.OWNER]: 4,
    [ROLES.ADMIN]: 3,
    [ROLES.TECHNICIAN]: 2,
    [ROLES.USER]: 1
}

export const AI_INSTRUCTIONS = `
**Role**
You are an automated Analytics Engine for a smart-city IoT waste management system.

**Task**
Analyze the attached dataset (JSON of smart bins) and generate insights for direct display to an end user.

⸻

**Hard Output Rules (mandatory)**

* Return a single valid JSON object only — no surrounding text, no explanations.
* The JSON must contain exactly one top-level key: "insights".
* **If no data is provided or the dataset is empty, return exactly:** "{"insights": []}"
* If data exists, "insights" must be an array of exactly 4 objects.
* Each object must contain exactly two keys:
* "title" (string)
* "text" (string)
* Do NOT add any additional keys, nesting, metadata, or comments.
* Do NOT ask questions, suggest next steps, or offer further assistance.
* Do NOT add an introduction, conclusion, disclaimers, or any extra text.
* All text values must be written in **{{language}} only**.
* Any deviation from this structure or format is considered an error.

⸻

**Insight Card Structure (per object)**

* "title": Short, clear, user-facing headline.
* "text": 1-2 concise sentences only (maximum).

⸻

**Fixed Insight Order (array order is mandatory)**

1. Usage Load & Area Patterns
2. System Health & Anomalies
3. Collection Performance
4. Recommended Actions — up to two concrete action items only

⸻

**Content Rules**

* Analyze patterns at an area / behavioral level, not per individual bin.
* Mention a specific "binCode" only if there is a clear operational exception (failure, critical risk, or extreme behavior).
* Language must be user-facing, clear, and decision-oriented.
* This is not an engineering or technical report.

⸻

**Analytics Guidelines**

* **STRICT DATA ADHERENCE:** Derive insights **strictly** from the provided data.
* **NO HALLUCINATIONS:** If the input is empty or insufficient, do **not** invent, guess, or generate any data or insights. Return the empty JSON format specified above.
* Emphasize user impact: risk, overload, service continuity, efficiency.
* Include numbers only when they directly support a decision.
* Maximum 2 sentences per insight.

⸻

**Tone**
Product analytics style — concise, confident, non-conversational.

**Compliance Check**
If you cannot comply with all rules above, return no output.

**Data**`
// ---- Thresholds and limits. Every number that decides behaviour lives here,
// so a screen, a report and an alert never disagree. The client keeps its own
// copy of the shared ones in client/src/utils/constants.js.

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Fullness: the fill level or the weight against WEIGHT_REFERENCE_KG,
// whichever is closer to full, in %. Warning and critical drive a report's
// severity, the map's colors, "almost full" and the daily alert email.
export const FULLNESS_WARNING_PERCENT = 50;
export const FULLNESS_CRITICAL_PERCENT = 80;
export const WEIGHT_REFERENCE_KG = 250;
// A route without a range from the map's search collects the critical bins.
export const DEFAULT_COLLECTION_FULLNESS = Object.freeze([FULLNESS_CRITICAL_PERCENT, 100]);

// Battery, in %: low at warning, needs replacing at critical.
export const BATTERY_WARNING_PERCENT = 50;
export const BATTERY_CRITICAL_PERCENT = 20;

// Reporting schedule (an organization's settings and their defaults). Every
// interval divides 24 hours, so the slots stay aligned; below 30 minutes
// gateways learn no clock drift. The start hour is local to each device.
export const DEFAULT_MESH_AWAKE_WINDOW_SECONDS = 10;
export const MAX_MESH_AWAKE_WINDOW_SECONDS = 60;
export const REPORT_INTERVAL_OPTIONS_MINUTES = Object.freeze([15, 30, 60, 120, 180, 240, 360, 720, 1440]);
export const DEFAULT_REPORT_INTERVAL_MINUTES = 720;
export const DEFAULT_REPORT_START_HOUR = 8;
// Device sleep clocks run fast (about +1%), so a report this close before its
// slot belongs to that slot: the next wake is the slot after it.
export const EARLY_WAKE_TOLERANCE_SECONDS = 600;
// A device is offline once it has missed this many reports in a row; the grace
// covers a report that arrives a little late.
export const OFFLINE_AFTER_MISSED_REPORTS = 2;
export const OFFLINE_GRACE_MS = 10 * MINUTE_MS;

// Mesh relays. A queued leaf reading timed beyond these limits is logged at
// its arrival instead.
export const MAX_MESH_HOPS = 8;
export const RECENT_MESH_MESSAGE_IDS = 8;
export const MAX_READING_AGE_MS = 7 * DAY_MS;
export const MAX_READING_AHEAD_MS = 2 * MINUTE_MS;
// Leaf commands per instruction check, one per leaf (its oldest), so each leaf
// runs its commands in order and the reply stays small for the gateway.
export const MAX_LEAF_INSTRUCTIONS = 4;

// Device commands. The known weight for calibrate_scale is in grams, and the
// device checks the same range.
export const MAX_AWAKE_EXTENSION_SECONDS = 3600;
export const MIN_SCALE_CALIBRATION_GRAMS = 100;
export const MAX_SCALE_CALIBRATION_GRAMS = 200000;
// A command still pending this long means its device has not checked in.
export const INSTRUCTION_RETENTION_MS = 3 * DAY_MS;

// Analytics. A drop this large between two reports means the bin was emptied;
// a trend (fill rate, battery drain) needs this many reports over this long.
export const ANALYTICS_RANGES_DAYS = Object.freeze([7, 30, 90]);
export const DEFAULT_RANGE_DAYS = 30;
export const COLLECTION_LEVEL_DROP = 30;
export const COLLECTION_WEIGHT_DROP_RATIO = 0.5;
export const FILL_RATE_WINDOW_DAYS = 14;
export const BATTERY_TREND_DAYS = 14;
export const MIN_TREND_POINTS = 3;
export const MIN_TREND_SPAN_MS = DAY_MS;
export const FULL_SOON_HOURS = Object.freeze([24, 48]);
export const BATTERY_SOON_DAYS = 30;
export const RELIABILITY_DAYS = Object.freeze([7, 30]);
export const FULLNESS_BUCKETS = Object.freeze([[0, 25], [25, 50], [50, 75], [75, 101]]);
export const BATTERY_BUCKETS = Object.freeze([
    [0, BATTERY_CRITICAL_PERCENT], [BATTERY_CRITICAL_PERCENT, BATTERY_WARNING_PERCENT],
    [BATTERY_WARNING_PERCENT, 80], [80, 101],
]);

// List lengths in responses.
export const FULL_SOON_LIST_LIMIT = 20;
export const BATTERY_SOON_LIST_LIMIT = 10;
export const LEAST_RELIABLE_LIMIT = 5;
export const ATTENTION_LIST_LIMIT = 50;
export const RECENT_LOGS_LIMIT = 50;

// Accounts: failed one-time-code guesses allowed before the code is discarded.
export const MAX_OTP_ATTEMPTS = 5;
