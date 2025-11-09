"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  X,
  Wrench,
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { manutencoesApi, type ManutencaoOrdemBackend } from "@/lib/api-manutencoes"
import GruaSearch from "@/components/grua-search"
import { gruasApi } from "@/lib/api-gruas"

interface ManutencaoFormProps {
  obraId?: number
  gruaId?: string
  manutencao?: ManutencaoOrdemBackend
  onSave: () => void
  onCancel: () => void
}

export function ManutencaoForm({
  obraId,
  gruaId: initialGruaId,
  manutencao,
  onSave,
  onCancel
}: ManutencaoFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [gruaId, setGruaId] = useState(initialGruaId || manutencao?.grua_id || "")
  const [tipo, setTipo] = useState<'preventiva' | 'corretiva' | 'preditiva' | 'emergencial'>(
    (manutencao?.tipo as any) || 'preventiva'
  )
  const [descricao, setDescricao] = useState(manutencao?.descricao || "")
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta' | 'critica'>(
    (manutencao?.prioridade as any) || 'media'
  )
  const [dataPrevista, setDataPrevista] = useState(
    manutencao?.data_prevista || new Date().toISOString().split('T')[0]
  )
  const [observacoes, setObservacoes] = useState(manutencao?.observacoes || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!gruaId) {
      setError("Selecione uma grua")
      return
    }

    if (!descricao.trim()) {
      setError("Descrição é obrigatória")
      return
    }

    try {
      setLoading(true)

      if (manutencao) {
        // Atualizar manutenção existente
        await manutencoesApi.ordens.atualizar(manutencao.id, {
          tipo,
          descricao,
          prioridade,
          data_prevista: dataPrevista,
          observacoes: observacoes || undefined
        })
        toast({
          title: "Sucesso",
          description: "Manutenção atualizada com sucesso"
        })
      } else {
        // Criar nova manutenção
        await manutencoesApi.ordens.criar({
          grua_id: gruaId,
          obra_id: obraId,
          tipo,
          descricao,
          prioridade,
          data_prevista: dataPrevista,
          observacoes: observacoes || undefined
        })
        toast({
          title: "Sucesso",
          description: "Manutenção criada com sucesso"
        })
      }

      onSave()
    } catch (err: any) {
      console.error('Erro ao salvar manutenção:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar manutenção'
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Informações da Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="grua">
              Grua <span className="text-red-500">*</span>
            </Label>
            <GruaSearch
              onGruaSelect={(grua) => setGruaId(grua.id.toString())}
              selectedGrua={gruaId ? { id: gruaId } : undefined}
              onlyAvailable={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select value={tipo} onValueChange={(value: any) => setTipo(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                  <SelectItem value="preditiva">Preditiva</SelectItem>
                  <SelectItem value="emergencial">Emergencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prioridade">
                Prioridade <span className="text-red-500">*</span>
              </Label>
              <Select value={prioridade} onValueChange={(value: any) => setPrioridade(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="data_prevista">
              Data Prevista
            </Label>
            <Input
              id="data_prevista"
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="descricao">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a manutenção a ser realizada..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais (opcional)..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações da Manutenção (se visualizando) */}
      {manutencao && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={
                  manutencao.status === 'concluida' ? 'default' :
                  manutencao.status === 'em_andamento' ? 'secondary' :
                  'outline'
                }>
                  {manutencao.status}
                </Badge>
              </div>
              {manutencao.data_inicio && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Início:</span>
                  <span className="text-sm">
                    {new Date(manutencao.data_inicio).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {manutencao.data_fim && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Fim:</span>
                  <span className="text-sm">
                    {new Date(manutencao.data_fim).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Custo Total:</span>
                <span className="text-sm font-medium">
                  {manutencao.custo_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Ações */}
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
        {!manutencao && (
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <ButtonLoader text="Salvando..." />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Manutenção
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  )
}

