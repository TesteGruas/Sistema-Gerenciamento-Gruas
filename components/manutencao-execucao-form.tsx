"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  X,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  Wrench
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { manutencoesApi, type ManutencaoOrdemBackend, type ManutencaoOrdemUpdateData } from "@/lib/api-manutencoes"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ManutencaoExecucaoFormProps {
  manutencao: ManutencaoOrdemBackend
  onSave: () => void
  onCancel: () => void
}

export function ManutencaoExecucaoForm({
  manutencao,
  onSave,
  onCancel
}: ManutencaoExecucaoFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [horasTrabalhadas, setHorasTrabalhadas] = useState("")
  const [custoMaoObra, setCustoMaoObra] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [status, setStatus] = useState<string>(manutencao.status || 'agendada')

  useEffect(() => {
    if (manutencao) {
      setDataInicio(manutencao.data_inicio || "")
      setDataFim(manutencao.data_fim || "")
      setHorasTrabalhadas(manutencao.horas_trabalhadas?.toString() || "")
      setCustoMaoObra(manutencao.custo_mao_obra?.toString() || "")
      setObservacoes(manutencao.observacoes || "")
      setStatus(manutencao.status || 'agendada')
    }
  }, [manutencao])

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (!numericValue) return ''
    const number = parseFloat(numericValue) / 100
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const parseCurrency = (value: string) => {
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanValue) || 0
  }

  const handleCustoMaoObraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setCustoMaoObra(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (status === 'em_andamento' && !dataInicio) {
      setError("Data de início é obrigatória para iniciar a manutenção")
      return
    }

    if (status === 'concluida' && (!dataInicio || !dataFim)) {
      setError("Data de início e fim são obrigatórias para concluir a manutenção")
      return
    }

    setLoading(true)
    try {
      const updateData: ManutencaoOrdemUpdateData = {
        status,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        horas_trabalhadas: horasTrabalhadas ? Number(horasTrabalhadas) : undefined,
        custo_mao_obra: custoMaoObra ? parseCurrency(custoMaoObra) : undefined,
        observacoes: observacoes || undefined
      }

      await manutencoesApi.ordens.atualizar(manutencao.id, updateData)
      toast({
        title: "Sucesso",
        description: "Manutenção atualizada com sucesso"
      })
      onSave()
    } catch (error: any) {
      setError(error.message || "Erro ao atualizar manutenção")
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar manutenção",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      agendada: { label: "Agendada", variant: "outline" },
      em_andamento: { label: "Em Andamento", variant: "secondary" },
      concluida: { label: "Concluída", variant: "default" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Executar Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações da Manutenção */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <p className="text-sm font-medium capitalize">{manutencao.tipo}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Prioridade</Label>
              <Badge variant="outline" className="mt-1 capitalize">{manutencao.prioridade}</Badge>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <p className="text-sm">{manutencao.descricao}</p>
            </div>
            {manutencao.data_prevista && (
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Data Prevista
                </Label>
                <p className="text-sm">
                  {format(new Date(manutencao.data_prevista), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Custo Total
              </Label>
              <p className="text-sm font-medium">
                {manutencao.custo_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data de Início
              </Label>
              <Input
                id="data_inicio"
                type="datetime-local"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required={status === 'em_andamento' || status === 'concluida'}
              />
            </div>

            <div>
              <Label htmlFor="data_fim" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data de Fim
              </Label>
              <Input
                id="data_fim"
                type="datetime-local"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required={status === 'concluida'}
                disabled={status !== 'concluida'}
              />
            </div>
          </div>

          {/* Horas e Custos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="horas_trabalhadas" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Horas Trabalhadas
              </Label>
              <Input
                id="horas_trabalhadas"
                type="number"
                value={horasTrabalhadas}
                onChange={(e) => setHorasTrabalhadas(e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <Label htmlFor="custo_mao_obra" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Custo de Mão de Obra
              </Label>
              <Input
                id="custo_mao_obra"
                type="text"
                value={custoMaoObra}
                onChange={handleCustoMaoObraChange}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a execução da manutenção..."
              rows={4}
            />
          </div>

          {/* Itens da Manutenção */}
          {manutencao.itens && manutencao.itens.length > 0 && (
            <div>
              <Label className="mb-2 block">Itens Utilizados</Label>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {manutencao.itens.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantidade} x {item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {(item.quantidade * item.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <ButtonLoader text="Salvando..." />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Execução
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

