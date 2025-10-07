"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

export default function HistoricoPage() {
  const [activeTab, setActiveTab] = useState("geral")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModulo, setSelectedModulo] = useState("todos")
  const [selectedAcao, setSelectedAcao] = useState("todas")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  
  // Estados para cada tipo de histórico
  const [historicoGeral, setHistoricoGeral] = useState<any[]>([])
  const [historicoGruas, setHistoricoGruas] = useState<any[]>([])
  const [historicoComponentes, setHistoricoComponentes] = useState<any[]>([])
  const [historicoPonto, setHistoricoPonto] = useState<any[]>([])
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [pagination, setPagination] = useState<any>({})
  
  const { toast } = useToast()

  // Carregar dados iniciais
  useEffect(() => {
    carregarEstatisticas()
    carregarDados()
  }, [activeTab, currentPage, selectedModulo, selectedAcao])

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
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: pageSize
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
          const responsePonto = await apiHistorico.listarPonto(params)
          setHistoricoPonto(responsePonto.data || [])
          setPagination(responsePonto.pagination || {})
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sucesso': return 'bg-green-100 text-green-800'
      case 'falha': return 'bg-red-100 text-red-800'
      case 'erro': return 'bg-red-100 text-red-800'
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'concluída': return 'bg-blue-100 text-blue-800'
      case 'cancelada': return 'bg-gray-100 text-gray-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
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
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoGeral.map((atividade: any) => (
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
                <TableHead>Grua</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {historicoGruas.map((locacao: any) => (
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
                    <TableHead>Componente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Movimentação</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoComponentes.map((componente: any) => (
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
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída Almoço</TableHead>
                    <TableHead>Volta Almoço</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Horas Trabalhadas</TableHead>
                    <TableHead>Horas Extras</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aprovado Por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoPonto.map((registro: any) => (
                    <TableRow key={registro.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{registro.funcionario?.nome}</div>
                          <div className="text-sm text-muted-foreground">{registro.funcionario?.cargo}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(registro.data), 'dd/MM/yyyy', { locale: ptBR })}
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
                        <Badge className={getStatusColor(registro.status)}>
                          {getStatusIcon(registro.status)} {registro.status}
                        </Badge>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Paginação */}
      {pagination && Object.keys(pagination).length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {pagination?.page || 1} de {pagination?.pages || 1} ({pagination?.total || 0} registros)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination?.pages || 1, currentPage + 1))}
                  disabled={currentPage === (pagination?.pages || 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}