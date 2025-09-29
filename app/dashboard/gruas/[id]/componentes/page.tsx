"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit,
  Trash2, 
  Eye,
  Package,
  Settings,
  ArrowLeft,
  RefreshCw,
  Filter,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Tipos para componentes de gruas
interface ComponenteGrua {
  id: string
  grua_id: string
  nome: string
  tipo: string
  quantidade: number
  unidade: string
  valor_unitario: number
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'indisponivel'
  observacoes?: string
  created_at: string
  updated_at: string
}

interface ConfiguracaoGrua {
  id: string
  grua_id: string
  nome: string
  descricao: string
  componentes: Array<{
    componente_id: string
    quantidade: number
  }>
  altura_total: number
  capacidade_total: number
  created_at: string
}

export default function ComponentesGruaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string
  
  // Estados
  const [componentes, setComponentes] = useState<ComponenteGrua[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGrua[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [editingComponente, setEditingComponente] = useState<ComponenteGrua | null>(null)
  const [gruaInfo, setGruaInfo] = useState<any>(null)

  // Formulário para componente
  const [componenteForm, setComponenteForm] = useState({
    nome: '',
    tipo: '',
    quantidade: 0,
    unidade: '',
    valor_unitario: 0,
    observacoes: ''
  })

  // Formulário para configuração
  const [configForm, setConfigForm] = useState({
    nome: '',
    descricao: '',
    altura_total: 0,
    capacidade_total: 0
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [gruaId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de dados (substituir por chamadas reais da API)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados mockados para demonstração
      const mockComponentes: ComponenteGrua[] = [
        {
          id: '1',
          grua_id: gruaId,
          nome: 'Módulo de Torre 3m',
          tipo: 'torre',
          quantidade: 5,
          unidade: 'un',
          valor_unitario: 2500,
          status: 'disponivel',
          observacoes: 'Módulos padrão de 3 metros',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          grua_id: gruaId,
          nome: 'Escada de Acesso 3m',
          tipo: 'escada',
          quantidade: 1,
          unidade: 'un',
          valor_unitario: 1200,
          status: 'disponivel',
          observacoes: 'Escada de acesso padrão',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          grua_id: gruaId,
          nome: 'Lança 40m',
          tipo: 'lanca',
          quantidade: 1,
          unidade: 'un',
          valor_unitario: 15000,
          status: 'em_uso',
          observacoes: 'Lança principal de 40 metros',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const mockConfiguracoes: ConfiguracaoGrua[] = [
        {
          id: '1',
          grua_id: gruaId,
          nome: 'Configuração Padrão',
          descricao: 'Configuração básica para obras pequenas',
          componentes: [
            { componente_id: '1', quantidade: 3 },
            { componente_id: '2', quantidade: 1 }
          ],
          altura_total: 9,
          capacidade_total: 8,
          created_at: new Date().toISOString()
        }
      ]

      setComponentes(mockComponentes)
      setConfiguracoes(mockConfiguracoes)
      setGruaInfo({ id: gruaId, nome: 'Grua STT293', modelo: 'Potain MDT 178' })
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar componentes da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar componentes
  const filteredComponentes = componentes.filter(componente => {
    const matchesSearch = componente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         componente.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || componente.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Handlers
  const handleCreateComponente = async () => {
    try {
      // Simular criação (substituir por chamada real da API)
      const novoComponente: ComponenteGrua = {
        id: Date.now().toString(),
        grua_id: gruaId,
        nome: componenteForm.nome,
        tipo: componenteForm.tipo,
        quantidade: componenteForm.quantidade,
        unidade: componenteForm.unidade,
        valor_unitario: componenteForm.valor_unitario,
        status: 'disponivel',
        observacoes: componenteForm.observacoes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setComponentes([...componentes, novoComponente])
      setIsCreateDialogOpen(false)
      setComponenteForm({
        nome: '',
        tipo: '',
        quantidade: 0,
        unidade: '',
        valor_unitario: 0,
        observacoes: ''
      })

      toast({
        title: "Sucesso",
        description: "Componente adicionado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar componente:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar componente",
        variant: "destructive"
      })
    }
  }

  const handleDeleteComponente = async (id: string) => {
    try {
      setComponentes(componentes.filter(c => c.id !== id))
      toast({
        title: "Sucesso",
        description: "Componente removido com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover componente:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover componente",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-500'
      case 'em_uso': return 'bg-blue-500'
      case 'manutencao': return 'bg-yellow-500'
      case 'indisponivel': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível'
      case 'em_uso': return 'Em Uso'
      case 'manutencao': return 'Manutenção'
      case 'indisponivel': return 'Indisponível'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando componentes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Componentes da Grua
          </h1>
          <p className="text-gray-600">
            {gruaInfo?.nome} - {gruaInfo?.modelo}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsConfigDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Componente
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome ou tipo..."
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
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={carregarDados}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Componentes */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes ({filteredComponentes.length})</CardTitle>
          <CardDescription>
            Lista de todos os componentes desta grua
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredComponentes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum componente encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComponentes.map((componente) => (
                  <TableRow key={componente.id}>
                    <TableCell className="font-medium">
                      {componente.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {componente.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {componente.quantidade} {componente.unidade}
                    </TableCell>
                    <TableCell>
                      R$ {componente.valor_unitario.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(componente.status)}>
                        {getStatusLabel(componente.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingComponente(componente)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Componente</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este componente? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComponente(componente.id)}
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

      {/* Dialog de Criação de Componente */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Componente</DialogTitle>
            <DialogDescription>
              Adicione um novo componente para esta grua
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateComponente(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Componente *</Label>
                <Input
                  id="nome"
                  value={componenteForm.nome}
                  onChange={(e) => setComponenteForm({ ...componenteForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={componenteForm.tipo} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="torre">Torre</SelectItem>
                    <SelectItem value="lanca">Lança</SelectItem>
                    <SelectItem value="escada">Escada</SelectItem>
                    <SelectItem value="contrapeso">Contrapeso</SelectItem>
                    <SelectItem value="cabos">Cabos</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="0"
                  value={componenteForm.quantidade}
                  onChange={(e) => setComponenteForm({ ...componenteForm, quantidade: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <Select 
                  value={componenteForm.unidade} 
                  onValueChange={(value) => setComponenteForm({ ...componenteForm, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade</SelectItem>
                    <SelectItem value="m">Metro</SelectItem>
                    <SelectItem value="kg">Quilograma</SelectItem>
                    <SelectItem value="m²">Metro Quadrado</SelectItem>
                    <SelectItem value="m³">Metro Cúbico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={componenteForm.valor_unitario}
                  onChange={(e) => setComponenteForm({ ...componenteForm, valor_unitario: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={componenteForm.observacoes}
                onChange={(e) => setComponenteForm({ ...componenteForm, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Componente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Configurações */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Configurações da Grua</DialogTitle>
            <DialogDescription>
              Gerencie as configurações disponíveis para esta grua
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="config_nome">Nome da Configuração</Label>
                <Input
                  id="config_nome"
                  value={configForm.nome}
                  onChange={(e) => setConfigForm({ ...configForm, nome: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="config_descricao">Descrição</Label>
                <Input
                  id="config_descricao"
                  value={configForm.descricao}
                  onChange={(e) => setConfigForm({ ...configForm, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="altura_total">Altura Total (m)</Label>
                <Input
                  id="altura_total"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.altura_total}
                  onChange={(e) => setConfigForm({ ...configForm, altura_total: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="capacidade_total">Capacidade Total (t)</Label>
                <Input
                  id="capacidade_total"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.capacidade_total}
                  onChange={(e) => setConfigForm({ ...configForm, capacidade_total: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Componentes da Configuração</h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecione os componentes e suas quantidades para esta configuração
              </p>
              {/* Aqui seria implementada a seleção de componentes */}
              <div className="text-center py-8 text-gray-500">
                Seleção de componentes será implementada aqui
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancelar
              </Button>
              <Button>
                Salvar Configuração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
