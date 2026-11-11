import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { flexRender, } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useLegacyTable, } from "@tanstack/react-table/legacy";
import { ArrowDown, ArrowUp, SortV, Search } from "reicon-react";
import { Button } from "./button";
import { Input } from "./input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "./table";
export function DataTable({ columns, data, filterPlaceholder = "搜索...", toolbar, pagination = true, }) {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    // The installed @tanstack/react-table ships a rewritten public API; the
    // classic v8/v9 table behavior (sorting, global filter, pagination) lives on
    // the supported `/legacy` subpath as useLegacyTable + the get*RowModel factories.
    const table = useLegacyTable({
        data,
        columns: columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });
    const pageIndex = table.getState().pagination.pageIndex;
    return (_jsxs("div", { "data-slot": "data-table", className: "w-full space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative w-full max-w-sm flex-1", children: [_jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), _jsx(Input, { value: globalFilter, onChange: (event) => setGlobalFilter(event.target.value), placeholder: filterPlaceholder, className: "pl-8" })] }), toolbar] }), _jsxs(Table, { children: [_jsx(TableHeader, { children: table.getHeaderGroups().map((headerGroup) => (_jsx(TableRow, { children: headerGroup.headers.map((header) => {
                                const canSort = header.column.getCanSort();
                                const sorted = header.column.getIsSorted();
                                return (_jsx(TableHead, { children: header.isPlaceholder
                                        ? null
                                        : canSort
                                            ? (_jsxs(Button, { variant: "ghost", size: "sm", className: "-ml-2 h-8 px-2", onClick: () => header.column.toggleSorting(sorted === "asc"), children: [flexRender(header.column.columnDef.header, header.getContext()), sorted === "asc"
                                                        ? (_jsx(ArrowUp, {}))
                                                        : sorted === "desc"
                                                            ? (_jsx(ArrowDown, {}))
                                                            : (_jsx(SortV, { className: "opacity-50" }))] }))
                                            : (flexRender(header.column.columnDef.header, header.getContext())) }, header.id));
                            }) }, headerGroup.id))) }), _jsx(TableBody, { children: table.getRowModel().rows?.length
                            ? (table.getRowModel().rows.map((row) => (_jsx(TableRow, { "data-state": row.getIsSelected() && "selected", children: row.getVisibleCells().map((cell) => (_jsx(TableCell, { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))))
                            : (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length, className: "h-24 text-center", children: "\u6682\u65E0\u6570\u636E\u3002" }) })) })] }), pagination
                ? (_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u5171 ", table.getFilteredRowModel().rows.length, " \u6761"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => table.previousPage(), disabled: !table.getCanPreviousPage(), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["\u7B2C ", pageIndex + 1, " / ", table.getPageCount(), " \u9875"] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => table.nextPage(), disabled: !table.getCanNextPage(), children: "\u4E0B\u4E00\u9875" })] })] }))
                : null] }));
}
//# sourceMappingURL=data-table.js.map