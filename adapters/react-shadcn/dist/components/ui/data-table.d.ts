import * as React from "react";
import { type RowData } from "@tanstack/react-table";
import { type LegacyColumnDef } from "@tanstack/react-table/legacy";
interface DataTableProps<TData extends RowData, TValue = unknown> {
    columns: LegacyColumnDef<TData, TValue>[];
    data: TData[];
    /** Optional key reserved for keyed search / future column-scoped filtering. */
    searchKey?: string;
    filterPlaceholder?: string;
    /** Custom actions rendered beside the search input in the toolbar. */
    toolbar?: React.ReactNode;
    /** Whether to render the built-in pagination footer. Defaults to true. */
    pagination?: boolean;
}
export declare function DataTable<TData extends RowData, TValue = unknown>({ columns, data, filterPlaceholder, toolbar, pagination, }: DataTableProps<TData, TValue>): React.JSX.Element;
export {};
//# sourceMappingURL=data-table.d.ts.map