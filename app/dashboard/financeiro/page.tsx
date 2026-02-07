"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileCheck,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { notasFiscaisApi, type NotaFiscal } from "@/lib/api-notas-fiscais"
import { boletosApi, type Boleto } from "@/lib/api-boletos"
import { apiContasBancarias, type ContaBancaria } from "@/lib/api-contas-bancarias"
import { useToast } from "@/hooks/use-toast"

interface NotasResumo {
  aReceber: {
    total: number
    pendentes: number
    vencidas: number
    pagas: number
    lista: NotaFiscal[]
  }
  aPagar: {
    total: number
    pendentes: number
    vencidas: number
    pagas: number
    lista: NotaFiscal[]
  }
}

interface BoletosResumo {
  entrada: {
    total: number
    pendentes: number
    vencidos: number
    pagos: number
    lista: Boleto[]
  }
  saida: {
    total: number
    pendentes: number
    vencidos: number
    pagos: number
    lista: Boleto[]
  }
}

interface BancosResumo {
  totalContas: number
  saldoTotal: number
  contas: ContaBancaria[]
}

export default function FinanceiroPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [notasResumo, setNotasResumo] = useState<NotasResumo>({
    aReceber: { total: 0, pendentes: 0, vencidas: 0, pagas: 0, lista: [] },
    aPagar: { total: 0, pendentes: 0, vencidas: 0, pagas: 0, lista: [] }
  })
  const [boletosResumo, setBoletosResumo] = useState<BoletosResumo>({
    entrada: { total: 0, pendentes: 0, vencidos: 0, pagos: 0, lista: [] },
    saida: { total: 0, pendentes: 0, vencidos: 0, pagos: 0, lista: [] }
  })
  const [bancosResumo, setBancosResumo] = useState<BancosResumo>({
    totalContas: 0,
    saldoTotal: 0,
    contas: []
  })

  const carregarDados = async () => {
    try {
      setIsLoading(true)

      // Carregar notas fiscais
      const [notasSaidaResponse, notasEntradaResponse] = await Promise.all([
        notasFiscaisApi.list({ tipo: 'saida', limit: 100 }),
        notasFiscaisApi.list({ tipo: 'entrada', limit: 100 })
      ])

      const notasReceber = (notasSaidaResponse.data || notasSaidaResponse || []) as NotaFiscal[]
      const notasPagar = (notasEntradaResponse.data || notasEntradaResponse || []) as NotaFiscal[]

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const calcularResumoNotas = (notas: NotaFiscal[]) => {
        const pendentes = notas.filter(n => n.status === 'pendente')
        const vencidas = notas.filter(n => {
          if (n.status === 'paga' || n.status === 'cancelada') return false
          if (!n.data_vencimento) return false
          const vencimento = new Date(n.data_vencimento)
          vencimento.setHours(0, 0, 0, 0)
          return vencimento < hoje
        })
        const pagas = notas.filter(n => n.status === 'paga')
        const total = notas.reduce((sum, n) => sum + (n.valor_total || 0), 0)

        return {
          total,
          pendentes: pendentes.length,
          vencidas: vencidas.length,
          pagas: pagas.length,
          lista: notas.slice(0, 10) // Mostrar apenas as 10 primeiras
        }
      }

      setNotasResumo({
        aReceber: calcularResumoNotas(notasReceber),
        aPagar: calcularResumoNotas(notasPagar)
      })

      // Carregar boletos
      const [boletosReceberResponse, boletosPagarResponse] = await Promise.all([
        boletosApi.list({ tipo: 'receber', limit: 100 }),
        boletosApi.list({ tipo: 'pagar', limit: 100 })
      ])

      const boletosEntrada = (boletosPagarResponse.data || boletosPagarResponse || []) as Boleto[]
      const boletosSaida = (boletosReceberResponse.data || boletosReceberResponse || []) as Boleto[]

      const calcularResumoBoletos = (boletos: Boleto[]) => {
        const pendentes = boletos.filter(b => b.status === 'pendente')
        const vencidos = boletos.filter(b => {
          if (b.status === 'pago' || b.status === 'cancelado') return false
          const vencimento = new Date(b.data_vencimento)
          vencimento.setHours(0, 0, 0, 0)
          return vencimento < hoje
        })
        const pagos = boletos.filter(b => b.status === 'pago')
        const total = boletos.reduce((sum, b) => sum + (b.valor || 0), 0)

        return {
          total,
          pendentes: pendentes.length,
          vencidos: vencidos.length,
          pagos: pagos.length,
          lista: boletos.slice(0, 10) // Mostrar apenas os 10 primeiros
        }
      }

      setBoletosResumo({
        entrada: calcularResumoBoletos(boletosEntrada),
        saida: calcularResumoBoletos(boletosSaida)
      })

      // Carregar contas bancárias
      const contasResponse = await apiContasBancarias.listar()
      const todasContas = (contasResponse.data || contasResponse || []) as any[]
      // Filtrar apenas contas ativas
      const contas = todasContas.filter((c: any) => (c.status === 'ativa' || c.ativa === true))
      const saldoTotal = contas.reduce((sum: number, c: any) => sum + (c.saldo_atual || 0), 0)

      setBancosResumo({
        totalContas: contas.length,
        saldoTotal,
        contas: contas.slice(0, 10) // Mostrar apenas as 10 primeiras
      })

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar dados financeiros",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'pendente': { label: 'Pendente', variant: 'secondary' },
      'paga': { label: 'Paga', variant: 'default' },
      'pago': { label: 'Pago', variant: 'default' },
      'vencida': { label: 'Vencida', variant: 'destructive' },
      'vencido': { label: 'Vencido', variant: 'destructive' },
      'cancelada': { label: 'Cancelada', variant: 'outline' },
      'cancelado': { label: 'Cancelado', variant: 'outline' }
    }
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (isLoading) {
    return (
      <ProtectedRoute permission="financeiro:visualizar">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-lg font-medium">Carregando dados financeiros...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permission="financeiro:visualizar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
            <p className="text-gray-600 mt-1">Resumo de notas fiscais, boletos e contas bancárias</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notas a Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(notasResumo.aReceber.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {notasResumo.aReceber.pendentes} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notas a Pagar</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(notasResumo.aPagar.total)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {notasResumo.aPagar.pendentes} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boletos Pendentes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {boletosResumo.entrada.pendentes + boletosResumo.saida.pendentes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {boletosResumo.saida.vencidos + boletosResumo.entrada.vencidos} vencidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Bancário</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(bancosResumo.saldoTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {bancosResumo.totalContas} contas ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Notas Fiscais */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <CardTitle>Notas Fiscais</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/financeiro/notas-fiscais')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Todas
              </Button>
            </div>
            <CardDescription>Resumo de notas fiscais a receber e a pagar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Notas a Receber */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-base">A Receber</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-green-700">{formatarMoeda(notasResumo.aReceber.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                      <p className="text-xl font-bold">{notasResumo.aReceber.pendentes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vencidas</p>
                      <p className="text-xl font-bold text-red-600">{notasResumo.aReceber.vencidas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pagas</p>
                      <p className="text-xl font-bold text-blue-600">{notasResumo.aReceber.pagas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notas a Pagar */}
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-base">A Pagar</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-red-700">{formatarMoeda(notasResumo.aPagar.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                      <p className="text-xl font-bold">{notasResumo.aPagar.pendentes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vencidas</p>
                      <p className="text-xl font-bold text-orange-600">{notasResumo.aPagar.vencidas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pagas</p>
                      <p className="text-xl font-bold text-blue-600">{notasResumo.aPagar.pagas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Notas Recentes */}
            <Tabs defaultValue="receber" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="receber">A Receber</TabsTrigger>
                <TabsTrigger value="pagar">A Pagar</TabsTrigger>
              </TabsList>
              <TabsContent value="receber" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número NF</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notasResumo.aReceber.lista.length > 0 ? (
                        notasResumo.aReceber.lista.map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell className="font-medium">{nota.numero_nf}</TableCell>
                            <TableCell>{nota.clientes?.nome || '-'}</TableCell>
                            <TableCell>{nota.data_vencimento ? formatarData(nota.data_vencimento) : '-'}</TableCell>
                            <TableCell>{formatarMoeda(nota.valor_total)}</TableCell>
                            <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                            Nenhuma nota fiscal encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="pagar" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número NF</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notasResumo.aPagar.lista.length > 0 ? (
                        notasResumo.aPagar.lista.map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell className="font-medium">{nota.numero_nf}</TableCell>
                            <TableCell>{nota.fornecedores?.nome || '-'}</TableCell>
                            <TableCell>{nota.data_vencimento ? formatarData(nota.data_vencimento) : '-'}</TableCell>
                            <TableCell>{formatarMoeda(nota.valor_total)}</TableCell>
                            <TableCell>{getStatusBadge(nota.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                            Nenhuma nota fiscal encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Resumo de Boletos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <CardTitle>Boletos</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/financeiro/boletos')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Todos
              </Button>
            </div>
            <CardDescription>Resumo de boletos de entrada e saída</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Boletos de Entrada (A Pagar) */}
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-base">A Pagar</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-red-700">{formatarMoeda(boletosResumo.entrada.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                      <p className="text-xl font-bold">{boletosResumo.entrada.pendentes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vencidos</p>
                      <p className="text-xl font-bold text-orange-600">{boletosResumo.entrada.vencidos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pagos</p>
                      <p className="text-xl font-bold text-blue-600">{boletosResumo.entrada.pagos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boletos de Saída (A Receber) */}
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-base">A Receber</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-green-700">{formatarMoeda(boletosResumo.saida.total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                      <p className="text-xl font-bold">{boletosResumo.saida.pendentes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vencidos</p>
                      <p className="text-xl font-bold text-red-600">{boletosResumo.saida.vencidos}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pagos</p>
                      <p className="text-xl font-bold text-blue-600">{boletosResumo.saida.pagos}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Boletos Recentes */}
            <Tabs defaultValue="entrada" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrada">A Pagar</TabsTrigger>
                <TabsTrigger value="saida">A Receber</TabsTrigger>
              </TabsList>
              <TabsContent value="entrada" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente/Fornecedor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boletosResumo.entrada.lista.length > 0 ? (
                        boletosResumo.entrada.lista.map((boleto) => (
                          <TableRow key={boleto.id}>
                            <TableCell className="font-medium">{boleto.numero_boleto}</TableCell>
                            <TableCell>{boleto.clientes?.nome || '-'}</TableCell>
                            <TableCell>{formatarData(boleto.data_vencimento)}</TableCell>
                            <TableCell>{formatarMoeda(boleto.valor)}</TableCell>
                            <TableCell>{getStatusBadge(boleto.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                            Nenhum boleto encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="saida" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boletosResumo.saida.lista.length > 0 ? (
                        boletosResumo.saida.lista.map((boleto) => (
                          <TableRow key={boleto.id}>
                            <TableCell className="font-medium">{boleto.numero_boleto}</TableCell>
                            <TableCell>{boleto.clientes?.nome || '-'}</TableCell>
                            <TableCell>{formatarData(boleto.data_vencimento)}</TableCell>
                            <TableCell>{formatarMoeda(boleto.valor)}</TableCell>
                            <TableCell>{getStatusBadge(boleto.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                            Nenhum boleto encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Resumo Bancário */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <CardTitle>Contas Bancárias</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/financeiro/bancos')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Todas
              </Button>
            </div>
            <CardDescription>Resumo das contas bancárias e saldos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bancosResumo.totalContas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatarMoeda(bancosResumo.saldoTotal)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bancosResumo.contas.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Contas Bancárias */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco</TableHead>
                    <TableHead>Agência</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bancosResumo.contas.length > 0 ? (
                    bancosResumo.contas.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.banco}</TableCell>
                        <TableCell>{conta.agencia}</TableCell>
                        <TableCell>{conta.conta}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(conta.tipo === 'corrente' || conta.tipo_conta === 'corrente') ? 'Corrente' : 
                             (conta.tipo === 'poupanca' || conta.tipo_conta === 'poupanca') ? 'Poupança' : 'Investimento'}
                          </Badge>
                        </TableCell>
                        <TableCell className={conta.saldo_atual >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {formatarMoeda(conta.saldo_atual)}
                        </TableCell>
                        <TableCell>
                          {(conta.status === 'ativa' || conta.ativa === true) ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {conta.status === 'bloqueada' ? 'Bloqueada' : 'Inativa'}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                        Nenhuma conta bancária encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
