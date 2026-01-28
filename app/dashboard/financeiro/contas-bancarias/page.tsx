'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Building2, DollarSign, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

interface ContaBancaria {
  id: number
  banco: string
  agencia: string
  conta: string
  tipo: string
  saldo_atual: number
  status: string
  descricao?: string
  created_at: string
}

export default function ContasBancariasPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormulario, setShowFormulario] = useState(false)
  const [contaEdit, setContaEdit] = useState<ContaBancaria | null>(null)

  useEffect(() => {
    carregarContas()
  }, [])

  const carregarContas = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch(`${API_URL}/api/contas-bancarias`, {
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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }

  const saldoTotal = contas
    .filter(c => c.status === 'ativa')
    .reduce((sum, c) => sum + parseFloat(String(c.saldo_atual)), 0)

  const getStatusBadge = (status: string) => {
    return status === 'ativa' ? (
      <Badge className="bg-green-500">Ativa</Badge>
    ) : (
      <Badge className="bg-gray-500">Inativa</Badge>
    )
  }

  const getTipoConta = (tipo: string) => {
    const tipos: Record<string, string> = {
      corrente: 'Conta Corrente',
      poupanca: 'Poupança',
      investimento: 'Investimento',
      outros: 'Outros'
    }
    return tipos[tipo] || tipo
  }

  return (
    <div className="p-4 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas Bancárias</h1>
          <p className="text-gray-500 mt-1">Gerencie suas contas bancárias</p>
        </div>
        <Button onClick={() => setShowFormulario(!showFormulario)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Saldo Total */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm opacity-90">Saldo Consolidado</p>
                <p className="text-4xl font-bold mt-1">{formatarMoeda(saldoTotal)}</p>
                <p className="text-xs opacity-75 mt-1">
                  {contas.filter(c => c.status === 'ativa').length} conta(s) ativa(s)
                </p>
              </div>
            </div>
            <TrendingUp className="w-12 h-12 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['corrente', 'poupanca', 'investimento'].map(tipo => {
          const contasTipo = contas.filter(c => c.tipo === tipo && c.status === 'ativa')
          const saldoTipo = contasTipo.reduce((sum, c) => sum + parseFloat(String(c.saldo_atual)), 0)
          
          return (
            <Card key={tipo}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {getTipoConta(tipo)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(saldoTipo)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {contasTipo.length} conta(s)
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Contas ({contas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : contas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma conta cadastrada
            </div>
          ) : (
            <div className="space-y-3">
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className="flex items-center justify-between p-5 border rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{conta.banco}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Ag: {conta.agencia} • Conta: {conta.conta} • {getTipoConta(conta.tipo)}
                      </div>
                      {conta.descricao && (
                        <div className="text-xs text-gray-400 mt-1">{conta.descricao}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatarMoeda(conta.saldo_atual)}
                      </div>
                      <div className="mt-1">{getStatusBadge(conta.status)}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setContaEdit(conta)
                          setShowFormulario(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário de Nova Conta (simplificado - poderia ser um Dialog) */}
      {showFormulario && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>
              {contaEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Banco</Label>
                <Input placeholder="Ex: Banco do Brasil" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Input placeholder="corrente, poupanca, etc" />
              </div>
              <div>
                <Label>Agência</Label>
                <Input placeholder="Ex: 1234-5" />
              </div>
              <div>
                <Label>Conta</Label>
                <Input placeholder="Ex: 12345-6" />
              </div>
              <div>
                <Label>Saldo Inicial</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div>
                <Label>Status</Label>
                <Input placeholder="ativa ou inativa" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button>Salvar</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFormulario(false)
                  setContaEdit(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



