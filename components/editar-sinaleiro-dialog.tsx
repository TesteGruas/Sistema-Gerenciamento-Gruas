"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentoUpload } from "./documento-upload"
import { Plus, Trash2, Save, Shield, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockSinaleirosAPI, type Sinaleiro } from "@/lib/mocks/sinaleiros-mocks"
import { DocumentosSinaleiroList } from "./documentos-sinaleiro-list"
import { sinaleirosApi } from "@/lib/api-sinaleiros"

interface Certificado {
  nome: string
  tipo: string
  numero?: string
  validade?: string
  arquivo?: File | null
  arquivoUrl?: string
}

interface EditarSinaleiroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sinaleiro: Sinaleiro | null
  obraId?: number
  onSave: (sinaleiro: Sinaleiro) => void
  readOnly?: boolean
}

export function EditarSinaleiroDialog({
  open,
  onOpenChange,
  sinaleiro,
  obraId,
  onSave,
  readOnly = false
}: EditarSinaleiroDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    telefone: '',
    email: ''
  })
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [novoCertificado, setNovoCertificado] = useState<Certificado>({
    nome: '',
    tipo: '',
    numero: '',
    validade: '',
    arquivo: null
  })

  useEffect(() => {
    if (sinaleiro && open) {
      setFormData({
        nome: sinaleiro.nome || '',
        cpf: sinaleiro.cpf || sinaleiro.rg_cpf || '',
        rg: sinaleiro.rg || sinaleiro.rg_cpf || '',
        telefone: sinaleiro.telefone || '',
        email: sinaleiro.email || ''
      })
      setCertificados(sinaleiro.certificados || [])
    }
  }, [sinaleiro, open])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const formatRG = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 9) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
    }
    return value
  }

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const handleAddCertificado = () => {
    if (!novoCertificado.nome || !novoCertificado.tipo) {
      toast({
        title: "Erro",
        description: "Preencha nome e tipo do certificado",
        variant: "destructive"
      })
      return
    }

    setCertificados([...certificados, { ...novoCertificado }])
    setNovoCertificado({
      nome: '',
      tipo: '',
      numero: '',
      validade: '',
      arquivo: null
    })
  }

  const handleRemoveCertificado = (index: number) => {
    setCertificados(certificados.filter((_, i) => i !== index))
  }

  const handleDocumentUpload = async (tipo: string, file: File) => {
    // Simular upload de documento
    toast({
      title: "Upload realizado",
      description: `Documento ${tipo} enviado com sucesso (MOCK)`
    })
  }

  const handleSave = async () => {
    // Validação: nome obrigatório, e CPF ou RG obrigatório (pelo menos um)
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Preencha o nome do sinaleiro",
        variant: "destructive"
      })
      return
    }

    // Para sinaleiro cliente, apenas CPF ou RG é necessário (pelo menos um)
    // Para sinaleiro interno, ambos são obrigatórios
    if (sinaleiro.tipo_vinculo === 'interno') {
      if (!formData.cpf || !formData.rg) {
        toast({
          title: "Erro",
          description: "Sinaleiro interno deve ter CPF e RG preenchidos",
          variant: "destructive"
        })
        return
      }
    } else if (sinaleiro.tipo_vinculo === 'cliente') {
      if (!formData.cpf && !formData.rg) {
        toast({
          title: "Erro",
          description: "Preencha pelo menos CPF ou RG",
          variant: "destructive"
        })
        return
      }
    }

    if (!sinaleiro || !obraId) return

    setLoading(true)
    try {
      // Se o sinaleiro tem ID válido (UUID), atualizar via API real
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const temIdValido = sinaleiro.id && uuidRegex.test(sinaleiro.id)
      
      if (temIdValido) {
        // Atualizar sinaleiro existente via API real
        const sinaleirosParaEnviar = [{
          id: sinaleiro.id,
          nome: formData.nome,
          rg_cpf: formData.cpf || formData.rg || sinaleiro.rg_cpf,
          telefone: formData.telefone,
          email: formData.email,
          tipo: sinaleiro.tipo || (sinaleiro.tipo_vinculo === 'interno' ? 'principal' : 'reserva')
        }]
        
        const response = await sinaleirosApi.criarOuAtualizar(obraId, sinaleirosParaEnviar)
        
        if (response.success && response.data && response.data.length > 0) {
          const sinaleiroAtualizado: Sinaleiro = {
            ...sinaleiro,
            id: response.data[0].id,
            nome: formData.nome,
            cpf: formData.cpf,
            rg: formData.rg,
            rg_cpf: formData.cpf || formData.rg,
            telefone: formData.telefone,
            email: formData.email,
            certificados: certificados.map(cert => ({
              nome: cert.nome,
              tipo: cert.tipo,
              numero: cert.numero,
              validade: cert.validade
            }))
          }
          
          toast({
            title: "Sucesso",
            description: "Sinaleiro atualizado com sucesso"
          })
          
          onSave(sinaleiroAtualizado)
          onOpenChange(false)
        }
      } else {
        // Se não tem ID válido, usar mock (compatibilidade)
        const sinaleiroAtualizado: Sinaleiro = {
          ...sinaleiro,
          nome: formData.nome,
          cpf: formData.cpf,
          rg: formData.rg,
          rg_cpf: formData.cpf || formData.rg,
          telefone: formData.telefone,
          email: formData.email,
          certificados: certificados.map(cert => ({
            nome: cert.nome,
            tipo: cert.tipo,
            numero: cert.numero,
            validade: cert.validade
          }))
        }

        await mockSinaleirosAPI.atualizar(sinaleiro.id, sinaleiroAtualizado)
        
        toast({
          title: "Sucesso",
          description: "Sinaleiro atualizado com sucesso"
        })

        onSave(sinaleiroAtualizado)
        onOpenChange(false)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar sinaleiro",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Se não há sinaleiro, mostrar mensagem
  if (!sinaleiro) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              Nenhum sinaleiro selecionado para edição.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Editar Sinaleiro
          </DialogTitle>
          <DialogDescription>
            {sinaleiro.tipo_vinculo === 'cliente' 
              ? 'Edite os dados do sinaleiro indicado pelo cliente'
              : 'Edite os dados do sinaleiro interno'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className={`grid w-full ${sinaleiro.tipo_vinculo === 'interno' || sinaleiro.tipo === 'principal' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            {sinaleiro.tipo_vinculo !== 'interno' && sinaleiro.tipo !== 'principal' && (
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            )}
            <TabsTrigger value="certificados">Certificados</TabsTrigger>
          </TabsList>

          {/* Aba: Dados Pessoais */}
          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      placeholder="Nome completo"
                      disabled={readOnly}
                    />
                  </div>

                  <div>
                    <Label>
                      CPF {sinaleiro.tipo_vinculo === 'interno' ? <span className="text-red-500">*</span> : <span className="text-xs text-gray-500">(ou RG)</span>}
                    </Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      disabled={readOnly}
                    />
                  </div>

                  <div>
                    <Label>
                      RG {sinaleiro.tipo_vinculo === 'interno' ? <span className="text-red-500">*</span> : <span className="text-xs text-gray-500">(ou CPF)</span>}
                    </Label>
                    <Input
                      value={formData.rg}
                      onChange={(e) => handleInputChange('rg', formatRG(e.target.value))}
                      placeholder="00.000.000-0"
                      disabled={readOnly}
                    />
                  </div>

                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', formatTelefone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      disabled={readOnly}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@example.com"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Documentos - Apenas para sinaleiros externos (cliente) */}
          {sinaleiro.tipo_vinculo !== 'interno' && sinaleiro.tipo !== 'principal' && (
            <TabsContent value="documentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documentos Obrigatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  {sinaleiro.id && (() => {
                    // Validar se o ID é um UUID válido antes de permitir documentos
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    if (uuidRegex.test(sinaleiro.id)) {
                      return (
                        <DocumentosSinaleiroList
                          sinaleiroId={sinaleiro.id}
                          readOnly={readOnly}
                        />
                      )
                    } else {
                      return (
                        <div className="text-center py-4 text-sm text-gray-500">
                          <p>Salve o sinaleiro primeiro para adicionar documentos.</p>
                        </div>
                      )
                    }
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Aba: Certificados */}
          <TabsContent value="certificados" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Certificados</CardTitle>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddCertificado}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Certificado
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de Certificados Cadastrados */}
                {certificados.length > 0 ? (
                  <div className="space-y-3">
                    {certificados.map((cert, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{cert.nome}</p>
                              <p className="text-sm text-gray-600">{cert.tipo}</p>
                              {cert.numero && (
                                <p className="text-xs text-gray-500">Nº: {cert.numero}</p>
                              )}
                              {cert.validade && (
                                <p className="text-xs text-gray-500">
                                  Válido até: {new Date(cert.validade).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCertificado(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                        {cert.arquivoUrl && (
                          <div className="mt-2">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <FileText className="w-3 h-3" />
                              Documento anexado
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum certificado cadastrado
                  </p>
                )}

                {/* Formulário para Novo Certificado */}
                {!readOnly && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-sm">Adicionar Novo Certificado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>
                            Nome do Certificado <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={novoCertificado.nome}
                            onChange={(e) => setNovoCertificado({ ...novoCertificado, nome: e.target.value })}
                            placeholder="Ex: NR-35 - Trabalho em Altura"
                          />
                        </div>

                        <div>
                          <Label>
                            Tipo <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={novoCertificado.tipo}
                            onChange={(e) => setNovoCertificado({ ...novoCertificado, tipo: e.target.value })}
                            placeholder="Ex: NR-35, Sinaleiro, etc."
                          />
                        </div>

                        <div>
                          <Label>Número do Certificado</Label>
                          <Input
                            value={novoCertificado.numero}
                            onChange={(e) => setNovoCertificado({ ...novoCertificado, numero: e.target.value })}
                            placeholder="Ex: NR35-2024-001"
                          />
                        </div>

                        <div>
                          <Label>Data de Validade</Label>
                          <Input
                            type="date"
                            value={novoCertificado.validade}
                            onChange={(e) => setNovoCertificado({ ...novoCertificado, validade: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Documento do Certificado (PDF ou Imagem)</Label>
                        <DocumentoUpload
                          accept="application/pdf,image/*"
                          maxSize={5 * 1024 * 1024}
                          onUpload={(file) => {
                            setNovoCertificado({ ...novoCertificado, arquivo: file })
                          }}
                          label="Anexar documento do certificado"
                        />
                      </div>

                      <Button
                        onClick={handleAddCertificado}
                        className="w-full"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Certificado
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          {!readOnly && (
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

