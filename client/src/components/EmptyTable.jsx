import { Card, CardDescription, CardTitle } from "./ui/card"


export default function EmptyTable({ title, description }) {
    return (
        <Card className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  bg-muted text-primary shadow-md w-[300px] h-[100px] sm:w-[400px] sm:h-[100px] md:w-[500px] md:h-[150px] xl:w-[800px] xl:h-[200px] flex flex-col justify-center items-center rounded-sm border space-y-2" >
            <CardTitle className="text-lg md:text-2xl sm:text-xl ">{title}</CardTitle>
            <CardDescription className="md:text-xl sm:text-sm xl:text-xl">{description}</CardDescription>
        </Card>
    )
}