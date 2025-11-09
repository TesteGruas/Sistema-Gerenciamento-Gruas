"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentoUpload } from "@/components/documento-upload"
import { Plus, Edit, Trash2, Download, AlertTriangle, CheckCircle2, Clock, Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colaboradoresDocumentosApi, type DocumentoAdmissionalBackend } from "@/lib/api-colaboradores-documentos"

// Tipos de documentos admissionais
export const tiposDocumentos = [
  'ASO',
  'eSocial',
  'Ficha de Registro'
]

// Interface compatível com o componente
export interface DocumentoAdmissional {
  id: string | number
  colaborador_id: number
  tipo: string
  data_validade?: string
  arquivo: string
  alerta_enviado: boolean
}

export default function DocumentosAdmissionaisPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const colaboradorId = parseInt(params.id as string)

  const [documentos, setDocumentos] = useState<DocumentoAdmissional[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocumento, setEditingDocumento] = useState<DocumentoAdmissional | null>(null)
  const [formData, setFormData] = useState({
    tipo: '',
    data_validade: '',
    arquivo: null as File | null
  })

  useEffect(() => {
    loadDocumentos()
  }, [colaboradorId])

  const loadDocumentos = async () => {
    setLoading(true)
    try {
      const response = await colaboradoresDocumentosApi.documentosAdmissionais.listar(colaboradorId)
      if (response.success && response.data) {
        // Converter DocumentoAdmissionalBackend para DocumentoAdmissional
        const documentosConvertidos: DocumentoAdmissional[] = response.data.map((doc: DocumentoAdmissionalBackend) => ({
          id: doc.id,
          colaborador_id: doc.funcionario_id,
          tipo: doc.tipo,
          data_validade: doc.data_validade || '',
          arquivo: doc.arquivo,
          alerta_enviado: doc.alerta_enviado
        }))
        setDocumentos(documentosConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar documentos admissionais",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (documento?: DocumentoAdmissional) => {
    if (documento) {
      setEditingDocumento(documento)
      setFormData({
        tipo: documento.tipo,
        data_validade: documento.data_validade || '',
        arquivo: null
      })
    } else {
      setEditingDocumento(null)
      setFormData({
        tipo: '',
        data_validade: '',
        arquivo: null
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.tipo || !formData.arquivo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      let arquivoUrl = editingDocumento?.arquivo || ''
      
      // Se tiver arquivo novo, fazer upload primeiro
      if (formData.arquivo) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('arquivo', formData.arquivo)
          
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            arquivoUrl = uploadResult.data?.caminho || uploadResult.data?.arquivo || URL.createObjectURL(formData.arquivo)
          } else {
            arquivoUrl = URL.createObjectURL(formData.arquivo)
          }
        } catch (uploadError) {
          arquivoUrl = URL.createObjectURL(formData.arquivo)
        }
      }

      if (editingDocumento) {
        const response = await colaboradoresDocumentosApi.documentosAdmissionais.atualizar(
          editingDocumento.id.toString(),
          {
            tipo: formData.tipo,
            data_validade: formData.data_validade || undefined,
            arquivo: arquivoUrl
          }
        )
        
        if (response.success) {
          toast({
            title: "Sucesso",
            description: "Documento atualizado com sucesso"
          })
        }
      } else {
        const response = await colaboradoresDocumentosApi.documentosAdmissionais.criar(colaboradorId, {
          tipo: formData.tipo,
          data_validade: formData.data_validade || undefined,
          arquivo: arquivoUrl
        })
        
        if (response.success) {
          toast({
            title: "Sucesso",
            description: "Documento criado com sucesso"
          })
        }
      }

      setIsDialogOpen(false)
      loadDocumentos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar documento",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return

    try {
      await colaboradoresDocumentosApi.documentosAdmissionais.excluir(id.toString())
      toast({
        title: "Sucesso",
        description: "Documento excluído"
      })
      loadDocumentos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir documento",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (documento: DocumentoAdmissional) => {
    if (!documento.data_validade) {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
    }

    const hoje = new Date()
    const dataValidade = new Date(documento.data_validade)
    const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (dataValidade < hoje) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Vencido</Badge>
    } else if (dataValidade <= trintaDias) {
      return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" /> Vencendo</Badge>
    } else {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
    }
  }

  const diasParaVencimento = (dataValidade?: string): number | null => {
    if (!dataValidade) return null
    const hoje = new Date()
    const vencimento = new Date(dataValidade)
    const diff = vencimento.getTime() - hoje.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/rh/colaboradores/${colaboradorId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Documentos Admissionais</h1>
            <p className="text-gray-600 mt-1">
              Gerencie documentos admissionais do colaborador
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Documentos</CardTitle>
          <CardDescription>
            {documentos.length} documento(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum documento admissional cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((documento) => {
                  const dias = diasParaVencimento(documento.data_validade)
                  return (
                    <TableRow key={documento.id}>
                      <TableCell className="font-medium">{documento.tipo}</TableCell>
                      <TableCell>
                        {documento.data_validade ? (
                          <>
                            {new Date(documento.data_validade).toLocaleDateString('pt-BR')}
                            {dias !== null && dias >= 0 && dias <= 30 && (
                              <span className="text-xs text-yellow-600 ml-2">
                                ({dias} dias)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">Não possui</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(documento)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {documento.arquivo && (
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(documento)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(documento.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDocumento ? 'Editar Documento Admissional' : 'Novo Documento Admissional'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do documento. Alerta será enviado 30 dias antes do vencimento (se aplicável).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>
                Tipo de Documento <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumentos.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Data de Validade (Opcional)
              </Label>
              <Input
                type="date"
                value={formData.data_validade}
                onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Se informado, alerta será enviado 30 dias antes do vencimento
              </p>
            </div>

            <div>
              <DocumentoUpload
                accept="application/pdf,image/*"
                maxSize={5 * 1024 * 1024}
                onUpload={(file) => setFormData({ ...formData, arquivo: file })}
                label="Upload do Documento"
                required={!editingDocumento}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingDocumento ? 'Atualizar' : 'Criar'} Documento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

