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
    horasTrabalhadas: 8,
    horasExtras: 0,
    status: "Completo",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Jornada normal",
    localizacao: "Obra Centro-SP",
  },
  {
    id: "REG002",
    funcionario: "Maria Santos",
    data: "2024-01-22",
    entrada: "13:00",
    saidaAlmoco: "18:00",
    voltaAlmoco: "19:00",
    saida: "22:00",
    horasTrabalhadas: 8,
    horasExtras: 0,
    status: "Completo",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Turno noturno",
    localizacao: "Obra Zona Sul",
  },
  {
    id: "REG003",
    funcionario: "Carlos Oliveira",
    data: "2024-01-22",
    entrada: "07:15",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "17:00",
    horasTrabalhadas: 7.75,
    horasExtras: 0,
    status: "Atraso",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Atraso de 15 minutos",
    localizacao: "Obra Centro-SP",
  },
  {
    id: "REG004",
    funcionario: "Ana Costa",
    data: "2024-01-22",
    entrada: "08:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "20:00",
    horasTrabalhadas: 10,
    horasExtras: 2,
    status: "Pendente Aprovação",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Horas extras para finalizar relatório urgente",
    localizacao: "Escritório Central",
  },
  {
    id: "REG005",
    funcionario: "Pedro Lima",
    data: "2024-01-21",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "19:00",
    horasTrabalhadas: 10,
    horasExtras: 2,
    status: "Aprovado",
    aprovadoPor: "Carlos Supervisor",
    dataAprovacao: "2024-01-21T20:30:00",
    observacoes: "Supervisão de obra emergencial",
    localizacao: "Obra Zona Norte",
  },
  {
    id: "REG006",
    funcionario: "João Silva",
    data: "2024-01-20",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "21:00",
    horasTrabalhadas: 12,
    horasExtras: 4,
    status: "Aprovado",
    aprovadoPor: "Pedro Lima",
    dataAprovacao: "2024-01-20T21:15:00",
    observacoes: "Operação especial - montagem de grua",
    localizacao: "Obra Centro-SP",
  },
  {
    id: "REG007",
    funcionario: "Maria Santos",
    data: "2024-01-19",
    entrada: "13:00",
    saidaAlmoco: "18:00",
    voltaAlmoco: "19:00",
    saida: "23:00",
    horasTrabalhadas: 10,
    horasExtras: 2,
    status: "Rejeitado",
    aprovadoPor: "Pedro Lima",
    dataAprovacao: "2024-01-19T23:30:00",
    observacoes: "Horas extras não justificadas adequadamente",
    localizacao: "Obra Zona Sul",
  },
  {
    id: "REG008",
    funcionario: "Carlos Oliveira",
    data: "2024-01-18",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "18:00",
    horasTrabalhadas: 9,
    horasExtras: 1,
    status: "Aprovado",
    aprovadoPor: "Pedro Lima",
    dataAprovacao: "2024-01-18T18:30:00",
    observacoes: "Manutenção preventiva emergencial",
    localizacao: "Obra Centro-SP",
  },
  {
    id: "REG009",
    funcionario: "Ana Costa",
    data: "2024-01-17",
    entrada: "08:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "17:00",
    horasTrabalhadas: 8,
    horasExtras: 0,
    status: "Completo",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Jornada normal",
    localizacao: "Escritório Central",
  },
  {
    id: "REG010",
    funcionario: "Pedro Lima",
    data: "2024-01-16",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "20:00",
    horasTrabalhadas: 11,
    horasExtras: 3,
    status: "Aprovado",
    aprovadoPor: "Carlos Supervisor",
    dataAprovacao: "2024-01-16T20:15:00",
    observacoes: "Supervisão de obra com prazo apertado",
    localizacao: "Obra Zona Norte",
  },
  {
    id: "REG011",
    funcionario: "Maria Santos",
    data: "2024-01-15",
    entrada: "13:00",
    saidaAlmoco: "18:00",
    voltaAlmoco: "19:00",
    saida: "21:00",
    horasTrabalhadas: 8,
    horasExtras: 0,
    status: "Completo",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Turno noturno normal",
    localizacao: "Obra Zona Sul",
  },
  {
    id: "REG012",
    funcionario: "João Silva",
    data: "2024-01-14",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "19:00",
    horasTrabalhadas: 10,
    horasExtras: 2,
    status: "Pendente Aprovação",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Operação de descarga de equipamentos",
    localizacao: "Obra Centro-SP",
  },
  {
    id: "REG013",
    funcionario: "Carlos Oliveira",
    data: "2024-01-13",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "17:00",
    horasTrabalhadas: 8,
    horasExtras: 0,
    status: "Completo",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Jornada normal",
    localizacao: "Obra Centro-SP",
  },
  {
    id: "REG014",
    funcionario: "Ana Costa",
    data: "2024-01-12",
    entrada: "08:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "22:00",
    horasTrabalhadas: 12,
    horasExtras: 4,
    status: "Aprovado",
    aprovadoPor: "Pedro Lima",
    dataAprovacao: "2024-01-12T22:30:00",
    observacoes: "Relatório mensal urgente - finalização",
    localizacao: "Escritório Central",
  },
  {
    id: "REG015",
    funcionario: "Pedro Lima",
    data: "2024-01-11",
    entrada: "07:00",
    saidaAlmoco: "12:00",
    voltaAlmoco: "13:00",
    saida: "17:00",
    horasTrabalhadas: 8,
    horasExtras: 0,
    status: "Completo",
    aprovadoPor: null,
    dataAprovacao: null,
    observacoes: "Jornada normal",
    localizacao: "Obra Zona Norte",
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
  
  // Estados para filtros e ordenação
  const [filtroFuncionario, setFiltroFuncionario] = useState("todos")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [ordenacaoHorasExtras, setOrdenacaoHorasExtras] = useState("maior")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  
  // Estados para edição de registros
  const [isEditarOpen, setIsEditarOpen] = useState(false)
  const [registroEditando, setRegistroEditando] = useState<any>(null)
  const [dadosEdicao, setDadosEdicao] = useState({
    entrada: "",
    saidaAlmoco: "",
    voltaAlmoco: "",
    saida: "",
    observacoes: "",
    justificativa: "",
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

  const filteredRegistros = registrosPonto
    .filter((registro) => {
      // Filtro por termo de busca
      const matchesSearch = 
        (registro.funcionario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.data.includes(searchTerm) ||
        (registro.status || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro por funcionário
      const matchesFuncionario = 
        filtroFuncionario === "todos" || 
        registro.funcionario === filtroFuncionario
      
      // Filtro por data
      const registroData = new Date(registro.data)
      const dataInicio = filtroDataInicio ? new Date(filtroDataInicio) : null
      const dataFim = filtroDataFim ? new Date(filtroDataFim) : null
      
      const matchesData = 
        (!dataInicio || registroData >= dataInicio) &&
        (!dataFim || registroData <= dataFim)
      
      // Filtro por status
      const matchesStatus = 
        filtroStatus === "todos" || 
        registro.status === filtroStatus
      
      return matchesSearch && matchesFuncionario && matchesData && matchesStatus
    })
    .sort((a, b) => {
      // Ordenação por horas extras
      if (ordenacaoHorasExtras === "maior") {
        return (b.horasExtras || 0) - (a.horasExtras || 0)
      } else if (ordenacaoHorasExtras === "menor") {
        return (a.horasExtras || 0) - (b.horasExtras || 0)
      } else {
        // Ordenação por data (mais recente primeiro)
        return new Date(b.data).getTime() - new Date(a.data).getTime()
      }
    })

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
      case "Pendente Aprovação":
        return <Badge className="bg-orange-100 text-orange-800">Pendente Aprovação</Badge>
      case "Aprovado":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case "Rejeitado":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
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

  // Função para abrir modal de edição
  const abrirEdicao = (registro: any) => {
    setRegistroEditando(registro)
    setDadosEdicao({
      entrada: registro.entrada,
      saidaAlmoco: registro.saidaAlmoco,
      voltaAlmoco: registro.voltaAlmoco,
      saida: registro.saida,
      observacoes: registro.observacoes,
      justificativa: "",
    })
    setIsEditarOpen(true)
  }

  // Função para calcular horas trabalhadas
  const calcularHorasTrabalhadas = (entrada: string, saida: string, saidaAlmoco: string, voltaAlmoco: string) => {
    if (!entrada || !saida || !saidaAlmoco || !voltaAlmoco) return 0
    
    const entradaTime = new Date(`2000-01-01T${entrada}:00`)
    const saidaTime = new Date(`2000-01-01T${saida}:00`)
    const saidaAlmocoTime = new Date(`2000-01-01T${saidaAlmoco}:00`)
    const voltaAlmocoTime = new Date(`2000-01-01T${voltaAlmoco}:00`)
    
    const manha = (saidaAlmocoTime.getTime() - entradaTime.getTime()) / (1000 * 60 * 60)
    const tarde = (saidaTime.getTime() - voltaAlmocoTime.getTime()) / (1000 * 60 * 60)
    
    return Math.max(0, manha + tarde)
  }

  // Função para salvar edição
  const salvarEdicao = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registroEditando) return

    const horasTrabalhadas = calcularHorasTrabalhadas(
      dadosEdicao.entrada,
      dadosEdicao.saida,
      dadosEdicao.saidaAlmoco,
      dadosEdicao.voltaAlmoco
    )
    
    const horasExtras = Math.max(0, horasTrabalhadas - 8)
    
    // Atualizar o registro
    const registrosAtualizados = registrosPonto.map((registro) => {
      if (registro.id === registroEditando.id) {
        return {
          ...registro,
          entrada: dadosEdicao.entrada,
          saidaAlmoco: dadosEdicao.saidaAlmoco,
          voltaAlmoco: dadosEdicao.voltaAlmoco,
          saida: dadosEdicao.saida,
          horasTrabalhadas: Math.round(horasTrabalhadas * 100) / 100,
          horasExtras: horasExtras,
          observacoes: dadosEdicao.observacoes,
          status: horasExtras > 0 ? "Pendente Aprovação" : "Completo",
          aprovadoPor: horasExtras > 0 ? null : (registro.aprovadoPor || null),
          dataAprovacao: horasExtras > 0 ? null : (registro.dataAprovacao || null),
        }
      }
      return registro
    })
    
    setRegistrosPonto(registrosAtualizados as any)
    
    // Fechar modal e limpar dados
    setIsEditarOpen(false)
    setRegistroEditando(null)
    setDadosEdicao({
      entrada: "",
      saidaAlmoco: "",
      voltaAlmoco: "",
      saida: "",
      observacoes: "",
      justificativa: "",
    })
    
    alert("Registro atualizado com sucesso!")
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
      title: "Horas Extras Pendentes",
      value: registrosPonto.filter((r) => r.status === "Pendente Aprovação").length,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Total Horas Extras",
      value: registrosPonto.reduce((total, r) => total + (r.horasExtras || 0), 0),
      icon: Clock,
      color: "bg-purple-500",
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

        {/* Modal de Edição de Registro */}
        <Dialog open={isEditarOpen} onOpenChange={setIsEditarOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Registro de Ponto</DialogTitle>
              <DialogDescription>
                Edite os horários e adicione justificativas para o registro
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={salvarEdicao} className="space-y-4">
              {/* Informações do funcionário */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Funcionário</h3>
                <p className="text-lg font-medium">{registroEditando?.funcionario}</p>
                <p className="text-sm text-gray-600">
                  Data: {registroEditando?.data && new Date(registroEditando.data).toLocaleDateString("pt-BR")}
                </p>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entrada">Entrada</Label>
                  <Input
                    id="entrada"
                    type="time"
                    value={dadosEdicao.entrada}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, entrada: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saida">Saída</Label>
                  <Input
                    id="saida"
                    type="time"
                    value={dadosEdicao.saida}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, saida: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saidaAlmoco">Saída Almoço</Label>
                  <Input
                    id="saidaAlmoco"
                    type="time"
                    value={dadosEdicao.saidaAlmoco}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, saidaAlmoco: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voltaAlmoco">Volta Almoço</Label>
                  <Input
                    id="voltaAlmoco"
                    type="time"
                    value={dadosEdicao.voltaAlmoco}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, voltaAlmoco: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Cálculo automático de horas */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Cálculo Automático</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Horas Trabalhadas:</span>
                    <span className="ml-2 font-medium">
                      {calcularHorasTrabalhadas(
                        dadosEdicao.entrada,
                        dadosEdicao.saida,
                        dadosEdicao.saidaAlmoco,
                        dadosEdicao.voltaAlmoco
                      ).toFixed(2)}h
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Horas Extras:</span>
                    <span className="ml-2 font-medium text-orange-600">
                      +{Math.max(0, calcularHorasTrabalhadas(
                        dadosEdicao.entrada,
                        dadosEdicao.saida,
                        dadosEdicao.saidaAlmoco,
                        dadosEdicao.voltaAlmoco
                      ) - 8).toFixed(2)}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={dadosEdicao.observacoes}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, observacoes: e.target.value })}
                  placeholder="Descreva as observações sobre o registro..."
                  rows={3}
                />
              </div>

              {/* Justificativa */}
              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa da Alteração</Label>
                <Textarea
                  id="justificativa"
                  value={dadosEdicao.justificativa}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, justificativa: e.target.value })}
                  placeholder="Explique o motivo da alteração nos horários..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditarOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Salvar Alterações
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
          <TabsTrigger value="horas-extras">Controle de Horas Extras</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Registros</CardTitle>
              <CardDescription>Visualize todos os registros de ponto dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {/* Barra de busca */}
                <div className="flex items-center gap-4">
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

                {/* Filtros avançados */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Filtro por funcionário */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-funcionario">Funcionário</Label>
                    <Select
                      value={filtroFuncionario}
                      onValueChange={setFiltroFuncionario}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os funcionários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os funcionários</SelectItem>
                        {funcionariosData.map((func) => (
                          <SelectItem key={func.id} value={func.nome}>
                            {func.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por data início */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-data-inicio">Data Início</Label>
                    <Input
                      id="filtro-data-inicio"
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                    />
                  </div>

                  {/* Filtro por data fim */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-data-fim">Data Fim</Label>
                    <Input
                      id="filtro-data-fim"
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                    />
                  </div>

                  {/* Filtro por status */}
                  <div className="space-y-2">
                    <Label htmlFor="filtro-status">Status</Label>
                    <Select
                      value={filtroStatus}
                      onValueChange={setFiltroStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="Completo">Completo</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Atraso">Atraso</SelectItem>
                        <SelectItem value="Falta">Falta</SelectItem>
                        <SelectItem value="Pendente Aprovação">Pendente Aprovação</SelectItem>
                        <SelectItem value="Aprovado">Aprovado</SelectItem>
                        <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordenação por horas extras */}
                  <div className="space-y-2">
                    <Label htmlFor="ordenacao-horas">Ordenar por Horas Extras</Label>
                    <Select
                      value={ordenacaoHorasExtras}
                      onValueChange={setOrdenacaoHorasExtras}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data">Mais Recente</SelectItem>
                        <SelectItem value="maior">Maior Número de Horas Extras</SelectItem>
                        <SelectItem value="menor">Menor Número de Horas Extras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botão para limpar filtros */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiltroFuncionario("todos")
                      setFiltroDataInicio("")
                      setFiltroDataFim("")
                      setFiltroStatus("todos")
                      setOrdenacaoHorasExtras("maior")
                      setSearchTerm("")
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>

                {/* Indicador de resultados */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {filteredRegistros.length} registro(s) encontrado(s)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {filtroFuncionario !== "todos" && `Funcionário: ${filtroFuncionario}`}
                    {filtroDataInicio && ` | Período: ${filtroDataInicio} até ${filtroDataFim || "hoje"}`}
                    {filtroStatus !== "todos" && ` | Status: ${filtroStatus}`}
                    {ordenacaoHorasExtras === "maior" && " | Ordenado: Maior horas extras"}
                    {ordenacaoHorasExtras === "menor" && " | Ordenado: Menor horas extras"}
                    {ordenacaoHorasExtras === "data" && " | Ordenado: Mais recente"}
                  </div>
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
                      <TableHead>Horas Extras</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aprovado Por</TableHead>
                      <TableHead>Data Aprovação</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead>Ações</TableHead>
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
                        <TableCell>
                          <Badge variant="outline">
                            {registro.horasTrabalhadas}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {registro.horasExtras > 0 ? (
                            <Badge className="bg-orange-100 text-orange-800">
                              +{registro.horasExtras}h
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{registro.localizacao}</TableCell>
                        <TableCell>{getStatusBadge(registro.status)}</TableCell>
                        <TableCell>
                          {registro.aprovadoPor ? (
                            <span className="text-sm font-medium">{registro.aprovadoPor}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.dataAprovacao ? (
                            <span className="text-sm">
                              {new Date(registro.dataAprovacao).toLocaleDateString("pt-BR")} às{" "}
                              {new Date(registro.dataAprovacao).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{registro.observacoes}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirEdicao(registro)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Editar
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

        <TabsContent value="horas-extras">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Horas Extras</CardTitle>
              <CardDescription>Gerencie e aprove horas extras dos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Filtros */}
                <div className="flex gap-4">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente Aprovação</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os funcionários</SelectItem>
                      {funcionariosData.map((func) => (
                        <SelectItem key={func.id} value={func.nome}>
                          {func.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabela de Horas Extras */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Horas Trabalhadas</TableHead>
                        <TableHead>Horas Extras</TableHead>
                        <TableHead>Justificativa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aprovado Por</TableHead>
                        <TableHead>Data Aprovação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrosPonto
                        .filter((r) => r.horasExtras > 0)
                        .map((registro) => (
                          <TableRow key={registro.id}>
                            <TableCell className="font-medium">{registro.funcionario}</TableCell>
                            <TableCell>{new Date(registro.data).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {registro.horasTrabalhadas}h
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-orange-100 text-orange-800">
                                +{registro.horasExtras}h
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{registro.observacoes}</TableCell>
                            <TableCell>{getStatusBadge(registro.status)}</TableCell>
                            <TableCell>
                              {registro.aprovadoPor ? (
                                <span className="text-sm font-medium">{registro.aprovadoPor}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {registro.dataAprovacao ? (
                                <span className="text-sm">
                                  {new Date(registro.dataAprovacao).toLocaleDateString("pt-BR")} às{" "}
                                  {new Date(registro.dataAprovacao).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {registro.status === "Pendente Aprovação" && (
                                <div className="flex gap-2">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    Aprovar
                                  </Button>
                                  <Button size="sm" variant="destructive">
                                    Rejeitar
                                  </Button>
                                </div>
                              )}
                              {registro.status === "Aprovado" && (
                                <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
                              )}
                              {registro.status === "Rejeitado" && (
                                <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Resumo de Horas Extras */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pendentes</p>
                          <p className="text-2xl font-bold">
                            {registrosPonto.filter((r) => r.status === "Pendente Aprovação").length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Aprovadas</p>
                          <p className="text-2xl font-bold">
                            {registrosPonto.filter((r) => r.status === "Aprovado").length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Horas</p>
                          <p className="text-2xl font-bold">
                            {registrosPonto.reduce((total, r) => total + (r.horasExtras || 0), 0)}h
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
