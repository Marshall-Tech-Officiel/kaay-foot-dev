import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type ColumnDef } from "@tanstack/react-table"

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
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
                {typeof column.header === 'function' 
                  ? column.header({}) 
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
                    ? column.cell({
                        getValue: () => {
                          const accessorKey = column.accessorKey as string
                          return accessorKey ? row[accessorKey as keyof TData] : undefined
                        },
                        row: { original: row }
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