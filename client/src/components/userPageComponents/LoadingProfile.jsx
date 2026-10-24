import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

// The account page's shape while the account loads: header, then sections.
function LoadingProfile() {
    return (
        <div className="mx-auto flex w-full max-w-5xl gap-8 px-1 py-2">
            <div className="hidden w-44 shrink-0 flex-col gap-2 lg:flex">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
            <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-16 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="flex flex-col gap-5 p-6">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-9 w-full" />
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default LoadingProfile
