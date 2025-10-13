'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  variant?: 'default' | 'overlay' | 'inline' | 'skeleton'
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
}

export function Loading({ 
  size = 'md', 
  text, 
  className = '',
  variant = 'default',
  fullScreen = false
}: LoadingProps) {
  const baseClasses = "flex items-center justify-center"
  const sizeClass = sizeClasses[size]
  const textClass = textSizeClasses[size]

  if (variant === 'overlay') {
    return (
      <div className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
        className
      )}>
        <div className="bg-white rounded-lg p-6 shadow-xl">
          <div className={cn(baseClasses, "flex-col gap-3")}>
            <Loader2 className={cn(sizeClass, "animate-spin text-blue-600")} />
            {text && (
              <p className={cn(textClass, "text-gray-700 font-medium")}>
                {text}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (fullScreen) {
    return (
      <div className={cn(
        "fixed inset-0 bg-white flex items-center justify-center z-50",
        className
      )}>
        <div className={cn(baseClasses, "flex-col gap-4")}>
          <Loader2 className={cn(sizeClass, "animate-spin text-blue-600")} />
          {text && (
            <p className={cn(textClass, "text-gray-700 font-medium")}>
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(baseClasses, "gap-2", className)}>
      <Loader2 className={cn(sizeClass, "animate-spin text-blue-600")} />
      {text && (
        <span className={cn(textClass, "text-gray-600")}>
          {text}
        </span>
      )}
    </div>
  )
}

// Componente específico para páginas
export function PageLoading({ text = "Carregando página..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" text={text} />
    </div>
  )
}

// Componente específico para tabelas
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}

// Componente específico para cards
export function CardLoading({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Componente específico para botões
export function ButtonLoading({ 
  children, 
  loading = false, 
  size = 'md',
  className = '' 
}: { 
  children: React.ReactNode
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (!loading) return <>{children}</>

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin")} />
      <span>{children}</span>
    </div>
  )
}

// Hook para gerenciar estados de loading
export function useLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState)
  
  const startLoading = () => setLoading(true)
  const stopLoading = () => setLoading(false)
  const toggleLoading = () => setLoading(prev => !prev)
  
  return {
    loading,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading
  }
}
