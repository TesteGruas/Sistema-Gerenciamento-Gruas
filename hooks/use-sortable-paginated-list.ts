"use client"

import { useEffect, useRef } from "react"
import { useTableSort, type UseTableSortOptions } from "@/hooks/use-table-sort"

/** Ordenação client-side + reset de página ao mudar coluna (sem refetch de API). */
export function useSortablePaginatedList(
  onPageReset: () => void,
  sortOptions?: UseTableSortOptions,
) {
  const tableSort = useTableSort(sortOptions)
  const prevSortKeyRef = useRef(`${tableSort.sortColumn ?? ""}:${tableSort.sortDirection}`)
  const onPageResetRef = useRef(onPageReset)
  onPageResetRef.current = onPageReset

  useEffect(() => {
    const sortKey = `${tableSort.sortColumn ?? ""}:${tableSort.sortDirection}`
    if (prevSortKeyRef.current !== sortKey) {
      prevSortKeyRef.current = sortKey
      onPageResetRef.current()
    }
  }, [tableSort.sortColumn, tableSort.sortDirection])

  return tableSort
}
