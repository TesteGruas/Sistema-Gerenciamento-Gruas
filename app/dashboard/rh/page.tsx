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
import { Users, Plus, Search, Edit, Award, DollarSign, Phone, Mail, Briefcase } from "lucide-react"

// Dados simulados dos funcionários
const funcionariosData = [
  {
    id: "FUNC001",
    nome: "João Silva",
    cpf: "123.456.789-00",
    email: "joao.silva@irbana.com.br",
    telefone: "(11) 99999-1111",
    endereco: "Rua das Flores, 123 - São Paulo/SP",
    cargo: "Operador de Grua",
    departamento: "Operações",
    dataAdmissao: "2023-01-15",
    salario: 4500.0,
    status: "Ativo",
    supervisor: "Pedro Lima",
    escolaridade: "Ensino Médio Completo",
    estadoCivil: "Casado",
    dependentes: 2,
  },
  {
    id: "FUNC002",
    nome: "Maria Santos",
    cpf: "987.654.321-00",
    email: "maria.santos@irbana.com.br",
    telefone: "(11) 99999-2222",
    endereco: "Av. Paulista, 456 - São Paulo/SP",
    cargo: "Operadora de Grua",
    departamento: "Operações",
    dataAdmissao: "2023-03-20",
    salario: 4500.0,
    status: "Ativo",
    supervisor: "Pedro Lima",
    escolaridade: "Ensino Médio Completo",
    estadoCivil: "Solteira",
    dependentes: 0,
  },
  {
    id: "FUNC003",
    nome: "Carlos Oliveira",
    cpf: "456.789.123-00",
    email: "carlos.oliveira@irbana.com.br",
    telefone: "(11) 99999-3333",
    endereco: "Rua da Consolação, 789 - São Paulo/SP",
    cargo: "Mecânico",
    departamento: "Manutenção",
    dataAdmissao: "2022-08-10",
    salario: 3800.0,
    status: "Ativo",
    supervisor: "Pedro Lima",
    escolaridade: "Técnico em Mecânica",
    estadoCivil: "Casado",
    dependentes: 1,
  },
  {
    id: "FUNC004",
    nome: "Ana Costa",
    cpf: "789.123.456-00",
    email: "ana.costa@irbana.com.br",
    telefone: "(11) 99999-4444",
    endereco: "Rua Augusta, 321 - São Paulo/SP",
    cargo: "Auxiliar Administrativo",
    departamento: "Administrativo",
    dataAdmissao: "2023-05-01",
    salario: 2800.0,
    status: "Ativo",
    supervisor: "Pedro Lima",
    escolaridade: "Superior Completo",
    estadoCivil: "Solteira",
    dependentes: 0,
  },
  {
    id: "FUNC005",
    nome: "Pedro Lima",
    cpf: "321.654.987-00",
    email: "pedro.lima@irbana.com.br",
    telefone: "(11) 99999-5555",
    endereco: "Rua Frei Caneca, 654 - São Paulo/SP",
    cargo: "Supervisor",
    departamento: "Operações",
    dataAdmissao: "2021-11-15",
    salario: 6500.0,
    status: "Ativo",
    supervisor: "-",
    escolaridade: "Superior Completo",
    estadoCivil: "Casado",
    dependentes: 3,
  },
]

// Dados de avaliações
const avaliacoesData = [
  {
    id: "AVAL001",
    funcionario: "João Silva",
    periodo: "2024 - 1º Semestre",
    avaliador: "Pedro Lima",
    pontuacao: 8.5,
    status: "Concluída",
    observacoes: "Excelente desempenho operacional, pontual e dedicado.",
  },
  {
    id: "AVAL002",
    funcionario: "Maria Santos",
    periodo: "2024 - 1º Semestre",
    avaliador: "Pedro Lima",
    pontuacao: 9.0,
    status: "Concluída",
    observacoes: "Funcionária exemplar, demonstra liderança e iniciativa.",
  },
  {
    id: "AVAL003",
    funcionario: "Carlos Oliveira",
    periodo: "2024 - 1º Semestre",
    avaliador: "Pedro Lima",
    pontuacao: 7.8,
    status: "Em Andamento",
    observacoes: "Bom conhecimento técnico, pode melhorar comunicação.",
  },
]

export default function RHPage() {
  const [funcionarios, setFuncionarios] = useState(funcionariosData)
  const [avaliacoes, setAvaliacoes] = useState(avaliacoesData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAvaliacaoOpen, setIsAvaliacaoOpen] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState<any>(null)

  // Formulário para funcionário
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    endereco: "",
    cargo: "",
    departamento: "",
    salario: 0,
    supervisor: "",
    escolaridade: "",
    estadoCivil: "",
    dependentes: 0,
  })

  // Formulário para avaliação
  const [avaliacaoData, setAvaliacaoData] = useState({
    funcionario: "",
    periodo: "",
    pontuacao: 0,
    observacoes: "",
  })

  const filteredFuncionarios = funcionarios.filter(
    (func) =>
      func.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.departamento.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "Inativo":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>
      case "Férias":
        return <Badge className="bg-blue-100 text-blue-800">Férias</Badge>
      case "Afastado":
        return <Badge className="bg-yellow-100 text-yellow-800">Afastado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPontuacaoBadge = (pontuacao: number) => {
    if (pontuacao >= 9) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
    if (pontuacao >= 8) return <Badge className="bg-blue-100 text-blue-800">Muito Bom</Badge>
    if (pontuacao >= 7) return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>
    return <Badge className="bg-red-100 text-red-800">Precisa Melhorar</Badge>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingFuncionario) {
      setFuncionarios(
        funcionarios.map((func) =>
          func.id === editingFuncionario.id
            ? { ...func, ...formData, dataAdmissao: func.dataAdmissao, status: "Ativo" }
            : func,
        ),
      )
    } else {
      const newFuncionario = {
        ...formData,
        id: `FUNC${String(funcionarios.length + 1).padStart(3, "0")}`,
        dataAdmissao: new Date().toISOString().split("T")[0],
        status: "Ativo",
      }
      setFuncionarios([...funcionarios, newFuncionario])
    }

    setFormData({
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      endereco: "",
      cargo: "",
      departamento: "",
      salario: 0,
      supervisor: "",
      escolaridade: "",
      estadoCivil: "",
      dependentes: 0,
    })
    setEditingFuncionario(null)
    setIsDialogOpen(false)
  }

  const handleAvaliacao = (e: React.FormEvent) => {
    e.preventDefault()
    const newAvaliacao = {
      ...avaliacaoData,
      id: `AVAL${String(avaliacoes.length + 1).padStart(3, "0")}`,
      avaliador: "Pedro Lima", // Simulado
      status: "Concluída",
    }
    setAvaliacoes([...avaliacoes, newAvaliacao])

    setAvaliacaoData({
      funcionario: "",
      periodo: "",
      pontuacao: 0,
      observacoes: "",
    })
    setIsAvaliacaoOpen(false)
  }

  const handleEdit = (funcionario: any) => {
    setEditingFuncionario(funcionario)
    setFormData({
      nome: funcionario.nome,
      cpf: funcionario.cpf,
      email: funcionario.email,
      telefone: funcionario.telefone,
      endereco: funcionario.endereco,
      cargo: funcionario.cargo,
      departamento: funcionario.departamento,
      salario: funcionario.salario,
      supervisor: funcionario.supervisor,
      escolaridade: funcionario.escolaridade,
      estadoCivil: funcionario.estadoCivil,
      dependentes: funcionario.dependentes,
    })
    setIsDialogOpen(true)
  }

  const stats = [
    { title: "Total Funcionários", value: funcionarios.length, icon: Users, color: "bg-blue-500" },
    {
      title: "Funcionários Ativos",
      value: funcionarios.filter((f) => f.status === "Ativo").length,
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Departamentos",
      value: new Set(funcionarios.map((f) => f.departamento)).size,
      icon: Briefcase,
      color: "bg-purple-500",
    },
    {
      title: "Folha Salarial",
      value: `R$ ${funcionarios.reduce((acc, f) => acc + f.salario, 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-yellow-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="text-gray-600">Gestão completa de funcionários e processos de RH</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAvaliacaoOpen} onOpenChange={setIsAvaliacaoOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
                <Award className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Avaliação</DialogTitle>
                <DialogDescription>Registre uma nova avaliação de desempenho</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAvaliacao} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="funcionario">Funcionário</Label>
                  <Select
                    value={avaliacaoData.funcionario}
                    onValueChange={(value) => setAvaliacaoData({ ...avaliacaoData, funcionario: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((func) => (
                        <SelectItem key={func.id} value={func.nome}>
                          {func.nome} - {func.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodo">Período</Label>
                    <Input
                      id="periodo"
                      value={avaliacaoData.periodo}
                      onChange={(e) => setAvaliacaoData({ ...avaliacaoData, periodo: e.target.value })}
                      placeholder="Ex: 2024 - 1º Semestre"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pontuacao">Pontuação (0-10)</Label>
                    <Input
                      id="pontuacao"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={avaliacaoData.pontuacao}
                      onChange={(e) =>
                        setAvaliacaoData({ ...avaliacaoData, pontuacao: Number.parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={avaliacaoData.observacoes}
                    onChange={(e) => setAvaliacaoData({ ...avaliacaoData, observacoes: e.target.value })}
                    placeholder="Comentários sobre o desempenho..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAvaliacaoOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFuncionario ? "Editar Funcionário" : "Cadastrar Novo Funcionário"}</DialogTitle>
                <DialogDescription>
                  {editingFuncionario
                    ? "Atualize as informações do funcionário"
                    : "Preencha os dados do novo funcionário"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Select
                      value={formData.departamento}
                      onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operações">Operações</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Administrativo">Administrativo</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salario">Salário (R$)</Label>
                    <Input
                      id="salario"
                      type="number"
                      step="0.01"
                      value={formData.salario}
                      onChange={(e) => setFormData({ ...formData, salario: Number.parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <Input
                      id="supervisor"
                      value={formData.supervisor}
                      onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="escolaridade">Escolaridade</Label>
                    <Select
                      value={formData.escolaridade}
                      onValueChange={(value) => setFormData({ ...formData, escolaridade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                        <SelectItem value="Ensino Médio Completo">Ensino Médio Completo</SelectItem>
                        <SelectItem value="Técnico">Técnico</SelectItem>
                        <SelectItem value="Superior Incompleto">Superior Incompleto</SelectItem>
                        <SelectItem value="Superior Completo">Superior Completo</SelectItem>
                        <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estadoCivil">Estado Civil</Label>
                    <Select
                      value={formData.estadoCivil}
                      onValueChange={(value) => setFormData({ ...formData, estadoCivil: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                        <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                        <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                        <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dependentes">Número de Dependentes</Label>
                  <Input
                    id="dependentes"
                    type="number"
                    min="0"
                    value={formData.dependentes}
                    onChange={(e) => setFormData({ ...formData, dependentes: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingFuncionario ? "Atualizar" : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="funcionarios" className="space-y-6">
        <TabsList>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
          <TabsTrigger value="organograma">Organograma</TabsTrigger>
        </TabsList>

        <TabsContent value="funcionarios">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Funcionários</CardTitle>
              <CardDescription>Visualize e gerencie todos os funcionários da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, cargo ou departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead>Salário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFuncionarios.map((funcionario) => (
                      <TableRow key={funcionario.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{funcionario.nome}</p>
                            <p className="text-sm text-gray-500">{funcionario.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{funcionario.cargo}</TableCell>
                        <TableCell>{funcionario.departamento}</TableCell>
                        <TableCell>{new Date(funcionario.dataAdmissao).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>R$ {funcionario.salario.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(funcionario.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {funcionario.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {funcionario.telefone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(funcionario)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avaliacoes">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações de Desempenho</CardTitle>
              <CardDescription>Acompanhe as avaliações de desempenho dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Avaliador</TableHead>
                      <TableHead>Pontuação</TableHead>
                      <TableHead>Classificação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avaliacoes.map((avaliacao) => (
                      <TableRow key={avaliacao.id}>
                        <TableCell className="font-medium">{avaliacao.funcionario}</TableCell>
                        <TableCell>{avaliacao.periodo}</TableCell>
                        <TableCell>{avaliacao.avaliador}</TableCell>
                        <TableCell>{avaliacao.pontuacao.toFixed(1)}</TableCell>
                        <TableCell>{getPontuacaoBadge(avaliacao.pontuacao)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              avaliacao.status === "Concluída"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {avaliacao.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{avaliacao.observacoes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organograma">
          <Card>
            <CardHeader>
              <CardTitle>Organograma</CardTitle>
              <CardDescription>Estrutura organizacional da empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Direção */}
                <div className="text-center">
                  <Card className="inline-block">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Direção Geral</p>
                          <p className="text-sm text-gray-500">IRBANA COPAS</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Supervisão */}
                <div className="text-center">
                  <Card className="inline-block">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Pedro Lima</p>
                          <p className="text-sm text-gray-500">Supervisor Geral</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Departamentos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Operações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">João Silva</p>
                          <p className="text-xs text-gray-500">Operador de Grua</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Maria Santos</p>
                          <p className="text-xs text-gray-500">Operadora de Grua</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Manutenção</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Carlos Oliveira</p>
                          <p className="text-xs text-gray-500">Mecânico</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Administrativo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Ana Costa</p>
                          <p className="text-xs text-gray-500">Auxiliar Administrativo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
