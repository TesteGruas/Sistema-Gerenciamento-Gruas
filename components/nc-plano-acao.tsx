"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Save, 
  X,
  AlertCircle,
  Calendar,
  User,
  FileText
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { checklistDiarioApi, type NaoConformidadeBackend } from "@/lib/api-checklist-diario"

interface NaoConformidadePlanoAcaoProps {
  naoConformidade: NaoConformidadeBackend
  onSave: () => void
  onCancel: () => void
}

export function NaoConformidadePlanoAcao({
  naoConformidade,
  onSave,
  onCancel
}: NaoConformidadePlanoAcaoProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [planoAcao, setPlanoAcao] = useState(naoConformidade.plano_acao || "")
  const [responsavelId, setResponsavelId] = useState<number | undefined>(naoConformidade.responsavel_correcao_id)
  const [prazoCorrecao, setPrazoCorrecao] = useState(naoConformidade.prazo_correcao || "")
  const [statusCorrecao, setStatusCorrecao] = useState<'pendente' | 'em_andamento' | 'concluido' | 'cancelado'>(
    (naoConformidade.status_correcao as any) || 'pendente'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (statusCorrecao === 'em_andamento' || statusCorrecao === 'concluido') {
      if (!planoAcao.trim()) {
        setError("Plano de ação é obrigatório")
        return
      }
    }

    try {
      setLoading(true)

      await checklistDiarioApi.naoConformidades.atualizarStatus(naoConformidade.id, {
        status_correcao: statusCorrecao
      })

      toast({
        title: "Sucesso",
        description: "Status da não conformidade atualizado com sucesso"
      })

      onSave()
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status'
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
      {/* Informações da Não Conformidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Não Conformidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Item</Label>
            <p className="font-medium">{naoConformidade.checklist_itens?.descricao || 'N/A'}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <p className="font-medium">{naoConformidade.checklist_itens?.categoria || 'N/A'}</p>
          </div>

          {naoConformidade.observacao && (
            <div>
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <p className="text-sm">{naoConformidade.observacao}</p>
            </div>
          )}

          {naoConformidade.checklists_diarios && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Data do Checklist
                </Label>
                <p className="text-sm">
                  {naoConformidade.checklists_diarios.data 
                    ? new Date(naoConformidade.checklists_diarios.data).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
              {naoConformidade.checklists_diarios.funcionarios && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Responsável pelo Checklist
                  </Label>
                  <p className="text-sm">{naoConformidade.checklists_diarios.funcionarios.nome}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plano de Ação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Plano de Ação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="plano_acao">
              Plano de Ação <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="plano_acao"
              value={planoAcao}
              onChange={(e) => setPlanoAcao(e.target.value)}
              placeholder="Descreva o plano de ação para correção da não conformidade..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prazo_correcao">Prazo de Correção</Label>
              <Input
                id="prazo_correcao"
                type="date"
                value={prazoCorrecao}
                onChange={(e) => setPrazoCorrecao(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status_correcao">Status da Correção</Label>
              <Select
                value={statusCorrecao}
                onValueChange={(value: any) => setStatusCorrecao(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {naoConformidade.plano_acao && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <Label className="text-xs text-muted-foreground">Plano de Ação Atual</Label>
              <p className="text-sm mt-1">{naoConformidade.plano_acao}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Atual */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
        <div>
          <Label className="text-xs text-muted-foreground">Status Atual</Label>
          <div className="mt-1">
            <Badge variant={
              naoConformidade.status_correcao === 'concluido' ? 'default' :
              naoConformidade.status_correcao === 'em_andamento' ? 'secondary' :
              'destructive'
            }>
              {naoConformidade.status_correcao || 'Pendente'}
            </Badge>
          </div>
        </div>
        {naoConformidade.prazo_correcao && (
          <div>
            <Label className="text-xs text-muted-foreground">Prazo</Label>
            <p className="text-sm mt-1">
              {new Date(naoConformidade.prazo_correcao).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </div>

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
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <ButtonLoader text="Salvando..." />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Atualizar Status
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

