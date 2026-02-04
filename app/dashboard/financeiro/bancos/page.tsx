"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Edit,
  Trash2, 
  DollarSign,
  Calendar,
  Building2,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiContasBancarias from "@/lib/api-contas-bancarias"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

interface ContaBancaria {
  id: number
  banco: string
  agencia: string
  conta: string
  tipo_conta: string
  saldo_atual: number
  status: string
  nome?: string
}

interface Movimentacao {
  id: number
  conta_bancaria_id: number
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  referencia?: string
  data: string
  categoria?: string
  observacoes?: string
  created_at: string
  contas_bancarias?: {
    id: number
    banco: string
    agencia: string
    conta: string
    tipo_conta: string
  }
}

export default function BancosPage() {
  const { toast } = useToast()
  
  // Estados
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateBancoOpen, setIsCreateBancoOpen] = useState(false)
  const [isCreateMovimentacaoOpen, setIsCreateMovimentacaoOpen] = useState(false)
  const [isEditMovimentacaoOpen, setIsEditMovimentacaoOpen] = useState(false)
  const [editingMovimentacao, setEditingMovimentacao] = useState<Movimentacao | null>(null)
  
  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("all")
  const [filtroBanco, setFiltroBanco] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Formulários
  const [bancoForm, setBancoForm] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
    saldo_atual: 0,
    status: 'ativa' as 'ativa' | 'inativa' | 'bloqueada'
  })
  
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    conta_bancaria_id: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    valor: 0,
    descricao: '',
    referencia: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [filtroDataInicio, filtroDataFim, filtroTipo, filtroBanco])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar contas bancárias
      const contasResponse = await apiContasBancarias.listar()
      if (contasResponse.success) {
        setContas(contasResponse.data || [])
      }
      
      // Carregar movimentações
      await carregarMovimentacoes()
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

  const carregarMovimentacoes = async () => {
    try {
      const token = getAuthToken()
      const params = new URLSearchParams()
      
      if (filtroDataInicio) params.append('data_inicio', filtroDataInicio)
      if (filtroDataFim) params.append('data_fim', filtroDataFim)
      if (filtroTipo !== 'all') params.append('tipo', filtroTipo)
      if (filtroBanco !== 'all') params.append('conta_bancaria_id', filtroBanco)
      
      const response = await fetch(`${API_URL}/api/contas-bancarias/movimentacoes/todas?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setMovimentacoes(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    }
  }

  // Handlers de Banco
  const handleCreateBanco = async () => {
    try {
      if (!bancoForm.banco || !bancoForm.agencia || !bancoForm.conta) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha banco, agência e conta",
          variant: "destructive"
        })
        return
      }

      const response = await apiContasBancarias.criar({
        nome: bancoForm.banco,
        banco: bancoForm.banco,
        agencia: bancoForm.agencia,
        conta: bancoForm.conta,
        tipo: bancoForm.tipo_conta,
        saldo_inicial: bancoForm.saldo_atual,
        ativa: bancoForm.status === 'ativa'
      })

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Banco cadastrado com sucesso"
        })
        setIsCreateBancoOpen(false)
        resetBancoForm()
        carregarDados()
      }
    } catch (error: any) {
      console.error('Erro ao criar banco:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar banco",
        variant: "destructive"
      })
    }
  }

  const handleDeleteBanco = async (id: number) => {
    try {
      await apiContasBancarias.excluir(id)
      toast({
        title: "Sucesso",
        description: "Banco excluído com sucesso"
      })
      carregarDados()
    } catch (error: any) {
      console.error('Erro ao excluir banco:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir banco",
        variant: "destructive"
      })
    }
  }

  // Handlers de Movimentação
  const handleCreateMovimentacao = async () => {
    try {
      if (!movimentacaoForm.conta_bancaria_id || !movimentacaoForm.descricao || !movimentacaoForm.valor || !movimentacaoForm.data) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha conta, descrição, valor e data",
          variant: "destructive"
        })
        return
      }

      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-bancarias/${movimentacaoForm.conta_bancaria_id}/movimentacoes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: movimentacaoForm.tipo,
          valor: movimentacaoForm.valor,
          descricao: movimentacaoForm.descricao,
          referencia: movimentacaoForm.referencia || null,
          data: movimentacaoForm.data,
          categoria: movimentacaoForm.categoria || null,
          observacoes: movimentacaoForm.observacoes || null
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Movimentação registrada com sucesso"
        })
        setIsCreateMovimentacaoOpen(false)
        resetMovimentacaoForm()
        carregarDados()
      } else {
        throw new Error(data.message || 'Erro ao criar movimentação')
      }
    } catch (error: any) {
      console.error('Erro ao criar movimentação:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar movimentação",
        variant: "destructive"
      })
    }
  }

  const handleEditMovimentacao = (movimentacao: Movimentacao) => {
    setEditingMovimentacao(movimentacao)
    setMovimentacaoForm({
      conta_bancaria_id: movimentacao.conta_bancaria_id.toString(),
      tipo: movimentacao.tipo,
      valor: movimentacao.valor,
      descricao: movimentacao.descricao,
      referencia: movimentacao.referencia || '',
      data: movimentacao.data,
      categoria: movimentacao.categoria || '',
      observacoes: movimentacao.observacoes || ''
    })
    setIsEditMovimentacaoOpen(true)
  }

  const handleUpdateMovimentacao = async () => {
    if (!editingMovimentacao) return

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-bancarias/movimentacoes/${editingMovimentacao.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conta_bancaria_id: parseInt(movimentacaoForm.conta_bancaria_id),
          tipo: movimentacaoForm.tipo,
          valor: movimentacaoForm.valor,
          descricao: movimentacaoForm.descricao,
          referencia: movimentacaoForm.referencia || null,
          data: movimentacaoForm.data,
          categoria: movimentacaoForm.categoria || null,
          observacoes: movimentacaoForm.observacoes || null
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Movimentação atualizada com sucesso"
        })
        setIsEditMovimentacaoOpen(false)
        setEditingMovimentacao(null)
        resetMovimentacaoForm()
        carregarDados()
      } else {
        throw new Error(data.message || 'Erro ao atualizar movimentação')
      }
    } catch (error: any) {
      console.error('Erro ao atualizar movimentação:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar movimentação",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMovimentacao = async (id: number) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-bancarias/movimentacoes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Movimentação excluída com sucesso"
        })
        carregarDados()
      } else {
        throw new Error(data.message || 'Erro ao excluir movimentação')
      }
    } catch (error: any) {
      console.error('Erro ao excluir movimentação:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir movimentação",
        variant: "destructive"
      })
    }
  }

  // Reset forms
  const resetBancoForm = () => {
    setBancoForm({
      banco: '',
      agencia: '',
      conta: '',
      tipo_conta: 'corrente',
      saldo_atual: 0,
      status: 'ativa'
    })
  }

  const resetMovimentacaoForm = () => {
    setMovimentacaoForm({
      conta_bancaria_id: '',
      tipo: 'entrada',
      valor: 0,
      descricao: '',
      referencia: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
      observacoes: ''
    })
  }

  // Utilitários
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }

  const formatarData = (data: string) => {
    if (!data) return 'N/A'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  // Filtrar movimentações
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(mov => {
      const matchesSearch = searchTerm === '' || 
        mov.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.contas_bancarias?.banco.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [movimentacoes, searchTerm])

  // Calcular totais
  const totalEntradas = useMemo(() => {
    return movimentacoesFiltradas
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.valor, 0)
  }, [movimentacoesFiltradas])

  const totalSaidas = useMemo(() => {
    return movimentacoesFiltradas
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + m.valor, 0)
  }, [movimentacoesFiltradas])

  const saldoTotal = useMemo(() => {
    return contas
      .filter(c => c.status === 'ativa')
      .reduce((sum, c) => sum + parseFloat(String(c.saldo_atual)), 0)
  }, [contas])

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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Bancos</h1>
          <p className="text-gray-600">Gerencie contas bancárias e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateMovimentacaoOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Movimentação
          </Button>
          <Button onClick={() => setIsCreateBancoOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Banco
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(saldoTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarMoeda(totalEntradas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarMoeda(totalSaidas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bancos Cadastrados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contas.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="banco">Banco</Label>
              <Select value={filtroBanco} onValueChange={setFiltroBanco}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {contas.map(conta => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.banco} - {conta.agencia}/{conta.conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Bancos */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Bancárias ({contas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum banco cadastrado
            </div>
          ) : (
            <div className="space-y-3">
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-semibold">{conta.banco}</div>
                      <div className="text-sm text-gray-500">
                        Ag: {conta.agencia} • Conta: {conta.conta} • {conta.tipo_conta}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold">{formatarMoeda(conta.saldo_atual)}</div>
                      <Badge className={conta.status === 'ativa' ? 'bg-green-500' : 'bg-gray-500'}>
                        {conta.status}
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Banco</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este banco? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteBanco(conta.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações ({movimentacoesFiltradas.length})</CardTitle>
          <CardDescription>Entradas e saídas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {movimentacoesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma movimentação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoesFiltradas.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatarData(mov.data)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mov.contas_bancarias?.banco || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={mov.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}>
                        {mov.tipo === 'entrada' ? (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 mr-1" />
                        )}
                        {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{mov.descricao}</TableCell>
                    <TableCell>{mov.referencia || '-'}</TableCell>
                    <TableCell className={`text-right font-bold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(mov.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMovimentacao(mov)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Movimentação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMovimentacao(mov.id)}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar Banco */}
      <Dialog open={isCreateBancoOpen} onOpenChange={setIsCreateBancoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Banco</DialogTitle>
            <DialogDescription>
              Cadastre uma nova conta bancária
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Input
                id="banco"
                value={bancoForm.banco}
                onChange={(e) => setBancoForm({ ...bancoForm, banco: e.target.value })}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agencia">Agência *</Label>
                <Input
                  id="agencia"
                  value={bancoForm.agencia}
                  onChange={(e) => setBancoForm({ ...bancoForm, agencia: e.target.value })}
                  placeholder="Ex: 1234-5"
                />
              </div>
              <div>
                <Label htmlFor="conta">Conta *</Label>
                <Input
                  id="conta"
                  value={bancoForm.conta}
                  onChange={(e) => setBancoForm({ ...bancoForm, conta: e.target.value })}
                  placeholder="Ex: 12345-6"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_conta">Tipo de Conta *</Label>
                <Select
                  value={bancoForm.tipo_conta}
                  onValueChange={(value: any) => setBancoForm({ ...bancoForm, tipo_conta: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="saldo_atual">Saldo Inicial</Label>
                <Input
                  id="saldo_atual"
                  type="number"
                  step="0.01"
                  value={bancoForm.saldo_atual}
                  onChange={(e) => setBancoForm({ ...bancoForm, saldo_atual: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={bancoForm.status}
                onValueChange={(value: any) => setBancoForm({ ...bancoForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="bloqueada">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateBancoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateBanco}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Movimentação */}
      <Dialog open={isCreateMovimentacaoOpen} onOpenChange={setIsCreateMovimentacaoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída bancária
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_conta">Banco *</Label>
                <Select
                  value={movimentacaoForm.conta_bancaria_id}
                  onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, conta_bancaria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map(conta => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.banco} - {conta.agencia}/{conta.conta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mov_tipo">Tipo *</Label>
                <Select
                  value={movimentacaoForm.tipo}
                  onValueChange={(value: any) => setMovimentacaoForm({ ...movimentacaoForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_valor">Valor *</Label>
                <Input
                  id="mov_valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movimentacaoForm.valor}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="mov_data">Data *</Label>
                <Input
                  id="mov_data"
                  type="date"
                  value={movimentacaoForm.data}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, data: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mov_descricao">Descrição *</Label>
              <Input
                id="mov_descricao"
                value={movimentacaoForm.descricao}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, descricao: e.target.value })}
                placeholder="Ex: Recebimento de cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mov_referencia">Referência</Label>
                <Input
                  id="mov_referencia"
                  value={movimentacaoForm.referencia}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, referencia: e.target.value })}
                  placeholder="Ex: NF 12345"
                />
              </div>
              <div>
                <Label htmlFor="mov_categoria">Categoria</Label>
                <Input
                  id="mov_categoria"
                  value={movimentacaoForm.categoria}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, categoria: e.target.value })}
                  placeholder="Ex: Recebimento, Pagamento"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mov_observacoes">Observações</Label>
              <Textarea
                id="mov_observacoes"
                value={movimentacaoForm.observacoes}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateMovimentacaoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMovimentacao}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Movimentação */}
      <Dialog open={isEditMovimentacaoOpen} onOpenChange={setIsEditMovimentacaoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
            <DialogDescription>
              Edite as informações da movimentação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_mov_conta">Banco *</Label>
                <Select
                  value={movimentacaoForm.conta_bancaria_id}
                  onValueChange={(value) => setMovimentacaoForm({ ...movimentacaoForm, conta_bancaria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map(conta => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.banco} - {conta.agencia}/{conta.conta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_mov_tipo">Tipo *</Label>
                <Select
                  value={movimentacaoForm.tipo}
                  onValueChange={(value: any) => setMovimentacaoForm({ ...movimentacaoForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_mov_valor">Valor *</Label>
                <Input
                  id="edit_mov_valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movimentacaoForm.valor}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_mov_data">Data *</Label>
                <Input
                  id="edit_mov_data"
                  type="date"
                  value={movimentacaoForm.data}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, data: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_mov_descricao">Descrição *</Label>
              <Input
                id="edit_mov_descricao"
                value={movimentacaoForm.descricao}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_mov_referencia">Referência</Label>
                <Input
                  id="edit_mov_referencia"
                  value={movimentacaoForm.referencia}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, referencia: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_mov_categoria">Categoria</Label>
                <Input
                  id="edit_mov_categoria"
                  value={movimentacaoForm.categoria}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, categoria: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_mov_observacoes">Observações</Label>
              <Textarea
                id="edit_mov_observacoes"
                value={movimentacaoForm.observacoes}
                onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditMovimentacaoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateMovimentacao}>
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
