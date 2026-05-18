/**
 * Aplica ordenação segura em queries Supabase (.order).
 * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
 * @param {{
 *   sortBy?: string | null,
 *   sortOrder?: string | null,
 *   allowedColumns: string[],
 *   defaultColumn?: string,
 *   defaultAscending?: boolean,
 * }} options
 */
export function applyListSort(query, options) {
  const {
    sortBy,
    sortOrder,
    allowedColumns,
    defaultColumn = 'created_at',
    defaultAscending = false,
  } = options

  const allowed = new Set(allowedColumns)
  let column = defaultColumn
  let ascending = defaultAscending

  if (sortBy && allowed.has(sortBy)) {
    column = sortBy
    ascending = sortOrder === 'asc' || sortOrder === 'ASC'
  } else if (sortBy && !allowed.has(sortBy)) {
    // coluna inválida — mantém default
  }

  if (!allowed.has(column)) {
    column = allowedColumns[0] || defaultColumn
  }

  return query.order(column, { ascending })
}

/**
 * Extrai sort_by e sort_order de req.query com defaults.
 */
export function parseSortQuery(req, defaults = {}) {
  return {
    sortBy: req.query.sort_by || defaults.sortBy || null,
    sortOrder: req.query.sort_order || defaults.sortOrder || null,
  }
}

function resolveSortColumn(sortBy, sortOrder, allowedColumns, defaultColumn, defaultAscending) {
  const allowed = new Set(allowedColumns)
  let column = defaultColumn
  let ascending = defaultAscending
  if (sortBy && allowed.has(sortBy)) {
    column = sortBy
    ascending = sortOrder === 'asc' || sortOrder === 'ASC'
  }
  if (!allowed.has(column)) {
    column = allowedColumns[0] || defaultColumn
  }
  return { column, ascending }
}

/** Ordena array em memória (rotas com paginação manual). */
export function sortRecordsInMemory(
  records,
  { sortBy, sortOrder, allowedColumns, defaultColumn, defaultAscending = false },
) {
  const { column, ascending } = resolveSortColumn(
    sortBy,
    sortOrder,
    allowedColumns,
    defaultColumn,
    defaultAscending,
  )
  const dir = ascending ? 1 : -1
  return [...records].sort((a, b) => {
    const va = a?.[column]
    const vb = b?.[column]
    if (va == null && vb == null) return 0
    if (va == null) return 1 * dir
    if (vb == null) return -1 * dir
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    const da = va instanceof Date ? va : typeof va === 'string' && /^\d{4}-\d{2}-\d{2}/.test(va) ? new Date(va) : null
    const db = vb instanceof Date ? vb : typeof vb === 'string' && /^\d{4}-\d{2}-\d{2}/.test(vb) ? new Date(vb) : null
    if (da && db && !Number.isNaN(da.getTime()) && !Number.isNaN(db.getTime())) {
      return (da.getTime() - db.getTime()) * dir
    }
    return String(va).localeCompare(String(vb), 'pt-BR', { sensitivity: 'base', numeric: true }) * dir
  })
}
