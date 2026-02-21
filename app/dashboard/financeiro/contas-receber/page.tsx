"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  DollarSign,
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { receitasApi, Receita, ReceitaCreate, ReceitaUpdate } from "@/lib/api-receitas"
import { receitasUtils } from "@/lib/receitas-utils"
import apiObras from "@/lib/api-obras"
import { funcionariosApi } from "@/lib/api-funcionarios"
// Orçamentos removidos - não devem aparecer em contas a receber
// import { getOrcamentos, Orcamento, formatarStatusOrcamento } from "@/lib/api-orcamentos"
import { medicoesMensaisApi, MedicaoMensal } from "@/lib/api-medicoes-mensais"
import { notasFiscaisApi } from "@/lib/api-notas-fiscais"
import { apiContasBancarias, ContaBancaria } from "@/lib/api-contas-bancarias"

// Interface local para obras com campos adicionais
interface Obra {
  id: number
  nome: string
  endereco?: string
  cidade?: string
  cliente_id: number
  clientes?: {
    id: number
    nome: string
  }
}

// Interface estendida para receitas com relacionamentos
interface ReceitaComRelacionamentos extends Receita {
  obras?: {
    id: number
    nome: string
    clientes?: {
      id: number
      nome: string
    }
  }
  funcionarios?: {
    id: number
    nome: string
    cargo: string
  }
}

// Interface para contas a receber
interface ContaReceber {
  id: number | string // Pode ser número ou string (ex: "nf_123" para notas fiscais)
  tipo?: 'conta_receber' | 'nota_fiscal' // Tipo do registro
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  cliente?: { id?: number; nome: string; cnpj?: string }
  obra?: { id?: number; nome: string }
  observacoes?: string
  // Campos específicos de notas fiscais
  numero_nf?: string
  serie?: string
  data_emissao?: string
}

interface Alertas {
  vencidas: { quantidade: number; valor_total: number; contas: ContaReceber[] }
  vencendo: { quantidade: number; valor_total: number; contas: ContaReceber[] }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

export default function ContasReceberPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados para Receitas
  const [receitas, setReceitas] = useState<ReceitaComRelacionamentos[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterObra, setFilterObra] = useState("all")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [obraFilter, setObraFilter] = useState("")
  const [obraSearchFilter, setObraSearchFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReceita, setEditingReceita] = useState<ReceitaComRelacionamentos | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<any>(null)
  const [loadingDetalhesNota, setLoadingDetalhesNota] = useState(false)

  // Estados para Contas a Receber
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [alertas, setAlertas] = useState<Alertas | null>(null)
  const [filtroStatusContas, setFiltroStatusContas] = useState<string>('todos')
  
  // Estados para Orçamentos - REMOVIDO: orçamentos não devem aparecer em contas a receber
  // const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  
  // Estados para Medições
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  
  // Estados para Contas Bancárias
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])

  // Estados para Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Formulário de Receitas
  const [receitaForm, setReceitaForm] = useState({
    obra_id: '',
    tipo: 'locacao' as 'locacao' | 'servico' | 'venda',
    descricao: '',
    valor: 0,
    data_receita: new Date().toISOString().split('T')[0],
    funcionario_id: 'none',
    conta_bancaria_id: 'none',
    observacoes: ''
  })

  // ========== FUNÇÕES DE CARREGAMENTO (definidas antes dos useEffects) ==========
  const carregarMedicoes = async () => {
    try {
      const filters: any = {
        page: currentPage,
        limit: itemsPerPage
      }
      if (filterPeriodo) {
        filters.periodo = filterPeriodo
      }
      if (filterStatus !== 'all') {
        filters.status = filterStatus
      }
      if (searchTerm) {
        filters.search = searchTerm
      }
      if (filterObra !== 'all') {
        filters.obra_id = parseInt(filterObra)
      }
      
      const response = await medicoesMensaisApi.listar(filters)
      if (response.success) {
        setMedicoes(response.data || [])
        if (response.pagination) {
          setTotalItems(response.pagination.total || 0)
          setTotalPages(response.pagination.pages || 1)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar medições:', error)
    }
  }

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar receitas, obras, funcionários, medições e contas bancárias em paralelo
      const [receitasData, obrasData, funcionariosData, medicoesData, contasBancariasData] = await Promise.all([
        receitasApi.list(),
        apiObras.listarObras(),
        funcionariosApi.listarFuncionarios(),
        medicoesMensaisApi.listar({ page: currentPage, limit: itemsPerPage }),
        apiContasBancarias.listar({ ativa: true })
      ])

      setReceitas(receitasData.receitas || [])
      setObras(obrasData.data || [])
      setFuncionarios(funcionariosData.data || [])
      setMedicoes(medicoesData.data || [])
      setContasBancarias(contasBancariasData || [])
      if (medicoesData.pagination) {
        setTotalItems(medicoesData.pagination.total || 0)
        setTotalPages(medicoesData.pagination.pages || 1)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarContas = async () => {
    try {
      const token = getAuthToken()
      
      let url = `${API_URL}/api/contas-receber?limite=100`
      if (filtroStatusContas && filtroStatusContas !== 'todos') {
        url += `&status=${filtroStatusContas}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setContas(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    }
  }

  const carregarAlertas = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-receber/alertas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setAlertas(data.alertas)
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    }
  }

  // ========== USEEFFECTS ==========
  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarContas()
    carregarAlertas()
  }, [filtroStatusContas])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterPeriodo, filterStatus, searchTerm, filterObra])

  useEffect(() => {
    carregarMedicoes()
  }, [currentPage, filterPeriodo, filterStatus, searchTerm, filterObra])

  // ========== USEMEMO - FILTROS (PRIMEIRO, antes de qualquer uso) ==========
  // Filtrar receitas
  const filteredReceitas = useMemo(() => {
    return (receitas || []).filter(receita => {
      const matchesSearch = (receita.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (receita.obras?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (receita.obras?.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || receita.status === filterStatus
      const matchesTipo = filterTipo === 'all' || receita.tipo === filterTipo
      const matchesObra = filterObra === 'all' || receita.obra_id?.toString() === filterObra
      const matchesPeriodo = !filterPeriodo || (receita.data_receita || '').startsWith(filterPeriodo)
      return matchesSearch && matchesStatus && matchesTipo && matchesObra && matchesPeriodo
    })
  }, [receitas, searchTerm, filterStatus, filterTipo, filterObra, filterPeriodo])

  // Filtrar orçamentos - REMOVIDO: orçamentos não devem aparecer em contas a receber
  // const filteredOrcamentos = useMemo(() => { ... }, [orcamentos, searchTerm, filterStatus, filterObra, filterPeriodo])

  // Filtrar medições (já vem filtrado da API, mas podemos aplicar filtros adicionais no cliente se necessário)
  const filteredMedicoes = useMemo(() => {
    return (medicoes || []).filter(medicao => {
      const matchesSearch = (medicao.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (medicao.obras?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (medicao.obras?.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || medicao.status === filterStatus
      const matchesObra = filterObra === 'all' || (medicao.obra_id?.toString() === filterObra)
      const matchesPeriodo = !filterPeriodo || (medicao.periodo || '').startsWith(filterPeriodo)
      return matchesSearch && matchesStatus && matchesObra && matchesPeriodo
    })
  }, [medicoes, searchTerm, filterStatus, filterObra, filterPeriodo])

  // Combinar todos os registros para paginação (sem orçamentos)
  const todosRegistros = useMemo(() => {
    return [
      ...filteredReceitas.map(r => ({ tipo: 'receita' as const, data: r })),
      ...filteredMedicoes.map(m => ({ tipo: 'medicao' as const, data: m })),
      // Orçamentos removidos - não devem aparecer em contas a receber
      ...contas.map(c => ({ 
        tipo: (c.tipo === 'nota_fiscal' ? 'nota_fiscal' : 'conta') as const, 
        data: c 
      }))
    ]
  }, [filteredReceitas, filteredMedicoes, contas])

  // Calcular paginação
  const totalRegistros = todosRegistros.length
  const totalPagesCalculado = Math.ceil(totalRegistros / itemsPerPage)
  const inicio = (currentPage - 1) * itemsPerPage
  const fim = inicio + itemsPerPage
  const registrosPaginados = todosRegistros.slice(inicio, fim)

  // Calcular totais incluindo receitas e contas a receber/notas fiscais
  const totaisReceitas = useMemo(() => {
    return receitasUtils.calculateTotals(receitas)
  }, [receitas])
  
  // Calcular totais das contas a receber e notas fiscais
  const totaisContas = useMemo(() => {
    const totalContas = contas.reduce((sum, conta) => sum + (conta.valor || 0), 0)
    const contasPagas = contas
      .filter(c => c.status === 'pago')
      .reduce((sum, conta) => sum + (conta.valor || 0), 0)
    const contasPendentes = contas
      .filter(c => c.status === 'pendente' || c.status === 'vencido')
      .reduce((sum, conta) => sum + (conta.valor || 0), 0)
    
    return {
      total: totalContas,
      pagas: contasPagas,
      pendentes: contasPendentes,
      count: contas.length
    }
  }, [contas])
  
  // Totais combinados (receitas + contas)
  const totalReceitas = totaisReceitas.total + totaisContas.total
  const totalConfirmadas = totaisReceitas.confirmadas + totaisContas.pagas
  const totalPendentes = totaisReceitas.pendentes + totaisContas.pendentes
  const totalRegistrosCard = receitas.length + contas.length

  // Filtrar obras para seleção nos formulários
  const obrasFiltradas = obras.filter(obra => {
    if (!obraFilter) return true
    const searchTerm = obraFilter.toLowerCase()
    return (
      obra.nome?.toLowerCase().includes(searchTerm) ||
      obra.endereco?.toLowerCase().includes(searchTerm) ||
      obra.cidade?.toLowerCase().includes(searchTerm)
    )
  })

  // Filtrar obras para o filtro principal
  const obrasFiltradasParaFiltro = obras.filter(obra => {
    if (!obraSearchFilter) return true
    const searchTerm = obraSearchFilter.toLowerCase()
    return (
      obra.nome?.toLowerCase().includes(searchTerm) ||
      obra.endereco?.toLowerCase().includes(searchTerm) ||
      obra.cidade?.toLowerCase().includes(searchTerm)
    )
  })

  // ========== HANDLERS ==========
  // Handlers de Receitas
  const handleCreateReceita = async () => {
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []
    
    if (!receitaForm.obra_id || receitaForm.obra_id === '') {
      camposFaltando.push('Obra')
    }
    
    if (!receitaForm.tipo || !receitaForm.tipo.trim()) {
      camposFaltando.push('Tipo')
    }
    
    if (!receitaForm.descricao || !receitaForm.descricao.trim()) {
      camposFaltando.push('Descrição')
    }
    
    if (!receitaForm.valor || receitaForm.valor <= 0) {
      camposFaltando.push('Valor')
    }
    
    if (!receitaForm.data_receita || !receitaForm.data_receita.trim()) {
      camposFaltando.push('Data da Receita')
    }
    
    if (camposFaltando.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha os seguintes campos: ${camposFaltando.join(', ')}`,
        variant: "destructive"
      })
      return
    }
    
    try {
      const receitaData: ReceitaCreate = {
        obra_id: parseInt(receitaForm.obra_id),
        tipo: receitaForm.tipo,
        descricao: receitaForm.descricao,
        valor: receitaForm.valor,
        data_receita: receitaForm.data_receita,
        funcionario_id: receitaForm.funcionario_id && receitaForm.funcionario_id !== 'none' ? parseInt(receitaForm.funcionario_id) : undefined,
        observacoes: receitaForm.observacoes.trim() || undefined
      }

      await receitasApi.create(receitaData)

      // Registrar movimentação bancária (entrada) se conta bancária selecionada
      if (receitaForm.conta_bancaria_id && receitaForm.conta_bancaria_id !== 'none') {
        try {
          await apiContasBancarias.registrarMovimentacao(
            parseInt(receitaForm.conta_bancaria_id),
            {
              tipo: 'entrada',
              valor: receitaForm.valor,
              descricao: `Receita: ${receitaForm.descricao}`,
              categoria: 'receita',
              data: receitaForm.data_receita
            }
          )
        } catch (err) {
          console.error('Erro ao registrar movimentação bancária:', err)
          toast({
            title: "Aviso",
            description: "Receita criada, mas houve erro ao atualizar o saldo bancário",
            variant: "default"
          })
        }
      }

      await carregarDados()
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Receita criada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar receita",
        variant: "destructive"
      })
    }
  }

  const handleEditReceita = (receita: ReceitaComRelacionamentos) => {
    setEditingReceita(receita)
    setReceitaForm({
      obra_id: receita.obra_id.toString(),
      tipo: receita.tipo,
      descricao: receita.descricao,
      valor: receita.valor,
      data_receita: receita.data_receita,
      funcionario_id: receita.funcionario_id?.toString() || 'none',
      observacoes: receita.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateReceita = async () => {
    if (!editingReceita) return
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []
    
    if (!receitaForm.obra_id || receitaForm.obra_id === '') {
      camposFaltando.push('Obra')
    }
    
    if (!receitaForm.tipo || !receitaForm.tipo.trim()) {
      camposFaltando.push('Tipo')
    }
    
    if (!receitaForm.descricao || !receitaForm.descricao.trim()) {
      camposFaltando.push('Descrição')
    }
    
    if (!receitaForm.valor || receitaForm.valor <= 0) {
      camposFaltando.push('Valor')
    }
    
    if (!receitaForm.data_receita || !receitaForm.data_receita.trim()) {
      camposFaltando.push('Data da Receita')
    }
    
    if (camposFaltando.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, preencha os seguintes campos: ${camposFaltando.join(', ')}`,
        variant: "destructive"
      })
      return
    }

    try {
      const receitaData: ReceitaUpdate = {
        obra_id: parseInt(receitaForm.obra_id),
        tipo: receitaForm.tipo,
        descricao: receitaForm.descricao,
        valor: receitaForm.valor,
        data_receita: receitaForm.data_receita,
        funcionario_id: receitaForm.funcionario_id && receitaForm.funcionario_id !== 'none' ? parseInt(receitaForm.funcionario_id) : undefined,
        observacoes: receitaForm.observacoes.trim() || undefined
      }

      await receitasApi.update(editingReceita.id, receitaData)
      await carregarDados()
      
      setIsEditDialogOpen(false)
      setEditingReceita(null)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Receita atualizada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar receita",
        variant: "destructive"
      })
    }
  }

  const handleDeleteReceita = async (id: string) => {
    try {
      await receitasApi.delete(id)
      await carregarDados()
      toast({
        title: "Sucesso",
        description: "Receita removida com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover receita",
        variant: "destructive"
      })
    }
  }

  const handleConfirmReceita = async (id: string) => {
    try {
      await receitasApi.confirm(id)
      await carregarDados()
      toast({
        title: "Sucesso",
        description: "Receita confirmada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao confirmar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao confirmar receita",
        variant: "destructive"
      })
    }
  }

  const handleCancelReceita = async (id: string) => {
    try {
      await receitasApi.cancel(id)
      await carregarDados()
      toast({
        title: "Sucesso",
        description: "Receita cancelada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao cancelar receita:', error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar receita",
        variant: "destructive"
      })
    }
  }

  const handleExportReceitas = async () => {
    try {
      await receitasApi.export({
        obra_id: filterObra !== 'all' ? parseInt(filterObra) : undefined,
        tipo: filterTipo !== 'all' ? filterTipo : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        data_inicio: filterPeriodo ? `${filterPeriodo}-01` : undefined,
        data_fim: filterPeriodo ? `${filterPeriodo}-31` : undefined
      })
      toast({
        title: "Sucesso",
        description: "Receitas exportadas com sucesso"
      })
    } catch (error) {
      console.error('Erro ao exportar receitas:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar receitas",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setReceitaForm({
      obra_id: '',
      tipo: 'locacao',
      descricao: '',
      valor: 0,
      data_receita: new Date().toISOString().split('T')[0],
      funcionario_id: 'none',
      conta_bancaria_id: 'none',
      observacoes: ''
    })
    setObraFilter('')
    setObraSearchFilter('')
  }

  // Handlers de Contas a Receber
  const marcarComoPago = async (id: number | string) => {
    try {
      const token = getAuthToken()
      const dataPagamento = new Date().toISOString().split('T')[0]
      
      let response: Response

      if (typeof id === 'string' && id.startsWith('nf_')) {
        const notaId = id.replace('nf_', '')
        response = await fetch(`${API_URL}/api/notas-fiscais/${notaId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'paga' })
        })
      } else if (typeof id === 'string' && id.startsWith('boleto_')) {
        const boletoId = id.replace('boleto_', '')
        response = await fetch(`${API_URL}/api/boletos/${boletoId}/pagar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data_pagamento: dataPagamento })
        })
      } else {
        response = await fetch(`${API_URL}/api/contas-receber/${id}/pagar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data_pagamento: dataPagamento })
        })
      }

      if (response.ok) {
        carregarContas()
        carregarAlertas()
        toast({
          title: "Sucesso",
          description: "Conta marcada como paga"
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao marcar como pago')
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao marcar como pago",
        variant: "destructive"
      })
    }
  }

  // Utilitários
  const getStatusColor = receitasUtils.getStatusColor
  const getStatusIcon = (status: string) => {
    const IconComponent = receitasUtils.getStatusIcon(status)
    switch (IconComponent) {
      case 'CheckCircle': return <CheckCircle className="w-4 h-4" />
      case 'Clock': return <Clock className="w-4 h-4" />
      case 'XCircle': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }
  const getTipoColor = receitasUtils.getTipoColor
  const getTipoLabel = receitasUtils.getTipoLabel

  const formatarMoeda = (valor: number | null | undefined) => {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return 'R$ 0,00'
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string | null | undefined) => {
    if (!data) return 'N/A'
    try {
      const date = new Date(data + 'T00:00:00')
      if (isNaN(date.getTime())) return 'Data inválida'
      return date.toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pendente: 'bg-yellow-500',
      pago: 'bg-green-500',
      vencido: 'bg-red-500',
      cancelado: 'bg-gray-500'
    }
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado'
    }
    return (
      <Badge className={variants[status] || 'bg-gray-500'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const totalGeralContas = contas.reduce((sum, c) => c.status === 'pendente' ? sum + parseFloat(String(c.valor)) : sum, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-gray-600">Gestão de receitas, medições e orçamentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReceitas}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita/Medição
          </Button>
        </div>
      </div>

      {/* Conteúdo Unificado */}
      <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Receipt className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Receitas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {receitasUtils.formatCurrency(totalReceitas)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {receitasUtils.formatCurrency(totalConfirmadas)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {receitasUtils.formatCurrency(totalPendentes)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalRegistrosCard}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista Unificada de Receitas e Contas a Receber */}
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber e Medições ({filteredReceitas.length + filteredMedicoes.length + contas.length})</CardTitle>
              <CardDescription>Lista unificada de receitas, medições e contas a receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pb-4 border-b">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Buscar por descrição, obra ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="obra">Obra</Label>
                <Select value={filterObra} onValueChange={setFilterObra}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Todas as obras</SelectItem>
                    {obrasFiltradasParaFiltro.map(obra => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>
                        {obra.nome || 'Obra sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="periodo">Período</Label>
                <Input
                  id="periodo"
                  type="month"
                  value={filterPeriodo}
                  onChange={(e) => setFilterPeriodo(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={carregarDados} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>

              {/* Tabela */}
              {totalRegistros === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum registro encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrosPaginados.map((registro) => {
                      // Renderizar Receita
                      if (registro.tipo === 'receita') {
                        const receita = registro.data as ReceitaComRelacionamentos
                        return (
                      <TableRow key={receita.id}>
                        <TableCell>
                          <Badge className={getTipoColor(receita.tipo)}>
                            {getTipoLabel(receita.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {receita.descricao}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {receita.obras?.nome || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {receita.obras?.clientes?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(receita.data_receita).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            {receitasUtils.formatCurrency(receita.valor || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(receita.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(receita.status)}
                              {receita.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setViewingItem({ tipo: 'receita', data: receita })
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditReceita(receita)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {receita.status === 'pendente' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleConfirmReceita(receita.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCancelReceita(receita.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Receita</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReceita(receita.id)}
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
                      }
                      
                      // Renderizar Medição
                      if (registro.tipo === 'medicao') {
                        const medicao = registro.data as MedicaoMensal
                        const getStatusColorMedicao = (status: string) => {
                          switch (status) {
                            case 'finalizada':
                              return 'bg-green-500'
                            case 'enviada':
                              return 'bg-blue-500'
                            case 'pendente':
                              return 'bg-yellow-500'
                            case 'cancelada':
                              return 'bg-red-500'
                            default:
                              return 'bg-gray-500'
                          }
                        }
                        const getStatusLabelMedicao = (status: string) => {
                          switch (status) {
                            case 'finalizada':
                              return 'Finalizada'
                            case 'enviada':
                              return 'Enviada'
                            case 'pendente':
                              return 'Pendente'
                            case 'cancelada':
                              return 'Cancelada'
                            default:
                              return status
                          }
                        }
                        return (
                          <TableRow key={`medicao-${medicao.id}`}>
                            <TableCell>
                              <Badge className="bg-orange-100 text-orange-800">
                                Medição
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {medicao.numero || `Medição #${medicao.id}`}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                {medicao.obras?.nome || medicao.gruas?.name || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {medicao.obras?.clientes?.nome || medicao.orcamentos?.clientes?.nome || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {medicao.periodo ? `${medicao.periodo.split('-')[1]}/${medicao.periodo.split('-')[0]}` : new Date(medicao.data_medicao).toLocaleDateString('pt-BR')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                {formatarMoeda(medicao.valor_total || 0)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColorMedicao(medicao.status)}>
                                {getStatusLabelMedicao(medicao.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/medicoes/${medicao.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      }
                      
                      // Orçamentos removidos - não devem aparecer em contas a receber
                      
                      // Renderizar Conta a Receber
                      if (registro.tipo === 'conta') {
                        const conta = registro.data as ContaReceber
                        return (
                          <TableRow key={`conta-${conta.id}`}>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">
                                Conta a Receber
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {conta.descricao}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                {conta.obra?.nome || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {conta.cliente?.nome || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatarData(conta.data_vencimento)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                {formatarMoeda(conta.valor)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(conta.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setViewingItem({ tipo: 'conta', data: conta })
                                    setIsViewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {conta.status === 'pendente' && (
                                  <Button
                                    size="sm"
                                    onClick={() => marcarComoPago(conta.id)}
                                    className="bg-green-500 hover:bg-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Receber
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      }

                      // Renderizar Nota Fiscal de Saída
                      if (registro.tipo === 'nota_fiscal') {
                        const nota = registro.data as ContaReceber
                        return (
                          <TableRow key={`nota-${nota.id}`}>
                            <TableCell>
                              <Badge className="bg-purple-100 text-purple-800">
                                <Receipt className="w-3 h-3 mr-1" />
                                Nota Fiscal
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {nota.descricao}
                              {nota.numero_nf && (
                                <span className="text-xs text-gray-500 ml-2">
                                  NF: {nota.numero_nf}
                                  {nota.serie && ` - Série ${nota.serie}`}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                {nota.obra?.nome || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {nota.cliente?.nome || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatarData(nota.data_vencimento)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                {formatarMoeda(nota.valor)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(nota.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    console.log('🔍 [CONTAS-RECEBER] Botão visualizar clicado')
                                    console.log('🔍 [CONTAS-RECEBER] Dados da nota:', nota)
                                    
                                    // Buscar detalhes completos da nota fiscal
                                    setViewingItem({ tipo: 'nota_fiscal', data: nota })
                                    setIsViewDialogOpen(true)
                                    setLoadingDetalhesNota(true)
                                    
                                    try {
                                      // Extrair o ID da nota fiscal
                                      // Prioridade: nota_fiscal_id > id (extraindo número se for string "nf_123")
                                      let notaId: number | null = null
                                      
                                      console.log('🔍 [CONTAS-RECEBER] Tentando extrair ID...')
                                      console.log('🔍 [CONTAS-RECEBER] nota.nota_fiscal_id:', nota.nota_fiscal_id)
                                      console.log('🔍 [CONTAS-RECEBER] nota.id:', nota.id)
                                      console.log('🔍 [CONTAS-RECEBER] Tipo de nota.id:', typeof nota.id)
                                      
                                      // Primeiro tentar nota_fiscal_id (campo direto do backend)
                                      if (nota.nota_fiscal_id) {
                                        notaId = typeof nota.nota_fiscal_id === 'number' 
                                          ? nota.nota_fiscal_id 
                                          : parseInt(String(nota.nota_fiscal_id))
                                        console.log('🔍 [CONTAS-RECEBER] ID extraído de nota_fiscal_id:', notaId)
                                      }
                                      // Se não tiver nota_fiscal_id, tentar extrair do id
                                      else if (nota.id) {
                                        if (typeof nota.id === 'number') {
                                          notaId = nota.id
                                          console.log('🔍 [CONTAS-RECEBER] ID numérico direto:', notaId)
                                        } 
                                        // Se o ID é uma string como "nf_123", extrair o número
                                        else if (typeof nota.id === 'string' && nota.id.startsWith('nf_')) {
                                          notaId = parseInt(nota.id.replace('nf_', ''))
                                          console.log('🔍 [CONTAS-RECEBER] ID extraído de string nf_*:', notaId)
                                        }
                                        // Tentar parsear se for string numérica
                                        else if (typeof nota.id === 'string') {
                                          notaId = parseInt(nota.id)
                                          console.log('🔍 [CONTAS-RECEBER] ID parseado de string:', notaId)
                                        }
                                      }
                                      
                                      console.log('🔍 [CONTAS-RECEBER] ID final extraído:', notaId)
                                      
                                      if (notaId && !isNaN(notaId)) {
                                        console.log('🔍 [CONTAS-RECEBER] Chamando API getById com ID:', notaId)
                                        const detalhesResponse = await notasFiscaisApi.getById(notaId)
                                        console.log('🔍 [CONTAS-RECEBER] Resposta da API:', detalhesResponse)
                                        
                                        if (detalhesResponse.success && detalhesResponse.data) {
                                          console.log('✅ [CONTAS-RECEBER] Dados recebidos com sucesso:', detalhesResponse.data)
                                          setViewingItem({ 
                                            tipo: 'nota_fiscal', 
                                            data: detalhesResponse.data 
                                          })
                                        } else {
                                          // Se não conseguir buscar detalhes, usar os dados que já temos
                                          console.warn('⚠️ [CONTAS-RECEBER] Não foi possível buscar detalhes completos, usando dados disponíveis')
                                          console.warn('⚠️ [CONTAS-RECEBER] Resposta:', detalhesResponse)
                                        }
                                      } else {
                                        console.warn('⚠️ [CONTAS-RECEBER] ID da nota fiscal não encontrado ou inválido')
                                        console.warn('⚠️ [CONTAS-RECEBER] nota completa:', nota)
                                        // Usar os dados que já temos
                                      }
                                    } catch (error) {
                                      console.error('❌ [CONTAS-RECEBER] Erro ao buscar detalhes da nota fiscal:', error)
                                      console.error('❌ [CONTAS-RECEBER] Stack:', error instanceof Error ? error.stack : 'N/A')
                                      toast({
                                        title: "Aviso",
                                        description: "Não foi possível carregar todos os detalhes. Exibindo informações disponíveis.",
                                        variant: "default"
                                      })
                                    } finally {
                                      console.log('🔍 [CONTAS-RECEBER] Finalizando loading...')
                                      setLoadingDetalhesNota(false)
                                    }
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {nota.status === 'pendente' && (
                                  <Button
                                    size="sm"
                                    onClick={() => marcarComoPago(nota.id)}
                                    className="bg-green-500 hover:bg-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Receber
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      }
                      
                      return null
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Paginação */}
              {totalPagesCalculado > 1 && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalRegistros)} de {totalRegistros} registros
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPagesCalculado) }, (_, i) => {
                        let pageNum: number
                        if (totalPagesCalculado <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPagesCalculado - 2) {
                          pageNum = totalPagesCalculado - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPagesCalculado, prev + 1))}
                          className={currentPage === totalPagesCalculado ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Dialog de Criação de Receita */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Receita</DialogTitle>
            <DialogDescription>
              Registre uma nova receita no sistema (medição, orçamento, etc.)
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateReceita(); }} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Buscar obra por nome, endereço ou cidade..."
                value={obraFilter}
                onChange={(e) => setObraFilter(e.target.value)}
                className="text-sm"
              />
              <Select 
                value={receitaForm.obra_id} 
                onValueChange={(value) => setReceitaForm({ ...receitaForm, obra_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {obrasFiltradas.length > 0 ? (
                    obrasFiltradas.map(obra => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{obra.nome || 'Obra sem nome'}</span>
                          <span className="text-xs text-gray-500">
                            {obra.endereco && obra.cidade ? `${obra.endereco}, ${obra.cidade}` : obra.endereco || obra.cidade || 'Sem localização'}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhuma obra encontrada
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={receitaForm.tipo} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="funcionario_id">Funcionário Responsável</Label>
                <Select 
                  value={receitaForm.funcionario_id} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, funcionario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {funcionarios.map(funcionario => (
                      <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                        {funcionario.nome} - {funcionario.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={receitaForm.descricao}
                onChange={(e) => setReceitaForm({ ...receitaForm, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receitaForm.valor}
                  onChange={(e) => setReceitaForm({ ...receitaForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_receita">Data da Receita *</Label>
                <Input
                  id="data_receita"
                  type="date"
                  value={receitaForm.data_receita}
                  onChange={(e) => setReceitaForm({ ...receitaForm, data_receita: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="conta_bancaria_id">Conta Bancária (crédito)</Label>
              <Select
                value={receitaForm.conta_bancaria_id}
                onValueChange={(value) => setReceitaForm({ ...receitaForm, conta_bancaria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {contasBancarias.map(conta => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.nome} - {conta.banco} ({conta.agencia}/{conta.conta}) • Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.saldo_atual || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={receitaForm.observacoes}
                onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Receita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Receita */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Receita</DialogTitle>
            <DialogDescription>
              Edite as informações da receita
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateReceita(); }} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Buscar obra por nome, endereço ou cidade..."
                value={obraFilter}
                onChange={(e) => setObraFilter(e.target.value)}
                className="text-sm"
              />
              <Select 
                value={receitaForm.obra_id} 
                onValueChange={(value) => setReceitaForm({ ...receitaForm, obra_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {obrasFiltradas.length > 0 ? (
                    obrasFiltradas.map(obra => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{obra.nome || 'Obra sem nome'}</span>
                          <span className="text-xs text-gray-500">
                            {obra.endereco && obra.cidade ? `${obra.endereco}, ${obra.cidade}` : obra.endereco || obra.cidade || 'Sem localização'}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Nenhuma obra encontrada
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_tipo">Tipo *</Label>
                <Select 
                  value={receitaForm.tipo} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_funcionario_id">Funcionário Responsável</Label>
                <Select 
                  value={receitaForm.funcionario_id} 
                  onValueChange={(value) => setReceitaForm({ ...receitaForm, funcionario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {funcionarios.map(funcionario => (
                      <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                        {funcionario.nome} - {funcionario.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_descricao">Descrição *</Label>
              <Input
                id="edit_descricao"
                value={receitaForm.descricao}
                onChange={(e) => setReceitaForm({ ...receitaForm, descricao: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_valor">Valor (R$) *</Label>
                <Input
                  id="edit_valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receitaForm.valor}
                  onChange={(e) => setReceitaForm({ ...receitaForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_data_receita">Data da Receita *</Label>
                <Input
                  id="edit_data_receita"
                  type="date"
                  value={receitaForm.data_receita}
                  onChange={(e) => setReceitaForm({ ...receitaForm, data_receita: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea
                id="edit_observacoes"
                value={receitaForm.observacoes}
                onChange={(e) => setReceitaForm({ ...receitaForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Receita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Detalhes */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open)
        if (!open) {
          setViewingItem(null)
          setLoadingDetalhesNota(false)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingItem?.tipo === 'nota_fiscal' ? 'Detalhes da Nota Fiscal' : 'Detalhes do Registro'}
            </DialogTitle>
            <DialogDescription>
              {viewingItem?.tipo === 'nota_fiscal' ? 'Informações completas da nota fiscal' : 'Informações completas do registro selecionado'}
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetalhesNota && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-600">Carregando detalhes...</span>
            </div>
          )}
          
          {viewingItem && !loadingDetalhesNota && (
            <div className="space-y-4">
              {viewingItem.tipo === 'receita' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Tipo</Label>
                      <p className="mt-1">
                        <Badge className={getTipoColor(viewingItem.data.tipo)}>
                          {getTipoLabel(viewingItem.data.tipo)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <p className="mt-1">
                        <Badge className={getStatusColor(viewingItem.data.status)}>
                          {viewingItem.data.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Descrição</Label>
                    <p className="mt-1 text-gray-700">{viewingItem.data.descricao}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Obra</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.obras?.nome || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Cliente</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.obras?.clientes?.nome || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Data da Receita</Label>
                      <p className="mt-1 text-gray-700">
                        {new Date(viewingItem.data.data_receita).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Valor</Label>
                      <p className="mt-1 text-lg font-bold text-green-600">
                        {receitasUtils.formatCurrency(viewingItem.data.valor || 0)}
                      </p>
                    </div>
                  </div>
                  {viewingItem.data.funcionarios && (
                    <div>
                      <Label className="text-sm font-semibold">Funcionário Responsável</Label>
                      <p className="mt-1 text-gray-700">
                        {viewingItem.data.funcionarios.nome} - {viewingItem.data.funcionarios.cargo}
                      </p>
                    </div>
                  )}
                  {viewingItem.data.observacoes && (
                    <div>
                      <Label className="text-sm font-semibold">Observações</Label>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{viewingItem.data.observacoes}</p>
                    </div>
                  )}
                </>
              )}

              {viewingItem.tipo === 'medicao' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Número</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.numero || `Medição #${viewingItem.data.id}`}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <p className="mt-1">
                        <Badge className="bg-orange-100 text-orange-800">
                          {viewingItem.data.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Período</Label>
                      <p className="mt-1 text-gray-700">
                        {viewingItem.data.periodo ? `${viewingItem.data.periodo.split('-')[1]}/${viewingItem.data.periodo.split('-')[0]}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Data da Medição</Label>
                      <p className="mt-1 text-gray-700">
                        {new Date(viewingItem.data.data_medicao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Obra</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.obras?.nome || viewingItem.data.gruas?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Cliente</Label>
                      <p className="mt-1 text-gray-700">
                        {viewingItem.data.obras?.clientes?.nome || viewingItem.data.orcamentos?.clientes?.nome || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Valor Total</Label>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      {formatarMoeda(viewingItem.data.valor_total || 0)}
                    </p>
                  </div>
                  {viewingItem.data.observacoes && (
                    <div>
                      <Label className="text-sm font-semibold">Observações</Label>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{viewingItem.data.observacoes}</p>
                    </div>
                  )}
                </>
              )}

              {/* Orçamentos removidos - não devem aparecer em contas a receber */}

              {viewingItem.tipo === 'nota_fiscal' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Número</Label>
                      <p className="text-lg font-semibold">{viewingItem.data.numero_nf}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Série</Label>
                      <p className="text-lg">{viewingItem.data.serie || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                      <p className="text-lg">{viewingItem.data.tipo === 'saida' ? 'Saída' : 'Entrada'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tipo de Nota</Label>
                      <p className="text-lg">{viewingItem.data.tipo_nota === 'nf_locacao' ? 'NF Locação' : viewingItem.data.tipo_nota || '-'}</p>
                    </div>
                  </div>

                  {viewingItem.data.tipo === 'saida' && viewingItem.data.clientes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                      <p className="text-lg font-semibold">{viewingItem.data.clientes.nome}</p>
                      {viewingItem.data.clientes.cnpj && (
                        <p className="text-sm text-gray-600">CNPJ: {viewingItem.data.clientes.cnpj}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data de Emissão</Label>
                      <p className="text-lg">{viewingItem.data.data_emissao ? new Date(viewingItem.data.data_emissao).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                      <p className="text-lg">{viewingItem.data.data_vencimento ? new Date(viewingItem.data.data_vencimento).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                      <p className="text-lg font-semibold text-green-600">{formatarMoeda(viewingItem.data.valor_total || 0)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-2">{getStatusBadge(viewingItem.data.status)}</div>
                  </div>

                  {/* Seção de Impostos - Sempre mostrar para notas fiscais */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">Detalhes dos Impostos</h3>
                      
                      {/* Impostos Estaduais */}
                      {(viewingItem.data.valor_icms !== undefined || viewingItem.data.valor_icms_st !== undefined || viewingItem.data.base_calculo_icms !== undefined) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Impostos Estaduais</h4>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                            {viewingItem.data.base_calculo_icms > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Base de Cálculo ICMS</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.base_calculo_icms || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_icms > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">ICMS</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_icms || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.base_calculo_icms_st > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Base de Cálculo ICMS ST</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.base_calculo_icms_st || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_icms_st > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">ICMS ST</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_icms_st || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_fcp_st > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">FCP ST</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_fcp_st || 0)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Impostos Federais */}
                      {(viewingItem.data.valor_ipi !== undefined || viewingItem.data.valor_pis !== undefined || viewingItem.data.valor_cofins !== undefined || 
                        viewingItem.data.valor_inss !== undefined || viewingItem.data.valor_ir !== undefined || viewingItem.data.valor_csll !== undefined) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Impostos Federais</h4>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                            {viewingItem.data.valor_ipi > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">IPI</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_ipi || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_pis > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">PIS</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_pis || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_cofins > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">COFINS</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_cofins || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_inss > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">INSS</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_inss || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_ir > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">IR</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_ir || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_csll > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">CSLL</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_csll || 0)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Impostos Municipais */}
                      {(viewingItem.data.valor_issqn !== undefined || viewingItem.data.base_calculo_issqn !== undefined) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Impostos Municipais</h4>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                            {viewingItem.data.base_calculo_issqn > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Base de Cálculo ISSQN</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.base_calculo_issqn || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_issqn > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">ISSQN</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_issqn || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.aliquota_issqn > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Alíquota ISSQN</Label>
                                <p className="text-sm font-medium">{(viewingItem.data.aliquota_issqn || 0).toFixed(2)}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Retenções */}
                      {(viewingItem.data.retencoes_federais !== undefined || viewingItem.data.outras_retencoes !== undefined) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Retenções</h4>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                            {viewingItem.data.retencoes_federais > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Retenções Federais</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.retencoes_federais || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.outras_retencoes > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Outras Retenções</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.outras_retencoes || 0)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Outros Valores */}
                      {(viewingItem.data.valor_frete !== undefined || viewingItem.data.valor_seguro !== undefined || viewingItem.data.valor_desconto !== undefined || 
                        viewingItem.data.outras_despesas_acessorias !== undefined) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Outros Valores</h4>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                            {viewingItem.data.valor_frete > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Frete</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_frete || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_seguro > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Seguro</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_seguro || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.valor_desconto > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Desconto</Label>
                                <p className="text-sm font-medium text-red-600">{formatarMoeda(viewingItem.data.valor_desconto || 0)}</p>
                              </div>
                            )}
                            {viewingItem.data.outras_despesas_acessorias > 0 && (
                              <div>
                                <Label className="text-xs text-gray-600">Outras Despesas</Label>
                                <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.outras_despesas_acessorias || 0)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Valor Líquido - Sempre mostrar se existir */}
                      {viewingItem.data.valor_liquido !== undefined && viewingItem.data.valor_liquido !== null && (
                        <div className="border-t pt-4 mt-4">
                          <div className="flex justify-between items-center bg-green-50 p-3 rounded-md">
                            <Label className="text-sm font-semibold text-gray-700">Valor Líquido</Label>
                            <p className="text-lg font-bold text-green-600">{formatarMoeda(viewingItem.data.valor_liquido || 0)}</p>
                          </div>
                        </div>
                      )}

                      {/* Mensagem quando não há impostos cadastrados */}
                      {!viewingItem.data.valor_icms && !viewingItem.data.valor_ipi && !viewingItem.data.valor_issqn && 
                       !viewingItem.data.valor_pis && !viewingItem.data.valor_cofins && !viewingItem.data.valor_inss && 
                       !viewingItem.data.valor_ir && !viewingItem.data.valor_csll && !viewingItem.data.retencoes_federais &&
                       !viewingItem.data.outras_retencoes && !viewingItem.data.base_calculo_icms && !viewingItem.data.valor_icms_st &&
                       !viewingItem.data.base_calculo_issqn && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          Nenhum imposto cadastrado para esta nota fiscal
                        </div>
                      )}
                    </div>

                  {viewingItem.data.observacoes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Observações</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded-md mt-2">{viewingItem.data.observacoes}</p>
                    </div>
                  )}
                </>
              )}

              {viewingItem.tipo === 'conta' && (
                <>
                  <div>
                    <Label className="text-sm font-semibold">Descrição</Label>
                    <p className="mt-1 text-gray-700">{viewingItem.data.descricao}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <p className="mt-1">
                        {getStatusBadge(viewingItem.data.status)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Valor</Label>
                      <p className="mt-1 text-lg font-bold text-green-600">
                        {formatarMoeda(viewingItem.data.valor)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Data de Vencimento</Label>
                      <p className="mt-1 text-gray-700">{formatarData(viewingItem.data.data_vencimento)}</p>
                    </div>
                    {viewingItem.data.data_pagamento && (
                      <div>
                        <Label className="text-sm font-semibold">Data de Pagamento</Label>
                        <p className="mt-1 text-gray-700">{formatarData(viewingItem.data.data_pagamento)}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Cliente</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.cliente?.nome || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Obra</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.obra?.nome || 'N/A'}</p>
                    </div>
                  </div>
                  {viewingItem.data.observacoes && (
                    <div>
                      <Label className="text-sm font-semibold">Observações</Label>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{viewingItem.data.observacoes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
