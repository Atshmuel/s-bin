import { format } from "date-fns";
import DataTable from "../../components/DataTable"
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import Battery from "../../components/bins/Battary";
import { LinkIcon, MapPin, Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { useBins } from "@/hooks/bins/useBins";
import { getVariant } from "@/utils/binHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InputLabel from "@/components/InputLabel";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteBinBatch } from "@/hooks/bins/useDeleteAllBins";
import { useTranslation } from "react-i18next";
import { useAppSide } from "@/contexts/AppSideProvider";

function BinsList() {
    const { t } = useTranslation();
    const { isRight, side } = useAppSide();
    const [searchParams, setSearchParams] = useSearchParams();

    const pageFromUrl = parseInt(searchParams.get("page")) || 1;
    const [pagination, setPagination] = useState({ pageIndex: pageFromUrl - 1, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState("");

    const { allBins, totalBins, isLoadingBins, binsError } = useBins(pagination.pageIndex + 1,
        pagination.pageSize,
        searchTerm);

    const { deleteBins, isDeleting } = useDeleteBinBatch()
    const [binIds, setBinIds] = useState([]);

    useEffect(() => {
        const newPage = pagination.pageIndex + 1;
        if (pageFromUrl !== newPage) {
            setSearchParams((prev) => {
                prev.set("page", newPage.toString());
                return prev;
            });
        }
    }, [pagination.pageIndex, pageFromUrl, setSearchParams]);

    const handleSearchChange = useCallback((newSearch) => {
        if (newSearch === searchTerm) return;
        setSearchTerm(newSearch);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
        setSearchParams(prev => {
            prev.set("page", "1");
            return prev;
        });
    }, [searchTerm, setSearchParams]);

    const pageCount = useMemo(() => {
        return totalBins ? Math.ceil(totalBins / pagination.pageSize) : 0;
    }, [totalBins, pagination.pageSize]);

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
            size: 20,
            id: "Checkboxs",
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
            header: t('pages.binsList.columns.binName'),
            accessorKey: 'binName',
            id: 'Bin name',

            enableSorting: true,
            cell: ({ row }) => {
                const id = row.original._id;

                return (
                    <Link className="flex gap-2 items-center"
                        to={`/bins/${id}`}>
                        <LinkIcon size={14} /> <span>{row.original.binName}</span>
                    </Link>
                );
            },
        },
        {
            header: t('pages.binsList.columns.location'),
            accessorKey: 'Location',
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
                                {t('pages.binsList.locateBin')}
                            </TooltipContent>
                        </Tooltip>
                    </Link>
                )
            }
        },
        {
            header: t('pages.binsList.columns.fillLevel'),
            id: 'Fill level',
            accessorKey: 'status.level',
            cell: ({ row }) => {
                return `${row.original.status.level}%`
            }
        },
        {
            header: t('pages.binsList.columns.healthStatus'),
            accessorKey: 'Health',
            cell: ({ row }) => {
                const health = row.original.status.health;
                return (
                    <Badge variant={getVariant(health)}
                    >
                        {t(`levels.${health}`)}
                    </Badge>
                );
            },
        },
        {
            header: t('pages.binsList.columns.batteryLevel'),
            accessorKey: 'Battery',
            cell: ({ row }) => {
                return <Battery level={row.original.status.battery} />
            }
        },
        {
            header: t('pages.binsList.columns.lastMaintenance'),
            accessorKey: 'Last maintenance',
            cell: ({ row }) => {
                return format(new Date(row.original.maintenance.lastServiceAt), 'yyyy-MM-dd HH:mm')
            },
        },
    ]

    function ActionButton() {
        const [deleteInput, setDeleteInput] = useState('')

        return <Dialog onOpenChange={(open) => !open && setDeleteInput('')}>
            <DialogTrigger asChild>
                <Button variant='destructive' className={'cursor-pointer'}>
                    <Trash />
                    <div className="flex gap-1">
                        <span className="hidden sm:block">{t("delete")}</span>
                        <span>{binIds.length}</span>
                        <span className="hidden sm:block">{t("bins")}</span>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent side={side}>
                <DialogHeader isRight={isRight} className="pt-6">
                    <DialogTitle>{t("pages.binsList.deletion.confirmationTitle")}</DialogTitle>
                    <DialogDescription>{t("pages.binsList.deletion.confirmationDescription")}</DialogDescription>
                </DialogHeader>
                <InputLabel id='delete' placeholder=" " type='text' value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}>{t("pages.binsList.deletion.typeDelete")}</InputLabel>
                <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end">
                    <DialogClose asChild>
                        <Button disabled={isDeleting} className="cursor-pointer" variant='outline'>{t("cancel")}</Button>
                    </DialogClose>
                    <Button className="cursor-pointer" disabled={(deleteInput.toLowerCase() !== 'מחק' && deleteInput.toLowerCase() !== 'delete') || isDeleting} variant='destructive' onClick={() => deleteBins({ binIds })
                    }>{isDeleting ? <Spinner /> : t("delete")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    }


    return (
        <div className="sm:p-10">
            <DataTable columns={columns} data={allBins ?? []} isLoading={isLoadingBins} error={binsError} title={t('pages.binsList.title')} manualPagination={true} manualFiltering={true} pageCount={pageCount} pagination={pagination} onPaginationChange={setPagination}
                onSearchChange={handleSearchChange} ActionButton={allBins?.length && binIds?.length ? ActionButton : null} />
        </div>
    )
}

export default BinsList
