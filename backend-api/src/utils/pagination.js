/**
 * Utilitários para paginação padronizada
 */

/**
 * Extrai e valida parâmetros de paginação da query string
 * @param {Object} query - Objeto req.query
 * @param {Object} options - Opções de paginação
 * @param {number} options.defaultLimit - Limite padrão (padrão: 50)
 * @param {number} options.maxLimit - Limite máximo (padrão: 100)
 * @param {number} options.defaultPage - Página padrão (padrão: 1)
 * @returns {Object} Objeto com page, limit, offset validados
 */
export function parsePagination(query, options = {}) {
  const {
    defaultLimit = 50,
    maxLimit = 100,
    defaultPage = 1
  } = options

  const page = Math.max(1, parseInt(query.page) || defaultPage)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Cria objeto de resposta de paginação padronizado
 * @param {number} page - Página atual
 * @param {number} limit - Limite por página
 * @param {number} total - Total de registros
 * @returns {Object} Objeto de paginação padronizado
 */
export function createPaginationResponse(page, limit, total) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1
  }
}

/**
 * Aplica paginação a uma query Supabase
 * @param {Object} query - Query Supabase
 * @param {number} page - Página atual
 * @param {number} limit - Limite por página
 * @returns {Object} Query com paginação aplicada
 */
export function applyPagination(query, page, limit) {
  const offset = (page - 1) * limit
  return query.range(offset, offset + limit - 1)
}

