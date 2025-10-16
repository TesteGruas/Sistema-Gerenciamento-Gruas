"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  Save, 
  X,
  Calendar,
  Clock,
  User,
  Wrench,
  FileText,
  Upload
} from "lucide-react"
import { livroGruaApi, EntradaLivroGrua } from "@/lib/api-livro-grua"
import { ButtonLoader } from "@/components/ui/loader"

interface LivroGruaFormProps {
  gruaId: string
  entrada?: EntradaLivroGrua
  onSave?: (entrada: EntradaLivroGrua) => void
  onCancel?: () => void
  modoEdicao?: boolean
  funcionarioLogado?: { id: number; nome: string; cargo: string }
}

export default function LivroGruaForm({
  gruaId,
  entrada,
  onSave,
  onCancel,
  modoEdicao = false,
  funcionarioLogado
}: LivroGruaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<any>(null)
  
  const [formData, setFormData] = useState<Partial<EntradaLivroGrua>>(() => {
    console.log('LivroGruaForm - Inicializando formData com funcionarioLogado:', funcionarioLogado)
    return {
      grua_id: gruaId,
      funcionario_id: entrada?.funcionario_id || funcionarioLogado?.id || 0,
      data_entrada: entrada?.data_entrada || new Date().toISOString().split('T')[0],
      hora_entrada: entrada?.hora_entrada || new Date().toTimeString().slice(0, 5),
      tipo_entrada: entrada?.tipo_entrada || 'checklist',
      status_entrada: entrada?.status_entrada || 'ok',
      descricao: entrada?.descricao || '',
      observacoes: entrada?.observacoes || '',
      responsavel_resolucao: entrada?.responsavel_resolucao || '',
      data_resolucao: entrada?.data_resolucao || '',
      status_resolucao: entrada?.status_resolucao || 'pendente'
    }
  })

  // Auto-selecionar funcionário logado
  useEffect(() => {
    console.log('LivroGruaForm - funcionarioLogado recebido:', funcionarioLogado)
    if (funcionarioLogado) {
      console.log('LivroGruaForm - Configurando funcionário:', funcionarioLogado)
      setFuncionarioSelecionado({
        id: funcionarioLogado.id,
        name: funcionarioLogado.nome,
        role: funcionarioLogado.cargo
      })
      setFormData(prev => {
        const newData = { ...prev, funcionario_id: funcionarioLogado.id }
        console.log('LivroGruaForm - FormData atualizado:', newData)
        return newData
      })
    } else {
      console.log('LivroGruaForm - funcionarioLogado é null/undefined')
    }
  }, [funcionarioLogado])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('LivroGruaForm - handleSubmit - formData:', formData)
    console.log('LivroGruaForm - handleSubmit - funcionario_id:', formData.funcionario_id)
    
    if (!formData.funcionario_id) {
      setError('Selecione um funcionário')
      return
    }

    if (!formData.descricao.trim()) {
      setError('Descrição é obrigatória')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const dadosParaEnvio = {
        ...formData,
        grua_id: gruaId,
        funcionario_id: formData.funcionario_id,
        // Converter strings vazias para null nos campos de data
        data_resolucao: formData.data_resolucao && formData.data_resolucao.trim() !== '' ? formData.data_resolucao : null,
        responsavel_resolucao: formData.responsavel_resolucao && formData.responsavel_resolucao.trim() !== '' ? formData.responsavel_resolucao : null,
        observacoes: formData.observacoes && formData.observacoes.trim() !== '' ? formData.observacoes : null
      } as EntradaLivroGrua

      let resultado
      if (modoEdicao && entrada?.id) {
        resultado = await livroGruaApi.atualizarEntrada(entrada.id, dadosParaEnvio)
      } else {
        resultado = await livroGruaApi.criarEntrada(dadosParaEnvio)
      }

      if (onSave) {
        onSave(resultado.data)
      }

      // Resetar formulário se não for edição
      if (!modoEdicao) {
        setFormData({
          grua_id: gruaId,
          funcionario_id: 0,
          data_entrada: new Date().toISOString().split('T')[0],
          hora_entrada: new Date().toTimeString().slice(0, 5),
          tipo_entrada: 'checklist',
          status_entrada: 'ok',
          descricao: '',
          observacoes: '',
          responsavel_resolucao: '',
          data_resolucao: '',
          status_resolucao: 'pendente'
        })
        setFuncionarioSelecionado(null)
      }

    } catch (err) {
      console.error('Erro ao salvar entrada:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar entrada')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600'
      case 'manutencao': return 'text-yellow-600'
      case 'falha': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTipoEntradaIcon = (tipo: string) => {
    switch (tipo) {
      case 'checklist': return <FileText className="w-4 h-4" />
      case 'manutencao': return <Wrench className="w-4 h-4" />
      case 'falha': return <AlertCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getTipoEntradaIcon(formData.tipo_entrada || 'checklist')}
          {modoEdicao ? 'Editar Entrada' : 'Nova Entrada no Livro da Grua'}
        </CardTitle>
        <CardDescription>
          {modoEdicao ? 'Atualize os dados da entrada' : 'Registre uma nova entrada no livro da grua'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_entrada">Data da Entrada *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="data_entrada"
                  type="date"
                  value={formData.data_entrada}
                  onChange={(e) => setFormData({ ...formData, data_entrada: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="hora_entrada">Hora da Entrada</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="hora_entrada"
                  type="time"
                  value={formData.hora_entrada}
                  onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Funcionário */}
          <div>
            <Label htmlFor="funcionario">Funcionário Responsável *</Label>
            {funcionarioLogado ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md mt-1">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{funcionarioLogado.nome}</p>
                  <p className="text-sm text-blue-700">{funcionarioLogado.cargo}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-1">
                <p className="text-gray-500">Carregando dados do funcionário...</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Funcionário logado automaticamente selecionado
            </p>
            {/* Debug info */}
            <div className="text-xs text-gray-400 mt-1">
              Debug: funcionarioLogado = {JSON.stringify(funcionarioLogado)} | 
              funcionario_id = {formData.funcionario_id}
            </div>
          </div>

          {/* Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_entrada">Tipo de Entrada *</Label>
              <Select
                value={formData.tipo_entrada}
                onValueChange={(value: 'checklist' | 'manutencao' | 'falha') => 
                  setFormData({ ...formData, tipo_entrada: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="falha">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status_entrada">Status da Entrada *</Label>
              <Select
                value={formData.status_entrada}
                onValueChange={(value: 'ok' | 'manutencao' | 'falha') => 
                  setFormData({ ...formData, status_entrada: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="falha">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva os detalhes da entrada..."
              rows={4}
              required
            />
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Resolução (se necessário) */}
          {(formData.status_entrada === 'manutencao' || formData.status_entrada === 'falha') && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm">Dados de Resolução</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsavel_resolucao">Responsável pela Resolução</Label>
                  <Input
                    id="responsavel_resolucao"
                    value={formData.responsavel_resolucao}
                    onChange={(e) => setFormData({ ...formData, responsavel_resolucao: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div>
                  <Label htmlFor="data_resolucao">Data de Resolução</Label>
                  <Input
                    id="data_resolucao"
                    type="date"
                    value={formData.data_resolucao}
                    onChange={(e) => setFormData({ ...formData, data_resolucao: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status_resolucao">Status da Resolução</Label>
                <Select
                  value={formData.status_resolucao}
                  onValueChange={(value: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado') => 
                    setFormData({ ...formData, status_resolucao: value })
                  }
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
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <ButtonLoader text="Salvando..." />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {modoEdicao ? 'Atualizar' : 'Salvar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
