"use client"

import { useState, useCallback, memo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Perfil {
  id: number
  nome: string
  descricao?: string
  nivel_acesso: number
  status: string
}

interface CargoCreateData {
  nome: string
  descricao?: string
  nivel: 'Operacional' | 'Técnico' | 'Supervisor' | 'Gerencial' | 'Diretoria'
  salario_minimo?: number
  salario_maximo?: number
  acesso_global_obras?: boolean
  perfil_id?: number
}

interface CreateCargoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CargoCreateData) => Promise<void>
  submitting: boolean
}

const CreateCargoDialog = memo(function CreateCargoDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: CreateCargoDialogProps) {
  const { toast } = useToast()
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [loadingPerfis, setLoadingPerfis] = useState(false)
  
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    nivel: "Operacional" as const,
    salario_minimo: "",
    salario_maximo: "",
    acesso_global_obras: false,
    perfil_id: undefined as number | undefined
  })

  // Carregar perfis quando dialog abrir
  useEffect(() => {
    if (open) {
      loadPerfis()
    }
  }, [open])

  const loadPerfis = async () => {
    try {
      setLoadingPerfis(true)
      const response = await fetch('/api/permissoes/perfis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas perfis ativos
        const perfisAtivos = (data.data || []).filter((p: Perfil) => p.status === 'Ativo')
        setPerfis(perfisAtivos)
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error)
    } finally {
      setLoadingPerfis(false)
    }
  }

  const handleChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!form.nome || !form.nome.trim()) {
      camposFaltando.push('Nome do Cargo')
    }

    // Validar faixa salarial
    const salarioMin = form.salario_minimo ? parseFloat(form.salario_minimo) : undefined
    const salarioMax = form.salario_maximo ? parseFloat(form.salario_maximo) : undefined
    
    if (salarioMin && salarioMax && salarioMin > salarioMax) {
      camposFaltando.push('Salário mínimo não pode ser maior que o salário máximo')
    }

    if (camposFaltando.length > 0) {
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000,
      })
      return
    }

    await onSubmit({
      nome: form.nome,
      descricao: form.descricao || undefined,
      nivel: form.nivel,
      salario_minimo: salarioMin,
      salario_maximo: salarioMax,
      acesso_global_obras: form.acesso_global_obras,
      perfil_id: form.perfil_id || undefined
    })
  }, [form, onSubmit, toast])

  const resetForm = useCallback(() => {
    setForm({
      nome: "",
      descricao: "",
      nivel: "Operacional",
      salario_minimo: "",
      salario_maximo: "",
      acesso_global_obras: false,
      perfil_id: undefined
    })
  }, [])

  // Reset form when dialog opens
  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      resetForm()
    }
    onOpenChange(open)
  }, [onOpenChange, resetForm])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Novo Cargo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Cargo *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Ex: Operador de Guindaste"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descreva as responsabilidades do cargo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel">Nível Hierárquico *</Label>
            <Select
              value={form.nivel}
              onValueChange={(value) => handleChange('nivel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Gerencial">Gerencial</SelectItem>
                <SelectItem value="Diretoria">Diretoria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfil">Perfil de Acesso</Label>
            <Select
              value={form.perfil_id ? form.perfil_id.toString() : "none"}
              onValueChange={(value) => {
                if (value === "none" || value === "loading") {
                  handleChange('perfil_id', undefined)
                } else {
                  handleChange('perfil_id', parseInt(value))
                }
              }}
              disabled={loadingPerfis}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingPerfis ? "Carregando perfis..." : "Selecione um perfil (opcional)"} />
              </SelectTrigger>
              <SelectContent>
                {loadingPerfis ? (
                  <SelectItem value="loading" disabled>Carregando perfis...</SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">Nenhum perfil</SelectItem>
                    {perfis.map((perfil) => (
                      <SelectItem key={perfil.id} value={perfil.id.toString()}>
                        {perfil.nome} (Nível {perfil.nivel_acesso})
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              O perfil definido aqui será automaticamente atribuído aos usuários criados para funcionários com este cargo
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salario-minimo">Salário Mínimo</Label>
              <Input
                id="salario-minimo"
                type="number"
                step="0.01"
                value={form.salario_minimo}
                onChange={(e) => handleChange('salario_minimo', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario-maximo">Salário Máximo</Label>
              <Input
                id="salario-maximo"
                type="number"
                step="0.01"
                value={form.salario_maximo}
                onChange={(e) => handleChange('salario_maximo', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acesso-global-obras"
              checked={form.acesso_global_obras}
              onCheckedChange={(checked) => handleChange('acesso_global_obras', checked === true)}
            />
            <Label
              htmlFor="acesso-global-obras"
              className="text-sm font-normal cursor-pointer"
            >
              Acesso global a todas as obras
            </Label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Cargo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})

export { CreateCargoDialog }
export type { CargoCreateData }
