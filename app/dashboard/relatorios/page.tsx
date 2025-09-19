"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  PieChart,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Building2,
  DollarSign,
  Users
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mockObras, mockGruas, mockCustos, mockDocumentos, mockUsers, getCustosByObra, getHistoricoByGrua } from "@/lib/mock-data"

export default function RelatoriosPage() {
  const [selectedObra, setSelectedObra] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())

  // Calcular estatísticas gerais
  const totalObras = mockObras.length
  const obrasAtivas = mockObras.filter(o => o.status === 'ativa').length
  const totalGruas = mockGruas.length
  const gruasEmObra = mockGruas.filter(g => g.status === 'em_obra').length
  const totalCustos = mockCustos.reduce((sum, custo) => sum + custo.valor, 0)
  const totalDocumentos = mockDocumentos.length
  const documentosAssinados = mockDocumentos.filter(d => d.status === 'assinado').length

  // Calcular estatísticas de gruas
  const gruasStats = mockGruas.map(grua => {
    const historico = getHistoricoByGrua(grua.id)
    const totalEntradas = historico.length
    const entradasOK = historico.filter(h => h.status === 'ok').length
    const entradasFalha = historico.filter(h => h.status === 'falha').length
    const entradasManutencao = historico.filter(h => h.tipo === 'manutencao').length
    
    return {
      grua: grua.name,
      totalEntradas,
      entradasOK,
      entradasFalha,
      entradasManutencao,
      percentualOK: totalEntradas > 0 ? (entradasOK / totalEntradas) * 100 : 0
    }
  })

  // Calcular custos por obra
  const custosPorObra = mockObras.map(obra => {
    const custos = getCustosByObra(obra.id)
    const total = custos.reduce((sum, custo) => sum + custo.valor, 0)
    const inicial = custos.filter(c => c.tipo === 'inicial').reduce((sum, custo) => sum + custo.valor, 0)
    const adicional = custos.filter(c => c.tipo === 'adicional').reduce((sum, custo) => sum + custo.valor, 0)
    
    return {
      obra: obra.name,
      total,
      inicial,
      adicional,
      status: obra.status
    }
  })

  // Calcular estatísticas de documentos
  const documentosStats = {
    total: mockDocumentos.length,
    rascunho: mockDocumentos.filter(d => d.status === 'rascunho').length,
    aguardando: mockDocumentos.filter(d => d.status === 'aguardando_assinatura').length,
    assinados: mockDocumentos.filter(d => d.status === 'assinado').length,
    rejeitados: mockDocumentos.filter(d => d.status === 'rejeitado').length
  }

  const handleExport = (tipo: string) => {
    // Aqui seria a lógica para exportar relatórios
    console.log(`Exportando relatório: ${tipo}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise e relatórios do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('geral')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Geral
          </Button>
          <Button onClick={() => handleExport('completo')}>
            <FileText className="w-4 h-4 mr-2" />
            Relatório Completo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Obra</label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {mockObras.map(obra => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="text-sm font-medium">Data Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium">Data Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="gruas">Gruas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Obras</p>
                    <p className="text-2xl font-bold text-gray-900">{totalObras}</p>
                    <p className="text-xs text-green-600 mt-1">{obrasAtivas} ativas</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Gruas</p>
                    <p className="text-2xl font-bold text-gray-900">{totalGruas}</p>
                    <p className="text-xs text-blue-600 mt-1">{gruasEmObra} em obra</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Custos</p>
                    <p className="text-2xl font-bold text-gray-900">R$ {totalCustos.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-orange-600 mt-1">+12% vs mês anterior</p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-500">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">{totalDocumentos}</p>
                    <p className="text-xs text-green-600 mt-1">{documentosAssinados} assinados</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Obras por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Obras por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['ativa', 'pausada', 'concluida'].map(status => {
                  const count = mockObras.filter(o => o.status === status).length
                  const percentage = (count / totalObras) * 100
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'ativa' ? 'bg-green-500' : 
                          status === 'pausada' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm font-medium capitalize">{status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status === 'ativa' ? 'bg-green-500' : 
                              status === 'pausada' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gruas" className="space-y-6">
          {/* Estatísticas de Gruas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance das Gruas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grua</TableHead>
                    <TableHead>Total Entradas</TableHead>
                    <TableHead>Status OK</TableHead>
                    <TableHead>Falhas</TableHead>
                    <TableHead>Manutenções</TableHead>
                    <TableHead>% OK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gruasStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{stat.grua}</TableCell>
                      <TableCell>{stat.totalEntradas}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {stat.entradasOK}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          {stat.entradasFalha}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Wrench className="w-4 h-4 text-yellow-500" />
                          {stat.entradasManutencao}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={stat.percentualOK >= 80 ? 'bg-green-100 text-green-800' : 
                                         stat.percentualOK >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-red-100 text-red-800'}>
                          {stat.percentualOK.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          {/* Relatório Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Custos por Obra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obra</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Custos Iniciais</TableHead>
                    <TableHead>Custos Adicionais</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custosPorObra.map((obra, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{obra.obra}</TableCell>
                      <TableCell>
                        <Badge className={obra.status === 'ativa' ? 'bg-green-100 text-green-800' : 
                                         obra.status === 'pausada' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-blue-100 text-blue-800'}>
                          {obra.status}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {obra.inicial.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>R$ {obra.adicional.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="font-semibold">R$ {obra.total.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{((obra.total / totalCustos) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Gráfico de Custos por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Custos por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['equipamentos', 'materiais', 'mao_obra', 'outros'].map(categoria => {
                  const total = mockCustos.filter(c => c.categoria === categoria).reduce((sum, custo) => sum + custo.valor, 0)
                  const percentage = (total / totalCustos) * 100
                  return (
                    <div key={categoria} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          categoria === 'equipamentos' ? 'bg-purple-500' : 
                          categoria === 'materiais' ? 'bg-green-500' : 
                          categoria === 'mao_obra' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm font-medium capitalize">{categoria.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              categoria === 'equipamentos' ? 'bg-purple-500' : 
                              categoria === 'materiais' ? 'bg-green-500' : 
                              categoria === 'mao_obra' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">R$ {total.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          {/* Relatório de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Status dos Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{documentosStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{documentosStats.aguardando}</div>
                  <div className="text-sm text-yellow-600">Aguardando</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{documentosStats.assinados}</div>
                  <div className="text-sm text-green-600">Assinados</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{documentosStats.rejeitados}</div>
                  <div className="text-sm text-red-600">Rejeitados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDocumentos.map((doc) => {
                    const obra = mockObras.find(o => o.id === doc.obraId)
                    const progress = (doc.ordemAssinatura.filter((a: any) => a.status === 'assinado').length / doc.ordemAssinatura.length) * 100
                    
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.titulo}</TableCell>
                        <TableCell>{obra?.name}</TableCell>
                        <TableCell>
                          <Badge className={doc.status === 'assinado' ? 'bg-green-100 text-green-800' : 
                                           doc.status === 'aguardando_assinatura' ? 'bg-yellow-100 text-yellow-800' : 
                                           'bg-gray-100 text-gray-800'}>
                            {doc.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente de tabela simples para os relatórios
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {children}
      </table>
    </div>
  )
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  )
}

function TableBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-gray-200">
      {children}
    </tbody>
  )
}

function TableRow({ children }: { children: React.ReactNode }) {
  return (
    <tr className="hover:bg-gray-50">
      {children}
    </tr>
  )
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  )
}

function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className || ''}`}>
      {children}
    </td>
  )
}