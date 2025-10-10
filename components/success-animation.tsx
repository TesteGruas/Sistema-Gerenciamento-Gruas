"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuccessAnimationProps {
  show: boolean
  message?: string
  onComplete?: () => void
  duration?: number
}

export function SuccessAnimation({ 
  show, 
  message = "Sucesso!",
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 animate-in zoom-in duration-500">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-green-100 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h3 className="mt-6 text-2xl font-bold text-gray-900">{message}</h3>
        </div>
      </div>
    </div>
  )
}

