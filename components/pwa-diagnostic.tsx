"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Wifi,
  WifiOff,
  Smartphone,
  Server,
  Database,
  Shield
} from 'lucide-react'

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export function PWADiagnostic() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    // 1. Verificar se está online
    if (typeof window !== 'undefined') {
      results.push({
        name: 'Conexão de Internet',
        status: navigator.onLine ? 'success' : 'error',
        message: navigator.onLine ? 'Conectado à internet' : 'Sem conexão à internet',
        details: navigator.onLine ? 'Conexão ativa' : 'Verifique sua conexão de internet'
      })
    }

    // 2. Verificar Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          results.push({
            name: 'Service Worker',
            status: 'success',
            message: 'Service Worker registrado',
            details: `Estado: ${registration.active?.state || 'N/A'}`
          })
        } else {
          results.push({
            name: 'Service Worker',
            status: 'warning',
            message: 'Service Worker não registrado',
            details: 'Tentando registrar...'
          })
        }
      } catch (error) {
        results.push({
          name: 'Service Worker',
          status: 'error',
          message: 'Erro ao verificar Service Worker',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    } else {
      results.push({
        name: 'Service Worker',
        status: 'error',
        message: 'Service Worker não suportado',
        details: 'Navegador não suporta Service Workers'
      })
    }

    // 3. Verificar localStorage
    if (typeof window !== 'undefined') {
      try {
        const testKey = 'pwa_diagnostic_test'
        localStorage.setItem(testKey, 'test')
        const retrieved = localStorage.getItem(testKey)
        localStorage.removeItem(testKey)
        
        if (retrieved === 'test') {
          results.push({
            name: 'Local Storage',
            status: 'success',
            message: 'Local Storage funcionando',
            details: 'Armazenamento local disponível'
          })
        } else {
          results.push({
            name: 'Local Storage',
            status: 'error',
            message: 'Local Storage com problemas',
            details: 'Não foi possível ler/escrever dados'
          })
        }
      } catch (error) {
        results.push({
          name: 'Local Storage',
          status: 'error',
          message: 'Local Storage indisponível',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // 4. Verificar dados do usuário
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user_data')
        const token = localStorage.getItem('access_token')
        
        if (userData && token) {
          const user = JSON.parse(userData)
          results.push({
            name: 'Dados do Usuário',
            status: 'success',
            message: 'Usuário autenticado',
            details: `Usuário: ${user.nome || 'N/A'}`
          })
        } else {
          results.push({
            name: 'Dados do Usuário',
            status: 'warning',
            message: 'Usuário não autenticado',
            details: 'Faça login para acessar o PWA'
          })
        }
      } catch (error) {
        results.push({
          name: 'Dados do Usuário',
          status: 'error',
          message: 'Erro ao verificar dados do usuário',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // 5. Verificar API
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        results.push({
          name: 'API Backend',
          status: 'success',
          message: 'API respondendo',
          details: `Status: ${response.status} - ${apiUrl}`
        })
      } else {
        results.push({
          name: 'API Backend',
          status: 'warning',
          message: 'API com problemas',
          details: `Status: ${response.status} - ${apiUrl}`
        })
      }
    } catch (error) {
      results.push({
        name: 'API Backend',
        status: 'error',
        message: 'API não acessível',
        details: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'} - ${process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}`
      })
    }

    // 6. Verificar PWA Installability
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      results.push({
        name: 'Recursos PWA',
        status: 'success',
        message: 'Recursos PWA disponíveis',
        details: 'Service Worker e Push Notifications suportados'
      })
    } else {
      results.push({
        name: 'Recursos PWA',
        status: 'warning',
        message: 'Alguns recursos PWA não disponíveis',
        details: 'Service Worker ou Push Notifications não suportados'
      })
    }

    // 7. Verificar erros salvos
    if (typeof window !== 'undefined') {
      try {
        const savedErrors = localStorage.getItem('pwa_errors')
        if (savedErrors) {
          const errors = JSON.parse(savedErrors)
          if (errors.length > 0) {
            results.push({
              name: 'Erros Salvos',
              status: 'warning',
              message: `${errors.length} erro(s) encontrado(s)`,
              details: `Último erro: ${errors[errors.length - 1]?.message || 'N/A'}`
            })
          } else {
            results.push({
              name: 'Erros Salvos',
              status: 'success',
              message: 'Nenhum erro salvo',
              details: 'Sistema funcionando normalmente'
            })
          }
        } else {
          results.push({
            name: 'Erros Salvos',
            status: 'success',
            message: 'Nenhum erro salvo',
            details: 'Sistema funcionando normalmente'
          })
        }
      } catch (error) {
        results.push({
          name: 'Erros Salvos',
          status: 'error',
          message: 'Erro ao verificar erros salvos',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  useEffect(() => {
    if (isClient) {
      runDiagnostics()
    }
  }, [isClient])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">OK</Badge>
      case 'error':
        return <Badge variant="destructive">ERRO</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">AVISO</Badge>
      default:
        return <Badge variant="outline">DESCONHECIDO</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Diagnóstico do PWA
          </CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Verificando...' : 'Verificar Novamente'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {diagnostics.map((diagnostic, index) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(diagnostic.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-sm text-gray-900">
                  {diagnostic.name}
                </h3>
                {getStatusBadge(diagnostic.status)}
              </div>
              
              <p className="text-sm text-gray-600 mb-1">
                {diagnostic.message}
              </p>
              
              {diagnostic.details && (
                <p className="text-xs text-gray-500">
                  {diagnostic.details}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {diagnostics.length === 0 && !isRunning && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum diagnóstico disponível</p>
          </div>
        )}
        
        {isRunning && (
          <div className="text-center py-8">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Executando diagnósticos...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
