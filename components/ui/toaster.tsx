"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle, Info, AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: string, title?: string) => {
    if (variant === "destructive") {
      if (title?.includes("Credenciais") || title?.includes("Email ou senha")) {
        return <AlertCircle className="h-5 w-5 text-red-500" />
      }
      if (title?.includes("Email não confirmado")) {
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      }
      if (title?.includes("Muitas tentativas")) {
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      }
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    
    if (title?.includes("Erro de conexão") || title?.includes("Tempo limite")) {
      return <WifiOff className="h-5 w-5 text-orange-500" />
    }
    
    if (title?.includes("Login realizado") || title?.includes("sucesso")) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    
    return <Info className="h-5 w-5 text-blue-500" />
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} className={cn(
            "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all",
            variant === "destructive" && "border-red-200 bg-red-50 text-red-900",
            variant === "default" && "border-blue-200 bg-blue-50 text-blue-900"
          )}>
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(variant, title)}
            </div>
            <div className="flex-1 grid gap-1">
              {title && (
                <ToastTitle className="text-sm font-semibold leading-none tracking-tight">
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-sm opacity-90 leading-relaxed">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
