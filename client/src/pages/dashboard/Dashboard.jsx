import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleAlert, GaugeCircle, InfoIcon, Trash2 } from "lucide-react"
import BinMap from "../bins/BinMap"

function Dashboard() {
    //come from the server
    const cardsData = [{
        title: 'Bins Requiring Maintenance',
        count: 7,
        description: 'Required maintenance immediately',
        badgeVariant: 'suspended',
        icon: CircleAlert
    }, {
        title: 'Almost Full Bins',
        count: 7,
        description: 'Check these bins for emptying today',
        badgeVariant: 'inactive',
        icon: InfoIcon
    }, {
        title: 'Total Bins',
        count: 50,
        description: 'Total number of bins in the system',
        badgeVariant: 'outline',
        icon: Trash2
    }
        , {
        title: 'Avg Fill Level',
        count: "65%",
        description: 'Average fill level across all bins',
        badgeVariant: 'outline',
        icon: GaugeCircle
    }]

    //map should display only bins with issues not all the bins!

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl">Quick Overview</h3>
                    <p className="text-sm text-muted-foreground">
                        Key metrics for your bins at a glance, including fill levels, total bins, and maintenance needs.
                    </p>
                </div>
                <div className="lg:flex gap-4">
                    <div className="flex mb-4 lg:mb-0 lg:w-1/2 flex-wrap gap-4">
                        {cardsData.map((card, index) => (
                            <Card key={index} className="min-w-72 flex-1">
                                <CardHeader className="flex flex-row items-start justify-between gap-3">
                                    <div>

                                        <CardDescription>{card.title}</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                            {card.count}
                                        </CardTitle>
                                    </div>
                                    <Badge variant={card.badgeVariant} className={'p-1'}>
                                        <card.icon size={16} />
                                    </Badge>
                                </CardHeader>
                                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                    <div className="line-clamp-1 flex gap-2 font-medium">
                                        {card.description}
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    <div className="h-[250px] lg:h-auto lg:w-1/2">
                        <BinMap zoom={13} legend={true} />
                    </div>
                </div>


            </div >




            <div className="space-y-4">
                <div>
                    <h3 className="text-xl md:text-2xl">Bins Overview</h3>
                    <p className="text-sm text-muted-foreground">
                        A detailed view of current bin alerts and recent activity logs across the system                    </p>
                </div>
                <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-row lg:flex-wrap gap-6">
                    <Card className='flex-1'>
                        <CardHeader>
                            <h3 className="text-xl md:text-2xl"></h3>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                Bins Requiring Attention
                            </CardTitle>
                            <CardDescription>List of bins that have triggered alerts or need maintenance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-red-300">Table</div>

                        </CardContent>
                    </Card>
                    <Card className='flex-1'>
                        <CardHeader>
                            <h3 className="text-xl md:text-2xl"></h3>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                Recent Bin Logs
                            </CardTitle>
                            <CardDescription>A summary of the most recent actions, maintenance, or events related to your bins.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-red-300">Table</div>

                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>

    )
}

export default Dashboard
