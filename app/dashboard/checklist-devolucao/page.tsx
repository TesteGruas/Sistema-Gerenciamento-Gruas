"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Download,
  Printer,
  FileText,
  RefreshCw,
  Filter,
  Building2,
  Wrench,
  ArrowLeft
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Tipos para check-list de devolução
interface ItemDevolucao {
  id: string
  obra_id: string
  grua_id: string
  peca_nome: string
  peca_tipo: string
  quantidade_enviada: number
  quantidade_devolvida: number
  quantidade_faltante: number
  status: 'devolvido' | 'faltando' | 'danificado' | 'pendente'
  observacoes?: string
  data_envio: string
  data_devolucao?: string
  responsavel: string
  created_at: string
  updated_at: string
  obras?: {
    id: string
    nome: string
    cliente_id: string
    clientes?: {
      id: string
      nome: string
    }
  }
  gruas?: {
    id: string
    nome: string
    modelo: string
  }
}

export default function ChecklistDevolucaoPage() {
  const { toast } = useToast()
  
  // Estados
  const [itens, setItens] = useState<ItemDevolucao[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [gruas, setGruas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterObra, setFilterObra] = useState("all")
  const [filterGrua, setFilterGrua] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemDevolucao | null>(null)
  const [resumoDevolucao, setResumoDevolucao] = useState<any>(null)

  // Formulário
  const [itemForm, setItemForm] = useState({
    obra_id: '',
    grua_id: '',
    peca_nome: '',
    peca_tipo: '',
    quantidade_enviada: 0,
    quantidade_devolvida: 0,
    status: 'pendente' as 'devolvido' | 'faltando' | 'danificado' | 'pendente',
    observacoes: '',
    responsavel: ''
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockItens: ItemDevolucao[] = [
        {
          id: '1',
          obra_id: '1',
          grua_id: '1',
          peca_nome: 'Módulo de Torre 3m',
          peca_tipo: 'Estrutural',
          quantidade_enviada: 5,
          quantidade_devolvida: 4,
          quantidade_faltante: 1,
          status: 'faltando',
          observacoes: 'Um módulo não foi devolvido',
          data_envio: '2024-01-15',
          data_devolucao: '2024-01-20',
          responsavel: 'João Silva',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          obras: {
            id: '1',
            nome: 'Obra Jardim das Flores',
            cliente_id: '1',
            clientes: {
              id: '1',
              nome: 'Construtora ABC'
            }
          },
          gruas: {
            id: '1',
            nome: 'Grua 001',
            modelo: 'Liebherr 200HC'
          }
        },
        {
          id: '2',
          obra_id: '1',
          grua_id: '1',
          peca_nome: 'Escada de Acesso',
          peca_tipo: 'Segurança',
          quantidade_enviada: 2,
          quantidade_devolvida: 2,
          quantidade_faltante: 0,
          status: 'devolvido',
          observacoes: 'Todas as peças devolvidas em perfeito estado',
          data_envio: '2024-01-15',
          data_devolucao: '2024-01-20',
          responsavel: 'João Silva',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          obras: {
            id: '1',
            nome: 'Obra Jardim das Flores',
            cliente_id: '1',
            clientes: {
              id: '1',
              nome: 'Construtora ABC'
            }
          },
          gruas: {
            id: '1',
            nome: 'Grua 001',
            modelo: 'Liebherr 200HC'
          }
        }
      ]
      
      const obrasMock = [
        { id: "1", nome: "Obra Jardim das Flores", cliente: "Construtora ABC" },
        { id: "2", nome: "Obra Comercial Centro", cliente: "Empresa XYZ" }
      ]
      
      const gruasMock = [
        { id: "1", nome: "Grua 001", modelo: "Liebherr 200HC" },
        { id: "2", nome: "Grua 002", modelo: "Potain MDT 178" }
      ]
      
      setItens(mockItens)
      setObras(obrasMock)
      setGruas(gruasMock)
      
      // Calcular resumo
      calcularResumoDevolucao(mockItens)
      
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

  const calcularResumoDevolucao = (itensData: ItemDevolucao[]) => {
    const totalItens = itensData.length
    const itensDevolvidos = itensData.filter(item => item.status === 'devolvido').length
    const itensFaltando = itensData.filter(item => item.status === 'faltando').length
    const itensDanificados = itensData.filter(item => item.status === 'danificado').length
    const itensPendentes = itensData.filter(item => item.status === 'pendente').length
    
    setResumoDevolucao({
      totalItens,
      itensDevolvidos,
      itensFaltando,
      itensDanificados,
      itensPendentes,
      percentualCompleto: totalItens > 0 ? (itensDevolvidos / totalItens) * 100 : 0
    })
  }

  // Filtrar itens
  const filteredItens = itens.filter(item => {
    const matchesSearch = item.peca_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.obras?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.gruas?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesObra = filterObra === 'all' || item.obra_id === filterObra
    const matchesGrua = filterGrua === 'all' || item.grua_id === filterGrua
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesObra && matchesGrua && matchesStatus
  })

  // Handlers
  const handleCreateItem = async () => {
    try {
      const novoItem: ItemDevolucao = {
        id: Date.now().toString(),
        obra_id: itemForm.obra_id,
        grua_id: itemForm.grua_id,
        peca_nome: itemForm.peca_nome,
        peca_tipo: itemForm.peca_tipo,
        quantidade_enviada: itemForm.quantidade_enviada,
        quantidade_devolvida: itemForm.quantidade_devolvida,
        quantidade_faltante: itemForm.quantidade_enviada - itemForm.quantidade_devolvida,
        status: itemForm.status,
        observacoes: itemForm.observacoes,
        data_envio: new Date().toISOString().split('T')[0],
        data_devolucao: itemForm.status !== 'pendente' ? new Date().toISOString().split('T')[0] : undefined,
        responsavel: itemForm.responsavel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setItens([...itens, novoItem])
      setIsCreateDialogOpen(false)
      resetForm()
      
      toast({
        title: "Sucesso",
        description: "Item adicionado ao check-list"
      })
    } catch (error) {
      console.error('Erro ao criar item:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar item",
        variant: "destructive"
      })
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    
    try {
      const itemAtualizado = {
        ...editingItem,
        quantidade_devolvida: itemForm.quantidade_devolvida,
        quantidade_faltante: itemForm.quantidade_enviada - itemForm.quantidade_devolvida,
        status: itemForm.status,
        observacoes: itemForm.observacoes,
        data_devolucao: itemForm.status !== 'pendente' ? new Date().toISOString().split('T')[0] : undefined,
        updated_at: new Date().toISOString()
      }

      setItens(itens.map(item => item.id === editingItem.id ? itemAtualizado : item))
      setIsEditDialogOpen(false)
      setEditingItem(null)
      resetForm()
      
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar item",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      setItens(itens.filter(item => item.id !== id))
      toast({
        title: "Sucesso",
        description: "Item removido com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setItemForm({
      obra_id: '',
      grua_id: '',
      peca_nome: '',
      peca_tipo: '',
      quantidade_enviada: 0,
      quantidade_devolvida: 0,
      status: 'pendente',
      observacoes: '',
      responsavel: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'devolvido': return 'bg-green-500'
      case 'faltando': return 'bg-red-500'
      case 'danificado': return 'bg-orange-500'
      case 'pendente': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'devolvido': return <CheckCircle className="w-4 h-4" />
      case 'faltando': return <XCircle className="w-4 h-4" />
      case 'danificado': return <AlertTriangle className="w-4 h-4" />
      case 'pendente': return <Package className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'devolvido': return 'Devolvido'
      case 'faltando': return 'Faltando'
      case 'danificado': return 'Danificado'
      case 'pendente': return 'Pendente'
      default: return status
    }
  }

  const gerarRelatorio = () => {
    // Simular geração de relatório
    toast({
      title: "Relatório Gerado",
      description: "Relatório de devolução gerado com sucesso"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando check-list...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-list de Devolução</h1>
          <p className="text-gray-600">Controle de devolução de peças por obra e grua</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={gerarRelatorio}>
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Resumo */}
      {resumoDevolucao && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total de Itens</p>
                  <p className="text-2xl font-bold">{resumoDevolucao.totalItens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Devolvidos</p>
                  <p className="text-2xl font-bold text-green-600">{resumoDevolucao.itensDevolvidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Faltando</p>
                  <p className="text-2xl font-bold text-red-600">{resumoDevolucao.itensFaltando}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Danificados</p>
                  <p className="text-2xl font-bold text-orange-600">{resumoDevolucao.itensDanificados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{resumoDevolucao.itensPendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por peça, obra ou grua..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="obra">Obra</Label>
              <Select value={filterObra} onValueChange={setFilterObra}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grua">Grua</Label>
              <Select value={filterGrua} onValueChange={setFilterGrua}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as gruas</SelectItem>
                  {gruas.map(grua => (
                    <SelectItem key={grua.id} value={grua.id}>
                      {grua.nome} - {grua.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="devolvido">Devolvido</SelectItem>
                  <SelectItem value="faltando">Faltando</SelectItem>
                  <SelectItem value="danificado">Danificado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens de Devolução ({filteredItens.length})</CardTitle>
          <CardDescription>Lista de todos os itens para conferência de devolução</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItens.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum item encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peça</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Grua</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Devolvido</TableHead>
                  <TableHead>Faltante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.peca_nome}</div>
                        <div className="text-sm text-gray-500">{item.peca_tipo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.obras?.nome}</div>
                        <div className="text-sm text-gray-500">{item.obras?.clientes?.nome}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.gruas?.nome}</div>
                        <div className="text-sm text-gray-500">{item.gruas?.modelo}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {item.quantidade_enviada}
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-600">
                      {item.quantidade_devolvida}
                    </TableCell>
                    <TableCell className="text-center font-bold text-red-600">
                      {item.quantidade_faltante}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {getStatusLabel(item.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{item.responsavel}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item)
                            setItemForm({
                              obra_id: item.obra_id,
                              grua_id: item.grua_id,
                              peca_nome: item.peca_nome,
                              peca_tipo: item.peca_tipo,
                              quantidade_enviada: item.quantidade_enviada,
                              quantidade_devolvida: item.quantidade_devolvida,
                              status: item.status,
                              observacoes: item.observacoes || '',
                              responsavel: item.responsavel
                            })
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover este item do check-list?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
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

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Item de Devolução</DialogTitle>
            <DialogDescription>
              Adicione um novo item ao check-list de devolução
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateItem(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="obra_id">Obra *</Label>
                <Select value={itemForm.obra_id} onValueChange={(value) => setItemForm({...itemForm, obra_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map(obra => (
                      <SelectItem key={obra.id} value={obra.id}>
                        {obra.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="grua_id">Grua *</Label>
                <Select value={itemForm.grua_id} onValueChange={(value) => setItemForm({...itemForm, grua_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a grua" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruas.map(grua => (
                      <SelectItem key={grua.id} value={grua.id}>
                        {grua.nome} - {grua.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="peca_nome">Nome da Peça *</Label>
                <Input
                  id="peca_nome"
                  value={itemForm.peca_nome}
                  onChange={(e) => setItemForm({...itemForm, peca_nome: e.target.value})}
                  placeholder="Ex: Módulo de Torre 3m"
                  required
                />
              </div>
              <div>
                <Label htmlFor="peca_tipo">Tipo da Peça *</Label>
                <Select value={itemForm.peca_tipo} onValueChange={(value) => setItemForm({...itemForm, peca_tipo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estrutural">Estrutural</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Elétrica">Elétrica</SelectItem>
                    <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidade_enviada">Quantidade Enviada *</Label>
                <Input
                  id="quantidade_enviada"
                  type="number"
                  min="0"
                  value={itemForm.quantidade_enviada}
                  onChange={(e) => setItemForm({...itemForm, quantidade_enviada: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade_devolvida">Quantidade Devolvida</Label>
                <Input
                  id="quantidade_devolvida"
                  type="number"
                  min="0"
                  value={itemForm.quantidade_devolvida}
                  onChange={(e) => setItemForm({...itemForm, quantidade_devolvida: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={itemForm.status} onValueChange={(value: any) => setItemForm({...itemForm, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="devolvido">Devolvido</SelectItem>
                    <SelectItem value="faltando">Faltando</SelectItem>
                    <SelectItem value="danificado">Danificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="responsavel">Responsável *</Label>
              <Input
                id="responsavel"
                value={itemForm.responsavel}
                onChange={(e) => setItemForm({...itemForm, responsavel: e.target.value})}
                placeholder="Nome do responsável"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={itemForm.observacoes}
                onChange={(e) => setItemForm({...itemForm, observacoes: e.target.value})}
                placeholder="Observações sobre a devolução"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Item de Devolução</DialogTitle>
            <DialogDescription>
              Atualize as informações do item de devolução
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateItem(); }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_quantidade_devolvida">Quantidade Devolvida</Label>
                <Input
                  id="edit_quantidade_devolvida"
                  type="number"
                  min="0"
                  value={itemForm.quantidade_devolvida}
                  onChange={(e) => setItemForm({...itemForm, quantidade_devolvida: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select value={itemForm.status} onValueChange={(value: any) => setItemForm({...itemForm, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="devolvido">Devolvido</SelectItem>
                    <SelectItem value="faltando">Faltando</SelectItem>
                    <SelectItem value="danificado">Danificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_responsavel">Responsável</Label>
                <Input
                  id="edit_responsavel"
                  value={itemForm.responsavel}
                  onChange={(e) => setItemForm({...itemForm, responsavel: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Input
                id="edit_observacoes"
                value={itemForm.observacoes}
                onChange={(e) => setItemForm({...itemForm, observacoes: e.target.value})}
                placeholder="Observações sobre a devolução"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
