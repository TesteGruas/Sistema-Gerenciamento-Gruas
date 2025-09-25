"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ConeIcon as Crane, 
  Plus, 
  Search, 
  Calendar,
  Building2,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Wrench,
  XCircle,
  Trash2,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3
} from "lucide-react"
import { 
  mockGruas, 
  mockObras, 
  mockUsers,
  GruaMes
} from "@/lib/mock-data"

// Dados mockados para gruas por mês
const mockGruasMes: GruaMes[] = [
  // Janeiro 2025
  {
    id: 'gm1',
    gruaId: '1',
    gruaName: 'Grua 001',
    mes: '2025-01',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    status: 'em_obra',
    horasTrabalhadas: 180,
    horasDisponiveis: 200,
    eficiencia: 90,
    custoHora: 150,
    custoTotal: 27000,
    observacoes: 'Operação normal, sem interrupções',
    responsavelId: '4',
    responsavelName: 'Ana Oliveira',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-31T23:59:59Z'
  },
  {
    id: 'gm2',
    gruaId: '2',
    gruaName: 'Grua 002',
    mes: '2025-01',
    obraId: '2',
    obraName: 'Shopping Center Beta',
    status: 'em_obra',
    horasTrabalhadas: 160,
    horasDisponiveis: 200,
    eficiencia: 80,
    custoHora: 120,
    custoTotal: 19200,
    observacoes: 'Algumas paradas para manutenção preventiva',
    responsavelId: '5',
    responsavelName: 'Carlos Mendes',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-31T23:59:59Z'
  },
  {
    id: 'gm3',
    gruaId: '3',
    gruaName: 'Grua 003',
    mes: '2025-01',
    obraId: '',
    obraName: '',
    status: 'disponivel',
    horasTrabalhadas: 0,
    horasDisponiveis: 200,
    eficiencia: 0,
    custoHora: 100,
    custoTotal: 0,
    observacoes: 'Grua disponível para nova obra',
    responsavelId: '1',
    responsavelName: 'João Silva',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-31T23:59:59Z'
  },
  // Fevereiro 2025
  {
    id: 'gm4',
    gruaId: '1',
    gruaName: 'Grua 001',
    mes: '2025-02',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    status: 'em_obra',
    horasTrabalhadas: 190,
    horasDisponiveis: 200,
    eficiencia: 95,
    custoHora: 150,
    custoTotal: 28500,
    observacoes: 'Excelente performance no mês',
    responsavelId: '4',
    responsavelName: 'Ana Oliveira',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-28T23:59:59Z'
  },
  {
    id: 'gm5',
    gruaId: '2',
    gruaName: 'Grua 002',
    mes: '2025-02',
    obraId: '2',
    obraName: 'Shopping Center Beta',
    status: 'manutencao',
    horasTrabalhadas: 120,
    horasDisponiveis: 200,
    eficiencia: 60,
    custoHora: 120,
    custoTotal: 14400,
    observacoes: 'Manutenção corretiva realizada',
    responsavelId: '5',
    responsavelName: 'Carlos Mendes',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-28T23:59:59Z'
  },
  {
    id: 'gm6',
    gruaId: '3',
    gruaName: 'Grua 003',
    mes: '2025-02',
    obraId: '1',
    obraName: 'Torre Residencial Alpha',
    status: 'em_obra',
    horasTrabalhadas: 170,
    horasDisponiveis: 200,
    eficiencia: 85,
    custoHora: 100,
    custoTotal: 17000,
    observacoes: 'Nova grua alocada para a obra',
    responsavelId: '3',
    responsavelName: 'Pedro Costa',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-28T23:59:59Z'
  }
]

// Interface para GruaMes
interface GruaMes {
  id: string
  gruaId: string
  gruaName: string
  mes: string // formato YYYY-MM
  obraId: string
  obraName: string
  status: 'disponivel' | 'em_obra' | 'manutencao' | 'inativa'
  horasTrabalhadas: number
  horasDisponiveis: number
  eficiencia: number // porcentagem
  custoHora: number
  custoTotal: number
  observacoes?: string
  responsavelId: string
  responsavelName: string
  createdAt: string
  updatedAt: string
}

export default function GruasMesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMes, setSelectedMes] = useState("2025-01")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isNovoMesDialogOpen, setIsNovoMesDialogOpen] = useState(false)
  const [editingGruaMes, setEditingGruaMes] = useState<GruaMes | null>(null)
  const [gruaMesToDelete, setGruaMesToDelete] = useState<GruaMes | null>(null)
  const [gruaMesFormData, setGruaMesFormData] = useState({
    gruaId: '',
    obraId: '',
    responsavelId: '',
    custoHora: 100,
    observacoes: ''
  })
  const [novoMesData, setNovoMesData] = useState({
    mes: '',
    obraId: '',
    responsavelId: ''
  })

  // Estados para gerenciar dados
  const [gruasMes, setGruasMes] = useState<GruaMes[]>(mockGruasMes)
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>(['2025-01', '2025-02'])

  // Função para obter gruas por mês
  const getGruasMesByMes = (mes: string): GruaMes[] => {
    return gruasMes.filter(gruaMes => gruaMes.mes === mes)
  }

  // Função para obter estatísticas
  const getEstatisticasGruasMes = (mes: string) => {
    const gruasMesFiltradas = getGruasMesByMes(mes)
    
    const totalHorasTrabalhadas = gruasMesFiltradas.reduce((sum, gm) => sum + gm.horasTrabalhadas, 0)
    const totalHorasDisponiveis = gruasMesFiltradas.reduce((sum, gm) => sum + gm.horasDisponiveis, 0)
    const totalCusto = gruasMesFiltradas.reduce((sum, gm) => sum + gm.custoTotal, 0)
    const eficienciaMedia = gruasMesFiltradas.length > 0 ? gruasMesFiltradas.reduce((sum, gm) => sum + gm.eficiencia, 0) / gruasMesFiltradas.length : 0
    
    const gruasEmObra = gruasMesFiltradas.filter(gm => gm.status === 'em_obra').length
    const gruasEmManutencao = gruasMesFiltradas.filter(gm => gm.status === 'manutencao').length
    const gruasDisponiveis = gruasMesFiltradas.filter(gm => gm.status === 'disponivel').length
    
    return {
      totalGruas: gruasMesFiltradas.length,
      totalHorasTrabalhadas,
      totalHorasDisponiveis,
      totalCusto,
      eficienciaMedia: Math.round(eficienciaMedia * 100) / 100,
      gruasEmObra,
      gruasEmManutencao,
      gruasDisponiveis,
      utilizacao: totalHorasDisponiveis > 0 ? Math.round((totalHorasTrabalhadas / totalHorasDisponiveis) * 100 * 100) / 100 : 0
    }
  }

  // Função para criar custos iniciais para um novo mês
  const criarCustosIniciaisParaNovoMes = (mes: string, obraId: string, responsavelId: string) => {
    const obra = mockObras.find(o => o.id === obraId)
    const responsavel = mockUsers.find(u => u.id === responsavelId)
    
    if (!obra || !responsavel) {
      throw new Error('Obra ou responsável não encontrado')
    }

    // Criar alocações iniciais para todas as gruas disponíveis
    const novasAlocacoes: GruaMes[] = mockGruas.map(grua => ({
      id: `gm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gruaId: grua.id,
      gruaName: grua.name,
      mes: mes,
      obraId: obraId,
      obraName: obra.name,
      status: 'disponivel' as const,
      horasTrabalhadas: 0,
      horasDisponiveis: 200,
      eficiencia: 0,
      custoHora: 100,
      custoTotal: 0,
      observacoes: 'Custos iniciais criados automaticamente',
      responsavelId: responsavelId,
      responsavelName: responsavel.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    return novasAlocacoes
  }

  // Função para gerar meses disponíveis
  const gerarMesesDisponiveis = () => {
    const meses = []
    const hoje = new Date()
    
    // Gerar próximos 12 meses
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mes = data.toISOString().slice(0, 7) // formato YYYY-MM
      if (!mesesDisponiveis.includes(mes)) {
        meses.push(mes)
      }
    }
    
    return meses
  }

  const estatisticas = getEstatisticasGruasMes(selectedMes)
  
  const filteredGruasMes = getGruasMesByMes(selectedMes).filter(gruaMes => {
    const matchesSearch = gruaMes.gruaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gruaMes.obraName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || gruaMes.status === selectedStatus
    const matchesObra = selectedObra === "all" || gruaMes.obraId === selectedObra
    
    return matchesSearch && matchesStatus && matchesObra
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-800'
      case 'em_obra': return 'bg-blue-100 text-blue-800'
      case 'manutencao': return 'bg-yellow-100 text-yellow-800'
      case 'inativa': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disponivel': return <CheckCircle className="w-4 h-4" />
      case 'em_obra': return <Building2 className="w-4 h-4" />
      case 'manutencao': return <Wrench className="w-4 h-4" />
      case 'inativa': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleCreateGruaMes = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const obra = mockObras.find(o => o.id === gruaMesFormData.obraId)
      const responsavel = mockUsers.find(u => u.id === gruaMesFormData.responsavelId)
      
      if (!obra || !responsavel) {
        throw new Error('Obra ou responsável não encontrado')
      }

      const novaGruaMes: GruaMes = {
        id: `gm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gruaId: gruaMesFormData.gruaId,
        gruaName: mockGruas.find(g => g.id === gruaMesFormData.gruaId)?.name || '',
        mes: selectedMes,
        obraId: gruaMesFormData.obraId,
        obraName: obra.name,
        status: 'em_obra',
        horasTrabalhadas: 0,
        horasDisponiveis: 200,
        eficiencia: 0,
        custoHora: gruaMesFormData.custoHora,
        custoTotal: 0,
        observacoes: gruaMesFormData.observacoes,
        responsavelId: gruaMesFormData.responsavelId,
        responsavelName: responsavel.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setGruasMes(prev => [...prev, novaGruaMes])
      
      // Resetar formulário e fechar dialog
      setGruaMesFormData({
        gruaId: '',
        obraId: '',
        responsavelId: '',
        custoHora: 100,
        observacoes: ''
      })
      setIsCreateDialogOpen(false)
      
      alert('Grua alocada para o mês com sucesso!')
    } catch (err) {
      console.error('Erro ao criar grua por mês:', err)
      alert(err instanceof Error ? err.message : 'Erro ao criar grua por mês')
    }
  }

  const handleEditGruaMes = (gruaMes: GruaMes) => {
    setEditingGruaMes(gruaMes)
    setGruaMesFormData({
      gruaId: gruaMes.gruaId,
      obraId: gruaMes.obraId,
      responsavelId: gruaMes.responsavelId,
      custoHora: gruaMes.custoHora,
      observacoes: gruaMes.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateGruaMes = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingGruaMes) return
    
    try {
      const responsavel = mockUsers.find(u => u.id === gruaMesFormData.responsavelId)
      
      if (!responsavel) {
        throw new Error('Responsável não encontrado')
      }

      const gruaMesAtualizada: GruaMes = {
        ...editingGruaMes,
        custoHora: gruaMesFormData.custoHora,
        observacoes: gruaMesFormData.observacoes,
        responsavelId: gruaMesFormData.responsavelId,
        responsavelName: responsavel.name,
        updatedAt: new Date().toISOString()
      }
      
      setGruasMes(prev => prev.map(gm => gm.id === editingGruaMes.id ? gruaMesAtualizada : gm))
      
      setIsEditDialogOpen(false)
      setEditingGruaMes(null)
      
      alert('Grua por mês atualizada com sucesso!')
    } catch (err) {
      console.error('Erro ao atualizar grua por mês:', err)
      alert(err instanceof Error ? err.message : 'Erro ao atualizar grua por mês')
    }
  }

  const handleDeleteGruaMes = (gruaMes: GruaMes) => {
    setGruaMesToDelete(gruaMes)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteGruaMes = async () => {
    if (!gruaMesToDelete) return

    try {
      setGruasMes(prev => prev.filter(gm => gm.id !== gruaMesToDelete.id))
      
      setIsDeleteDialogOpen(false)
      setGruaMesToDelete(null)
      
      alert(`Grua "${gruaMesToDelete.gruaName}" removida do mês com sucesso!`)
    } catch (err) {
      console.error('Erro ao excluir grua por mês:', err)
      alert(err instanceof Error ? err.message : 'Erro ao excluir grua por mês')
    }
  }

  const handleNovoMes = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const novasAlocacoes = criarCustosIniciaisParaNovoMes(
        novoMesData.mes,
        novoMesData.obraId,
        novoMesData.responsavelId
      )
      
      setGruasMes(prev => [...prev, ...novasAlocacoes])
      setMesesDisponiveis(prev => [...prev, novoMesData.mes].sort())
      
      setNovoMesData({
        mes: '',
        obraId: '',
        responsavelId: ''
      })
      setIsNovoMesDialogOpen(false)
      
      alert(`Custos iniciais criados para ${formatarMes(novoMesData.mes)} com sucesso!`)
    } catch (err) {
      console.error('Erro ao criar novo mês:', err)
      alert(err instanceof Error ? err.message : 'Erro ao criar novo mês')
    }
  }

  const formatarMes = (mes: string) => {
    const [ano, mesNum] = mes.split('-')
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return `${meses[parseInt(mesNum) - 1]} ${ano}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gruas por Mês</h1>
          <p className="text-gray-600">Gerenciamento de alocação de gruas por mês</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsNovoMesDialogOpen(true)}
          >
            <Calendar className="w-4 h-4" />
            Novo Mês
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Nova Alocação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Gruas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalGruas}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Crane className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Trabalhadas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.totalHorasTrabalhadas}h</p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eficiência Média</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.eficienciaMedia}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {estatisticas.totalCusto.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="mes">Mês</Label>
              <Select value={selectedMes} onValueChange={setSelectedMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {mesesDisponiveis.map(mes => (
                    <SelectItem key={mes} value={mes}>
                      {formatarMes(mes)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Buscar gruas</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome da grua ou obra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_obra">Em Obra</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Gruas por Mês */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGruasMes.map((gruaMes) => (
          <Card key={gruaMes.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Crane className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{gruaMes.gruaName}</CardTitle>
                </div>
                <Badge className={getStatusColor(gruaMes.status)}>
                  {getStatusIcon(gruaMes.status)}
                  <span className="ml-1 capitalize">{gruaMes.status.replace('_', ' ')}</span>
                </Badge>
              </div>
              <CardDescription>{formatarMes(gruaMes.mes)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gruaMes.obraName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>Obra: {gruaMes.obraName}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Horas Trabalhadas:</span>
                    <p className="font-medium">{gruaMes.horasTrabalhadas}h</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Eficiência:</span>
                    <p className="font-medium">{gruaMes.eficiencia}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Custo/Hora:</span>
                    <p className="font-medium">R$ {gruaMes.custoHora}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Custo Total:</span>
                    <p className="font-medium">R$ {gruaMes.custoTotal.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Responsável: {gruaMes.responsavelName}</span>
                </div>
                
                {gruaMes.observacoes && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Observações:</span>
                    <p className="mt-1">{gruaMes.observacoes}</p>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditGruaMes(gruaMes)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteGruaMes(gruaMes)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredGruasMes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Crane className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua encontrada</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando os custos iniciais para este mês.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setIsNovoMesDialogOpen(true)}>
                <Calendar className="w-4 h-4 mr-2" />
                Criar Custos Iniciais
              </Button>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Alocação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Novo Mês */}
      <Dialog open={isNovoMesDialogOpen} onOpenChange={setIsNovoMesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Criar Custos Iniciais para Novo Mês
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNovoMes} className="space-y-4">
            <div>
              <Label htmlFor="novoMes">Mês *</Label>
              <Select
                value={novoMesData.mes}
                onValueChange={(value) => setNovoMesData({ ...novoMesData, mes: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {gerarMesesDisponiveis().map(mes => (
                    <SelectItem key={mes} value={mes}>
                      {formatarMes(mes)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="novoObraId">Obra *</Label>
              <Select
                value={novoMesData.obraId}
                onValueChange={(value) => setNovoMesData({ ...novoMesData, obraId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="novoResponsavelId">Responsável *</Label>
              <Select
                value={novoMesData.responsavelId}
                onValueChange={(value) => setNovoMesData({ ...novoMesData, responsavelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.filter(user => user.role !== 'cliente').map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Esta ação criará custos iniciais para todas as gruas disponíveis no mês selecionado. 
                As gruas começarão com status "Disponível" e poderão ser alocadas posteriormente.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNovoMesDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Custos Iniciais
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crane className="w-5 h-5" />
              Nova Alocação de Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGruaMes} className="space-y-4">
            <div>
              <Label htmlFor="gruaId">Grua *</Label>
              <Select
                value={gruaMesFormData.gruaId}
                onValueChange={(value) => setGruaMesFormData({ ...gruaMesFormData, gruaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma grua" />
                </SelectTrigger>
                <SelectContent>
                  {mockGruas.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.name} - {grua.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="obraId">Obra *</Label>
              <Select
                value={gruaMesFormData.obraId}
                onValueChange={(value) => setGruaMesFormData({ ...gruaMesFormData, obraId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsavelId">Responsável *</Label>
              <Select
                value={gruaMesFormData.responsavelId}
                onValueChange={(value) => setGruaMesFormData({ ...gruaMesFormData, responsavelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.filter(user => user.role !== 'cliente').map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custoHora">Custo por Hora (R$)</Label>
              <Input
                id="custoHora"
                type="number"
                value={gruaMesFormData.custoHora}
                onChange={(e) => setGruaMesFormData({ ...gruaMesFormData, custoHora: Number(e.target.value) })}
                placeholder="100"
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={gruaMesFormData.observacoes}
                onChange={(e) => setGruaMesFormData({ ...gruaMesFormData, observacoes: e.target.value })}
                placeholder="Observações sobre a alocação..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Alocar Grua
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Alocação de Grua
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateGruaMes} className="space-y-4">
            <div>
              <Label htmlFor="edit-custoHora">Custo por Hora (R$)</Label>
              <Input
                id="edit-custoHora"
                type="number"
                value={gruaMesFormData.custoHora}
                onChange={(e) => setGruaMesFormData({ ...gruaMesFormData, custoHora: Number(e.target.value) })}
                placeholder="100"
              />
            </div>

            <div>
              <Label htmlFor="edit-responsavelId">Responsável</Label>
              <Select
                value={gruaMesFormData.responsavelId}
                onValueChange={(value) => setGruaMesFormData({ ...gruaMesFormData, responsavelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.filter(user => user.role !== 'cliente').map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={gruaMesFormData.observacoes}
                onChange={(e) => setGruaMesFormData({ ...gruaMesFormData, observacoes: e.target.value })}
                placeholder="Observações sobre a alocação..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja remover a grua <strong>{gruaMesToDelete?.gruaName}</strong> do mês <strong>{gruaMesToDelete && formatarMes(gruaMesToDelete.mes)}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. A grua será removida da alocação mensal.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteGruaMes}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
