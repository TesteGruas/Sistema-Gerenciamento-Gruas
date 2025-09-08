"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService } from "@/app/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ConeIcon as Crane,
  Plus,
  Search,
  Edit,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  FileText,
  Calculator,
  Users,
  Settings,
  Eye,
  Trash2,
} from "lucide-react"

export default function GruasPage() {
  const { toast } = useToast()
  const [gruas, setGruas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPropostaOpen, setIsPropostaOpen] = useState(false)
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false)
  const [editingGrua, setEditingGrua] = useState<any>(null)
  const [selectedGrua, setSelectedGrua] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Função para fazer requisições simples (sem autenticação)
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    return AuthService.simpleRequest(url, options)
  }

  // Carregar gruas do backend
  const loadGruas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiRequest('http://localhost:3001/api/gruas')
      
      if (response.success) {
        setGruas(response.data || [])
      } else {
        throw new Error('Erro ao carregar guindastes')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar guindastes'
      setError(errorMessage)
      console.error('Erro ao carregar gruas:', err)
      toast({
        title: "Erro ao carregar dados",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    loadGruas()
  }, [])

  // Função para carregar detalhes completos da grua
  const loadGruaDetalhes = async (gruaId: string) => {
    try {
      setLoading(true)
      const response = await apiRequest(`http://localhost:3001/api/gruas/${gruaId}`)
      
      if (response.success) {
        setSelectedGrua(response.data)
        return response.data
      } else {
        throw new Error('Erro ao carregar detalhes da grua')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes da grua'
      console.error('Erro ao carregar detalhes da grua:', err)
      toast({
        title: "Erro ao carregar detalhes",
        description: errorMessage,
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const [formData, setFormData] = useState({
    id: "",
    modelo: "",
    fabricante: "",
    tipo: "Grua Torre",
    capacidade: "",
    capacidade_ponta: "",
    lanca: "",
    altura_trabalho: "",
    ano: "",
    status: "Disponível",
    localizacao: "",
    cliente: "",
    operador: "",
    sinaleiro: "",
    horas_operacao: 0,
    valor_locacao: 0,
    valor_operacao: 0,
    valor_sinaleiro: 0,
    valor_manutencao: 0,
  })

  // Estados para gerenciamento de clientes
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [buscaCliente, setBuscaCliente] = useState("")
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [criandoCliente, setCriandoCliente] = useState(false)

  const [obraData, setObraData] = useState({
    nomeObra: "",
    enderecoObra: "",
    cidadeObra: "",
    cepObra: "",
    tipoObra: "Residencial",
    contato: "",
    telefoneContato: "",
    emailContato: "",
    cnpjCliente: "",
    prazoMeses: 6,
    dataInicio: "",
    dataFim: "",
  })

  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [equipamentos, setEquipamentos] = useState<any[]>([])

  const [novoFuncionario, setNovoFuncionario] = useState({
    nome: "",
    cargo: "Operador",
    telefone: "",
    turno: "Diurno",
  })

  const [novoEquipamento, setNovoEquipamento] = useState({
    nome: "",
    tipo: "Garfo",
    status: "Ativo",
    responsavel: "",
  })

  const [propostaData, setPropostaData] = useState({
    cliente: "",
    cnpj: "",
    obra: "",
    endereco: "",
    cidade: "",
    prazoMeses: 6,
    dataInicio: "",
    alturaFinal: "",
    tipoBase: "Base Fixa",
    voltagem: "380V",
    potencia: "72 KVA",
    observacoes: "",
  })

  const filteredGruas = gruas.filter(
    (grua) =>
      grua.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grua.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grua.localizacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grua.cliente && grua.cliente.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disponível":
        return <Badge className="bg-green-100 text-green-800">Disponível</Badge>
      case "Operacional":
        return <Badge className="bg-blue-100 text-blue-800">Operacional</Badge>
      case "Manutenção":
        return <Badge className="bg-yellow-100 text-yellow-800">Manutenção</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0,00"
    }
    return Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Função para buscar clientes
  const buscarClientes = async (query: string) => {
    if (query.length < 2) {
      setClientes([])
      return
    }

    try {
      const data = await apiRequest(`http://localhost:3001/api/gruas/clientes/buscar?q=${encodeURIComponent(query)}`)
      setClientes(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setClientes([])
    }
  }

  // Função para selecionar cliente
  const selecionarCliente = (cliente: any) => {
    setClienteSelecionado(cliente)
    setBuscaCliente(cliente.nome)
    setFormData({ ...formData, cliente: cliente.nome })
    setMostrarSugestoes(false)
  }

  // Função para limpar seleção de cliente
  const limparCliente = () => {
    setClienteSelecionado(null)
    setBuscaCliente("")
    setFormData({ ...formData, cliente: "" })
    setClientes([])
    setMostrarSugestoes(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Preparar dados base - baseado no schema real da tabela gruas do Supabase
      const baseData: any = {
        // Campos obrigatórios
        modelo: formData.modelo,
        fabricante: formData.fabricante,
        tipo: formData.tipo,
        capacidade: formData.capacidade,
        capacidade_ponta: formData.capacidade_ponta || "N/A",
        lanca: formData.lanca || "N/A",
        status: formData.status,
        
        // Campos com valores padrão conforme schema da tabela
        altura_trabalho: formData.altura_trabalho || null,
        ano: formData.ano ? parseInt(formData.ano) : null,
        localizacao: formData.localizacao || null,
        horas_operacao: formData.horas_operacao || 0, // Valor padrão da tabela
        valor_locacao: formData.valor_locacao || null,
        valor_operacao: formData.valor_operacao || 0, // Valor padrão para evitar NOT NULL
        valor_sinaleiro: formData.valor_sinaleiro || 0, // Valor padrão para evitar NOT NULL
        valor_manutencao: formData.valor_manutencao || 0, // Valor padrão para evitar NOT NULL
        
        // Dados do cliente - usar dados da aba Obra/Cliente se cliente selecionado não tiver
        cliente_nome: formData.cliente || null,
        cliente_documento: clienteSelecionado?.cnpj || obraData.cnpjCliente || null,
        cliente_email: clienteSelecionado?.email || obraData.emailContato || null,
        cliente_telefone: clienteSelecionado?.telefone || obraData.telefoneContato || null,
      }

      if (editingGrua) {
        // Atualizar grua existente - não incluir id no corpo da requisição
        await apiRequest(`http://localhost:3001/api/gruas/${editingGrua.id}`, {
          method: 'PUT',
          body: JSON.stringify(baseData),
        })
        
        toast({
          title: "Sucesso!",
          description: "Guindaste atualizado com sucesso.",
        })
      } else {
        // Criar nova grua - não incluir id
        await apiRequest('http://localhost:3001/api/gruas', {
          method: 'POST',
          body: JSON.stringify(baseData),
        })
        
        toast({
          title: "Sucesso!",
          description: "Guindaste criado com sucesso.",
        })
      }

      // Recarregar lista de guindastes
      await loadGruas()

      // Limpar formulário e fechar modal
      resetForm()
      setIsDialogOpen(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar guindaste'
      setError(errorMessage)
      console.error('Erro ao salvar grua:', err)
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      id: "",
      modelo: "",
      fabricante: "",
      tipo: "Grua Torre",
      capacidade: "",
      capacidade_ponta: "",
      lanca: "",
      altura_trabalho: "",
      ano: "",
      status: "Disponível",
      localizacao: "",
      cliente: "",
      operador: "",
      sinaleiro: "",
      horas_operacao: 0,
      valor_locacao: 0,
      valor_operacao: 0,
      valor_sinaleiro: 0,
      valor_manutencao: 0,
    })
    
    setObraData({
      nomeObra: "",
      enderecoObra: "",
      cidadeObra: "",
      cepObra: "",
      tipoObra: "Residencial",
      contato: "",
      telefoneContato: "",
      emailContato: "",
      cnpjCliente: "",
      prazoMeses: 6,
      dataInicio: "",
      dataFim: "",
    })
    
    setFuncionarios([])
    setEquipamentos([])
    setEditingGrua(null)
    setIsDialogOpen(false)
    // Limpar dados do cliente
    setClienteSelecionado(null)
    setBuscaCliente("")
    setClientes([])
    setMostrarSugestoes(false)
  }

  // Função para deletar grua
  const handleDelete = async (gruaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta grua?')) {
      return
    }

    try {
      setError(null)
      await apiRequest(`http://localhost:3001/api/gruas/${gruaId}`, {
        method: 'DELETE',
      })
      await loadGruas()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir grua')
      console.error('Erro ao excluir grua:', err)
    }
  }

  const handleEdit = async (grua: any) => {
    // Carregar detalhes completos da grua
    const detalhes = await loadGruaDetalhes(grua.id)
    const gruaCompleta = detalhes || grua
    
    setEditingGrua(gruaCompleta)
    setFormData({
      id: gruaCompleta.id,
      modelo: gruaCompleta.modelo,
      fabricante: gruaCompleta.fabricante,
      tipo: gruaCompleta.tipo,
      capacidade: gruaCompleta.capacidade,
      capacidade_ponta: gruaCompleta.capacidade_ponta,
      lanca: gruaCompleta.lanca,
      altura_trabalho: gruaCompleta.altura_trabalho,
      ano: gruaCompleta.ano,
      status: gruaCompleta.status,
      localizacao: gruaCompleta.localizacao,
      cliente: gruaCompleta.cliente || "",
      operador: gruaCompleta.operador || "",
      sinaleiro: gruaCompleta.sinaleiro || "",
      horas_operacao: gruaCompleta.horas_operacao,
      valor_locacao: gruaCompleta.valor_locacao,
      valor_operacao: gruaCompleta.valor_operacao,
      valor_sinaleiro: gruaCompleta.valor_sinaleiro,
      valor_manutencao: gruaCompleta.valor_manutencao,
    })
    
    setObraData({
      nomeObra: gruaCompleta.nome_obra || "",
      enderecoObra: gruaCompleta.endereco_obra || "",
      cidadeObra: gruaCompleta.cidade_obra || "",
      cepObra: gruaCompleta.cep_obra || "",
      tipoObra: gruaCompleta.tipo_obra || "Residencial",
      contato: gruaCompleta.contato_obra || "",
      telefoneContato: gruaCompleta.cliente_telefone || "",
      emailContato: gruaCompleta.cliente_email || "",
      cnpjCliente: gruaCompleta.cliente_cnpj || "",
      prazoMeses: gruaCompleta.prazo_meses || 6,
      dataInicio: gruaCompleta.inicio_contrato || "",
      dataFim: gruaCompleta.fim_contrato || "",
    })
    
    setFuncionarios(gruaCompleta.equipe || [])
    setEquipamentos(gruaCompleta.equipamentos_auxiliares || [])
    setIsDialogOpen(true)
  }

  const adicionarFuncionario = () => {
    if (novoFuncionario.nome && novoFuncionario.cargo) {
      setFuncionarios([...funcionarios, { ...novoFuncionario, id: Date.now() }])
      setNovoFuncionario({ nome: "", cargo: "Operador", telefone: "", turno: "Diurno" })
    }
  }

  const removerFuncionario = (id: number) => {
    setFuncionarios(funcionarios.filter(f => f.id !== id))
  }

  const adicionarEquipamento = () => {
    if (novoEquipamento.nome) {
      setEquipamentos([...equipamentos, { ...novoEquipamento, id: Date.now() }])
      setNovoEquipamento({ nome: "", tipo: "Garfo", status: "Ativo", responsavel: "" })
    }
  }

  const removerEquipamento = (id: number) => {
    setEquipamentos(equipamentos.filter(e => e.id !== id))
  }

  const gerarProposta = (grua: any) => {
    setSelectedGrua(grua)
    setPropostaData({
      cliente: "",
      cnpj: "",
      obra: "",
      endereco: "",
      cidade: "",
      prazoMeses: 6,
      dataInicio: "",
      alturaFinal: grua.altura_trabalho,
      tipoBase: "Base Fixa",
      voltagem: "380V",
      potencia: "72 KVA",
      observacoes: "",
    })
    setIsPropostaOpen(true)
  }

  const calcularValorTotal = () => {
    if (!selectedGrua) return 0
    const valorMensal =
      (selectedGrua.valor_locacao || 0) +
      (selectedGrua.valor_operacao || 0) +
      (selectedGrua.valor_sinaleiro || 0) +
      (selectedGrua.valor_manutencao || 0)
    return valorMensal * propostaData.prazoMeses
  }

  const stats = [
    { title: "Total de Gruas", value: gruas.length, icon: Crane, color: "bg-blue-500" },
    {
      title: "Operacionais",
      value: gruas.filter((g) => g.status === "Operacional").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Em Manutenção",
      value: gruas.filter((g) => g.status === "Manutenção").length,
      icon: Wrench,
      color: "bg-red-500",
    },
    {
      title: "Disponíveis",
      value: gruas.filter((g) => g.status === "Disponível").length,
      icon: Clock,
      color: "bg-yellow-500",
    },
  ]

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Gruas</h1>
          <p className="text-gray-600">Gerenciamento completo da frota de gruas torre</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Grua
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGrua ? "Editar Grua" : "Cadastrar Nova Grua"}</DialogTitle>
              <DialogDescription>
                {editingGrua ? "Atualize as informações da grua" : "Preencha os dados da nova grua torre"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basico" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="tecnico">Especificações</TabsTrigger>
                  <TabsTrigger value="obra">Obra/Cliente</TabsTrigger>
                  <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
                  <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                </TabsList>

                <TabsContent value="basico" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="Ex: SITI MI2348"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fabricante">Fabricante</Label>
                      <Input
                        id="fabricante"
                        value={formData.fabricante}
                        onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                        placeholder="Ex: SITI, Liebherr, Potain"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grua Torre">Grua Torre</SelectItem>
                          <SelectItem value="Grua Torre Auto Estável">Grua Torre Auto Estável</SelectItem>
                          <SelectItem value="Grua Móvel">Grua Móvel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ano">Ano</Label>
                      <Input
                        id="ano"
                        value={formData.ano}
                        onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                        placeholder="2020"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Disponível">Disponível</SelectItem>
                          <SelectItem value="Operacional">Operacional</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                      placeholder="Ex: Base Itu/SP ou Obra Centro - SP"
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tecnico" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacidade">Capacidade Máxima</Label>
                      <Input
                        id="capacidade"
                        value={formData.capacidade}
                        onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                        placeholder="Ex: 5.000 kg (23m)"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacidade_ponta">Capacidade na Ponta</Label>
                      <Input
                        id="capacidade_ponta"
                        value={formData.capacidade_ponta}
                        onChange={(e) => setFormData({ ...formData, capacidade_ponta: e.target.value })}
                        placeholder="Ex: 2.300 kg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lanca">Comprimento da Lança</Label>
                      <Input
                        id="lanca"
                        value={formData.lanca}
                        onChange={(e) => setFormData({ ...formData, lanca: e.target.value })}
                        placeholder="Ex: 48 metros"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altura_trabalho">Altura de Trabalho</Label>
                      <Input
                        id="altura_trabalho"
                        value={formData.altura_trabalho}
                        onChange={(e) => setFormData({ ...formData, altura_trabalho: e.target.value })}
                        placeholder="Ex: 52 metros"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horas_operacao">Horas de Operação</Label>
                      <Input
                        id="horas_operacao"
                        type="number"
                        value={formData.horas_operacao}
                        onChange={(e) =>
                          setFormData({ ...formData, horas_operacao: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_locacao">Valor Locação (R$/mês)</Label>
                      <Input
                        id="valor_locacao"
                        type="number"
                        step="0.01"
                        value={formData.valor_locacao}
                        onChange={(e) =>
                          setFormData({ ...formData, valor_locacao: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="26300.00"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="obra" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Nome do Cliente</Label>
                      <div className="relative">
                        <Input
                          id="cliente"
                          value={buscaCliente}
                          onChange={(e) => {
                            const value = e.target.value
                            setBuscaCliente(value)
                            setFormData({ ...formData, cliente: value })
                            if (value.length >= 2) {
                              buscarClientes(value)
                              setMostrarSugestoes(true)
                            } else {
                              setClientes([])
                              setMostrarSugestoes(false)
                            }
                          }}
                          onFocus={() => {
                            if (clientes.length > 0) {
                              setMostrarSugestoes(true)
                            }
                          }}
                          placeholder="Digite para buscar cliente existente ou criar novo"
                        />
                        
                        {/* Botão para limpar seleção */}
                        {clienteSelecionado && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={limparCliente}
                          >
                            ×
                          </Button>
                        )}

                        {/* Lista de sugestões */}
                        {mostrarSugestoes && clientes.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {clientes.map((cliente) => (
                              <div
                                key={cliente.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => selecionarCliente(cliente)}
                              >
                                <div className="font-medium">{cliente.nome}</div>
                                {cliente.cnpj && (
                                  <div className="text-sm text-gray-500">
                                    {cliente.cnpj}
                                  </div>
                                )}
                                {cliente.email && (
                                  <div className="text-sm text-gray-500">
                                    {cliente.email}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Indicador de cliente selecionado */}
                        {clienteSelecionado && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <div className="text-sm text-green-800">
                              <strong>Cliente selecionado:</strong> {clienteSelecionado.nome}
                            </div>
                            {clienteSelecionado.cnpj && (
                              <div className="text-xs text-green-600">
                                CNPJ: {clienteSelecionado.cnpj}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpjCliente">CNPJ do Cliente</Label>
                      <Input
                        id="cnpjCliente"
                        value={obraData.cnpjCliente}
                        onChange={(e) => setObraData({ ...obraData, cnpjCliente: e.target.value })}
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomeObra">Nome da Obra</Label>
                    <Input
                      id="nomeObra"
                      value={obraData.nomeObra}
                      onChange={(e) => setObraData({ ...obraData, nomeObra: e.target.value })}
                      placeholder="Ex: Residencial Quinta das Amoras"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enderecoObra">Endereço da Obra</Label>
                      <Input
                        id="enderecoObra"
                        value={obraData.enderecoObra}
                        onChange={(e) => setObraData({ ...obraData, enderecoObra: e.target.value })}
                        placeholder="Rua, número"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidadeObra">Cidade</Label>
                      <Input
                        id="cidadeObra"
                        value={obraData.cidadeObra}
                        onChange={(e) => setObraData({ ...obraData, cidadeObra: e.target.value })}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cepObra">CEP</Label>
                      <Input
                        id="cepObra"
                        value={obraData.cepObra}
                        onChange={(e) => setObraData({ ...obraData, cepObra: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipoObra">Tipo de Obra</Label>
                      <Select
                        value={obraData.tipoObra}
                        onValueChange={(value) => setObraData({ ...obraData, tipoObra: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Residencial">Residencial</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Industrial">Industrial</SelectItem>
                          <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataInicio">Data de Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={obraData.dataInicio}
                        onChange={(e) => setObraData({ ...obraData, dataInicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                      <Input
                        id="prazoMeses"
                        type="number"
                        value={obraData.prazoMeses}
                        onChange={(e) => setObraData({ ...obraData, prazoMeses: Number.parseInt(e.target.value) || 0 })}
                        placeholder="6"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contato">Contato na Obra</Label>
                      <Input
                        id="contato"
                        value={obraData.contato}
                        onChange={(e) => setObraData({ ...obraData, contato: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefoneContato">Telefone</Label>
                      <Input
                        id="telefoneContato"
                        value={obraData.telefoneContato}
                        onChange={(e) => setObraData({ ...obraData, telefoneContato: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailContato">E-mail</Label>
                      <Input
                        id="emailContato"
                        type="email"
                        value={obraData.emailContato}
                        onChange={(e) => setObraData({ ...obraData, emailContato: e.target.value })}
                        placeholder="contato@empresa.com"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="funcionarios" className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Adicionar Funcionário</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <Input
                        placeholder="Nome completo"
                        value={novoFuncionario.nome}
                        onChange={(e) => setNovoFuncionario({ ...novoFuncionario, nome: e.target.value })}
                      />
                      <Select
                        value={novoFuncionario.cargo}
                        onValueChange={(value) => setNovoFuncionario({ ...novoFuncionario, cargo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Operador">Operador</SelectItem>
                          <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                          <SelectItem value="Técnico Manutenção">Técnico Manutenção</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Mecânico">Mecânico</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Telefone"
                        value={novoFuncionario.telefone}
                        onChange={(e) => setNovoFuncionario({ ...novoFuncionario, telefone: e.target.value })}
                      />
                      <Select
                        value={novoFuncionario.turno}
                        onValueChange={(value) => setNovoFuncionario({ ...novoFuncionario, turno: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Diurno">Diurno</SelectItem>
                          <SelectItem value="Noturno">Noturno</SelectItem>
                          <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" onClick={adicionarFuncionario} className="mt-3" size="sm">
                      Adicionar Funcionário
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Funcionários Cadastrados ({funcionarios.length})</h4>
                    {funcionarios.length === 0 ? (
                      <p className="text-gray-500 text-sm">Nenhum funcionário cadastrado</p>
                    ) : (
                      <div className="space-y-2">
                        {funcionarios.map((funcionario, index) => (
                          <div key={funcionario.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{funcionario.nome}</p>
                              <p className="text-sm text-gray-600">
                                {funcionario.cargo} • {funcionario.turno} • {funcionario.telefone}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerFuncionario(funcionario.id || index)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="equipamentos" className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Adicionar Equipamento</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <Input
                        placeholder="Nome do equipamento"
                        value={novoEquipamento.nome}
                        onChange={(e) => setNovoEquipamento({ ...novoEquipamento, nome: e.target.value })}
                      />
                      <Select
                        value={novoEquipamento.tipo}
                        onValueChange={(value) => setNovoEquipamento({ ...novoEquipamento, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Garfo">Garfo Paleteiro</SelectItem>
                          <SelectItem value="Balde">Balde Concreto</SelectItem>
                          <SelectItem value="Caçamba">Caçamba Entulho</SelectItem>
                          <SelectItem value="Plataforma">Plataforma Descarga</SelectItem>
                          <SelectItem value="Garra">Garra</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Responsável"
                        value={novoEquipamento.responsavel}
                        onChange={(e) => setNovoEquipamento({ ...novoEquipamento, responsavel: e.target.value })}
                      />
                      <Select
                        value={novoEquipamento.status}
                        onValueChange={(value) => setNovoEquipamento({ ...novoEquipamento, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Disponível">Disponível</SelectItem>
                          <SelectItem value="Operacional">Operacional</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" onClick={adicionarEquipamento} className="mt-3" size="sm">
                      Adicionar Equipamento
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Equipamentos Cadastrados ({equipamentos.length})</h4>
                    {equipamentos.length === 0 ? (
                      <p className="text-gray-500 text-sm">Nenhum equipamento cadastrado</p>
                    ) : (
                      <div className="space-y-2">
                        {equipamentos.map((equipamento, index) => (
                          <div key={equipamento.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{equipamento.nome}</p>
                              <p className="text-sm text-gray-600">
                                {equipamento.tipo} • {equipamento.status} • Responsável: {equipamento.responsavel}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerEquipamento(equipamento.id || index)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? "Salvando..." : editingGrua ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gruas</CardTitle>
          <CardDescription>Visualize e gerencie todas as gruas da frota</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, modelo, localização ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Carregando gruas...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredGruas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma grua encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGruas.map((grua) => (
                  <TableRow key={grua.id}>
                    <TableCell className="font-medium">{grua.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{grua.modelo}</p>
                        <p className="text-sm text-gray-500">{grua.fabricante}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(grua.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                        <span className="text-sm">{grua.localizacao}</span>
                      </div>
                    </TableCell>
                    <TableCell>{grua.cliente || "-"}</TableCell>
                    <TableCell>{grua.operador || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const detalhes = await loadGruaDetalhes(grua.id)
                            if (detalhes) {
                              setIsDetalhesOpen(true)
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => await handleEdit(grua)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => gerarProposta(grua)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(grua.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Obra - {selectedGrua?.id}</DialogTitle>
            <DialogDescription>Equipamentos e funcionários atrelados à obra</DialogDescription>
          </DialogHeader>

          {selectedGrua && (
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
                <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                <TabsTrigger value="equipe">Equipe</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados da Grua</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Modelo:</strong> {selectedGrua.modelo || "N/A"}
                      </div>
                      <div>
                        <strong>Fabricante:</strong> {selectedGrua.fabricante || "N/A"}
                      </div>
                      <div>
                        <strong>Capacidade:</strong> {selectedGrua.capacidade || "N/A"}
                      </div>
                      <div>
                        <strong>Lança:</strong> {selectedGrua.lanca || "N/A"}
                      </div>
                      <div>
                        <strong>Altura:</strong> {selectedGrua.altura_trabalho || selectedGrua.alturaTrabalho || "N/A"}
                      </div>
                      <div>
                        <strong>Status:</strong> {getStatusBadge(selectedGrua.status)}
                      </div>
                      <div>
                        <strong>Horas de Operação:</strong> {selectedGrua.horas_operacao || selectedGrua.horasOperacao || 0}
                      </div>
                      <div>
                        <strong>Última Manutenção:</strong> {selectedGrua.ultima_manutencao || selectedGrua.ultimaManutencao || "N/A"}
                      </div>
                      <div>
                        <strong>Próxima Manutenção:</strong> {selectedGrua.proxima_manutencao || selectedGrua.proximaManutencao || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados da Obra</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Cliente:</strong> {selectedGrua.cliente || "N/A"}
                      </div>
                      <div>
                        <strong>CNPJ:</strong> {selectedGrua.cliente_cnpj || "N/A"}
                      </div>
                      <div>
                        <strong>Nome da Obra:</strong> {selectedGrua.nome_obra || "N/A"}
                      </div>
                      <div>
                        <strong>Endereço:</strong> {selectedGrua.endereco_obra || "N/A"}
                      </div>
                      <div>
                        <strong>Cidade:</strong> {selectedGrua.cidade_obra || "N/A"}
                      </div>
                      <div>
                        <strong>Estado:</strong> {selectedGrua.estado_obra || "N/A"}
                      </div>
                      <div>
                        <strong>Localização Atual:</strong> {selectedGrua.localizacao || "N/A"}
                      </div>
                      <div>
                        <strong>Contrato Ativo:</strong> {selectedGrua.contrato_ativo ? "Sim" : "Não"}
                      </div>
                      {selectedGrua.contrato_ativo && (
                        <>
                          <div>
                            <strong>Número do Contrato:</strong> {selectedGrua.numero_contrato || "N/A"}
                          </div>
                          <div>
                            <strong>Início:</strong> {selectedGrua.inicio_contrato || "N/A"}
                          </div>
                          <div>
                            <strong>Fim:</strong> {selectedGrua.fim_contrato || "N/A"}
                          </div>
                          <div>
                            <strong>Prazo:</strong> {selectedGrua.prazo_meses || "N/A"} meses
                          </div>
                          <div>
                            <strong>Valor Total:</strong> R$ {formatCurrency(selectedGrua.valor_total_contrato)}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Valores de Locação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Valores de Locação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600">Locação</div>
                        <div className="text-lg font-bold text-blue-700">
                          R$ {formatCurrency(selectedGrua.valor_locacao || selectedGrua.valorLocacao)}
                        </div>
                        <div className="text-xs text-gray-500">por mês</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600">Operação</div>
                        <div className="text-lg font-bold text-green-700">
                          R$ {formatCurrency(selectedGrua.valor_operacao || selectedGrua.valorOperacao)}
                        </div>
                        <div className="text-xs text-gray-500">por mês</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm text-gray-600">Sinaleiro</div>
                        <div className="text-lg font-bold text-yellow-700">
                          R$ {formatCurrency(selectedGrua.valor_sinaleiro || selectedGrua.valorSinaleiro)}
                        </div>
                        <div className="text-xs text-gray-500">por mês</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-sm text-gray-600">Manutenção</div>
                        <div className="text-lg font-bold text-red-700">
                          R$ {formatCurrency(selectedGrua.valor_manutencao || selectedGrua.valorManutencao)}
                        </div>
                        <div className="text-xs text-gray-500">por mês</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="equipamentos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      Equipamentos Auxiliares
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGrua && selectedGrua.equipamentosAuxiliares && selectedGrua.equipamentosAuxiliares.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipamento</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Responsável</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedGrua.equipamentosAuxiliares.map((equip: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{equip.nome}</TableCell>
                                <TableCell>
                                  <Badge className="bg-green-100 text-green-800">{equip.status}</Badge>
                                </TableCell>
                                <TableCell>{equip.responsavel}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nenhum equipamento auxiliar atrelado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="equipe" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Funcionários da Obra
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGrua && selectedGrua.equipe && selectedGrua.equipe.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Cargo</TableHead>
                              <TableHead>Telefone</TableHead>
                              <TableHead>Turno</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedGrua.equipe.map((funcionario: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{funcionario.nome}</TableCell>
                                <TableCell>{funcionario.cargo}</TableCell>
                                <TableCell>{funcionario.telefone}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{funcionario.turno}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nenhum funcionário atrelado</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Proposta */}
      <Dialog open={isPropostaOpen} onOpenChange={setIsPropostaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Proposta Comercial</DialogTitle>
            <DialogDescription>Proposta para locação da grua {selectedGrua?.modelo}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações da Grua */}
            {selectedGrua && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Equipamento:</strong> {selectedGrua.modelo}
                      </p>
                      <p>
                        <strong>Fabricante:</strong> {selectedGrua.fabricante}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {selectedGrua.tipo}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Lança:</strong> {selectedGrua.lanca}
                      </p>
                      <p>
                        <strong>Altura:</strong> {selectedGrua.altura_trabalho}
                      </p>
                      <p>
                        <strong>Capacidade:</strong> {selectedGrua.capacidade}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Cliente e Obra */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente</Label>
                <Input
                  id="cliente"
                  value={propostaData.cliente}
                  onChange={(e) => setPropostaData({ ...propostaData, cliente: e.target.value })}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={propostaData.cnpj}
                  onChange={(e) => setPropostaData({ ...propostaData, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obra">Nome da Obra</Label>
              <Input
                id="obra"
                value={propostaData.obra}
                onChange={(e) => setPropostaData({ ...propostaData, obra: e.target.value })}
                placeholder="Nome do empreendimento"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço da Obra</Label>
                <Input
                  id="endereco"
                  value={propostaData.endereco}
                  onChange={(e) => setPropostaData({ ...propostaData, endereco: e.target.value })}
                  placeholder="Rua, número"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={propostaData.cidade}
                  onChange={(e) => setPropostaData({ ...propostaData, cidade: e.target.value })}
                  placeholder="Cidade - UF"
                  required
                />
              </div>
            </div>

            {/* Condições Técnicas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prazoMeses">Prazo (meses)</Label>
                <Input
                  id="prazoMeses"
                  type="number"
                  value={propostaData.prazoMeses}
                  onChange={(e) =>
                    setPropostaData({ ...propostaData, prazoMeses: Number.parseInt(e.target.value) || 6 })
                  }
                  min="1"
                  max="24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={propostaData.dataInicio}
                  onChange={(e) => setPropostaData({ ...propostaData, dataInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alturaFinal">Altura Final</Label>
                <Input
                  id="alturaFinal"
                  value={propostaData.alturaFinal}
                  onChange={(e) => setPropostaData({ ...propostaData, alturaFinal: e.target.value })}
                  placeholder="52 metros"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoBase">Tipo de Base</Label>
                <Select
                  value={propostaData.tipoBase}
                  onValueChange={(value) => setPropostaData({ ...propostaData, tipoBase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Base Fixa">Base Fixa</SelectItem>
                    <SelectItem value="Base Móvel">Base Móvel</SelectItem>
                    <SelectItem value="Trilhos">Trilhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voltagem">Voltagem</Label>
                <Select
                  value={propostaData.voltagem}
                  onValueChange={(value) => setPropostaData({ ...propostaData, voltagem: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="220V">220V</SelectItem>
                    <SelectItem value="380V">380V</SelectItem>
                    <SelectItem value="440V">440V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="potencia">Potência</Label>
                <Input
                  id="potencia"
                  value={propostaData.potencia}
                  onChange={(e) => setPropostaData({ ...propostaData, potencia: e.target.value })}
                  placeholder="72 KVA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={propostaData.observacoes}
                onChange={(e) => setPropostaData({ ...propostaData, observacoes: e.target.value })}
                placeholder="Observações adicionais sobre a obra ou condições especiais"
                rows={3}
              />
            </div>

            {/* Resumo Financeiro */}
            {selectedGrua && (
              <Card className="bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium">Valores Mensais:</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Locação:</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_locacao)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Operação:</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_operacao)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sinaleiro:</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_sinaleiro)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manutenção:</span>
                          <span>R$ {formatCurrency(selectedGrua?.valor_manutencao)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-medium">
                          <span>Total Mensal:</span>
                          <span>
                            R${" "}
                            {formatCurrency(
                              (selectedGrua?.valor_locacao || 0) +
                              (selectedGrua?.valor_operacao || 0) +
                              (selectedGrua?.valor_sinaleiro || 0) +
                              (selectedGrua?.valor_manutencao || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Valor Total do Contrato:</h4>
                      <div className="text-2xl font-bold text-green-700">
                        R$ {formatCurrency(calcularValorTotal())}
                      </div>
                      <p className="text-sm text-gray-600">{propostaData.prazoMeses} meses de locação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPropostaOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <FileText className="w-4 h-4 mr-2" />
                Gerar Proposta PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
