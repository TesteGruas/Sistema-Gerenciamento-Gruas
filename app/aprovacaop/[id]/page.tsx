"use client"

import { useState, useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Loader2, Clock, User, Calendar, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AprovacaoData {
  id: string
  funcionario: {
    nome: string
    cpf: string | null
  }
  horas_extras: string
  data_trabalho: string
  data_limite: string
  observacoes: string | null
  status: string
  registro_ponto: {
    entrada: string
    saida: string
  } | null
}

export default function AprovacaoPublicaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [aprovacao, setAprovacao] = useState<AprovacaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [acao, setAcao] = useState<'aprovar' | 'rejeitar' | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [motivoRejeicao, setMotivoRejeicao] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Token de aprovação não fornecido')
      setLoading(false)
      return
    }

    carregarAprovacao()
  }, [token, resolvedParams.id])

  const carregarAprovacao = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/aprovacao/${resolvedParams.id}?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || 'Erro ao carregar aprovação')
        setLoading(false)
        return
      }

      setAprovacao(data.data)
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar aprovação:', err)
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  const processarAprovacao = async (tipo: 'aprovar' | 'rejeitar') => {
    if (!token) return

    if (tipo === 'rejeitar' && !motivoRejeicao.trim()) {
      setError('Por favor, informe o motivo da rejeição')
      return
    }

    setProcessando(true)
    setError(null)
    setAcao(tipo)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const endpoint = tipo === 'aprovar' 
        ? `${apiUrl}/api/aprovacao/${resolvedParams.id}/aprovar?token=${token}`
        : `${apiUrl}/api/aprovacao/${resolvedParams.id}/rejeitar?token=${token}`

      const body = tipo === 'aprovar'
        ? { observacoes: observacoes || null }
        : { motivo: motivoRejeicao }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || `Erro ao ${tipo === 'aprovar' ? 'aprovar' : 'rejeitar'} aprovação`)
        setProcessando(false)
        return
      }

      setSucesso(true)
      setProcessando(false)
      
      // Atualizar status da aprovação
      if (aprovacao) {
        setAprovacao({
          ...aprovacao,
          status: tipo === 'aprovar' ? 'aprovado' : 'rejeitado'
        })
      }
    } catch (err) {
      console.error(`Erro ao ${tipo} aprovação:`, err)
      setError('Erro ao conectar com o servidor')
      setProcessando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Carregando aprovação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !aprovacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              {acao === 'aprovar' ? (
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              ) : (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
              <h2 className="text-2xl font-bold text-center">
                {acao === 'aprovar' ? 'Aprovação Confirmada' : 'Rejeição Confirmada'}
              </h2>
              <p className="text-gray-600 text-center">
                {acao === 'aprovar'
                  ? 'As horas extras foram aprovadas com sucesso!'
                  : 'As horas extras foram rejeitadas.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!aprovacao) {
    return null
  }

  const jaProcessada = aprovacao.status !== 'pendente'

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aprovação de Horas Extras
            </CardTitle>
            <CardDescription>
              Solicitação de aprovação de horas extras trabalhadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {jaProcessada && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta aprovação já foi {aprovacao.status === 'aprovado' ? 'aprovada' : 'rejeitada'}.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
                  <p className="text-lg font-semibold">{aprovacao.funcionario.nome}</p>
                  {aprovacao.funcionario.cpf && (
                    <p className="text-sm text-gray-500">CPF: {aprovacao.funcionario.cpf}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data do Trabalho</Label>
                  <p className="text-lg font-semibold">{aprovacao.data_trabalho}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <Label className="text-sm font-medium text-gray-600">Horas Extras</Label>
                  <p className="text-lg font-semibold">{aprovacao.horas_extras}h</p>
                </div>
              </div>

              {aprovacao.registro_ponto && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Horários</Label>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Entrada</p>
                      <p className="font-semibold">{aprovacao.registro_ponto.entrada}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saída</p>
                      <p className="font-semibold">{aprovacao.registro_ponto.saida}</p>
                    </div>
                  </div>
                </div>
              )}

              {aprovacao.observacoes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">Observações</Label>
                  <p className="mt-1 text-sm">{aprovacao.observacoes}</p>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-sm font-medium text-blue-900">Prazo para Aprovação</Label>
                <p className="mt-1 text-sm text-blue-700">Válido até: {aprovacao.data_limite}</p>
              </div>
            </div>

            {!jaProcessada && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Adicione observações sobre a aprovação..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="motivo" className="text-red-600">
                    Motivo da Rejeição *
                  </Label>
                  <Textarea
                    id="motivo"
                    placeholder="Informe o motivo da rejeição (obrigatório para rejeitar)..."
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    className="mt-1"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => processarAprovacao('aprovar')}
                    disabled={processando}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processando && acao === 'aprovar' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => processarAprovacao('rejeitar')}
                    disabled={processando}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processando && acao === 'rejeitar' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

