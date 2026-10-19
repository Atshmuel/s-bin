import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

// A card whose content waits for its own request; `ref` lets a page load it
// only once it scrolls into view.
function SectionCard({ ref, title, description, action, isLoading, error, className, children }) {
    return (
        <Card ref={ref} className={className}>
            <CardHeader className="flex flex-row items-start gap-2 space-y-0">
                <div className="grid flex-1 gap-1">
                    <CardTitle>{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {action}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8"><Spinner className="size-6" /></div>
                ) : error ? (
                    <p role="alert" className="text-sm text-destructive">{error.message}</p>
                ) : children}
            </CardContent>
        </Card>
    )
}

export function Muted({ children }) {
    return <p className="text-sm text-muted-foreground">{children}</p>
}

export default SectionCard
