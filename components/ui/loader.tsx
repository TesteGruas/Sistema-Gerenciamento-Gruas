"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
  fullScreen?: boolean
  variant?: "default" | "card" | "inline" | "button"
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6", 
  lg: "w-8 h-8",
  xl: "w-12 h-12"
}

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg", 
  xl: "text-xl"
}

export function Loader({ 
  size = "md", 
  text, 
  className,
  fullScreen = false,
  variant = "default"
}: LoaderProps) {
  const baseClasses = "flex items-center gap-2"
  const iconClasses = cn("animate-spin", sizeClasses[size])
  const textClasses = cn(textSizeClasses[size], "text-gray-600")

  if (variant === "button") {
    return (
      <>
        <Loader2 className={cn(iconClasses, "mr-2")} />
        {text}
      </>
    )
  }

  if (variant === "inline") {
    return (
      <Loader2 className={cn(iconClasses, "text-gray-400", className)} />
    )
  }

  if (variant === "card") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className={cn(baseClasses, className)}>
          <Loader2 className={iconClasses} />
          {text && <span className={textClasses}>{text}</span>}
        </div>
      </div>
    )
  }

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={cn(baseClasses, className)}>
          <Loader2 className={iconClasses} />
          {text && <span className={textClasses}>{text}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(baseClasses, className)}>
      <Loader2 className={iconClasses} />
      {text && <span className={textClasses}>{text}</span>}
    </div>
  )
}

// Componentes específicos para casos comuns
export function PageLoader({ text = "Carregando..." }: { text?: string }) {
  return <Loader size="lg" text={text} fullScreen />
}

export function CardLoader({ text = "Carregando..." }: { text?: string }) {
  return <Loader size="md" text={text} variant="card" />
}

export function InlineLoader({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return <Loader size={size} variant="inline" />
}

export function ButtonLoader({ text, size = "sm" }: { text: string; size?: "sm" | "md" | "lg" }) {
  return <Loader size={size} text={text} variant="button" />
}

export default Loader
