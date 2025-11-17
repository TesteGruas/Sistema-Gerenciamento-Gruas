"use client"

import { useEffect } from "react"

/**
 * Componente para tratar erros de carregamento de chunks do Next.js
 * Recarrega automaticamente a página quando um chunk não é encontrado
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
        console.warn('ChunkLoadError detectado, recarregando página...', error)
        
        // Recarregar a página após um pequeno delay
        setTimeout(() => {
          window.location.reload()
        }, 100)
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
        console.warn('ChunkLoadError em Promise rejection, recarregando página...', reason)
        event.preventDefault()
        
        setTimeout(() => {
          window.location.reload()
        }, 100)
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

