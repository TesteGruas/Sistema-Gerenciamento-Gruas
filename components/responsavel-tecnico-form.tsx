"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { responsavelTecnicoApi, type ResponsavelTecnicoBackend } from "@/lib/api-responsavel-tecnico"

export interface ResponsavelTecnicoData {
  id?: string | number
  funcionario_id?: number
  nome: string
  cpf_cnpj: string
  crea?: string
  email: string
  telefone: string
}

interface ResponsavelTecnicoFormProps {
  obraId?: number
  responsavel?: ResponsavelTecnicoData | null
  onSave: (data: ResponsavelTecnicoData) => void
  onCancel?: () => void
  onRemove?: () => void
  readOnly?: boolean
}

export function ResponsavelTecnicoForm({
  obraId,
  responsavel,
  onSave,
  onCancel,
  onRemove,
  readOnly = false
}: ResponsavelTecnicoFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ResponsavelTecnicoData>({
    funcionario_id: responsavel?.funcionario_id,
    nome: responsavel?.nome || "",
    cpf_cnpj: responsavel?.cpf_cnpj || "",
    crea: responsavel?.crea || "",
    email: responsavel?.email || "",
    telefone: responsavel?.telefone || ""
  })

  useEffect(() => {
    if (responsavel) {
      setFormData({
        funcionario_id: responsavel.funcionario_id,
        nome: responsavel.nome || "",
        cpf_cnpj: responsavel.cpf_cnpj || "",
        crea: responsavel.crea || "",
        email: responsavel.email || "",
        telefone: responsavel.telefone || ""
      })
    } else {
      // Se responsavel for null/undefined, limpar apenas se não houver dados no formData
      // Isso evita limpar quando o componente é montado pela primeira vez
      if (formData.nome || formData.cpf_cnpj) {
        // Manter os dados se já houver algo preenchido
        return
      }
    }
  }, [responsavel])

  const handleSave = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevenir submit do formulário pai
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Se veio de funcionarios, apenas envia funcionario_id
    const isFuncionarioVinculo = !!formData.funcionario_id

    if (!isFuncionarioVinculo && (!formData.nome || !formData.cpf_cnpj || !formData.email)) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (Nome, CPF/CNPJ, Email)",
        variant: "destructive"
      })
      return
    }

    // Validação básica de email (apenas se não estiver vinculando funcionário)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!isFuncionarioVinculo && !emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive"
      })
      return
    }

    // Se não tiver obraId, apenas chamar onSave (para formulários inline - página de nova obra)
    if (!obraId) {
      toast({
        title: "Sucesso",
        description: "Responsável técnico salvo localmente. Será enviado ao criar a obra."
      })
      onSave(formData)
      return
    }

    // Salvar via API (apenas quando já existe obraId - edição de obra existente)
    try {
      const payload = isFuncionarioVinculo
        ? { funcionario_id: formData.funcionario_id }
        : {
            nome: formData.nome,
            cpf_cnpj: formData.cpf_cnpj,
            crea: formData.crea,
            email: formData.email,
            telefone: formData.telefone
          }
      const response = await responsavelTecnicoApi.criarOuAtualizar(obraId, payload)

      if (response.success && response.data) {
        const savedData: ResponsavelTecnicoData = isFuncionarioVinculo
          ? {
              funcionario_id: formData.funcionario_id,
              nome: formData.nome,
              cpf_cnpj: formData.cpf_cnpj,
              email: formData.email || "",
              telefone: formData.telefone || "",
            }
          : {
              id: response.data.id,
              nome: response.data.nome,
              cpf_cnpj: response.data.cpf_cnpj,
              crea: response.data.crea,
              email: response.data.email || "",
              telefone: response.data.telefone || ""
            }

        toast({
          title: "Sucesso",
          description: "Responsável técnico salvo com sucesso"
        })

        onSave(savedData)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar responsável técnico",
        variant: "destructive"
      })
    }
  }

  // Verificar se há um responsável selecionado
  const hasResponsavel = responsavel && (responsavel.funcionario_id || (responsavel.nome && responsavel.cpf_cnpj))

  return (
    <div className="space-y-4">
        {/* Mostrar responsável selecionado se houver */}
        {hasResponsavel && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{responsavel.nome}</p>
                  {responsavel.funcionario_id && (
                    <p className="text-sm text-green-700">Funcionário vinculado</p>
                  )}
                  {responsavel.cpf_cnpj && (
                    <p className="text-sm text-green-700">CPF/CNPJ: {responsavel.cpf_cnpj}</p>
                  )}
                </div>
              </div>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Remover responsável técnico"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Formulário */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              disabled={readOnly}
            />
          </div>

          <div>
            <Label>
              CPF/CNPJ <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.cpf_cnpj}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, cpf_cnpj: value })
              }}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              disabled={readOnly}
            />
          </div>

          <div>
            <Label>CREA</Label>
            <Input
              value={formData.crea}
              onChange={(e) => setFormData({ ...formData, crea: e.target.value })}
              placeholder="Ex: SP-123456"
              disabled={readOnly}
            />
          </div>

          <div>
            <Label>
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              disabled={readOnly}
            />
          </div>

          <div>
            <Label>
              Telefone <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.telefone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                let formatted = value
                if (value.length <= 10) {
                  formatted = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                } else {
                  formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                }
                setFormData({ ...formData, telefone: formatted })
              }}
              placeholder="(11) 98765-4321"
              disabled={readOnly}
            />
          </div>
        </div>

    </div>
  )
}

