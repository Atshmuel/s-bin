import { ToggleGroup } from "@radix-ui/react-toggle-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroupItem } from "@/components/ui/toggle-group"

// One section of the account page: a titled card of rows. `footer` holds the
// section's buttons (Save / Cancel), shown only when there is something to save.
export function SettingsSection({ id, title, description, danger = false, footer, children }) {
    return (
        <Card id={id} className={`scroll-mt-20 overflow-hidden ${danger ? "border-destructive/60" : ""}`}>
            <CardHeader className="border-b">
                <CardTitle className={danger ? "text-destructive" : ""}>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="divide-y p-0">{children}</CardContent>
            {footer && <CardFooter className="justify-end gap-2 border-t bg-muted/30 py-3">{footer}</CardFooter>}
        </Card>
    )
}

// A label with a line of explanation, and its control: side by side on a wide
// screen, one under the other on a phone (or always, when `stacked`).
export function SettingsRow({ label, description, children, stacked = false }) {
    return (
        <div className={`flex flex-col gap-3 px-6 py-5 ${stacked ? "" : "sm:flex-row sm:items-center sm:justify-between sm:gap-8"}`}>
            <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium leading-snug">{label}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {children && <div className={stacked ? "" : "sm:shrink-0"}>{children}</div>}
        </div>
    )
}

// A small set of exclusive choices (theme, language, role, status).
export function SegmentedChoice({ value, options, onChange, disabled, label }) {
    return (
        <ToggleGroup type="single" value={value} disabled={disabled} aria-label={label}
            onValueChange={(next) => next && onChange(next)}
            className="inline-flex flex-wrap rounded-md border border-primary/60">
            {options.map(option => (
                <ToggleGroupItem key={option.value} value={option.value}
                    className="data-[state=on]:bg-primary data-[state=on]:text-accent">
                    {option.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}
