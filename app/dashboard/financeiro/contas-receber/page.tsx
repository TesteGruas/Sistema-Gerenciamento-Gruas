'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, AlertTriangle, CheckCircle, XCircle, Plus, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

interface ContaReceber {
  id: number
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  cliente?: { nome: string; cnpj: string }
  obra?: { nome: string }
  observacoes?: string
}

interface Alertas {
  vencidas: { quantidade: number; valor_total: number; contas: ContaReceber[] }
  vencendo: { quantidade: number; valor_total: number; contas: ContaReceber[] }
}

export default function ContasReceberPage() {
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [alertas, setAlertas] = useState<Alertas | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [showFormulario, setShowFormulario] = useState(false)

  useEffect(() => {
    carregarContas()
    carregarAlertas()
  }, [filtroStatus])

  const carregarContas = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      let url = `${API_URL}/api/contas-receber?limite=100`
      if (filtroStatus && filtroStatus !== 'todos') {
        url += `&status=${filtroStatus}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setContas(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarAlertas = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-receber/alertas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setAlertas(data.alertas)
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    }
  }

  const marcarComoPago = async (id: number) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-receber/${id}/pagar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_pagamento: new Date().toISOString().split('T')[0]
        })
      })

      if (response.ok) {
        carregarContas()
        carregarAlertas()
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    try {
      return format(new Date(data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return data
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'bg-yellow-500',
      pago: 'bg-green-500',
      vencido: 'bg-red-500',
      cancelado: 'bg-gray-500'
    }
    const labels = {
      pendente: 'Pendente',
      pago: 'Pago',
      vencido: 'Vencido',
      cancelado: 'Cancelado'
    }
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const totalGeral = contas.reduce((sum, c) => c.status === 'pendente' ? sum + parseFloat(String(c.valor)) : sum, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-gray-500 mt-1">Gerencie suas contas a receber</p>
        </div>
        <Button onClick={() => setShowFormulario(!showFormulario)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Alertas */}
      {alertas && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Contas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {alertas.vencidas.quantidade} contas
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Total: {formatarMoeda(alertas.vencidas.valor_total)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-500" />
                Vencendo em 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {alertas.vencendo.quantidade} contas
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Total: {formatarMoeda(alertas.vencendo.valor_total)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Total a Receber */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total a Receber (Pendente)</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatarMoeda(totalGeral)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas ({contas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : contas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma conta encontrada</div>
          ) : (
            <div className="space-y-3">
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{conta.descricao}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {conta.cliente?.nome} - Vencimento: {formatarData(conta.data_vencimento)}
                    </div>
                    {conta.obra && (
                      <div className="text-xs text-gray-400 mt-1">Obra: {conta.obra.nome}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatarMoeda(conta.valor)}</div>
                      <div>{getStatusBadge(conta.status)}</div>
                    </div>
                    {conta.status === 'pendente' && (
                      <Button
                        size="sm"
                        onClick={() => marcarComoPago(conta.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

