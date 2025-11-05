"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Save, 
  X,
  Calendar,
  User,
  Wrench,
  AlertCircle
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { livroGruaApi } from "@/lib/api-livro-grua"
import FuncionarioSearch from "@/components/funcionario-search"

interface Manutencao {
  id?: number
  grua_id: string
  data: string
  realizado_por_id: number
  realizado_por_nome?: string
  cargo?: string
  descricao?: string
  observacoes?: string
  created_at?: string
}

interface LivroGruaManutencaoProps {
  gruaId: string
  manutencao?: Manutencao
  onSave?: (manutencao: Manutencao) => void
  onCancel?: () => void
  modoEdicao?: boolean
}

export function LivroGruaManutencao({
  gruaId,
  manutencao,
  onSave,
  onCancel,
  modoEdicao = false
}: LivroGruaManutencaoProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<any>(null)
  
  const [formData, setFormData] = useState<Manutencao>({
    grua_id: gruaId,
    data: new Date().toISOString().split('T')[0],
    realizado_por_id: 0,
    cargo: '',
    descricao: '',
    observacoes: ''
  })

  // Carregar dados da manutenção se estiver editando
  useEffect(() => {
    if (manutencao) {
      setFormData({
        id: manutencao.id,
        grua_id: manutencao.grua_id,
        data: manutencao.data,
        realizado_por_id: manutencao.realizado_por_id,
        realizado_por_nome: manutencao.realizado_por_nome,
        cargo: manutencao.cargo || '',
        descricao: manutencao.descricao || '',
        observacoes: manutencao.observacoes || '',
        created_at: manutencao.created_at
      })

      // Se houver funcionário na manutenção, selecionar
      if (manutencao.realizado_por_id) {
        setFuncionarioSelecionado({
          id: manutencao.realizado_por_id,
          name: manutencao.realizado_por_nome || '',
          role: manutencao.cargo || ''
        })
      }
    }
  }, [manutencao])

  const handleFuncionarioSelect = (funcionario: any) => {
    setFuncionarioSelecionado(funcionario)
    setFormData({
      ...formData,
      realizado_por_id: funcionario?.id || funcionario?.userId || 0,
      realizado_por_nome: funcionario?.name || '',
      cargo: funcionario?.role || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.data) {
      setError('Data é obrigatória')
      toast({
        title: "Erro",
        description: "Data é obrigatória",
        variant: "destructive"
      })
      return
    }

    if (!formData.realizado_por_id || formData.realizado_por_id === 0) {
      setError('Selecione o funcionário que realizou a manutenção')
      toast({
        title: "Erro",
        description: "Selecione o funcionário que realizou a manutenção",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar dados para a API
      const manutencaoData = {
        ...formData,
        tipo_entrada: 'manutencao' as const,
        status_entrada: 'ok' as const,
        funcionario_id: formData.realizado_por_id,
        descricao: formData.descricao || `Manutenção realizada em ${formData.data}`
      }

      if (modoEdicao && formData.id) {
        // Atualizar manutenção existente
        await livroGruaApi.atualizarEntrada(formData.id, manutencaoData as any)
        toast({
          title: "Sucesso",
          description: "Manutenção atualizada com sucesso"
        })
      } else {
        // Criar nova manutenção
        await livroGruaApi.criarEntrada(manutencaoData as any)
        toast({
          title: "Sucesso",
          description: "Manutenção registrada com sucesso"
        })
      }

      onSave?.(formData)
    } catch (err) {
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
      {/* Data e Funcionário - Card Unificado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                A data pode ser qualquer dia
              </p>
            </div>

            {/* Funcionário */}
            <div>
              <Label htmlFor="funcionario" className="text-xs text-gray-500">
                Funcionário <span className="text-red-500">*</span>
              </Label>
              <FuncionarioSearch
                onFuncionarioSelect={handleFuncionarioSelect}
                selectedFuncionario={funcionarioSelecionado}
                placeholder="Buscar funcionário..."
                className="mt-1"
              />
            </div>

            {/* Cargo */}
            <div>
              <Label htmlFor="cargo" className="text-xs text-gray-500">
                Cargo
              </Label>
              <Input
                id="cargo"
                value={formData.cargo || funcionarioSelecionado?.role || ''}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Cargo do funcionário"
                className="mt-1"
                disabled={!funcionarioSelecionado}
              />
            </div>
          </div>

          {/* Preview do Funcionário Selecionado */}
          {funcionarioSelecionado && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{funcionarioSelecionado.name}</p>
                  <p className="text-xs text-blue-700">{funcionarioSelecionado.role}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Descrição */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Descrição da Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="descricao" className="text-xs text-gray-500">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao || ''}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              placeholder="Descreva o que foi feito na manutenção..."
              className="mt-1"
            />
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
              rows={2}
              placeholder="Adicione observações sobre a manutenção (opcional)..."
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
              {modoEdicao ? 'Atualizar' : 'Salvar'} Manutenção
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

