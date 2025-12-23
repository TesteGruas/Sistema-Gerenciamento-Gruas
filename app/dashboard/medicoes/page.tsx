"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  Calculator, 
  Search, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter,
  Building2,
  Forklift,
  FileText,
  Plus,
  Receipt,
  FileCheck,
  RefreshCw,
  Upload,
  Edit
} from "lucide-react"
import { ExportButton } from "@/components/export-button"
import { medicoesMensaisApi, MedicaoMensal, MedicaoDocumento } from "@/lib/api-medicoes-mensais"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"
import { getOrcamentos } from "@/lib/api-orcamentos"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Grua {
  id: string | number
  name: string
  modelo?: string
  fabricante?: string
}

interface Obra {
  id: number
  nome: string
  cliente_id?: number
  status?: string
}

export default function MedicoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  const [gruas, setGruas] = useState<Grua[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGruas, setLoadingGruas] = useState(false)
  const [activeTab, setActiveTab] = useState<"todas" | "por-obra">("todas")
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [gruaFilter, setGruaFilter] = useState<string>("all")
  const [periodoFilter, setPeriodoFilter] = useState("")
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 100
  
  // Estados de diálogos
  const [selectedMedicao, setSelectedMedicao] = useState<MedicaoMensal | null>(null)
  const [isEnviarDialogOpen, setIsEnviarDialogOpen] = useState(false)
  const [emailEnvio, setEmailEnvio] = useState("")
  const [telefoneEnvio, setTelefoneEnvio] = useState("")
  const [enviando, setEnviando] = useState(false)
  
  // Estados para histórico de medições
  const [isHistoricoDialogOpen, setIsHistoricoDialogOpen] = useState(false)
  const [obraSelecionada, setObraSelecionada] = useState<Obra | null>(null)
  const [historicoMedicoes, setHistoricoMedicoes] = useState<MedicaoMensal[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  useEffect(() => {
    carregarGruas()
    carregarObras()
  }, [])

  const carregarMedicoes = useCallback(async () => {
    try {
      setLoading(true)
      const filters: any = { 
        limit: itemsPerPage,
        page: currentPage
      }
      if (gruaFilter !== "all") {
        filters.grua_id = parseInt(gruaFilter)
      }
      if (periodoFilter) {
        filters.periodo = periodoFilter
      }
      if (statusFilter !== "all") {
        filters.status = statusFilter
      }
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      
      const response = await medicoesMensaisApi.listar(filters)
      if (response.success) {
        setMedicoes(response.data || [])
        // Atualizar informações de paginação
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1)
          setTotalItems(response.pagination.total || 0)
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar medições",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [gruaFilter, periodoFilter, statusFilter, searchTerm, currentPage, toast])

  // Recarregar medições quando os filtros mudarem (incluindo busca)
  useEffect(() => {
    // Resetar para primeira página quando filtros mudarem
    setCurrentPage(1)
  }, [gruaFilter, periodoFilter, statusFilter, searchTerm])

  // Recarregar medições quando os filtros ou página mudarem
  useEffect(() => {
    // Debounce para busca por texto (aguardar 500ms após parar de digitar)
    const timeoutId = setTimeout(() => {
      carregarMedicoes()
    }, searchTerm ? 500 : 0)
    
    return () => clearTimeout(timeoutId)
  }, [carregarMedicoes, searchTerm])

  const carregarGruas = async () => {
    try {
      setLoadingGruas(true)
      const response = await gruasApi.listarGruas({ limit: 1000 })
      if (response.success) {
        setGruas(response.data || [])
      }
    } catch (error: any) {
      console.error("Erro ao carregar gruas:", error)
    } finally {
      setLoadingGruas(false)
    }
  }

  const carregarObras = async () => {
    try {
      const response = await obrasApi.listarObras({ limit: 1000 })
      if (response.success) {
        setObras(response.data || [])
      }
    } catch (error: any) {
      console.error("Erro ao carregar obras:", error)
    }
  }



  const handleEnviar = async () => {
    if (!selectedMedicao) return

    try {
      setEnviando(true)
      const response = await medicoesMensaisApi.enviar(selectedMedicao.id, emailEnvio || undefined, telefoneEnvio || undefined)
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição enviada ao cliente com sucesso"
        })
        setIsEnviarDialogOpen(false)
        setEmailEnvio("")
        setTelefoneEnvio("")
        await carregarMedicoes()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar medição",
        variant: "destructive"
      })
    } finally {
      setEnviando(false)
    }
  }

  const handleEditar = (medicao: MedicaoMensal) => {
    router.push(`/dashboard/medicoes/${medicao.id}/editar`)
  }

  const handleVerHistorico = async (obra: Obra) => {
    setObraSelecionada(obra)
    setIsHistoricoDialogOpen(true)
    setLoadingHistorico(true)
    setHistoricoMedicoes([])

    try {
      const todasMedicoes: MedicaoMensal[] = []

      // 1. Buscar medições diretamente da obra (sem orçamento)
      try {
        const response = await medicoesMensaisApi.listarPorObra(obra.id)
        if (response.success && response.data) {
          todasMedicoes.push(...response.data)
        }
      } catch (error) {
        console.error('Erro ao carregar medições da obra:', error)
      }

      // 2. Buscar orçamentos vinculados à obra
      try {
        const orcamentosResponse = await getOrcamentos({ obra_id: obra.id, limit: 1000 })
        if (orcamentosResponse.success && orcamentosResponse.data) {
          // Buscar medições de cada orçamento
          for (const orcamento of orcamentosResponse.data) {
            try {
              const medicoesResponse = await medicoesMensaisApi.listarPorOrcamento(orcamento.id)
              if (medicoesResponse.success && medicoesResponse.data) {
                // Adicionar apenas medições que ainda não foram adicionadas
                medicoesResponse.data.forEach((medicao: MedicaoMensal) => {
                  if (!todasMedicoes.find(m => m.id === medicao.id)) {
                    todasMedicoes.push(medicao)
                  }
                })
              }
            } catch (error) {
              console.error(`Erro ao carregar medições do orçamento ${orcamento.id}:`, error)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar orçamentos da obra:', error)
      }

      // 3. Ordenar por período (mais recente primeiro)
      todasMedicoes.sort((a, b) => {
        if (a.periodo > b.periodo) return -1
        if (a.periodo < b.periodo) return 1
        return 0
      })

      setHistoricoMedicoes(todasMedicoes)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar histórico de medições",
        variant: "destructive"
      })
    } finally {
      setLoadingHistorico(false)
    }
  }

  // Função para obter o mês passado no formato YYYY-MM
  const getMesPassado = () => {
    const agora = new Date()
    const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    return `${mesPassado.getFullYear()}-${String(mesPassado.getMonth() + 1).padStart(2, '0')}`
  }


  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      finalizada: { label: "Finalizada", variant: "default" },
      enviada: { label: "Enviada", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getAprovacaoBadge = (statusAprovacao?: string | null) => {
    if (!statusAprovacao) return null
    const aprovacaoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pendente: { label: "Aguardando Aprovação", variant: "secondary" },
      aprovada: { label: "Aprovada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" }
    }
    const aprovacaoInfo = aprovacaoMap[statusAprovacao] || aprovacaoMap.pendente
    return <Badge variant={aprovacaoInfo.variant}>{aprovacaoInfo.label}</Badge>
  }

  // Os filtros são aplicados via API, então filteredMedicoes é igual a medicoes
  const filteredMedicoes = useMemo(() => {
    return medicoes
  }, [medicoes])

  // Agrupar medições por obra -> grua (apenas obras com medições)
  const medicoesPorObra = useMemo(() => {
    const agrupadas: Record<string, {
      obra: Obra;
      gruas: Record<string, {
        grua: Grua;
        medicoes: MedicaoMensal[];
      }>;
      totalMedicoes: number;
    }> = {}
    
    // Processar todas as medições
    filteredMedicoes.forEach(medicao => {
      // Determinar obra_id - pode vir de medicao.obra_id ou precisar buscar
      let obraId: string | null = null
      let obraInfo: Obra | null = null
      
      // Se tem obra_id e relacionamento populado
      if (medicao.obra_id && medicao.obras) {
        obraId = String(medicao.obra_id)
        obraInfo = {
          id: medicao.obra_id,
          nome: medicao.obras.nome,
          cliente_id: medicao.obras.cliente_id,
          status: medicao.obras.status
        }
      } 
      // Se tem obra_id mas não tem relacionamento populado, buscar na lista de obras
      else if (medicao.obra_id) {
        const obraEncontrada = obras.find(o => o.id === medicao.obra_id)
        if (obraEncontrada) {
          obraId = String(medicao.obra_id)
          obraInfo = {
            id: obraEncontrada.id,
            nome: obraEncontrada.nome,
            cliente_id: obraEncontrada.cliente_id,
            status: obraEncontrada.status
          }
        }
      }
      
      // Se não encontrou obra, pular esta medição (ou criar grupo "Sem Obra")
      if (!obraId || !obraInfo) {
        return // Pula medições sem obra definida
      }
      
      // Criar ou obter grupo da obra
      if (!agrupadas[obraId]) {
        agrupadas[obraId] = {
          obra: obraInfo,
          gruas: {},
          totalMedicoes: 0
        }
      }
      
      // Agrupar por grua dentro da obra
      if (medicao.grua_id) {
        const gruaId = String(medicao.grua_id)
        let gruaInfo: Grua | null = null
        
        // Se tem relacionamento populado
        if (medicao.gruas) {
          gruaInfo = {
            id: medicao.grua_id,
            name: medicao.gruas.name || medicao.gruas.nome || 'Grua sem nome',
            modelo: medicao.gruas.modelo,
            fabricante: medicao.gruas.fabricante
          }
        } 
        // Se não tem relacionamento populado, buscar na lista de gruas
        else {
          const gruaEncontrada = gruas.find(g => g.id === medicao.grua_id || String(g.id) === String(medicao.grua_id))
          if (gruaEncontrada) {
            gruaInfo = {
              id: gruaEncontrada.id,
              name: gruaEncontrada.name,
              modelo: gruaEncontrada.modelo,
              fabricante: gruaEncontrada.fabricante
            }
          } else {
            // Grua não encontrada, criar com ID
            gruaInfo = {
              id: medicao.grua_id,
              name: `Grua #${medicao.grua_id}`
            }
          }
        }
        
        if (gruaInfo) {
          if (!agrupadas[obraId].gruas[gruaId]) {
            agrupadas[obraId].gruas[gruaId] = {
              grua: gruaInfo,
              medicoes: []
            }
          }
          agrupadas[obraId].gruas[gruaId].medicoes.push(medicao)
        }
      } else {
        // Medição sem grua - criar grupo especial
        const semGruaId = 'sem-grua'
        if (!agrupadas[obraId].gruas[semGruaId]) {
          agrupadas[obraId].gruas[semGruaId] = {
            grua: {
              id: semGruaId,
              name: 'Sem Grua Definida'
            },
            medicoes: []
          }
        }
        agrupadas[obraId].gruas[semGruaId].medicoes.push(medicao)
      }
      
      agrupadas[obraId].totalMedicoes++
    })
    
    // Converter para array, filtrar apenas obras com medições, e ordenar
    return Object.values(agrupadas)
      .filter(item => item.totalMedicoes > 0) // Só retornar obras com medições
      .map(item => ({
        ...item,
        gruas: Object.values(item.gruas).sort((a, b) => 
          a.grua.name.localeCompare(b.grua.name)
        )
      }))
      .sort((a, b) => a.obra.nome.localeCompare(b.obra.nome))
  }, [filteredMedicoes, obras, gruas])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  // Gerar período atual no formato YYYY-MM
  const getPeriodoAtual = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medições</h1>
          <p className="text-gray-600">Gerencie todas as medições do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            dados={filteredMedicoes}
            tipo="medicoes"
            nomeArquivo="medicoes"
            filtros={{
              grua_id: gruaFilter !== "all" ? gruaFilter : undefined,
              periodo: periodoFilter || undefined,
              status: statusFilter !== "all" ? statusFilter : undefined
            }}
            titulo="Relatório de Medições"
            variant="outline"
          />
          <Button asChild>
            <Link href="/dashboard/medicoes/nova">
              <Plus className="w-4 h-4 mr-2" />
              Nova Medição
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "todas" | "por-obra")}>
        <TabsList>
          <TabsTrigger value="todas">Todas as Medições</TabsTrigger>
          <TabsTrigger value="por-obra">Agrupadas por Obra</TabsTrigger>
        </TabsList>

        {/* Tab: Todas as Medições */}
        <TabsContent value="todas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medições ({filteredMedicoes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por número, período, obra ou grua..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={gruaFilter} onValueChange={setGruaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Gruas</SelectItem>
                      {gruas.map((grua) => (
                        <SelectItem key={grua.id} value={String(grua.id)}>
                          {grua.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div>
                    <Label className="text-xs">Período (YYYY-MM)</Label>
                    <Input
                      type="text"
                      placeholder="2025-01"
                      value={periodoFilter}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '')
                        if (value.length <= 7) {
                          setPeriodoFilter(value)
                        }
                      }}
                      pattern="\d{4}-\d{2}"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setGruaFilter("all")
                      setPeriodoFilter("")
                    }}
                  >
                    Limpar
                  </Button>
                  <Button variant="outline" onClick={carregarMedicoes}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>
              
              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredMedicoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma medição encontrada</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Grua</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aprovação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicoes.map((medicao) => (
                      <TableRow key={medicao.id}>
                        <TableCell className="font-medium">{medicao.numero}</TableCell>
                        <TableCell>{medicao.periodo}</TableCell>
                        <TableCell>
                          {medicao.gruas ? (
                            <div className="flex items-center gap-2">
                              <Forklift className="w-4 h-4" />
                              <span>{medicao.gruas.name || medicao.gruas.nome}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {medicao.obras ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>{medicao.obras.nome}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(medicao.valor_total || 0)}</TableCell>
                        <TableCell>{getStatusBadge(medicao.status)}</TableCell>
                        <TableCell>{getAprovacaoBadge(medicao.status_aprovacao)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                router.push(`/dashboard/medicoes/${medicao.id}`)
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(medicao)}
                              title="Editar medição"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMedicao(medicao)
                                setIsEnviarDialogOpen(true)
                              }}
                              title={medicao.status === 'enviada' ? 'Reenviar medição' : 'Enviar medição'}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Paginação */}
              {!loading && filteredMedicoes.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} medições
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4 text-sm text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Agrupadas por Obra */}
        <TabsContent value="por-obra" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medições Agrupadas por Obra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-end">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por número, período, obra ou grua..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={gruaFilter} onValueChange={setGruaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Gruas</SelectItem>
                      {gruas.map((grua) => (
                        <SelectItem key={grua.id} value={String(grua.id)}>
                          {grua.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div>
                    <Label className="text-xs">Período (YYYY-MM)</Label>
                    <Input
                      type="text"
                      placeholder="2025-01"
                      value={periodoFilter}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '')
                        if (value.length <= 7) {
                          setPeriodoFilter(value)
                        }
                      }}
                      pattern="\d{4}-\d{2}"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setGruaFilter("all")
                      setPeriodoFilter("")
                      setCurrentPage(1)
                    }}
                  >
                    Limpar
                  </Button>
                  <Button variant="outline" onClick={carregarMedicoes}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>
              
              {/* Conteúdo */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : medicoesPorObra.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma medição encontrada</div>
              ) : (
                <Accordion type="single" collapsible className="space-y-3">
              {medicoesPorObra.map((grupo) => {
                const valorTotalObra = grupo.gruas.reduce((total, g) => 
                  total + g.medicoes.reduce((sum, m) => sum + (m.valor_total || 0), 0), 0
                )
                
                // Mapear status da obra para exibição
                const statusObra = grupo.obra.status || 'ativa'
                const statusLabel = statusObra === 'ativa' || statusObra === 'em_andamento' 
                  ? 'Em Andamento' 
                  : statusObra === 'finalizada' 
                    ? 'Finalizada' 
                    : statusObra === 'pausada'
                      ? 'Pausada'
                      : statusObra.charAt(0).toUpperCase() + statusObra.slice(1)
                
                return (
                  <AccordionItem 
                    key={String(grupo.obra.id)} 
                    value={String(grupo.obra.id)} 
                    className="border rounded-xl bg-card shadow-sm overflow-hidden"
                  >
                    <Card className="border-0 shadow-none">
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-4">
                          <h3 className="flex flex-1">
                            <AccordionTrigger className="hover:no-underline py-2 px-4 -mx-4 -mt-4 flex-1">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg font-semibold mb-2 text-gray-900">
                                    <Link 
                                      href={`/dashboard/obras/${grupo.obra.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="hover:text-blue-600 hover:underline transition-colors"
                                    >
                                      {grupo.obra.nome}
                                    </Link>
                                  </CardTitle>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-gray-900">Total:</span>
                                      <span className="font-semibold text-blue-600">{formatCurrency(valorTotalObra)}</span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <Receipt className="w-4 h-4 text-gray-400" />
                                      <span>{grupo.totalMedicoes} medição{grupo.totalMedicoes !== 1 ? 'ões' : ''}</span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <Forklift className="w-4 h-4 text-gray-400" />
                                      <span>{grupo.gruas.length} grua{grupo.gruas.length !== 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                          </h3>
                          <div className="flex items-center gap-3 flex-shrink-0 pt-2 pr-4">
                            <Badge 
                              variant={statusObra === 'ativa' || statusObra === 'em_andamento' ? 'default' : 'outline'} 
                              className="hidden sm:inline-flex"
                            >
                              {statusLabel}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVerHistorico(grupo.obra)
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1.5" />
                              <span className="hidden sm:inline">Detalhes</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <AccordionContent>
                        <CardContent className="pt-0 px-4 pb-4">
                          {grupo.gruas.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                              <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                              <p className="text-base font-medium text-gray-600 mb-2">Esta obra ainda não possui medições</p>
                              <p className="text-sm text-gray-500 mb-4">Comece adicionando medições para esta obra</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/obras/${grupo.obra.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes da Obra
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {grupo.gruas.map((gruaGrupo) => {
                              const valorTotalGrua = gruaGrupo.medicoes.reduce((sum, m) => sum + (m.valor_total || 0), 0)
                              
                              return (
                                <div 
                                  key={String(gruaGrupo.grua.id)} 
                                  className="border rounded-lg p-5 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                          <Forklift className="w-5 h-5 text-gray-600" />
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-base text-gray-900 mb-1">{gruaGrupo.grua.name}</h4>
                                        {gruaGrupo.grua.modelo && gruaGrupo.grua.fabricante && (
                                          <p className="text-sm text-gray-500">
                                            {gruaGrupo.grua.fabricante} - {gruaGrupo.grua.modelo}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                      <Badge variant="secondary" className="font-medium">
                                        {gruaGrupo.medicoes.length} medição{gruaGrupo.medicoes.length !== 1 ? 'ões' : ''}
                                      </Badge>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-0.5">Total da Grua</p>
                                        <p className="text-base font-bold text-blue-600">
                                          {formatCurrency(valorTotalGrua)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-gray-50/50">
                                          <TableHead className="font-semibold">Número</TableHead>
                                          <TableHead className="font-semibold">Período</TableHead>
                                          <TableHead className="font-semibold text-right">Valor Total</TableHead>
                                          <TableHead className="font-semibold">Status</TableHead>
                                          <TableHead className="font-semibold">Aprovação</TableHead>
                                          <TableHead className="font-semibold">Documentos</TableHead>
                                          <TableHead className="font-semibold text-center">Ações</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {gruaGrupo.medicoes.map((medicao) => (
                                          <TableRow key={medicao.id} className="hover:bg-gray-50/50">
                                            <TableCell className="font-medium">{medicao.numero}</TableCell>
                                            <TableCell className="text-gray-600">{medicao.periodo}</TableCell>
                                            <TableCell className="font-semibold text-right text-blue-600">
                                              {formatCurrency(medicao.valor_total || 0)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(medicao.status)}</TableCell>
                                            <TableCell>{getAprovacaoBadge(medicao.status_aprovacao)}</TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                {medicao.status === 'finalizada' || medicao.status === 'enviada' ? (
                                                  <>
                                                    {medicao.documentos?.some(d => d.tipo_documento === 'nf_servico') ? (
                                                      <Badge variant="default" className="text-xs px-2 py-0.5">
                                                        <Receipt className="w-3 h-3 mr-1" />
                                                        NF Serviço
                                                      </Badge>
                                                    ) : (
                                                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                                                        <Receipt className="w-3 h-3 mr-1" />
                                                        NF Serviço
                                                      </Badge>
                                                    )}
                                                    {medicao.documentos?.some(d => d.tipo_documento === 'nf_locacao') ? (
                                                      <Badge variant="default" className="text-xs px-2 py-0.5">
                                                        <FileCheck className="w-3 h-3 mr-1" />
                                                        NF Locação
                                                      </Badge>
                                                    ) : (
                                                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                                                        <FileCheck className="w-3 h-3 mr-1" />
                                                        NF Locação
                                                      </Badge>
                                                    )}
                                                    {medicao.documentos?.some(d => d.tipo_documento === 'boleto') ? (
                                                      <Badge variant="default" className="text-xs px-2 py-0.5">
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        Boleto
                                                      </Badge>
                                                    ) : (
                                                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        Boleto
                                                      </Badge>
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="text-xs text-gray-400 italic">Pendente</span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center justify-center gap-1.5">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    router.push(`/dashboard/medicoes/${medicao.id}`)
                                                  }}
                                                  className="h-8 w-8 p-0"
                                                  title="Ver detalhes"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleEditar(medicao)}
                                                  className="h-8 w-8 p-0"
                                                  title="Editar medição"
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    setSelectedMedicao(medicao)
                                                    setIsEnviarDialogOpen(true)
                                                  }}
                                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                  title={medicao.status === 'enviada' ? 'Reenviar medição' : 'Enviar medição'}
                                                >
                                                  <Send className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )
                            })}
                            </div>
                          )}
                        </CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                )
              })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Dialog de Envio */}
      <Dialog open={isEnviarDialogOpen} onOpenChange={setIsEnviarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Medição ao Cliente</DialogTitle>
            <DialogDescription>
              Informe o e-mail e telefone para envio das notificações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={emailEnvio}
                onChange={(e) => setEmailEnvio(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input
                id="telefone"
                value={telefoneEnvio}
                onChange={(e) => setTelefoneEnvio(e.target.value)}
                placeholder="5511999999999"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnviarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico de Medições */}
      <Dialog open={isHistoricoDialogOpen} onOpenChange={setIsHistoricoDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Medições - {obraSelecionada?.nome}</DialogTitle>
            <DialogDescription>
              Todas as medições registradas para esta obra, ordenadas por período
            </DialogDescription>
          </DialogHeader>
          
          {loadingHistorico ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando histórico...</p>
            </div>
          ) : historicoMedicoes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-base font-medium text-gray-600">Nenhuma medição encontrada</p>
              <p className="text-sm text-gray-500 mt-2">Esta obra ainda não possui medições registradas</p>
            </div>
          ) : (() => {
            const valorTotal = historicoMedicoes.reduce((sum, m) => sum + (m.valor_total || 0), 0)
            
            // Agrupar medições por período
            const medicoesPorPeriodo = historicoMedicoes.reduce((acc, medicao) => {
              if (!acc[medicao.periodo]) {
                acc[medicao.periodo] = []
              }
              acc[medicao.periodo].push(medicao)
              return acc
            }, {} as Record<string, MedicaoMensal[]>)
            
            // Ordenar períodos: primeiro mês anterior, depois mês passado, depois os outros em ordem cronológica
            const mesPassado = getMesPassado()
            const agora = new Date()
            const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
            const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`
            
            const todosPeriodos = Object.keys(medicoesPorPeriodo).sort()
            const periodos = []
            
            // Adicionar mês anterior primeiro (se existir)
            if (todosPeriodos.includes(mesAnteriorStr)) {
              periodos.push(mesAnteriorStr)
            }
            
            // Adicionar mês passado depois (se existir e não for o mesmo que mês anterior)
            if (todosPeriodos.includes(mesPassado) && mesPassado !== mesAnteriorStr) {
              periodos.push(mesPassado)
            }
            
            // Adicionar os outros períodos em ordem cronológica
            todosPeriodos.forEach(periodo => {
              if (periodo !== mesAnteriorStr && periodo !== mesPassado) {
                periodos.push(periodo)
              }
            })
            
            // Obter todas as gruas únicas
            const gruasUnicas = new Set<string>()
            historicoMedicoes.forEach(m => {
              if (m.gruas) {
                gruasUnicas.add(m.gruas.name || m.gruas.nome || 'Sem Grua')
              } else {
                gruasUnicas.add('Sem Grua')
              }
            })
            const gruasArray = Array.from(gruasUnicas).sort()
            
            return (
              <div className="space-y-4">
                {/* Resumo Compacto */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm text-gray-600">Total de Medições</p>
                    <p className="text-xl font-bold text-gray-900">{historicoMedicoes.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(valorTotal)}</p>
                  </div>
                </div>

                {/* Tabela por Período */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold sticky left-0 bg-gray-50 z-10">Grua</TableHead>
                          {periodos.map((periodo) => {
                            const isMesPassado = periodo === mesPassado
                            return (
                              <TableHead 
                                key={periodo} 
                                className={`font-semibold text-center min-w-[140px] ${isMesPassado ? 'bg-yellow-50' : ''}`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-medium">{periodo}</span>
                                  {isMesPassado && (
                                    <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                      Mês Passado
                                    </Badge>
                                  )}
                                </div>
                              </TableHead>
                            )
                          })}
                          <TableHead className="font-semibold text-right sticky right-0 bg-gray-50 z-10">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gruasArray.map((gruaNome) => {
                          const totalGrua = historicoMedicoes
                            .filter(m => {
                              const nomeGrua = m.gruas?.name || m.gruas?.nome || 'Sem Grua'
                              return nomeGrua === gruaNome
                            })
                            .reduce((sum, m) => sum + (m.valor_total || 0), 0)
                          
                          return (
                            <TableRow key={gruaNome} className="hover:bg-gray-50/50">
                              <TableCell className="font-medium sticky left-0 bg-white z-10">{gruaNome}</TableCell>
                              {periodos.map((periodo) => {
                                const medicoesDoPeriodo = medicoesPorPeriodo[periodo] || []
                                const medicaoGrua = medicoesDoPeriodo.find(m => {
                                  const nomeGrua = m.gruas?.name || m.gruas?.nome || 'Sem Grua'
                                  return nomeGrua === gruaNome
                                })
                                
                                return (
                                  <TableCell key={periodo} className="text-center">
                                    {medicaoGrua ? (
                                      <div className="flex flex-col items-center gap-1.5 py-2">
                                        <span className="font-semibold text-blue-600 text-sm">
                                          {formatCurrency(medicaoGrua.valor_total || 0)}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">{medicaoGrua.numero}</span>
                                        <div className="flex gap-1 justify-center flex-wrap">
                                          {getStatusBadge(medicaoGrua.status)}
                                          {getAprovacaoBadge(medicaoGrua.status_aprovacao)}
                                        </div>
                                        <div className="flex gap-1 justify-center">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/medicoes/${medicaoGrua.id}`)}
                                            className="h-7 w-7 p-0"
                                            title="Ver detalhes"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditar(medicaoGrua)}
                                            className="h-7 w-7 p-0"
                                            title="Editar medição"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedMedicao(medicaoGrua)
                                              setIsEnviarDialogOpen(true)
                                            }}
                                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            title={medicaoGrua.status === 'enviada' ? 'Reenviar medição' : 'Enviar medição'}
                                          >
                                            <Send className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-300">-</span>
                                    )}
                                  </TableCell>
                                )
                              })}
                              <TableCell className="text-right font-semibold text-blue-600 sticky right-0 bg-white z-10">
                                {formatCurrency(totalGrua)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* Linha de Total */}
                        <TableRow className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                          <TableCell className="sticky left-0 bg-gray-50 z-10">Total</TableCell>
                          {periodos.map((periodo) => {
                            const totalPeriodo = (medicoesPorPeriodo[periodo] || [])
                              .reduce((sum, m) => sum + (m.valor_total || 0), 0)
                            const isMesPassado = periodo === mesPassado
                            return (
                              <TableCell 
                                key={periodo} 
                                className={`text-center font-semibold text-blue-600 ${isMesPassado ? 'bg-yellow-50' : ''}`}
                              >
                                {formatCurrency(totalPeriodo)}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-right font-bold text-blue-600 text-lg sticky right-0 bg-gray-50 z-10">
                            {formatCurrency(valorTotal)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )
          })()}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoricoDialogOpen(false)}>
              Fechar
            </Button>
            {obraSelecionada && (
              <Button onClick={() => {
                setIsHistoricoDialogOpen(false)
                router.push(`/dashboard/obras/${obraSelecionada.id}`)
              }}>
                Ver Obra Completa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
