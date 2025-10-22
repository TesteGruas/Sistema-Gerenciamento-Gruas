"use client"

import { useState, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CargoCreateData {
  nome: string
  descricao?: string
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
  
  const [form, setForm] = useState({
    nome: "",
    descricao: ""
  })

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

    await onSubmit({
      nome: form.nome,
      descricao: form.descricao || undefined
    })
  }, [form, onSubmit, toast])

  const resetForm = useCallback(() => {
    setForm({
      nome: "",
      descricao: ""
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
