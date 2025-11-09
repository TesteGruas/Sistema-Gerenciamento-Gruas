"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  X,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { useCurrentUser } from "@/hooks/use-current-user"
import { checklistDiarioApi, type ChecklistModeloBackend, type ChecklistDiarioBackend, type ChecklistRespostaBackend } from "@/lib/api-checklist-diario"

interface ChecklistDiarioFormProps {
  obraId: number
  modelos: ChecklistModeloBackend[]
  checklist?: ChecklistDiarioBackend
  onSave: () => void
  onCancel: () => void
}

interface RespostaItem {
  item_id: string
  status: 'ok' | 'nao_conforme' | 'nao_aplicavel'
  observacao?: string
  plano_acao?: string
  responsavel_correcao_id?: number
  prazo_correcao?: string
}

export function ChecklistDiarioForm({
  obraId,
  modelos,
  checklist,
  onSave,
  onCancel
}: ChecklistDiarioFormProps) {
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [modeloId, setModeloId] = useState("")
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [respostas, setRespostas] = useState<Record<string, RespostaItem>>({})
  const [modeloSelecionado, setModeloSelecionado] = useState<ChecklistModeloBackend | null>(null)

  useEffect(() => {
    if (checklist) {
      setModeloId(checklist.modelo_id)
      setData(checklist.data)
      if (checklist.respostas) {
        const respostasMap: Record<string, RespostaItem> = {}
        checklist.respostas.forEach(resp => {
          if (resp.checklist_itens) {
            respostasMap[resp.item_id] = {
              item_id: resp.item_id,
              status: resp.status,
              observacao: resp.observacao,
              plano_acao: resp.plano_acao,
              responsavel_correcao_id: resp.responsavel_correcao_id,
              prazo_correcao: resp.prazo_correcao
            }
          }
        })
        setRespostas(respostasMap)
      }
    }
  }, [checklist])

  useEffect(() => {
    if (modeloId) {
      const modelo = modelos.find(m => m.id === modeloId)
      setModeloSelecionado(modelo || null)
      
      if (modelo && modelo.itens && !checklist) {
        // Inicializar respostas para novos checklists
        const novasRespostas: Record<string, RespostaItem> = {}
        modelo.itens.forEach(item => {
          if (!respostas[item.id]) {
            novasRespostas[item.id] = {
              item_id: item.id,
              status: 'ok'
            }
          }
        })
        setRespostas(prev => ({ ...prev, ...novasRespostas }))
      }
    }
  }, [modeloId, modelos, checklist])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!modeloId) {
      setError("Selecione um modelo de checklist")
      return
    }

    if (!data) {
      setError("Data é obrigatória")
      return
    }

    if (!user?.funcionario_id && !user?.id) {
      setError("Usuário não identificado")
      return
    }

    // Validar itens obrigatórios
    if (modeloSelecionado?.itens) {
      for (const item of modeloSelecionado.itens) {
        if (item.obrigatorio && (!respostas[item.id] || respostas[item.id].status === 'nao_conforme' && !respostas[item.id].plano_acao)) {
          if (respostas[item.id]?.status === 'nao_conforme' && !respostas[item.id].plano_acao) {
            setError(`Item obrigatório "${item.descricao}" está não conforme. É necessário preencher o plano de ação.`)
            return
          }
        }
      }
    }

    try {
      setLoading(true)

      const respostasArray = Object.values(respostas).filter(r => r.item_id)

      if (checklist) {
        // Visualização apenas - não permite edição
        toast({
          title: "Informação",
          description: "Checklists preenchidos não podem ser editados"
        })
        return
      } else {
        // Criar novo checklist
        await checklistDiarioApi.checklists.criar({
          obra_id: obraId,
          modelo_id: modeloId,
          data,
          responsavel_id: user?.funcionario_id || user?.id || 0,
          respostas: respostasArray
        })
        toast({
          title: "Sucesso",
          description: "Checklist criado com sucesso"
        })
      }

      onSave()
    } catch (err: any) {
      console.error('Erro ao salvar checklist:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar checklist'
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

  const updateResposta = (itemId: string, field: keyof RespostaItem, value: any) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        item_id: itemId,
        [field]: value
      }
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600'
      case 'nao_conforme': return 'text-red-600'
      case 'nao_aplicavel': return 'text-gray-600'
      default: return ''
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok': return 'OK'
      case 'nao_conforme': return 'Não Conforme'
      case 'nao_aplicavel': return 'N/A'
      default: return status
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informações do Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modelo">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <select
                id="modelo"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={modeloId}
                onChange={(e) => setModeloId(e.target.value)}
                disabled={!!checklist}
                required
              >
                <option value="">Selecione um modelo...</option>
                {modelos.filter(m => m.ativo).map(modelo => (
                  <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="data">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={!!checklist}
                required
              />
            </div>
          </div>

          {user && (
            <div>
              <Label>Responsável</Label>
              <Input
                value={user.nome || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itens do Checklist */}
      {modeloSelecionado && modeloSelecionado.itens && modeloSelecionado.itens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Itens do Checklist
            </CardTitle>
            <CardDescription>
              {modeloSelecionado.nome}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {modeloSelecionado.itens
              .sort((a, b) => a.ordem - b.ordem)
              .map((item) => {
                const resposta = respostas[item.id] || { item_id: item.id, status: 'ok' as const }
                const isNC = resposta.status === 'nao_conforme'
                
                return (
                  <Card key={item.id} className={isNC ? "border-red-200 bg-red-50/50" : ""}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{item.ordem}</Badge>
                              <span className="font-medium">{item.categoria}</span>
                              {item.obrigatorio && (
                                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.descricao}</p>
                          </div>
                        </div>

                        {!checklist && (
                          <RadioGroup
                            value={resposta.status}
                            onValueChange={(value) => updateResposta(item.id, 'status', value)}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ok" id={`ok-${item.id}`} />
                              <Label htmlFor={`ok-${item.id}`} className="cursor-pointer text-green-600">
                                OK
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_conforme" id={`nc-${item.id}`} />
                              <Label htmlFor={`nc-${item.id}`} className="cursor-pointer text-red-600">
                                Não Conforme
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_aplicavel" id={`na-${item.id}`} />
                              <Label htmlFor={`na-${item.id}`} className="cursor-pointer text-gray-600">
                                N/A
                              </Label>
                            </div>
                          </RadioGroup>
                        )}

                        {checklist && (
                          <div>
                            <Badge variant={resposta.status === 'ok' ? 'default' : resposta.status === 'nao_conforme' ? 'destructive' : 'secondary'}>
                              {getStatusLabel(resposta.status)}
                            </Badge>
                          </div>
                        )}

                        {(resposta.status === 'nao_conforme' || isNC) && (
                          <div className="space-y-3 p-4 bg-red-50 rounded-md border border-red-200">
                            <div>
                              <Label>Observação</Label>
                              <Textarea
                                value={resposta.observacao || ''}
                                onChange={(e) => updateResposta(item.id, 'observacao', e.target.value)}
                                disabled={!!checklist}
                                placeholder="Descreva a não conformidade..."
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label>Plano de Ação</Label>
                              <Textarea
                                value={resposta.plano_acao || ''}
                                onChange={(e) => updateResposta(item.id, 'plano_acao', e.target.value)}
                                disabled={!!checklist}
                                placeholder="Descreva o plano de ação para correção..."
                                rows={2}
                                required={resposta.status === 'nao_conforme' && !checklist}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Prazo de Correção</Label>
                                <Input
                                  type="date"
                                  value={resposta.prazo_correcao || ''}
                                  onChange={(e) => updateResposta(item.id, 'prazo_correcao', e.target.value)}
                                  disabled={!!checklist}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {resposta.observacao && resposta.status !== 'nao_conforme' && (
                          <div>
                            <Label>Observação</Label>
                            <Textarea
                              value={resposta.observacao}
                              onChange={(e) => updateResposta(item.id, 'observacao', e.target.value)}
                              disabled={!!checklist}
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Ações */}
      {!checklist && (
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
                Salvar Checklist
              </>
            )}
          </Button>
        </div>
      )}

      {checklist && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      )}
    </form>
  )
}

