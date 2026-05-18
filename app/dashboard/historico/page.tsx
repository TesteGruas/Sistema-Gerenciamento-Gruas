"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useTableSort } from "@/hooks/use-table-sort"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Search, 
  Filter,
  TrendingUp, 
  Users, 
  Wrench,
  Clock,
  Settings,
  UserCheck,
  Activity,
  Database
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { apiHistorico } from "@/lib/api-historico"
import { useToast } from "@/hooks/use-toast"
import { AdvancedPagination } from "@/components/ui/advanced-pagination"

export default function HistoricoPage() {
  const [activeTab, setActiveTab] = useState("geral")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModulo, setSelectedModulo] = useState("todos")
  const [selectedAcao, setSelectedAcao] = useState("todas")
  const [filtroHorasExtras, setFiltroHorasExtras] = useState("todos")
  const [filtroStatusAprovacao, setFiltroStatusAprovacao] = useState("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Estados para cada tipo de histórico
  const [historicoGeral, setHistoricoGeral] = useState<any[]>([])
  const [historicoGruas, setHistoricoGruas] = useState<any[]>([])
  const [historicoComponentes, setHistoricoComponentes] = useState<any[]>([])
  const [historicoPonto, setHistoricoPonto] = useState<any[]>([])
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [pagination, setPagination] = useState<any>({})
  
  const { toast } = useToast()
  const { sortColumn, sortDirection, toggleSort, sortClientData } = useTableSort()

  // Carregar dados iniciais
  useEffect(() => {
    carregarEstatisticas()
    carregarDados()
  }, [activeTab, currentPage, pageSize, selectedModulo, selectedAcao, filtroHorasExtras, filtroStatusAprovacao])

  // Funções de controle de paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset para primeira página
  }

  const carregarEstatisticas = async () => {
    try {
      const response = await apiHistorico.obterEstatisticas()
      setEstatisticas(response)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas do histórico",
        variant: "destructive"
      })
    }
  }

  const carregarDados = async () => {
    console.log('🔄 carregarDados chamada com activeTab:', activeTab);
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
      }

      switch (activeTab) {
        case "geral":
          const responseGeral = await apiHistorico.listarGeral({
            ...params,
            modulo: selectedModulo && selectedModulo !== "todos" ? selectedModulo : undefined,
            acao: selectedAcao && selectedAcao !== "todas" ? selectedAcao : undefined
          })
          setHistoricoGeral(responseGeral.data || [])
          setPagination(responseGeral.pagination || {})
          break

        case "gruas":
          const responseGruas = await apiHistorico.listar(params)
          setHistoricoGruas(responseGruas.data || [])
          setPagination(responseGruas.pagination || {})
          break

        case "componentes":
          const responseComponentes = await apiHistorico.listarComponentes(params)
          setHistoricoComponentes(responseComponentes.data || [])
          setPagination(responseComponentes.pagination || {})
          break

        case "ponto":
          console.log('📊 Carregando dados do ponto...');
          
          // Preparar parâmetros da API incluindo filtros
          const paramsPonto = {
            ...params,
            // Adicionar filtros como parâmetros da API se necessário
            // Por enquanto, vamos aplicar os filtros no frontend mas manter a paginação
          }
          
          const responsePonto = await apiHistorico.listarPonto(paramsPonto)
          console.log('📊 Response do ponto:', responsePonto);
          
          // Aplicar filtros específicos para horas extras
          let registrosFiltrados = responsePonto.data || []
          
          if (filtroHorasExtras === "com_horas_extras") {
            registrosFiltrados = registrosFiltrados.filter((reg: any) => reg.horas_extras > 0)
          } else if (filtroHorasExtras === "sem_horas_extras") {
            registrosFiltrados = registrosFiltrados.filter((reg: any) => !reg.horas_extras || reg.horas_extras <= 0)
          }
          
          if (filtroStatusAprovacao === "aprovados") {
            registrosFiltrados = registrosFiltrados.filter((reg: any) => reg.status?.toLowerCase() === 'aprovado')
          } else if (filtroStatusAprovacao === "pendentes") {
            registrosFiltrados = registrosFiltrados.filter((reg: any) => 
              reg.status?.toLowerCase().includes('pendente') || 
              reg.status?.toLowerCase().includes('pendente aprovação')
            )
          } else if (filtroStatusAprovacao === "rejeitados") {
            registrosFiltrados = registrosFiltrados.filter((reg: any) => reg.status?.toLowerCase() === 'rejeitado')
          }
          
          setHistoricoPonto(registrosFiltrados)
          
          // Se não há filtros aplicados, usar a paginação da API
          const temFiltros = filtroHorasExtras !== "todos" || filtroStatusAprovacao !== "todos"
          
          if (temFiltros) {
            // Com filtros: ajustar paginação baseada nos registros filtrados
            const paginationAjustada = {
              page: 1, // Sempre página 1 quando há filtros
              limit: pageSize,
              total: registrosFiltrados.length,
              pages: Math.ceil(registrosFiltrados.length / pageSize)
            }
            setPagination(paginationAjustada)
            console.log('📊 Paginação ajustada para filtros:', paginationAjustada);
          } else {
            // Sem filtros: usar paginação da API
            setPagination(responsePonto.pagination || {})
            console.log('📊 Paginação da API:', responsePonto.pagination);
          }
          
          console.log('📊 HistoricoPonto atualizado:', registrosFiltrados.length, 'registros');
          break
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do histórico",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sortedHistoricoGeral = useMemo(
    () => sortClientData(historicoGeral as Record<string, unknown>[]),
    [historicoGeral, sortClientData],
  )
  const sortedHistoricoGruas = useMemo(
    () => sortClientData(historicoGruas as Record<string, unknown>[]),
    [historicoGruas, sortClientData],
  )
  const sortedHistoricoComponentes = useMemo(
    () => sortClientData(historicoComponentes as Record<string, unknown>[]),
    [historicoComponentes, sortClientData],
  )
  const sortedHistoricoPonto = useMemo(
    () => sortClientData(historicoPonto as Record<string, unknown>[]),
    [historicoPonto, sortClientData],
  )

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sucesso': return 'bg-green-100 text-green-800'
      case 'falha': return 'bg-red-100 text-red-800'
      case 'erro': return 'bg-red-100 text-red-800'
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'concluída': return 'bg-blue-100 text-blue-800'
      case 'cancelada': return 'bg-gray-100 text-gray-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'aprovado': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejeitado': return 'bg-red-100 text-red-800 border-red-200'
      case 'pendente aprovação': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pendente aprovacao': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'atraso': return 'bg-red-100 text-red-800 border-red-200'
      case 'atrasado': return 'bg-red-100 text-red-800 border-red-200'
      case 'falta': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'em andamento': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sucesso': return '✅'
      case 'falha': return '❌'
      case 'erro': return '⚠️'
      case 'ativa': return '🟢'
      case 'concluída': return '🔵'
      case 'cancelada': return '⚫'
      case 'pendente': return '🟡'
      case 'aprovado': return '✅'
      case 'rejeitado': return '❌'
      case 'pendente aprovação': return '⏳'
      case 'pendente aprovacao': return '⏳'
      case 'completo': return '✅'
      case 'atraso': return '⏰'
      case 'atrasado': return '⏰'
      case 'falta': return '❌'
      case 'em andamento': return '🔄'
      default: return '📋'
    }
  }

  const getAcaoIcon = (acao: string) => {
    switch (acao?.toLowerCase()) {
      case 'criar': return '➕'
      case 'editar': return '✏️'
      case 'deletar': return '🗑️'
      case 'visualizar': return '👁️'
      case 'atualizar': return '🔄'
      default: return '📝'
    }
  }

  const getTipoMovimentacaoIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'instalação': return '🔧'
      case 'remoção': return '📤'
      case 'manutenção': return '🔨'
      case 'substituição': return '🔄'
      case 'transferência': return '↔️'
      case 'ajuste': return '⚙️'
      default: return '📦'
    }
  }

  // Estatísticas para exibição
  const stats = estatisticas ? [
    {
      title: "Total de Registros",
      value: estatisticas?.resumo?.total_registros || 0,
      icon: Database,
      description: "Todos os registros de histórico"
    },
    {
      title: "Logs de Auditoria",
      value: estatisticas?.total_logs_auditoria || 0,
      icon: FileText,
      description: "Operações do sistema"
    },
    {
      title: "Locações",
      value: estatisticas?.total_locacoes || 0,
      icon: Wrench,
      description: "Histórico de gruas"
    },
    {
      title: "Componentes",
      value: estatisticas?.total_componentes || 0,
      icon: Settings,
      description: "Movimentações de peças"
    },
    {
      title: "Registros Ponto",
      value: estatisticas?.total_registros_ponto || 0,
      icon: UserCheck,
      description: "Registros de ponto eletrônico"
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico do Sistema</h1>
          <p className="text-muted-foreground">
            Visualize todo o histórico de operações, locações, componentes e alterações
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
                <Input
                placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                />
            </div>
            
            {activeTab === "geral" && (
              <>
                <Select value={selectedModulo} onValueChange={setSelectedModulo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos os módulos</SelectItem>
                    <SelectItem value="gruas">Gruas</SelectItem>
                    <SelectItem value="obras">Obras</SelectItem>
                    <SelectItem value="funcionarios">Funcionários</SelectItem>
                    <SelectItem value="clientes">Clientes</SelectItem>
                    <SelectItem value="usuarios">Usuários</SelectItem>
                </SelectContent>
              </Select>

                <Select value={selectedAcao} onValueChange={setSelectedAcao}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todas">Todas as ações</SelectItem>
                    <SelectItem value="criar">Criar</SelectItem>
                    <SelectItem value="editar">Editar</SelectItem>
                    <SelectItem value="deletar">Deletar</SelectItem>
                    <SelectItem value="visualizar">Visualizar</SelectItem>
                </SelectContent>
              </Select>
              </>
            )}

            {activeTab === "ponto" && (
              <>
                <Select value={filtroHorasExtras} onValueChange={setFiltroHorasExtras}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Horas Extras" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos os registros</SelectItem>
                    <SelectItem value="com_horas_extras">Com horas extras</SelectItem>
                    <SelectItem value="sem_horas_extras">Sem horas extras</SelectItem>
                </SelectContent>
              </Select>

                <Select value={filtroStatusAprovacao} onValueChange={setFiltroStatusAprovacao}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Status Aprovação" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="aprovados">Aprovados</SelectItem>
                    <SelectItem value="pendentes">Pendentes</SelectItem>
                    <SelectItem value="rejeitados">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
              </>
            )}

            <Button onClick={carregarDados} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Carregando..." : "Filtrar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="gruas" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Gruas
          </TabsTrigger>
          <TabsTrigger value="componentes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Componentes
          </TabsTrigger>
          <TabsTrigger value="ponto" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Ponto
          </TabsTrigger>
        </TabsList>

        {/* Tab Geral - Mix de Todas as Atividades */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Geral</CardTitle>
              <CardDescription>
                Todas as atividades do sistema em ordem cronológica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="timestamp" label="Data/Hora" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="tipo" label="Tipo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="titulo" label="Atividade" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="usuario_nome" label="Usuário" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="descricao" label="Detalhes" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHistoricoGeral.map((atividade: any) => (
                    <TableRow key={atividade.id}>
                      <TableCell>
                        {format(new Date(atividade.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 w-fit ${
                            atividade.tipo === 'auditoria' ? 'border-blue-200 text-blue-700' :
                            atividade.tipo === 'locacao' ? 'border-green-200 text-green-700' :
                            atividade.tipo === 'ponto' ? 'border-purple-200 text-purple-700' :
                            atividade.tipo === 'componente' ? 'border-orange-200 text-orange-700' :
                            'border-gray-200 text-gray-700'
                          }`}
                        >
                          {atividade.tipo === 'auditoria' && '📋'}
                          {atividade.tipo === 'locacao' && '🏗️'}
                          {atividade.tipo === 'ponto' && '⏰'}
                          {atividade.tipo === 'componente' && '🔧'}
                          {atividade.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{atividade.titulo}</div>
                          {atividade.acao && (
                            <div className="text-sm text-muted-foreground">
                              {atividade.acao}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{atividade.usuario_nome}</div>
                          {atividade.usuario_id && (
                            <div className="text-sm text-muted-foreground">
                              ID: {atividade.usuario_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {atividade.descricao && (
                            <div>{atividade.descricao}</div>
                          )}
                          {atividade.entidade && (
                            <div className="text-muted-foreground">
                              Módulo: {atividade.entidade}
                            </div>
                          )}
                          {atividade.entidade_id && (
                            <div className="text-muted-foreground">
                              ID: {atividade.entidade_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Gruas - Histórico de Locações */}
        <TabsContent value="gruas" className="space-y-4">
      <Card>
        <CardHeader>
              <CardTitle>Histórico de Gruas</CardTitle>
              <CardDescription>
                Locações e transferências de gruas
              </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="grua.name" label="Grua" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                <SortableTableHead column="obra.nome" label="Obra" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                <TableHead>Cliente</TableHead>
                <SortableTableHead column="data_inicio" label="Período" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                <SortableTableHead column="tipo_operacao" label="Tipo" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                <SortableTableHead column="funcionario.nome" label="Responsável" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                <SortableTableHead column="status" label="Status" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
                  {sortedHistoricoGruas.map((locacao: any) => (
                    <TableRow key={locacao.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{locacao.grua?.name}</div>
                          <div className="text-sm text-muted-foreground">{locacao.grua?.modelo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{locacao.obra?.nome}</div>
                          <div className="text-sm text-muted-foreground">{locacao.obra?.status}</div>
                        </div>
                      </TableCell>
                      <TableCell>{locacao.obra?.cliente?.nome}</TableCell>
                  <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(locacao.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</div>
                          {locacao.data_fim && (
                            <div className="text-muted-foreground">
                              até {format(new Date(locacao.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                    </div>
                  </TableCell>
                  <TableCell>
                        <Badge variant="outline">{locacao.tipo_operacao}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{locacao.funcionario?.nome}</div>
                          <div className="text-sm text-muted-foreground">{locacao.funcionario?.cargo}</div>
                        </div>
                  </TableCell>
                  <TableCell>
                        <Badge className={getStatusColor(locacao.status)}>
                          {getStatusIcon(locacao.status)} {locacao.status}
                    </Badge>
                  </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Componentes - Histórico de Movimentações */}
        <TabsContent value="componentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Componentes</CardTitle>
              <CardDescription>
                Movimentações de componentes das gruas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="componente.nome" label="Componente" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <TableHead>Tipo</TableHead>
                    <SortableTableHead column="tipo_movimentacao" label="Movimentação" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="quantidade_movimentada" label="Quantidade" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <SortableTableHead column="data_movimentacao" label="Data" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="funcionario.nome" label="Responsável" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHistoricoComponentes.map((componente: any) => (
                    <TableRow key={componente.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{componente.componente?.nome}</div>
                          <div className="text-sm text-muted-foreground">{componente.componente?.modelo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{componente.componente?.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTipoMovimentacaoIcon(componente.tipo_movimentacao)} {componente.tipo_movimentacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                        <div className="text-sm">
                          <div>Movimentada: {componente.quantidade_movimentada}</div>
                          <div className="text-muted-foreground">
                            {componente.quantidade_anterior} → {componente.quantidade_atual}
                          </div>
                    </div>
                  </TableCell>
                  <TableCell>
                        {componente.grua_origem?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {componente.grua_destino?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(componente.data_movimentacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{componente.funcionario?.nome}</div>
                          <div className="text-sm text-muted-foreground">{componente.funcionario?.cargo}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Tab Ponto - Registros de Ponto */}
        <TabsContent value="ponto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Ponto Eletrônico</CardTitle>
              <CardDescription>
                Histórico de registros de ponto dos funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="funcionario.nome" label="Funcionário" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="data" label="Data" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="entrada" label="Entrada" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <TableHead>Saída Almoço</TableHead>
                    <TableHead>Volta Almoço</TableHead>
                    <SortableTableHead column="saida" label="Saída" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="horas_trabalhadas" label="Horas Trabalhadas" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="horas_extras" label="Horas Extras" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <SortableTableHead column="status" label="Status" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <TableHead>Aprovado Por</TableHead>
                    <SortableTableHead column="data_aprovacao" label="Data Aprovação" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHistoricoPonto.map((registro: any) => {
                    // Verificar se está em atraso (múltiplas variações do status)
                    const isAtraso = registro.status === 'Atraso' || 
                                    registro.status === 'atraso' || 
                                    registro.status?.toLowerCase().includes('atraso') ||
                                    registro.status === 'Atrasado' ||
                                    registro.status === 'atrasado'
                    
                    // Verificar se tem registros incompletos (sem saída do almoço, volta do almoço ou saída)
                    const isIncompleto = (!registro.saida_almoco && registro.entrada) || 
                                       (!registro.volta_almoco && registro.saida_almoco) || 
                                       (!registro.saida && registro.volta_almoco)
                    
                    // Aplicar cores condicionais
                    const nomeColor = isAtraso ? 'text-red-600 font-semibold' : isIncompleto ? 'text-orange-600 font-semibold' : ''
                    const dataColor = isAtraso ? 'text-red-600 font-semibold' : isIncompleto ? 'text-orange-600 font-semibold' : ''
                    
                    // Debug: log para verificar os valores
                    console.log('Registro:', {
                      id: registro.id,
                      funcionario: registro.funcionario?.nome,
                      status: registro.status,
                      isAtraso,
                      isIncompleto,
                      saida_almoco: registro.saida_almoco,
                      volta_almoco: registro.volta_almoco,
                      saida: registro.saida,
                      nomeColor,
                      dataColor
                    })
                    
                    // Debug específico para status "Atraso"
                    if (registro.status === 'Atraso') {
                      console.log('🔴 REGISTRO COM ATRASO DETECTADO:', {
                        funcionario: registro.funcionario?.nome,
                        status: registro.status,
                        isAtraso,
                        nomeColor,
                        dataColor
                      })
                    }
                    
                    // Forçar aplicação das cores
                    const nomeClasses = `font-medium ${nomeColor}`
                    const dataClasses = dataColor
                    
                    return (
                    <TableRow key={registro.id}>
                      <TableCell>
                        <div>
                          <div className={nomeClasses}>
                            {registro.funcionario?.nome}
                            {isAtraso && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">ATRASO</span>}
                            {isIncompleto && !isAtraso && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">INCOMPLETO</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">{registro.funcionario?.cargo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={dataClasses}>
                          {format(new Date(registro.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {registro.entrada || '-'}
                      </TableCell>
                      <TableCell>
                        {registro.saida_almoco || '-'}
                      </TableCell>
                      <TableCell>
                        {registro.volta_almoco || '-'}
                      </TableCell>
                      <TableCell>
                        {registro.saida || '-'}
                      </TableCell>
                      <TableCell>
                        {registro.horas_trabalhadas ? `${registro.horas_trabalhadas}h` : '-'}
                      </TableCell>
                      <TableCell>
                        {registro.horas_extras ? `${registro.horas_extras}h` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(registro.status)}>
                            {getStatusIcon(registro.status)} {registro.status}
                          </Badge>
                          {registro.horas_extras > 0 && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              ⏰ {registro.horas_extras}h extras
                            </Badge>
                          )}
                          {registro.status?.toLowerCase() === 'aprovado' && registro.horas_extras > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ✅ Aprovado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {registro.aprovado_por_usuario ? (
                          <div>
                            <div className="font-medium">{registro.aprovado_por_usuario.nome}</div>
                            <div className="text-sm text-muted-foreground">{registro.aprovado_por_usuario.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {registro.data_aprovacao ? (
                          <div>
                            <div className="font-medium">
                              {format(new Date(registro.data_aprovacao), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(registro.data_aprovacao), 'HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {registro.observacoes ? (
                          <div className="max-w-[200px]">
                            <div className="text-sm truncate" title={registro.observacoes}>
                              {registro.observacoes}
                            </div>
                            {registro.justificativa_alteracao && (
                              <div className="text-xs text-muted-foreground mt-1 truncate" title={registro.justificativa_alteracao}>
                                Justificativa: {registro.justificativa_alteracao}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Paginação Avançada */}
      <AdvancedPagination
        currentPage={pagination?.page || currentPage}
        totalPages={pagination?.pages || 1}
        totalItems={pagination?.total || 0}
        itemsPerPage={pageSize}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[10, 20, 50, 100]}
      />
    </div>
  )
}