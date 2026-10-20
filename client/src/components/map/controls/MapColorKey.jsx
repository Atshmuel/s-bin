import { useTranslation } from "react-i18next"
import DeviceRoleIcon from "@/components/bins/DeviceRoleIcon"
import { STATUS_COLORS } from "@/utils/binHelpers"

// The marker colors by fullness, as getColor() picks them.
const FULLNESS_KEYS = [
    ["good", "fullnessLow"],
    ["warning", "fullnessMid"],
    ["critical", "fullnessHigh"],
]
const ROLES = ["gatewayBin", "meshBin", "gateway"]

function Swatch({ color }) {
    return <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

// What the map's colors and icons mean (shown by MapKeyPanel).
function MapColorKey() {
    const { t } = useTranslation()
    return (
        <section className="flex flex-col gap-2 text-xs">
            <h4 className="text-sm font-medium">{t("mapLegend.key.title")}</h4>
            <ul className="flex flex-col gap-1.5">
                {FULLNESS_KEYS.map(([status, key]) => (
                    <li key={status} className="flex items-center gap-2">
                        <Swatch color={STATUS_COLORS[status]} />
                        {t(`mapLegend.key.${key}`)}
                    </li>
                ))}
            </ul>
            <p className="text-muted-foreground">{t("mapLegend.key.gatewayBattery")}</p>
            <ul className="flex flex-col gap-1.5">
                {ROLES.map((role) => (
                    <li key={role} className="flex items-center gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center">
                            <DeviceRoleIcon role={role} size={16} />
                        </span>
                        {t(`deviceRoles.${role}`)}
                    </li>
                ))}
                <li className="flex items-center gap-2">
                    <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold"
                        style={{ borderColor: STATUS_COLORS.critical }}
                    >
                        3
                    </span>
                    {t("mapLegend.key.cluster")}
                </li>
            </ul>
        </section>
    )
}

export default MapColorKey
