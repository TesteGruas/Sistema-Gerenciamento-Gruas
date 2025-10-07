"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Download as DownloadIcon,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RelatorioData {
  id: string
  tipo: string
  periodo: string
  funcionarios: number
  totalHoras: number
  totalSalarios: number
  status: 'Gerado' | 'Processando' | 'Erro'
  dataGeracao: string
}

export default function RelatoriosRHPage() {
  const [relatorios, setRelatorios] = useState<RelatorioData[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState("all")
  const [filtroPeriodo, setFiltroPeriodo] = useState("")
  const { toast } = useToast()

  // Dados mockados para demonstração
  useEffect(() => {
    setRelatorios([
      {
        id: "1",
        tipo: "Folha de Pagamento",
        periodo: "Novembro 2024",
        funcionarios: 25,
        totalHoras: 2000,
        totalSalarios: 125000,
        status: "Gerado",
        dataGeracao: "2024-11-15"
      },
      {
        id: "2",
        tipo: "Horas Trabalhadas",
        periodo: "Novembro 2024",
        funcionarios: 25,
        totalHoras: 2000,
        totalSalarios: 0,
        status: "Gerado",
        dataGeracao: "2024-11-14"
      },
      {
        id: "3",
        tipo: "Benefícios e Vales",
        periodo: "Novembro 2024",
        funcionarios: 25,
        totalHoras: 0,
        totalSalarios: 15000,
        status: "Processando",
        dataGeracao: "2024-11-16"
      }
    ])
  }, [])

  const tiposRelatorio = [
    { value: "all", label: "Todos os Relatórios" },
    { value: "folha", label: "Folha de Pagamento" },
    { value: "horas", label: "Horas Trabalhadas" },
    { value: "beneficios", label: "Benefícios e Vales" },
    { value: "pontos", label: "Pontos Eletrônicos" },
    { value: "obras", label: "Obras por Funcionário" }
  ]

  const gerarRelatorio = async (tipo: string) => {
    setLoading(true)
    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadRelatorio = (id: string) => {
    toast({
      title: "Download",
      description: "Iniciando download do relatório...",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Gerado': return 'bg-green-100 text-green-800'
      case 'Processando': return 'bg-yellow-100 text-yellow-800'
      case 'Erro': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRelatorios = relatorios.filter(relatorio => {
    const matchesTipo = filtroTipo === "all" || relatorio.tipo.toLowerCase().includes(filtroTipo.toLowerCase())
    const matchesPeriodo = !filtroPeriodo || relatorio.periodo.toLowerCase().includes(filtroPeriodo.toLowerCase())
    return matchesTipo && matchesPeriodo
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios RH</h1>
          <p className="text-gray-600">Geração e visualização de relatórios</p>
        </div>
        <Button onClick={() => gerarRelatorio('completo')} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Gerar Relatório Completo
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Relatórios Gerados</p>
                <p className="text-2xl font-bold text-gray-900">{relatorios.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">25</p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Trabalhadas</p>
                <p className="text-2xl font-bold text-gray-900">2.000h</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Salários</p>
                <p className="text-2xl font-bold text-gray-900">R$ 125.000</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Relatório</Label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposRelatorio.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                placeholder="Ex: Novembro 2024"
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltroTipo("all")
                  setFiltroPeriodo("")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="gerados" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gerados">Relatórios Gerados</TabsTrigger>
          <TabsTrigger value="gerar">Gerar Novo</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="gerados" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados ({filteredRelatorios.length})</CardTitle>
              <CardDescription>Lista de todos os relatórios gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>Total Horas</TableHead>
                    <TableHead>Total Salários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Geração</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRelatorios.map((relatorio) => (
                    <TableRow key={relatorio.id}>
                      <TableCell className="font-medium">{relatorio.tipo}</TableCell>
                      <TableCell>{relatorio.periodo}</TableCell>
                      <TableCell>{relatorio.funcionarios}</TableCell>
                      <TableCell>{relatorio.totalHoras}h</TableCell>
                      <TableCell>R$ {relatorio.totalSalarios.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(relatorio.status)}>
                          {relatorio.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(relatorio.dataGeracao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadRelatorio(relatorio.id)}
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gerar" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => gerarRelatorio('folha')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Folha de Pagamento
                </CardTitle>
                <CardDescription>Relatório completo de salários e descontos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => gerarRelatorio('horas')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horas Trabalhadas
                </CardTitle>
                <CardDescription>Relatório de horas por funcionário</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => gerarRelatorio('beneficios')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Benefícios e Vales
                </CardTitle>
                <CardDescription>Relatório de benefícios e vales</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => gerarRelatorio('pontos')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Pontos Eletrônicos
                </CardTitle>
                <CardDescription>Relatório de pontos e frequência</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => gerarRelatorio('obras')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Obras por Funcionário
                </CardTitle>
                <CardDescription>Relatório de obras e alocações</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => gerarRelatorio('completo')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Relatório Completo
                </CardTitle>
                <CardDescription>Todos os dados em um relatório</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Relatórios</CardTitle>
              <CardDescription>Modelos pré-configurados para geração rápida</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Templates serão implementados em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}