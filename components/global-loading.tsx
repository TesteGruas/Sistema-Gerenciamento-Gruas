'use client'

import { useState, useEffect, useRef } from 'react'
import { Loading } from '@/components/ui/loading'

interface GlobalLoadingProps {
  show: boolean
  message?: string
}

export function GlobalLoading({ show, message = "Carregando..." }: GlobalLoadingProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (show) {
      // Registrar o tempo de início
      startTimeRef.current = Date.now()
      
      // Configurar timeout de 5 segundos para recarregar a página
      timeoutRef.current = setTimeout(() => {
        console.warn('⚠️ [Loading] Timeout de 5s atingido. Recarregando página...')
        window.location.reload()
      }, 5000)
    } else {
      // Limpar timeout se o loading foi desativado antes de 5s
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current
        console.log(`✅ [Loading] Carregamento concluído em ${duration}ms`)
        startTimeRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [show])

  if (!show) return null

  return (
    <div 
      className="fixed inset-0 bg-white/95 backdrop-blur-md z-[9999] flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center gap-4" style={{ pointerEvents: 'auto' }}>
        <Loading size="lg" text={message} />
        <p className="text-gray-600 text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}

// Hook para gerenciar loading global
export function useGlobalLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("Carregando...")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const showLoading = (msg?: string) => {
    if (msg) setMessage(msg)
    setIsLoading(true)
    
    // Registrar o tempo de início
    startTimeRef.current = Date.now()
    
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Configurar timeout de 5 segundos para recarregar a página
    timeoutRef.current = setTimeout(() => {
      console.warn('⚠️ [Loading] Timeout de 5s atingido. Recarregando página...')
      window.location.reload()
    }, 5000)
  }

  const hideLoading = () => {
    setIsLoading(false)
    
    // Limpar timeout se o loading foi desativado antes de 5s
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current
      console.log(`✅ [Loading] Carregamento concluído em ${duration}ms`)
      startTimeRef.current = null
    }
  }

  // Limpar timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return {
    isLoading,
    message,
    showLoading,
    hideLoading,
    setMessage
  }
}
