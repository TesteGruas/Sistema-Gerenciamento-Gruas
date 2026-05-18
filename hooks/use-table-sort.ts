"use client"

import { useCallback, useMemo, useState } from "react"
import {
  type SortDirection,
  type TableSortParams,
  type TableSortState,
  sortRowsClient,
  toSortParams,
} from "@/lib/table-sort"

export interface UseTableSortOptions {
  /** Coluna inicial (opcional). */
  defaultColumn?: string | null
  defaultDirection?: SortDirection
}

/**
 * Ordenação de tabelas do dashboard (somente no cliente).
 * Prefira `useClientSortedList` para expor `sortedItems` pronto para o TableBody.
 * Em páginas com paginação API: ordena apenas os itens já carregados na página atual.
 * O `column` passado ao `SortableTableHead` deve ser o path do campo no objeto da lista
 * (ex.: `obra.nome`, `cliente_nome`), igual ao usado em `getRowValue` — não IDs de exibição.
 */
export function useTableSort(options: UseTableSortOptions = {}) {
  const [state, setState] = useState<TableSortState>({
    column: options.defaultColumn ?? null,
    direction: options.defaultDirection ?? "asc",
  })

  const toggleSort = useCallback((column: string) => {
    setState((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" }
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" }
      }
      return { column: null, direction: "asc" }
    })
  }, [])

  const setSort = useCallback((column: string | null, direction: SortDirection = "asc") => {
    setState({ column, direction })
  }, [])

  const resetSort = useCallback(() => {
    setState({ column: null, direction: "asc" })
  }, [])

  const sortParams: TableSortParams = useMemo(() => toSortParams(state), [state])

  const sortClientData = useCallback(
    <T extends Record<string, unknown>>(rows: T[]): T[] =>
      sortRowsClient(rows, state.column, state.direction),
    [state.column, state.direction],
  )

  return {
    sortColumn: state.column,
    sortDirection: state.direction,
    sortParams,
    toggleSort,
    setSort,
    resetSort,
    sortClientData,
  }
}
