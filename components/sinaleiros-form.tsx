"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, User, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sinaleirosApi, type SinaleiroBackend } from "@/lib/api-sinaleiros"
import { DocumentosSinaleiroList } from "./documentos-sinaleiro-list"

// Interface compatível com o componente
export interface Sinaleiro {
  id: string
  obra_id: number
  nome: string
  rg_cpf: string
  telefone: string
  email?: string
  tipo: 'principal' | 'reserva'
  cliente_informou?: boolean
  documentos?: any[]
}

interface SinaleirosFormProps {
  obraId?: number
  sinaleiros?: Sinaleiro[]
  onSave: (sinaleiros: Sinaleiro[]) => void
  readOnly?: boolean
  clientePodeEditar?: boolean
}

export function SinaleirosForm({
  obraId,
  sinaleiros: initialSinaleiros,
  onSave,
  readOnly = false,
  clientePodeEditar = false
}: SinaleirosFormProps) {
  const { toast } = useToast()
  const [sinaleiros, setSinaleiros] = useState<Sinaleiro[]>(initialSinaleiros || [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (obraId && !initialSinaleiros) {
      loadSinaleiros()
    }
  }, [obraId])

  const loadSinaleiros = async () => {
    if (!obraId) return
    setLoading(true)
    try {
      const response = await sinaleirosApi.listarPorObra(obraId)
      if (response.success && response.data) {
        // Converter SinaleiroBackend para Sinaleiro
        const sinaleirosConvertidos: Sinaleiro[] = response.data.map((s: SinaleiroBackend) => ({
          id: s.id,
          obra_id: s.obra_id,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
          telefone: s.telefone || '',
          email: s.email,
          tipo: s.tipo,
          cliente_informou: false, // Campo não existe no backend, manter compatibilidade
          documentos: []
        }))
        setSinaleiros(sinaleirosConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar sinaleiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSinaleiro = () => {
    if (sinaleiros.length >= 2) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 2 sinaleiros permitidos (Principal + Reserva)",
        variant: "destructive"
      })
      return
    }

    const tipo = sinaleiros.length === 0 ? 'principal' : 'reserva'
    const novo: Sinaleiro = {
      id: `new_${Date.now()}`,
      obra_id: obraId || 0,
      nome: '',
      rg_cpf: '',
      telefone: '',
      email: '',
      tipo,
      cliente_informou: false,
      documentos: []
    }
    setSinaleiros([...sinaleiros, novo])
  }

  const handleRemoveSinaleiro = (id: string) => {
    const sinaleiro = sinaleiros.find(s => s.id === id)
    if (sinaleiro?.tipo === 'principal') {
      toast({
        title: "Atenção",
        description: "Não é possível remover o sinaleiro principal",
        variant: "destructive"
      })
      return
    }
    setSinaleiros(sinaleiros.filter(s => s.id !== id))
  }

  const handleUpdateSinaleiro = (id: string, field: keyof Sinaleiro, value: any) => {
    setSinaleiros(sinaleiros.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const handleSave = async () => {
    if (!obraId) {
      // Se não tiver obraId, apenas chamar onSave (para formulários inline)
      onSave(sinaleiros)
      return
    }

    // Validar sinaleiro principal obrigatório
    const principal = sinaleiros.find(s => s.tipo === 'principal')
    if (!principal || !principal.nome || !principal.rg_cpf) {
      toast({
        title: "Erro",
        description: "Sinaleiro principal é obrigatório. Preencha nome e RG/CPF.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Converter Sinaleiro para formato do backend
      const sinaleirosParaEnviar = sinaleiros.map(s => ({
        id: s.id.startsWith('new_') ? undefined : s.id,
        nome: s.nome,
        rg_cpf: s.rg_cpf,
        telefone: s.telefone,
        email: s.email,
        tipo: s.tipo
      }))

      const response = await sinaleirosApi.criarOuAtualizar(obraId, sinaleirosParaEnviar)
      
      if (response.success && response.data) {
        // Converter resposta para formato do componente
        const sinaleirosSalvos: Sinaleiro[] = response.data.map((s: SinaleiroBackend) => ({
          id: s.id,
          obra_id: s.obra_id,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
          telefone: s.telefone || '',
          email: s.email,
          tipo: s.tipo,
          cliente_informou: false,
          documentos: []
        }))

        toast({
          title: "Sucesso",
          description: "Sinaleiros salvos com sucesso"
        })

        setSinaleiros(sinaleirosSalvos)
        onSave(sinaleirosSalvos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar sinaleiros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const canEdit = !readOnly && (clientePodeEditar || true) // Admin sempre pode editar

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sinaleiros da Obra</CardTitle>
        <CardDescription>
          Cadastre até 2 sinaleiros (Principal + Reserva). 
          {clientePodeEditar && " Você pode criar um sinaleiro caso não informe o campo sinaleiro cliente."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sinaleiros.map((sinaleiro, index) => (
          <Card key={sinaleiro.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <CardTitle className="text-base">
                    {sinaleiro.tipo === 'principal' ? 'Sinaleiro Principal' : 'Sinaleiro Reserva'}
                  </CardTitle>
                  <Badge variant={sinaleiro.tipo === 'principal' ? 'default' : 'secondary'}>
                    {sinaleiro.tipo === 'principal' ? 'Obrigatório' : 'Opcional'}
                  </Badge>
                </div>
                {canEdit && sinaleiro.tipo !== 'principal' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSinaleiro(sinaleiro.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={sinaleiro.nome}
                    onChange={(e) => handleUpdateSinaleiro(sinaleiro.id, 'nome', e.target.value)}
                    placeholder="Nome completo"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>
                    RG ou CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={sinaleiro.rg_cpf}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', value)
                    }}
                    placeholder="000.000.000-00"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={sinaleiro.telefone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      let formatted = value
                      if (value.length <= 10) {
                        formatted = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
                      } else {
                        formatted = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'telefone', formatted)
                    }}
                    placeholder="(11) 98765-4321"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={sinaleiro.email || ''}
                    onChange={(e) => handleUpdateSinaleiro(sinaleiro.id, 'email', e.target.value)}
                    placeholder="email@example.com"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              {/* Documentos do Sinaleiro */}
              {sinaleiro.id && !sinaleiro.id.startsWith('new_') && (
                <DocumentosSinaleiroList
                  sinaleiroId={sinaleiro.id}
                  readOnly={!canEdit}
                />
              )}
            </CardContent>
          </Card>
        ))}

        {canEdit && sinaleiros.length < 2 && (
          <Button
            variant="outline"
            onClick={handleAddSinaleiro}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Sinaleiro {sinaleiros.length === 0 ? 'Principal' : 'Reserva'}
          </Button>
        )}

        {canEdit && sinaleiros.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Sinaleiros
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

