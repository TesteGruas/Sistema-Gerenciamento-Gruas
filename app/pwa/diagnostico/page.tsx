"use client"

import { PWADiagnostic } from '@/components/pwa-diagnostic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Smartphone, Wifi, Server, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function PWADiagnosticoPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [userData, setUserData] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Carregar dados do usuário
    const user = localStorage.getItem('user_data')
    setUserData(user)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Mostrar loading enquanto não está no cliente
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Carregando diagnóstico...</p>
          <p className="text-gray-500 text-sm mt-2">Por favor, aguarde</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diagnóstico do PWA</h1>
            <p className="text-gray-600">Verificação de problemas e status do sistema</p>
          </div>
        </div>

        {/* Diagnóstico Principal */}
        <PWADiagnostic />

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wifi className="w-4 h-4" />
                Conexão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>API:</span>
                  <span className="text-gray-600">
                    {process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4" />
                PWA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Service Worker:</span>
                  <span className="text-green-600">
                    {isClient && 'serviceWorker' in navigator ? 'Suportado' : 'Não suportado'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Push:</span>
                  <span className="text-green-600">
                    {isClient && 'PushManager' in window ? 'Suportado' : 'Não suportado'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4" />
                Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>LocalStorage:</span>
                  <span className="text-green-600">
                    {isClient && typeof Storage !== 'undefined' ? 'Disponível' : 'Não disponível'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Usuário:</span>
                  <span className="text-gray-600">
                    {isClient && userData ? 'Logado' : 'Não logado'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.clear()
                    window.location.reload()
                  }
                }}
                className="w-full"
              >
                Limpar Cache e Recarregar
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      registrations.forEach(registration => {
                        registration.unregister()
                      })
                      window.location.reload()
                    })
                  }
                }}
                className="w-full"
              >
                Resetar Service Worker
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const errors = localStorage.getItem('pwa_errors')
                    if (errors) {
                      console.log('Erros salvos:', JSON.parse(errors))
                      alert('Erros salvos foram exibidos no console do navegador')
                    } else {
                      alert('Nenhum erro salvo encontrado')
                    }
                  }
                }}
                className="w-full"
              >
                Ver Erros Salvos
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  window.open('/pwa', '_blank')
                }}
                className="w-full"
              >
                Abrir PWA em Nova Aba
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Debug */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>URL Atual:</span>
                <span className="text-gray-600 font-mono text-xs">
                  {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User Agent:</span>
                <span className="text-gray-600 font-mono text-xs">
                  {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp:</span>
                <span className="text-gray-600 font-mono text-xs">
                  {new Date().toISOString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
