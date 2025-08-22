"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Clock, Play, Square, Coffee, User, AlertCircle, CheckCircle, Search, FileText } from "lucide-react"

// Dados simulados dos funcionários
const funcionariosData = [
  { id: "FUNC001", nome: "João Silva", cargo: "Operador de Grua", turno: "Manhã" },
  { id: "FUNC002", nome: "Maria Santos", cargo: "Operadora de Grua", turno: "Tarde" },
  { id: "FUNC003", nome: "Carlos Oliveira", cargo: "Mecânico", turno: "Manhã" },
  { id: "FUNC004", nome: "Ana Costa", cargo: "Auxiliar Administrativo", turno: "Integral" },
  { id: "FUNC005", nome: "Pedro Lima", cargo: "Supervisor", turno: "Integral" },
]

// Dados simulados dos registros de ponto
const registrosPontoData = [
  {
    id: "REG001",
    funcionario: "João Silva",
    data: "2024-01-22",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "17:00",
    horasTrabalhadas: "09:00",
    status: "Completo",
  },
  {
    id: "REG002",
    funcionario: "Maria Santos",
    data: "2024-01-22",
    entrada: "13:00",
    saidaAlmoco: "-",
    voltaAlmoco: "-",
    saida: "22:00",
    horasTrabalhadas: "09:00",
    status: "Completo",
  },
  {
    id: "REG003",
    funcionario: "Carlos Oliveira",
    data: "2024-01-22",
    entrada: "07:15",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "17:00",
    horasTrabalhadas: "08:45",
    status: "Atraso",
  },
  {
    id: "REG004",
    funcionario: "Ana Costa",
    data: "2024-01-22",
    entrada: "08:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "-",
    horasTrabalhadas: "-",
    status: "Em Andamento",
  },
]

export default function PontoPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedFuncionario, setSelectedFuncionario] = useState("")
  const [registrosPonto, setRegistrosPonto] = useState(registrosPontoData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isJustificativaOpen, setIsJustificativaOpen] = useState(false)
  const [justificativaData, setJustificativaData] = useState({
    funcionario: "",
    data: "",
    tipo: "",
    motivo: "",
  })

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const registrarPonto = (tipo: string) => {
    if (!selectedFuncionario) {
      alert("Selecione um funcionário")
      return
    }

    const agora = new Date()
    const horaAtual = agora.toTimeString().slice(0, 5)
    const dataAtual = agora.toISOString().split("T")[0]

    // Simular registro de ponto
    alert(`Ponto registrado: ${tipo} às ${horaAtual} para ${selectedFuncionario}`)

    // Aqui seria feita a integração com o backend
    console.log(`Registrando ponto: ${tipo} - ${selectedFuncionario} - ${horaAtual}`)
  }

  const filteredRegistros = registrosPonto.filter(
    (registro) =>
      registro.funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.data.includes(searchTerm) ||
      registro.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completo":
        return <Badge className="bg-green-100 text-green-800">Completo</Badge>
      case "Em Andamento":
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
      case "Atraso":
        return <Badge className="bg-yellow-100 text-yellow-800">Atraso</Badge>
      case "Falta":
        return <Badge className="bg-red-100 text-red-800">Falta</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleJustificativa = (e: React.FormEvent) => {
    e.preventDefault()
    // Simular envio de justificativa
    alert("Justificativa enviada com sucesso!")
    setJustificativaData({
      funcionario: "",
      data: "",
      tipo: "",
      motivo: "",
    })
    setIsJustificativaOpen(false)
  }

  const stats = [
    {
      title: "Funcionários Presentes",
      value: registrosPonto.filter((r) => r.status === "Em Andamento" || r.status === "Completo").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Atrasos Hoje",
      value: registrosPonto.filter((r) => r.status === "Atraso").length,
      icon: AlertCircle,
      color: "bg-yellow-500",
    },
    {
      title: "Faltas Hoje",
      value: registrosPonto.filter((r) => r.status === "Falta").length,
      icon: User,
      color: "bg-red-500",
    },
    {
      title: "Total Funcionários",
      value: funcionariosData.length,
      icon: User,
      color: "bg-blue-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ponto Eletrônico</h1>
          <p className="text-gray-600">Sistema de controle de frequência dos funcionários</p>
        </div>
        <Dialog open={isJustificativaOpen} onOpenChange={setIsJustificativaOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
              <FileText className="w-4 h-4 mr-2" />
              Justificativa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Justificativa</DialogTitle>
              <DialogDescription>Registre justificativas para atrasos, faltas ou saídas antecipadas</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJustificativa} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="funcionario">Funcionário</Label>
                <Select
                  value={justificativaData.funcionario}
                  onValueChange={(value) => setJustificativaData({ ...justificativaData, funcionario: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionariosData.map((func) => (
                      <SelectItem key={func.id} value={func.nome}>
                        {func.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={justificativaData.data}
                    onChange={(e) => setJustificativaData({ ...justificativaData, data: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={justificativaData.tipo}
                    onValueChange={(value) => setJustificativaData({ ...justificativaData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atraso">Atraso</SelectItem>
                      <SelectItem value="Falta">Falta</SelectItem>
                      <SelectItem value="Saída Antecipada">Saída Antecipada</SelectItem>
                      <SelectItem value="Ausência Parcial">Ausência Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea
                  id="motivo"
                  value={justificativaData.motivo}
                  onChange={(e) => setJustificativaData({ ...justificativaData, motivo: e.target.value })}
                  placeholder="Descreva o motivo da justificativa..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsJustificativaOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Registrar
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registro de Ponto */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Registrar Ponto
            </CardTitle>
            <CardDescription>Registre entrada, saída e intervalos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Relógio Digital */}
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-blue-600">{currentTime.toTimeString().slice(0, 8)}</div>
              <div className="text-sm text-gray-500 mt-1">
                {currentTime.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Seleção de Funcionário */}
            <div className="space-y-2">
              <Label htmlFor="funcionario">Funcionário</Label>
              <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu nome" />
                </SelectTrigger>
                <SelectContent>
                  {funcionariosData.map((func) => (
                    <SelectItem key={func.id} value={func.nome}>
                      {func.nome} - {func.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botões de Registro */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => registrarPonto("Entrada")}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Entrada
              </Button>
              <Button
                onClick={() => registrarPonto("Saída")}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Saída
              </Button>
              <Button
                onClick={() => registrarPonto("Saída Almoço")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Coffee className="w-4 h-4" />
                Saída Almoço
              </Button>
              <Button
                onClick={() => registrarPonto("Volta Almoço")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Coffee className="w-4 h-4" />
                Volta Almoço
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registros Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registros de Hoje</CardTitle>
            <CardDescription>Acompanhe os registros de ponto do dia atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrosPonto.slice(0, 4).map((registro) => (
                <div key={registro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{registro.funcionario}</p>
                      <p className="text-sm text-gray-500">
                        Entrada: {registro.entrada} | Saída: {registro.saida || "Em andamento"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(registro.status)}
                    <p className="text-sm text-gray-500 mt-1">Horas: {registro.horasTrabalhadas || "Calculando..."}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registros" className="space-y-6">
        <TabsList>
          <TabsTrigger value="registros">Registros de Ponto</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Registros</CardTitle>
              <CardDescription>Visualize todos os registros de ponto dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por funcionário, data ou status..."
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
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída Almoço</TableHead>
                      <TableHead>Volta Almoço</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Horas Trabalhadas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistros.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell className="font-medium">{registro.funcionario}</TableCell>
                        <TableCell>{new Date(registro.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{registro.entrada}</TableCell>
                        <TableCell>{registro.saidaAlmoco}</TableCell>
                        <TableCell>{registro.voltaAlmoco}</TableCell>
                        <TableCell>{registro.saida}</TableCell>
                        <TableCell>{registro.horasTrabalhadas}</TableCell>
                        <TableCell>{getStatusBadge(registro.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorio">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Mensal</CardTitle>
              <CardDescription>Resumo das horas trabalhadas e frequência dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {funcionariosData.map((func) => (
                  <Card key={func.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{func.nome}</p>
                          <p className="text-sm text-gray-500">{func.cargo}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Horas Trabalhadas:</span>
                          <span className="font-medium">176h 30m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Dias Presentes:</span>
                          <span className="font-medium">22 dias</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Atrasos:</span>
                          <span className="font-medium text-yellow-600">2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Faltas:</span>
                          <span className="font-medium text-red-600">0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
