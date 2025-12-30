"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Building,
  Loader2,
  AlertCircle,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RegistroPendente {
  id: string
  funcionario_id: number
  data: string
  entrada?: string
  saida_almoco?: string
  volta_almoco?: string
  saida?: string
  horas_trabalhadas?: number
  horas_extras?: number
  trabalho_corrido: boolean
  trabalho_corrido_confirmado: boolean
  trabalho_corrido_confirmado_por?: number
  trabalho_corrido_confirmado_em?: string
  funcionario: {
    id: number
    nome: string
    cargo?: string
    obra_atual_id?: number
    obra?: {
      id: number
      nome: string
    }
  }
}

export default function TrabalhoCorridoPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [registros, setRegistros] = useState<RegistroPendente[]>([])
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0])
  const [filtroObra, setFiltroObra] = useState<string>('')
  const [registroSelecionado, setRegistroSelecionado] = useState<RegistroPendente | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    carregarRegistros()
  }, [filtroData, filtroObra])

  const carregarRegistros = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const params = new URLSearchParams({
        data: filtroData
      })
      
      if (filtroObra) {
        params.append('obra_id', filtroObra)
      }

      const response = await fetch(`/api/ponto-eletronico/trabalho-corrido/pendentes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar registros')
      }

      const data = await response.json()
      setRegistros(data.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar registros:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os registros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const abrirDialogConfirmacao = (registro: RegistroPendente) => {
    setRegistroSelecionado(registro)
    setObservacoes('')
    setShowConfirmDialog(true)
  }

  const confirmarTrabalhoCorrido = async (confirmado: boolean) => {
    if (!registroSelecionado) return

    setConfirmando(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch('/api/ponto-eletronico/trabalho-corrido/confirmar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registro_ponto_id: registroSelecionado.id,
          confirmado,
          observacoes: observacoes.trim() || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao confirmar trabalho corrido')
      }

      toast({
        title: confirmado ? "Confirmado" : "Rejeitado",
        description: confirmado 
          ? "Trabalho corrido confirmado com sucesso" 
          : "Trabalho corrido rejeitado",
        variant: "default"
      })

      setShowConfirmDialog(false)
      setRegistroSelecionado(null)
      setObservacoes('')
      carregarRegistros()
    } catch (error: any) {
      console.error('Erro ao confirmar:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível confirmar o trabalho corrido",
        variant: "destructive"
      })
    } finally {
      setConfirmando(false)
    }
  }

  const formatarHora = (hora?: string) => {
    if (!hora) return '-'
    return hora.substring(0, 5)
  }

  const formatarData = (data: string) => {
    try {
      return format(new Date(data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return data
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="w-8 h-8" />
          Confirmação de Trabalho Corrido
        </h1>
        <p className="text-muted-foreground mt-2">
          Confirme ou rejeite registros de trabalho corrido (sem pausa para almoço)
        </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="obra">Obra (opcional)</Label>
              <Input
                id="obra"
                type="text"
                placeholder="ID da obra"
                value={filtroObra}
                onChange={(e) => setFiltroObra(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Pendentes de Confirmação</CardTitle>
          <CardDescription>
            {registros.length} registro(s) encontrado(s) para {formatarData(filtroData)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Carregando registros...</span>
            </div>
          ) : registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro pendente</h3>
              <p className="text-muted-foreground">
                Não há registros de trabalho corrido pendentes de confirmação para esta data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{registro.funcionario.nome}</div>
                            {registro.funcionario.cargo && (
                              <div className="text-sm text-muted-foreground">
                                {registro.funcionario.cargo}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {registro.funcionario.obra ? (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span>{registro.funcionario.obra.nome}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatarData(registro.data)}
                        </div>
                      </TableCell>
                      <TableCell>{formatarHora(registro.entrada)}</TableCell>
                      <TableCell>{formatarHora(registro.saida)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{registro.horas_trabalhadas?.toFixed(2) || '0.00'}h</span>
                          {registro.horas_extras && registro.horas_extras > 0 && (
                            <span className="text-sm text-green-600">
                              +{registro.horas_extras.toFixed(2)}h extras
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          Pendente
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirDialogConfirmacao(registro)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRegistroSelecionado(registro)
                              setObservacoes('')
                              confirmarTrabalhoCorrido(false)
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Trabalho Corrido</DialogTitle>
            <DialogDescription>
              Confirme o trabalho corrido do funcionário. Isso adicionará 1 hora extra ao registro.
            </DialogDescription>
          </DialogHeader>
          
          {registroSelecionado && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Funcionário:</span>
                  <p className="font-semibold">{registroSelecionado.funcionario.nome}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Data:</span>
                  <p>{formatarData(registroSelecionado.data)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Horário:</span>
                  <p>
                    {formatarHora(registroSelecionado.entrada)} - {formatarHora(registroSelecionado.saida)}
                  </p>
                </div>
                {registroSelecionado.funcionario.obra && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Obra:</span>
                    <p>{registroSelecionado.funcionario.obra.nome}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações sobre a confirmação..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                  disabled={confirmando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => confirmarTrabalhoCorrido(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={confirmando}
                >
                  {confirmando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

