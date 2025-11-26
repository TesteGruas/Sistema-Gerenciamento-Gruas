"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Eye,
  Settings,
  ArrowLeft,
  RefreshCw,
  Calculator,
  Package,
  Ruler,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiConfiguracoes, ConfiguracaoGrua } from "@/lib/api-configuracoes"
import { gruasApi } from "@/lib/api-gruas"

export default function ConfiguracoesGruaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gruaId = params.id as string
  
  // Estados
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGrua[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ConfiguracaoGrua | null>(null)
  const [gruaInfo, setGruaInfo] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Formulário de criação
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    altura_maxima: "",
    alcance_maximo: "",
    capacidade_maxima: "",
    capacidade_ponta: "",
    velocidade_operacao: "",
    velocidade_rotacao: "",
    potencia_motor: "",
    consumo_energia: "",
    peso_total: "",
    dimensoes: "",
    tipo_operacao: "" as "Manual" | "Semi-automática" | "Automática" | "",
    nivel_automatizacao: "" as "Básico" | "Intermediário" | "Avançado" | "Total" | "",
    valor_configuracao: "",
    custo_operacao_mensal: "",
    eficiencia_energetica: "" as "A" | "B" | "C" | "D" | "E" | "",
    status: "Ativa" as "Ativa" | "Inativa" | "Em desenvolvimento",
    observacoes: ""
  })

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [gruaId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar informações da grua
      const gruaResponse = await gruasApi.obterGrua(gruaId)
      setGruaInfo(gruaResponse.data)
      
      // Carregar configurações da grua
      const configuracoesResponse = await apiConfiguracoes.buscarPorGrua(gruaId, {
        page: 1,
        limit: 100
      })
      setConfiguracoes(configuracoesResponse.data)
      
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

  // Handler para criar nova especificação técnica
  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome da especificação técnica é obrigatório",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      const dadosParaEnviar: any = {
        grua_id: gruaId,
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        status: formData.status,
        valor_configuracao: formData.valor_configuracao ? parseFloat(formData.valor_configuracao) : 0,
        custo_operacao_mensal: formData.custo_operacao_mensal ? parseFloat(formData.custo_operacao_mensal) : 0,
        observacoes: formData.observacoes || undefined
      }

      // Adicionar campos numéricos opcionais
      if (formData.altura_maxima) dadosParaEnviar.altura_maxima = parseFloat(formData.altura_maxima)
      if (formData.alcance_maximo) dadosParaEnviar.alcance_maximo = parseFloat(formData.alcance_maximo)
      if (formData.capacidade_maxima) dadosParaEnviar.capacidade_maxima = parseFloat(formData.capacidade_maxima)
      if (formData.capacidade_ponta) dadosParaEnviar.capacidade_ponta = parseFloat(formData.capacidade_ponta)
      if (formData.velocidade_operacao) dadosParaEnviar.velocidade_operacao = parseFloat(formData.velocidade_operacao)
      if (formData.velocidade_rotacao) dadosParaEnviar.velocidade_rotacao = parseFloat(formData.velocidade_rotacao)
      if (formData.potencia_motor) dadosParaEnviar.potencia_motor = parseFloat(formData.potencia_motor)
      if (formData.consumo_energia) dadosParaEnviar.consumo_energia = parseFloat(formData.consumo_energia)
      if (formData.peso_total) dadosParaEnviar.peso_total = parseFloat(formData.peso_total)
      if (formData.dimensoes) dadosParaEnviar.dimensoes = formData.dimensoes
      if (formData.tipo_operacao) dadosParaEnviar.tipo_operacao = formData.tipo_operacao
      if (formData.nivel_automatizacao) dadosParaEnviar.nivel_automatizacao = formData.nivel_automatizacao
      if (formData.eficiencia_energetica) dadosParaEnviar.eficiencia_energetica = formData.eficiencia_energetica

      const response = await apiConfiguracoes.criar(dadosParaEnviar)
      
      toast({
        title: "Sucesso",
        description: response.message || "Especificação técnica criada com sucesso",
        variant: "default"
      })

      // Limpar formulário e fechar dialog
      setFormData({
        nome: "",
        descricao: "",
        altura_maxima: "",
        alcance_maximo: "",
        capacidade_maxima: "",
        capacidade_ponta: "",
        velocidade_operacao: "",
        velocidade_rotacao: "",
        potencia_motor: "",
        consumo_energia: "",
        peso_total: "",
        dimensoes: "",
        tipo_operacao: "",
        nivel_automatizacao: "",
        valor_configuracao: "",
        custo_operacao_mensal: "",
        eficiencia_energetica: "",
        status: "Ativa",
        observacoes: ""
      })
      setIsCreateDialogOpen(false)
      
      // Recarregar dados
      await carregarDados()
      
    } catch (error: any) {
      console.error('Erro ao criar especificação técnica:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar especificação técnica",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando especificações técnicas...</span>
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
            Especificações Técnicas
          </h1>
          <p className="text-gray-600">
            {gruaInfo?.nome} - {gruaInfo?.modelo}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie as especificações técnicas da grua
          </p>
        </div>
        <div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Especificação Técnica
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
                placeholder="Buscar por nome ou descrição das especificações técnicas..."
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
            <p className="text-gray-500">Nenhuma especificação técnica encontrada</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Visualização de Especificações Técnicas */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Especificações Técnicas</DialogTitle>
            <DialogDescription>
              Informações completas das especificações técnicas: {editingConfig?.nome}
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
                <h3 className="text-lg font-semibold mb-3">Componentes das Especificações Técnicas</h3>
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
                    Nenhum componente associado a estas especificações técnicas
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de Especificação Técnica */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Nova Especificação Técnica
            </DialogTitle>
            <DialogDescription>
              Adicione uma nova especificação técnica para {gruaInfo?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateConfig} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Configuração Padrão"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Ativa" | "Inativa" | "Em desenvolvimento") => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativa">Ativa</SelectItem>
                      <SelectItem value="Inativa">Inativa</SelectItem>
                      <SelectItem value="Em desenvolvimento">Em desenvolvimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da especificação técnica..."
                  rows={3}
                />
              </div>
            </div>

            {/* Especificações Técnicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Especificações Técnicas</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="altura_maxima">Altura Máxima (m)</Label>
                  <Input
                    id="altura_maxima"
                    type="number"
                    step="0.01"
                    value={formData.altura_maxima}
                    onChange={(e) => setFormData({ ...formData, altura_maxima: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="alcance_maximo">Alcance Máximo (m)</Label>
                  <Input
                    id="alcance_maximo"
                    type="number"
                    step="0.01"
                    value={formData.alcance_maximo}
                    onChange={(e) => setFormData({ ...formData, alcance_maximo: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="capacidade_maxima">Capacidade Máxima (t)</Label>
                  <Input
                    id="capacidade_maxima"
                    type="number"
                    step="0.01"
                    value={formData.capacidade_maxima}
                    onChange={(e) => setFormData({ ...formData, capacidade_maxima: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="capacidade_ponta">Capacidade na Ponta (t)</Label>
                  <Input
                    id="capacidade_ponta"
                    type="number"
                    step="0.01"
                    value={formData.capacidade_ponta}
                    onChange={(e) => setFormData({ ...formData, capacidade_ponta: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="velocidade_operacao">Velocidade de Operação (m/min)</Label>
                  <Input
                    id="velocidade_operacao"
                    type="number"
                    step="0.01"
                    value={formData.velocidade_operacao}
                    onChange={(e) => setFormData({ ...formData, velocidade_operacao: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="velocidade_rotacao">Velocidade de Rotação (rpm)</Label>
                  <Input
                    id="velocidade_rotacao"
                    type="number"
                    step="0.01"
                    value={formData.velocidade_rotacao}
                    onChange={(e) => setFormData({ ...formData, velocidade_rotacao: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="potencia_motor">Potência do Motor (kW)</Label>
                  <Input
                    id="potencia_motor"
                    type="number"
                    step="0.01"
                    value={formData.potencia_motor}
                    onChange={(e) => setFormData({ ...formData, potencia_motor: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="consumo_energia">Consumo de Energia</Label>
                  <Input
                    id="consumo_energia"
                    type="number"
                    step="0.01"
                    value={formData.consumo_energia}
                    onChange={(e) => setFormData({ ...formData, consumo_energia: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="peso_total">Peso Total (t)</Label>
                  <Input
                    id="peso_total"
                    type="number"
                    step="0.01"
                    value={formData.peso_total}
                    onChange={(e) => setFormData({ ...formData, peso_total: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dimensoes">Dimensões</Label>
                <Input
                  id="dimensoes"
                  value={formData.dimensoes}
                  onChange={(e) => setFormData({ ...formData, dimensoes: e.target.value })}
                  placeholder="Ex: 10m x 5m x 3m"
                />
              </div>
            </div>

            {/* Operação e Automação */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operação e Automação</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_operacao">Tipo de Operação</Label>
                  <Select
                    value={formData.tipo_operacao}
                    onValueChange={(value: "Manual" | "Semi-automática" | "Automática") => 
                      setFormData({ ...formData, tipo_operacao: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Semi-automática">Semi-automática</SelectItem>
                      <SelectItem value="Automática">Automática</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nivel_automatizacao">Nível de Automação</Label>
                  <Select
                    value={formData.nivel_automatizacao}
                    onValueChange={(value: "Básico" | "Intermediário" | "Avançado" | "Total") => 
                      setFormData({ ...formData, nivel_automatizacao: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Básico">Básico</SelectItem>
                      <SelectItem value="Intermediário">Intermediário</SelectItem>
                      <SelectItem value="Avançado">Avançado</SelectItem>
                      <SelectItem value="Total">Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eficiencia_energetica">Eficiência Energética</Label>
                  <Select
                    value={formData.eficiencia_energetica}
                    onValueChange={(value: "A" | "B" | "C" | "D" | "E") => 
                      setFormData({ ...formData, eficiencia_energetica: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Valores */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Valores</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor_configuracao">Valor da Configuração (R$)</Label>
                  <Input
                    id="valor_configuracao"
                    type="number"
                    step="0.01"
                    value={formData.valor_configuracao}
                    onChange={(e) => setFormData({ ...formData, valor_configuracao: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="custo_operacao_mensal">Custo de Operação Mensal (R$)</Label>
                  <Input
                    id="custo_operacao_mensal"
                    type="number"
                    step="0.01"
                    value={formData.custo_operacao_mensal}
                    onChange={(e) => setFormData({ ...formData, custo_operacao_mensal: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Observações</h3>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais sobre a especificação técnica..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Especificação Técnica
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
