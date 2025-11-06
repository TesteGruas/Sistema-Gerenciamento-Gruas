/**
 * Sistema de cache simples para requisições de API
 * Melhora a performance reduzindo chamadas desnecessárias ao backend
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutos por padrão

  /**
   * Obtém dados do cache se ainda válidos
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    })
  }

  /**
   * Remove uma entrada do cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Gera uma chave de cache baseada em parâmetros
   */
  static generateKey(prefix: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return prefix
    }
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    
    return `${prefix}?${sortedParams}`
  }
}

// Instância singleton
export const apiCache = new APICache()

// Limpar cache expirado a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 10 * 60 * 1000)
}

/**
 * Wrapper para chamadas de API com cache
 */
export async function cachedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Tentar obter do cache primeiro
  const cached = apiCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Se não estiver no cache, fazer a chamada
  const data = await apiCall()
  
  // Armazenar no cache
  apiCache.set(key, data, ttl)
  
  return data
}

