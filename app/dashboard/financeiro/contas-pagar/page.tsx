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
  TrendingDown,
  Receipt,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { custosApi, custosUtils, Custo, CustoCreate, CustoUpdate } from "@/lib/api-custos"
import apiObras from "@/lib/api-obras"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { impostosApi, Imposto } from "@/lib/api-impostos"

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

// Interface estendida para custos com relacionamentos
interface CustoComRelacionamentos extends Custo {
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

// Interface para contas a pagar
interface ContaPagar {
  id: number | string // Pode ser número ou string (ex: "nf_123" para notas fiscais)
  tipo?: 'conta_pagar' | 'nota_fiscal' // Tipo do registro
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  cliente?: { nome: string; cnpj: string }
  obra?: { nome: string }
  fornecedor?: { id?: number; nome: string; cnpj?: string }
  observacoes?: string
  // Campos específicos de notas fiscais
  numero_nf?: string
  serie?: string
  data_emissao?: string
  valor_total?: number
  valor_liquido?: number
}

interface Alertas {
  vencidas: { quantidade: number; valor_total: number; contas: ContaPagar[] }
  vencendo: { quantidade: number; valor_total: number; contas: ContaPagar[] }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

export default function ContasPagarPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados para Custos
  const [custos, setCustos] = useState<CustoComRelacionamentos[]>([])
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
  const [editingCusto, setEditingCusto] = useState<CustoComRelacionamentos | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<any>(null)

  // Estados para Contas a Pagar
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [alertas, setAlertas] = useState<Alertas | null>(null)
  const [filtroStatusContas, setFiltroStatusContas] = useState<string>('todos')
  
  // Estados para Impostos
  const [impostos, setImpostos] = useState<Imposto[]>([])
  
  // Estados para Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Formulário de Custos
  const [custoForm, setCustoForm] = useState({
    obra_id: '',
    tipo: 'salario' as 'salario' | 'material' | 'servico' | 'manutencao',
    descricao: '',
    valor: 0,
    data_custo: new Date().toISOString().split('T')[0],
    funcionario_id: 'none',
    observacoes: ''
  })

  // ========== FUNÇÕES DE CARREGAMENTO (definidas antes dos useEffects) ==========
  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar custos, obras, funcionários e impostos em paralelo
      const [custosData, obrasData, funcionariosData, impostosData] = await Promise.all([
        custosApi.list(),
        apiObras.listarObras(),
        funcionariosApi.listarFuncionarios(),
        impostosApi.list({ limit: 1000 })
      ])

      setCustos(custosData.custos || [])
      setObras(obrasData.data || [])
      setFuncionarios(funcionariosData.data || [])
      setImpostos(impostosData.impostos || [])
      
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
      
      let url = `${API_URL}/api/contas-pagar?limite=100`
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
      const response = await fetch(`${API_URL}/api/contas-pagar/alertas`, {
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

  // ========== USEMEMO - FILTROS (PRIMEIRO, antes de qualquer uso) ==========
  // Filtrar custos
  const filteredCustos = useMemo(() => {
    return (custos || []).filter(custo => {
      const matchesSearch = (custo.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (custo.obras?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (custo.obras?.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || custo.status === filterStatus
      const matchesTipo = filterTipo === 'all' || custo.tipo === filterTipo
      const matchesObra = filterObra === 'all' || custo.obra_id?.toString() === filterObra
      const matchesPeriodo = !filterPeriodo || (custo.data_custo || '').startsWith(filterPeriodo)
      return matchesSearch && matchesStatus && matchesTipo && matchesObra && matchesPeriodo
    })
  }, [custos, searchTerm, filterStatus, filterTipo, filterObra, filterPeriodo])

  // Filtrar impostos
  const filteredImpostos = useMemo(() => {
    return (impostos || []).filter(imposto => {
      const matchesSearch = (imposto.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (imposto.tipo || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || imposto.status === filterStatus
      const matchesPeriodo = !filterPeriodo || (imposto.data_vencimento || '').startsWith(filterPeriodo)
      return matchesSearch && matchesStatus && matchesPeriodo
    })
  }, [impostos, searchTerm, filterStatus, filterPeriodo])

  // Combinar todos os registros para paginação
  const todosRegistros = useMemo(() => {
    return [
      ...filteredCustos.map(c => ({ tipo: 'custo' as const, data: c })),
      ...filteredImpostos.map(i => ({ tipo: 'imposto' as const, data: i })),
      ...contas.map(c => ({ 
        tipo: (c.tipo === 'nota_fiscal' ? 'nota_fiscal' : 'conta') as const, 
        data: c 
      }))
    ]
  }, [filteredCustos, filteredImpostos, contas])

  // Calcular paginação
  const totalRegistros = todosRegistros.length
  const totalPagesCalculado = Math.ceil(totalRegistros / itemsPerPage)
  const inicio = (currentPage - 1) * itemsPerPage
  const fim = inicio + itemsPerPage
  const registrosPaginados = todosRegistros.slice(inicio, fim)

  // Calcular totais
  const totaisCustos = useMemo(() => {
    const total = filteredCustos.reduce((sum, c) => sum + (c.valor || 0), 0)
    const confirmados = filteredCustos
      .filter(c => c.status === 'confirmado')
      .reduce((sum, c) => sum + (c.valor || 0), 0)
    const pendentes = filteredCustos
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + (c.valor || 0), 0)
    return { total, confirmados, pendentes }
  }, [filteredCustos])
  
  const totalCustos = totaisCustos.total
  const totalConfirmados = totaisCustos.confirmados
  const totalPendentes = totaisCustos.pendentes

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
  // Handlers de Custos
  const handleCreateCusto = async () => {
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []
    
    if (!custoForm.obra_id || custoForm.obra_id === '') {
      camposFaltando.push('Obra')
    }
    
    if (!custoForm.tipo || !custoForm.tipo.trim()) {
      camposFaltando.push('Tipo')
    }
    
    if (!custoForm.descricao || !custoForm.descricao.trim()) {
      camposFaltando.push('Descrição')
    }
    
    if (!custoForm.valor || custoForm.valor <= 0) {
      camposFaltando.push('Valor')
    }
    
    if (!custoForm.data_custo || !custoForm.data_custo.trim()) {
      camposFaltando.push('Data do Custo')
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
      const custoData: CustoCreate = {
        obra_id: parseInt(custoForm.obra_id),
        tipo: custoForm.tipo,
        descricao: custoForm.descricao,
        valor: custoForm.valor,
        data_custo: custoForm.data_custo,
        funcionario_id: custoForm.funcionario_id && custoForm.funcionario_id !== 'none' ? parseInt(custoForm.funcionario_id) : undefined,
        observacoes: custoForm.observacoes.trim() || undefined
      }

      const novaCusto = await custosApi.create(custoData)
      setCustos([novaCusto, ...(custos || [])])
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Custo criado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar custo",
        variant: "destructive"
      })
    }
  }

  const handleEditCusto = (custo: CustoComRelacionamentos) => {
    setEditingCusto(custo)
    setCustoForm({
      obra_id: custo.obra_id.toString(),
      tipo: custo.tipo,
      descricao: custo.descricao,
      valor: custo.valor,
      data_custo: custo.data_custo,
      funcionario_id: custo.funcionario_id?.toString() || 'none',
      observacoes: custo.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCusto = async () => {
    if (!editingCusto) return
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []
    
    if (!custoForm.obra_id || custoForm.obra_id === '') {
      camposFaltando.push('Obra')
    }
    
    if (!custoForm.tipo || !custoForm.tipo.trim()) {
      camposFaltando.push('Tipo')
    }
    
    if (!custoForm.descricao || !custoForm.descricao.trim()) {
      camposFaltando.push('Descrição')
    }
    
    if (!custoForm.valor || custoForm.valor <= 0) {
      camposFaltando.push('Valor')
    }
    
    if (!custoForm.data_custo || !custoForm.data_custo.trim()) {
      camposFaltando.push('Data do Custo')
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
      const custoData: CustoUpdate = {
        obra_id: parseInt(custoForm.obra_id),
        tipo: custoForm.tipo,
        descricao: custoForm.descricao,
        valor: custoForm.valor,
        data_custo: custoForm.data_custo,
        funcionario_id: custoForm.funcionario_id && custoForm.funcionario_id !== 'none' ? parseInt(custoForm.funcionario_id) : undefined,
        observacoes: custoForm.observacoes.trim() || undefined
      }

      const custoAtualizada = await custosApi.update(editingCusto.id, custoData)
      
      setCustos((custos || []).map(custo => 
        custo.id === editingCusto.id ? custoAtualizada : custo
      ))
      
      setIsEditDialogOpen(false)
      setEditingCusto(null)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Custo atualizado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCusto = async (id: string) => {
    try {
      await custosApi.delete(id)
      setCustos((custos || []).filter(r => r.id !== id))
      toast({
        title: "Sucesso",
        description: "Custo removido com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover custo",
        variant: "destructive"
      })
    }
  }

  const handleConfirmCusto = async (id: string) => {
    try {
      const custoAtualizada = await custosApi.confirm(id)
      setCustos((custos || []).map(custo => 
        custo.id === id ? custoAtualizada : custo
      ))
      toast({
        title: "Sucesso",
        description: "Custo confirmado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao confirmar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao confirmar custo",
        variant: "destructive"
      })
    }
  }

  const handleCancelCusto = async (id: string) => {
    try {
      const custoAtualizada = await custosApi.cancel(id)
      setCustos((custos || []).map(custo => 
        custo.id === id ? custoAtualizada : custo
      ))
      toast({
        title: "Sucesso",
        description: "Custo cancelado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao cancelar custo:', error)
      toast({
        title: "Erro",
        description: "Erro ao cancelar custo",
        variant: "destructive"
      })
    }
  }

  const handleExportCustos = async () => {
    try {
      await custosApi.export({
        obra_id: filterObra !== 'all' ? parseInt(filterObra) : undefined,
        tipo: filterTipo !== 'all' ? filterTipo : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        data_inicio: filterPeriodo ? `${filterPeriodo}-01` : undefined,
        data_fim: filterPeriodo ? `${filterPeriodo}-31` : undefined
      })
      toast({
        title: "Sucesso",
        description: "Custos exportados com sucesso"
      })
    } catch (error) {
      console.error('Erro ao exportar custos:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar custos",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setCustoForm({
      obra_id: '',
      tipo: 'salario',
      descricao: '',
      valor: 0,
      data_custo: new Date().toISOString().split('T')[0],
      funcionario_id: 'none',
      observacoes: ''
    })
    setObraFilter('')
    setObraSearchFilter('')
  }

  // Handlers de Contas a Pagar
  const marcarComoPago = async (id: number | string) => {
    try {
      const token = getAuthToken()
      
      // Verificar se é uma nota fiscal (ID começa com "nf_")
      if (typeof id === 'string' && id.startsWith('nf_')) {
        const notaId = id.replace('nf_', '')
        const response = await fetch(`${API_URL}/api/notas-fiscais/${notaId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'paga'
          })
        })

        if (response.ok) {
          carregarContas()
          carregarAlertas()
          toast({
            title: "Sucesso",
            description: "Nota fiscal marcada como paga"
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao marcar nota fiscal como paga')
        }
      } else {
        // É uma conta a pagar normal
        const response = await fetch(`${API_URL}/api/contas-pagar/${id}/pagar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data_pagamento: new Date().toISOString().split('T')[0]
          })
        })

        if (response.ok) {
          carregarContas()
          carregarAlertas()
          toast({
            title: "Sucesso",
            description: "Conta marcada como paga"
          })
        }
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      toast({
        title: "Erro",
        description: "Erro ao marcar conta como paga",
        variant: "destructive"
      })
    }
  }

  // Utilitários
  const getStatusColor = custosUtils.getStatusColor
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <Clock className="w-4 h-4" />
      case 'cancelado': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }
  const getTipoColor = custosUtils.getTipoColor
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'salario': return 'Salário'
      case 'material': return 'Material'
      case 'servico': return 'Serviço'
      case 'manutencao': return 'Manutenção'
      default: return tipo
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    try {
      return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
    } catch {
      return data
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pendente: 'bg-yellow-500',
      pago: 'bg-green-500',
      vencido: 'bg-red-500',
      cancelado: 'bg-gray-500',
      confirmado: 'bg-green-500',
      atrasado: 'bg-red-500'
    }
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado',
      confirmado: 'Confirmado',
      atrasado: 'Atrasado'
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
          <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-600">Gestão de custos, salários, impostos e aluguéis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCustos}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Custo/Despesa
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
                <Receipt className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Custos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {totalCustos.toLocaleString('pt-BR')}
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
                  <p className="text-sm font-medium text-gray-600">Confirmados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {totalConfirmados.toLocaleString('pt-BR')}
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
                    R$ {totalPendentes.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Registros</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalRegistros}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista Unificada de Custos e Contas a Pagar */}
        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar e Custos ({totalRegistros})</CardTitle>
            <CardDescription>Lista unificada de custos, salários, impostos, aluguéis e contas a pagar</CardDescription>
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
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
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
                    <SelectItem value="salario">Salário</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
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
                    // Renderizar Custo
                    if (registro.tipo === 'custo') {
                      const custo = registro.data as CustoComRelacionamentos
                      return (
                        <TableRow key={custo.id}>
                          <TableCell>
                            <Badge className={getTipoColor(custo.tipo)}>
                              {getTipoLabel(custo.tipo)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {custo.descricao}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              {custo.obras?.nome || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {custo.obras?.clientes?.nome || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(custo.data_custo).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-red-600" />
                              {custosUtils.formatCurrency(custo.valor || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(custo.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(custo.status)}
                                {custo.status}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setViewingItem({ tipo: 'custo', data: custo })
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditCusto(custo)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {custo.status === 'pendente' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleConfirmCusto(custo.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCancelCusto(custo.id)}
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
                                    <AlertDialogTitle>Excluir Custo</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este custo? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCusto(custo.id)}
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
                    
                    // Renderizar Imposto
                    if (registro.tipo === 'imposto') {
                      const imposto = registro.data as Imposto
                      return (
                        <TableRow key={`imposto-${imposto.id}`}>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">
                              Imposto
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {imposto.descricao || imposto.tipo || `Imposto #${imposto.id}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              N/A
                            </div>
                          </TableCell>
                          <TableCell>
                            N/A
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {imposto.data_vencimento ? formatarData(imposto.data_vencimento) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-red-600" />
                              {formatarMoeda(imposto.valor || 0)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(imposto.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewingItem({ tipo: 'imposto', data: imposto })
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/financeiro/impostos`)}
                              >
                                Abrir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }
                    
                    // Renderizar Nota Fiscal de Entrada
                    if (registro.tipo === 'nota_fiscal') {
                      const nota = registro.data as ContaPagar
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
                            {nota.fornecedor?.nome || nota.cliente?.nome || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatarData(nota.data_vencimento)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-red-600" />
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
                                onClick={() => {
                                  setViewingItem({ tipo: 'nota_fiscal', data: nota })
                                  setIsViewDialogOpen(true)
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
                                  Pagar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }

                    // Renderizar Conta a Pagar
                    if (registro.tipo === 'conta') {
                      const conta = registro.data as ContaPagar
                      return (
                        <TableRow key={`conta-${conta.id}`}>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">
                              Conta a Pagar
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
                            {conta.fornecedor?.nome || conta.cliente?.nome || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatarData(conta.data_vencimento)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-red-600" />
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
                                  Pagar
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

      {/* Dialog de Criação de Custo */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Custo</DialogTitle>
            <DialogDescription>
              Registre um novo custo no sistema (aluguel, salário, etc.)
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateCusto(); }} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Buscar obra por nome, endereço ou cidade..."
                value={obraFilter}
                onChange={(e) => setObraFilter(e.target.value)}
                className="text-sm"
              />
              <Select 
                value={custoForm.obra_id} 
                onValueChange={(value) => setCustoForm({ ...custoForm, obra_id: value })}
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
                  value={custoForm.tipo} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salario">Salário</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="funcionario_id">Funcionário Responsável</Label>
                <Select 
                  value={custoForm.funcionario_id} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, funcionario_id: value })}
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
                value={custoForm.descricao}
                onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
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
                  value={custoForm.valor}
                  onChange={(e) => setCustoForm({ ...custoForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_custo">Data do Custo *</Label>
                <Input
                  id="data_custo"
                  type="date"
                  value={custoForm.data_custo}
                  onChange={(e) => setCustoForm({ ...custoForm, data_custo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={custoForm.observacoes}
                onChange={(e) => setCustoForm({ ...custoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Custo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Custo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Custo</DialogTitle>
            <DialogDescription>
              Edite as informações do custo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateCusto(); }} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Buscar obra por nome, endereço ou cidade..."
                value={obraFilter}
                onChange={(e) => setObraFilter(e.target.value)}
                className="text-sm"
              />
              <Select 
                value={custoForm.obra_id} 
                onValueChange={(value) => setCustoForm({ ...custoForm, obra_id: value })}
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
                  value={custoForm.tipo} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salario">Salário</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_funcionario_id">Funcionário Responsável</Label>
                <Select 
                  value={custoForm.funcionario_id} 
                  onValueChange={(value) => setCustoForm({ ...custoForm, funcionario_id: value })}
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
                value={custoForm.descricao}
                onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
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
                  value={custoForm.valor}
                  onChange={(e) => setCustoForm({ ...custoForm, valor: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_data_custo">Data do Custo *</Label>
                <Input
                  id="edit_data_custo"
                  type="date"
                  value={custoForm.data_custo}
                  onChange={(e) => setCustoForm({ ...custoForm, data_custo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea
                id="edit_observacoes"
                value={custoForm.observacoes}
                onChange={(e) => setCustoForm({ ...custoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Custo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Detalhes */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
            <DialogDescription>
              Informações completas do registro selecionado
            </DialogDescription>
          </DialogHeader>
          
          {viewingItem && (
            <div className="space-y-4">
              {viewingItem.tipo === 'custo' && (
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
                      <Label className="text-sm font-semibold">Data do Custo</Label>
                      <p className="mt-1 text-gray-700">
                        {new Date(viewingItem.data.data_custo).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Valor</Label>
                      <p className="mt-1 text-lg font-bold text-red-600">
                        {custosUtils.formatCurrency(viewingItem.data.valor || 0)}
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

              {viewingItem.tipo === 'imposto' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Tipo de Imposto</Label>
                      <p className="mt-1">
                        <Badge className="bg-red-100 text-red-800">
                          {viewingItem.data.tipo}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <p className="mt-1">
                        {getStatusBadge(viewingItem.data.status)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Descrição</Label>
                    <p className="mt-1 text-gray-700">{viewingItem.data.descricao}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Competência</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.competencia || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Data de Vencimento</Label>
                      <p className="mt-1 text-gray-700">
                        {viewingItem.data.data_vencimento ? formatarData(viewingItem.data.data_vencimento) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {viewingItem.data.data_pagamento && (
                    <div>
                      <Label className="text-sm font-semibold">Data de Pagamento</Label>
                      <p className="mt-1 text-gray-700">{formatarData(viewingItem.data.data_pagamento)}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Valor Base</Label>
                      <p className="mt-1 text-gray-700">{formatarMoeda(viewingItem.data.valor_base || 0)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Alíquota</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.aliquota || 0}%</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Valor</Label>
                      <p className="mt-1 text-lg font-bold text-red-600">
                        {formatarMoeda(viewingItem.data.valor || 0)}
                      </p>
                    </div>
                  </div>
                  {viewingItem.data.referencia && (
                    <div>
                      <Label className="text-sm font-semibold">Referência</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.referencia}</p>
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

              {viewingItem.tipo === 'nota_fiscal' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Tipo</Label>
                      <p className="mt-1">
                        <Badge className="bg-purple-100 text-purple-800">
                          <Receipt className="w-3 h-3 mr-1" />
                          Nota Fiscal de Entrada
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Status</Label>
                      <p className="mt-1">
                        {getStatusBadge(viewingItem.data.status)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Descrição</Label>
                    <p className="mt-1 text-gray-700">{viewingItem.data.descricao}</p>
                  </div>
                  {viewingItem.data.numero_nf && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Número da NF</Label>
                        <p className="mt-1 text-gray-700">{viewingItem.data.numero_nf}</p>
                      </div>
                      {viewingItem.data.serie && (
                        <div>
                          <Label className="text-sm font-semibold">Série</Label>
                          <p className="mt-1 text-gray-700">{viewingItem.data.serie}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Data de Emissão</Label>
                      <p className="mt-1 text-gray-700">
                        {viewingItem.data.data_emissao ? formatarData(viewingItem.data.data_emissao) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Data de Vencimento</Label>
                      <p className="mt-1 text-gray-700">{formatarData(viewingItem.data.data_vencimento)}</p>
                    </div>
                  </div>
                  {viewingItem.data.data_pagamento && (
                    <div>
                      <Label className="text-sm font-semibold">Data de Pagamento</Label>
                      <p className="mt-1 text-gray-700">{formatarData(viewingItem.data.data_pagamento)}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Fornecedor</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.fornecedor?.nome || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Obra</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.obra?.nome || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {viewingItem.data.valor_total && (
                      <div>
                        <Label className="text-sm font-semibold">Valor Total</Label>
                        <p className="mt-1 text-gray-700">{formatarMoeda(viewingItem.data.valor_total)}</p>
                      </div>
                    )}
                    {viewingItem.data.valor_liquido && viewingItem.data.valor_liquido !== viewingItem.data.valor_total && (
                      <div>
                        <Label className="text-sm font-semibold">Valor Líquido</Label>
                        <p className="mt-1 text-gray-700">{formatarMoeda(viewingItem.data.valor_liquido)}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-semibold">Valor</Label>
                      <p className="mt-1 text-lg font-bold text-red-600">
                        {formatarMoeda(viewingItem.data.valor)}
                      </p>
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
                      <p className="mt-1 text-lg font-bold text-red-600">
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
                      <Label className="text-sm font-semibold">Fornecedor</Label>
                      <p className="mt-1 text-gray-700">{viewingItem.data.fornecedor?.nome || viewingItem.data.cliente?.nome || 'N/A'}</p>
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
