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
import { apiContasBancarias, ContaBancaria } from "@/lib/api-contas-bancarias"
import { notasFiscaisApi } from "@/lib/api-notas-fiscais"

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
  nota_fiscal_id?: number | string
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
  const [loadingDetalhesNota, setLoadingDetalhesNota] = useState(false)

  // Estados para Contas a Pagar
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [alertas, setAlertas] = useState<Alertas | null>(null)
  const [filtroStatusContas, setFiltroStatusContas] = useState<string>('todos')
  
  // Estados para Impostos
  const [impostos, setImpostos] = useState<Imposto[]>([])

  // Estados para Contas Bancárias
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  
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
    conta_bancaria_id: 'none',
    observacoes: ''
  })

  // ========== FUNÇÕES DE CARREGAMENTO (definidas antes dos useEffects) ==========
  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar custos, obras, funcionários, impostos e contas bancárias em paralelo
      const [custosData, obrasData, funcionariosData, impostosData, contasBancariasData] = await Promise.all([
        custosApi.list(),
        apiObras.listarObras(),
        funcionariosApi.listarFuncionarios(),
        impostosApi.list({ limit: 1000 }),
        apiContasBancarias.listar({ ativa: true })
      ])

      setCustos(custosData.custos || [])
      setObras(obrasData.data || [])
      setFuncionarios(funcionariosData.data || [])
      setImpostos(impostosData.impostos || [])
      setContasBancarias(contasBancariasData || [])
      
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

  // Calcular totais dos custos
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

  // Calcular totais das contas a pagar (boletos + notas fiscais de entrada)
  const totaisContas = useMemo(() => {
    const total = contas.reduce((sum, c) => sum + (c.valor || 0), 0)
    const pagos = contas
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + (c.valor || 0), 0)
    const pendentes = contas
      .filter(c => c.status === 'pendente' || c.status === 'vencido')
      .reduce((sum, c) => sum + (c.valor || 0), 0)
    return { total, pagos, pendentes }
  }, [contas])

  // Calcular totais dos impostos
  const totaisImpostos = useMemo(() => {
    const total = filteredImpostos.reduce((sum, i) => sum + (i.valor || 0), 0)
    const pagos = filteredImpostos
      .filter(i => i.status === 'pago')
      .reduce((sum, i) => sum + (i.valor || 0), 0)
    const pendentes = filteredImpostos
      .filter(i => i.status === 'pendente' || i.status === 'vencido' || i.status === 'atrasado')
      .reduce((sum, i) => sum + (i.valor || 0), 0)
    return { total, pagos, pendentes }
  }, [filteredImpostos])

  // Totais combinados (custos + contas + impostos)
  const totalCustos = totaisCustos.total + totaisContas.total + totaisImpostos.total
  const totalConfirmados = totaisCustos.confirmados + totaisContas.pagos + totaisImpostos.pagos
  const totalPendentes = totaisCustos.pendentes + totaisContas.pendentes + totaisImpostos.pendentes

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

      // Registrar movimentação bancária (saída) se conta bancária selecionada
      if (custoForm.conta_bancaria_id && custoForm.conta_bancaria_id !== 'none') {
        try {
          await apiContasBancarias.registrarMovimentacao(
            parseInt(custoForm.conta_bancaria_id),
            {
              tipo: 'saida',
              valor: custoForm.valor,
              descricao: `Custo: ${custoForm.descricao}`,
              categoria: 'custo',
              data: custoForm.data_custo
            }
          )
        } catch (err) {
          console.error('Erro ao registrar movimentação bancária:', err)
          toast({
            title: "Aviso",
            description: "Custo criado, mas houve erro ao atualizar o saldo bancário",
            variant: "default"
          })
        }
      }

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
      conta_bancaria_id: 'none',
      observacoes: ''
    })
    setObraFilter('')
    setObraSearchFilter('')
  }

  // Handlers de Contas a Pagar
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
        response = await fetch(`${API_URL}/api/contas-pagar/${id}/pagar`, {
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
        description: error instanceof Error ? error.message : "Erro ao marcar conta como paga",
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

  const toNumber = (value: any) => {
    const parsed = parseFloat(String(value ?? 0))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const enriquecerNotaComImpostosDosItens = (nota: any, itens: any[]) => {
    if (!Array.isArray(itens) || itens.length === 0) {
      return nota
    }

    const totais = itens.reduce((acc, item) => {
      acc.base_calculo_icms += toNumber(item.base_calculo_icms)
      acc.valor_icms += toNumber(item.valor_icms)
      acc.base_calculo_issqn += toNumber(item.base_calculo_issqn)
      acc.valor_issqn += toNumber(item.valor_issqn)
      acc.valor_inss += toNumber(item.valor_inss)
      acc.valor_ipi += toNumber(item.valor_ipi)
      acc.valor_liquido += toNumber(item.valor_liquido)
      return acc
    }, {
      base_calculo_icms: 0,
      valor_icms: 0,
      base_calculo_issqn: 0,
      valor_issqn: 0,
      valor_inss: 0,
      valor_ipi: 0,
      valor_liquido: 0
    })

    return {
      ...nota,
      base_calculo_icms: toNumber(nota.base_calculo_icms) > 0 ? toNumber(nota.base_calculo_icms) : totais.base_calculo_icms,
      valor_icms: toNumber(nota.valor_icms) > 0 ? toNumber(nota.valor_icms) : totais.valor_icms,
      base_calculo_issqn: toNumber(nota.base_calculo_issqn) > 0 ? toNumber(nota.base_calculo_issqn) : totais.base_calculo_issqn,
      valor_issqn: toNumber(nota.valor_issqn) > 0 ? toNumber(nota.valor_issqn) : totais.valor_issqn,
      valor_inss: toNumber(nota.valor_inss) > 0 ? toNumber(nota.valor_inss) : totais.valor_inss,
      valor_ipi: toNumber(nota.valor_ipi) > 0 ? toNumber(nota.valor_ipi) : totais.valor_ipi,
      valor_liquido: toNumber(nota.valor_liquido) > 0 ? toNumber(nota.valor_liquido) : totais.valor_liquido
    }
  }

  const getStatusBadge = (status: string, options?: { notaFiscal?: boolean }) => {
    const isNotaFiscal = options?.notaFiscal === true
    const variants: Record<string, string> = {
      pendente: 'bg-yellow-500',
      pago: 'bg-green-500',
      vencido: 'bg-red-500',
      cancelado: 'bg-gray-500',
      confirmado: 'bg-green-500',
      atrasado: 'bg-red-500'
    }
    const labelsPadrao: Record<string, string> = {
      pendente: 'Pendente',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado',
      confirmado: 'Confirmado',
      atrasado: 'Atrasado'
    }
    const labelsNotaFiscal: Record<string, string> = {
      pendente: 'Pendente',
      pago: 'Paga',
      vencido: 'Vencida',
      cancelado: 'Cancelada',
      confirmado: 'Confirmada',
      atrasado: 'Atrasada'
    }
    const labels = isNotaFiscal ? labelsNotaFiscal : labelsPadrao
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
                    {formatarMoeda(totalCustos)}
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
                    {formatarMoeda(totalConfirmados)}
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
                    {formatarMoeda(totalPendentes)}
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
                            {getStatusBadge(nota.status, { notaFiscal: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  setViewingItem({ tipo: 'nota_fiscal', data: nota })
                                  setIsViewDialogOpen(true)
                                  setLoadingDetalhesNota(true)

                                  try {
                                    let notaId: number | null = null

                                    if (nota.nota_fiscal_id) {
                                      notaId = typeof nota.nota_fiscal_id === 'number'
                                        ? nota.nota_fiscal_id
                                        : parseInt(String(nota.nota_fiscal_id))
                                    } else if (nota.id) {
                                      if (typeof nota.id === 'number') {
                                        notaId = nota.id
                                      } else if (typeof nota.id === 'string' && nota.id.startsWith('nf_')) {
                                        notaId = parseInt(nota.id.replace('nf_', ''))
                                      } else if (typeof nota.id === 'string') {
                                        notaId = parseInt(nota.id)
                                      }
                                    }

                                    if (notaId && !isNaN(notaId)) {
                                      const detalhesResponse = await notasFiscaisApi.getById(notaId)

                                      if (detalhesResponse.success && detalhesResponse.data) {
                                        let notaDetalhada = detalhesResponse.data

                                        try {
                                          const itensResponse = await notasFiscaisApi.listarItens(notaId)
                                          if (itensResponse?.success && Array.isArray(itensResponse.data)) {
                                            notaDetalhada = enriquecerNotaComImpostosDosItens(notaDetalhada, itensResponse.data)
                                          }
                                        } catch (itensError) {
                                          console.warn('Nao foi possivel carregar itens da NF para agregar impostos:', itensError)
                                        }

                                        setViewingItem({
                                          tipo: 'nota_fiscal',
                                          data: notaDetalhada
                                        })
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Erro ao buscar detalhes da nota fiscal:', error)
                                    toast({
                                      title: "Aviso",
                                      description: "Nao foi possivel carregar todos os detalhes. Exibindo informacoes disponiveis.",
                                      variant: "default"
                                    })
                                  } finally {
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
              <Label htmlFor="conta_bancaria_id">Conta Bancária (débito)</Label>
              <Select
                value={custoForm.conta_bancaria_id}
                onValueChange={(value) => setCustoForm({ ...custoForm, conta_bancaria_id: value })}
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
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open)
        if (!open) {
          setViewingItem(null)
          setLoadingDetalhesNota(false)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
            <DialogDescription>
              Informações completas do registro selecionado
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
                        {getStatusBadge(viewingItem.data.status, { notaFiscal: true })}
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

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">Detalhes dos Impostos</h3>

                    {(viewingItem.data.base_calculo_icms > 0 || viewingItem.data.valor_icms > 0 || viewingItem.data.base_calculo_icms_st > 0 || viewingItem.data.valor_icms_st > 0 || viewingItem.data.valor_fcp_st > 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Impostos Estaduais</h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                          {viewingItem.data.base_calculo_icms > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Base de Cálculo ICMS</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.base_calculo_icms)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_icms > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">ICMS</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_icms)}</p>
                            </div>
                          )}
                          {viewingItem.data.base_calculo_icms_st > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Base de Cálculo ICMS ST</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.base_calculo_icms_st)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_icms_st > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">ICMS ST</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_icms_st)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_fcp_st > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">FCP ST</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_fcp_st)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(viewingItem.data.valor_ipi > 0 || viewingItem.data.valor_pis > 0 || viewingItem.data.valor_cofins > 0 || viewingItem.data.valor_inss > 0 || viewingItem.data.valor_ir > 0 || viewingItem.data.valor_csll > 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Impostos Federais</h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                          {viewingItem.data.valor_ipi > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">IPI</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_ipi)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_pis > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">PIS</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_pis)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_cofins > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">COFINS</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_cofins)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_inss > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">INSS</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_inss)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_ir > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">IR</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_ir)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_csll > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">CSLL</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_csll)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(viewingItem.data.base_calculo_issqn > 0 || viewingItem.data.valor_issqn > 0 || viewingItem.data.aliquota_issqn > 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Impostos Municipais</h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                          {viewingItem.data.base_calculo_issqn > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Base de Cálculo ISSQN</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.base_calculo_issqn)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_issqn > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">ISSQN</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_issqn)}</p>
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

                    {(viewingItem.data.retencoes_federais > 0 || viewingItem.data.outras_retencoes > 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Retenções</h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                          {viewingItem.data.retencoes_federais > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Retenções Federais</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.retencoes_federais)}</p>
                            </div>
                          )}
                          {viewingItem.data.outras_retencoes > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Outras Retenções</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.outras_retencoes)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(viewingItem.data.valor_frete > 0 || viewingItem.data.valor_seguro > 0 || viewingItem.data.valor_desconto > 0 || viewingItem.data.outras_despesas_acessorias > 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Outros Valores</h4>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
                          {viewingItem.data.valor_frete > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Frete</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_frete)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_seguro > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Seguro</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.valor_seguro)}</p>
                            </div>
                          )}
                          {viewingItem.data.valor_desconto > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Desconto</Label>
                              <p className="text-sm font-medium text-red-600">{formatarMoeda(viewingItem.data.valor_desconto)}</p>
                            </div>
                          )}
                          {viewingItem.data.outras_despesas_acessorias > 0 && (
                            <div>
                              <Label className="text-xs text-gray-600">Outras Despesas</Label>
                              <p className="text-sm font-medium">{formatarMoeda(viewingItem.data.outras_despesas_acessorias)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {viewingItem.data.valor_liquido !== undefined && viewingItem.data.valor_liquido !== null && (
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center bg-green-50 p-3 rounded-md">
                          <Label className="text-sm font-semibold text-gray-700">Valor Líquido</Label>
                          <p className="text-lg font-bold text-green-600">{formatarMoeda(viewingItem.data.valor_liquido || 0)}</p>
                        </div>
                      </div>
                    )}

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
