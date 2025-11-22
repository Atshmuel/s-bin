function EmptyCard({ title, description }) {
    return (
        <div className="flex flex-col justify-center items-center h-full text-destructive min-h-96">
            <h3 className="text-lg font-extrabold">{title}</h3>
            <p>{description}</p>
        </div>
    )
}

export default EmptyCard
