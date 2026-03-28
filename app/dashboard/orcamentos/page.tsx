"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  X,
  Trash2,
  Building2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Download,
  Save,
  Package,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import { ExportButton } from "@/components/export-button"
import { CardLoader } from "@/components/ui/loader"
import { OrcamentoPDFDocument } from "@/components/orcamento-pdf"
import { pdf } from "@react-pdf/renderer"
import { getOrcamentos, getOrcamento, aprovarOrcamento, rejeitarOrcamento, type Orcamento as OrcamentoAPI } from "@/lib/api-orcamentos"
import { api, API_BASE_URL } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'vencido' | 'convertido'

interface Orcamento {
  id: string
  numero: string
  cliente_id?: number
  cliente_nome?: string
  obra_nome: string
  obra_endereco?: string
  obra_cidade?: string
  obra_estado?: string
  tipo_obra?: string
  equipamento: string
  altura_inicial?: number
  altura_final?: number
  comprimento_lanca?: number
  carga_maxima?: number
  carga_ponta?: number
  potencia_eletrica?: string
  energia_necessaria?: string
  valor_locacao_mensal: number
  valor_operador: number
  valor_sinaleiro: number
  valor_manutencao: number
  total_mensal: number
  prazo_locacao_meses: number
  data_inicio_estimada?: string
  tolerancia_dias?: number
  status: StatusOrcamento
  validade_proposta?: string
  condicoes_comerciais?: string
  responsabilidades_cliente?: string
  escopo_incluso?: string
  created_at: string
  updated_at?: string
  aprovado_por?: string
  aprovado_em?: string
  observacoes?: string
}

export default function OrcamentosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<StatusOrcamento | "todos">("todos")
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editedOrcamento, setEditedOrcamento] = useState<Orcamento | null>(null)
  const [isRejeitarDialogOpen, setIsRejeitarDialogOpen] = useState(false)
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [orcamentoParaRejeitar, setOrcamentoParaRejeitar] = useState<Orcamento | null>(null)
  const [currentPageObra, setCurrentPageObra] = useState(1)
  const [totalPagesObra, setTotalPagesObra] = useState(1)
  const [totalItemsObra, setTotalItemsObra] = useState(0)
  const [exportandoCsv, setExportandoCsv] = useState(false)
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const prevFiltroStatusRef = useRef(filtroStatus)
  const prevCurrentPageObraRef = useRef(currentPageObra)

  // Função para formatar data
  const formatarData = (data: string | undefined | null): string => {
    if (!data) return '-'
    try {
      // Se já estiver no formato DD/MM/YYYY, retornar como está
      if (data.includes('/')) {
        return data
      }
      
      // Tentar parsear como ISO string
      if (data.includes('T') || data.includes('Z')) {
        const date = new Date(data)
        if (!isNaN(date.getTime())) {
          const [ano, mes, dia] = data.split('T')[0].split('-')
          return `${dia}/${mes}/${ano}`
        }
      }
      
      // Caso contrário, tentar parsear como Date e usar UTC
      const date = new Date(data)
      if (!isNaN(date.getTime())) {
        const dia = String(date.getUTCDate()).padStart(2, '0')
        const mes = String(date.getUTCMonth() + 1).padStart(2, '0')
        const ano = date.getUTCFullYear()
        return `${dia}/${mes}/${ano}`
      }
    } catch {
      return '-'
    }
    return '-'
  }

  useEffect(() => {
    // Evitar carregamento duplo - só carregar uma vez
    if (initialLoadDoneRef.current) return
    
    if (!loadingRef.current) {
      initialLoadDoneRef.current = true
      loadingRef.current = true
      loadOrcamentos().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    // Verificar se houve mudança real no filtro
    const filtroChanged = prevFiltroStatusRef.current !== filtroStatus
    
    if (filtroChanged && filtroStatus !== "todos") {
      prevFiltroStatusRef.current = filtroStatus
      setCurrentPageObra(1) // Resetar para primeira página ao mudar filtro
      loadOrcamentos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, dadosIniciaisCarregados])

  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    // Verificar se houve mudança real na página
    const pageChanged = prevCurrentPageObraRef.current !== currentPageObra
    
    if (pageChanged) {
      prevCurrentPageObraRef.current = currentPageObra
      loadOrcamentos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageObra, dadosIniciaisCarregados])

  // Debounce para pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPageObra(1) // Resetar para primeira página ao pesquisar
      loadOrcamentos()
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const mapearOrcamentoDaApi = (orc: OrcamentoAPI): Orcamento => ({
    id: orc.id.toString(),
    numero: orc.numero || '',
    cliente_id: orc.cliente_id,
    cliente_nome: orc.cliente_nome || orc.clientes?.nome,
    obra_nome: orc.obra_nome || '',
    obra_endereco: orc.obra_endereco,
    obra_cidade: orc.obra_cidade,
    obra_estado: orc.obra_estado,
    tipo_obra: orc.tipo_obra,
    equipamento: orc.equipamento || '',
    altura_inicial: orc.altura_inicial,
    altura_final: orc.altura_final,
    comprimento_lanca: orc.comprimento_lanca,
    carga_maxima: orc.carga_maxima,
    carga_ponta: orc.carga_ponta,
    potencia_eletrica: orc.potencia_eletrica,
    energia_necessaria: orc.energia_necessaria,
    valor_locacao_mensal: orc.valor_locacao_mensal || 0,
    valor_operador: orc.valor_operador || 0,
    valor_sinaleiro: orc.valor_sinaleiro || 0,
    valor_manutencao: orc.valor_manutencao || 0,
    total_mensal: orc.total_mensal || 0,
    prazo_locacao_meses: orc.prazo_locacao_meses || 0,
    data_inicio_estimada: orc.data_inicio_estimada,
    tolerancia_dias: orc.tolerancia_dias,
    status: (orc.status || 'rascunho') as StatusOrcamento,
    validade_proposta: orc.validade_proposta,
    condicoes_comerciais: orc.condicoes_comerciais,
    responsabilidades_cliente: orc.responsabilidades_cliente,
    escopo_incluso: orc.escopo_incluso,
    created_at: orc.created_at || '',
    updated_at: orc.updated_at,
    aprovado_por: orc.aprovado_por,
    aprovado_em: orc.aprovado_em,
    observacoes: orc.observacoes
  })

  const loadOrcamentos = async () => {
    if (loadingRef.current) return
    setLoading(true)
    try {
      const response = await getOrcamentos({
        page: currentPageObra,
        limit: 10,
        status: filtroStatus !== "todos" ? filtroStatus : undefined,
        search: searchTerm || undefined,
      })

      if (response.success && response.data) {
        const orcamentosMapeados = response.data.map(mapearOrcamentoDaApi)
        setOrcamentos(orcamentosMapeados)
        setTotalPagesObra(response.pagination.pages || 1)
        setTotalItemsObra(response.pagination.total || 0)
      }

      // Mapear dados da API para o formato esperado pelo componente
    } catch (error: any) {
      console.error('Erro ao carregar orçamentos:', error)
      toast({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao carregar orçamentos",
        variant: "destructive"
      })
      setOrcamentos([])
    } finally {
      setLoading(false)
    }
  }


  // A filtragem já é feita pela API
  const filteredOrcamentos = orcamentos

  const getStatusBadge = (status: StatusOrcamento) => {
    const configs: Record<StatusOrcamento, { label: string; variant: "default" | "secondary" | "destructive" | "outline", icon: any, className: string }> = {
      rascunho: { 
        label: 'Rascunho', 
        variant: 'secondary', 
        icon: FileText, 
        className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' 
      },
      enviado: { 
        label: 'Enviado', 
        variant: 'default', 
        icon: Clock, 
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' 
      },
      aprovado: { 
        label: 'Aprovado', 
        variant: 'default', 
        icon: CheckCircle, 
        className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
      },
      rejeitado: { 
        label: 'Rejeitado', 
        variant: 'destructive', 
        icon: XCircle, 
        className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
      },
      vencido: { 
        label: 'Vencido', 
        variant: 'secondary', 
        icon: AlertCircle, 
        className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
      },
      convertido: { 
        label: 'Convertido', 
        variant: 'default', 
        icon: CheckCircle2, 
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
      }
    }
    
    const config = configs[status]
    
    // Fallback para status desconhecido
    if (!config) {
      return (
        <Badge variant="secondary">
          {status}
        </Badge>
      )
    }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const handleView = async (orcamento: Orcamento) => {
    try {
      const response = await getOrcamento(orcamento.id)
      if (response.success && response.data) {
        const data = response.data
        const orcamentoCompleto = {
          ...orcamento,
          ...data,
          horas_extras: data.horas_extras || data.orcamento_horas_extras || [],
          servicos_adicionais: data.servicos_adicionais || data.orcamento_servicos_adicionais || []
        }
        setSelectedOrcamento(orcamentoCompleto as any)
        setEditedOrcamento({ ...orcamentoCompleto as any })
        setIsViewDialogOpen(true)
      } else {
        setSelectedOrcamento(orcamento)
        setEditedOrcamento({ ...orcamento })
        setIsViewDialogOpen(true)
        toast({
          title: "Aviso",
          description: "Alguns dados podem estar incompletos",
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do orçamento:', error)
      setSelectedOrcamento(orcamento)
      setEditedOrcamento({ ...orcamento })
      setIsViewDialogOpen(true)
      toast({
        title: "Aviso",
        description: "Erro ao carregar detalhes completos. Exibindo dados disponíveis.",
        variant: "default"
      })
    }
  }

  // Garantir que editedOrcamento está sincronizado quando o dialog abrir
  useEffect(() => {
    if (isViewDialogOpen && selectedOrcamento && !editedOrcamento) {
      setEditedOrcamento({ ...selectedOrcamento })
    }
  }, [isViewDialogOpen, selectedOrcamento, editedOrcamento])

  const handleSaveEdit = async () => {
    if (!editedOrcamento) return
    // Implementar lógica de salvamento
    toast({
      title: "Sucesso",
      description: "Orçamento atualizado com sucesso",
    })
  }

  const handleCancelEdit = () => {
    setEditedOrcamento(null)
    setIsViewDialogOpen(false)
    setSelectedOrcamento(null)
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/orcamentos/novo?id=${id}&tipo=obra`)
  }

  const handleCreateObra = (orcamento: Orcamento) => {
    if (!orcamento.id) {
      toast({
        title: "Erro",
        description: "Orçamento inválido",
        variant: "destructive"
      })
      return
    }
    router.push(`/dashboard/orcamentos/${orcamento.id}/criar-obra`)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este orçamento?")) {
      // Implementar lógica de exclusão
      toast({
        title: "Sucesso",
        description: "Orçamento excluído",
      })
    }
  }


  const handleCreateNovoOrcamentoObra = () => {
    // Redirecionar para criar orçamento de obra
    // Por enquanto, a página /novo cria apenas de locação
    // Se houver uma página específica para obra, usar aqui
    router.push('/dashboard/orcamentos/novo?tipo=obra')
  }


  const handleCreateNovoOrcamentoComplementos = () => {
    router.push('/dashboard/orcamentos/complementos')
  }

  const handleAprovarOrcamento = async (orcamento: Orcamento) => {
    if (!window.confirm(`Deseja aprovar o orçamento ${orcamento.numero}? Após aprovar, a obra será criada automaticamente se os campos obrigatórios estiverem preenchidos.`)) {
      return
    }

    try {
      const response = await aprovarOrcamento(parseInt(orcamento.id))
      
      // Verificar se uma obra foi criada automaticamente
      if (response.obra_criada && response.obra_criada.id) {
        toast({
          title: "Sucesso",
          description: `Orçamento aprovado e obra criada automaticamente! Redirecionando para a obra...`,
        })
        // Redirecionar para a obra criada
        setTimeout(() => {
          router.push(`/dashboard/obras/${response.obra_criada.id}`)
        }, 1000)
      } else {
        toast({
          title: "Sucesso",
          description: response.aviso || "Orçamento aprovado com sucesso!",
        })
        loadOrcamentos()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao aprovar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleRejeitarOrcamento = async () => {
    if (!orcamentoParaRejeitar) return
    if (!motivoRejeicao.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    try {
      await rejeitarOrcamento(parseInt(orcamentoParaRejeitar.id), motivoRejeicao)
      toast({
        title: "Sucesso",
        description: "Orçamento rejeitado com sucesso!",
      })
      setIsRejeitarDialogOpen(false)
      setMotivoRejeicao("")
      setOrcamentoParaRejeitar(null)
      loadOrcamentos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao rejeitar orçamento",
        variant: "destructive"
      })
    }
  }

  const openRejeitarDialog = (orcamento: Orcamento) => {
    setOrcamentoParaRejeitar(orcamento)
    setMotivoRejeicao("")
    setIsRejeitarDialogOpen(true)
  }

  // Função para formatar texto em Title Case (primeira letra maiúscula)
  const formatTitleCase = (text: string | undefined | null): string => {
    if (!text) return '-'
    
    const palavrasMinusculas = ['de', 'da', 'do', 'das', 'dos', 'em', 'e', 'a', 'o', 'para', 'com', 'por']
    
    return text
      .toLowerCase()
      .split(' ')
      .map((palavra, index) => {
        if (index === 0) {
          return palavra.charAt(0).toUpperCase() + palavra.slice(1)
        }
        if (palavrasMinusculas.includes(palavra)) {
          return palavra
        }
        return palavra.charAt(0).toUpperCase() + palavra.slice(1)
      })
      .join(' ')
  }

  // Função para formatar valores monetários (para exibição)
  const formatCurrencyDisplay = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Função para formatar input de moeda (máscara)
  const formatCurrency = (value: string | number): string => {
    // Se for número, converte para string formatada diretamente
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }
    
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    // Se não há números, retorna vazio
    if (!numbers || numbers === '0') return ''
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100
    
    // Formata como moeda brasileira (sem símbolo R$)
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Função para converter valor formatado para número
  const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanValue) || 0
  }

  // Informações da empresa do hook
  const { empresa, getEnderecoCompleto, getContatoCompleto } = useEmpresa()

  const handleExportPDF = async (orcamento: Orcamento | null) => {
    if (!orcamento) return
    
    try {
      // Usar axios com responseType blob para receber o PDF
      // O interceptor do axios já adiciona o token automaticamente
      const response = await api.get(
        `/relatorios/orcamentos/${orcamento.id}/pdf`,
        {
          responseType: 'blob',
        }
      )

      // Criar blob do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' })
      
      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Orcamento-${orcamento.numero}-${orcamento.obra_nome?.replace(/\s+/g, '-') || 'obra'}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Orçamento exportado em PDF com sucesso!",
      })
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao exportar PDF do orçamento",
        variant: "destructive"
      })
    }
  }

  const escapeCsvCelula = (valor: unknown) => {
    const s = valor == null ? "" : String(valor)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const rotuloStatusOrcamentoCsv = (status: StatusOrcamento) => {
    const map: Record<StatusOrcamento, string> = {
      rascunho: "Rascunho",
      enviado: "Enviado",
      aprovado: "Aprovado",
      rejeitado: "Rejeitado",
      vencido: "Vencido",
      convertido: "Convertido",
    }
    return map[status] || status
  }

  const buscarTodosOrcamentosParaExport = async (): Promise<Orcamento[]> => {
    const PAGE_SIZE = 100
    const statusFilter = filtroStatus !== "todos" ? filtroStatus : undefined
    const search = searchTerm.trim() || undefined
    const todos: Orcamento[] = []
    let page = 1
    let totalPaginas = 1
    do {
      const res = await getOrcamentos({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
        search,
      })
      const lote = (res.data || []).map(mapearOrcamentoDaApi)
      todos.push(...lote)
      totalPaginas = res.pagination?.pages ?? 1
      page += 1
    } while (page <= totalPaginas)
    return todos
  }

  const exportarOrcamentosCsv = async () => {
    try {
      setExportandoCsv(true)
      const lista = await buscarTodosOrcamentosParaExport()
      if (lista.length === 0) {
        toast({
          title: "Nada para exportar",
          description: "Não há orçamentos com os filtros atuais.",
        })
        return
      }
      const cabecalho = [
        "ID",
        "Número",
        "Cliente",
        "Obra",
        "Cidade",
        "UF",
        "Equipamento",
        "Valor mensal",
        "Prazo (meses)",
        "Status",
        "Criado em",
      ]
      const linhas = lista.map((o) =>
        [
          o.id,
          o.numero,
          o.cliente_nome,
          o.obra_nome,
          o.obra_cidade,
          o.obra_estado,
          o.equipamento,
          Number.isFinite(o.total_mensal) ? o.total_mensal.toFixed(2) : "",
          o.prazo_locacao_meses,
          rotuloStatusOrcamentoCsv(o.status),
          o.created_at ? new Date(o.created_at).toLocaleString("pt-BR") : "",
        ].map(escapeCsvCelula).join(","),
      )
      const csv = "\ufeff" + [cabecalho.join(","), ...linhas].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orcamentos_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Exportação concluída",
        description: `${lista.length} orçamento(s) exportado(s) para CSV.`,
      })
    } catch (e) {
      console.error("Erro ao exportar orçamentos CSV:", e)
      toast({
        title: "Erro na exportação",
        description: e instanceof Error ? e.message : "Não foi possível gerar o CSV.",
        variant: "destructive",
      })
    } finally {
      setExportandoCsv(false)
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie orçamentos de obra
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCreateNovoOrcamentoObra}>
              <Building2 className="w-4 h-4 mr-2" />
              Orçamento de Obra
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateNovoOrcamentoComplementos}>
              <Package className="w-4 h-4 mr-2" />
              Orçamento de Complementos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Orçamentos de Obra</p>
            <p className="text-sm text-blue-700">
              Orçamentos vinculados a uma <strong>obra específica</strong> com informações completas da construção.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Orçamentos de Obra</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os orçamentos de obras
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative w-64 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Pesquisar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as StatusOrcamento | "todos")}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="enviado">Enviado</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                  </select>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loading || exportandoCsv}
                    onClick={exportarOrcamentosCsv}
                    title="Exportar todos os orçamentos que correspondem à pesquisa e ao status atuais"
                  >
                    {exportandoCsv ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                    ) : (
                      <Download className="h-4 w-4 mr-2 shrink-0" />
                    )}
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <CardLoader text="Carregando orçamentos..." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Orçamento</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Obra</TableHead>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Valor Mensal</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrcamentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                            Nenhum orçamento encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrcamentos.map((orcamento) => (
                          <TableRow key={orcamento.id}>
                            <TableCell className="font-medium">{orcamento.numero}</TableCell>
                            <TableCell>{orcamento.cliente_nome}</TableCell>
                            <TableCell>{orcamento.obra_nome}</TableCell>
                            <TableCell>{orcamento.equipamento}</TableCell>
                            <TableCell>{formatCurrencyDisplay(orcamento.total_mensal)}</TableCell>
                            <TableCell>{orcamento.prazo_locacao_meses} meses</TableCell>
                            <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleView(orcamento)} title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(orcamento.id)} title="Editar">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleExportPDF(orcamento)} title="PDF">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(orcamento.id)} title="Excluir">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                                {orcamento.status === 'enviado' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleAprovarOrcamento(orcamento)} 
                                      title="Aprovar Orçamento"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => openRejeitarDialog(orcamento)} 
                                      title="Rejeitar Orçamento"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {orcamento.status === 'aprovado' && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleCreateObra(orcamento)} 
                                    title="Converter em Obra"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Building2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPageObra(p => Math.max(1, p - 1))}
                            className={currentPageObra === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="px-4 text-sm text-muted-foreground">
                            Página {currentPageObra} de {totalPagesObra}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPageObra(p => Math.min(totalPagesObra, p + 1))}
                            className={currentPageObra === totalPagesObra ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Dialog para visualização de Orçamento de Obra */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Orçamento: {selectedOrcamento?.numero}</DialogTitle>
            <DialogDescription>
              Visualize os detalhes completos do orçamento
            </DialogDescription>
          </DialogHeader>
          {selectedOrcamento && (
            <div className="grid gap-5 py-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="md:col-span-2 border-blue-100 bg-blue-50/40">
                  <CardContent className="p-4">
                    <p className="text-xs text-blue-700 uppercase tracking-wide">Valor Total Mensal</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {formatCurrencyDisplay(selectedOrcamento.total_mensal)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Prazo</p>
                    <p className="text-lg font-semibold mt-1">
                      {selectedOrcamento.prazo_locacao_meses || 0} meses
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                    <div className="mt-2">{getStatusBadge(selectedOrcamento.status)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Informações do Cliente e Obra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Cliente:</span> <span className="font-medium">{selectedOrcamento.cliente_nome || "-"}</span></p>
                    <p><span className="text-gray-500">Obra:</span> <span className="font-medium">{selectedOrcamento.obra_nome || "-"}</span></p>
                    <p><span className="text-gray-500">Endereço:</span> <span className="font-medium">{selectedOrcamento.obra_endereco || "-"}</span></p>
                    <p><span className="text-gray-500">Cidade/UF:</span> <span className="font-medium">{selectedOrcamento.obra_cidade || "-"}{selectedOrcamento.obra_estado ? `/${selectedOrcamento.obra_estado}` : ""}</span></p>
                    <p><span className="text-gray-500">Tipo de Obra:</span> <span className="font-medium">{selectedOrcamento.tipo_obra || "-"}</span></p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Composição Comercial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Locação Mensal:</span> <span className="font-medium">{formatCurrencyDisplay(selectedOrcamento.valor_locacao_mensal || 0)}</span></p>
                    <p><span className="text-gray-500">Operador:</span> <span className="font-medium">{formatCurrencyDisplay(selectedOrcamento.valor_operador || 0)}</span></p>
                    <p><span className="text-gray-500">Sinaleiro:</span> <span className="font-medium">{formatCurrencyDisplay(selectedOrcamento.valor_sinaleiro || 0)}</span></p>
                    <p><span className="text-gray-500">Manutenção:</span> <span className="font-medium">{formatCurrencyDisplay(selectedOrcamento.valor_manutencao || 0)}</span></p>
                    <p><span className="text-gray-500">Data de Início Estimada:</span> <span className="font-medium">{formatarData(selectedOrcamento.data_inicio_estimada)}</span></p>
                    <p><span className="text-gray-500">Validade da Proposta:</span> <span className="font-medium">{formatarData(selectedOrcamento.validade_proposta)}</span></p>
                    <p><span className="text-gray-500">Tolerância:</span> <span className="font-medium">{selectedOrcamento.tolerancia_dias || 0} dias</span></p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dados Técnicos do Equipamento</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <p><span className="text-gray-500">Equipamento:</span> <span className="font-medium">{selectedOrcamento.equipamento || "-"}</span></p>
                  <p><span className="text-gray-500">Altura Inicial:</span> <span className="font-medium">{selectedOrcamento.altura_inicial || 0} m</span></p>
                  <p><span className="text-gray-500">Altura Final:</span> <span className="font-medium">{selectedOrcamento.altura_final || 0} m</span></p>
                  <p><span className="text-gray-500">Lança:</span> <span className="font-medium">{selectedOrcamento.comprimento_lanca || 0} m</span></p>
                  <p><span className="text-gray-500">Carga Máxima:</span> <span className="font-medium">{selectedOrcamento.carga_maxima || 0} kg</span></p>
                  <p><span className="text-gray-500">Carga na Ponta:</span> <span className="font-medium">{selectedOrcamento.carga_ponta || 0} kg</span></p>
                  <p><span className="text-gray-500">Potência Elétrica:</span> <span className="font-medium">{selectedOrcamento.potencia_eletrica || "-"}</span></p>
                  <p><span className="text-gray-500">Energia Necessária:</span> <span className="font-medium">{selectedOrcamento.energia_necessaria || "-"}</span></p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Condições e Escopo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Condições Comerciais</p>
                      <p className="font-medium whitespace-pre-wrap">{selectedOrcamento.condicoes_comerciais || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Escopo Incluso</p>
                      <p className="font-medium whitespace-pre-wrap">{selectedOrcamento.escopo_incluso || "-"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Responsabilidades e Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Responsabilidades do Cliente</p>
                      <p className="font-medium whitespace-pre-wrap">{selectedOrcamento.responsabilidades_cliente || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Observações</p>
                      <p className="font-medium whitespace-pre-wrap">{selectedOrcamento.observacoes || "-"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
                <Button onClick={() => handleEdit(selectedOrcamento.id)}>Editar Orçamento</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Rejeitar Orçamento */}
      <Dialog open={isRejeitarDialogOpen} onOpenChange={setIsRejeitarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Orçamento</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do orçamento {orcamentoParaRejeitar?.numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Motivo da Rejeição *</label>
              <Textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: Valores acima do orçado, prazo incompatível, etc."
                rows={4}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsRejeitarDialogOpen(false)
                setMotivoRejeicao("")
                setOrcamentoParaRejeitar(null)
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleRejeitarOrcamento}
                className="bg-red-600 hover:bg-red-700"
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}
