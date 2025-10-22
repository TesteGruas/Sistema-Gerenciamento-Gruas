"use client"

import { useState, useCallback, memo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Loader2, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Cargo, CargoUpdateData } from "@/lib/api/cargos-api"

interface EditCargoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CargoUpdateData) => Promise<void>
  submitting: boolean
  cargo: Cargo
}

const EditCargoDialog = memo(function EditCargoDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  cargo,
}: EditCargoDialogProps) {
  const { toast } = useToast()
  
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    nivel: "Operacional" as const,
    salario_minimo: "",
    salario_maximo: ""
  })

  // Atualizar form quando cargo mudar
  useEffect(() => {
    if (cargo) {
      setForm({
        nome: cargo.nome,
        descricao: cargo.descricao || "",
        nivel: cargo.nivel as any,
        salario_minimo: cargo.salario_minimo?.toString() || "",
        salario_maximo: cargo.salario_maximo?.toString() || ""
      })
    }
  }, [cargo])

  const handleChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cargo é obrigatório",
        variant: "destructive"
      })
      return
    }

    // Validar faixa salarial
    const salarioMin = form.salario_minimo ? parseFloat(form.salario_minimo) : undefined
    const salarioMax = form.salario_maximo ? parseFloat(form.salario_maximo) : undefined
    
    if (salarioMin && salarioMax && salarioMin > salarioMax) {
      toast({
        title: "Erro",
        description: "Salário mínimo não pode ser maior que o salário máximo",
        variant: "destructive"
      })
      return
    }

    await onSubmit({
      nome: form.nome,
      descricao: form.descricao || undefined,
      nivel: form.nivel,
      salario_minimo: salarioMin,
      salario_maximo: salarioMax
    })
  }, [form, onSubmit, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Editar Cargo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome do Cargo *</Label>
            <Input
              id="edit-nome"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Ex: Operador de Guindaste"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Textarea
              id="edit-descricao"
              value={form.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descreva as responsabilidades do cargo..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-nivel">Nível Hierárquico *</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-salario-minimo">Salário Mínimo</Label>
              <Input
                id="edit-salario-minimo"
                type="number"
                step="0.01"
                value={form.salario_minimo}
                onChange={(e) => handleChange('salario_minimo', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-salario-maximo">Salário Máximo</Label>
              <Input
                id="edit-salario-maximo"
                type="number"
                step="0.01"
                value={form.salario_maximo}
                onChange={(e) => handleChange('salario_maximo', e.target.value)}
                placeholder="0.00"
              />
            </div>
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
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})

export { EditCargoDialog }

