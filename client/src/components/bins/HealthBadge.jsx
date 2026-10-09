import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getVariant } from "@/utils/binHelpers";
import { useTranslation } from "react-i18next";

function HealthBadge({ health, message, className }) {
    const { t } = useTranslation();
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
                {message || fallbackMessage}
            </TooltipContent>
        </Tooltip>
    );
}

export default HealthBadge;
