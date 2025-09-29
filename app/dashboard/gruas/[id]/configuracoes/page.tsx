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

// Tipos para configurações de gruas
interface ConfiguracaoGrua {
  id: string
  grua_id: string
  nome: string
  descricao: string
  componentes: Array<{
    componente_id: string
    componente_nome: string
    quantidade: number
    unidade: string
  }>
  altura_total: number
  capacidade_total: number
  valor_total: number
  created_at: string
  updated_at: string
}

interface ComponenteDisponivel {
  id: string
  nome: string
  tipo: string
  quantidade_disponivel: number
  unidade: string
  valor_unitario: number
}

export default function ConfiguracoesGruaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string
  
  // Estados
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGrua[]>([])
  const [componentesDisponiveis, setComponentesDisponiveis] = useState<ComponenteDisponivel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfiguracaoGrua | null>(null)
  const [gruaInfo, setGruaInfo] = useState<any>(null)

  // Formulário para configuração
  const [configForm, setConfigForm] = useState({
    nome: '',
    descricao: '',
    altura_total: 0,
    capacidade_total: 0,
    componentes_selecionados: [] as Array<{
      componente_id: string
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
      
      // Simular carregamento de dados (substituir por chamadas reais da API)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados mockados para demonstração
      const mockConfiguracoes: ConfiguracaoGrua[] = [
        {
          id: '1',
          grua_id: gruaId,
          nome: 'Configuração Padrão',
          descricao: 'Configuração básica para obras pequenas',
          componentes: [
            { componente_id: '1', componente_nome: 'Módulo de Torre 3m', quantidade: 3, unidade: 'un' },
            { componente_id: '2', componente_nome: 'Escada de Acesso 3m', quantidade: 1, unidade: 'un' }
          ],
          altura_total: 9,
          capacidade_total: 8,
          valor_total: 8700,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          grua_id: gruaId,
          nome: 'Configuração Alta',
          descricao: 'Configuração para obras de grande altura',
          componentes: [
            { componente_id: '1', componente_nome: 'Módulo de Torre 3m', quantidade: 5, unidade: 'un' },
            { componente_id: '3', componente_nome: 'Lança 40m', quantidade: 1, unidade: 'un' }
          ],
          altura_total: 15,
          capacidade_total: 6,
          valor_total: 27500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      const mockComponentes: ComponenteDisponivel[] = [
        {
          id: '1',
          nome: 'Módulo de Torre 3m',
          tipo: 'torre',
          quantidade_disponivel: 5,
          unidade: 'un',
          valor_unitario: 2500
        },
        {
          id: '2',
          nome: 'Escada de Acesso 3m',
          tipo: 'escada',
          quantidade_disponivel: 1,
          unidade: 'un',
          valor_unitario: 1200
        },
        {
          id: '3',
          nome: 'Lança 40m',
          tipo: 'lanca',
          quantidade_disponivel: 1,
          unidade: 'un',
          valor_unitario: 15000
        }
      ]

      setConfiguracoes(mockConfiguracoes)
      setComponentesDisponiveis(mockComponentes)
      setGruaInfo({ id: gruaId, nome: 'Grua STT293', modelo: 'Potain MDT 178' })
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações da grua",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar configurações
  const filteredConfiguracoes = configuracoes.filter(config => 
    config.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handlers
  const handleCreateConfig = async () => {
    try {
      // Calcular valor total
      const valorTotal = configForm.componentes_selecionados.reduce((total, comp) => {
        const componente = componentesDisponiveis.find(c => c.id === comp.componente_id)
        return total + (componente ? componente.valor_unitario * comp.quantidade : 0)
      }, 0)

      const novaConfiguracao: ConfiguracaoGrua = {
        id: Date.now().toString(),
        grua_id: gruaId,
        nome: configForm.nome,
        descricao: configForm.descricao,
        componentes: configForm.componentes_selecionados.map(comp => {
          const componente = componentesDisponiveis.find(c => c.id === comp.componente_id)
          return {
            componente_id: comp.componente_id,
            componente_nome: componente?.nome || '',
            quantidade: comp.quantidade,
            unidade: componente?.unidade || ''
          }
        }),
        altura_total: configForm.altura_total,
        capacidade_total: configForm.capacidade_total,
        valor_total: valorTotal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setConfiguracoes([...configuracoes, novaConfiguracao])
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Sucesso",
        description: "Configuração criada com sucesso"
      })
    } catch (error) {
      console.error('Erro ao criar configuração:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar configuração",
        variant: "destructive"
      })
    }
  }

  const handleDeleteConfig = async (id: string) => {
    try {
      setConfiguracoes(configuracoes.filter(c => c.id !== id))
      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover configuração:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover configuração",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setConfigForm({
      nome: '',
      descricao: '',
      altura_total: 0,
      capacidade_total: 0,
      componentes_selecionados: []
    })
  }

  const toggleComponente = (componenteId: string) => {
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

  const updateComponenteQuantidade = (componenteId: string, quantidade: number) => {
    setConfigForm({
      ...configForm,
      componentes_selecionados: configForm.componentes_selecionados.map(c => 
        c.componente_id === componenteId ? { ...c, quantidade } : c
      )
    })
  }

  const calcularValorTotal = () => {
    return configForm.componentes_selecionados.reduce((total, comp) => {
      const componente = componentesDisponiveis.find(c => c.id === comp.componente_id)
      return total + (componente ? componente.valor_unitario * comp.quantidade : 0)
    }, 0)
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
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingConfig(config)
                      setIsEditDialogOpen(true)
                    }}
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
                        <AlertDialogTitle>Excluir Configuração</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta configuração? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteConfig(config.id)}
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
                    <span>{config.altura_total}m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Capacidade:</span>
                    <span>{config.capacidade_total}t</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Valor Total:</span>
                  <span className="font-bold text-lg">R$ {config.valor_total.toLocaleString('pt-BR')}</span>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Componentes:</h4>
                  <div className="space-y-1">
                    {config.componentes.map((comp, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600">
                        <span>{comp.componente_nome}</span>
                        <span>{comp.quantidade} {comp.unidade}</span>
                      </div>
                    ))}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="altura_total">Altura Total (m) *</Label>
                <Input
                  id="altura_total"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.altura_total}
                  onChange={(e) => setConfigForm({ ...configForm, altura_total: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacidade_total">Capacidade Total (t) *</Label>
                <Input
                  id="capacidade_total"
                  type="number"
                  step="0.1"
                  min="0"
                  value={configForm.capacidade_total}
                  onChange={(e) => setConfigForm({ ...configForm, capacidade_total: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Selecionar Componentes</h3>
              <div className="space-y-3">
                {componentesDisponiveis.map((componente) => {
                  const selecionado = configForm.componentes_selecionados.find(c => c.componente_id === componente.id)
                  return (
                    <div key={componente.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <Checkbox
                        checked={!!selecionado}
                        onCheckedChange={() => toggleComponente(componente.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{componente.nome}</div>
                        <div className="text-sm text-gray-500">
                          {componente.quantidade_disponivel} {componente.unidade} disponível(is) • 
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
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Total da Configuração:</span>
                <span className="text-xl font-bold text-green-600">
                  R$ {calcularValorTotal().toLocaleString('pt-BR')}
                </span>
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
    </div>
  )
}
