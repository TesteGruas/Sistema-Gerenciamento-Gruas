"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Receipt,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Building2,
  Forklift,
  Filter,
  Calendar,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { clientesApi } from "@/lib/api-clientes"
import { obrasApi } from "@/lib/api-obras"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface Obra {
  id: number
  nome: string
  status?: string
}

export default function PWAClienteMedicoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [selectedMedicao, setSelectedMedicao] = useState<MedicaoMensal | null>(null)
  const [isAprovarDialogOpen, setIsAprovarDialogOpen] = useState(false)
  const [isRejeitarDialogOpen, setIsRejeitarDialogOpen] = useState(false)
  const [observacoes, setObservacoes] = useState("")
  const [processando, setProcessando] = useState(false)
  
  // Filtros
  const [obraFiltro, setObraFiltro] = useState<string>("all")
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

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

  useEffect(() => {
    if (isOnline) {
      carregarDados()
    }
  }, [isOnline])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Buscar dados do usuário
      const userDataStr = localStorage.getItem('user_data')
      if (!userDataStr) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        })
        router.push('/pwa/login')
        return
      }

      const userData = JSON.parse(userDataStr)
      const userId = userData?.user?.id || userData?.id

      if (!userId) {
        toast({
          title: "Erro",
          description: "ID do usuário não encontrado",
          variant: "destructive"
        })
        return
      }

      // Buscar cliente pelo usuario_id
      const clienteResponse = await clientesApi.buscarPorUsuarioId(userId)
      if (!clienteResponse.success || !clienteResponse.data) {
        toast({
          title: "Erro",
          description: "Cliente não encontrado para este usuário",
          variant: "destructive"
        })
        return
      }

      const cliente = clienteResponse.data
      setClienteId(cliente.id)

      // Buscar apenas obras ativas (Em Andamento) do cliente
      const obrasResponse = await obrasApi.listarObras({ 
        cliente_id: cliente.id, 
        status: 'Em Andamento',
        limit: 1000 
      })
      
      // Filtrar apenas obras ativas
      const obrasAtivas = obrasResponse.success && obrasResponse.data 
        ? obrasResponse.data.filter(obra => obra.status === 'Em Andamento')
        : []
      
      if (obrasAtivas.length > 0) {
        setObras(obrasAtivas)
      } else {
        setObras([])
      }

      // Buscar todas as medições apenas das obras ativas do cliente
      const todasMedicoes: MedicaoMensal[] = []
      
      if (obrasAtivas.length > 0) {
        for (const obra of obrasAtivas) {
          try {
            const medicoesObra = await medicoesMensaisApi.listar({ obra_id: obra.id, limit: 1000 })
            if (medicoesObra.success && medicoesObra.data) {
              todasMedicoes.push(...medicoesObra.data)
            }
          } catch (error) {
            console.error(`Erro ao buscar medições da obra ${obra.id}:`, error)
          }
        }
      }
      
      setMedicoes(todasMedicoes)
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar medições",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAprovar = async () => {
    if (!selectedMedicao) return

    try {
      setProcessando(true)
      const response = await medicoesMensaisApi.aprovar(
        selectedMedicao.id,
        'aprovada',
        observacoes || undefined
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição aprovada com sucesso"
        })
        setIsAprovarDialogOpen(false)
        setObservacoes("")
        setSelectedMedicao(null)
        await carregarDados()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar medição",
        variant: "destructive"
      })
    } finally {
      setProcessando(false)
    }
  }

  const handleRejeitar = async () => {
    if (!selectedMedicao || !observacoes.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessando(true)
      const response = await medicoesMensaisApi.aprovar(
        selectedMedicao.id,
        'rejeitada',
        observacoes
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição rejeitada"
        })
        setIsRejeitarDialogOpen(false)
        setObservacoes("")
        setSelectedMedicao(null)
        await carregarDados()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar medição",
        variant: "destructive"
      })
    } finally {
      setProcessando(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      enviada: { label: "Enviada", variant: "secondary" },
      aprovada: { label: "Aprovada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" },
      pendente: { label: "Aguardando Aprovação", variant: "outline" },
      finalizada: { label: "Finalizada", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || statusMap.enviada
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  // Filtrar medições
  const medicoesFiltradas = medicoes.filter(medicao => {
    // Filtro por obra
    if (obraFiltro !== "all" && medicao.obra_id !== parseInt(obraFiltro)) {
      return false
    }
    
    // Filtro por período
    if (periodoFiltro && medicao.periodo !== periodoFiltro) {
      return false
    }
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchNumero = medicao.numero?.toLowerCase().includes(term)
      const matchObra = medicao.obras?.nome?.toLowerCase().includes(term)
      const matchGrua = medicao.gruas?.name?.toLowerCase().includes(term) || medicao.gruas?.nome?.toLowerCase().includes(term)
      if (!matchNumero && !matchObra && !matchGrua) {
        return false
      }
    }
    
    return true
  })

  // Agrupar medições por obra
  const medicoesPorObra = medicoesFiltradas.reduce((acc, medicao) => {
    const obraId = medicao.obra_id || 0
    const obraNome = medicao.obras?.nome || "Sem Obra"
    
    if (!acc[obraId]) {
      acc[obraId] = {
        obraId,
        obraNome,
        medicoes: []
      }
    }
    
    acc[obraId].medicoes.push(medicao)
    return acc
  }, {} as Record<number, { obraId: number; obraNome: string; medicoes: MedicaoMensal[] }>)

  const gruposObra = Object.values(medicoesPorObra).sort((a, b) => 
    a.obraNome.localeCompare(b.obraNome)
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando medições...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Medições das Obras</h1>
              <p className="text-gray-600">Visualize as medições das gruas das suas obras ativas</p>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={carregarDados}
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Obra</Label>
                  <Select value={obraFiltro} onValueChange={setObraFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as obras" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as obras</SelectItem>
                      {obras.map((obra) => (
                        <SelectItem key={obra.id} value={obra.id.toString()}>
                          {obra.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Período (YYYY-MM)</Label>
                  <Input
                    type="text"
                    placeholder="2025-01"
                    value={periodoFiltro}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9-]/g, '')
                      if (value.length <= 7) {
                        setPeriodoFiltro(value)
                      }
                    }}
                    pattern="\d{4}-\d{2}"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Número, obra ou grua..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Medições Agrupadas por Obra */}
          {gruposObra.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Nenhuma medição encontrada</p>
                <p className="text-sm text-gray-500 mt-2">
                  {medicoes.length === 0 
                    ? obras.length === 0
                      ? "Você não possui obras ativas no momento"
                      : "Não há medições registradas para suas obras ativas"
                    : "Nenhuma medição corresponde aos filtros aplicados"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {gruposObra.map((grupo) => (
                <Card key={grupo.obraId} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{grupo.obraNome}</CardTitle>
                          <CardDescription>
                            {grupo.medicoes.length} {grupo.medicoes.length === 1 ? 'medição' : 'medições'}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {grupo.medicoes.map((medicao) => (
                        <div key={medicao.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{medicao.numero}</h3>
                                {getStatusBadge(medicao.status || 'pendente')}
                                {medicao.status_aprovacao && (
                                  <Badge variant={medicao.status_aprovacao === 'aprovada' ? 'default' : 'destructive'}>
                                    {medicao.status_aprovacao === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600">Período:</span>
                                  <p className="font-medium">{medicao.periodo}</p>
                                </div>
                                {medicao.gruas && (
                                  <div>
                                    <span className="text-gray-600">Grua:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Forklift className="w-4 h-4 text-gray-400" />
                                      <span className="font-medium">{medicao.gruas.name || medicao.gruas.nome}</span>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-600">Valor Total:</span>
                                  <p className="font-bold text-blue-600 text-lg">
                                    {formatCurrency(medicao.valor_total || 0)}
                                  </p>
                                </div>
                                {medicao.data_medicao && (
                                  <div>
                                    <span className="text-gray-600">Data:</span>
                                    <p className="font-medium">
                                      {format(new Date(medicao.data_medicao), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-3 border-t">
                            {(medicao.status === 'enviada' && (!medicao.status_aprovacao || medicao.status_aprovacao === 'pendente')) && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMedicao(medicao)
                                    setIsAprovarDialogOpen(true)
                                  }}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Aprovar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMedicao(medicao)
                                    setIsRejeitarDialogOpen(true)
                                  }}
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rejeitar
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/pwa/cliente/medicoes/${medicao.id}`)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Detalhes
                            </Button>
                          </div>
                          {medicao.status_aprovacao && medicao.status_aprovacao !== 'pendente' && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-600">
                                {medicao.status_aprovacao === 'aprovada' 
                                  ? '✓ Esta medição foi aprovada'
                                  : '✗ Esta medição foi rejeitada'}
                              </p>
                              {medicao.observacoes_aprovacao && (
                                <p className="text-sm text-gray-800 mt-1">
                                  <span className="font-medium">Observações:</span> {medicao.observacoes_aprovacao}
                                </p>
                              )}
                              {medicao.data_aprovacao && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Em {format(new Date(medicao.data_aprovacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dialog de Aprovar */}
        <Dialog open={isAprovarDialogOpen} onOpenChange={setIsAprovarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Medição</DialogTitle>
              <DialogDescription>
                Confirme a aprovação da medição {selectedMedicao?.numero}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacoes-aprovar">Observações (opcional)</Label>
                <Textarea
                  id="observacoes-aprovar"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre a aprovação..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAprovarDialogOpen(false)
                setObservacoes("")
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAprovar} disabled={processando}>
                {processando ? "Aprovando..." : "Confirmar Aprovação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Rejeitar */}
        <Dialog open={isRejeitarDialogOpen} onOpenChange={setIsRejeitarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Medição</DialogTitle>
              <DialogDescription>
                Informe o motivo da rejeição da medição {selectedMedicao?.numero}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacoes-rejeitar">Motivo da Rejeição *</Label>
                <Textarea
                  id="observacoes-rejeitar"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informe o motivo da rejeição..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  O motivo da rejeição é obrigatório
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsRejeitarDialogOpen(false)
                setObservacoes("")
              }}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejeitar} 
                disabled={processando || !observacoes.trim()}
              >
                {processando ? "Rejeitando..." : "Confirmar Rejeição"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
