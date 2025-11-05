"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Save, 
  X,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { useCurrentUser } from "@/hooks/use-current-user"

interface ChecklistDiario {
  id?: number
  grua_id: string
  funcionario_id: number
  data: string
  cabos: boolean
  polias: boolean
  estrutura: boolean
  movimentos: boolean
  freios: boolean
  limitadores: boolean
  indicadores: boolean
  aterramento: boolean
  observacoes?: string
  created_at?: string
}

interface LivroGruaChecklistDiarioProps {
  gruaId: string
  checklist?: ChecklistDiario
  onSave?: (checklist: ChecklistDiario) => void
  onCancel?: () => void
  modoEdicao?: boolean
}

export function LivroGruaChecklistDiario({
  gruaId,
  checklist,
  onSave,
  onCancel,
  modoEdicao = false
}: LivroGruaChecklistDiarioProps) {
  const { toast } = useToast()
  const { user, loading: userLoading } = useCurrentUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ChecklistDiario>({
    grua_id: gruaId,
    funcionario_id: 0,
    data: new Date().toISOString().split('T')[0],
    cabos: false,
    polias: false,
    estrutura: false,
    movimentos: false,
    freios: false,
    limitadores: false,
    indicadores: false,
    aterramento: false,
    observacoes: ''
  })

  // Carregar dados do funcionário logado
  useEffect(() => {
    if (user && user.funcionario_id) {
      setFormData(prev => ({
        ...prev,
        funcionario_id: user.funcionario_id || user.id
      }))
    }
  }, [user])

  // Carregar dados do checklist se estiver editando
  useEffect(() => {
    if (checklist) {
      setFormData({
        id: checklist.id,
        grua_id: checklist.grua_id || gruaId,
        funcionario_id: checklist.funcionario_id,
        data: checklist.data,
        cabos: checklist.cabos === true || checklist.cabos === 1 || checklist.cabos === '1',
        polias: checklist.polias === true || checklist.polias === 1 || checklist.polias === '1',
        estrutura: checklist.estrutura === true || checklist.estrutura === 1 || checklist.estrutura === '1',
        movimentos: checklist.movimentos === true || checklist.movimentos === 1 || checklist.movimentos === '1',
        freios: checklist.freios === true || checklist.freios === 1 || checklist.freios === '1',
        limitadores: checklist.limitadores === true || checklist.limitadores === 1 || checklist.limitadores === '1',
        indicadores: checklist.indicadores === true || checklist.indicadores === 1 || checklist.indicadores === '1',
        aterramento: checklist.aterramento === true || checklist.aterramento === 1 || checklist.aterramento === '1',
        observacoes: checklist.observacoes || '',
        created_at: checklist.created_at
      })
    }
  }, [checklist, gruaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.funcionario_id || formData.funcionario_id === 0) {
      setError('Funcionário não identificado. Verifique se você está logado corretamente.')
      toast({
        title: "Erro",
        description: "Funcionário não identificado",
        variant: "destructive"
      })
      return
    }

    if (!formData.data) {
      setError('Data é obrigatória')
      toast({
        title: "Erro",
        description: "Data é obrigatória",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar dados para a API
      const checklistData = {
        grua_id: formData.grua_id,
        funcionario_id: formData.funcionario_id,
        data_entrada: formData.data,
        hora_entrada: new Date().toTimeString().slice(0, 5),
        tipo_entrada: 'checklist' as const,
        status_entrada: 'ok' as const,
        descricao: `Checklist diário - ${formData.data}`,
        observacoes: formData.observacoes || '',
        // Campos específicos do checklist
        cabos: formData.cabos,
        polias: formData.polias,
        estrutura: formData.estrutura,
        movimentos: formData.movimentos,
        freios: formData.freios,
        limitadores: formData.limitadores,
        indicadores: formData.indicadores,
        aterramento: formData.aterramento
      }

      if (modoEdicao && formData.id) {
        // Atualizar checklist existente
        await livroGruaApi.atualizarEntrada(formData.id, checklistData as any)
        toast({
          title: "Sucesso",
          description: "Checklist atualizado com sucesso"
        })
      } else {
        // Criar novo checklist
        await livroGruaApi.criarEntrada(checklistData as any)
        toast({
          title: "Sucesso",
          description: "Checklist criado com sucesso"
        })
      }

      onSave?.(formData)
    } catch (err) {
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

  const toggleCheckbox = (field: keyof ChecklistDiario) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (userLoading) {
    return <ButtonLoader text="Carregando dados do funcionário..." />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações do Funcionário e Data - Card Unificado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nome do Funcionário */}
            {user && (
              <div>
                <Label className="text-xs text-gray-500">Funcionário</Label>
                <Input
                  value={user.nome || ''}
                  disabled
                  className="bg-gray-50 mt-1"
                />
              </div>
            )}
            
            {/* Cargo */}
            {user && (
              <div>
                <Label className="text-xs text-gray-500">Cargo</Label>
                <Input
                  value={user.cargo || ''}
                  disabled
                  className="bg-gray-50 mt-1"
                />
              </div>
            )}

            {/* Data */}
            <div>
              <Label htmlFor="data" className="text-xs text-gray-500">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
                disabled={!modoEdicao}
                className={`mt-1 ${!modoEdicao ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {!modoEdicao && (
                <p className="text-xs text-gray-500 mt-1">
                  Data fixa: hoje
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Itens do Checklist
          </CardTitle>
          <CardDescription className="text-xs">
            Marque os itens que foram verificados e estão em conformidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'cabos', label: 'Cabos' },
              { key: 'polias', label: 'Polias' },
              { key: 'estrutura', label: 'Estrutura' },
              { key: 'movimentos', label: 'Movimentos' },
              { key: 'freios', label: 'Freios' },
              { key: 'limitadores', label: 'Limitadores' },
              { key: 'indicadores', label: 'Indicadores' },
              { key: 'aterramento', label: 'Aterramento' }
            ].map((item) => (
              <div key={item.key} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                <Checkbox
                  id={item.key}
                  checked={formData[item.key as keyof ChecklistDiario] as boolean}
                  onCheckedChange={() => toggleCheckbox(item.key as keyof ChecklistDiario)}
                />
                <Label
                  htmlFor={item.key}
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="observacoes" className="text-xs text-gray-500">
              Observações Adicionais
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              placeholder="Adicione observações sobre o checklist (opcional)..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Ações */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <ButtonLoader text="Salvando..." />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {modoEdicao ? 'Atualizar' : 'Salvar'} Checklist
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

