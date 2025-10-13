'use client'

import { CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SuccessAnimationProps {
  show: boolean
  message?: string
  onComplete?: () => void
  duration?: number
}

export function SuccessAnimation({ 
  show, 
  message = 'Sucesso!', 
  onComplete,
  duration = 2000 
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 text-center shadow-xl animate-in zoom-in-50 duration-300">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500">
          <CheckCircle className="w-8 h-8 text-green-600 animate-in zoom-in-50 duration-700" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        <div className="w-8 h-1 bg-green-500 mx-auto rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}