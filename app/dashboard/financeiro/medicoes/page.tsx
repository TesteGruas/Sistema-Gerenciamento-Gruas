"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Calculator,
  Calendar,
  DollarSign,
  Building2,
  RefreshCw,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Forklift,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"



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
  clientes?: {
    id: number
    nome: string
  }
  status?: string
}

export default function MedicoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  // Estados para medições
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  const [gruas, setGruas] = useState<Grua[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingGruas, setLoadingGruas] = useState(false)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [gruaFilter, setGruaFilter] = useState("all")
  const [clienteFilter, setClienteFilter] = useState("all")
  const [obraFilter, setObraFilter] = useState("all")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 100
  
  // Estados de diálogos
  const [excluindoId, setExcluindoId] = useState<number | null>(null)
  const [exportandoCsv, setExportandoCsv] = useState(false)


  useEffect(() => {
    carregarGruas()
    carregarObras()
  }, [])

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

  const carregarMedicoes = useCallback(async () => {
    try {
      setIsLoading(true)
      const filters: any = { 
        limit: itemsPerPage,
        page: currentPage
      }
      if (gruaFilter !== "all") {
        filters.grua_id = parseInt(gruaFilter)
      }
      if (obraFilter !== "all") {
        filters.obra_id = parseInt(obraFilter)
      }
      if (filterPeriodo) {
        filters.periodo = filterPeriodo
      }
      if (filterStatus !== "all") {
        filters.status = filterStatus
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
      setIsLoading(false)
    }
  }, [gruaFilter, obraFilter, filterPeriodo, filterStatus, searchTerm, currentPage, toast])

  // Recarregar medições quando os filtros mudarem (incluindo busca)
  useEffect(() => {
    // Resetar para primeira página quando filtros mudarem
    setCurrentPage(1)
  }, [gruaFilter, obraFilter, clienteFilter, filterPeriodo, filterStatus, searchTerm])

  // Recarregar medições quando os filtros ou página mudarem
  useEffect(() => {
    // Debounce para busca por texto (aguardar 500ms após parar de digitar)
    const timeoutId = setTimeout(() => {
      carregarMedicoes()
    }, searchTerm ? 500 : 0)
    
    return () => clearTimeout(timeoutId)
  }, [carregarMedicoes, searchTerm])

  const carregarDados = async () => {
    try {
      await carregarMedicoes()
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  // Os filtros são aplicados via API, então filteredMedicoes é igual a medicoes
  const filteredMedicoes = useMemo(() => {
    let data = [...medicoes]

    if (clienteFilter !== "all") {
      data = data.filter((medicao) => {
        const clienteIdDaObra = medicao.obras?.clientes?.id || medicao.obras?.cliente_id
        return String(clienteIdDaObra) === clienteFilter
      })
    }

    if (obraFilter !== "all") {
      data = data.filter((medicao) => String(medicao.obra_id) === obraFilter)
    }

    return data
  }, [medicoes, clienteFilter, obraFilter])

  const clientesOptions = useMemo(() => {
    const mapa = new Map<string, { id: string; nome: string }>()

    for (const obra of obras) {
      const clienteId = obra.clientes?.id || obra.cliente_id
      const clienteNome = obra.clientes?.nome
      if (clienteId) {
        mapa.set(String(clienteId), {
          id: String(clienteId),
          nome: clienteNome || `Cliente ${clienteId}`
        })
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [obras])

  const escapeCsvCelula = (valor: unknown) => {
    const s = valor == null ? "" : String(valor)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const rotuloStatusMedicao = (status: string | undefined) => {
    const map: Record<string, string> = {
      pendente: "Pendente",
      finalizada: "Finalizada",
      enviada: "Enviada",
      cancelada: "Cancelada",
    }
    return status ? map[status] || status : ""
  }

  const buildMedicoesApiFilters = (page: number, limit: number) => {
    const filters: Record<string, unknown> = { limit, page }
    if (gruaFilter !== "all") filters.grua_id = parseInt(gruaFilter, 10)
    if (obraFilter !== "all") filters.obra_id = parseInt(obraFilter, 10)
    if (filterPeriodo) filters.periodo = filterPeriodo
    if (filterStatus !== "all") filters.status = filterStatus
    if (searchTerm?.trim()) filters.search = searchTerm.trim()
    return filters
  }

  const aplicarFiltrosLocaisMedicoes = (data: MedicaoMensal[]) => {
    let out = [...data]
    if (clienteFilter !== "all") {
      out = out.filter((medicao) => {
        const clienteIdDaObra =
          medicao.obras?.clientes?.id || medicao.obras?.cliente_id
        return String(clienteIdDaObra) === clienteFilter
      })
    }
    if (obraFilter !== "all") {
      out = out.filter((medicao) => String(medicao.obra_id) === obraFilter)
    }
    return out
  }

  const buscarTodasMedicoesParaExport = async (): Promise<MedicaoMensal[]> => {
    const PAGE_SIZE = 100
    const todas: MedicaoMensal[] = []
    let page = 1
    let totalPaginas = 1
    do {
      const res = await medicoesMensaisApi.listar(
        buildMedicoesApiFilters(page, PAGE_SIZE) as any,
      )
      const lote = res.data || []
      todas.push(...lote)
      totalPaginas = res.pagination?.pages ?? 1
      page += 1
    } while (page <= totalPaginas)
    return aplicarFiltrosLocaisMedicoes(todas)
  }

  const exportarMedicoesCsv = async () => {
    try {
      setExportandoCsv(true)
      const lista = await buscarTodasMedicoesParaExport()
      if (lista.length === 0) {
        toast({
          title: "Nada para exportar",
          description: "Não há medições com os filtros atuais.",
        })
        return
      }
      const cabecalho = [
        "ID",
        "Período",
        "Cliente",
        "Obra",
        "Total",
        "Locação",
        "Serviços / demais",
        "Status",
        "NF",
      ]
      const linhas = lista.map((m) => {
        const total = Number(m.valor_total) || 0
        const loc = Number(m.valor_mensal_bruto) || 0
        const servico = Math.max(0, total - loc)
        const nfTexto = m.numero
          ? `NF-${String(m.numero).padStart(4, "0")}`
          : ""
        const cliente =
          m.obras?.clientes?.nome || m.orcamentos?.clientes?.nome || ""
        return [
          m.id,
          m.periodo,
          cliente,
          m.obras?.nome || "",
          total.toFixed(2),
          loc.toFixed(2),
          servico.toFixed(2),
          rotuloStatusMedicao(m.status),
          nfTexto,
        ]
          .map(escapeCsvCelula)
          .join(",")
      })
      const csv = "\ufeff" + [cabecalho.join(","), ...linhas].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `medicoes_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Exportação concluída",
        description: `${lista.length} medição(ões) exportada(s) para CSV.`,
      })
    } catch (e) {
      console.error("Erro ao exportar medições CSV:", e)
      toast({
        title: "Erro na exportação",
        description: e instanceof Error ? e.message : "Não foi possível gerar o CSV.",
        variant: "destructive",
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  const resumoFinanceiro = useMemo(() => {
    const base = filteredMedicoes
    const aFaturar = base
      .filter((m) => ['pendente'].includes(String(m.status || '').toLowerCase()))
      .reduce((acc, m) => acc + (Number(m.valor_total) || 0), 0)

    const jaFaturado = base
      .filter((m) => ['finalizada', 'enviada'].includes(String(m.status || '').toLowerCase()))
      .reduce((acc, m) => acc + (Number(m.valor_total) || 0), 0)

    const totalMensal = base.reduce((acc, m) => acc + (Number(m.valor_total) || 0), 0)
    const totaisPorA = base.reduce((acc, m) => acc + (Number(m.valor_aditivos) || 0), 0)

    const mapaClientes = new Map<string, number>()
    for (const medicao of base) {
      const nomeCliente =
        medicao.obras?.clientes?.nome ||
        medicao.orcamentos?.clientes?.nome ||
        'Sem cliente'
      mapaClientes.set(nomeCliente, (mapaClientes.get(nomeCliente) || 0) + (Number(medicao.valor_total) || 0))
    }

    const totaisPorCliente = Array.from(mapaClientes.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)

    return { aFaturar, jaFaturado, totalMensal, totaisPorA, totaisPorCliente }
  }, [filteredMedicoes])

  const handleEditar = (medicao: MedicaoMensal) => {
    router.push(`/dashboard/medicoes/${medicao.id}/editar`)
  }

  const handleExcluir = async (medicao: MedicaoMensal) => {
    try {
      setExcluindoId(medicao.id)
      const response = await medicoesMensaisApi.deletar(medicao.id)

      toast({
        title: "Sucesso",
        description: response.message || "Medição excluída com sucesso"
      })

      await carregarMedicoes()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir medição",
        description: error.message || "Não foi possível excluir a medição",
        variant: "destructive"
      })
    } finally {
      setExcluindoId(null)
    }
  }

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



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medições</h1>
          <p className="text-gray-600">Gestão de locações, medições e área financeira</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/medicoes/nova')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Medição
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
        <Card className="xl:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">A Faturar</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumoFinanceiro.aFaturar)}</p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Já Faturado</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumoFinanceiro.jaFaturado)}</p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Mensal</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumoFinanceiro.totalMensal)}</p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Totais por A</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumoFinanceiro.totaisPorA)}</p>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Totais por Cliente</p>
              {resumoFinanceiro.totaisPorCliente.length === 0 ? (
                <p className="text-sm text-gray-400">Sem dados</p>
              ) : (
                resumoFinanceiro.totaisPorCliente.map((item, idx) => {
                  const cores = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-indigo-500']
                  const percentual = resumoFinanceiro.totalMensal > 0
                    ? ((item.total / resumoFinanceiro.totalMensal) * 100).toFixed(1)
                    : '0.0'
                  return (
                    <div key={`${item.nome}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cores[idx % cores.length]}`} />
                        <span className="text-gray-700">{item.nome}</span>
                      </div>
                      <span className="font-medium text-gray-600">{percentual}%</span>
                    </div>
                  )
                })
              )}
            </div>
            {resumoFinanceiro.totaisPorCliente.length > 0 && (
              <div
                className="w-28 h-28 rounded-full"
                style={{
                  background: (() => {
                    const cores = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1']
                    let inicio = 0
                    const fatias = resumoFinanceiro.totaisPorCliente.map((item, idx) => {
                      const pct = resumoFinanceiro.totalMensal > 0 ? (item.total / resumoFinanceiro.totalMensal) * 100 : 0
                      const fim = inicio + pct
                      const trecho = `${cores[idx % cores.length]} ${inicio}% ${fim}%`
                      inicio = fim
                      return trecho
                    })
                    return `conic-gradient(${fatias.join(', ')})`
                  })()
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
          {/* Filtros */}
          <Card className="rounded-xl border bg-muted/20">
            <CardContent className="p-3 md:p-4">
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={clienteFilter} onValueChange={setClienteFilter}>
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cliente</SelectItem>
                      {clientesOptions.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={gruaFilter} onValueChange={setGruaFilter}>
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="Grua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Grua</SelectItem>
                      {gruas.map((grua) => (
                        <SelectItem key={grua.id} value={String(grua.id)}>
                          {grua.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={obraFilter} onValueChange={setObraFilter}>
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="Obra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Obra</SelectItem>
                      {obras.map((obra) => (
                        <SelectItem key={obra.id} value={String(obra.id)}>
                          {obra.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Filtrar / Cliente"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 pl-10 bg-white"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Select value={obraFilter} onValueChange={setObraFilter}>
                      <SelectTrigger className="h-9 bg-white">
                        <SelectValue placeholder="Selecionar Obra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Selecionar Obra</SelectItem>
                        {obras.map((obra) => (
                          <SelectItem key={obra.id} value={String(obra.id)}>
                            {obra.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="month"
                      value={filterPeriodo}
                      onChange={(e) => setFilterPeriodo(e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                  <div className="md:col-span-3 flex flex-wrap md:flex-nowrap items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterStatus("all")
                        setGruaFilter("all")
                        setClienteFilter("all")
                        setObraFilter("all")
                        setFilterPeriodo("")
                      }}
                      className="h-9 px-3"
                    >
                      Limpar
                    </Button>
                    <Button variant="outline" onClick={carregarMedicoes} className="h-9 px-3">
                      Filtrar
                    </Button>
                    <Button variant="outline" onClick={carregarMedicoes} className="h-9 w-9 p-0">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 px-3"
                      disabled={isLoading || exportandoCsv}
                      onClick={exportarMedicoesCsv}
                      title="Exportar todas as medições que correspondem aos filtros atuais"
                    >
                      {exportandoCsv ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                      ) : (
                        <Download className="w-4 h-4 mr-2 shrink-0" />
                      )}
                      Exportar CSV
                    </Button>
                    <Button onClick={() => router.push('/dashboard/medicoes/nova')} className="h-9 px-3">
                      Nova Medição
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Medições */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Medições ({filteredMedicoes.length})</CardTitle>
              <CardDescription>Lista de todas as medições registradas</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 w-full">
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredMedicoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma medição encontrada</div>
              ) : (
                <>
                  <Table
                    className="table-fixed min-w-0 [&_td]:px-2 [&_th]:px-2"
                    wrapperClassName="w-full max-w-full min-w-0"
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[5.5rem] min-w-0 whitespace-nowrap">Período</TableHead>
                        <TableHead className="min-w-0">Cliente</TableHead>
                        <TableHead className="min-w-0">Obra</TableHead>
                        <TableHead className="w-[7.25rem] whitespace-nowrap">Total</TableHead>
                        <TableHead className="w-[7.25rem] whitespace-nowrap">Locação</TableHead>
                        <TableHead className="w-[7.25rem] whitespace-nowrap">Serviço</TableHead>
                        <TableHead className="w-[7rem] whitespace-nowrap">Status</TableHead>
                        <TableHead className="w-16 min-w-0">NF</TableHead>
                        <TableHead className="w-[13rem] min-w-[13rem] whitespace-nowrap text-right">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMedicoes.map((medicao) => {
                        const nfTexto = medicao.numero
                          ? `NF-${String(medicao.numero).padStart(4, "0")}`
                          : null
                        return (
                        <TableRow key={medicao.id}>
                          <TableCell className="min-w-0 whitespace-nowrap">{medicao.periodo}</TableCell>
                          <TableCell className="min-w-0">
                            <span
                              className="block truncate"
                              title={
                                medicao.obras?.clientes?.nome ||
                                medicao.orcamentos?.clientes?.nome ||
                                undefined
                              }
                            >
                              {medicao.obras?.clientes?.nome || medicao.orcamentos?.clientes?.nome || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="min-w-0">
                            <span className="block truncate" title={medicao.obras?.nome || undefined}>
                              {medicao.obras?.nome || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="min-w-0 whitespace-nowrap font-semibold tabular-nums">
                            {formatCurrency(medicao.valor_total || 0)}
                          </TableCell>
                          <TableCell className="min-w-0 whitespace-nowrap tabular-nums">
                            {formatCurrency(medicao.valor_mensal_bruto || 0)}
                          </TableCell>
                          <TableCell className="min-w-0 whitespace-nowrap tabular-nums">
                            {formatCurrency(Math.max(0, (medicao.valor_total || 0) - (medicao.valor_mensal_bruto || 0)))}
                          </TableCell>
                          <TableCell className="w-[7rem] min-w-0 whitespace-nowrap">
                            {getStatusBadge(medicao.status)}
                          </TableCell>
                          <TableCell className="w-16 max-w-16 min-w-0 align-middle">
                            {nfTexto ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    tabIndex={0}
                                    className="block max-w-full cursor-default truncate text-left text-blue-700 font-medium"
                                  >
                                    {nfTexto}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs break-all text-left font-mono text-xs"
                                >
                                  {nfTexto}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="w-[13rem] min-w-[13rem] whitespace-nowrap align-middle text-right">
                            <div className="flex flex-nowrap items-center justify-end gap-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Ver detalhes da medição"
                                    onClick={() => {
                                      router.push(`/dashboard/medicoes/${medicao.id}`)
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Ver detalhes da medição</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Editar medição"
                                    onClick={() => handleEditar(medicao)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">Editar medição</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="px-1.5"
                                      disabled={medicao.status_aprovacao !== "aprovada"}
                                      aria-label={
                                        medicao.status_aprovacao !== "aprovada"
                                          ? "Nota fiscal: aguarde aprovação da medição"
                                          : "Abrir nota fiscal de saída a partir desta medição"
                                      }
                                      onClick={() => {
                                        if (medicao.status_aprovacao !== "aprovada") return
                                        try {
                                          sessionStorage.setItem(
                                            "sgg_nf_prefill_medicao_id",
                                            String(medicao.id)
                                          )
                                        } catch {
                                          /* ignore */
                                        }
                                        router.push(
                                          `/dashboard/financeiro/notas-fiscais?fromMedicao=${medicao.id}`
                                        )
                                      }}
                                    >
                                      <FileText
                                        className={`w-4 h-4 ${medicao.status_aprovacao === "aprovada" ? "text-emerald-700" : "text-muted-foreground opacity-50"}`}
                                      />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  {medicao.status_aprovacao !== "aprovada"
                                    ? "Só é possível gerar nota fiscal após a medição ser aprovada."
                                    : "Abrir nota fiscal de saída a partir desta medição"}
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={
                                            excluindoId === medicao.id || medicao.status === "finalizada"
                                          }
                                          aria-label={
                                            medicao.status === "finalizada"
                                              ? "Exclusão indisponível: medição finalizada"
                                              : "Excluir medição"
                                          }
                                        >
                                          <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    {medicao.status === "finalizada"
                                      ? "Medições finalizadas não podem ser excluídas"
                                      : "Excluir medição"}
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir medição</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. A medição do período {medicao.periodo} será removida permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleExcluir(medicao)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {!isLoading && filteredMedicoes.length > 0 && (
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
                </>
              )}
            </CardContent>
          </Card>
      </div>

    </div>
  )
}
