"use client"

import { Button } from "@/components/ui/button"
import { Zap, Wrench } from "lucide-react"
import { useDebugMode } from "@/hooks/use-debug-mode"
import { cn } from "@/lib/utils"

interface DebugButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "outline" | "zap" | "wrench"
  className?: string
  label?: string
}

/**
 * Botão de debug que só aparece quando o modo debug está ativado
 */
export function DebugButton({ 
  onClick, 
  disabled = false, 
  variant = "zap",
  className,
  label
}: DebugButtonProps) {
  const { debugMode } = useDebugMode()

  if (!debugMode) {
    return null
  }

  const Icon = variant === "wrench" ? Wrench : Zap
  const defaultLabel = variant === "wrench" ? "Debug Campos" : "Preencher Dados"

  const variantClasses = {
    default: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300",
    outline: "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300",
    zap: "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300",
    wrench: "bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(variantClasses[variant], className)}
      title="Preencher todos os campos com dados de teste"
    >
      <Icon className="w-4 h-4 mr-2" />
      {label || defaultLabel}
    </Button>
  )
}

