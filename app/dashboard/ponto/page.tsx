"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Clock, Play, Square, Coffee, User, AlertCircle, CheckCircle, Search, FileText, Check, X } from "lucide-react"
import { 
  apiFuncionarios, 
  apiRegistrosPonto, 
  apiJustificativas,
  apiRelatorios,
  utilsPonto,
  type Funcionario,
  type RegistroPonto,
  type Justificativa
} from "@/lib/api-ponto-eletronico"
import { ExportButton } from "@/components/export-button"

// Estado inicial dos dados
const estadoInicial = {
  funcionarios: [] as Funcionario[],
  registrosPonto: [] as RegistroPonto[],
  justificativas: [] as Justificativa[],
  loading: false,
  error: null as string | null,
  isAdmin: false,
  usuarioAtual: null as { id: number, nome: string } | null
}

export default function PontoPage() {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState("")
  const [data, setData] = useState(estadoInicial)
  const [searchTerm, setSearchTerm] = useState("")
  const [isJustificativaOpen, setIsJustificativaOpen] = useState(false)
  const [justificativaData, setJustificativaData] = useState({
    funcionario_id: "",
    data: "",
    tipo: "",
    motivo: "",
  })
  
  // Estados para filtros e ordenação
  const [filtroFuncionario, setFiltroFuncionario] = useState("todos")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [ordenacaoHorasExtras, setOrdenacaoHorasExtras] = useState("data") // Ordenar por data (mais recente primeiro)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  
  // Estados para edição de registros
  const [isEditarOpen, setIsEditarOpen] = useState(false)
  const [registroEditando, setRegistroEditando] = useState<RegistroPonto | null>(null)
  const [dadosEdicao, setDadosEdicao] = useState({
    entrada: "",
    saida_almoco: "",
    volta_almoco: "",
    saida: "",
    observacoes: "",
    justificativa_alteracao: "",
  })

  // Atualizar relógio a cada segundo (apenas no cliente)
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
  }, [])

  // Debug dos registros e filtros (apenas uma vez após carregar)
  useEffect(() => {
    if (data.registrosPonto.length > 0) {
      console.log('🔍 Debug após carregamento:')
      console.log('  Total registros:', data.registrosPonto.length)
      console.log('  Filtros:', { filtroFuncionario, filtroStatus, filtroDataInicio, filtroDataFim, searchTerm })
    }
  }, [data.registrosPonto.length])

  // Função para carregar dados da API
  const carregarDados = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // ID do usuário atual (em um sistema real, isso viria do contexto de autenticação)
      const usuarioId = 2 // Hardcoded para exemplo - usuário admin
      
      // Carregar funcionários com verificação de admin e outros dados em paralelo
      const [funcionariosResponse, registrosResponse, justificativasResponse] = await Promise.all([
        apiFuncionarios.listarParaPonto(usuarioId),
        apiRegistrosPonto.listar({ limit: 500 }), // Aumentado para 500 registros
        apiJustificativas.listar({})
      ])

      // Verificar se a resposta tem a estrutura esperada
      const isAdmin = funcionariosResponse?.isAdmin || false
      const funcionarios = funcionariosResponse?.funcionarios || []

      // Definir usuário atual (primeiro funcionário da lista se não for admin)
      const usuarioAtual = isAdmin 
        ? null 
        : funcionarios[0] || null

      const registros = registrosResponse.data || []
      console.log('📊 Total de registros carregados:', registros.length)
      console.log('📅 Primeiros 5 registros:', registros.slice(0, 5).map(r => ({
        id: r.id,
        funcionario: r.funcionario?.nome,
        data: r.data,
        entrada: r.entrada,
        status: r.status
      })))
      
      setData(prev => ({
        ...prev,
        funcionarios: funcionarios,
        registrosPonto: registros,
        justificativas: justificativasResponse.data || [],
        isAdmin: isAdmin,
        usuarioAtual,
        loading: false
      }))

      // Se não for admin, selecionar automaticamente o próprio usuário
      if (!isAdmin && usuarioAtual) {
        setSelectedFuncionario(usuarioAtual.id.toString())
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados'
      }))
    }
  }

  // Função para mapear tipos de registro para campos da API
  const mapearTipoParaCampo = (tipo: string) => {
    const mapeamento: { [key: string]: string } = {
      'Entrada': 'entrada',
      'Saída': 'saida',
      'Saída Almoço': 'saida_almoco',
      'Volta Almoço': 'volta_almoco'
    }
    return mapeamento[tipo] || tipo.toLowerCase().replace(' ', '_')
  }

  // Função para verificar o status do registro atual
  const getStatusRegistroAtual = () => {
    if (!selectedFuncionario) return null

    const agora = new Date()
    const dataAtual = agora.toISOString().split("T")[0]

    const registrosHoje = data.registrosPonto.filter(
      r => r.funcionario_id === parseInt(selectedFuncionario) && r.data === dataAtual
    )

    if (registrosHoje.length === 0) return null

    const registro = registrosHoje[0]
    return {
      temEntrada: !!registro.entrada,
      temSaida: !!registro.saida,
      temSaidaAlmoco: !!registro.saida_almoco,
      temVoltaAlmoco: !!registro.volta_almoco,
      registro
    }
  }

  const registrarPonto = async (tipo: string) => {
    if (!selectedFuncionario) {
      toast({
        title: "Informação",
        description: "Selecione um funcionário",
        variant: "default"
      })
      return
    }

    const agora = new Date()
    const horaAtual = agora.toTimeString().slice(0, 5)
    const dataAtual = agora.toISOString().split("T")[0]

    try {
      // Buscar registro existente para hoje
      const registrosHoje = data.registrosPonto.filter(
        r => r.funcionario_id === parseInt(selectedFuncionario) && r.data === dataAtual
      )

      let registroAtual = registrosHoje[0]

      if (!registroAtual) {
        // Criar novo registro
        const novoRegistro = await apiRegistrosPonto.criar({
          funcionario_id: parseInt(selectedFuncionario),
          data: dataAtual,
          [mapearTipoParaCampo(tipo)]: horaAtual,
          localizacao: "Sistema Web"
        })
        
        registroAtual = novoRegistro
        setData(prev => ({
          ...prev,
          registrosPonto: [novoRegistro, ...prev.registrosPonto]
        }))
      } else {
        // Atualizar registro existente
        const dadosAtualizacao: any = {
          [mapearTipoParaCampo(tipo)]: horaAtual,
          justificativa_alteracao: `Registro automático de ${tipo}`
        }

        const registroAtualizado = await apiRegistrosPonto.atualizar(registroAtual.id, dadosAtualizacao)
        
        setData(prev => ({
          ...prev,
          registrosPonto: prev.registrosPonto.map(r => 
            r.id === registroAtualizado.id ? registroAtualizado : r
          )
        }))
      }

      toast({
        title: "Informação",
        description: "Ponto registrado: ${tipo} às ${horaAtual}",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao registrar ponto:', error)
      toast({
        title: "Informação",
        description: "Erro ao registrar ponto. Tente novamente.",
        variant: "default"
      })
    }
  }

  const filteredRegistros = data.registrosPonto
    .filter((registro) => {
      // Filtro por termo de busca
      const matchesSearch = 
        (registro.funcionario?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        registro.data.includes(searchTerm) ||
        (registro.status || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro por funcionário
      const matchesFuncionario = 
        filtroFuncionario === "todos" || 
        registro.funcionario_id === parseInt(filtroFuncionario)
      
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
        return (b.horas_extras || 0) - (a.horas_extras || 0)
      } else if (ordenacaoHorasExtras === "menor") {
        return (a.horas_extras || 0) - (b.horas_extras || 0)
      } else {
        // Ordenação por data (mais recente primeiro)
        return new Date(b.data).getTime() - new Date(a.data).getTime()
      }
    })

  const getStatusBadge = (status: string) => {
    const badge = utilsPonto.obterBadgeStatus(status)
    return <Badge className={badge.className}>{badge.text}</Badge>
  }

  const handleJustificativa = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await apiJustificativas.criar({
        funcionario_id: parseInt(justificativaData.funcionario_id),
        data: justificativaData.data,
        tipo: justificativaData.tipo,
        motivo: justificativaData.motivo
      })

      toast({
        title: "Informação",
        description: "Justificativa enviada com sucesso!",
        variant: "default"
      })
      setJustificativaData({
        funcionario_id: "",
        data: "",
        tipo: "",
        motivo: "",
      })
      setIsJustificativaOpen(false)
      
      // Recarregar dados
      carregarDados()
    } catch (error) {
      console.error('Erro ao criar justificativa:', error)
      toast({
        title: "Informação",
        description: "Erro ao enviar justificativa. Tente novamente.",
        variant: "default"
      })
    }
  }

  const handleAprovarJustificativa = async (id: string) => {
    try {
      await apiJustificativas.aprovar(id)
      toast({
        title: "Informação",
        description: "Justificativa aprovada com sucesso!",
        variant: "default"
      })
      carregarDados()
    } catch (error) {
      console.error("Erro ao aprovar justificativa:", error)
      toast({
        title: "Informação",
        description: "Erro ao aprovar justificativa. Tente novamente.",
        variant: "default"
      })
    }
  }

  const handleRejeitarJustificativa = async (id: string) => {
    const motivoRejeicao = prompt("Digite o motivo da rejeição:")
    if (!motivoRejeicao) return

    try {
      await apiJustificativas.rejeitar(id, motivoRejeicao)
      toast({
        title: "Informação",
        description: "Justificativa rejeitada com sucesso!",
        variant: "default"
      })
      carregarDados()
    } catch (error) {
      console.error("Erro ao rejeitar justificativa:", error)
      toast({
        title: "Informação",
        description: "Erro ao rejeitar justificativa. Tente novamente.",
        variant: "default"
      })
    }
  }

  // Função para abrir modal de edição
  const abrirEdicao = (registro: RegistroPonto) => {
    setRegistroEditando(registro)
    setDadosEdicao({
      entrada: registro.entrada || "",
      saida_almoco: registro.saida_almoco || "",
      volta_almoco: registro.volta_almoco || "",
      saida: registro.saida || "",
      observacoes: registro.observacoes || "",
      justificativa_alteracao: "",
    })
    setIsEditarOpen(true)
  }

  // Função para salvar edição
  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registroEditando) return

    try {
      const registroAtualizado = await apiRegistrosPonto.atualizar(registroEditando.id, {
        entrada: dadosEdicao.entrada,
        saida_almoco: dadosEdicao.saida_almoco,
        volta_almoco: dadosEdicao.volta_almoco,
        saida: dadosEdicao.saida,
        observacoes: dadosEdicao.observacoes,
        justificativa_alteracao: dadosEdicao.justificativa_alteracao
      })
      
      // Atualizar estado local
      setData(prev => ({
        ...prev,
        registrosPonto: prev.registrosPonto.map(r => 
          r.id === registroAtualizado.id ? registroAtualizado : r
        )
      }))
      
      // Fechar modal e limpar dados
      setIsEditarOpen(false)
      setRegistroEditando(null)
      setDadosEdicao({
        entrada: "",
        saida_almoco: "",
        volta_almoco: "",
        saida: "",
        observacoes: "",
        justificativa_alteracao: "",
      })
      
      toast({
        title: "Informação",
        description: "Registro atualizado com sucesso!",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao atualizar registro:', error)
      toast({
        title: "Informação",
        description: "Erro ao atualizar registro. Tente novamente.",
        variant: "default"
      })
    }
  }

  const stats = [
    {
      title: "Funcionários Presentes",
      value: data.registrosPonto.filter((r) => r.status === "Em Andamento" || r.status === "Completo").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Atrasos Hoje",
      value: data.registrosPonto.filter((r) => r.status === "Atraso").length,
      icon: AlertCircle,
      color: "bg-yellow-500",
    },
    {
      title: "Horas Extras Pendentes",
      value: data.registrosPonto.filter((r) => r.status === "Pendente Aprovação").length,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Total Horas Extras",
      value: data.registrosPonto.reduce((total, r) => total + (r.horas_extras || 0), 0),
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
        <div className="flex gap-2">
          <ExportButton
            dados={filteredRegistros}
            tipo="ponto"
            nomeArquivo="relatorio-ponto"
            titulo="Relatório de Ponto Eletrônico"
          />
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
                  value={justificativaData.funcionario_id}
                  onValueChange={(value) => setJustificativaData({ ...justificativaData, funcionario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                <SelectContent>
                  {data.funcionarios.map((func) => (
                    <SelectItem key={func.id} value={func.id.toString()}>
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
      </div>

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
                <p className="text-lg font-medium">{registroEditando?.funcionario?.nome || 'Funcionário não encontrado'}</p>
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
                    value={dadosEdicao.saida_almoco}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, saida_almoco: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voltaAlmoco">Volta Almoço</Label>
                  <Input
                    id="voltaAlmoco"
                    type="time"
                    value={dadosEdicao.volta_almoco}
                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, volta_almoco: e.target.value })}
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
                      {(utilsPonto.calcularHorasTrabalhadas(
                        dadosEdicao.entrada,
                        dadosEdicao.saida,
                        dadosEdicao.saida_almoco,
                        dadosEdicao.volta_almoco
                      ) || 0).toFixed(2)}h
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Horas Extras:</span>
                    <span className="ml-2 font-medium text-orange-600">
                      +{(Math.max(0, utilsPonto.calcularHorasTrabalhadas(
                        dadosEdicao.entrada,
                        dadosEdicao.saida,
                        dadosEdicao.saida_almoco,
                        dadosEdicao.volta_almoco
                      ) - 8) || 0).toFixed(2)}h
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
                  value={dadosEdicao.justificativa_alteracao}
                  onChange={(e) => setDadosEdicao({ ...dadosEdicao, justificativa_alteracao: e.target.value })}
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
              <div className="text-4xl font-mono font-bold text-blue-600">
                {isClient && currentTime ? currentTime.toTimeString().slice(0, 8) : '--:--:--'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {isClient && currentTime ? currentTime.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : 'Carregando...'}
              </div>
            </div>

            {/* Status do Registro Atual */}
            {(() => {
              const status = getStatusRegistroAtual()
              if (!status) return null

              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Status do Registro de Hoje</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temEntrada ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temEntrada ? 'text-green-700' : 'text-gray-500'}>
                        Entrada: {status.temEntrada ? status.registro.entrada : 'Não registrada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temSaida ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temSaida ? 'text-red-700' : 'text-gray-500'}>
                        Saída: {status.temSaida ? status.registro.saida : 'Não registrada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temSaidaAlmoco ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temSaidaAlmoco ? 'text-yellow-700' : 'text-gray-500'}>
                        Saída Almoço: {status.temSaidaAlmoco ? status.registro.saida_almoco : 'Não registrada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.temVoltaAlmoco ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                      <span className={status.temVoltaAlmoco ? 'text-yellow-700' : 'text-gray-500'}>
                        Volta Almoço: {status.temVoltaAlmoco ? status.registro.volta_almoco : 'Não registrada'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Seleção de Funcionário */}
            <div className="space-y-2">
              <Label htmlFor="funcionario">Funcionário</Label>
              {data.isAdmin ? (
                <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.funcionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id.toString()}>
                        {func.nome} - {func.cargo || 'Sem cargo'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="font-medium">{data.usuarioAtual?.nome || 'Carregando...'}</p>
                  <p className="text-sm text-gray-500">Seu registro de ponto</p>
                </div>
              )}
            </div>

            {/* Botões de Registro */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const status = getStatusRegistroAtual()
                const podeEntrada = !status || (!status.temEntrada || status.temSaida)
                const podeSaida = status && status.temEntrada && !status.temSaida
                const podeSaidaAlmoco = status && status.temEntrada && !status.temSaidaAlmoco
                const podeVoltaAlmoco = status && status.temSaidaAlmoco && !status.temVoltaAlmoco

                return (
                  <>
                    <Button
                      onClick={() => registrarPonto("Entrada")}
                      disabled={!podeEntrada}
                      className={`flex items-center gap-2 ${
                        podeEntrada 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      title={!podeEntrada ? "Já existe uma entrada sem saída registrada" : ""}
                    >
                      <Play className="w-4 h-4" />
                      Entrada
                    </Button>
                    <Button
                      onClick={() => registrarPonto("Saída")}
                      disabled={!podeSaida}
                      className={`flex items-center gap-2 ${
                        podeSaida 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      title={!podeSaida ? "Registre a entrada primeiro" : ""}
                    >
                      <Square className="w-4 h-4" />
                      Saída
                    </Button>
                    <Button
                      onClick={() => registrarPonto("Saída Almoço")}
                      disabled={!podeSaidaAlmoco}
                      variant="outline"
                      className={`flex items-center gap-2 ${
                        !podeSaidaAlmoco ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      title={!podeSaidaAlmoco ? "Registre a entrada primeiro" : ""}
                    >
                      <Coffee className="w-4 h-4" />
                      Saída Almoço
                    </Button>
                    <Button
                      onClick={() => registrarPonto("Volta Almoço")}
                      disabled={!podeVoltaAlmoco}
                      variant="outline"
                      className={`flex items-center gap-2 ${
                        !podeVoltaAlmoco ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      title={!podeVoltaAlmoco ? "Registre a saída para almoço primeiro" : ""}
                    >
                      <Coffee className="w-4 h-4" />
                      Volta Almoço
                    </Button>
                  </>
                )
              })()}
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
              {data.registrosPonto.slice(0, 4).map((registro) => (
                <div key={registro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{registro.funcionario?.nome || 'Funcionário não encontrado'}</p>
                      <p className="text-sm text-gray-500">
                        Entrada: {registro.entrada || 'Não registrada'} | Saída: {registro.saida || "Em andamento"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(registro.status)}
                    <p className="text-sm text-gray-500 mt-1">Horas: {registro.horas_trabalhadas || "Calculando..."}</p>
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
          <TabsTrigger value="justificativas">Justificativas</TabsTrigger>
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
                        {data.funcionarios.map((func) => (
                          <SelectItem key={func.id} value={func.id.toString()}>
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
                      setOrdenacaoHorasExtras("data") // Ordenar por data (padrão)
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
                        <TableCell className="font-medium">{registro.funcionario?.nome || 'Funcionário não encontrado'}</TableCell>
                        <TableCell>{utilsPonto.formatarData(registro.data)}</TableCell>
                        <TableCell>{registro.entrada || '-'}</TableCell>
                        <TableCell>{registro.saida_almoco || '-'}</TableCell>
                        <TableCell>{registro.volta_almoco || '-'}</TableCell>
                        <TableCell>{registro.saida || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {registro.horas_trabalhadas}h
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {registro.horas_extras > 0 ? (
                            <Badge className="bg-orange-100 text-orange-800">
                              +{registro.horas_extras}h
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{registro.localizacao || '-'}</TableCell>
                        <TableCell>{getStatusBadge(registro.status)}</TableCell>
                        <TableCell>
                          {registro.aprovador?.nome ? (
                            <span className="text-sm font-medium">{registro.aprovador.nome}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {registro.data_aprovacao ? (
                            <span className="text-sm">
                              {utilsPonto.formatarData(registro.data_aprovacao)} às{" "}
                              {new Date(registro.data_aprovacao).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{registro.observacoes || '-'}</TableCell>
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
                      {data.funcionarios.map((func) => (
                        <SelectItem key={func.id} value={func.id.toString()}>
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
                      {data.registrosPonto
                        .filter((r) => r.horas_extras > 0)
                        .map((registro) => (
                          <TableRow key={registro.id}>
                            <TableCell className="font-medium">{registro.funcionario?.nome || 'Funcionário não encontrado'}</TableCell>
                            <TableCell>{utilsPonto.formatarData(registro.data)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {registro.horas_trabalhadas}h
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-orange-100 text-orange-800">
                                +{registro.horas_extras}h
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{registro.observacoes || '-'}</TableCell>
                            <TableCell>{getStatusBadge(registro.status)}</TableCell>
                            <TableCell>
                              {registro.aprovador?.nome ? (
                                <span className="text-sm font-medium">{registro.aprovador.nome}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {registro.data_aprovacao ? (
                                <span className="text-sm">
                                  {utilsPonto.formatarData(registro.data_aprovacao)} às{" "}
                                  {new Date(registro.data_aprovacao).toLocaleTimeString("pt-BR", {
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
                            {data.registrosPonto.filter((r) => r.status === "Pendente Aprovação").length}
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
                            {data.registrosPonto.filter((r) => r.status === "Aprovado").length}
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
                            {data.registrosPonto.reduce((total, r) => total + (r.horas_extras || 0), 0)}h
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

        <TabsContent value="justificativas">
          <Card>
            <CardHeader>
              <CardTitle>Justificativas</CardTitle>
              <CardDescription>Gerencie justificativas de atrasos, faltas e saídas antecipadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.justificativas.map((just) => {
                  const statusBadge = utilsPonto.obterBadgeStatus(just.status)
                  return (
                    <Card key={just.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium">{just.funcionario?.nome || 'Funcionário não encontrado'}</p>
                              <p className="text-sm text-gray-500">{utilsPonto.formatarData(just.data)} - {just.tipo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusBadge.className}>
                              {statusBadge.text}
                            </Badge>
                            {just.status === 'Pendente' && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8"
                                  onClick={() => handleAprovarJustificativa(just.id)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8"
                                  onClick={() => handleRejeitarJustificativa(just.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-600">{just.motivo}</p>
                        {just.aprovador && (
                          <p className="mt-2 text-xs text-gray-500">
                            {just.status === 'Aprovada' ? 'Aprovada' : 'Rejeitada'} por: {just.aprovador.nome} em {utilsPonto.formatarData(just.data_aprovacao || '')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                {data.justificativas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma justificativa encontrada</p>
                  </div>
                )}
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
                {data.funcionarios.map((func) => {
                  const registrosFuncionario = data.registrosPonto.filter(r => r.funcionario_id === func.id)
                  const totalHoras = registrosFuncionario.reduce((total, r) => total + (r.horas_trabalhadas || 0), 0)
                  const diasPresentes = registrosFuncionario.filter(r => r.status !== 'Falta').length
                  const atrasos = registrosFuncionario.filter(r => r.status === 'Atraso').length
                  const faltas = registrosFuncionario.filter(r => r.status === 'Falta').length
                  
                  return (
                    <Card key={func.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{func.nome}</p>
                            <p className="text-sm text-gray-500">{func.cargo || 'Sem cargo'}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Horas Trabalhadas:</span>
                            <span className="font-medium">{(totalHoras || 0).toFixed(1)}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Dias Presentes:</span>
                            <span className="font-medium">{diasPresentes} dias</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Atrasos:</span>
                            <span className="font-medium text-yellow-600">{atrasos}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Faltas:</span>
                            <span className="font-medium text-red-600">{faltas}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
