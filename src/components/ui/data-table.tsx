import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type ColumnDef,
  type HeaderContext,
  flexRender
} from "@tanstack/react-table"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
}

export function DataTable<TData>({
  columns,
  data,
}: DataTableProps<TData>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.id)}>
                {typeof column.header === "function"
                  ? flexRender(column.header, {
                      column,
                      header: column.header,
                      table: { options: {} },
                    } as HeaderContext<TData, unknown>)
                  : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={String(column.id)}>
                  {column.cell
                    ? flexRender(column.cell, {
                        getValue: () => {
                          if (typeof column.accessorFn === "function") {
                            return column.accessorFn(row, rowIndex)
                          }
                          return column.accessorKey
                            ? row[column.accessorKey as keyof TData]
                            : undefined
                        },
                        row: { original: row },
                        column,
                        table: { options: {} },
                      })
                    : column.accessorKey
                      ? String(row[column.accessorKey as keyof TData])
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}