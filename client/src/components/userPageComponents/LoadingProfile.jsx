import { Card } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

function LoadingProfile() {
    return (<div className="h-full flex flex-wrap gap-6 justify-center px-4 py-2 max-w-[1800px]">
        <Card className="min-w-[330px] flex flex-col items-center justify-start gap-8 p-5 h-[400px] max-w-[400px] ">
            <div className="flex justify-between w-full">
                <Skeleton className={'w-16 h-5 rounded-full'} />
                <Skeleton className={'size-20 rounded-full'} />
                <Skeleton className={'w-16 h-5 rounded-full'} />
            </div>
            <Skeleton className={'w-80 h-15 rounded-full'} />
            <div className="flex flex-col gap-5 mt-6">
                <Skeleton className={'w-80 h-7'} />
                <Skeleton className={'w-80 h-7'} />
            </div>
            <Skeleton className={'w-80 h-10'} />
        </Card>
        <Card className="min-w-[330px] flex flex-col items-center justify-start gap-10 p-5 h-[400px] max-w-[400px] ">
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
        </Card>
        <Card className="min-w-[330px] flex flex-col items-center justify-start gap-10 p-5 h-[400px] max-w-[400px] ">
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
            <Skeleton className={'w-80 h-7'} />
        </Card>

    </div>
    )
}

export default LoadingProfile
