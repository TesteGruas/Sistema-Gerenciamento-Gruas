"use client"

import { useEffect } from "react"

/**
 * Componente para tratar erros de carregamento de chunks do Next.js
 * Recarrega automaticamente a página quando um chunk não é encontrado
 * Também trata erros de dependências circulares e inicialização
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    // Handler global para erros de chunk
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error
      
      // Verificar se é um ChunkLoadError
      if (
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Failed to fetch dynamically imported module')
      ) {
        // Ignorar erros de chunks de rotas que não existem ou não são mais necessárias
        const errorMessage = error?.message || ''
        if (errorMessage.includes('validar-obra')) {
          console.warn('ChunkLoadError para rota validar-obra ignorado (rota pode não ser mais necessária)')
          return
        }
        
        console.warn('ChunkLoadError detectado, recarregando página...', error)
        
        // Recarregar a página após um pequeno delay
        setTimeout(() => {
          window.location.reload()
        }, 100)
        return
      }
      
      // Verificar se é um erro de inicialização (dependência circular)
      if (
        error?.name === 'ReferenceError' &&
        (
          error?.message?.includes('Cannot access') ||
          error?.message?.includes('before initialization') ||
          error?.message?.includes('is not defined')
        )
      ) {
        console.warn('Erro de inicialização detectado, tentando recarregar página...', error)
        
        // Tentar recarregar após um delay maior para dar tempo de resolver
        setTimeout(() => {
          // Limpar cache do service worker se disponível
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            caches.keys().then(cacheNames => {
              return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
            }).catch(() => {
              // Ignorar erros ao limpar cache
            }).finally(() => {
              window.location.reload()
            })
          } else {
            window.location.reload()
          }
        }, 500)
        return
      }
    }

    // Handler para Promise rejections (chunks que falham ao carregar)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      
      if (
        reason?.name === 'ChunkLoadError' ||
        reason?.message?.includes('Loading chunk') ||
        reason?.message?.includes('Failed to fetch dynamically imported module')
      ) {
        // Ignorar erros de chunks de rotas que não existem ou não são mais necessárias
        const errorMessage = reason?.message || ''
        if (errorMessage.includes('validar-obra')) {
          console.warn('ChunkLoadError para rota validar-obra ignorado (rota pode não ser mais necessária)')
          event.preventDefault()
          return
        }
        
        console.warn('ChunkLoadError em Promise rejection, recarregando página...', reason)
        event.preventDefault()
        
        setTimeout(() => {
          window.location.reload()
        }, 100)
        return
      }
      
      // Tratar erros de inicialização em promises
      if (
        reason?.name === 'ReferenceError' &&
        (
          reason?.message?.includes('Cannot access') ||
          reason?.message?.includes('before initialization')
        )
      ) {
        console.warn('Erro de inicialização em Promise, recarregando página...', reason)
        event.preventDefault()
        
        setTimeout(() => {
          window.location.reload()
        }, 500)
        return
      }
    }

    // Adicionar listeners
    window.addEventListener('error', handleChunkError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}

