"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentoUpload } from "./documento-upload"
import { Plus, Edit, Trash2, Download, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colaboradoresDocumentosApi, type CertificadoBackend } from "@/lib/api-colaboradores-documentos"

export interface CertificadoColaborador {
  id?: number
  colaborador_id: number
  tipo: string
  nome: string
  data_validade: string
  arquivo?: File | null
  arquivo_url?: string
  alerta_enviado?: boolean
}

const tiposCertificados = [
  'Ficha de EPI',
  'Ordem de Serviço',
  'NR06',
  'NR11',
  'NR12',
  'NR18',
  'NR35',
  'Certificado de Especificação'
]

interface ColaboradorCertificadosProps {
  colaboradorId: number
  readOnly?: boolean
}

export function ColaboradorCertificados({ colaboradorId, readOnly = false }: ColaboradorCertificadosProps) {
  const { toast } = useToast()
  const [certificados, setCertificados] = useState<CertificadoColaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCertificado, setEditingCertificado] = useState<CertificadoColaborador | null>(null)
  const [formData, setFormData] = useState({
    tipo: '',
    nome: '',
    data_validade: '',
    arquivo: null as File | null
  })

  useEffect(() => {
    loadCertificados()
  }, [colaboradorId])

  const loadCertificados = async () => {
    setLoading(true)
    try {
      const response = await colaboradoresDocumentosApi.certificados.listar(colaboradorId)
      if (response.success && response.data) {
        // Converter CertificadoBackend para CertificadoColaborador
        const certificadosConvertidos: CertificadoColaborador[] = response.data.map((cert: CertificadoBackend) => ({
          id: parseInt(cert.id),
          colaborador_id: cert.funcionario_id,
          tipo: cert.tipo,
          nome: cert.nome,
          data_validade: cert.data_validade || '',
          arquivo_url: cert.arquivo,
          alerta_enviado: cert.alerta_enviado
        }))
        setCertificados(certificadosConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar certificados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (certificado?: CertificadoColaborador) => {
    if (certificado) {
      setEditingCertificado(certificado)
      setFormData({
        tipo: certificado.tipo,
        nome: certificado.nome,
        data_validade: certificado.data_validade,
        arquivo: null // Sempre null ao abrir, arquivo existente está em arquivo_url
      })
    } else {
      setEditingCertificado(null)
      setFormData({
        tipo: '',
        nome: '',
        data_validade: '',
        arquivo: null
      })
    }
    setIsDialogOpen(true)
  }
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCertificado(null)
    setFormData({
      tipo: '',
      nome: '',
      data_validade: '',
      arquivo: null
    })
  }

  const handleSave = async () => {
    // Validação dos campos obrigatórios
    if (!formData.tipo || !formData.nome || !formData.data_validade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Tipo, Nome e Data de Validade)",
        variant: "destructive"
      })
      return
    }

    // Validação de arquivo (obrigatório apenas na criação)
    if (!editingCertificado && !formData.arquivo) {
      toast({
        title: "Erro",
        description: "O arquivo do certificado é obrigatório",
        variant: "destructive"
      })
      return
    }

    // Validação da data de validade
    const dataValidade = new Date(formData.data_validade)
    if (isNaN(dataValidade.getTime())) {
      toast({
        title: "Erro",
        description: "Data de validade inválida",
        variant: "destructive"
      })
      return
    }

    try {
      let arquivoUrl = editingCertificado?.arquivo_url || ''
      
      // Se tiver arquivo novo, fazer upload primeiro
      if (formData.arquivo) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('arquivo', formData.arquivo)
          formDataUpload.append('categoria', 'certificados')
          
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}))
            throw new Error(errorData.message || errorData.error || 'Erro ao fazer upload do arquivo')
          }
          
          const uploadResult = await uploadResponse.json()
          arquivoUrl = uploadResult.data?.arquivo || uploadResult.data?.caminho || uploadResult.arquivo || uploadResult.caminho
          
          if (!arquivoUrl) {
            throw new Error('URL do arquivo não retornada após upload')
          }
        } catch (uploadError: any) {
          toast({
            title: "Erro",
            description: uploadError.message || "Erro ao fazer upload do arquivo",
            variant: "destructive"
          })
          return
        }
      }

      // Preparar dados para a API
      const certificadoData = {
        tipo: formData.tipo,
        nome: formData.nome,
        data_validade: formData.data_validade,
        arquivo: arquivoUrl
      }

      if (editingCertificado?.id) {
        // Atualizar certificado existente
        await colaboradoresDocumentosApi.certificados.atualizar(
          editingCertificado.id.toString(),
          certificadoData
        )
        toast({
          title: "Sucesso",
          description: "Certificado atualizado com sucesso"
        })
      } else {
        // Criar novo certificado
        await colaboradoresDocumentosApi.certificados.criar(
          colaboradorId,
          certificadoData
        )
        toast({
          title: "Sucesso",
          description: "Certificado criado com sucesso"
        })
      }

      handleCloseDialog()
      await loadCertificados()
    } catch (error: any) {
      console.error('Erro ao salvar certificado:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar certificado",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este certificado?")) return

    try {
      await colaboradoresDocumentosApi.certificados.excluir(id.toString())
      toast({
        title: "Sucesso",
        description: "Certificado excluído com sucesso"
      })
      await loadCertificados()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir certificado",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (certificado: CertificadoColaborador) => {
    const hoje = new Date()
    const dataValidade = new Date(certificado.data_validade)
    const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (dataValidade < hoje) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Vencido</Badge>
    } else if (dataValidade <= trintaDias) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Vencendo em {Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))} dias</Badge>
    } else {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
    }
  }

  const diasParaVencimento = (dataValidade: string): number => {
    const hoje = new Date()
    const vencimento = new Date(dataValidade)
    const diff = vencimento.getTime() - hoje.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Certificados</CardTitle>
              <CardDescription>
                {certificados.length} certificado(s) cadastrado(s)
              </CardDescription>
            </div>
            {!readOnly && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Certificado
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : certificados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum certificado cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificados.map((certificado) => {
                  const dias = diasParaVencimento(certificado.data_validade)
                  return (
                    <TableRow key={certificado.id}>
                      <TableCell className="font-medium">{certificado.tipo}</TableCell>
                      <TableCell>{certificado.nome}</TableCell>
                      <TableCell>
                        {new Date(certificado.data_validade).toLocaleDateString('pt-BR')}
                        {dias >= 0 && dias <= 30 && (
                          <span className="text-xs text-yellow-600 ml-2">
                            ({dias} dias)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(certificado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {certificado.arquivo_url && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                  
                                  // Tentar obter URL assinada do arquivo
                                  try {
                                    const urlResponse = await fetch(
                                      `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(certificado.arquivo_url!)}`,
                                      {
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      }
                                    )
                                    
                                    if (urlResponse.ok) {
                                      const urlData = await urlResponse.json()
                                      window.open(urlData.url || urlData.data?.url || certificado.arquivo_url, '_blank')
                                    } else {
                                      window.open(certificado.arquivo_url, '_blank')
                                    }
                                  } catch {
                                    window.open(certificado.arquivo_url, '_blank')
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Erro",
                                    description: "Erro ao baixar certificado",
                                    variant: "destructive"
                                  })
                                }
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {!readOnly && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(certificado)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => certificado.id && handleDelete(certificado.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog()
        } else {
          setIsDialogOpen(true)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCertificado ? 'Editar Certificado' : 'Novo Certificado'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do certificado. Alerta será enviado 30 dias antes do vencimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>
                Tipo de Certificado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposCertificados.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Nome do Certificado <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: NR18 - Trabalho em Altura"
              />
            </div>

            <div>
              <Label>
                Data de Validade <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.data_validade}
                onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
              />
            </div>

            <div>
              <DocumentoUpload
                accept="application/pdf,image/*"
                maxSize={10 * 1024 * 1024}
                onUpload={(file) => setFormData({ ...formData, arquivo: file })}
                onRemove={() => setFormData({ ...formData, arquivo: null })}
                label="Upload do Certificado"
                required={!editingCertificado}
                currentFile={formData.arquivo}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingCertificado ? 'Atualizar' : 'Criar'} Certificado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

