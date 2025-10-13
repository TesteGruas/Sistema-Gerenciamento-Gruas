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
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 border">
        <Loading size="lg" text={message} />
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
