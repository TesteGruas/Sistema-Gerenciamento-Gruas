"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Smartphone } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class PWAErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PWA Error Boundary] Erro capturado:', error)
    console.error('[PWA Error Boundary] Error Info:', errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log do erro para debugging
    if (typeof window !== 'undefined') {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
      }
      
      // Salvar no localStorage para debugging
      try {
        const existingErrors = JSON.parse(localStorage.getItem('pwa_errors') || '[]')
        existingErrors.push(errorData)
        localStorage.setItem('pwa_errors', JSON.stringify(existingErrors.slice(-10))) // Manter apenas os últimos 10
      } catch (e) {
        console.warn('Não foi possível salvar erro no localStorage:', e)
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    window.location.href = '/pwa'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-900">
                Erro no PWA
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-gray-700 mb-2">
                  Ocorreu um erro inesperado no aplicativo.
                </p>
                <p className="text-sm text-gray-500">
                  Tente recarregar a página ou voltar ao início.
                </p>
              </div>

              {/* Detalhes do erro (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 rounded-lg p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <div className="mt-2 text-xs text-gray-600">
                    <p><strong>Erro:</strong> {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="mt-2 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Ações */}
              <div className="space-y-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Início
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
              </div>

              {/* Informações de suporte */}
              <div className="text-center text-xs text-gray-500 border-t pt-3">
                <p>Se o problema persistir, entre em contato com o suporte técnico.</p>
                <p className="mt-1">
                  Erro ID: {Date.now().toString(36)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar o error boundary em componentes funcionais
export function usePWAErrorHandler() {
  const handleError = (error: Error, errorInfo?: any) => {
    console.error('[PWA Error Handler] Erro capturado:', error)
    
    // Salvar erro para debugging
    if (typeof window !== 'undefined') {
      const errorData = {
        message: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      try {
        const existingErrors = JSON.parse(localStorage.getItem('pwa_errors') || '[]')
        existingErrors.push(errorData)
        localStorage.setItem('pwa_errors', JSON.stringify(existingErrors.slice(-10)))
      } catch (e) {
        console.warn('Não foi possível salvar erro no localStorage:', e)
      }
    }
  }

  return { handleError }
}

