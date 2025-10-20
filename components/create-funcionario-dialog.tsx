"use client"

import { useState, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, User } from "lucide-react"
import { ButtonLoader } from "@/components/ui/loader"
import { FuncionarioCreateData } from "@/lib/api-funcionarios"

interface CreateFuncionarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FuncionarioCreateData & { usuario_senha?: string, criar_usuario: boolean }) => Promise<void>
  submitting: boolean
}

const CreateFuncionarioDialog = memo(function CreateFuncionarioDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: CreateFuncionarioDialogProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    role: "Operador" as const,
    status: "Ativo" as const,
    turno: "Diurno" as const,
    salary: "",
    hireDate: "",
    observations: "",
    criar_usuario: true,
    usuario_senha: ""
  })

  const handleChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Função para formatar valor monetário
  const formatCurrency = useCallback((value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '')
    
    if (!numericValue) return ''
    
    // Converte para centavos (o valor vem como centavos do input)
    const cents = parseInt(numericValue, 10)
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }, [])

  // Função para extrair valor numérico da string formatada
  const parseCurrency = useCallback((formattedValue: string) => {
    // Remove símbolos e espaços, mantém apenas números e vírgula/ponto
    const cleanValue = formattedValue.replace(/[^\d,.-]/g, '')
    
    if (!cleanValue) return ''
    
    // Substitui vírgula por ponto para parseFloat
    const numericValue = cleanValue.replace(',', '.')
    
    return parseFloat(numericValue).toString()
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Converte o salário de centavos para reais (API espera em reais)
    const salarioNumerico = form.salary ? parseFloat(form.salary) / 100 : 0
    
    await onSubmit({
      nome: form.name,
      cargo: form.role,
      telefone: form.phone,
      email: form.email,
      cpf: form.cpf,
      turno: form.turno,
      status: form.status,
      data_admissao: form.hireDate,
      salario: salarioNumerico,
      observacoes: form.observations,
      criar_usuario: form.criar_usuario,
      usuario_senha: form.criar_usuario ? form.usuario_senha : undefined
    })
  }, [form, onSubmit])

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      role: "Operador",
      status: "Ativo",
      turno: "Diurno",
      salary: "",
      hireDate: "",
      observations: "",
      criar_usuario: true,
      usuario_senha: ""
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Funcionário
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={form.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Cargo *</Label>
              <Select
                value={form.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operador">Operador</SelectItem>
                  <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                  <SelectItem value="Técnico Manutenção">Técnico Manutenção</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
                  <SelectItem value="Engenheiro">Engenheiro</SelectItem>
                  <SelectItem value="Chefe de Obras">Chefe de Obras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="turno">Turno *</Label>
              <Select
                value={form.turno}
                onValueChange={(value) => handleChange('turno', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diurno">Diurno</SelectItem>
                  <SelectItem value="Noturno">Noturno</SelectItem>
                  <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salário</Label>
              <Input
                id="salary"
                type="text"
                value={form.salary ? formatCurrency(form.salary) : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '')
                  handleChange('salary', rawValue)
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hireDate">Data de Admissão *</Label>
              <Input
                id="hireDate"
                type="date"
                value={form.hireDate}
                onChange={(e) => handleChange('hireDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={form.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Férias">Férias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={form.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="criar_usuario"
                checked={form.criar_usuario}
                onChange={(e) => handleChange('criar_usuario', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="criar_usuario" className="cursor-pointer">
                Criar usuário de acesso ao sistema
              </Label>
            </div>
          </div>

          {form.criar_usuario && (
            <div className="space-y-2">
              <Label htmlFor="usuario_senha">Senha do Usuário *</Label>
              <Input
                id="usuario_senha"
                type="password"
                value={form.usuario_senha}
                onChange={(e) => handleChange('usuario_senha', e.target.value)}
                required={form.criar_usuario}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
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
                  Criar Funcionário
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})

export { CreateFuncionarioDialog }
