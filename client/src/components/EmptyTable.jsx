// An empty table's message, centered over the table's frame. Its text wraps, so
// it fits a narrow screen.
export default function EmptyTable({ title, description }) {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 min-h-[100px] md:min-h-[150px] flex flex-col justify-center items-center gap-2 rounded-2xl border bg-muted text-primary text-center shadow-md p-4">
            <p className="text-lg sm:text-xl md:text-2xl">{title}</p>
            <p className="text-sm sm:text-xl md:text-lg">{description}</p>
        </div>
    )
}
