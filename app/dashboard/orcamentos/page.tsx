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
  Save
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
  const [activeTab, setActiveTab] = useState<'obra' | 'locacao'>('obra')
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<StatusOrcamento | "todos">("todos")
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [orcamentosLocacao, setOrcamentosLocacao] = useState<OrcamentoLocacao[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLocacao, setLoadingLocacao] = useState(true)
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [selectedOrcamentoLocacao, setSelectedOrcamentoLocacao] = useState<OrcamentoLocacao | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isViewLocacaoDialogOpen, setIsViewLocacaoDialogOpen] = useState(false)
  const [editedOrcamento, setEditedOrcamento] = useState<Orcamento | null>(null)
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const [dadosLocacaoCarregados, setDadosLocacaoCarregados] = useState(false)
  const loadingRef = useRef(false)
  const loadingLocacaoRef = useRef(false)

  useEffect(() => {
    if (!dadosIniciaisCarregados && !loadingRef.current) {
      loadingRef.current = true
      loadOrcamentos().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIniciaisCarregados])

  // Recarregar quando filtro de status mudar
  useEffect(() => {
    if (dadosIniciaisCarregados) {
      loadOrcamentos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus])

  // Carregar orçamentos de locação
  useEffect(() => {
    if (!dadosLocacaoCarregados && !loadingLocacaoRef.current && activeTab === 'locacao') {
      loadingLocacaoRef.current = true
      loadOrcamentosLocacao().finally(() => {
        setDadosLocacaoCarregados(true)
        loadingLocacaoRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosLocacaoCarregados, activeTab])

  // Recarregar orçamentos de locação quando tab mudar
  useEffect(() => {
    if (activeTab === 'locacao' && dadosLocacaoCarregados) {
      loadOrcamentosLocacao()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filtroStatus])

  // Debounce para busca (aguarda 500ms após parar de digitar)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    const timeoutId = setTimeout(() => {
      loadOrcamentos()
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const loadOrcamentos = async () => {
    setLoading(true)
    try {
      const response = await getOrcamentos({
        page: 1,
        limit: 100,
        status: filtroStatus !== "todos" ? filtroStatus : undefined,
        search: searchTerm || undefined
      })

      // Mapear dados da API para o formato esperado pelo componente
      const mappedData: Orcamento[] = response.data.map((orc: any) => ({
        id: String(orc.id),
        numero: orc.numero || `ORC-${orc.id}`,
        cliente_id: orc.cliente_id,
        cliente_nome: orc.clientes?.nome || orc.cliente_nome || '',
        obra_nome: orc.obras?.nome || orc.obra_nome || '',
        obra_endereco: orc.obras?.endereco || orc.obra_endereco || '',
        obra_cidade: orc.obra_cidade || '',
        obra_estado: orc.obra_estado || '',
        tipo_obra: orc.obra_tipo || orc.tipo_obra || '',
        equipamento: orc.gruas ? `${orc.gruas.name || ''} / ${orc.gruas.modelo || ''}` : orc.grua_modelo || orc.equipamento || '',
        altura_inicial: orc.grua_altura_final ? undefined : undefined,
        altura_final: orc.grua_altura_final || orc.altura_final,
        comprimento_lanca: orc.grua_lanca || orc.comprimento_lanca,
        carga_maxima: orc.grua_capacidade_1_cabo || orc.carga_maxima,
        carga_ponta: orc.grua_capacidade_2_cabos || orc.carga_ponta,
        potencia_eletrica: orc.grua_potencia ? `${orc.grua_potencia} KVA` : orc.potencia_eletrica,
        energia_necessaria: orc.grua_voltagem || orc.energia_necessaria,
        valor_locacao_mensal: orc.valor_total || 0,
        valor_operador: 0,
        valor_sinaleiro: 0,
        valor_manutencao: 0,
        total_mensal: orc.valor_total || 0,
        prazo_locacao_meses: orc.prazo_locacao_meses || 0,
        data_inicio_estimada: orc.data_inicio_estimada || '',
        tolerancia_dias: orc.tolerancia_dias || 15,
        status: orc.status as StatusOrcamento,
        validade_proposta: orc.data_validade || '',
        condicoes_comerciais: orc.condicoes_comerciais || '',
        responsabilidades_cliente: orc.responsabilidades_cliente || '',
        escopo_incluso: orc.escopo_incluso || '',
        created_at: orc.created_at || '',
        updated_at: orc.updated_at,
        aprovado_por: orc.funcionarios?.nome,
        aprovado_em: orc.data_aprovacao,
        observacoes: orc.observacoes
      }))

      setOrcamentos(mappedData)
    } catch (error: any) {
      console.error('Erro ao carregar orçamentos:', error)
      toast({
        title: "Erro",
        description: error?.message || "Erro ao carregar orçamentos",
        variant: "destructive"
      })
      setOrcamentos([])
    } finally {
      setLoading(false)
    }
  }

  const loadOrcamentosLocacao = async () => {
    setLoadingLocacao(true)
    try {
      const response = await orcamentosLocacaoApi.list({
        page: 1,
        limit: 100,
        status: filtroStatus !== "todos" ? filtroStatus : undefined,
        search: searchTerm || undefined
      })

      console.log('Resposta da API de orçamentos de locação:', response)
      
      // Garantir que estamos usando os dados corretos da resposta
      const dados = response?.data || response?.success ? (response.data || []) : []
      
      console.log('Dados processados:', dados)
      setOrcamentosLocacao(dados)
    } catch (error: any) {
      console.error('Erro ao carregar orçamentos de locação:', error)
      console.error('Detalhes do erro:', error?.response?.data || error?.message)
      toast({
        title: "Erro",
        description: error?.response?.data?.message || error?.message || "Erro ao carregar orçamentos de locação",
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
    const configs: Record<StatusOrcamento, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: any; className?: string }> = {
      rascunho: { 
        label: 'Rascunho', 
        variant: 'secondary', 
        icon: FileText, 
        className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' 
      },
      enviado: { 
        label: 'Enviado', 
        variant: 'default', 
        icon: Clock, 
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
      },
      aprovado: { 
        label: 'Aprovado', 
        variant: 'default', 
        icon: CheckCircle2, 
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
      },
      rejeitado: { 
        label: 'Rejeitado', 
        variant: 'destructive', 
        icon: XCircle, 
        className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
      },
      vencido: { 
        label: 'Vencido', 
        variant: 'destructive', 
        icon: AlertCircle, 
        className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
      },
      convertido: { 
        label: 'Convertido', 
        variant: 'default', 
        icon: CheckCircle, 
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
      }
    }
    
    const config = configs[status]
    
    // Fallback para status desconhecido
    if (!config) {
      return (
        <Badge variant="secondary" className="inline-flex items-center gap-1 w-auto bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">
          <FileText className="w-3 h-3" />
          {status}
        </Badge>
      )
    }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={`inline-flex items-center gap-1 border transition-colors w-auto ${config.className || ''}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const handleView = async (orcamento: Orcamento) => {
    try {
      // Buscar dados completos do orçamento com todos os relacionamentos
      const response = await getOrcamento(Number(orcamento.id))
      
      if (response.success && response.data) {
        // Garantir que os itens estejam mapeados corretamente
        const data = response.data as any
        const orcamentoCompleto = {
          ...data,
          // Mapear cliente_nome do relacionamento clientes se disponível
          cliente_nome: data.clientes?.nome || data.cliente_nome || '',
          itens: data.itens || data.orcamento_itens || [],
          valores_fixos: data.valores_fixos || data.orcamento_valores_fixos || [],
          custos_mensais: data.custos_mensais || data.orcamento_custos_mensais || [],
          horas_extras: data.horas_extras || data.orcamento_horas_extras || [],
          servicos_adicionais: data.servicos_adicionais || data.orcamento_servicos_adicionais || []
        }
        setSelectedOrcamento(orcamentoCompleto as any)
        setEditedOrcamento({ ...orcamentoCompleto as any })
        setIsViewDialogOpen(true)
      } else {
        // Se falhar, usar dados da listagem
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
      // Se falhar, usar dados da listagem
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

  const handleSaveEdit = () => {
    if (!editedOrcamento) return
    
    // Atualizar na lista
    setOrcamentos(orcamentos.map(item => 
      item.id === editedOrcamento.id ? editedOrcamento : item
    ))
    
    setSelectedOrcamento(editedOrcamento)
    setIsViewDialogOpen(false)
    setEditedOrcamento(null)
    
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
    router.push(`/dashboard/orcamentos/novo?id=${id}`)
  }

  const handleCreateObra = (orcamento: Orcamento) => {
    if (orcamento.status !== 'aprovado') {
      toast({
        title: "Atenção",
        description: "Apenas orçamentos aprovados podem gerar obras",
        variant: "destructive"
      })
      return
    }
    router.push(`/dashboard/orcamentos/${orcamento.id}/criar-obra`)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      setOrcamentos(orcamentos.filter(item => item.id !== id))
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

  const handleCreateNovoOrcamentoLocacao = () => {
    router.push('/dashboard/orcamentos/novo?tipo=locacao')
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
    router.push(`/dashboard/orcamentos/novo?id=${id}`)
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

        {/* Descrição explicativa das tabs */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {activeTab === 'obra' ? (
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Orçamentos de Obra</p>
                <p className="text-sm text-blue-700">
                  Orçamentos vinculados a uma <strong>obra específica</strong> com informações completas da construção, 
                  especificações técnicas detalhadas da grua (altura, lança, carga), prazo de locação, valores mensais 
                  (equipamento, operador, sinaleiro, manutenção) e condições comerciais. Quando aprovados, podem ser 
                  convertidos automaticamente em obras.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Orçamentos de Locação</p>
                <p className="text-sm text-blue-700">
                  Orçamentos para <strong>locação de equipamentos</strong> (grua ou plataforma) <strong>sem vínculo a uma obra específica</strong>. 
                  Focados nas condições de locação, valores, logística (transporte e instalação), garantias e condições gerais do contrato. 
                  Ideal para locações pontuais ou quando a obra ainda não foi definida.
                </p>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="obra" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Orçamentos</CardTitle>
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
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum orçamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrcamentos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.numero}</TableCell>
                      <TableCell>{item.cliente_nome || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.obra_nome}</div>
                          {item.obra_endereco && (
                            <div className="text-xs text-gray-500">
                              {item.obra_endereco}, {item.obra_cidade} - {item.obra_estado}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.equipamento}</TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          R$ {item.total_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.prazo_locacao_meses} meses
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.data_inicio_estimada && (
                          <div className="text-sm">
                            {new Date(item.data_inicio_estimada).toLocaleDateString('pt-BR')}
                            {item.tolerancia_dias && (
                              <div className="text-xs text-gray-500">
                                ±{item.tolerancia_dias} dias
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportPDF(item)}
                            title="Exportar PDF"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(item)}
                            title="Visualizar/Editar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.status === 'rascunho' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item.id)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {item.status === 'aprovado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateObra(item)}
                              className="text-green-600 hover:text-green-700"
                              title="Criar Obra"
                            >
                              <Building2 className="w-4 h-4 mr-1" />
                              Criar Obra
                            </Button>
                          )}
                          {item.status === 'rascunho' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="locacao" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Orçamentos de Locação</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os orçamentos de locação
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
                <option value="vencido">Vencido</option>
                <option value="convertido">Convertido</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingLocacao ? (
            <CardLoader text="Carregando orçamentos de locação..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Orçamento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamentosLocacao.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum orçamento de locação encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  orcamentosLocacao
                    .filter((item) => {
                      const matchesSearch = !searchTerm || 
                        item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.clientes?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
                      const matchesStatus = filtroStatus === "todos" || item.status === filtroStatus
                      return matchesSearch && matchesStatus
                    })
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">{item.numero}</TableCell>
                        <TableCell>{item.clientes?.nome || '-'}</TableCell>
                        <TableCell>{new Date(item.data_orcamento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{new Date(item.data_validade).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={getTipoColor(item.tipo_orcamento)}>
                            {item.tipo_orcamento === 'locacao_grua' ? 'Locação de Grua' : 'Locação de Plataforma'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status as StatusOrcamento)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportPDFLocacao(item)}
                              title="Exportar PDF"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLocacao(item)}
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {item.status === 'rascunho' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditLocacao(item.id)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização */}
      {isViewDialogOpen && selectedOrcamento && (() => {
        // Garantir que editedOrcamento está sincronizado com selectedOrcamento
        const orcamentoAtual = editedOrcamento || selectedOrcamento
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewDialogOpen(false)
                setSelectedOrcamento(null)
                setEditedOrcamento(null)
              }
            }}
          >
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Orçamento de Obra - {selectedOrcamento.numero}</CardTitle>
                    <CardDescription>{(orcamentoAtual as any)?.clientes?.nome || orcamentoAtual?.cliente_nome || 'Cliente não informado'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(selectedOrcamento)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsViewDialogOpen(false)
                        setSelectedOrcamento(null)
                        setEditedOrcamento(null)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Cliente</label>
                      <p className="text-sm font-medium">{(orcamentoAtual as any)?.clientes?.nome || orcamentoAtual?.cliente_nome || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1 inline-block">
                        {orcamentoAtual && getStatusBadge(orcamentoAtual.status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Obra</label>
                      <p className="text-sm font-medium">{orcamentoAtual?.obra_nome || '-'}</p>
                      {orcamentoAtual?.obra_endereco && (
                        <p className="text-xs text-gray-500 mt-1">
                          {orcamentoAtual.obra_endereco}
                          {orcamentoAtual.obra_cidade && `, ${orcamentoAtual.obra_cidade}`}
                          {orcamentoAtual.obra_estado && ` - ${orcamentoAtual.obra_estado}`}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tipo de Obra</label>
                      <p className="text-sm">{orcamentoAtual?.tipo_obra || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Equipamento</label>
                      <p className="text-sm">{orcamentoAtual?.equipamento || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data do Orçamento</label>
                      <p className="text-sm">{orcamentoAtual?.created_at ? new Date(orcamentoAtual.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data de Validade</label>
                      <p className="text-sm">{orcamentoAtual?.validade_proposta ? new Date(orcamentoAtual.validade_proposta).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Valor Total Mensal</label>
                      <p className="text-lg font-bold text-green-600">
                        R$ {orcamentoAtual?.total_mensal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Prazo de Locação</label>
                      <p className="text-sm">{orcamentoAtual?.prazo_locacao_meses ? `${orcamentoAtual.prazo_locacao_meses} meses` : '-'}</p>
                    </div>
                    {orcamentoAtual?.data_inicio_estimada && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Data de Início Estimada</label>
                        <p className="text-sm">
                          {new Date(orcamentoAtual.data_inicio_estimada).toLocaleDateString('pt-BR')}
                          {orcamentoAtual.tolerancia_dias && ` (±${orcamentoAtual.tolerancia_dias} dias)`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Especificações Técnicas */}
                {(orcamentoAtual?.altura_final || orcamentoAtual?.comprimento_lanca || orcamentoAtual?.carga_maxima || orcamentoAtual?.potencia_eletrica) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Especificações Técnicas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {orcamentoAtual?.altura_inicial && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Altura Inicial (m)</label>
                          <p className="text-sm">{orcamentoAtual.altura_inicial}</p>
                        </div>
                      )}
                      {orcamentoAtual?.altura_final && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Altura Final (m)</label>
                          <p className="text-sm">{orcamentoAtual.altura_final}</p>
                        </div>
                      )}
                      {orcamentoAtual?.comprimento_lanca && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Comprimento da Lança (m)</label>
                          <p className="text-sm">{orcamentoAtual.comprimento_lanca}</p>
                        </div>
                      )}
                      {orcamentoAtual?.carga_maxima && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Carga Máxima (kg)</label>
                          <p className="text-sm">{orcamentoAtual.carga_maxima}</p>
                        </div>
                      )}
                      {orcamentoAtual?.carga_ponta && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Carga na Ponta (kg)</label>
                          <p className="text-sm">{orcamentoAtual.carga_ponta}</p>
                        </div>
                      )}
                      {orcamentoAtual?.potencia_eletrica && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Potência Elétrica</label>
                          <p className="text-sm">{orcamentoAtual.potencia_eletrica}</p>
                        </div>
                      )}
                      {orcamentoAtual?.energia_necessaria && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Energia Necessária</label>
                          <p className="text-sm">{orcamentoAtual.energia_necessaria}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custos Mensais */}
                {(orcamentoAtual?.valor_locacao_mensal || orcamentoAtual?.valor_operador || orcamentoAtual?.valor_sinaleiro || orcamentoAtual?.valor_manutencao) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Custos Mensais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {orcamentoAtual?.valor_locacao_mensal !== undefined && orcamentoAtual.valor_locacao_mensal > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Locação da Grua</label>
                          <p className="text-sm font-semibold">
                            R$ {orcamentoAtual.valor_locacao_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {orcamentoAtual?.valor_operador !== undefined && orcamentoAtual.valor_operador > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Operador</label>
                          <p className="text-sm font-semibold">
                            R$ {orcamentoAtual.valor_operador.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {orcamentoAtual?.valor_sinaleiro !== undefined && orcamentoAtual.valor_sinaleiro > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Sinaleiro</label>
                          <p className="text-sm font-semibold">
                            R$ {orcamentoAtual.valor_sinaleiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {orcamentoAtual?.valor_manutencao !== undefined && orcamentoAtual.valor_manutencao > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Manutenção Preventiva</label>
                          <p className="text-sm font-semibold">
                            R$ {orcamentoAtual.valor_manutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {orcamentoAtual?.total_mensal !== undefined && orcamentoAtual.total_mensal > 0 && (
                        <div className="col-span-2 pt-2 border-t-2 border-gray-300">
                          <label className="text-base font-bold text-gray-900">Total Mensal</label>
                          <p className="text-lg font-bold text-green-600">
                            R$ {orcamentoAtual.total_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Escopo Básico Incluso */}
                {orcamentoAtual?.escopo_incluso && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Escopo Básico Incluso</h3>
                    <Textarea
                      readOnly
                      value={orcamentoAtual.escopo_incluso}
                      className="min-h-[100px] bg-gray-50"
                    />
                  </div>
                )}

                {/* Responsabilidades do Cliente */}
                {orcamentoAtual?.responsabilidades_cliente && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Responsabilidades do Cliente</h3>
                    <Textarea
                      readOnly
                      value={orcamentoAtual.responsabilidades_cliente}
                      className="min-h-[100px] bg-gray-50"
                    />
                  </div>
                )}

                {/* Condições Comerciais */}
                {orcamentoAtual?.condicoes_comerciais && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Condições Comerciais</h3>
                    <Textarea
                      readOnly
                      value={orcamentoAtual.condicoes_comerciais}
                      className="min-h-[100px] bg-gray-50"
                    />
                  </div>
                )}

              {/* Valores Fixos */}
              {orcamentoAtual && ((orcamentoAtual as any).valores_fixos || (orcamentoAtual as any).orcamento_valores_fixos) && 
               ((orcamentoAtual as any).valores_fixos || (orcamentoAtual as any).orcamento_valores_fixos).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Valores Fixos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((orcamentoAtual as any).valores_fixos || (orcamentoAtual as any).orcamento_valores_fixos || []).map((vf: any) => (
                        <TableRow key={vf.id}>
                          <TableCell>{vf.tipo}</TableCell>
                          <TableCell>{vf.descricao}</TableCell>
                          <TableCell>{vf.quantidade}</TableCell>
                          <TableCell>R$ {vf.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {vf.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Custos Mensais */}
              {orcamentoAtual && ((orcamentoAtual as any).custos_mensais || (orcamentoAtual as any).orcamento_custos_mensais) && 
               ((orcamentoAtual as any).custos_mensais || (orcamentoAtual as any).orcamento_custos_mensais).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Custos Mensais</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor Mensal</TableHead>
                        <TableHead>Obrigatório</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((orcamentoAtual as any).custos_mensais || (orcamentoAtual as any).orcamento_custos_mensais || []).map((cm: any) => (
                        <TableRow key={cm.id}>
                          <TableCell>{cm.tipo}</TableCell>
                          <TableCell>{cm.descricao}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {cm.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cm.obrigatorio ? "default" : "secondary"}>
                              {cm.obrigatorio ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Itens do Orçamento */}
              {orcamentoAtual && ((orcamentoAtual as any).itens || (orcamentoAtual as any).orcamento_itens) && 
               ((orcamentoAtual as any).itens || (orcamentoAtual as any).orcamento_itens).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Itens do Orçamento</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto/Serviço</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((orcamentoAtual as any).itens || (orcamentoAtual as any).orcamento_itens || []).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.produto_servico}</TableCell>
                          <TableCell>{item.descricao || '-'}</TableCell>
                          <TableCell>{item.quantidade} {item.unidade || ''}</TableCell>
                          <TableCell>R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}


              {/* Horas Extras */}
              {orcamentoAtual && ((orcamentoAtual as any).horas_extras || (orcamentoAtual as any).orcamento_horas_extras) && 
               ((orcamentoAtual as any).horas_extras || (orcamentoAtual as any).orcamento_horas_extras).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Horas Extras</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Dia da Semana</TableHead>
                        <TableHead>Valor/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((orcamentoAtual as any).horas_extras || (orcamentoAtual as any).orcamento_horas_extras || []).map((he: any) => (
                        <TableRow key={he.id}>
                          <TableCell>
                            {he.tipo === 'operador' ? 'Operador' : 
                             he.tipo === 'sinaleiro' ? 'Sinaleiro' : 
                             he.tipo === 'equipamento' ? 'Equipamento' : he.tipo}
                          </TableCell>
                          <TableCell>
                            {he.dia_semana === 'sabado' ? 'Sábado' : 
                             he.dia_semana === 'domingo_feriado' ? 'Domingo/Feriado' : 
                             he.dia_semana === 'normal' ? 'Normal' : he.dia_semana}
                          </TableCell>
                          <TableCell className="font-semibold">
                            R$ {he.valor_hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Serviços Adicionais */}
              {orcamentoAtual && ((orcamentoAtual as any).servicos_adicionais || (orcamentoAtual as any).orcamento_servicos_adicionais) && 
               ((orcamentoAtual as any).servicos_adicionais || (orcamentoAtual as any).orcamento_servicos_adicionais).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Serviços Adicionais</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((orcamentoAtual as any).servicos_adicionais || (orcamentoAtual as any).orcamento_servicos_adicionais || []).map((sa: any) => (
                        <TableRow key={sa.id}>
                          <TableCell>{sa.tipo}</TableCell>
                          <TableCell>{sa.descricao}</TableCell>
                          <TableCell>{sa.quantidade}</TableCell>
                          <TableCell>R$ {sa.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {sa.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Observações */}
              {orcamentoAtual?.observacoes && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Observações</h3>
                  <Textarea
                    readOnly
                    value={orcamentoAtual.observacoes}
                    className="min-h-[100px] bg-gray-50"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsViewDialogOpen(false)
                  setSelectedOrcamento(null)
                  setEditedOrcamento(null)
                }}>
                  Fechar
                </Button>
                {orcamentoAtual && orcamentoAtual.status === 'rascunho' && (
                  <Button onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEdit(orcamentoAtual.id)
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
                {orcamentoAtual && orcamentoAtual.status === 'aprovado' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      handleCreateObra(orcamentoAtual)
                    }}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Criar Obra
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )
      })()}

      {/* Dialog de Visualização de Orçamento de Locação */}
      {isViewLocacaoDialogOpen && selectedOrcamentoLocacao && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsViewLocacaoDialogOpen(false)
              setSelectedOrcamentoLocacao(null)
            }
          }}
        >
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Orçamento de Locação - {selectedOrcamentoLocacao.numero}</CardTitle>
                  <CardDescription>{selectedOrcamentoLocacao.clientes?.nome || 'Cliente não informado'}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDFLocacao(selectedOrcamentoLocacao)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsViewLocacaoDialogOpen(false)
                      setSelectedOrcamentoLocacao(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cliente</label>
                    <p className="text-sm font-medium">{selectedOrcamentoLocacao.clientes?.nome || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 inline-block">{getStatusBadge(selectedOrcamentoLocacao.status as StatusOrcamento)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data do Orçamento</label>
                    <p className="text-sm">{new Date(selectedOrcamentoLocacao.data_orcamento).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data de Validade</label>
                    <p className="text-sm">{new Date(selectedOrcamentoLocacao.data_validade).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Valor Total</label>
                    <p className="text-lg font-bold text-green-600">
                      R$ {selectedOrcamentoLocacao.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo</label>
                    <div className="mt-1">
                      <Badge className={getTipoColor(selectedOrcamentoLocacao.tipo_orcamento)}>
                        {selectedOrcamentoLocacao.tipo_orcamento === 'locacao_grua' ? 'Locação de Grua' : 'Locação de Plataforma'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Condições Gerais */}
              {selectedOrcamentoLocacao.condicoes_gerais && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Condições Gerais</h3>
                  <Textarea
                    readOnly
                    value={selectedOrcamentoLocacao.condicoes_gerais}
                    className="min-h-[100px] bg-gray-50"
                  />
                </div>
              )}

              {/* Logística */}
              {selectedOrcamentoLocacao.logistica && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Logística</h3>
                  <Textarea
                    readOnly
                    value={selectedOrcamentoLocacao.logistica}
                    className="min-h-[100px] bg-gray-50"
                  />
                </div>
              )}

              {/* Garantias */}
              {selectedOrcamentoLocacao.garantias && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Garantias</h3>
                  <Textarea
                    readOnly
                    value={selectedOrcamentoLocacao.garantias}
                    className="min-h-[100px] bg-gray-50"
                  />
                </div>
              )}

              {/* Valores Fixos */}
              {selectedOrcamentoLocacao.orcamento_valores_fixos_locacao && selectedOrcamentoLocacao.orcamento_valores_fixos_locacao.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Valores Fixos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrcamentoLocacao.orcamento_valores_fixos_locacao.map((vf) => (
                        <TableRow key={vf.id}>
                          <TableCell>{vf.tipo}</TableCell>
                          <TableCell>{vf.descricao}</TableCell>
                          <TableCell>{vf.quantidade}</TableCell>
                          <TableCell>R$ {vf.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {vf.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Custos Mensais */}
              {selectedOrcamentoLocacao.orcamento_custos_mensais_locacao && selectedOrcamentoLocacao.orcamento_custos_mensais_locacao.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Custos Mensais</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor Mensal</TableHead>
                        <TableHead>Obrigatório</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrcamentoLocacao.orcamento_custos_mensais_locacao.map((cm) => (
                        <TableRow key={cm.id}>
                          <TableCell>{cm.tipo}</TableCell>
                          <TableCell>{cm.descricao}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {cm.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cm.obrigatorio ? "default" : "secondary"}>
                              {cm.obrigatorio ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Itens */}
              {selectedOrcamentoLocacao.orcamento_itens_locacao && selectedOrcamentoLocacao.orcamento_itens_locacao.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Itens do Orçamento</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto/Serviço</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrcamentoLocacao.orcamento_itens_locacao.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.produto_servico}</TableCell>
                          <TableCell>{item.descricao || '-'}</TableCell>
                          <TableCell>{item.quantidade} {item.unidade || ''}</TableCell>
                          <TableCell>R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Observações */}
              {selectedOrcamentoLocacao.observacoes && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Observações</h3>
                  <Textarea
                    readOnly
                    value={selectedOrcamentoLocacao.observacoes}
                    className="min-h-[100px] bg-gray-50"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsViewLocacaoDialogOpen(false)
                  setSelectedOrcamentoLocacao(null)
                }}>
                  Fechar
                </Button>
                {selectedOrcamentoLocacao.status === 'rascunho' && (
                  <Button onClick={() => {
                    setIsViewLocacaoDialogOpen(false)
                    handleEditLocacao(selectedOrcamentoLocacao.id)
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

