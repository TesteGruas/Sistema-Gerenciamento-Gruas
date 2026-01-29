"use client"

import { useState, useCallback, memo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Loader2, User } from "lucide-react"
import { FuncionarioCreateData } from "@/lib/api-funcionarios"
import { useCargos } from "@/hooks/use-cargos"
import { formatarCargo } from "@/lib/utils/cargos-predefinidos"
import { useToast } from "@/hooks/use-toast"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido' | 'Férias'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | 'Diurno' | 'Noturno' | 'Sob Demanda'
  observacoes?: string
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

interface EditFuncionarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FuncionarioCreateData) => Promise<void>
  submitting: boolean
  funcionario: FuncionarioRH | null
}

const EditFuncionarioDialog = memo(function EditFuncionarioDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  funcionario,
}: EditFuncionarioDialogProps) {
  const { toast } = useToast()
  const { cargosAtivos, loading: loadingCargos } = useCargos()
  
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
    criar_usuario: false,
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
    e.stopPropagation()
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!form.name || form.name.trim().length < 2) {
      camposFaltando.push('Nome (mínimo 2 caracteres)')
    }

    if (!form.role || !form.role.trim()) {
      camposFaltando.push('Cargo')
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
    
    // Converte o salário de centavos para reais (API espera em reais)
    const salarioNumerico = form.salary ? parseFloat(form.salary) / 100 : 0
    
    // O cargo já está no formato correto:
    // - Se veio do backend, já está formatado como está no banco
    // - Se foi selecionado da lista, já está formatado como está no banco
    await onSubmit({
      nome: form.name,
      cargo: form.role, // Enviar cargo exatamente como está (já formatado corretamente)
      telefone: form.phone,
      email: form.email,
      cpf: form.cpf,
      turno: form.turno,
      status: form.status,
      data_admissao: form.hireDate,
      salario: salarioNumerico,
      observacoes: form.observations
    })
  }, [form, onSubmit, toast])

  // Initialize form when funcionario changes
  useEffect(() => {
    if (funcionario && open) {
      // A API retorna o salário em reais, então convertemos para centavos para formatação
      const salarioEmCentavos = funcionario.salario ? Math.round(funcionario.salario * 100).toString() : ''
      
      setForm({
        name: funcionario.nome,
        email: funcionario.email || '',
        phone: funcionario.telefone || '',
        cpf: funcionario.cpf,
        role: funcionario.cargo as any,
        status: funcionario.status as any,
        turno: (funcionario.turno || 'Diurno') as any,
        salary: salarioEmCentavos,
        hireDate: funcionario.data_admissao,
        observations: funcionario.observacoes || '',
        criar_usuario: false,
        usuario_senha: ''
      })
    }
  }, [funcionario, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Funcionário
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                value={form.name}
                disabled
                className="bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">Nome não pode ser alterado após criação</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cpf">CPF *</Label>
              <Input
                id="edit-cpf"
                value={form.cpf}
                disabled
                className="bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">CPF não pode ser alterado após criação</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Cargo *</Label>
              <Select
                value={form.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCargos ? (
                    <SelectItem value="" disabled>
                      Carregando cargos...
                    </SelectItem>
                  ) : (
                    <>
                      {cargosAtivos.map((cargo) => (
                        <SelectItem key={cargo.id} value={cargo.nome}>
                          {cargo.nome}
                        </SelectItem>
                      ))}
                      {/* Se o cargo atual não estiver na lista, mostrar também */}
                      {form.role && !cargosAtivos.some(c => c.nome.toLowerCase() === form.role.toLowerCase()) && (
                        <SelectItem value={form.role}>
                          {form.role}
                        </SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Selecione um cargo do sistema</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-turno">Turno *</Label>
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
              <Label htmlFor="edit-salary">Salário</Label>
              <Input
                id="edit-salary"
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
              <Label htmlFor="edit-hireDate">Data de Admissão *</Label>
              <Input
                id="edit-hireDate"
                type="date"
                value={form.hireDate}
                disabled
                className="bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">Data de admissão não pode ser alterada após criação</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
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
            <Label htmlFor="edit-observations">Observações</Label>
            <Textarea
              id="edit-observations"
              value={form.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
              rows={3}
            />
          </div>

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
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})

export { EditFuncionarioDialog }
