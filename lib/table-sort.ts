export type SortDirection = "asc" | "desc"

export interface TableSortState {
  column: string | null
  direction: SortDirection
}

export interface TableSortParams {
  sort_by?: string
  sort_order?: SortDirection
}

const LOCALE_OPTS: Intl.CollatorOptions = {
  sensitivity: "base",
  numeric: true,
}

/** Comparador pt-BR para strings, números e datas. */
export function compareLocalePt(
  a: unknown,
  b: unknown,
  direction: SortDirection = "asc",
): number {
  const mul = direction === "asc" ? 1 : -1

  if (a == null && b == null) return 0
  if (a == null) return 1 * mul
  if (b == null) return -1 * mul

  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mul
  }

  const da = a instanceof Date ? a : typeof a === "string" ? tryParseDate(a) : null
  const db = b instanceof Date ? b : typeof b === "string" ? tryParseDate(b) : null
  if (da && db) {
    return (da.getTime() - db.getTime()) * mul
  }

  const sa = String(a).trim()
  const sb = String(b).trim()
  return sa.localeCompare(sb, "pt-BR", LOCALE_OPTS) * mul
}

function tryParseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value) && !/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    return null
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Lê valor de linha por chave simples ou aninhada (`cliente.nome`). */
export function getRowValue<T extends Record<string, unknown>>(
  row: T,
  columnKey: string,
): unknown {
  if (!columnKey.includes(".")) {
    return row[columnKey]
  }
  return columnKey.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[key]
  }, row)
}

/** Ordena cópia do array no cliente (telas sem paginação server-side). */
export function sortRowsClient<T extends Record<string, unknown>>(
  rows: T[],
  column: string | null,
  direction: SortDirection,
): T[] {
  if (!column) return rows
  return [...rows].sort((a, b) =>
    compareLocalePt(getRowValue(a, column), getRowValue(b, column), direction),
  )
}

export function toSortParams(state: TableSortState): TableSortParams {
  if (!state.column) return {}
  return { sort_by: state.column, sort_order: state.direction }
}

export function appendSortParams(
  params: URLSearchParams,
  sort?: TableSortParams,
): void {
  if (sort?.sort_by) params.append("sort_by", sort.sort_by)
  if (sort?.sort_order) params.append("sort_order", sort.sort_order)
}
