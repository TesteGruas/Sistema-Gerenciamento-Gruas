/**
 * Configuração do cliente Redis para cache
 * Sistema de Gerenciamento de Gruas
 */

import { createClient } from 'redis'

let redisClient = null

/**
 * Inicializa o cliente Redis
 * @returns {Promise<Object>} Cliente Redis
 */
export async function initRedis() {
  try {
    // Verificar se Redis está habilitado
    const redisEnabled = process.env.REDIS_ENABLED === 'true'
    
    if (!redisEnabled) {
      console.log('⚠️  Redis desabilitado (REDIS_ENABLED=false)')
      return null
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Muitas tentativas de reconexão, desabilitando cache')
            return new Error('Muitas tentativas de reconexão')
          }
          return Math.min(retries * 100, 3000)
        }
      }
    })

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis conectado')
    })

    redisClient.on('ready', () => {
      console.log('✅ Redis pronto para uso')
    })

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconectando...')
    })

    await redisClient.connect()
    
    return redisClient
  } catch (error) {
    console.error('❌ Erro ao conectar Redis:', error.message)
    console.log('⚠️  Sistema continuará sem cache')
    redisClient = null
    return null
  }
}

/**
 * Obtém o cliente Redis (pode ser null se não estiver conectado)
 * @returns {Object|null} Cliente Redis ou null
 */
export function getRedisClient() {
  return redisClient
}

/**
 * Verifica se Redis está disponível
 * @returns {boolean} True se Redis está disponível
 */
export function isRedisAvailable() {
  return redisClient !== null && redisClient.isReady
}

/**
 * Fecha a conexão Redis
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit()
      console.log('✅ Redis desconectado')
    } catch (error) {
      console.error('❌ Erro ao desconectar Redis:', error)
    }
  }
}

