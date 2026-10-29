import { useTranslation } from "react-i18next"

// The faults a device reported, monthly ones counted in attempts, not reports.
const MONTHLY_FAULTS = new Set(["gps"])

// A reading's or a bin's problems in the user's language: its fault codes
// (see the server's utils/faults.js) and, from older firmware, its English
// message as it came. Null without either.
export function useFaultText() {
    const { t } = useTranslation()
    return (faults, message) => {
        const parts = (faults ?? []).map(({ code, cycles, mm, types }) => {
            const repeated = cycles >= 2
            const when = MONTHLY_FAULTS.has(code)
                ? t(repeated ? "faults.when.repeatedMonthly" : "faults.when.onceMonthly")
                : t(repeated ? "faults.when.repeated" : "faults.when.once")
            const withMm = mm !== undefined && mm !== null && t(`faults.${code}_mm`, { defaultValue: "" })
            return t(withMm ? `faults.${code}_mm` : `faults.${code}`, {
                when,
                mm,
                types: (types ?? []).map(type => t(`components.deviceInstructions.types.${type}`, { defaultValue: type })).join(", "),
                defaultValue: code,
            })
        })
        if (message) parts.push(message)
        return parts.length > 0 ? parts.join(" ") : null
    }
}
