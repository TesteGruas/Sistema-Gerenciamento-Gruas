"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  Plus, 
  Calendar, 
  Users, 
  User,
  DollarSign, 
  ArrowLeft,
  ConeIcon as Crane,
  X,
  Trash2,
  Package,
  Settings
} from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend, converterObraFrontendParaBackend, ObraBackend } from "@/lib/api-obras"
import { CustoMensal } from "@/lib/mock-data"
import { ButtonLoader } from "@/components/ui/loader"
import ClienteSearch from "@/components/cliente-search"
import GruaSearch from "@/components/grua-search"
import FuncionarioSearch from "@/components/funcionario-search"
import { useToast } from "@/hooks/use-toast"

// Funções de máscara
const formatCurrency = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Se não há números, retorna vazio
  if (!numbers || numbers === '0') return ''
  
  // Converte para número e divide por 100 para ter centavos
  const amount = parseInt(numbers) / 100
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatCNPJ = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara do CNPJ
  return numbers
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

const formatPhone = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara do telefone
  if (numbers.length <= 10) {
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14)
  } else {
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15)
  }
}

const formatCEP = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara do CEP
  return numbers
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9)
}

// Função para remover máscaras
const removeMasks = (value: string) => {
  return value.replace(/\D/g, '')
}

// Função para converter valor formatado para número
const parseCurrency = (value: string) => {
  const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleanValue) || 0
}

// Função para formatar números decimais
const formatDecimal = (value: string) => {
  // Remove tudo que não é dígito ou ponto
  const numbers = value.replace(/[^\d,]/g, '')
  
  // Se não há números, retorna vazio
  if (!numbers || numbers === '0') return ''
  
  // Se tem vírgula, formata como decimal
  if (numbers.includes(',')) {
    const parts = numbers.split(',')
    if (parts.length === 2) {
      // Limita a 2 casas decimais
      const decimal = parts[1].substring(0, 2)
      return `${parts[0]},${decimal}`
    }
  }
  
  return numbers
}

// Função para converter valor decimal formatado para número
const parseDecimal = (value: string) => {
  const cleanValue = value.replace(',', '.')
  return parseFloat(cleanValue) || 0
}

export default function NovaObraPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados para integração com backend
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados do formulário
  const [obraFormData, setObraFormData] = useState({
    name: '',
    description: '',
    status: 'Em Andamento',
    startDate: '',
    endDate: '',
    budget: '',
    location: '',
    clienteId: '',
    observations: '',
    // Dados do responsável
    responsavelId: '',
    responsavelName: '',
    // Lista de funcionários
    funcionarios: [] as Array<{
      id: string
      userId: string
      role: string
      name: string
      gruaId?: string
    }>
  })
  
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [gruasSelecionadas, setGruasSelecionadas] = useState<any[]>([])
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<any[]>([])
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<any>(null)
  
  // Estados para custos mensais
  const [custosMensais, setCustosMensais] = useState<CustoMensal[]>([])
  const [custoForm, setCustoForm] = useState({
    item: '',
    descricao: '',
    unidade: '',
    quantidadeOrcamento: 0,
    valorUnitario: 0,
    totalOrcamento: 0,
    mes: new Date().toISOString().slice(0, 7)
  })

  // Funções para custos mensais
  const adicionarCustoMensal = () => {
    const novoCusto: CustoMensal = {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      obraId: '',
      item: custoForm.item,
      descricao: custoForm.descricao,
      unidade: custoForm.unidade,
      quantidadeOrcamento: custoForm.quantidadeOrcamento,
      valorUnitario: custoForm.valorUnitario,
      totalOrcamento: custoForm.quantidadeOrcamento * custoForm.valorUnitario,
      mes: custoForm.mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: custoForm.quantidadeOrcamento,
      valorSaldo: custoForm.quantidadeOrcamento * custoForm.valorUnitario,
      tipo: 'contrato',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setCustosMensais([...custosMensais, novoCusto])
    setCustoForm({
      item: '',
      descricao: '',
      unidade: '',
      quantidadeOrcamento: 0,
      valorUnitario: 0,
      totalOrcamento: 0,
      mes: new Date().toISOString().slice(0, 7)
    })
  }

  const removerCustoMensal = (id: string) => {
    setCustosMensais(custosMensais.filter(custo => custo.id !== id))
  }

  const duplicarCustosParaMes = (mes: string) => {
    const custosDuplicados = custosMensais.map(custo => ({
      ...custo,
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mes: mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: custo.quantidadeAcumulada,
      valorAcumulado: custo.valorAcumulado,
      quantidadeSaldo: custo.quantidadeOrcamento,
      valorSaldo: custo.totalOrcamento,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    setCustosMensais([...custosMensais, ...custosDuplicados])
  }

  // Função para lidar com seleção de cliente
  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    if (cliente) {
      setObraFormData({ ...obraFormData, clienteId: cliente.id })
    }
  }

  // Função para lidar com seleção de grua
  const handleGruaSelect = (grua: any) => {
    if (gruasSelecionadas.find(g => g.id === grua.id)) {
      return // Já está selecionada
    }
    
    const novaGrua = {
      ...grua,
      valor_locacao: grua.valor_locacao || 0,
      taxa_mensal: grua.valor_locacao || 0
    }
    
    setGruasSelecionadas([...gruasSelecionadas, novaGrua])
  }

  // Função para remover grua selecionada
  const removeGruaSelecionada = (gruaId: string) => {
    setGruasSelecionadas(gruasSelecionadas.filter(g => g.id !== gruaId))
  }

  // Função para lidar com seleção de funcionário
  const handleFuncionarioSelect = (funcionario: any) => {
    if (funcionariosSelecionados.find(f => f.id === funcionario.id)) {
      return // Já está selecionado
    }
    
    const novoFuncionario = {
      id: `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: funcionario.id,
      role: funcionario.role,
      name: funcionario.name,
      gruaId: '' // Removido - usando array de gruas
    }
    
    setFuncionariosSelecionados([...funcionariosSelecionados, novoFuncionario])
    setObraFormData({
      ...obraFormData,
      funcionarios: [...obraFormData.funcionarios, novoFuncionario]
    })
  }

  // Função para remover funcionário selecionado
  const removeFuncionarioSelecionado = (id: string) => {
    const funcionarioRemovido = funcionariosSelecionados.find(f => f.id === id)
    if (funcionarioRemovido) {
      setFuncionariosSelecionados(funcionariosSelecionados.filter(f => f.id !== id))
      setObraFormData({
        ...obraFormData,
        funcionarios: obraFormData.funcionarios.filter(f => f.id !== id)
      })
    }
  }

  // Função para lidar com seleção de responsável
  const handleResponsavelSelect = (responsavel: any) => {
    setResponsavelSelecionado(responsavel)
    if (responsavel) {
      setObraFormData({ 
        ...obraFormData, 
        responsavelId: responsavel.id,
        responsavelName: responsavel.name
      })
    }
  }

  // Função para criar obra
  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!obraFormData.name || !obraFormData.clienteId) {
      toast({
        title: "Erro",
        description: "Nome da obra e cliente são obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      setCreating(true)
      setError(null)

      // Preparar dados para o backend
      const obraData = {
        name: obraFormData.name,
        description: obraFormData.description,
        status: obraFormData.status,
        startDate: obraFormData.startDate,
        endDate: obraFormData.endDate,
        budget: parseCurrency(obraFormData.budget),
        location: obraFormData.location,
        clienteId: obraFormData.clienteId,
        observations: obraFormData.observations,
        // Dados das gruas
        gruas: gruasSelecionadas.map(grua => ({
          id: grua.id,
          name: grua.name,
          model: grua.model,
          valor_locacao: grua.valor_locacao,
          taxa_mensal: grua.taxa_mensal
        })),
        // Dados do responsável
        responsavelId: obraFormData.responsavelId,
        responsavelName: obraFormData.responsavelName,
        // Lista de funcionários
        funcionarios: obraFormData.funcionarios,
        // Custos mensais
        custosMensais: custosMensais
      }

      // Converter para formato do backend
      const obraBackendData = converterObraFrontendParaBackend(obraData)
      const response = await obrasApi.criarObra(obraBackendData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Obra criada com sucesso!"
        })
        router.push('/dashboard/obras')
      } else {
        throw new Error('Erro ao criar obra')
      }
    } catch (err) {
      console.error('Erro ao criar obra:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar obra')
      toast({
        title: "Erro",
        description: "Erro ao criar obra",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setObraFormData({
      name: '',
      description: '',
      status: 'Em Andamento',
      startDate: '',
      endDate: '',
      budget: '',
      location: '',
      clienteId: '',
      observations: '',
      responsavelId: '',
      responsavelName: '',
      funcionarios: []
    })
    setClienteSelecionado(null)
    setGruasSelecionadas([])
    setFuncionariosSelecionados([])
    setResponsavelSelecionado(null)
    setCustosMensais([])
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
              onClick={() => router.push('/dashboard/obras')}
              className="text-gray-600 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Obra</h1>
          <p className="text-gray-600">Crie uma nova obra com grua e funcionários</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleCreateObra} className="space-y-6">
        <Tabs defaultValue="obra" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
            <TabsTrigger value="grua">Grua</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="custos">Custos Mensais</TabsTrigger>
          </TabsList>

          {/* Aba: Dados da Obra */}
          <TabsContent value="obra" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Informações da Obra
                </CardTitle>
                <CardDescription>
                  Preencha os dados básicos da obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Obra *</Label>
                    <Input
                      id="name"
                      value={obraFormData.name}
                      onChange={(e) => setObraFormData({ ...obraFormData, name: e.target.value })}
                      placeholder="Ex: Obra Residencial Jardim das Flores"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={obraFormData.status} onValueChange={(value) => setObraFormData({ ...obraFormData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Suspensa">Suspensa</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={obraFormData.startDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={obraFormData.endDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, endDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Orçamento (R$)</Label>
                    <Input
                      id="budget"
                      type="text"
                      value={obraFormData.budget}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        setObraFormData({ ...obraFormData, budget: formatted })
                      }}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      value={obraFormData.location}
                      onChange={(e) => setObraFormData({ ...obraFormData, location: e.target.value })}
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={obraFormData.description}
                    onChange={(e) => setObraFormData({ ...obraFormData, description: e.target.value })}
                    placeholder="Descrição detalhada da obra..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="clienteSearch">Cliente *</Label>
                  <ClienteSearch
                    onClienteSelect={handleClienteSelect}
                    placeholder="Buscar cliente por nome ou CNPJ..."
                    className="mt-1"
                  />
                  {clienteSelecionado && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{clienteSelecionado.name}</p>
                          <p className="text-sm text-green-700">{clienteSelecionado.cnpj}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou CNPJ do cliente para buscar
                  </p>
                </div>

                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={obraFormData.observations}
                    onChange={(e) => setObraFormData({ ...obraFormData, observations: e.target.value })}
                    placeholder="Observações adicionais sobre a obra..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Gruas */}
          <TabsContent value="grua" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crane className="w-5 h-5 text-blue-600" />
                  Gruas para a Obra
                </CardTitle>
                <CardDescription>
                  Selecione uma ou mais gruas que serão utilizadas nesta obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crane className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Gruas da Obra</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Selecione uma ou mais gruas que serão utilizadas nesta obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="gruaSearch">Buscar Grua</Label>
                  <GruaSearch
                    onGruaSelect={handleGruaSelect}
                    placeholder="Buscar grua por nome ou modelo..."
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou modelo da grua para buscar
                  </p>
                </div>

                {/* Lista de gruas selecionadas */}
                {gruasSelecionadas.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Gruas Selecionadas ({gruasSelecionadas.length})</h4>
                    {gruasSelecionadas.map((grua) => (
                      <div key={grua.id} className="flex gap-2 p-3 border rounded-lg bg-blue-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Crane className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">{grua.name}</p>
                              <p className="text-sm text-blue-700">{grua.model} - {grua.capacity}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label htmlFor={`gruaValue-${grua.id}`}>Valor da Locação (R$)</Label>
                              <Input
                                id={`gruaValue-${grua.id}`}
                                type="text"
                                value={grua.valor_locacao && grua.valor_locacao > 0 ? formatCurrency((grua.valor_locacao * 100).toString()) : ''}
                                onChange={(e) => {
                                  const formatted = formatCurrency(e.target.value)
                                  const numericValue = parseCurrency(formatted)
                                  const updatedGruas = gruasSelecionadas.map(g => 
                                    g.id === grua.id ? { ...g, valor_locacao: numericValue } : g
                                  )
                                  setGruasSelecionadas(updatedGruas)
                                }}
                                placeholder="0,00"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`monthlyFee-${grua.id}`}>Taxa Mensal (R$)</Label>
                              <Input
                                id={`monthlyFee-${grua.id}`}
                                type="text"
                                value={grua.taxa_mensal && grua.taxa_mensal > 0 ? formatCurrency((grua.taxa_mensal * 100).toString()) : ''}
                                onChange={(e) => {
                                  const formatted = formatCurrency(e.target.value)
                                  const numericValue = parseCurrency(formatted)
                                  const updatedGruas = gruasSelecionadas.map(g => 
                                    g.id === grua.id ? { ...g, taxa_mensal: numericValue } : g
                                  )
                                  setGruasSelecionadas(updatedGruas)
                                }}
                                placeholder="0,00"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeGruaSelecionada(grua.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resumo das gruas */}
                {gruasSelecionadas.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Resumo das Gruas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total de Gruas:</span>
                        <p className="font-medium">{gruasSelecionadas.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor Total de Locação:</span>
                        <p className="font-medium text-green-600">
                          R$ {gruasSelecionadas.reduce((total, g) => total + g.valor_locacao, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Taxa Mensal Total:</span>
                        <p className="font-medium text-blue-600">
                          R$ {gruasSelecionadas.reduce((total, g) => total + g.taxa_mensal, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Funcionários */}
          <TabsContent value="funcionarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Funcionários da Obra
                </CardTitle>
                <CardDescription>
                  Adicione funcionários para esta obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-900">Funcionários da Obra</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Busque e adicione funcionários para esta obra
                  </p>
                </div>

                <div>
                  <Label htmlFor="funcionarioSearch">Buscar Funcionário</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleFuncionarioSelect}
                    placeholder="Buscar funcionário por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                    allowedRoles={['Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico', 'Engenheiro', 'Chefe de Obras']}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do funcionário para buscar
                  </p>
                </div>

                {/* Lista de funcionários selecionados */}
                {funcionariosSelecionados.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Funcionários Selecionados ({funcionariosSelecionados.length})</h4>
                    {funcionariosSelecionados.map((funcionario) => (
                      <div key={funcionario.id} className="flex gap-2 p-3 border rounded-lg bg-green-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{funcionario.name}</p>
                              <p className="text-sm text-green-700">{funcionario.role}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFuncionarioSelecionado(funcionario.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Label htmlFor="responsavelSearch">Responsável pela Obra</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleResponsavelSelect}
                    placeholder="Buscar responsável por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                    allowedRoles={['Supervisor', 'Engenheiro', 'Chefe de Obras','Operador']}
                  />
                  {responsavelSelecionado && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">{responsavelSelecionado.name}</p>
                          <p className="text-sm text-blue-700">{responsavelSelecionado.role}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do responsável para buscar
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Custos Mensais */}
          <TabsContent value="custos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Custos Mensais da Obra
                </CardTitle>
                <CardDescription>
                  Configure os custos mensais que serão aplicados a esta obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-purple-900">Custos Mensais da Obra</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    Configure os custos mensais que serão aplicados a esta obra
                  </p>
                </div>

                {/* Formulário para adicionar custo */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-sm">Adicionar Novo Custo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="custoItem">Item *</Label>
                      <Input
                        id="custoItem"
                        value={custoForm.item}
                        onChange={(e) => setCustoForm({...custoForm, item: e.target.value})}
                        placeholder="Ex: 01.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoDescricao">Descrição *</Label>
                      <Input
                        id="custoDescricao"
                        value={custoForm.descricao}
                        onChange={(e) => setCustoForm({...custoForm, descricao: e.target.value})}
                        placeholder="Ex: Locação de grua torre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoUnidade">Unidade *</Label>
                      <Select value={custoForm.unidade} onValueChange={(value) => setCustoForm({...custoForm, unidade: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mês">Mês</SelectItem>
                          <SelectItem value="dia">Dia</SelectItem>
                          <SelectItem value="hora">Hora</SelectItem>
                          <SelectItem value="un">Unidade</SelectItem>
                          <SelectItem value="kg">Quilograma</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="m²">Metro Quadrado</SelectItem>
                          <SelectItem value="m³">Metro Cúbico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="custoMes">Mês *</Label>
                      <Input
                        id="custoMes"
                        type="month"
                        value={custoForm.mes}
                        onChange={(e) => setCustoForm({...custoForm, mes: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoQuantidade">Quantidade Orçada *</Label>
                      <Input
                        id="custoQuantidade"
                        type="text"
                        value={custoForm.quantidadeOrcamento && custoForm.quantidadeOrcamento > 0 ? custoForm.quantidadeOrcamento.toString().replace('.', ',') : ''}
                        onChange={(e) => {
                          const formatted = formatDecimal(e.target.value)
                          const numericValue = parseDecimal(formatted)
                          setCustoForm({...custoForm, quantidadeOrcamento: numericValue})
                        }}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoValorUnitario">Valor Unitário (R$) *</Label>
                      <Input
                        id="custoValorUnitario"
                        type="text"
                        value={custoForm.valorUnitario && custoForm.valorUnitario > 0 ? formatCurrency((custoForm.valorUnitario * 100).toString()) : ''}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value)
                          const numericValue = parseCurrency(formatted)
                          setCustoForm({...custoForm, valorUnitario: numericValue})
                        }}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" onClick={adicionarCustoMensal} disabled={!custoForm.item || !custoForm.descricao || !custoForm.unidade || custoForm.quantidadeOrcamento <= 0 || custoForm.valorUnitario <= 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Custo
                    </Button>
                  </div>
                </div>

                {/* Lista de custos mensais */}
                {custosMensais.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Custos Mensais Configurados ({custosMensais.length})</h4>
                    <div className="space-y-2">
                      {custosMensais.map((custo) => (
                        <div key={custo.id} className="flex gap-2 p-3 border rounded-lg bg-purple-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="font-medium text-purple-900">{custo.item} - {custo.descricao}</p>
                                <p className="text-sm text-purple-700">
                                  {custo.quantidadeOrcamento} {custo.unidade} × R$ {custo.valorUnitario.toLocaleString('pt-BR')} = R$ {custo.totalOrcamento.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-xs text-purple-600">Mês: {custo.mes}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removerCustoMensal(custo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de ação para custos */}
                {custosMensais.length > 0 && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const proximoMes = new Date(custoForm.mes + '-01')
                        proximoMes.setMonth(proximoMes.getMonth() + 1)
                        const proximoMesStr = proximoMes.toISOString().slice(0, 7)
                        duplicarCustosParaMes(proximoMesStr)
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Duplicar para Próximo Mês
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-between pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/obras')}
            disabled={creating}
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={creating}
            >
              Limpar Formulário
            </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <ButtonLoader text="Criando..." />
                ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Obra
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
