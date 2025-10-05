"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Settings,
  ArrowLeft,
  RefreshCw,
  Calculator,
  Package,
  Ruler
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiConfiguracoes, ConfiguracaoGrua } from "@/lib/api-configuracoes"
import { apiComponentes, ComponenteGrua } from "@/lib/api-componentes"
import apiGruas from "@/lib/api-gruas"

export default function ConfiguracoesGruaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string
  
  // Estados
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGrua[]>([])
  const [componentesDisponiveis, setComponentesDisponiveis] = useState<ComponenteGrua[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfiguracaoGrua | null>(null)
  const [gruaInfo, setGruaInfo] = useState<any>(null)

  // Formulário para configuração
  const [configForm, setConfigForm] = useState({
    nome: '',
    descricao: '',
    altura_maxima: 0,
    capacidade_maxima: 0,
    valor_configuracao: 0,
    status: 'Ativa' as 'Ativa' | 'Inativa' | 'Em desenvolvimento',
    componentes_selecionados: [] as Array<{
      componente_id: number
      quantidade: number
    }>
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [gruaId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar informações da grua
      const gruaResponse = await apiGruas.obterGrua(gruaId)
      setGruaInfo(gruaResponse.data)
      
      // Carregar configurações da grua
      const configuracoesResponse = await apiConfiguracoes.buscarPorGrua(gruaId, {
        page: 1,
        limit: 100
      })
      setConfiguracoes(configuracoesResponse.data)
      
      // Carregar componentes disponíveis da grua
      const componentesResponse = await apiComponentes.buscarPorGrua(gruaId, {
        page: 1,
        limit: 10
      })
      console.log('Componentes carregados:', componentesResponse.data)
      setComponentesDisponiveis(componentesResponse.data)
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar configurações da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar configurações
  const filteredConfiguracoes = configuracoes.filter(config => 
    config.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (config.descricao && config.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Handlers
  const handleCreateConfig = async () => {
    try {
      // Criar configuração
      const response = await apiConfiguracoes.criar({
        grua_id: gruaId,
        nome: configForm.nome,
        descricao: configForm.descricao,
        altura_maxima: configForm.altura_maxima,
        capacidade_maxima: configForm.capacidade_maxima,
        valor_configuracao: configForm.valor_configuracao,
        status: configForm.status
      })

      // Adicionar componentes à configuração
      for (const comp of configForm.componentes_selecionados) {
        await apiConfiguracoes.adicionarComponente(response.data.id, {
          configuracao_id: response.data.id,
          componente_id: comp.componente_id,
          quantidade_necessaria: comp.quantidade
        })
      }

      setIsCreateDialogOpen(false)
      resetForm()
      
      // Recarregar dados
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Configuração criada com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao criar configuração:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar configuração",
        variant: "destructive"
      })
    }
  }

  const handleUpdateConfig = async () => {
    if (!editingConfig) return

    try {
      // Atualizar configuração
      const response = await apiConfiguracoes.atualizar(editingConfig.id, {
        nome: configForm.nome,
        descricao: configForm.descricao,
        altura_maxima: configForm.altura_maxima,
        capacidade_maxima: configForm.capacidade_maxima,
        valor_configuracao: configForm.valor_configuracao,
        status: configForm.status
      })

      // Remover componentes existentes e adicionar novos
      if (editingConfig.componentes) {
        for (const comp of editingConfig.componentes) {
          await apiConfiguracoes.removerComponente(editingConfig.id, comp.componente.id)
        }
      }

      // Adicionar novos componentes
      for (const comp of configForm.componentes_selecionados) {
        await apiConfiguracoes.adicionarComponente(editingConfig.id, {
          configuracao_id: editingConfig.id,
          componente_id: comp.componente_id,
          quantidade_necessaria: comp.quantidade
        })
      }

      setIsEditDialogOpen(false)
      setEditingConfig(null)
      resetForm()
      
      // Recarregar dados
      await carregarDados()

      toast({
        title: "Sucesso",
        description: response.message || "Configuração atualizada com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar configuração",
        variant: "destructive"
      })
    }
  }

  const handleDeleteConfig = async (id: number) => {
    try {
      const response = await apiConfiguracoes.excluir(id)
      
      // Recarregar dados
      await carregarDados()
      
      toast({
        title: "Sucesso",
        description: response.message || "Configuração removida com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao remover configuração:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao remover configuração",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setConfigForm({
      nome: '',
      descricao: '',
      altura_maxima: 0,
      capacidade_maxima: 0,
      valor_configuracao: 0,
      status: 'Ativa',
      componentes_selecionados: []
    })
  }

  const toggleComponente = (componenteId: number) => {
    const existe = configForm.componentes_selecionados.find(c => c.componente_id === componenteId)
    if (existe) {
      setConfigForm({
        ...configForm,
        componentes_selecionados: configForm.componentes_selecionados.filter(c => c.componente_id !== componenteId)
      })
    } else {
      setConfigForm({
        ...configForm,
        componentes_selecionados: [...configForm.componentes_selecionados, { componente_id: componenteId, quantidade: 1 }]
      })
    }
  }

  const updateComponenteQuantidade = (componenteId: number, quantidade: number) => {
    setConfigForm({
      ...configForm,
      componentes_selecionados: configForm.componentes_selecionados.map(c => 
        c.componente_id === componenteId ? { ...c, quantidade } : c
      )
    })
  }

  const openEditDialog = (config: ConfiguracaoGrua) => {
    setEditingConfig(config)
    setConfigForm({
      nome: config.nome,
      descricao: config.descricao || '',
      altura_maxima: config.altura_maxima || 0,
      capacidade_maxima: config.capacidade_maxima || 0,
      valor_configuracao: config.valor_configuracao,
      status: config.status,
      componentes_selecionados: config.componentes?.map(comp => ({
        componente_id: comp.componente.id,
        quantidade: comp.quantidade_necessaria
      })) || []
    })
    setIsEditDialogOpen(true)
  }

  const calcularValorTotal = () => {
    const valorComponentes = configForm.componentes_selecionados.reduce((total, comp) => {
      const componente = componentesDisponiveis.find(c => c.id === comp.componente_id)
      return total + (componente ? componente.valor_unitario * comp.quantidade : 0)
    }, 0)
    return valorComponentes + configForm.valor_configuracao
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
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
            Configurações da Grua
          </h1>
          <p className="text-gray-600">
            {gruaInfo?.nome} - {gruaInfo?.modelo}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Configuração
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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

      {/* Lista de Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConfiguracoes.map((config) => (
          <Card key={config.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{config.nome}</CardTitle>
                  <CardDescription>{config.descricao}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingConfig(config)
                      setIsViewDialogOpen(true)
                    }}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditDialog(config)}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Configuração</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a configuração "{config.nome}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteConfig(config.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Altura:</span>
                    <span>{config.altura_maxima || 0}m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Capacidade:</span>
                    <span>{config.capacidade_maxima || 0}t</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Valor:</span>
                  <span className="font-bold text-lg">R$ {config.valor_configuracao.toLocaleString('pt-BR')}</span>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Componentes:</h4>
                  <div className="space-y-1">
                    {config.componentes?.map((comp, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600">
                        <span>{comp.componente.nome}</span>
                        <span>{comp.quantidade_necessaria} {comp.componente.unidade_medida || 'un'}</span>
                      </div>
                    )) || <span className="text-xs text-gray-500">Nenhum componente</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConfiguracoes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhuma configuração encontrada</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criação de Configuração */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Configuração</DialogTitle>
            <DialogDescription>
              Crie uma nova configuração para esta grua
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Configuração *</Label>
                <Input
                  id="nome"
                  value={configForm.nome}
                  onChange={(e) => setConfigForm({ ...configForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={configForm.descricao}
                  onChange={(e) => setConfigForm({ ...configForm, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="altura_maxima">Altura Máxima (m)</Label>
                <Input
                  id="altura_maxima"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.altura_maxima}
                  onChange={(e) => setConfigForm({ ...configForm, altura_maxima: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="capacidade_maxima">Capacidade Máxima (t)</Label>
                <Input
                  id="capacidade_maxima"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.capacidade_maxima}
                  onChange={(e) => setConfigForm({ ...configForm, capacidade_maxima: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="valor_configuracao">Valor da Configuração (R$)</Label>
                <Input
                  id="valor_configuracao"
                  type="number"
                  step="0.01"
                  min="0"
                  value={configForm.valor_configuracao}
                  onChange={(e) => setConfigForm({ ...configForm, valor_configuracao: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={configForm.status} 
                onValueChange={(value) => setConfigForm({ ...configForm, status: value as 'Ativa' | 'Inativa' | 'Em desenvolvimento' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Inativa">Inativa</SelectItem>
                  <SelectItem value="Em desenvolvimento">Em desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Selecionar Componentes 
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({componentesDisponiveis.length} disponível{componentesDisponiveis.length !== 1 ? 'is' : ''})
                </span>
              </h3>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p>Carregando componentes...</p>
                </div>
              ) : componentesDisponiveis.length > 0 ? (
                <div className="space-y-3">
                  {componentesDisponiveis.map((componente) => {
                    const selecionado = configForm.componentes_selecionados.find(c => c.componente_id === componente.id)
                    return (
                      <div key={componente.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          checked={!!selecionado}
                          onCheckedChange={() => toggleComponente(componente.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{componente.nome}</div>
                          <div className="text-sm text-gray-500">
                            {componente.quantidade_disponivel} {componente.unidade_medida || 'un'} disponível(is) • 
                            R$ {componente.valor_unitario.toLocaleString('pt-BR')} cada
                          </div>
                        </div>
                        {selecionado && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${componente.id}`} className="text-sm">Qtd:</Label>
                            <Input
                              id={`qty-${componente.id}`}
                              type="number"
                              min="1"
                              max={componente.quantidade_disponivel}
                              value={selecionado.quantidade}
                              onChange={(e) => updateComponenteQuantidade(componente.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum componente disponível para esta grua</p>
                  <p className="text-sm">Adicione componentes na aba "Componentes" primeiro</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Total da Configuração:</span>
                  <span className="text-xl font-bold text-green-600">
                    R$ {calcularValorTotal().toLocaleString('pt-BR')}
                  </span>
                </div>
                {configForm.componentes_selecionados.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Valor da Configuração:</span>
                      <span>R$ {configForm.valor_configuracao.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor dos Componentes:</span>
                      <span>R$ {(calcularValorTotal() - configForm.valor_configuracao).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateConfig}>
                Criar Configuração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Configuração */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Configuração</DialogTitle>
            <DialogDescription>
              Informações completas da configuração: {editingConfig?.nome}
            </DialogDescription>
          </DialogHeader>
          
          {editingConfig && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
                  <div className="space-y-2">
                    <div><strong>Nome:</strong> {editingConfig.nome}</div>
                    <div><strong>Descrição:</strong> {editingConfig.descricao || 'Não informado'}</div>
                    <div><strong>Status:</strong> <Badge variant="outline">{editingConfig.status}</Badge></div>
                    <div><strong>Altura Máxima:</strong> {editingConfig.altura_maxima || 0}m</div>
                    <div><strong>Capacidade Máxima:</strong> {editingConfig.capacidade_maxima || 0}t</div>
                    <div><strong>Valor:</strong> R$ {editingConfig.valor_configuracao.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações Técnicas</h3>
                  <div className="space-y-2">
                    {editingConfig.alcance_maximo && <div><strong>Alcance Máximo:</strong> {editingConfig.alcance_maximo}m</div>}
                    {editingConfig.capacidade_ponta && <div><strong>Capacidade na Ponta:</strong> {editingConfig.capacidade_ponta}t</div>}
                    {editingConfig.velocidade_operacao && <div><strong>Velocidade de Operação:</strong> {editingConfig.velocidade_operacao}m/min</div>}
                    {editingConfig.velocidade_rotacao && <div><strong>Velocidade de Rotação:</strong> {editingConfig.velocidade_rotacao}rpm</div>}
                    {editingConfig.potencia_motor && <div><strong>Potência do Motor:</strong> {editingConfig.potencia_motor}kW</div>}
                    {editingConfig.peso_total && <div><strong>Peso Total:</strong> {editingConfig.peso_total}t</div>}
                  </div>
                </div>
              </div>

              {/* Componentes */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Componentes da Configuração</h3>
                {editingConfig.componentes && editingConfig.componentes.length > 0 ? (
                  <div className="space-y-2">
                    {editingConfig.componentes.map((comp, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{comp.componente.nome}</div>
                          <div className="text-sm text-gray-500">
                            {comp.componente.tipo} • {comp.componente.modelo || 'Sem modelo'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{comp.quantidade_necessaria} {comp.componente.unidade_medida || 'un'}</div>
                          <div className="text-sm text-gray-500">
                            R$ {(comp.componente.valor_unitario * comp.quantidade_necessaria).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum componente associado a esta configuração
                  </div>
                )}
              </div>

              {/* Informações do Sistema */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Criado em:</strong> {new Date(editingConfig.created_at).toLocaleString('pt-BR')}</div>
                  <div><strong>Atualizado em:</strong> {new Date(editingConfig.updated_at).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              setIsEditDialogOpen(true)
            }}>
              Editar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Configuração */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuração</DialogTitle>
            <DialogDescription>
              Edite as informações da configuração: {editingConfig?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_nome">Nome da Configuração *</Label>
                <Input
                  id="edit_nome"
                  value={configForm.nome}
                  onChange={(e) => setConfigForm({ ...configForm, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_descricao">Descrição</Label>
                <Input
                  id="edit_descricao"
                  value={configForm.descricao}
                  onChange={(e) => setConfigForm({ ...configForm, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_altura_maxima">Altura Máxima (m)</Label>
                <Input
                  id="edit_altura_maxima"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.altura_maxima}
                  onChange={(e) => setConfigForm({ ...configForm, altura_maxima: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_capacidade_maxima">Capacidade Máxima (t)</Label>
                <Input
                  id="edit_capacidade_maxima"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.capacidade_maxima}
                  onChange={(e) => setConfigForm({ ...configForm, capacidade_maxima: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_valor_configuracao">Valor da Configuração (R$)</Label>
                <Input
                  id="edit_valor_configuracao"
                  type="number"
                  step="0.01"
                  min="0"
                  value={configForm.valor_configuracao}
                  onChange={(e) => setConfigForm({ ...configForm, valor_configuracao: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select 
                value={configForm.status} 
                onValueChange={(value) => setConfigForm({ ...configForm, status: value as 'Ativa' | 'Inativa' | 'Em desenvolvimento' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Inativa">Inativa</SelectItem>
                  <SelectItem value="Em desenvolvimento">Em desenvolvimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Selecionar Componentes 
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({componentesDisponiveis.length} disponível{componentesDisponiveis.length !== 1 ? 'is' : ''})
                </span>
              </h3>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p>Carregando componentes...</p>
                </div>
              ) : componentesDisponiveis.length > 0 ? (
                <div className="space-y-3">
                  {componentesDisponiveis.map((componente) => {
                    const selecionado = configForm.componentes_selecionados.find(c => c.componente_id === componente.id)
                    return (
                      <div key={componente.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          checked={!!selecionado}
                          onCheckedChange={() => toggleComponente(componente.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{componente.nome}</div>
                          <div className="text-sm text-gray-500">
                            {componente.quantidade_disponivel} {componente.unidade_medida || 'un'} disponível(is) • 
                            R$ {componente.valor_unitario.toLocaleString('pt-BR')} cada
                          </div>
                        </div>
                        {selecionado && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`edit_qty-${componente.id}`} className="text-sm">Qtd:</Label>
                            <Input
                              id={`edit_qty-${componente.id}`}
                              type="number"
                              min="1"
                              max={componente.quantidade_disponivel}
                              value={selecionado.quantidade}
                              onChange={(e) => updateComponenteQuantidade(componente.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum componente disponível para esta grua</p>
                  <p className="text-sm">Adicione componentes na aba "Componentes" primeiro</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Total da Configuração:</span>
                  <span className="text-xl font-bold text-green-600">
                    R$ {calcularValorTotal().toLocaleString('pt-BR')}
                  </span>
                </div>
                {configForm.componentes_selecionados.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Valor da Configuração:</span>
                      <span>R$ {configForm.valor_configuracao.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor dos Componentes:</span>
                      <span>R$ {(calcularValorTotal() - configForm.valor_configuracao).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateConfig}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
