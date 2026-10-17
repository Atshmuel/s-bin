import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { getDeviceRole } from "@/utils/deviceRoles"
import DeviceRoleIcon from "./DeviceRoleIcon"

// The device's role with its icon: gateway, gateway bin or mesh bin.
function DeviceRoleBadge({ bin }) {
    const { t } = useTranslation()
    const role = getDeviceRole(bin)
    return (
        <Badge variant="outline" className="gap-2 whitespace-nowrap">
            <DeviceRoleIcon role={role} size={14} />
            {t(`deviceRoles.${role}`)}
        </Badge>
    )
}

export default DeviceRoleBadge
