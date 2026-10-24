import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAppSide } from "@/hooks/useAppSide"

// A single-choice row of toggles that never ends up with nothing chosen.
function ChoiceGroup({ value, onChange, options, label }) {
    const { isRight } = useAppSide()
    return (
        <ToggleGroup type="single" variant="outline" size="sm" isRight={isRight} className="w-full"
            value={value} onValueChange={(next) => next && onChange(next)} aria-label={label}>
            {options.map(([option, text]) => (
                <ToggleGroupItem key={option} value={option}
                    className="flex-1 px-1 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:text-sm">
                    {text}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}

export default ChoiceGroup
