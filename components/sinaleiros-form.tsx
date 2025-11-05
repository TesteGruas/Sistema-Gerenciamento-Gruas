"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, User, FileText, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sinaleirosApi, type SinaleiroBackend } from "@/lib/api-sinaleiros"
import { DocumentosSinaleiroList } from "./documentos-sinaleiro-list"
import { FuncionarioSearch } from "./funcionario-search"
import { funcionariosApi } from "@/lib/api-funcionarios"

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

  // Garantir que sempre existam 2 sinaleiros: interno e cliente
  useEffect(() => {
    const temInterno = sinaleiros.some(s => s.tipo_vinculo === 'interno')
    const temCliente = sinaleiros.some(s => s.tipo_vinculo === 'cliente')
    
    if (temInterno && temCliente) {
      return // Já tem ambos, não precisa fazer nada
    }
    
    const novos: Sinaleiro[] = [...sinaleiros]
    
    if (!temInterno) {
      novos.push({
        id: `interno_${Date.now()}`,
        obra_id: obraId || 0,
        nome: '',
        rg_cpf: '',
        cpf: '',
        rg: '',
        telefone: '',
        email: '',
        tipo: 'principal',
        tipo_vinculo: 'interno',
        cliente_informou: false,
        documentos: [],
        certificados: []
      })
    }
    
    if (!temCliente) {
      novos.push({
        id: `cliente_${Date.now()}`,
        obra_id: obraId || 0,
        nome: '',
        rg_cpf: '',
        cpf: '',
        rg: '',
        telefone: '',
        email: '',
        tipo: 'reserva',
        tipo_vinculo: 'cliente',
        cliente_informou: true,
        documentos: [],
        certificados: []
      })
    }
    
    setSinaleiros(novos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId])

  const handleAddSinaleiro = () => {
    if (sinaleiros.length >= 2) {
      toast({
        title: "Limite atingido",
        description: "Apenas 2 sinaleiros permitidos (Interno + Indicado pelo Cliente)",
        variant: "destructive"
      })
      return
    }
  }

  const handleRemoveSinaleiro = (id: string) => {
    const sinaleiro = sinaleiros.find(s => s.id === id)
    // Não permitir remover nenhum sinaleiro (sempre deve ter 2)
    toast({
      title: "Atenção",
      description: "Não é possível remover sinaleiros. São obrigatórios 2 sinaleiros (Interno + Cliente).",
      variant: "destructive"
    })
  }

  const handleUpdateSinaleiro = (id: string, field: keyof Sinaleiro, value: any) => {
    setSinaleiros(sinaleiros.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const handleSave = async () => {
    // Validar sinaleiro principal obrigatório
    const principal = sinaleiros.find(s => s.tipo === 'principal')
    if (!principal || !principal.nome || !principal.rg_cpf) {
      toast({
        title: "Erro",
        description: "Sinaleiro interno é obrigatório. Preencha nome e CPF.",
        variant: "destructive"
      })
      return
    }
    
    if (!cliente || !cliente.nome || (!cliente.cpf && !cliente.rg && !cliente.rg_cpf)) {
      toast({
        title: "Erro",
        description: "Sinaleiro indicado pelo cliente é obrigatório. Preencha nome e pelo menos CPF ou RG.",
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
          Dois sinaleiros obrigatórios: Interno (empresa) e Indicado pelo Cliente (editável pelo cliente).
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
                    {sinaleiro.tipo_vinculo === 'interno' ? 'Sinaleiro Interno' : 'Sinaleiro Indicado pelo Cliente'}
                  </CardTitle>
                  <Badge variant={sinaleiro.tipo_vinculo === 'interno' ? 'default' : 'outline'}>
                    {sinaleiro.tipo_vinculo === 'interno' ? 'Interno' : 'Cliente'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sinaleiro.tipo_vinculo === 'cliente' && (
                <div className="mb-3 p-2 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700">Este sinaleiro pode ser editado pelo cliente</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={sinaleiro.nome}
                    onChange={(e) => handleUpdateSinaleiro(sinaleiro.id, 'nome', e.target.value)}
                    placeholder="Nome completo"
                    disabled={!canEdit || (sinaleiro.tipo_vinculo === 'interno' && clientePodeEditar)}
                  />
                </div>

                <div>
                  <Label>
                    CPF {sinaleiro.tipo_vinculo === 'interno' ? <span className="text-red-500">*</span> : sinaleiro.tipo_vinculo === 'cliente' ? <span className="text-xs text-gray-500">(ou RG)</span> : null}
                  </Label>
                  <Input
                    value={sinaleiro.cpf || sinaleiro.rg_cpf || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      let formatted = value
                      if (value.length <= 11) {
                        formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'cpf', formatted)
                      if (!sinaleiro.cpf) {
                        handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', formatted)
                      }
                    }}
                    placeholder="000.000.000-00"
                    disabled={!canEdit || (sinaleiro.tipo_vinculo === 'interno' && clientePodeEditar)}
                  />
                </div>

                <div>
                  <Label>
                    RG {sinaleiro.tipo_vinculo === 'interno' ? <span className="text-red-500">*</span> : sinaleiro.tipo_vinculo === 'cliente' ? <span className="text-xs text-gray-500">(ou CPF)</span> : null}
                  </Label>
                  <Input
                    value={sinaleiro.rg || sinaleiro.rg_cpf || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      let formatted = value
                      if (value.length <= 9) {
                        formatted = value.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
                      }
                      handleUpdateSinaleiro(sinaleiro.id, 'rg', formatted)
                      if (!sinaleiro.rg) {
                        handleUpdateSinaleiro(sinaleiro.id, 'rg_cpf', formatted)
                      }
                    }}
                    placeholder="00.000.000-0"
                    disabled={!canEdit || (sinaleiro.tipo_vinculo === 'interno' && clientePodeEditar)}
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
                    disabled={!canEdit || (sinaleiro.tipo_vinculo === 'interno' && clientePodeEditar)}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={sinaleiro.email || ''}
                    onChange={(e) => handleUpdateSinaleiro(sinaleiro.id, 'email', e.target.value)}
                    placeholder="email@example.com"
                    disabled={!canEdit || (sinaleiro.tipo_vinculo === 'interno' && clientePodeEditar)}
                  />
                </div>
              </div>

              {/* Documentos e Certificados */}
              <div className="space-y-3 pt-3 border-t">
                <div>
                  <Label className="text-sm font-medium mb-2">Documentos</Label>
                  <div className="space-y-2">
                    {sinaleiro.documentos && sinaleiro.documentos.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sinaleiro.documentos.map((doc: any, docIdx: number) => (
                          <Badge key={docIdx} variant="outline" className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {doc.nome || doc.tipo || 'Documento'}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Nenhum documento cadastrado</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2">Certificados</Label>
                  <div className="space-y-2">
                    {sinaleiro.certificados && sinaleiro.certificados.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sinaleiro.certificados.map((cert: any, certIdx: number) => (
                          <Badge key={certIdx} variant="outline" className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {cert.nome || cert.tipo || 'Certificado'}
                            {cert.numero && ` - ${cert.numero}`}
                            {cert.validade && ` (${new Date(cert.validade).toLocaleDateString('pt-BR')})`}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Nenhum certificado cadastrado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documentos do Sinaleiro - Componente existente */}
              {sinaleiro.id && !sinaleiro.id.startsWith('new_') && (
                <DocumentosSinaleiroList
                  sinaleiroId={sinaleiro.id}
                  readOnly={!canEdit || (sinaleiro.tipo_vinculo === 'interno' && clientePodeEditar)}
                />
              )}
            </CardContent>
          </Card>
        ))}

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

