"use client"

import type React from "react"

import { useState } from "react"
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
} from "lucide-react"

const gruasData = [
  {
    id: "GRU001",
    modelo: "SITI MI2348",
    fabricante: "SITI",
    tipo: "Grua Torre Auto Estável",
    capacidade: "5.000 kg (23m)",
    capacidadePonta: "2.300 kg",
    lanca: "48 metros",
    alturaTrabalho: "52 metros",
    ano: "2014",
    status: "Operacional",
    localizacao: "Obra Residencial Quinta das Amoras - São José do Rio Preto",
    cliente: "TARRAF BY QUINTA DAS AMORAS SPE LTDA",
    operador: "João Silva",
    sinaleiro: "Carlos Santos",
    ultimaManutencao: "2024-01-15",
    proximaManutencao: "2024-04-15",
    horasOperacao: 1250,
    valorLocacao: 26300.0,
    valorOperacao: 10800.0,
    valorSinaleiro: 10800.0,
    valorManutencao: 3800.0,
    contratoAtivo: true,
    inicioContrato: "2024-01-30",
    fimContrato: "2024-07-30",
    prazoMeses: 6,
    equipamentosAuxiliares: [
      { nome: "Garfo Paleteiro 2500kg", status: "Ativo", responsavel: "João Silva" },
      { nome: "Balde Concreto 500L", status: "Ativo", responsavel: "Carlos Santos" },
      { nome: "Caçamba Entulho 1000kg", status: "Ativo", responsavel: "João Silva" },
      { nome: "Plataforma Descarga", status: "Ativo", responsavel: "Carlos Santos" },
    ],
    equipe: [
      { nome: "João Silva", cargo: "Operador", telefone: "(11) 99999-1111", turno: "Diurno" },
      { nome: "Carlos Santos", cargo: "Sinaleiro", telefone: "(11) 99999-2222", turno: "Diurno" },
      { nome: "Pedro Oliveira", cargo: "Técnico Manutenção", telefone: "(11) 99999-3333", turno: "Sob Demanda" },
      { nome: "Ana Costa", cargo: "Supervisora", telefone: "(11) 99999-4444", turno: "Diurno" },
    ],
  },
  {
    id: "GRU002",
    modelo: "Liebherr 132 EC-H8",
    fabricante: "Liebherr",
    tipo: "Grua Torre",
    capacidade: "8.000 kg (20m)",
    capacidadePonta: "1.800 kg",
    lanca: "55 metros",
    alturaTrabalho: "45 metros",
    ano: "2018",
    status: "Manutenção",
    localizacao: "Oficina Central - Itu/SP",
    cliente: "-",
    operador: "-",
    sinaleiro: "-",
    ultimaManutencao: "2024-01-20",
    proximaManutencao: "2024-04-20",
    horasOperacao: 980,
    valorLocacao: 28500.0,
    valorOperacao: 11200.0,
    valorSinaleiro: 11200.0,
    valorManutencao: 4200.0,
    contratoAtivo: false,
    inicioContrato: "",
    fimContrato: "",
    prazoMeses: 0,
    equipamentosAuxiliares: [],
    equipe: [
      { nome: "Roberto Lima", cargo: "Técnico Manutenção", telefone: "(11) 99999-5555", turno: "Diurno" },
      { nome: "Marcos Silva", cargo: "Mecânico", telefone: "(11) 99999-6666", turno: "Diurno" },
    ],
  },
  {
    id: "GRU003",
    modelo: "Potain MDT 219",
    fabricante: "Potain",
    tipo: "Grua Torre",
    capacidade: "10.000 kg (18m)",
    capacidadePonta: "2.100 kg",
    lanca: "60 metros",
    alturaTrabalho: "48 metros",
    ano: "2020",
    status: "Disponível",
    localizacao: "Base Itu/SP",
    cliente: "-",
    operador: "-",
    sinaleiro: "-",
    ultimaManutencao: "2024-01-25",
    proximaManutencao: "2024-04-25",
    horasOperacao: 750,
    valorLocacao: 32000.0,
    valorOperacao: 12500.0,
    valorSinaleiro: 12500.0,
    valorManutencao: 4500.0,
    contratoAtivo: false,
    inicioContrato: "",
    fimContrato: "",
    prazoMeses: 0,
    equipamentosAuxiliares: [],
    equipe: [],
  },
]

export default function GruasPage() {
  const [gruas, setGruas] = useState(gruasData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPropostaOpen, setIsPropostaOpen] = useState(false)
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false)
  const [editingGrua, setEditingGrua] = useState<any>(null)
  const [selectedGrua, setSelectedGrua] = useState<any>(null)

  const [formData, setFormData] = useState({
    id: "",
    modelo: "",
    fabricante: "",
    tipo: "Grua Torre",
    capacidade: "",
    capacidadePonta: "",
    lanca: "",
    alturaTrabalho: "",
    ano: "",
    status: "Disponível",
    localizacao: "",
    cliente: "",
    operador: "",
    sinaleiro: "",
    horasOperacao: 0,
    valorLocacao: 0,
    valorOperacao: 0,
    valorSinaleiro: 0,
    valorManutencao: 0,
  })

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
      grua.cliente.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Operacional":
        return <Badge className="bg-green-100 text-green-800">Operacional</Badge>
      case "Manutenção":
        return <Badge className="bg-red-100 text-red-800">Manutenção</Badge>
      case "Disponível":
        return <Badge className="bg-blue-100 text-blue-800">Disponível</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingGrua) {
      setGruas(
        gruas.map((grua) =>
          grua.id === editingGrua.id
            ? { 
                ...grua, 
                ...formData, 
                ...obraData,
                equipe: funcionarios,
                equipamentosAuxiliares: equipamentos,
                ultimaManutencao: new Date().toISOString().split("T")[0] 
              }
            : grua,
        ),
      )
    } else {
      const newGrua = {
        ...formData,
        ...obraData,
        id: `GRU${String(gruas.length + 1).padStart(3, "0")}`,
        ultimaManutencao: new Date().toISOString().split("T")[0],
        proximaManutencao: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        contratoAtivo: funcionarios.length > 0 || equipamentos.length > 0,
        inicioContrato: obraData.dataInicio || "",
        fimContrato: obraData.dataFim || "",
        prazoMeses: obraData.prazoMeses || 0,
        equipe: funcionarios,
        equipamentosAuxiliares: equipamentos,
      }
      setGruas([...gruas, newGrua])
    }

    setFormData({
      id: "",
      modelo: "",
      fabricante: "",
      tipo: "Grua Torre",
      capacidade: "",
      capacidadePonta: "",
      lanca: "",
      alturaTrabalho: "",
      ano: "",
      status: "Disponível",
      localizacao: "",
      cliente: "",
      operador: "",
      sinaleiro: "",
      horasOperacao: 0,
      valorLocacao: 0,
      valorOperacao: 0,
      valorSinaleiro: 0,
      valorManutencao: 0,
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
  }

  const handleEdit = (grua: any) => {
    setEditingGrua(grua)
    setFormData({
      id: grua.id,
      modelo: grua.modelo,
      fabricante: grua.fabricante,
      tipo: grua.tipo,
      capacidade: grua.capacidade,
      capacidadePonta: grua.capacidadePonta,
      lanca: grua.lanca,
      alturaTrabalho: grua.alturaTrabalho,
      ano: grua.ano,
      status: grua.status,
      localizacao: grua.localizacao,
      cliente: grua.cliente || "",
      operador: grua.operador || "",
      sinaleiro: grua.sinaleiro || "",
      horasOperacao: grua.horasOperacao,
      valorLocacao: grua.valorLocacao,
      valorOperacao: grua.valorOperacao,
      valorSinaleiro: grua.valorSinaleiro,
      valorManutencao: grua.valorManutencao,
    })
    
    setObraData({
      nomeObra: grua.nomeObra || "",
      enderecoObra: grua.enderecoObra || "",
      cidadeObra: grua.cidadeObra || "",
      cepObra: grua.cepObra || "",
      tipoObra: grua.tipoObra || "Residencial",
      contato: grua.contato || "",
      telefoneContato: grua.telefoneContato || "",
      emailContato: grua.emailContato || "",
      cnpjCliente: grua.cnpjCliente || "",
      prazoMeses: grua.prazoMeses || 6,
      dataInicio: grua.inicioContrato || "",
      dataFim: grua.fimContrato || "",
    })
    
    setFuncionarios(grua.equipe || [])
    setEquipamentos(grua.equipamentosAuxiliares || [])
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
      alturaFinal: grua.alturaTrabalho,
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
      selectedGrua.valorLocacao +
      selectedGrua.valorOperacao +
      selectedGrua.valorSinaleiro +
      selectedGrua.valorManutencao
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
                      <Label htmlFor="capacidadePonta">Capacidade na Ponta</Label>
                      <Input
                        id="capacidadePonta"
                        value={formData.capacidadePonta}
                        onChange={(e) => setFormData({ ...formData, capacidadePonta: e.target.value })}
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
                      <Label htmlFor="alturaTrabalho">Altura de Trabalho</Label>
                      <Input
                        id="alturaTrabalho"
                        value={formData.alturaTrabalho}
                        onChange={(e) => setFormData({ ...formData, alturaTrabalho: e.target.value })}
                        placeholder="Ex: 52 metros"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horasOperacao">Horas de Operação</Label>
                      <Input
                        id="horasOperacao"
                        type="number"
                        value={formData.horasOperacao}
                        onChange={(e) =>
                          setFormData({ ...formData, horasOperacao: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valorLocacao">Valor Locação (R$/mês)</Label>
                      <Input
                        id="valorLocacao"
                        type="number"
                        step="0.01"
                        value={formData.valorLocacao}
                        onChange={(e) =>
                          setFormData({ ...formData, valorLocacao: Number.parseFloat(e.target.value) || 0 })
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
                      <Input
                        id="cliente"
                        value={formData.cliente}
                        onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                        placeholder="Nome da empresa cliente"
                      />
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
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingGrua ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                {filteredGruas.map((grua) => (
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
                          onClick={() => {
                            setSelectedGrua(grua)
                            setIsDetalhesOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(grua)}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
                        <strong>Modelo:</strong> {selectedGrua.modelo}
                      </div>
                      <div>
                        <strong>Fabricante:</strong> {selectedGrua.fabricante}
                      </div>
                      <div>
                        <strong>Capacidade:</strong> {selectedGrua.capacidade}
                      </div>
                      <div>
                        <strong>Lança:</strong> {selectedGrua.lanca}
                      </div>
                      <div>
                        <strong>Altura:</strong> {selectedGrua.alturaTrabalho}
                      </div>
                      <div>
                        <strong>Status:</strong> {getStatusBadge(selectedGrua.status)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados da Obra</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <strong>Cliente:</strong> {selectedGrua.cliente}
                      </div>
                      <div>
                        <strong>Localização:</strong> {selectedGrua.localizacao}
                      </div>
                      <div>
                        <strong>Contrato Ativo:</strong> {selectedGrua.contratoAtivo ? "Sim" : "Não"}
                      </div>
                      {selectedGrua.contratoAtivo && (
                        <>
                          <div>
                            <strong>Início:</strong> {selectedGrua.inicioContrato}
                          </div>
                          <div>
                            <strong>Fim:</strong> {selectedGrua.fimContrato}
                          </div>
                          <div>
                            <strong>Prazo:</strong> {selectedGrua.prazoMeses} meses
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
                    {selectedGrua.equipamentosAuxiliares.length > 0 ? (
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
                    {selectedGrua.equipe.length > 0 ? (
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
                        <strong>Altura:</strong> {selectedGrua.alturaTrabalho}
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
                          <span>R$ {selectedGrua.valorLocacao.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Operação:</span>
                          <span>R$ {selectedGrua.valorOperacao.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sinaleiro:</span>
                          <span>R$ {selectedGrua.valorSinaleiro.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manutenção:</span>
                          <span>R$ {selectedGrua.valorManutencao.toLocaleString("pt-BR")}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-medium">
                          <span>Total Mensal:</span>
                          <span>
                            R${" "}
                            {(
                              selectedGrua.valorLocacao +
                              selectedGrua.valorOperacao +
                              selectedGrua.valorSinaleiro +
                              selectedGrua.valorManutencao
                            ).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Valor Total do Contrato:</h4>
                      <div className="text-2xl font-bold text-green-700">
                        R$ {calcularValorTotal().toLocaleString("pt-BR")}
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

      {/* Alertas de Manutenção */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Manutenções Programadas</p>
              <p className="text-sm text-yellow-700">
                {
                  gruas.filter((g) => {
                    const proximaManutencao = new Date(g.proximaManutencao)
                    const hoje = new Date()
                    const diasRestantes = Math.ceil(
                      (proximaManutencao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                    )
                    return diasRestantes <= 30
                  }).length
                }{" "}
                gruas precisam de manutenção nos próximos 30 dias
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
