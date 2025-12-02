/**
 * Middleware de cache usando Redis
 * Sistema de Gerenciamento de Gruas
 */

import { getRedisClient, isRedisAvailable } from '../config/redis.js'
import crypto from 'crypto'

/**
 * Gera uma chave de cache única baseada na URL e query params
 * @param {string} path - Caminho da requisição
 * @param {Object} query - Query parameters
 * @param {Object} params - Route parameters
 * @returns {string} Chave de cache
 */
function generateCacheKey(path, query = {}, params = {}) {
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&')
  
  const paramsString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  const keyString = `${path}?${queryString}&${paramsString}`
  const hash = crypto.createHash('md5').update(keyString).digest('hex')
  
  return `cache:${hash}`
}

/**
 * Middleware de cache para endpoints GET
 * @param {Object} options - Opções de cache
 * @param {number} options.ttl - Tempo de vida do cache em segundos (padrão: 300 = 5 minutos)
 * @param {boolean} options.skipCache - Se true, pula o cache (padrão: false)
 * @param {Function} options.keyGenerator - Função customizada para gerar chave de cache
 * @returns {Function} Middleware Express
 */
export function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutos padrão
    skipCache = false,
    keyGenerator = null
  } = options

  return async (req, res, next) => {
    // Apenas cachear requisições GET
    if (req.method !== 'GET') {
      return next()
    }

    // Se cache está desabilitado ou Redis não está disponível, pular
    if (skipCache || !isRedisAvailable()) {
      return next()
    }

    try {
      const redis = getRedisClient()
      
      // Gerar chave de cache
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : generateCacheKey(req.path, req.query, req.params)

      // Tentar obter do cache
      const cachedData = await redis.get(cacheKey)

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`)
        return res.json(JSON.parse(cachedData))
      }

      console.log(`❌ Cache MISS: ${cacheKey}`)

      // Interceptar resposta para cachear
      const originalJson = res.json.bind(res)
      res.json = function(data) {
        // Cachear apenas respostas de sucesso
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setEx(cacheKey, ttl, JSON.stringify(data))
            .catch(err => console.error('Erro ao cachear resposta:', err))
        }
        return originalJson(data)
      }

      next()
    } catch (error) {
      console.error('Erro no middleware de cache:', error)
      // Em caso de erro, continuar sem cache
      next()
    }
  }
}

/**
 * Invalida cache por padrão de chave
 * @param {string} pattern - Padrão de chave (ex: 'cache:gruas:*')
 * @returns {Promise<number>} Número de chaves invalidadas
 */
export async function invalidateCache(pattern) {
  if (!isRedisAvailable()) {
    return 0
  }

  try {
    const redis = getRedisClient()
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await redis.del(keys)
      console.log(`🗑️  Cache invalidado: ${keys.length} chaves removidas (padrão: ${pattern})`)
    }
    
    return keys.length
  } catch (error) {
    console.error('Erro ao invalidar cache:', error)
    return 0
  }
}

/**
 * Invalida todo o cache
 * @returns {Promise<number>} Número de chaves invalidadas
 */
export async function clearAllCache() {
  return invalidateCache('cache:*')
}

/**
 * Invalida cache relacionado a uma entidade específica
 * @param {string} entity - Nome da entidade (ex: 'gruas', 'obras', 'funcionarios')
 * @param {string} id - ID específico (opcional)
 * @returns {Promise<number>} Número de chaves invalidadas
 */
export async function invalidateEntityCache(entity, id = null) {
  const pattern = id 
    ? `cache:*${entity}*${id}*`
    : `cache:*${entity}*`
  
  return invalidateCache(pattern)
}

