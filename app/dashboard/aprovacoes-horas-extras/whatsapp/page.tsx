"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, BarChart3, MessageSquare, Send, CheckCircle2, XCircle, Clock, AlertCircle, QrCode, RefreshCw, Loader2, Shield } from "lucide-react"
import { WhatsAppConfiguracao } from "@/components/whatsapp-configuracao"
import { WhatsAppRelatorios } from "@/components/whatsapp-relatorios"
import { createInstance, getQRCode, getConnectionState, syncInstanceStatus, getInstance, deleteInstance, type WhatsAppInstance } from '@/lib/whatsapp-evolution-service'
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useRouter } from "next/navigation"

export default function WhatsAppAprovacoesPage() {
  const [activeTab, setActiveTab] = useState("conexao")
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  const router = useRouter()
  
  // Estados para WhatsApp Evolution API - MOVER TODOS OS HOOKS ANTES DE QUALQUER RETURN
  const [whatsappInstance, setWhatsappInstance] = useState<WhatsAppInstance | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [criandoInstancia, setCriandoInstancia] = useState(false)
  const [obtendoQRCode, setObtendoQRCode] = useState(false)
  const [deletandoInstancia, setDeletandoInstancia] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Função para carregar instância WhatsApp - definida antes dos useEffect
  const carregarInstanciaWhatsApp = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[WhatsApp] Buscando instância do sistema (sem userId)')
      const instance = await getInstance().catch(err => {
        console.error('[WhatsApp] Erro ao buscar instância:', err)
        // Se for 404, não é erro crítico (pode não existir instância ainda)
        if (err.message?.includes('404') || err.message?.includes('não encontrada')) {
          return null
        }
        throw err
      })
      console.log('[WhatsApp] Instância encontrada:', instance)
      
      if (instance) {
        // Sincronizar status ao carregar apenas se não estiver em loading
        if (!loadingRef.current) {
          loadingRef.current = true
          try {
            const syncedInstance = await syncInstanceStatus()
            if (syncedInstance) {
              console.log('[WhatsApp] Status sincronizado:', syncedInstance.status)
              setWhatsappInstance(syncedInstance)
              
              if (syncedInstance.status === 'connecting' && syncedInstance.qr_code) {
                // Limpar vírgulas do QR code se vier nesse formato
                const cleanQrCode = syncedInstance.qr_code.includes(',') 
                  ? syncedInstance.qr_code.split(',')[0] 
                  : syncedInstance.qr_code
                setQrCode(cleanQrCode)
              }
              
              if (syncedInstance.status === 'connected') {
                console.log('[WhatsApp] Instância conectada:', syncedInstance.phone_number)
              }
            } else {
              // Se não retornou sincronizado, usar a instância original
              setWhatsappInstance(instance)
              if (instance.status === 'connecting' && instance.qr_code) {
                // Limpar vírgulas do QR code se vier nesse formato
                const cleanQrCode = instance.qr_code.includes(',') 
                  ? instance.qr_code.split(',')[0] 
                  : instance.qr_code
                setQrCode(cleanQrCode)
              }
            }
            loadingRef.current = false
          } catch (syncError) {
            console.error('[WhatsApp] Erro ao sincronizar, usando instância original:', syncError)
            setWhatsappInstance(instance)
            if (instance.status === 'connecting' && instance.qr_code) {
              // Limpar vírgulas do QR code se vier nesse formato
              const cleanQrCode = instance.qr_code.includes(',') 
                ? instance.qr_code.split(',')[0] 
                : instance.qr_code
              setQrCode(cleanQrCode)
            }
            loadingRef.current = false
          }
        } else {
          // Se já está em loading, apenas usar a instância sem sincronizar
          setWhatsappInstance(instance)
          if (instance.status === 'connecting' && instance.qr_code) {
            const cleanQrCode = instance.qr_code.includes(',') 
              ? instance.qr_code.split(',')[0] 
              : instance.qr_code
            setQrCode(cleanQrCode)
          }
        }
      } else {
        console.log('[WhatsApp] Nenhuma instância encontrada')
      }
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao carregar instância:', error)
      // Não mostrar erro se for apenas "não encontrado"
      if (!error.message?.includes('não encontrada') && !error.message?.includes('not found')) {
        setError(error.message || 'Erro ao carregar instância WhatsApp')
      }
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Verificar se é Admin - redirecionar se não for
  useEffect(() => {
    if (user && !isAdmin()) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, router])
  
  // Carregar instância ao montar componente (única do sistema) - apenas uma vez
  // IMPORTANTE: Este useEffect deve ser chamado ANTES de qualquer return condicional
  useEffect(() => {
    // Só carregar se for admin e tiver usuário
    if ((!user || !isAdmin()) || dadosIniciaisCarregados || loadingRef.current) {
      return
    }
    
    loadingRef.current = true
    console.log('[WhatsApp] Carregando instância do sistema')
    carregarInstanciaWhatsApp().finally(() => {
      setDadosIniciaisCarregados(true)
      loadingRef.current = false
    })
  }, [dadosIniciaisCarregados, user, isAdmin, carregarInstanciaWhatsApp])

  // Polling para status de conexão (otimizado para evitar múltiplas chamadas)
  // IMPORTANTE: Este useEffect deve ser chamado ANTES de qualquer return condicional
  useEffect(() => {
    // Só executar se for admin e tiver dados carregados
    if (!user || !isAdmin() || !whatsappInstance || !dadosIniciaisCarregados) {
      return
    }
    
    // Limpar timer anterior se existir
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
      syncTimerRef.current = null
    }
    
    // Se já está conectado, verificar uma vez com debounce
    if (whatsappInstance.status === 'connected') {
      syncTimerRef.current = setTimeout(() => {
        if (!loadingRef.current) {
          loadingRef.current = true
          syncInstanceStatus().then(updated => {
            if (updated) {
              setWhatsappInstance(updated)
            }
          }).catch(err => console.error('Erro ao sincronizar status conectado:', err))
          .finally(() => {
            loadingRef.current = false
          })
        }
      }, 1000) // Debounce de 1 segundo
      return () => {
        if (syncTimerRef.current) {
          clearTimeout(syncTimerRef.current)
          syncTimerRef.current = null
        }
      }
    }
    
    // Se está conectando, fazer polling (mas com controle)
    if (whatsappInstance.status === 'connecting') {
      const interval = setInterval(async () => {
        if (!loadingRef.current) {
          loadingRef.current = true
          try {
            const updated = await syncInstanceStatus()
            if (updated) {
              console.log('[WhatsApp] Status atualizado:', updated.status)
              setWhatsappInstance(updated)
              if (updated.status !== 'connecting') {
                console.log('[WhatsApp] Conexão concluída, parando polling')
                clearInterval(interval)
              }
            }
          } catch (error) {
            console.error('Erro ao sincronizar status:', error)
          } finally {
            loadingRef.current = false
          }
        }
      }, 5000) // Polling a cada 5 segundos
      
      return () => {
        clearInterval(interval)
        if (syncTimerRef.current) {
          clearTimeout(syncTimerRef.current)
          syncTimerRef.current = null
        }
      }
    }
  }, [whatsappInstance?.status, whatsappInstance?.id, dadosIniciaisCarregados, user, isAdmin])
  
  // Se não for Admin, não renderizar nada (APÓS TODOS OS HOOKS)
  if (!user || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissão para acessar esta página. Apenas administradores podem acessar as configurações do WhatsApp.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const criarInstanciaWhatsApp = async () => {
    setCriandoInstancia(true)
    setError(null)
    
    try {
      // Primeiro, tentar carregar instância existente
      const existingInstance = await getInstance()
      
      if (existingInstance) {
        // Instância já existe, usar ela
        setWhatsappInstance(existingInstance)
        
        // Se estiver desconectada ou conectando, obter QR code
        if (existingInstance.status === 'disconnected' || existingInstance.status === 'connecting') {
          await obterQRCodeWhatsApp(existingInstance.instance_name)
        }
      } else {
        // Criar nova instância
        try {
          const instance = await createInstance()
          setWhatsappInstance(instance)
          
          // Obter QR code imediatamente após criar
          await obterQRCodeWhatsApp(instance.instance_name)
        } catch (createError: any) {
          // Se der erro de "já existe", tentar carregar novamente
          if (createError.message?.includes('já existe') || createError.message?.includes('already exists')) {
            const existingInstance = await getInstance()
            if (existingInstance) {
              setWhatsappInstance(existingInstance)
              if (existingInstance.status === 'disconnected' || existingInstance.status === 'connecting') {
                await obterQRCodeWhatsApp(existingInstance.instance_name)
              }
            } else {
              throw createError
            }
          } else {
            throw createError
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao criar/carregar instância:', error)
      
      // Se o erro for "Instância já existe", tentar carregar a existente
      if (error.message?.includes('já existe') || error.message?.includes('already exists')) {
        try {
          const existingInstance = await getInstance()
          if (existingInstance) {
            setWhatsappInstance(existingInstance)
            // Obter QR code se necessário
            if (existingInstance.status === 'disconnected' || existingInstance.status === 'connecting') {
              await obterQRCodeWhatsApp(existingInstance.instance_name)
            }
          } else {
            setError('Instância já existe mas não foi possível carregá-la. Tente novamente.')
          }
        } catch (loadError: any) {
          setError(error.message || 'Erro ao criar/carregar instância WhatsApp')
        }
      } else {
        setError(error.message || 'Erro ao criar instância WhatsApp')
      }
    } finally {
      setCriandoInstancia(false)
    }
  }
  
  const obterQRCodeWhatsApp = async (instanceName?: string) => {
    if (!whatsappInstance && !instanceName) {
      setError('Instância não encontrada')
      return
    }
    
    const name = instanceName || whatsappInstance?.instance_name
    if (!name) return
    
    setObtendoQRCode(true)
    setError(null)
    
    try {
      const qr = await getQRCode(name)
      if (qr) {
        // Limpar vírgulas do QR code se vier nesse formato
        const cleanQrCode = qr.includes(',') ? qr.split(',')[0] : qr
        setQrCode(cleanQrCode)
        // Atualizar instância com QR code
        if (whatsappInstance) {
          setWhatsappInstance({
            ...whatsappInstance,
            qr_code: qr,
            status: 'connecting'
          })
        }
      } else {
        setError('QR code não disponível. A instância pode já estar conectada.')
        // Verificar status de conexão
        if (whatsappInstance) {
          const connectionState = await getConnectionState(name)
          if (connectionState.state === 'open') {
            await syncInstanceStatus()
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao obter QR code:', error)
      setError(error.message || 'Erro ao obter QR code')
    } finally {
      setObtendoQRCode(false)
    }
  }

  const deletarInstanciaWhatsApp = async () => {
    if (!whatsappInstance) return
    
    if (!confirm('Tem certeza que deseja deletar esta instância WhatsApp? Esta ação não pode ser desfeita.')) {
      return
    }
    
    setDeletandoInstancia(true)
    setError(null)
    
    try {
      await deleteInstance(whatsappInstance.instance_name)
      console.log('[WhatsApp] Instância deletada com sucesso')
      
      // Limpar estados
      setWhatsappInstance(null)
      setQrCode(null)
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao deletar instância:', error)
      setError(error.message || 'Erro ao deletar instância')
    } finally {
      setDeletandoInstancia(false)
    }
  }

  return (
    <div className="space-y-6 p-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp - Aprovações</h1>
        <p className="text-gray-600 mt-2">
          Configure e monitore o envio de mensagens WhatsApp para aprovação de horas extras
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conexao" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conexão
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Relatórios e Logs
          </TabsTrigger>
        </TabsList>

        {/* Tab: Conexão WhatsApp */}
        <TabsContent value="conexao" className="!mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conexão WhatsApp (Evolution API)
              </CardTitle>
              <CardDescription>
                Configure sua instância WhatsApp para receber notificações de aprovações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : !whatsappInstance ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Crie uma instância WhatsApp para receber notificações de aprovações diretamente no seu WhatsApp.
                  </p>
                  <Button
                    onClick={criarInstanciaWhatsApp}
                    disabled={criandoInstancia}
                    className="w-full"
                  >
                    {criandoInstancia ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando instância...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Criar Instância WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status da Instância */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700">Instância WhatsApp</Label>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {whatsappInstance.instance_name === 'sistema-whatsapp' 
                          ? 'Sistema WhatsApp' 
                          : whatsappInstance.instance_name.startsWith('user-')
                          ? `Instância: ${whatsappInstance.instance_name.replace('user-', '').substring(0, 8)}...`
                          : whatsappInstance.instance_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {whatsappInstance.status === 'connected' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {whatsappInstance.status === 'connecting' && (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      )}
                      {whatsappInstance.status === 'disconnected' && (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-semibold ${
                        whatsappInstance.status === 'connected' ? 'text-green-600' :
                        whatsappInstance.status === 'connecting' ? 'text-blue-600' :
                        'text-gray-400'
                      }`}>
                        {whatsappInstance.status === 'connected' ? 'Conectado' :
                         whatsappInstance.status === 'connecting' ? 'Conectando...' :
                         'Desconectado'}
                      </span>
                    </div>
                  </div>

                  {/* Número do WhatsApp quando conectado */}
                  {whatsappInstance.phone_number && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-green-900">Número Conectado</Label>
                          <p className="text-lg font-semibold text-green-700 mt-1">
                            {whatsappInstance.phone_number.length > 10 
                              ? `+${whatsappInstance.phone_number.substring(0, 2)} (${whatsappInstance.phone_number.substring(2, 4)}) ${whatsappInstance.phone_number.substring(4, 9)}-${whatsappInstance.phone_number.substring(9)}`
                              : whatsappInstance.phone_number}
                          </p>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  )}

                  {/* QR Code */}
                  {whatsappInstance.status === 'connecting' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">QR Code para Conexão</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => obterQRCodeWhatsApp()}
                          disabled={obtendoQRCode}
                        >
                          {obtendoQRCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {qrCode ? (
                        <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-lg border">
                          <div className="p-4 bg-white rounded-lg">
                            <img
                              src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                              alt="QR Code WhatsApp"
                              className="w-64 h-64"
                              onError={(e) => {
                                console.error('[WhatsApp] Erro ao carregar QR code:', qrCode.substring(0, 100))
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                          <p className="text-sm text-center text-gray-600">
                            Escaneie este QR code com o WhatsApp para conectar
                          </p>
                          <p className="text-xs text-center text-gray-500">
                            O QR code expira em aproximadamente 2 minutos
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-dashed">
                          <div className="flex flex-col items-center space-y-2">
                            <QrCode className="h-8 w-8 text-gray-400" />
                            <p className="text-sm text-gray-600">QR code não disponível</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => obterQRCodeWhatsApp()}
                              disabled={obtendoQRCode}
                            >
                              {obtendoQRCode ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Obtendo...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Obter QR Code
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botão para obter novo QR code se desconectado */}
                  {whatsappInstance.status === 'disconnected' && (
                    <Button
                      variant="outline"
                      onClick={() => obterQRCodeWhatsApp()}
                      disabled={obtendoQRCode}
                      className="w-full"
                    >
                      {obtendoQRCode ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Obtendo QR Code...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Obter QR Code para Conectar
                        </>
                      )}
                    </Button>
                  )}

                  {/* Botão para deletar instância */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={deletarInstanciaWhatsApp}
                      disabled={deletandoInstancia}
                      className="w-full"
                    >
                      {deletandoInstancia ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deletando...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Deletar Instância
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Esta ação removerá permanentemente a instância WhatsApp
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="configuracoes" className="!mt-0 !p-0">
          <WhatsAppConfiguracao />
        </TabsContent>

        {/* Tab: Relatórios */}
        <TabsContent value="relatorios" className="!mt-0 !p-0">
          <WhatsAppRelatorios />
        </TabsContent>
      </Tabs>
    </div>
  )
}

