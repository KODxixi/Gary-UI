import * as React from "react"
import {
  flexRender,
  type ColumnDef as TableCoreColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table"
import {
  type LegacyColumnDef,
  type LegacyFeatures,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy"
import { ArrowDown, ArrowUp, SortV, Search } from "reicon-react"

import { Button } from "./button"
import { Input } from "./input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

interface DataTableProps<TData extends RowData, TValue = unknown> {
  columns: LegacyColumnDef<TData, TValue>[]
  data: TData[]
  /** Optional key reserved for keyed search / future column-scoped filtering. */
  searchKey?: string
  filterPlaceholder?: string
  /** Custom actions rendered beside the search input in the toolbar. */
  toolbar?: React.ReactNode
  /** Whether to render the built-in pagination footer. Defaults to true. */
  pagination?: boolean
}

export function DataTable<TData extends RowData, TValue = unknown>({
  columns,
  data,
  filterPlaceholder = "搜索...",
  toolbar,
  pagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  // The installed @tanstack/react-table ships a rewritten public API; the
  // classic v8/v9 table behavior (sorting, global filter, pagination) lives on
  // the supported `/legacy` subpath as useLegacyTable + the get*RowModel factories.
  const table = useLegacyTable({
    data,
    columns: columns as unknown as TableCoreColumnDef<
      LegacyFeatures,
      TData,
      unknown
    >[],
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
  })

  const pageIndex = table.getState().pagination.pageIndex

  return (
    <div data-slot="data-table" className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={filterPlaceholder}
            className="pl-8"
          />
        </div>
        {toolbar}
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : canSort
                        ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="-ml-2 h-8 px-2"
                              onClick={() =>
                                header.column.toggleSorting(sorted === "asc")
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {sorted === "asc"
                                ? (
                                    <ArrowUp />
                                  )
                                : sorted === "desc"
                                  ? (
                                      <ArrowDown />
                                    )
                                  : (
                                    <SortV className="opacity-50" />
                                  )}
                            </Button>
                          )
                        : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length
            ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
              )
            : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暂无数据。
                </TableCell>
              </TableRow>
              )}
        </TableBody>
      </Table>

      {pagination
        ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              共 {table.getFilteredRowModel().rows.length} 条
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {pageIndex + 1} / {table.getPageCount()} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                下一页
              </Button>
            </div>
          </div>
          )
        : null}
    </div>
  )
}
