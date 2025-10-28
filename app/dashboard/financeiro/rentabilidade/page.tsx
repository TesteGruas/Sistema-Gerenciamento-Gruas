'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

interface RentabilidadeGrua {
  grua_id: string
  grua_nome: string
  modelo: string
  fabricante?: string
  tipo?: string
  receitas: number
  custos: number
  lucro: number
  margem_lucro: string
  roi: string
  taxa_utilizacao: string
  dias_operacao: number
  dias_periodo: number
  quantidade_locacoes: number
}

interface Totais {
  receitas_total: number
  custos_total: number
  lucro_total: number
  margem_media: string
  roi_medio: string
}

export default function RentabilidadePage() {
  const [dados, setDados] = useState<RentabilidadeGrua[]>([])
  const [totais, setTotais] = useState<Totais | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    // Definir período padrão: últimos 6 meses
    const hoje = new Date()
    const seisМesesAtras = new Date()
    seisМesesAtras.setMonth(hoje.getMonth() - 6)

    setDataFim(format(hoje, 'yyyy-MM-dd'))
    setDataInicio(format(seisМesesAtras, 'yyyy-MM-dd'))
  }, [])

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarRentabilidade()
    }
  }, [dataInicio, dataFim])

  const carregarRentabilidade = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const response = await fetch(
        `${API_URL}/api/rentabilidade/gruas?data_inicio=${dataInicio}&data_fim=${dataFim}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const data = await response.json()
      if (data.success) {
        setDados(data.data || [])
        setTotais(data.totais)
      }
    } catch (error) {
      console.error('Erro ao carregar rentabilidade:', error)
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

  const getLucroIcon = (lucro: number) => {
    return lucro >= 0 ? (
      <TrendingUp className="w-5 h-5 text-green-500" />
    ) : (
      <TrendingDown className="w-5 h-5 text-red-500" />
    )
  }

  const getPosicao = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}º`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Análise de Rentabilidade por Grua</h1>
        <p className="text-gray-500 mt-1">Compare a performance financeira de cada equipamento</p>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={carregarRentabilidade} className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analisar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totais Gerais */}
      {totais && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Receitas Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(totais.receitas_total)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Custos Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatarMoeda(totais.custos_total)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Lucro Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatarMoeda(totais.lucro_total)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Margem Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totais.margem_media}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ranking de Rentabilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Rentabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando análise...</div>
          ) : dados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado disponível para o período selecionado
            </div>
          ) : (
            <div className="space-y-4">
              {dados.map((grua, index) => (
                <div
                  key={grua.grua_id}
                  className="p-6 border rounded-lg hover:shadow-md transition"
                >
                  {/* Cabeçalho da Grua */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getPosicao(index)}</div>
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          {grua.grua_nome}
                          {getLucroIcon(grua.lucro)}
                        </h3>
                        <p className="text-sm text-gray-500">{grua.modelo}</p>
                        {grua.tipo && (
                          <Badge variant="outline" className="mt-1">{grua.tipo}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatarMoeda(grua.lucro)}
                      </div>
                      <div className="text-sm text-gray-500">Lucro Total</div>
                    </div>
                  </div>

                  {/* Métricas Financeiras */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Receitas</div>
                      <div className="font-semibold text-green-600">
                        {formatarMoeda(grua.receitas)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Custos</div>
                      <div className="font-semibold text-red-600">
                        {formatarMoeda(grua.custos)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Margem de Lucro</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {grua.margem_lucro}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">ROI</div>
                      <div className="font-semibold flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {grua.roi}%
                      </div>
                    </div>
                  </div>

                  {/* Métricas Operacionais */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-xs text-gray-500">Taxa de Utilização</div>
                      <div className="font-semibold">{grua.taxa_utilizacao}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Dias em Operação</div>
                      <div className="font-semibold">
                        {grua.dias_operacao} / {grua.dias_periodo} dias
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Locações</div>
                      <div className="font-semibold">{grua.quantidade_locacoes}</div>
                    </div>
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

