"use client"

import { useToast } from "@/hooks/use-toast"
import { translateError, getErrorStyle, type UserFriendlyError } from "@/lib/error-messages"
import { Button } from "@/components/ui/button"
import { RefreshCw, Mail, ExternalLink } from "lucide-react"
import React from "react"

interface EnhancedToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

export function useEnhancedToast() {
  const { toast } = useToast()

  const showError = (error: any, options?: EnhancedToastOptions) => {
    const friendlyError = translateError(error)
    const errorStyle = getErrorStyle(friendlyError.type)
    
    // Determinar ação específica baseada no tipo de erro
    let action = options?.action
    if (!action && friendlyError.type === 'auth') {
      if (friendlyError.title.includes('Email não confirmado')) {
        action = {
          label: 'Reenviar email',
          onClick: () => {
            // TODO: Implementar reenvio de email
            console.log('Reenviando email de confirmação...')
          },
          icon: <Mail className="h-4 w-4" />
        }
      }
    }

    return toast({
      title: options?.title || friendlyError.title,
      description: options?.description || friendlyError.description,
      variant: options?.variant || "destructive",
      duration: options?.duration || 5000,
      action: action ? (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="h-8 px-2 text-xs"
        >
          {action.icon}
          {action.label}
        </Button>
      ) : undefined
    })
  }

  const showSuccess = (title: string, description?: string, options?: EnhancedToastOptions) => {
    return toast({
      title,
      description,
      variant: "default",
      duration: options?.duration || 3000,
      action: options?.action ? (
        <Button
          variant="outline"
          size="sm"
          onClick={options.action.onClick}
          className="h-8 px-2 text-xs"
        >
          {options.action.icon}
          {options.action.label}
        </Button>
      ) : undefined
    })
  }

  const showInfo = (title: string, description?: string, options?: EnhancedToastOptions) => {
    return toast({
      title,
      description,
      variant: "default",
      duration: options?.duration || 4000,
      action: options?.action ? (
        <Button
          variant="outline"
          size="sm"
          onClick={options.action.onClick}
          className="h-8 px-2 text-xs"
        >
          {options.action.icon}
          {options.action.label}
        </Button>
      ) : undefined
    })
  }

  const showNetworkError = (retryCallback?: () => void, apiUrl?: string) => {
    const apiUrlDisplay = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    return toast({
      title: "Erro de conexão",
      description: `Não foi possível conectar ao servidor (${apiUrlDisplay}). Verifique se o backend está rodando e acessível.`,
      variant: "destructive",
      duration: 8000,
      action: retryCallback ? (
        <Button
          variant="outline"
          size="sm"
          onClick={retryCallback}
          className="h-8 px-2 text-xs"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      ) : undefined
    })
  }

  const showValidationError = (field: string, message: string) => {
    return toast({
      title: `Erro em ${field}`,
      description: message,
      variant: "destructive",
      duration: 4000
    })
  }

  const showAuthError = (error: any) => {
    const friendlyError = translateError(error)
    
    let action
    if (friendlyError.title.includes('Email não confirmado')) {
      action = {
        label: 'Reenviar email',
        onClick: () => {
          // TODO: Implementar reenvio de email
          console.log('Reenviando email de confirmação...')
        },
        icon: <Mail className="h-4 w-4" />
      }
    } else if (friendlyError.title.includes('Muitas tentativas')) {
      action = {
        label: 'Ajuda',
        onClick: () => {
          // TODO: Abrir página de ajuda
          console.log('Abrindo página de ajuda...')
        },
        icon: <ExternalLink className="h-4 w-4" />
      }
    }

    return toast({
      title: friendlyError.title,
      description: friendlyError.description,
      variant: "destructive",
      duration: 6000,
      action: action ? (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="h-8 px-2 text-xs"
        >
          {action.icon}
          {action.label}
        </Button>
      ) : undefined
    })
  }

  return {
    showError,
    showSuccess,
    showInfo,
    showNetworkError,
    showValidationError,
    showAuthError,
    toast // Manter o toast original para compatibilidade
  }
}
