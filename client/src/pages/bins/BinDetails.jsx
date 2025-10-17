import BinCard from "@/components/bins/BinCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function BinDetails() {
    const bin = {
        _id: "670b1a1a1a1a1a1a1a1a1a1a",
        binName: "BIN-001",
        location: {
            type: "Point",
            coordinates: [32.9050, 35.4950],

        },
        status: {
            health: "critical",
            level: 25,
            updatedAt: "2025-10-13T10:30:00.000Z",
        },
        ownerId: "652f1b1b1b1b1b1b1b1b1b1b",
        levelLogs: [],
        createdAt: "2025-10-13T10:30:00.000Z",
        updatedAt: "2025-10-13T10:30:00.000Z",
        __v: 0,
    }
    return (
        <div className="flex gap-4">
            <BinCard className='flex flex-col justify-between' bin={bin} />
            <Card className='flex-1 h-96'>
                <CardHeader>
                    <h3 className="text-xl md:text-2xl"></h3>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        Logs Overview
                    </CardTitle>
                    <CardDescription>Review detailed records of all bin activities, including fill levels, timestamps, and event types.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div >Table</div>

                </CardContent>
            </Card>
        </div>
    )
}

export default BinDetails
