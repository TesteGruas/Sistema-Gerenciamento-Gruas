"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  X,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle
} from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { checklistDiarioApi, type ChecklistModeloBackend, type ChecklistItemBackend } from "@/lib/api-checklist-diario"

interface ChecklistModeloFormProps {
  obraId: number
  modelo?: ChecklistModeloBackend
  onSave: () => void
  onCancel: () => void
}

interface ChecklistItem {
  ordem: number
  categoria: string
  descricao: string
  obrigatorio: boolean
  permite_anexo: boolean
}

export function ChecklistModeloForm({
  obraId,
  modelo,
  onSave,
  onCancel
}: ChecklistModeloFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [itens, setItens] = useState<ChecklistItem[]>([])

  useEffect(() => {
    if (modelo) {
      setNome(modelo.nome)
      setDescricao(modelo.descricao || "")
      setAtivo(modelo.ativo)
      if (modelo.itens && modelo.itens.length > 0) {
        setItens(modelo.itens.map(item => ({
          ordem: item.ordem,
          categoria: item.categoria,
          descricao: item.descricao,
          obrigatorio: item.obrigatorio,
          permite_anexo: item.permite_anexo
        })))
      }
    }
  }, [modelo])

  const addItem = () => {
    const novaOrdem = itens.length > 0 ? Math.max(...itens.map(i => i.ordem)) + 1 : 1
    setItens([...itens, {
      ordem: novaOrdem,
      categoria: "",
      descricao: "",
      obrigatorio: false,
      permite_anexo: false
    }])
  }

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      ordem: i + 1
    })))
  }

  const updateItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }
    setItens(newItens)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nome.trim()) {
      setError("Nome do modelo é obrigatório")
      return
    }

    if (itens.length === 0) {
      setError("Adicione pelo menos um item ao modelo")
      return
    }

    // Validar itens
    for (const item of itens) {
      if (!item.categoria.trim() || !item.descricao.trim()) {
        setError("Todos os itens devem ter categoria e descrição preenchidos")
        return
      }
    }

    try {
      setLoading(true)

      if (modelo) {
        // Atualizar modelo existente
        await checklistDiarioApi.modelos.atualizar(modelo.id, {
          nome,
          descricao: descricao || undefined,
          ativo,
          itens: itens.map(item => ({
            ordem: item.ordem,
            categoria: item.categoria,
            descricao: item.descricao,
            obrigatorio: item.obrigatorio,
            permite_anexo: item.permite_anexo
          }))
        })
        toast({
          title: "Sucesso",
          description: "Modelo atualizado com sucesso"
        })
      } else {
        // Criar novo modelo
        await checklistDiarioApi.modelos.criar({
          obra_id: obraId,
          nome,
          descricao: descricao || undefined,
          itens: itens.map(item => ({
            ordem: item.ordem,
            categoria: item.categoria,
            descricao: item.descricao,
            obrigatorio: item.obrigatorio,
            permite_anexo: item.permite_anexo
          }))
        })
        toast({
          title: "Sucesso",
          description: "Modelo criado com sucesso"
        })
      }

      onSave()
    } catch (err: any) {
      console.error('Erro ao salvar modelo:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar modelo'
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

  const categorias = ["Segurança", "Operação", "Estrutura", "Equipamentos", "Documentação", "Outros"]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do Modelo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nome">
              Nome do Modelo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Checklist Diário Padrão"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional do modelo"
              rows={3}
            />
          </div>

          {modelo && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ativo"
                checked={ativo}
                onCheckedChange={(checked) => setAtivo(checked === true)}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Modelo ativo
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itens do Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Itens do Checklist</CardTitle>
              <CardDescription>Configure os itens que serão verificados</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {itens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item adicionado. Clique em "Adicionar Item" para começar.
            </div>
          ) : (
            <div className="space-y-4">
              {itens.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2 pt-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="outline">{item.ordem}</Badge>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Categoria</Label>
                            <select
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={item.categoria}
                              onChange={(e) => updateItem(index, 'categoria', e.target.value)}
                              required
                            >
                              <option value="">Selecione...</option>
                              {categorias.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <Input
                              value={item.descricao}
                              onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                              placeholder="Descrição do item"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`obrigatorio-${index}`}
                              checked={item.obrigatorio}
                              onCheckedChange={(checked) => updateItem(index, 'obrigatorio', checked === true)}
                            />
                            <Label htmlFor={`obrigatorio-${index}`} className="cursor-pointer text-sm">
                              Obrigatório
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`anexo-${index}`}
                              checked={item.permite_anexo}
                              onCheckedChange={(checked) => updateItem(index, 'permite_anexo', checked === true)}
                            />
                            <Label htmlFor={`anexo-${index}`} className="cursor-pointer text-sm">
                              Permite anexo
                            </Label>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              {modelo ? 'Atualizar' : 'Criar'} Modelo
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

