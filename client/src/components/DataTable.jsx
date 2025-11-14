
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table"

import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { IoIosArrowRoundDown, IoIosArrowRoundUp, IoMdArrowDropdown } from "react-icons/io";
import { Skeleton } from "./ui/skeleton"
import EmptyTable from "./EmptyTable"
import { Search, X } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "./ui/badge"


export default function DataTable({ data, columns, title, maxLength = 10 }) {
    const [sorting, setSorting] = useState([])
    const [searching, setSearching] = useState("")
    const isLoading = false


    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter: searching,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setSearching,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: maxLength } },
    })
    const hasData = table.getRowModel().rows.length

    const iconToShow = searching ? X : Search


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                {title ? <h1 className="text-2xl capitalize font-bold min-w-72">{title}</h1> : null}
                <div className={`flex items-center w-full ${title ? "justify-end gap-3" : "justify-between"} `}>
                    <Input
                        withIcon={true}
                        Icon={iconToShow}
                        type="text"
                        placeholder="Search..."
                        value={searching}
                        onChange={(e) => setSearching(e.target.value)}
                        onIconClick={() => {
                            if (!searching.length > 0) return;
                            setSearching("")
                        }}
                        className="w-36 sm:w-48 relative"
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">Columns <IoMdArrowDropdown /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllLeafColumns()
                                .map(column => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={column.getIsVisible()}
                                        onCheckedChange={() => column.toggleVisibility()}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="rounded-md border">
                <Table className="relative">
                    <TableHeader className="bg-muted shadow-md text-sm sm:text-base">
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        onClick={hasData ? header.column.getToggleSortingHandler() : undefined}
                                        className={hasData ? "cursor-pointer" : ""}
                                    >
                                        <div className="capitalize flex items-center gap-2">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {hasData && {
                                                asc: <IoIosArrowRoundUp />,
                                                desc: <IoIosArrowRoundDown />,
                                            }[header.column.getIsSorted()] || null}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>


                    <TableBody className="relative">
                        {hasData && !isLoading ? (
                            table.getRowModel().rows.map(row => (

                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i} className="h-9">
                                    {columns.map((col, j) => (
                                        <TableCell key={j}>{isLoading ? <Skeleton className="h-4 w-[250px]" /> : null}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                        {!hasData ? <EmptyTable title={"No Results Found"} description={searching ? "No data found for your search." : "No data available to display at the moment."} /> : null}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                <Button
                    variant="outline"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
