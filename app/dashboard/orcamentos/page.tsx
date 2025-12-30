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
  Package
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import { ExportButton } from "@/components/export-button"
import { CardLoader } from "@/components/ui/loader"
import { OrcamentoPDFDocument } from "@/components/orcamento-pdf"
import { pdf } from "@react-pdf/renderer"
import { getOrcamentos, getOrcamento, type Orcamento as OrcamentoAPI } from "@/lib/api-orcamentos"
import { api, API_BASE_URL } from "@/lib/api"
import { orcamentosLocacaoApi, OrcamentoLocacao } from "@/lib/api-orcamentos-locacao"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [orcamentosLocacao, setOrcamentosLocacao] = useState<OrcamentoLocacao[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingLocacao, setLoadingLocacao] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<StatusOrcamento | "todos">("todos")
  const [activeTab, setActiveTab] = useState<'obra' | 'locacao'>('obra')
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [selectedOrcamentoLocacao, setSelectedOrcamentoLocacao] = useState<OrcamentoLocacao | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isViewLocacaoDialogOpen, setIsViewLocacaoDialogOpen] = useState(false)
  const [editedOrcamento, setEditedOrcamento] = useState<Orcamento | null>(null)
  const [currentPageObra, setCurrentPageObra] = useState(1)
  const [currentPageLocacao, setCurrentPageLocacao] = useState(1)
  const [totalPagesObra, setTotalPagesObra] = useState(1)
  const [totalPagesLocacao, setTotalPagesLocacao] = useState(1)
  const [totalItemsObra, setTotalItemsObra] = useState(0)
  const [totalItemsLocacao, setTotalItemsLocacao] = useState(0)
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const [dadosLocacaoCarregados, setDadosLocacaoCarregados] = useState(false)
  const loadingRef = useRef(false)
  const loadingLocacaoRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const initialLocacaoLoadDoneRef = useRef(false)
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
    
    if (activeTab === 'obra' && !loadingRef.current) {
      initialLoadDoneRef.current = true
      loadingRef.current = true
      loadOrcamentos().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

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
    if (!dadosIniciaisCarregados || activeTab !== 'obra') return
    
    // Verificar se houve mudança real na página
    const pageChanged = prevCurrentPageObraRef.current !== currentPageObra
    
    if (pageChanged) {
      prevCurrentPageObraRef.current = currentPageObra
      loadOrcamentos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageObra, dadosIniciaisCarregados, activeTab])

  useEffect(() => {
    if (!dadosLocacaoCarregados && activeTab === 'locacao') {
      loadingLocacaoRef.current = true
      loadOrcamentosLocacao().finally(() => {
        setDadosLocacaoCarregados(true)
        loadingLocacaoRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosLocacaoCarregados, activeTab])

  useEffect(() => {
    if (filtroStatus !== "todos") {
      setCurrentPageLocacao(1) // Resetar para primeira página ao mudar filtro
      loadOrcamentosLocacao()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filtroStatus])

  useEffect(() => {
    if (dadosLocacaoCarregados && activeTab === 'locacao') {
      loadOrcamentosLocacao()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageLocacao])

  // Debounce para pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPageObra(1) // Resetar para primeira página ao pesquisar
      loadOrcamentos()
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPageLocacao(1) // Resetar para primeira página ao pesquisar
      loadOrcamentosLocacao()
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

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
        const orcamentosMapeados = response.data.map((orc: OrcamentoAPI) => ({
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
        }))
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

  const loadOrcamentosLocacao = async () => {
    if (loadingLocacaoRef.current) return
    setLoadingLocacao(true)
    try {
      const response = await orcamentosLocacaoApi.list({
        page: currentPageLocacao,
        limit: 10,
        status: filtroStatus !== "todos" ? filtroStatus : undefined,
        search: searchTerm || undefined,
      })
      
      if (response.success && response.data) {
        setOrcamentosLocacao(response.data)
        setTotalPagesLocacao(response.pagination.pages || 1)
        setTotalItemsLocacao(response.pagination.total || 0)
      }
      
      // Garantir que estamos usando os dados corretos da resposta
    } catch (error: any) {
      console.error('Erro ao carregar orçamentos de locação:', error)
      toast({
        title: "Erro",
        description: error?.response?.data?.message || "Erro ao carregar orçamentos de locação",
        variant: "destructive"
      })
      setOrcamentosLocacao([])
    } finally {
      setLoadingLocacao(false)
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

  const handleDeleteLocacao = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este orçamento de locação?")) {
      try {
        const response = await orcamentosLocacaoApi.delete(id)
        if (response.success) {
          toast({
            title: "Sucesso",
            description: "Orçamento de locação excluído com sucesso",
          })
          // Recarregar lista
          loadOrcamentosLocacao(currentPageLocacao)
        } else {
          toast({
            title: "Erro",
            description: response.message || "Erro ao excluir orçamento",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error('Erro ao excluir orçamento de locação:', error)
        toast({
          title: "Erro",
          description: error.response?.data?.message || "Erro ao excluir orçamento",
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateNovoOrcamentoObra = () => {
    // Redirecionar para criar orçamento de obra
    // Por enquanto, a página /novo cria apenas de locação
    // Se houver uma página específica para obra, usar aqui
    router.push('/dashboard/orcamentos/novo?tipo=obra')
  }

  const handleCreateNovoOrcamentoLocacao = () => {
    router.push('/dashboard/orcamentos/novo?tipo=locacao')
  }

  const handleCreateNovoOrcamentoComplementos = () => {
    router.push('/dashboard/orcamentos/complementos')
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

  const handleExportPDFLocacao = async (orcamento: OrcamentoLocacao | null) => {
    if (!orcamento) return
    
    try {
      // Usar axios com responseType blob para receber o PDF
      // O interceptor do axios já adiciona o token automaticamente
      // Usar rota específica para orçamentos de locação
      const response = await api.get(
        `/relatorios/orcamentos-locacao/${orcamento.id}/pdf`,
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
      const clienteNome = orcamento.clientes?.nome?.replace(/\s+/g, '-') || 'cliente'
      link.download = `Orcamento-${orcamento.numero}-${clienteNome}-${new Date().toISOString().split('T')[0]}.pdf`
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
      
      // Tentar ler mensagem de erro do blob se for erro do servidor
      let errorMessage = "Erro ao exportar orçamento. Tente novamente."
      
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const errorData = JSON.parse(text)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // Se não conseguir parsear, usar mensagem padrão
        }
      } else if (error.response?.data?.message || error.response?.data?.error) {
        errorMessage = error.response.data.message || error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Se for erro de token, mostrar mensagem mais específica
      if (errorMessage.includes('Token') || errorMessage.includes('token') || errorMessage.includes('inválido') || errorMessage.includes('expirado')) {
        toast({
          title: "Erro de Autenticação",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        })
      }
    }
  }

  const handleViewLocacao = async (orcamento: OrcamentoLocacao) => {
    try {
      // Buscar dados completos do orçamento com todos os relacionamentos
      const response = await orcamentosLocacaoApi.get(orcamento.id)
      if (response.success && response.data) {
        setSelectedOrcamentoLocacao(response.data)
        setIsViewLocacaoDialogOpen(true)
      } else {
        // Se falhar, usar dados da listagem
        setSelectedOrcamentoLocacao(orcamento)
        setIsViewLocacaoDialogOpen(true)
        toast({
          title: "Aviso",
          description: "Alguns dados podem estar incompletos",
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error('Erro ao buscar detalhes do orçamento:', error)
      // Se falhar, usar dados da listagem
      setSelectedOrcamentoLocacao(orcamento)
      setIsViewLocacaoDialogOpen(true)
      toast({
        title: "Aviso",
        description: "Erro ao carregar detalhes completos. Exibindo dados disponíveis.",
        variant: "default"
      })
    }
  }

  const handleEditLocacao = (id: number) => {
    router.push(`/dashboard/orcamentos/novo?id=${id}&tipo=locacao`)
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'locacao_grua':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      case 'locacao_plataforma':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie orçamentos de obra e locação
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
            <DropdownMenuItem onClick={handleCreateNovoOrcamentoLocacao}>
              <FileText className="w-4 h-4 mr-2" />
              Orçamento de Locação
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateNovoOrcamentoComplementos}>
              <Package className="w-4 h-4 mr-2" />
              Orçamento de Complementos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'obra' | 'locacao')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="obra">
            <Building2 className="w-4 h-4 mr-2" />
            Orçamentos de Obra
          </TabsTrigger>
          <TabsTrigger value="locacao">
            <FileText className="w-4 h-4 mr-2" />
            Orçamentos de Locação
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {activeTab === 'obra' ? (
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Orçamentos de Obra</p>
                <p className="text-sm text-blue-700">
                  Orçamentos vinculados a uma <strong>obra específica</strong> com informações completas da construção.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Orçamentos de Locação</p>
                <p className="text-sm text-blue-700">
                  Orçamentos para <strong>locação de equipamentos</strong> sem vínculo a uma obra específica.
                </p>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="obra" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Orçamentos de Obra</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os orçamentos de obras
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-64">
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
                                {orcamento.status === 'aprovado' && (
                                  <Button variant="ghost" size="icon" onClick={() => handleCreateObra(orcamento)} title="Gerar Obra">
                                    <Building2 className="h-4 w-4 text-green-600" />
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
        </TabsContent>

        <TabsContent value="locacao" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Orçamentos de Locação</CardTitle>
                  <CardDescription>
                    Visualize e gerencie orçamentos de locação
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-64">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLocacao ? (
                <CardLoader text="Carregando orçamentos de locação..." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Orçamento</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamentosLocacao.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            Nenhum orçamento de locação encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        orcamentosLocacao.map((orc) => (
                          <TableRow key={orc.id}>
                            <TableCell className="font-medium">{orc.numero}</TableCell>
                            <TableCell>{orc.clientes?.nome || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getTipoColor(orc.tipo_orcamento || '')}>
                                {orc.tipo_orcamento === 'locacao_grua' ? 'Grua' : orc.tipo_orcamento === 'locacao_plataforma' ? 'Plataforma' : '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrencyDisplay(orc.valor_total || 0)}</TableCell>
                            <TableCell>{((orc as any).prazo_locacao_meses ? `${(orc as any).prazo_locacao_meses} meses` : orc.prazo_entrega || '-')}</TableCell>
                            <TableCell>{getStatusBadge(orc.status as StatusOrcamento)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewLocacao(orc)} title="Visualizar">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditLocacao(orc.id)} title="Editar">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleExportPDFLocacao(orc)} title="PDF">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteLocacao(orc.id)} title="Excluir">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
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
                            onClick={() => setCurrentPageLocacao(p => Math.max(1, p - 1))}
                            className={currentPageLocacao === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="px-4 text-sm text-muted-foreground">
                            Página {currentPageLocacao} de {totalPagesLocacao}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPageLocacao(p => Math.min(totalPagesLocacao, p + 1))}
                            className={currentPageLocacao === totalPagesLocacao ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
             <div className="grid gap-4 py-4">
               {/* Resumo simples para visualização - pode ser expandido conforme necessidade */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <h3 className="font-semibold mb-2">Informações do Cliente</h3>
                   <p className="text-sm">Cliente: {selectedOrcamento.cliente_nome}</p>
                   <p className="text-sm">Obra: {selectedOrcamento.obra_nome}</p>
                   <p className="text-sm">Endereço: {selectedOrcamento.obra_endereco}</p>
                 </div>
                 <div>
                   <h3 className="font-semibold mb-2">Detalhes Comerciais</h3>
                   <p className="text-sm">Status: {selectedOrcamento.status}</p>
                   <p className="text-sm">Valor Total: {formatCurrencyDisplay(selectedOrcamento.total_mensal)}</p>
                   <p className="text-sm">Prazo: {selectedOrcamento.prazo_locacao_meses} meses</p>
                 </div>
               </div>
               
               <div className="flex justify-end gap-2 mt-4">
                 <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
                 <Button onClick={() => handleEdit(selectedOrcamento.id)}>Editar Orçamento</Button>
               </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para visualização de Orçamento de Locação */}
      <Dialog open={isViewLocacaoDialogOpen} onOpenChange={setIsViewLocacaoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Locação: {selectedOrcamentoLocacao?.numero}</DialogTitle>
          </DialogHeader>
          {selectedOrcamentoLocacao && (
             <div className="grid gap-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <h3 className="font-semibold mb-2">Cliente</h3>
                   <p className="text-sm">{selectedOrcamentoLocacao.clientes?.nome}</p>
                 </div>
                <div>
                  <h3 className="font-semibold mb-2">Equipamento</h3>
                  <p className="text-sm capitalize">
                    {(() => {
                      const tipo = selectedOrcamentoLocacao?.tipo_orcamento;
                      if (!tipo) return '-';
                      return tipo.replace(/_/g, ' ').replace(/^locacao\s*/i, '');
                    })()}
                  </p>
                </div>
               </div>
               <div className="flex justify-end gap-2 mt-4">
                 <Button variant="outline" onClick={() => setIsViewLocacaoDialogOpen(false)}>Fechar</Button>
                 <Button onClick={() => handleEditLocacao(selectedOrcamentoLocacao.id)}>Editar</Button>
               </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
