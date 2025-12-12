import { format } from "date-fns";
import DataTable from "../../components/DataTable"
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import Battery from "../../components/bins/Battary";
import { LinkIcon, MapPin, Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { useBins } from "@/hooks/bins/useBins";
import { getVariant } from "@/utils/binHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InputLabel from "@/components/InputLabel";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteBinBatch } from "@/hooks/bins/useDeleteAllBins";

function BinsList() {
    const { allBins, isLoadingBins, binsError } = useBins();
    const { deleteBins, isDeleting } = useDeleteBinBatch()
    const [binIds, setBinIds] = useState([]);


    const toggleOne = (id, checked) => {
        setBinIds(prev =>
            checked ? [...prev, id] : prev.filter(x => x !== id)
        );
    };

    const toggleAll = (rows, checked) => {
        if (checked) {
            setBinIds(rows.map(r => r._id));
        } else {
            setBinIds([]);
        }
    };

    const columns = [
        {
            header: ({ table }) => {
                const rows = table.options.data;
                const allIds = rows.map(r => r._id);

                const allChecked = binIds.length === allIds.length && allIds.length > 0;
                const someChecked = binIds.length > 0 && binIds.length < allIds.length;

                return (
                    <Checkbox
                        checked={allChecked}
                        indeterminate={someChecked ? true : undefined}
                        onCheckedChange={(checked) => toggleAll(rows, !!checked)}
                    />
                );
            },
            accessorKey: "_id",
            enableSorting: false,
            cell: ({ row }) => {
                const id = row.original._id;
                const isChecked = binIds.includes(id);

                return (
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => toggleOne(id, !!checked)}
                    />
                );
            }
        },
        {
            header: 'bin name',
            accessorKey: 'binName',
            enableSorting: true,
            cell: ({ row }) => {
                const id = row.original._id;
                const name = row.getValue("binName");
                return (
                    <Link className="flex gap-2 items-center"
                        to={`/bins/${id}`}>
                        <LinkIcon size={14} /> <span>{name}</span>
                    </Link>
                );
            },
        },
        {
            header: 'location',
            accessorKey: 'location.coordinates',
            cell: ({ row }) => {
                const coords = row.original.location.coordinates;
                const id = row.original._id;
                return (
                    <Link
                        to={`/bins/map?binId=${id}&zoom=18`}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-row gap-2 text-primary">
                                    <MapPin size={18} />
                                    <span>{coords.join(", ")}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                Locate the bin on the map
                            </TooltipContent>
                        </Tooltip>
                    </Link>
                )
            }
        },
        {
            header: 'fill level',
            accessorKey: 'status.level',
        },
        {
            header: 'health',
            accessorKey: 'status.health',
            cell: ({ row }) => {
                const health = row.original.status.health;
                return (
                    <Badge variant={getVariant(health)}
                    >
                        {health}
                    </Badge>
                );
            },
        },
        {
            header: 'battery',
            accessorKey: 'status.battery',
            cell: ({ row }) => {
                return <Battery level={row.original.status.battery} />
            }
        },
        {
            header: 'maintenance',
            accessorKey: 'maintenance.lastServiceAt',
            cell: ({ row }) => {
                return format(new Date(row.original.maintenance.lastServiceAt), 'yyyy-MM-dd HH:mm')
            },
        },
    ]

    function ActionButton() {
        const [deleteInput, setDeleteInput] = useState('')

        return <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
            <DialogTrigger asChild>
                <Button variant='destructive' className={'cursor-pointer'}><Trash /> Delete {binIds.length} Bins</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Permanent Deletion</DialogTitle>
                    <DialogDescription>This action will permanently delete the bin. To confirm, type "Delete" in the field below.
                        This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}>Type: 'Delete' to enable deletion</InputLabel>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button disabled={isDeleting} className="cursor-pointer" variant='outline'>Cancel</Button>
                    </DialogClose>
                    <Button className="cursor-pointer" disabled={deleteInput.toLowerCase() !== 'delete' || isDeleting} variant='destructive' onClick={() => deleteBins({ binIds })
                    }>{isDeleting ? <Spinner /> : 'Delete'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    }


    return (
        <div className="p-10">
            <DataTable columns={columns} data={allBins ?? []} isLoading={isLoadingBins} error={binsError} title='bins list' ActionButton={allBins.length && binIds.length ? ActionButton : null} />
        </div>
    )
}

export default BinsList
