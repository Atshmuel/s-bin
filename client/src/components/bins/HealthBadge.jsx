import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getVariant } from "@/utils/binHelpers";
import { useTranslation } from "react-i18next";
import { useFaultText } from "@/hooks/useFaultText";

// The health level, with what went wrong (fault codes, or an older
// firmware's message) in its tooltip.
function HealthBadge({ health, faults, message, className }) {
    const { t } = useTranslation();
    const faultText = useFaultText();
    const problem = faultText(faults, message);
    const fallbackMessage = t(`healthTooltip.${health}`, {
        defaultValue: t("healthTooltip.detailsUnavailable"),
    });

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    className={`cursor-help ${className || ""}`}
                    variant={getVariant(health)}
                >
                    {t(`levels.${health}`)}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                {problem || fallbackMessage}
            </TooltipContent>
        </Tooltip>
    );
}

export default HealthBadge;
