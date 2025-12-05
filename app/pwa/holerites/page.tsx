"use client"

import { useState, useEffect, useCallback } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SignaturePad } from "@/components/signature-pad"
import { 
  Download, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colaboradoresDocumentosApi } from "@/lib/api-colaboradores-documentos"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import { CardLoader } from "@/components/ui/loader"
import { FileSignature } from "lucide-react"

interface Holerite {
  id: string
  funcionario_id: number
  mes_referencia: string
  arquivo: string
  assinatura_digital?: string
  assinado_por?: number
  assinado_em?: string
  recebido_em?: string
  created_at: string
  updated_at: string
}

export default function PWAHoleritesPage() {
  const { toast } = useToast()
  const [holerites, setHolerites] = useState<Holerite[]>([])
  const [loading, setLoading] = useState(false) // Iniciar como false para não bloquear
  const [isOnline, setIsOnline] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAssinaturaDialogOpen, setIsAssinaturaDialogOpen] = useState(false)
  const [isVisualizacaoDialogOpen, setIsVisualizacaoDialogOpen] = useState(false)
  const [holeriteSelecionado, setHoleriteSelecionado] = useState<Holerite | null>(null)
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string>('')
  const [isLoadingHolerites, setIsLoadingHolerites] = useState(false) // Flag para evitar múltiplas chamadas
  const [urlArquivoAssinada, setUrlArquivoAssinada] = useState<string>('')
  const [carregandoUrlArquivo, setCarregandoUrlArquivo] = useState(false)

  // Carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    console.log('[HOLERITES] Carregando dados do usuário...')
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log('[HOLERITES] Usuário carregado do localStorage:', parsedUser)
        console.log('[HOLERITES] ID do usuário:', parsedUser.id)
        setUser(parsedUser)
      } catch (error) {
        console.error('[HOLERITES] Erro ao carregar dados do usuário:', error)
      }
    } else {
      console.warn('[HOLERITES] user_data não encontrado no localStorage')
    }
  }, [])

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const carregarHolerites = useCallback(async () => {
    console.log('[HOLERITES] Iniciando carregamento de holerites...')
    setLoading(true)
    try {
      // Carregar do cache primeiro se offline
      if (!isOnline) {
        console.log('[HOLERITES] Modo offline detectado')
        const cachedHolerites = localStorage.getItem('cached_holerites')
        
        if (cachedHolerites) {
          setHolerites(JSON.parse(cachedHolerites))
          toast({
            title: "Modo Offline",
            description: "Exibindo holerites em cache. Conecte-se para atualizar.",
            variant: "default"
          })
        } else {
          setHolerites([])
          toast({
            title: "Sem conexão",
            description: "Não há holerites em cache. Conecte-se à internet para carregar seus holerites.",
            variant: "default"
          })
        }
        
        return
      }

      if (!user?.id) {
        console.error('[HOLERITES] Usuário não identificado:', user)
        throw new Error('Usuário não identificado. Faça login novamente.')
      }

      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (!token) {
        console.error('[HOLERITES] Token não encontrado no localStorage')
        console.error('[HOLERITES] Chaves disponíveis:', Object.keys(localStorage))
        throw new Error('Token de autenticação não encontrado. Faça login novamente.')
      }

      console.log('[HOLERITES] Usuário encontrado:', user.id)
      console.log('[HOLERITES] Token encontrado:', token.substring(0, 20) + '...')

      // Obter ID do funcionário
      let funcionarioId: number | null = null
      
      // Primeiro, tentar obter diretamente do user
      console.log('[HOLERITES] Dados do usuário:', {
        id: user.id,
        funcionario_id: user.funcionario_id,
        profile: user.profile,
        email: user.email
      })
      
      // Tentar múltiplas formas de obter o funcionario_id
      if (user.funcionario_id && !isNaN(Number(user.funcionario_id))) {
        funcionarioId = Number(user.funcionario_id)
        console.log('[HOLERITES] ID do funcionário encontrado no user.funcionario_id:', funcionarioId)
      } else if (user.profile?.funcionario_id && !isNaN(Number(user.profile.funcionario_id))) {
        funcionarioId = Number(user.profile.funcionario_id)
        console.log('[HOLERITES] ID do funcionário encontrado no user.profile.funcionario_id:', funcionarioId)
      } else if (user.user_metadata?.funcionario_id && !isNaN(Number(user.user_metadata.funcionario_id))) {
        funcionarioId = Number(user.user_metadata.funcionario_id)
        console.log('[HOLERITES] ID do funcionário encontrado no user.user_metadata.funcionario_id:', funcionarioId)
      } else if (user.id && !isNaN(Number(user.id)) && Number(user.id) > 100) {
        // Se user.id for numérico e parecer ser um ID de funcionário (maior que 100)
        funcionarioId = Number(user.id)
        console.log('[HOLERITES] Usando user.id como funcionario_id:', funcionarioId)
      }
      
      // Se ainda não encontrou, tentar buscar na API
      if (!funcionarioId) {
        try {
          console.log('[HOLERITES] Buscando ID do funcionário na API...')
          funcionarioId = await getFuncionarioIdWithFallback(
            user, 
            token, 
            'ID do funcionário não encontrado'
          )
          console.log('[HOLERITES] ID do funcionário encontrado na API:', funcionarioId)
        } catch (funcionarioError: any) {
          console.error('[HOLERITES] Erro ao buscar ID do funcionário na API:', funcionarioError)
          
          // Tentar buscar diretamente usando o endpoint de funcionários
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            console.log('[HOLERITES] Tentando buscar funcionário diretamente na API...')
            
            // Tentar buscar por email ou nome
            const searchParam = user.email || user.nome || ''
            if (searchParam) {
              const response = await fetch(
                `${apiUrl}/api/funcionarios?search=${encodeURIComponent(searchParam)}&limit=50`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              )
              
              if (response.ok) {
                const data = await response.json()
                const funcionarios = data.data || []
                console.log('[HOLERITES] Funcionários encontrados:', funcionarios.length)
                
                // Procurar funcionário que corresponde ao usuário
                const funcionario = funcionarios.find((f: any) => 
                  f.usuario?.id === user.id || 
                  f.usuario?.email === user.email ||
                  f.email === user.email ||
                  (f.usuario && Array.isArray(f.usuario) && f.usuario.some((u: any) => u.id === user.id))
                )
                
                if (funcionario && funcionario.id && !isNaN(Number(funcionario.id))) {
                  funcionarioId = Number(funcionario.id)
                  console.log('[HOLERITES] ID do funcionário encontrado na busca direta:', funcionarioId)
                }
              }
            }
          } catch (directSearchError) {
            console.error('[HOLERITES] Erro na busca direta:', directSearchError)
          }
          
          if (!funcionarioId) {
            if (funcionarioError?.response?.status === 403 || funcionarioError?.status === 403) {
              throw new Error('Você não tem permissão para acessar holerites')
            }
            throw new Error(funcionarioError.message || 'ID do funcionário não encontrado')
          }
        }
      }

      if (!funcionarioId) {
        console.error('[HOLERITES] ID do funcionário não encontrado após todas as tentativas')
        throw new Error('ID do funcionário não encontrado. Verifique se você está vinculado a um funcionário no sistema.')
      }

      // Buscar holerites
      console.log('[HOLERITES] Chamando API para listar holerites do funcionário:', funcionarioId)
      const response = await colaboradoresDocumentosApi.holerites.listar(funcionarioId)
      console.log('[HOLERITES] Resposta da API:', response)
        
      if (response.success && response.data) {
        // Converter formato do backend para frontend
        const holeritesFormatados = response.data.map((h: any) => ({
          id: h.id,
          funcionario_id: h.funcionario_id,
          mes_referencia: h.mes_referencia,
          arquivo: h.arquivo,
          assinatura_digital: h.assinatura_digital,
          assinado_por: h.assinado_por,
          assinado_em: h.assinado_em,
          recebido_em: h.recebido_em,
          created_at: h.created_at,
          updated_at: h.updated_at
        }))
        
        console.log('[HOLERITES] Holerites formatados:', holeritesFormatados)
        setHolerites(holeritesFormatados)
        
        // Salvar no cache
        localStorage.setItem('cached_holerites', JSON.stringify(holeritesFormatados))
      
        if (holeritesFormatados.length === 0) {
          toast({
            title: "Nenhum holerite encontrado",
            description: "Você ainda não possui holerites disponíveis.",
            variant: "default"
          })
        } else {
          console.log('[HOLERITES] Holerites carregados com sucesso:', holeritesFormatados.length)
        }
      } else {
        console.warn('[HOLERITES] Resposta da API sem sucesso ou sem dados:', response)
        setHolerites([])
        toast({
          title: "Nenhum holerite encontrado",
          description: "Você ainda não possui holerites disponíveis.",
          variant: "default"
        })
      }

    } catch (error: any) {
      console.error('[HOLERITES] Erro ao carregar holerites:', error)
      console.error('[HOLERITES] Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
        status: error.status
      })
      
      // Tentar carregar do cache em caso de erro
      const cachedHolerites = localStorage.getItem('cached_holerites')
      
      if (cachedHolerites) {
        console.log('[HOLERITES] Carregando holerites do cache devido ao erro')
        setHolerites(JSON.parse(cachedHolerites))
        toast({
          title: "Erro ao carregar holerites",
          description: error.message || "Exibindo holerites em cache. Verifique sua conexão.",
          variant: "destructive"
        })
      } else {
        setHolerites([])
        toast({
          title: "Erro ao carregar holerites",
          description: error.message || "Não foi possível carregar seus holerites. Verifique sua conexão e tente novamente.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
      console.log('[HOLERITES] Carregamento finalizado')
    }
  }, [user?.id, isOnline, toast]) // Dependências do useCallback - usar user?.id para estabilidade

  // Carregar holerites quando o usuário estiver disponível
  useEffect(() => {
    const userId = user?.id
    
    // Não carregar se ainda não temos o usuário ou ID
    if (!user || !userId) {
      console.log('[HOLERITES] useEffect: aguardando usuário...', { hasUser: !!user, userId })
      return
    }
    
    // Não carregar se já está carregando (evitar múltiplas chamadas simultâneas)
    if (isLoadingHolerites) {
      console.log('[HOLERITES] Já está carregando, ignorando...')
      return
    }
    
    console.log('[HOLERITES] ✅ Condições atendidas, iniciando carregamento...', { userId })
    setIsLoadingHolerites(true)
    carregarHolerites().finally(() => {
      setIsLoadingHolerites(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Usar apenas user?.id para estabilidade

  const formatarMesReferencia = (mesReferencia: string) => {
    try {
      const [ano, mes] = mesReferencia.split('-')
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1)
      return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    } catch {
      return mesReferencia
    }
  }

  const handleAssinar = async (holerite: Holerite) => {
    if (!assinaturaDataUrl) {
      toast({
        title: "Erro",
        description: "Por favor, assine o holerite",
        variant: "destructive"
      })
      return
    }

    try {
        await colaboradoresDocumentosApi.holerites.assinar(holerite.id, {
          assinatura_digital: assinaturaDataUrl
        })
        
        toast({
          title: "Sucesso",
          description: "Holerite assinado com sucesso"
        })
        
        // Recarregar holerites
        carregarHolerites()

      setIsAssinaturaDialogOpen(false)
      setAssinaturaDataUrl('')
      setHoleriteSelecionado(null)
    } catch (error: any) {
      console.error('Erro ao assinar holerite:', error)
      
      let errorMessage = "Erro ao assinar holerite"
      if (error?.response?.status === 401 || error?.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente."
      } else if (error?.response?.status === 403 || error?.status === 403) {
        errorMessage = "Você não tem permissão para assinar este holerite"
      } else if (error?.response?.status >= 500 || error?.status >= 500) {
        errorMessage = "Erro no servidor. Tente novamente mais tarde."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (holerite: Holerite, comAssinatura: boolean = false) => {
    try {
      if (!holerite.arquivo) {
        throw new Error('Arquivo do holerite não disponível')
      }
      
      // Se tem assinatura e usuário quer baixar com assinatura, usar nova API
      if (comAssinatura && estaAssinado(holerite)) {
        try {
          const blob = await colaboradoresDocumentosApi.holerites.baixar(holerite.id, true)
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `holerite_${holerite.mes_referencia}_assinado.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
          
          await confirmarRecebimento(holerite)
          
          toast({
            title: "Download iniciado",
            description: "O holerite assinado está sendo baixado.",
            variant: "default"
          })
          return
        } catch (apiError: any) {
          console.error('[HOLERITES] Erro ao baixar via API:', apiError)
          // Fallback para método antigo se API falhar
        }
      }
      
      // Método antigo (URL direta) - usado como fallback ou quando não quer assinatura
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      let arquivoUrl = ''
      
      // Se já for uma URL completa, usar diretamente
      if (holerite.arquivo.startsWith('http')) {
        arquivoUrl = holerite.arquivo
      } else {
        // Tentar obter URL assinada do Supabase
        try {
          const urlResponse = await fetch(
            `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(holerite.arquivo)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (urlResponse.ok) {
            const urlData = await urlResponse.json()
            arquivoUrl = urlData.url || urlData.data?.url || holerite.arquivo
          } else {
            // Fallback: tentar construir URL pública
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            if (supabaseUrl) {
              arquivoUrl = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${holerite.arquivo}`
            } else {
              arquivoUrl = `${apiUrl}/uploads/${holerite.arquivo}`
            }
          }
        } catch (error) {
          console.error('[HOLERITES] Erro ao obter URL assinada para download:', error)
          // Fallback: tentar construir URL pública
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          if (supabaseUrl) {
            arquivoUrl = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${holerite.arquivo}`
          } else {
            arquivoUrl = `${apiUrl}/uploads/${holerite.arquivo}`
          }
        }
      }
      
      // Abrir em nova aba para download
      window.open(arquivoUrl, '_blank')
      
      // Confirmar recebimento automaticamente ao baixar
      await confirmarRecebimento(holerite)
      
      toast({
        title: "Download iniciado",
        description: "O holerite está sendo baixado.",
        variant: "default"
      })
    } catch (error: any) {
      console.error('[HOLERITES] Erro ao baixar holerite:', error)
      toast({
        title: "Erro ao baixar holerite",
        description: error.message || "Não foi possível baixar o holerite",
        variant: "destructive"
      })
    }
  }

  const handleVisualizar = async (holerite: Holerite) => {
    setHoleriteSelecionado(holerite)
    setIsVisualizacaoDialogOpen(true)
    setUrlArquivoAssinada('')
    setCarregandoUrlArquivo(true)
    
    // Obter URL assinada do arquivo
    if (holerite.arquivo) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        
        // Se já for uma URL completa (http/https), usar diretamente
        if (holerite.arquivo.startsWith('http')) {
          setUrlArquivoAssinada(holerite.arquivo)
          setCarregandoUrlArquivo(false)
        } else {
          // Tentar obter URL assinada do Supabase
          try {
            const urlResponse = await fetch(
              `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(holerite.arquivo)}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (urlResponse.ok) {
              const urlData = await urlResponse.json()
              const urlAssinada = urlData.url || urlData.data?.url
              if (urlAssinada && urlAssinada.startsWith('http')) {
                console.log('[HOLERITES] URL assinada obtida com sucesso')
                setUrlArquivoAssinada(urlAssinada)
              } else {
                console.warn('[HOLERITES] URL assinada inválida, usando fallback')
                // Fallback: tentar construir URL pública
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
                if (supabaseUrl) {
                  const urlPublica = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${holerite.arquivo}`
                  console.log('[HOLERITES] Usando URL pública do Supabase:', urlPublica)
                  setUrlArquivoAssinada(urlPublica)
                } else {
                  const urlUploads = `${apiUrl}/uploads/${holerite.arquivo}`
                  console.log('[HOLERITES] Usando URL de uploads:', urlUploads)
                  setUrlArquivoAssinada(urlUploads)
                }
              }
            } else {
              console.warn('[HOLERITES] Erro ao obter URL assinada, status:', urlResponse.status)
              // Fallback: tentar construir URL pública
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
              if (supabaseUrl) {
                const urlPublica = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${holerite.arquivo}`
                console.log('[HOLERITES] Usando URL pública do Supabase (fallback):', urlPublica)
                setUrlArquivoAssinada(urlPublica)
              } else {
                const urlUploads = `${apiUrl}/uploads/${holerite.arquivo}`
                console.log('[HOLERITES] Usando URL de uploads (fallback):', urlUploads)
                setUrlArquivoAssinada(urlUploads)
              }
            }
          } catch (error) {
            console.error('[HOLERITES] Erro ao obter URL assinada:', error)
            // Fallback: tentar construir URL pública
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            if (supabaseUrl) {
              const urlPublica = `${supabaseUrl}/storage/v1/object/public/arquivos-obras/${holerite.arquivo}`
              console.log('[HOLERITES] Usando URL pública do Supabase (erro):', urlPublica)
              setUrlArquivoAssinada(urlPublica)
            } else {
              const urlUploads = `${apiUrl}/uploads/${holerite.arquivo}`
              console.log('[HOLERITES] Usando URL de uploads (erro):', urlUploads)
              setUrlArquivoAssinada(urlUploads)
            }
          }
        }
      } catch (error) {
        console.error('[HOLERITES] Erro ao processar URL do arquivo:', error)
      } finally {
        setCarregandoUrlArquivo(false)
      }
    } else {
      setCarregandoUrlArquivo(false)
    }
    
    // Confirmar recebimento ao visualizar
    await confirmarRecebimento(holerite)
  }

  const confirmarRecebimento = async (holerite: Holerite) => {
    try {
      // Se já foi recebido, não fazer nada
      if (holerite.recebido_em) {
        return
      }

      // Marcar como recebido (atualizar localmente)
      const holeritesAtualizados = holerites.map(h => 
        h.id === holerite.id 
          ? { ...h, recebido_em: new Date().toISOString() }
          : h
      )
      setHolerites(holeritesAtualizados)
      
      // Salvar no cache
      localStorage.setItem('cached_holerites', JSON.stringify(holeritesAtualizados))

      // Se online, tentar salvar no backend (opcional - pode ser apenas local)
      if (isOnline) {
        // TODO: Implementar endpoint de confirmação de recebimento no backend se necessário
        // await colaboradoresDocumentosApi.holerites.confirmarRecebimento(holerite.id)
      }

      toast({
        title: "Recebimento confirmado",
        description: `Holerite de ${formatarMesReferencia(holerite.mes_referencia)} marcado como recebido`,
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error)
      // Não mostrar erro ao usuário, pois é uma ação secundária
    }
  }

  const estaAssinado = (holerite: Holerite) => {
    return !!holerite.assinatura_digital && !!holerite.assinado_em
  }

  const estaRecebido = (holerite: Holerite) => {
    return !!holerite.recebido_em
  }

  return (
    <ProtectedRoute permission="documentos:visualizar">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Holerites</h1>
            <p className="text-sm sm:text-base text-gray-600">Visualize, baixe e assine seus holerites</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            )}
            <span className="text-xs sm:text-sm text-gray-600">
              {isOnline ? "Online" : "Offline"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={carregarHolerites}
              disabled={loading}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Status de conexão */}
        {!isOnline && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Você está offline. Os dados serão sincronizados quando a conexão for restabelecida.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Holerites */}
        <div className="w-full">
          {loading ? (
            <CardLoader />
          ) : holerites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum holerite disponível</p>
              <p className="text-sm">Seus holerites aparecerão aqui quando estiverem disponíveis.</p>
            </div>
          ) : (
            <div className="w-full">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Mês/Ano</TableHead>
                      <TableHead className="w-[70px]">Status</TableHead>
                      <TableHead className="min-w-[110px] hidden sm:table-cell">Assinatura</TableHead>
                      <TableHead className="min-w-[120px] hidden md:table-cell">Recebimento</TableHead>
                      <TableHead className="min-w-[100px] hidden lg:table-cell">Data Criação</TableHead>
                      <TableHead className="text-right min-w-[200px] sm:min-w-[280px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holerites
                      .sort((a, b) => {
                        // Ordenar por mês/ano (mais recente primeiro)
                        const [anoA, mesA] = a.mes_referencia.split('-').map(Number)
                        const [anoB, mesB] = b.mes_referencia.split('-').map(Number)
                        if (anoA !== anoB) return anoB - anoA
                        return mesB - mesA
                      })
                      .map((holerite) => (
                        <TableRow key={holerite.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatarMesReferencia(holerite.mes_referencia)}
                              </span>
                              <span className="text-xs text-gray-500 mt-0.5 hidden sm:inline">
                                {holerite.mes_referencia}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-1 py-2">
                            <div className="flex justify-center">
                              {estaAssinado(holerite) ? (
                                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                  <span className="hidden sm:inline">Assinado</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-[10px] px-1.5 py-0.5">
                                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                                  <span className="hidden sm:inline">Pendente</span>
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {estaAssinado(holerite) ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-700 font-medium">
                                  {holerite.assinado_em 
                                    ? new Date(holerite.assinado_em).toLocaleDateString('pt-BR')
                                    : 'Assinado'
                                  }
                                </span>
                                {holerite.assinado_em && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(holerite.assinado_em).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Não assinado</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {estaRecebido(holerite) ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                <Check className="w-3 h-3 mr-1" />
                                Recebido
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">Não confirmado</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-xs text-gray-600">
                              {new Date(holerite.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVisualizar(holerite)}
                                className="h-8 px-2 sm:px-3"
                                title="Visualizar holerite"
                              >
                                <Eye className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(holerite, false)}
                                className="h-8 px-2 sm:px-3"
                                title="Baixar holerite"
                              >
                                <Download className="w-4 h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Baixar</span>
                              </Button>
                              {estaAssinado(holerite) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(holerite, true)}
                                  className="h-8 px-2 sm:px-3 bg-green-50 hover:bg-green-100 border-green-300"
                                  title="Baixar holerite com assinatura"
                                >
                                  <FileSignature className="w-4 h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Assinado</span>
                                </Button>
                              )}
                              {!estaAssinado(holerite) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setHoleriteSelecionado(holerite)
                                    setIsAssinaturaDialogOpen(true)
                                  }}
                                  className="h-8 px-2 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                  title="Assinar holerite"
                                >
                                  <FileText className="w-4 h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Assinar</span>
                                </Button>
                              )}
                              {!estaRecebido(holerite) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => confirmarRecebimento(holerite)}
                                  className="h-8 px-2 sm:px-3"
                                  title="Confirmar recebimento"
                                >
                                  <Check className="w-4 h-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Confirmar</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
            </div>
          )}
        </div>

        {/* Dialog de Assinatura */}
        <Dialog open={isAssinaturaDialogOpen} onOpenChange={setIsAssinaturaDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assinar Holerite</DialogTitle>
              <DialogDescription>
                Assine digitalmente o holerite de {holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <SignaturePad
                onSave={(signature) => {
                  setAssinaturaDataUrl(signature)
                  if (holeriteSelecionado) {
                    handleAssinar(holeriteSelecionado)
                  }
                }}
                onCancel={() => {
                  setIsAssinaturaDialogOpen(false)
                  setAssinaturaDataUrl('')
                  setHoleriteSelecionado(null)
                }}
                title="Assinar Holerite"
                description={`Assine digitalmente o holerite de ${holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}`}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Visualização */}
        <Dialog open={isVisualizacaoDialogOpen} onOpenChange={(open) => {
          setIsVisualizacaoDialogOpen(open)
          if (!open) {
            setHoleriteSelecionado(null)
            setUrlArquivoAssinada('')
            setCarregandoUrlArquivo(false)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visualizar Holerite</DialogTitle>
              <DialogDescription>
                Holerite de {holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}
              </DialogDescription>
            </DialogHeader>

            {holeriteSelecionado && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatarMesReferencia(holeriteSelecionado.mes_referencia)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Criado em {new Date(holeriteSelecionado.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {estaAssinado(holeriteSelecionado) && (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Assinado
                      </Badge>
                    )}
                    {estaRecebido(holeriteSelecionado) && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        <Check className="w-3 h-3 mr-1" />
                        Recebido
                      </Badge>
                    )}
                  </div>
                </div>

                {holeriteSelecionado.arquivo ? (
                  <div className="border rounded-lg p-4">
                    {carregandoUrlArquivo ? (
                      <div className="flex items-center justify-center h-[600px]">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Carregando arquivo...</p>
                        </div>
                      </div>
                    ) : urlArquivoAssinada && urlArquivoAssinada.startsWith('http') ? (
                      <iframe
                        src={urlArquivoAssinada}
                        className="w-full h-[600px] border-0"
                        title="Visualização do Holerite"
                        onError={() => {
                          console.error('[HOLERITES] Erro ao carregar iframe com URL:', urlArquivoAssinada)
                          toast({
                            title: "Erro",
                            description: "Não foi possível carregar o PDF. Tente baixar o arquivo.",
                            variant: "destructive"
                          })
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[600px]">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Não foi possível carregar o arquivo</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => handleDownload(holeriteSelecionado, false)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 bg-gray-50">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Arquivo não disponível</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        O arquivo PDF do holerite de {formatarMesReferencia(holeriteSelecionado.mes_referencia)} não está disponível.
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Informações do Holerite:</p>
                        <div className="text-left space-y-1 text-sm">
                          <p><strong>Mês/Ano:</strong> {formatarMesReferencia(holeriteSelecionado.mes_referencia)}</p>
                          <p><strong>Status:</strong> {estaAssinado(holeriteSelecionado) ? 'Assinado' : 'Pendente de assinatura'}</p>
                          {estaAssinado(holeriteSelecionado) && holeriteSelecionado.assinado_em && (
                            <p><strong>Assinado em:</strong> {new Date(holeriteSelecionado.assinado_em).toLocaleDateString('pt-BR')}</p>
                          )}
                          <p><strong>Recebimento:</strong> {estaRecebido(holeriteSelecionado) ? 'Confirmado' : 'Não confirmado'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(holeriteSelecionado, false)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                  {estaAssinado(holeriteSelecionado) && (
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(holeriteSelecionado, true)}
                      className="bg-green-50 hover:bg-green-100 border-green-300"
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      Baixar Assinado
                    </Button>
                  )}
                  {!estaAssinado(holeriteSelecionado) && (
                    <Button
                      onClick={() => {
                        setIsVisualizacaoDialogOpen(false)
                        setIsAssinaturaDialogOpen(true)
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Assinar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsVisualizacaoDialogOpen(false)
                      setHoleriteSelecionado(null)
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

