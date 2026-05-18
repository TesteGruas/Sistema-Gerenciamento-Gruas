"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SortDirection } from "@/lib/table-sort"

export interface SortableTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Path do campo no objeto da linha (ex.: `obra.nome`), usado por `getRowValue` na ordenação client-side. */
  column: string
  label: React.ReactNode
  activeColumn: string | null
  direction: SortDirection
  onSort: (column: string) => void
  sortable?: boolean
}

export function SortableTableHead({
  column,
  label,
  activeColumn,
  direction,
  onSort,
  sortable = true,
  className,
  ...props
}: SortableTableHeadProps) {
  if (!sortable) {
    return (
      <TableHead className={className} {...props}>
        {label}
      </TableHead>
    )
  }

  const isActive = activeColumn === column
  const ariaSort = isActive
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : "none"

  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead className={cn("p-0", className)} {...props}>
      <button
        type="button"
        className={cn(
          "flex h-12 w-full items-center gap-1.5 px-2 text-left font-medium text-muted-foreground",
          "hover:bg-muted/50 hover:text-foreground",
          "cursor-pointer select-none transition-colors",
          isActive && "text-foreground",
        )}
        aria-sort={ariaSort}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onSort(column)
        }}
      >
        <span className="flex-1">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
      </button>
    </TableHead>
  )
}
