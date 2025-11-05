"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, UserPlus, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { responsavelTecnicoApi, type ResponsavelTecnicoBackend } from "@/lib/api-responsavel-tecnico"

export interface ResponsavelTecnicoData {
  id?: string | number
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
  readOnly?: boolean
}

export function ResponsavelTecnicoForm({
  obraId,
  responsavel,
  onSave,
  onCancel,
  readOnly = false
}: ResponsavelTecnicoFormProps) {
  const { toast } = useToast()
  const [isSearching, setIsSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<ResponsavelTecnicoData[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ResponsavelTecnicoData>({
    nome: responsavel?.nome || "",
    cpf_cnpj: responsavel?.cpf_cnpj || "",
    crea: responsavel?.crea || "",
    email: responsavel?.email || "",
    telefone: responsavel?.telefone || ""
  })

  useEffect(() => {
    if (responsavel) {
      setFormData({
        nome: responsavel.nome,
        cpf_cnpj: responsavel.cpf_cnpj,
        crea: responsavel.crea || "",
        email: responsavel.email,
        telefone: responsavel.telefone
      })
    }
  }, [responsavel])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um CPF/CNPJ para buscar",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    setLoading(true)
    try {
      const found = await responsavelTecnicoApi.buscarPorCpf(searchTerm)
      
      if (found) {
        const responsavelData: ResponsavelTecnicoData = {
          id: found.id,
          nome: found.nome,
          cpf_cnpj: found.cpf_cnpj,
          crea: found.crea,
          email: found.email || "",
          telefone: found.telefone || ""
        }
        setFormData(responsavelData)
        setSearchResults([responsavelData])
        toast({
          title: "Responsável encontrado",
          description: "Dados preenchidos automaticamente"
        })
      } else {
        setSearchResults([])
        toast({
          title: "Não encontrado",
          description: "Nenhum responsável encontrado com este CPF/CNPJ. Você pode cadastrar um novo.",
          variant: "default"
        })
      }
    } catch (error: any) {
      // Se o endpoint não existir, apenas mostrar que não foi encontrado
      if (error.message?.includes('404') || error.message?.includes('não encontrado')) {
        setSearchResults([])
        toast({
          title: "Não encontrado",
          description: "Nenhum responsável encontrado com este CPF/CNPJ. Você pode cadastrar um novo.",
          variant: "default"
        })
      } else {
        toast({
          title: "Erro",
          description: "Erro ao buscar responsável técnico",
          variant: "destructive"
        })
      }
    } finally {
      setIsSearching(false)
      setLoading(false)
    }
  }

  const handleSelectExisting = (responsavel: ResponsavelTecnicoData) => {
    setFormData(responsavel)
    setIsSearching(false)
    setSearchResults([])
  }

  const handleSave = async () => {
    if (!formData.nome || !formData.cpf_cnpj || !formData.email) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (Nome, CPF/CNPJ, Email)",
        variant: "destructive"
      })
      return
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive"
      })
      return
    }

    // Se não tiver obraId, apenas chamar onSave (para formulários inline)
    if (!obraId) {
      onSave(formData)
      return
    }

    // Salvar via API
    setSaving(true)
    try {
      const response = await responsavelTecnicoApi.criarOuAtualizar(obraId, {
        nome: formData.nome,
        cpf_cnpj: formData.cpf_cnpj,
        crea: formData.crea,
        email: formData.email,
        telefone: formData.telefone
      })

      if (response.success && response.data) {
        const savedData: ResponsavelTecnicoData = {
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Responsável Técnico da Obra</span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca de responsável existente */}
        {!responsavel && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <Label>Buscar Responsável Existente</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite CPF/CNPJ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline" disabled={loading || isSearching}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Buscar
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {searchResults.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelectExisting(r)}
                  >
                    <p className="font-medium">{r.nome}</p>
                    <p className="text-sm text-gray-600">{r.cpf_cnpj} • {r.crea}</p>
                  </div>
                ))}
              </div>
            )}
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

        {!readOnly && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Responsável
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

