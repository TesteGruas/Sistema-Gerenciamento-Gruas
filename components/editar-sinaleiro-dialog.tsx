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
import { Plus, Trash2, Save, Shield, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mockSinaleirosAPI, type Sinaleiro } from "@/lib/mocks/sinaleiros-mocks"
import { DocumentosSinaleiroList } from "./documentos-sinaleiro-list"
import { sinaleirosApi } from "@/lib/api-sinaleiros"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { colaboradoresDocumentosApi } from "@/lib/api-colaboradores-documentos"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface Certificado {
  nome: string
  tipo: string
  numero?: string
  validade?: string
  arquivo?: File | null
  arquivoUrl?: string
  id?: string | number
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
  
  // Estados para seleção de funcionário (quando sinaleiro interno)
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>('')
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [funcionarioFilter, setFuncionarioFilter] = useState('')
  const [funcionariosFiltrados, setFuncionariosFiltrados] = useState<any[]>([])
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)

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
      setFuncionarioSelecionadoId('')
      setFuncionarioFilter('')
      setFuncionariosFiltrados([])
    }
  }, [sinaleiro, open])
  
  // Carregar funcionários quando for sinaleiro interno
  useEffect(() => {
    const carregarFuncionarios = async () => {
      if (sinaleiro?.tipo_vinculo === 'interno' && open) {
        try {
          setLoadingFuncionarios(true)
          const response = await funcionariosApi.listarFuncionarios({ limit: 100, status: 'Ativo' })
          setFuncionarios(response.data || [])
        } catch (error) {
          console.error('Erro ao carregar funcionários:', error)
          setFuncionarios([])
        } finally {
          setLoadingFuncionarios(false)
        }
      }
    }
    
    carregarFuncionarios()
  }, [sinaleiro?.tipo_vinculo, open])
  
  // Buscar funcionários dinamicamente
  const buscarFuncionarios = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setFuncionariosFiltrados([])
      return
    }

    try {
      setLoadingFuncionarios(true)
      const response = await funcionariosApi.buscarFuncionarios(termo, { status: 'Ativo' })
      if (response.success) {
        setFuncionariosFiltrados(response.data || [])
      } else {
        setFuncionariosFiltrados([])
      }
    } catch (error) {
      console.error('Erro na busca de funcionários:', error)
      setFuncionariosFiltrados([])
    } finally {
      setLoadingFuncionarios(false)
    }
  }

  // Debounce para busca de funcionários
  useEffect(() => {
    if (sinaleiro?.tipo_vinculo === 'interno') {
      const timeoutId = setTimeout(() => {
        buscarFuncionarios(funcionarioFilter)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [funcionarioFilter, sinaleiro?.tipo_vinculo])
  
  // Quando um funcionário for selecionado, carregar apenas os certificados
  const handleFuncionarioSelect = async (funcionarioId: string) => {
    setFuncionarioSelecionadoId(funcionarioId)
    setFuncionarioFilter('')
    setFuncionariosFiltrados([])
    
    try {
      setLoadingFuncionarios(true)
      // Carregar certificados do funcionário
      const response = await colaboradoresDocumentosApi.certificados.listar(parseInt(funcionarioId))
      
      if (response.success && response.data) {
        // Converter certificados do funcionário para o formato do sinaleiro
        const certificadosFuncionario: Certificado[] = response.data.map((cert: any) => ({
          nome: cert.nome || cert.tipo,
          tipo: cert.tipo,
          numero: cert.numero || '',
          validade: cert.data_validade || '',
          arquivoUrl: cert.arquivo || undefined,
          id: cert.id // Manter o ID do certificado para download
        }))
        
        setCertificados(certificadosFuncionario)
        
        toast({
          title: "Sucesso",
          description: `${certificadosFuncionario.length} certificado(s) carregado(s) do funcionário`,
          variant: "default"
        })
      } else {
        setCertificados([])
        toast({
          title: "Informação",
          description: "Funcionário selecionado. Nenhum certificado encontrado.",
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error('Erro ao carregar certificados do funcionário:', error)
      setCertificados([])
      toast({
        title: "Aviso",
        description: "Erro ao carregar certificados do funcionário.",
        variant: "default"
      })
    } finally {
      setLoadingFuncionarios(false)
    }
  }
  
  // Função para baixar certificado
  const handleDownloadCertificado = async (certificado: Certificado) => {
    if (!certificado.arquivoUrl) {
      toast({
        title: "Aviso",
        description: "Este certificado não possui arquivo para download",
        variant: "default"
      })
      return
    }
    
    try {
      // Se o arquivo é uma URL completa, abrir diretamente
      if (certificado.arquivoUrl.startsWith('http')) {
        window.open(certificado.arquivoUrl, '_blank')
      } else {
        // Se for um caminho, construir URL de download
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        const downloadUrl = `${apiUrl}/api/colaboradores/certificados/${certificado.id}/download`
        window.open(downloadUrl, '_blank')
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao baixar certificado",
        variant: "destructive"
      })
    }
  }

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


  const handleDocumentUpload = async (tipo: string, file: File) => {
    // Simular upload de documento
    toast({
      title: "Upload realizado",
      description: `Documento ${tipo} enviado com sucesso (MOCK)`
    })
  }

  const handleSave = async () => {
    // Validação apenas para sinaleiros externos (clientes)
    if (sinaleiro.tipo_vinculo !== 'interno') {
      // Validação: nome obrigatório, e CPF ou RG obrigatório (pelo menos um)
      if (!formData.nome) {
        toast({
          title: "Erro",
          description: "Preencha o nome do sinaleiro",
          variant: "destructive"
        })
        return
      }

      // Para todos os sinaleiros, apenas CPF ou RG é necessário (pelo menos um)
      if (!formData.cpf && !formData.rg) {
        toast({
          title: "Erro",
          description: "Preencha pelo menos CPF ou RG",
          variant: "destructive"
        })
        return
      }
    }
    
    // Para sinaleiros internos, apenas validar se um funcionário foi selecionado
    if (sinaleiro.tipo_vinculo === 'interno' && !funcionarioSelecionadoId) {
      toast({
        title: "Erro",
        description: "Selecione um funcionário para o sinaleiro interno",
        variant: "destructive"
      })
      return
    }

    if (!sinaleiro || !obraId) return

    setLoading(true)
    try {
      // Se o sinaleiro tem ID válido (UUID), atualizar via API real
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const temIdValido = sinaleiro.id && uuidRegex.test(sinaleiro.id)
      
      // Para sinaleiros internos, buscar dados do funcionário selecionado
      let dadosParaEnviar = {
        nome: formData.nome,
        rg_cpf: formData.cpf || formData.rg || sinaleiro.rg_cpf || '',
        telefone: formData.telefone || '',
        email: formData.email || '',
        tipo: sinaleiro.tipo || (sinaleiro.tipo_vinculo === 'interno' ? 'principal' : 'reserva')
      }
      
      if (sinaleiro.tipo_vinculo === 'interno' && funcionarioSelecionadoId) {
        // Buscar dados do funcionário selecionado
        try {
          const funcionario = funcionarios.find(f => f.id.toString() === funcionarioSelecionadoId) || 
                             funcionariosFiltrados.find(f => f.id.toString() === funcionarioSelecionadoId)
          
          if (funcionario) {
            dadosParaEnviar = {
              nome: funcionario.nome || '',
              rg_cpf: funcionario.cpf || funcionario.rg || '',
              telefone: funcionario.telefone || '',
              email: funcionario.email || '',
              tipo: sinaleiro.tipo || 'principal'
            }
          }
        } catch (error) {
          console.error('Erro ao buscar dados do funcionário:', error)
        }
      }
      
      // Preparar dados do sinaleiro
      const sinaleirosParaEnviar = [{
        ...(temIdValido && { id: sinaleiro.id }), // Incluir ID apenas se for válido
        ...dadosParaEnviar
      }]
      
      // Criar ou atualizar via API real
      const response = await sinaleirosApi.criarOuAtualizar(obraId, sinaleirosParaEnviar)
      
      if (response.success && response.data && response.data.length > 0) {
        const dadosAtualizados = sinaleiro.tipo_vinculo === 'interno' && funcionarioSelecionadoId
          ? (() => {
              const funcionario = funcionarios.find(f => f.id.toString() === funcionarioSelecionadoId) || 
                                 funcionariosFiltrados.find(f => f.id.toString() === funcionarioSelecionadoId)
              return {
                nome: funcionario?.nome || formData.nome,
                cpf: funcionario?.cpf || formData.cpf,
                rg: funcionario?.rg || formData.rg,
                rg_cpf: funcionario?.cpf || funcionario?.rg || formData.cpf || formData.rg,
                telefone: funcionario?.telefone || formData.telefone,
                email: funcionario?.email || formData.email
              }
            })()
          : {
              nome: formData.nome,
              cpf: formData.cpf,
              rg: formData.rg,
              rg_cpf: formData.cpf || formData.rg,
              telefone: formData.telefone,
              email: formData.email
            }
        
        const sinaleiroAtualizado: Sinaleiro = {
          ...sinaleiro,
          id: response.data[0].id,
          ...dadosAtualizados,
          certificados: certificados.map(cert => ({
            nome: cert.nome,
            tipo: cert.tipo,
            numero: cert.numero,
            validade: cert.validade
          }))
        }
        
        toast({
          title: "Sucesso",
          description: temIdValido ? "Sinaleiro atualizado com sucesso" : "Sinaleiro cadastrado com sucesso"
        })
        
        onSave(sinaleiroAtualizado)
        onOpenChange(false)
      } else if (!temIdValido) {
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

  // Se não há sinaleiro ou obraId, mostrar mensagem
  if (!sinaleiro || !obraId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              {!sinaleiro ? 'Nenhum sinaleiro selecionado para edição.' : 'ID da obra não informado.'}
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
            {sinaleiro.id ? 'Editar Sinaleiro' : 'Cadastrar Sinaleiro'}
          </DialogTitle>
          <DialogDescription>
            {sinaleiro.tipo_vinculo === 'cliente' 
              ? (sinaleiro.id ? 'Edite os dados do sinaleiro indicado pelo cliente' : 'Cadastre os dados do sinaleiro indicado pelo cliente')
              : (sinaleiro.id ? 'Edite os dados do sinaleiro interno' : 'Cadastre os dados do sinaleiro interno')}
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
                {/* Seletor de Funcionário para Sinaleiros Internos */}
                {sinaleiro.tipo_vinculo === 'interno' && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium text-blue-900 mb-2 block">
                      Selecionar Funcionário (Opcional)
                    </Label>
                    <p className="text-xs text-blue-700 mb-3">
                      Selecione um funcionário existente para carregar automaticamente os certificados dele.
                    </p>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar funcionário por nome, email ou cargo..."
                          value={funcionarioFilter}
                          onChange={(e) => setFuncionarioFilter(e.target.value)}
                          className="pl-10"
                          disabled={readOnly}
                        />
                      </div>
                      
                      {funcionarioFilter && funcionariosFiltrados.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg bg-white">
                          {funcionariosFiltrados.map((funcionario) => (
                            <div 
                              key={funcionario.id} 
                              className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                              onClick={() => !readOnly && handleFuncionarioSelect(funcionario.id.toString())}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{funcionario.nome}</div>
                                  <div className="text-xs text-gray-500 truncate">{funcionario.email}</div>
                                  <div className="text-xs text-gray-400 truncate">{funcionario.cargo || funcionario.role}</div>
                                </div>
                                {funcionarioSelecionadoId === funcionario.id.toString() && (
                                  <Badge variant="secondary" className="shrink-0 ml-2">Selecionado</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {funcionarioFilter && funcionariosFiltrados.length === 0 && !loadingFuncionarios && (
                        <div className="mt-2 p-3 text-center text-gray-500 text-sm border rounded-lg">
                          Nenhum funcionário encontrado para "{funcionarioFilter}"
                        </div>
                      )}
                      
                      {funcionarioSelecionadoId && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                          ✅ Funcionário selecionado. Certificados carregados automaticamente.
                        </div>
                      )}
                      
                      {loadingFuncionarios && (
                        <div className="mt-2 p-2 text-center text-sm text-gray-500">
                          Carregando certificados...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Campos de dados pessoais - apenas para sinaleiros externos */}
                {sinaleiro.tipo_vinculo !== 'interno' && (
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
                        CPF <span className="text-xs text-gray-500">(ou RG)</span>
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
                        RG <span className="text-xs text-gray-500">(ou CPF)</span>
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
                )}
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
                <CardTitle className="text-base">Certificados</CardTitle>
                {sinaleiro.tipo_vinculo === 'interno' && funcionarioSelecionadoId && (
                  <p className="text-sm text-gray-600 mt-1">
                    Certificados do funcionário selecionado
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de Certificados Cadastrados */}
                {certificados.length > 0 ? (
                  <div className="space-y-3">
                    {certificados.map((cert, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{cert.nome}</p>
                              <p className="text-sm text-gray-600 truncate">{cert.tipo}</p>
                              {cert.numero && (
                                <p className="text-xs text-gray-500 truncate">Nº: {cert.numero}</p>
                              )}
                              {cert.validade && (
                                <p className="text-xs text-gray-500">
                                  Válido até: {new Date(cert.validade).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          {cert.arquivoUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCertificado(cert)}
                              className="shrink-0 ml-2"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                          )}
                        </div>
                        {cert.arquivoUrl && (
                          <div className="mt-2">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <FileText className="w-3 h-3" />
                              Documento disponível
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">
                      {sinaleiro.tipo_vinculo === 'interno' && !funcionarioSelecionadoId
                        ? 'Selecione um funcionário para carregar os certificados'
                        : 'Nenhum certificado encontrado'}
                    </p>
                  </div>
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

