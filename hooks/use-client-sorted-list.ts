"use client"

import { useEffect, useMemo, useRef } from "react"
import { useTableSort, type UseTableSortOptions } from "@/hooks/use-table-sort"

export interface UseClientSortedListOptions extends UseTableSortOptions {
  /** Chamado ao mudar coluna/direção (ex.: resetar página 1 em paginação client-side). */
  onPageReset?: () => void
}

/**
 * Ordena itens no cliente (pt-BR). Não dispara API.
 * Use o array `sortedItems` no TableBody.
 */
export function useClientSortedList<T extends Record<string, unknown>>(
  items: T[],
  options: UseClientSortedListOptions = {},
) {
  const { onPageReset, ...sortOptions } = options
  const tableSort = useTableSort(sortOptions)
  const { sortColumn, sortDirection, sortClientData, toggleSort, setSort, resetSort } =
    tableSort

  const sortedItems = useMemo(
    () => sortClientData(items),
    [items, sortClientData],
  )

  const prevSortKeyRef = useRef(`${sortColumn ?? ""}:${sortDirection}`)
  useEffect(() => {
    const sortKey = `${sortColumn ?? ""}:${sortDirection}`
    if (prevSortKeyRef.current !== sortKey) {
      prevSortKeyRef.current = sortKey
      onPageReset?.()
    }
  }, [sortColumn, sortDirection, onPageReset])

  return {
    sortedItems,
    sortColumn,
    sortDirection,
    toggleSort,
    setSort,
    resetSort,
  }
}
