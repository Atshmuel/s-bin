import { Card, CardDescription, CardTitle } from "./ui/card"
import { TableRow } from "./ui/table"


export default function EmptyTable({ title, description }) {
    return (
        <TableRow className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  bg-muted text-primary shadow-md w-3/4 h-[100px] sm:h-[100px] md:h-[150px] flex flex-col justify-center items-center rounded-2xl border space-y-2 px-4">
            <td className="text-lg md:text-2xl sm:text-xl ">{title}</td>
            <td className="text-md md:text-lg sm:text-xl">{description}</td>
        </TableRow>
    )
}