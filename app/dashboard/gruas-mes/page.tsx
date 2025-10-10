"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ConeIcon as Crane, 
  Plus, 
  Search, 
  Calendar,
  Building2,
  Edit,
  CheckCircle,
  Clock,
  Wrench,
  Trash2,
  TrendingUp,
  DollarSign,
  Users,
  Loader2
} from "lucide-react"
import { 
  getGruasMensais, 
  getEstatisticasGruasMes,
  createGruaMensal, 
  updateGruaMensal, 
  deleteGruaMensal,
  inicializarMes,
  type GruaMensal,
  type EstatisticasGruasMes
} from "@/lib/api-gruas-mensais"
import { getGruas, type Grua } from "@/lib/api-gruas"
import { getObras, type Obra } from "@/lib/api-obras"
import { getUsers, type Usuario } from "@/lib/api-usuarios"

export default function GruasMesPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMes, setSelectedMes] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedObra, setSelectedObra] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isNovoMesDialogOpen, setIsNovoMesDialogOpen] = useState(false)
  const [editingGruaMes, setEditingGruaMes] = useState<GruaMensal | null>(null)
  const [gruaMesToDelete, setGruaMesToDelete] = useState<GruaMensal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados de dados
  const [gruasMes, setGruasMes] = useState<GruaMensal[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasGruasMes | null>(null)
  const [gruas, setGruas] = useState<Grua[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [mesesDisponiveis, setMesesDisponiveis] = useState<string[]>([])
  
  // Estado do formulário
  const [gruaMesFormData, setGruaMesFormData] = useState({
    gruaId: '',
    obraId: '',
    responsavelId: '',
    custoHora: 100,
    observacoes: ''
  })
  
  const [novoMesData, setNovoMesData] = useState({
    mes: '',
    ano: new Date().getFullYear()
  })

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [selectedMes])

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      // Carregar gruas mensais
      const [ano, mes] = selectedMes.split('-')
      const gruasMensaisData = await getGruasMensais({ mes: selectedMes, ano: parseInt(ano) })
      setGruasMes(gruasMensaisData)
      
      // Carregar estatísticas
      const stats = await getEstatisticasGruasMes(selectedMes)
      setEstatisticas(stats)
      
      // Carregar gruas, obras e usuários (apenas uma vez)
      if (gruas.length === 0) {
        const [gruasData, obrasData, usuariosData] = await Promise.all([
          getGruas(),
          getObras(),
          getUsers()
        ])
        setGruas(gruasData)
        setObras(obrasData)
        setUsuarios(usuariosData)
      }
      
      // Gerar meses disponíveis
      gerarMesesDisponiveis()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const gerarMesesDisponiveis = () => {
    const meses = []
    const hoje = new Date()
    
    // Gerar últimos 6 meses e próximos 6 meses
    for (let i = -6; i <= 6; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
      const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      meses.push(mes)
    }
    
    setMesesDisponiveis(meses)
  }

  const filteredGruasMes = gruasMes.filter(gruaMes => {
    const matchesSearch = gruaMes.grua_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gruaMes.obra_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || gruaMes.status === selectedStatus
    const matchesObra = selectedObra === "all" || String(gruaMes.obra_id) === selectedObra
    
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
    
    if (!gruaMesFormData.gruaId) {
      toast({
        title: "Erro",
        description: "Selecione uma grua",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      const [ano] = selectedMes.split('-')
      await createGruaMensal({
        grua_id: gruaMesFormData.gruaId,
        mes: selectedMes,
        ano: parseInt(ano),
        obra_id: gruaMesFormData.obraId && gruaMesFormData.obraId !== 'none' ? parseInt(gruaMesFormData.obraId) : null,
        custo_hora: gruaMesFormData.custoHora,
        responsavel_id: gruaMesFormData.responsavelId && gruaMesFormData.responsavelId !== 'none' ? parseInt(gruaMesFormData.responsavelId) : null,
        observacoes: gruaMesFormData.observacoes || undefined,
        status: gruaMesFormData.obraId && gruaMesFormData.obraId !== 'none' ? 'em_obra' : 'disponivel'
      })
      
      await carregarDados()
      
      setGruaMesFormData({
        gruaId: '',
        obraId: '',
        responsavelId: '',
        custoHora: 100,
        observacoes: ''
      })
      setIsCreateDialogOpen(false)
      
      toast({
        title: "Sucesso",
        description: "Grua alocada para o mês com sucesso!",
      })
    } catch (err) {
      console.error('Erro ao criar grua por mês:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao criar grua por mês',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditGruaMes = (gruaMes: GruaMensal) => {
    setEditingGruaMes(gruaMes)
    setGruaMesFormData({
      gruaId: gruaMes.grua_id,
      obraId: gruaMes.obra_id ? String(gruaMes.obra_id) : '',
      responsavelId: gruaMes.responsavel_id ? String(gruaMes.responsavel_id) : '',
      custoHora: gruaMes.custo_hora,
      observacoes: gruaMes.observacoes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateGruaMes = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingGruaMes) return
    
    setIsSubmitting(true)
    try {
      await updateGruaMensal(editingGruaMes.id, {
        obra_id: gruaMesFormData.obraId ? parseInt(gruaMesFormData.obraId) : null,
        custo_hora: gruaMesFormData.custoHora,
        responsavel_id: gruaMesFormData.responsavelId ? parseInt(gruaMesFormData.responsavelId) : null,
        observacoes: gruaMesFormData.observacoes || undefined
      })
      
      await carregarDados()
      
      setIsEditDialogOpen(false)
      setEditingGruaMes(null)
      
      toast({
        title: "Sucesso",
        description: "Grua por mês atualizada com sucesso!",
      })
    } catch (err) {
      console.error('Erro ao atualizar grua por mês:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao atualizar grua por mês',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGruaMes = (gruaMes: GruaMensal) => {
    setGruaMesToDelete(gruaMes)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteGruaMes = async () => {
    if (!gruaMesToDelete) return

    setIsSubmitting(true)
    try {
      await deleteGruaMensal(gruaMesToDelete.id)
      await carregarDados()
      
      setIsDeleteDialogOpen(false)
      setGruaMesToDelete(null)
      
      toast({
        title: "Sucesso",
        description: `Grua "${gruaMesToDelete.grua_name}" removida do mês com sucesso!`,
      })
    } catch (err) {
      console.error('Erro ao excluir grua por mês:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao excluir grua por mês',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNovoMes = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!novoMesData.mes) {
      toast({
        title: "Erro",
        description: "Selecione um mês",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      await inicializarMes(novoMesData.mes, novoMesData.ano)
      
      // Se o mês criado é o selecionado, recarregar
      if (novoMesData.mes === selectedMes) {
        await carregarDados()
      }
      
      setNovoMesData({
        mes: '',
        ano: new Date().getFullYear()
      })
      setIsNovoMesDialogOpen(false)
      
      toast({
        title: "Sucesso",
        description: `Custos iniciais criados para ${formatarMes(novoMesData.mes)} com sucesso!`,
      })
    } catch (err) {
      console.error('Erro ao criar novo mês:', err)
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao criar novo mês',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
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
            Inicializar Mês
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
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Gruas</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticas.total_gruas}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{Number(estatisticas.total_horas_trabalhadas || 0).toFixed(0)}h</p>
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
                  <p className="text-2xl font-bold text-gray-900">{Number(estatisticas.eficiencia_media || 0).toFixed(1)}%</p>
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
                    R$ {Number(estatisticas.total_custo || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-500">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={String(obra.id)}>
                      {obra.nome}
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
                  <CardTitle className="text-lg">{gruaMes.grua_name}</CardTitle>
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
                {gruaMes.obra_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>Obra: {gruaMes.obra_name}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Horas Trabalhadas:</span>
                    <p className="font-medium">{Number(gruaMes.horas_trabalhadas).toFixed(0)}h</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Eficiência:</span>
                    <p className="font-medium">{Number(gruaMes.eficiencia).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Custo/Hora:</span>
                    <p className="font-medium">R$ {Number(gruaMes.custo_hora).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Custo Total:</span>
                    <p className="font-medium">R$ {Number(gruaMes.custo_total).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                {gruaMes.responsavel_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Responsável: {gruaMes.responsavel_name}</span>
                  </div>
                )}
                
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
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece inicializando o mês ou criando uma alocação.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setIsNovoMesDialogOpen(true)}>
                <Calendar className="w-4 h-4 mr-2" />
                Inicializar Mês
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
              Inicializar Mês
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
                  {mesesDisponiveis.map(mes => (
                    <SelectItem key={mes} value={mes}>
                      {formatarMes(mes)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Esta ação criará registros mensais para todas as gruas ativas. 
                As gruas começarão com status baseado em suas alocações atuais.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsNovoMesDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Inicializar Mês
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
                  {gruas.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.name} - {grua.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="obraId">Obra (Opcional)</Label>
              <Select
                value={gruaMesFormData.obraId}
                onValueChange={(value) => setGruaMesFormData({ ...gruaMesFormData, obraId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={String(obra.id)}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsavelId">Responsável (Opcional)</Label>
              <Select
                value={gruaMesFormData.responsavelId}
                onValueChange={(value) => setGruaMesFormData({ ...gruaMesFormData, responsavelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {usuarios.filter(user => user.status === 'Ativo').map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.nome}
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
              <Label htmlFor="edit-obraId">Obra</Label>
              <Select
                value={gruaMesFormData.obraId}
                onValueChange={(value) => setGruaMesFormData({ ...gruaMesFormData, obraId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={String(obra.id)}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="none">Nenhum</SelectItem>
                  {usuarios.filter(user => user.status === 'Ativo').map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.nome}
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
              Tem certeza que deseja remover a grua <strong>{gruaMesToDelete?.grua_name}</strong> do mês <strong>{gruaMesToDelete && formatarMes(gruaMesToDelete.mes)}</strong>?
            </p>
            <p className="text-xs text-red-600">
              ⚠️ Esta ação não pode ser desfeita. A grua será removida da alocação mensal.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteGruaMes}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
