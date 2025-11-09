'use client'

import { useState } from 'react'
import { Loading } from '@/components/ui/loading'

interface GlobalLoadingProps {
  show: boolean
  message?: string
}

export function GlobalLoading({ show, message = "Carregando..." }: GlobalLoadingProps) {
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

  const showLoading = (msg?: string) => {
    if (msg) setMessage(msg)
    setIsLoading(true)
  }

  const hideLoading = () => {
    setIsLoading(false)
  }

  return {
    isLoading,
    message,
    showLoading,
    hideLoading,
    setMessage
  }
}
