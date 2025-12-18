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
import { useCargos } from "@/hooks/use-cargos"
import { formatarCargo } from "@/lib/utils/cargos-predefinidos"
import { useToast } from "@/hooks/use-toast"

interface CreateFuncionarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FuncionarioCreateData & { criar_usuario: boolean }) => Promise<void>
  submitting: boolean
}

const CreateFuncionarioDialog = memo(function CreateFuncionarioDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: CreateFuncionarioDialogProps) {
  const { toast } = useToast()
  const { cargosAtivos, loading: loadingCargos } = useCargos()
  const [mostrarInputNovoCargo, setMostrarInputNovoCargo] = useState(false)
  const [novoCargo, setNovoCargo] = useState("")
  const [ehSupervisor, setEhSupervisor] = useState(false)
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    role: "",
    status: "Ativo" as const,
    turno: "Diurno" as const,
    salary: "",
    hireDate: "",
    observations: "",
    criar_usuario: true
  })

  const handleChange = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Supervisor não é mais um cargo, é uma atribuição que pode ser dada a qualquer funcionário
  // Portanto, não filtramos mais os cargos baseado nisso
  const cargosFiltrados = cargosAtivos

  // Supervisor é apenas uma atribuição, não afeta a seleção de cargo
  const handleSupervisorChange = useCallback((checked: boolean) => {
    setEhSupervisor(checked)
    // Não altera o cargo, pois supervisor é apenas uma atribuição
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
    
    // Validações no frontend antes de enviar
    if (!form.name || form.name.trim().length < 2) {
      toast({
        title: "Erro de validação",
        description: "O nome é obrigatório e deve ter no mínimo 2 caracteres",
        variant: "destructive"
      })
      return
    }
    
    if (!form.role) {
      toast({
        title: "Erro de validação",
        description: "O cargo é obrigatório",
        variant: "destructive"
      })
      return
    }
    
    if (form.criar_usuario) {
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        toast({
          title: "Erro de validação",
          description: "O email fornecido é inválido",
          variant: "destructive"
        })
        return
      }
    }
    
    // Converte o salário de centavos para reais (API espera em reais)
    const salarioNumerico = form.salary ? parseFloat(form.salary) / 100 : 0
    
    // Formatar cargo com iniciais maiúsculas
    const cargoFormatado = form.role ? formatarCargo(form.role) : ''
    
    await onSubmit({
      nome: form.name,
      cargo: cargoFormatado as 'Operador' | 'Sinaleiro' | 'Técnico Manutenção' | 'Supervisor' | 'Mecânico' | 'Engenheiro' | 'Chefe de Obras',
      telefone: form.phone,
      email: form.email,
      cpf: form.cpf,
      turno: form.turno,
      status: form.status,
      data_admissao: form.hireDate,
      salario: salarioNumerico,
      observacoes: form.observations,
      criar_usuario: form.criar_usuario,
      eh_supervisor: ehSupervisor
    })
  }, [form, onSubmit])

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      role: "",
      status: "Ativo",
      turno: "Diurno",
      salary: "",
      hireDate: "",
      observations: "",
      criar_usuario: true
    })
    setMostrarInputNovoCargo(false)
    setNovoCargo("")
    setEhSupervisor(false)
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
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="eh_supervisor"
                  checked={ehSupervisor}
                  onChange={(e) => handleSupervisorChange(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="eh_supervisor" className="cursor-pointer text-sm font-medium">
                  Este funcionário pode ser designado como supervisor? (atribuição, não cargo)
                </Label>
              </div>
              <Label htmlFor="role">Cargo *</Label>
              {!mostrarInputNovoCargo ? (
                <>
                  <Select
                    value={form.role}
                    onValueChange={(value) => {
                      if (value === "__novo_cargo__") {
                        setMostrarInputNovoCargo(true)
                        setNovoCargo("")
                      } else {
                        handleChange('role', value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCargos ? (
                        <SelectItem value="" disabled>
                          Carregando cargos...
                        </SelectItem>
                      ) : cargosFiltrados.length > 0 ? (
                        <>
                          {cargosFiltrados.map((cargo) => (
                            <SelectItem key={cargo.id} value={cargo.nome}>
                              {cargo.nome}
                            </SelectItem>
                          ))}
                          <SelectItem value="__novo_cargo__" className="text-blue-600 font-medium">
                            <Plus className="w-4 h-4 inline mr-2" />
                            Adicionar novo cargo
                          </SelectItem>
                        </>
                      ) : (
                        <SelectItem value="__novo_cargo__" className="text-blue-600 font-medium">
                          <Plus className="w-4 h-4 inline mr-2" />
                          Adicionar novo cargo
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={novoCargo}
                    onChange={(e) => setNovoCargo(e.target.value)}
                    placeholder="Digite o nome do novo cargo"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (novoCargo.trim()) {
                          handleChange('role', formatarCargo(novoCargo.trim()))
                          setMostrarInputNovoCargo(false)
                        }
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (novoCargo.trim()) {
                          handleChange('role', formatarCargo(novoCargo.trim()))
                        }
                        setMostrarInputNovoCargo(false)
                      }}
                    >
                      Confirmar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMostrarInputNovoCargo(false)
                        setNovoCargo("")
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
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
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <User className="w-5 h-5 mt-0.5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1 text-blue-900">
                    Criação de Usuário
                  </h4>
                  <p className="text-sm text-blue-700">
                    Será criado um usuário para o funcionário com acesso ao sistema. Uma senha temporária será gerada automaticamente e enviada por email e WhatsApp.
                  </p>
                </div>
              </div>
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
