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
import { Plus, Edit, Trash2, Download, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface DocumentoAdmissional {
  id?: number
  colaborador_id: number
  tipo: 'ASO' | 'eSocial' | 'Ficha de Registro'
  nome: string
  data: string
  data_validade?: string
  arquivo?: File | null
  arquivo_url?: string
  alerta_enviado?: boolean
}

const tiposDocumentos = [
  'ASO',
  'eSocial',
  'Ficha de Registro'
]

interface ColaboradorDocumentosAdmissionaisProps {
  colaboradorId: number
  readOnly?: boolean
}

export function ColaboradorDocumentosAdmissionais({ colaboradorId, readOnly = false }: ColaboradorDocumentosAdmissionaisProps) {
  const { toast } = useToast()
  const [documentos, setDocumentos] = useState<DocumentoAdmissional[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocumento, setEditingDocumento] = useState<DocumentoAdmissional | null>(null)
  const [formData, setFormData] = useState<{
    tipo: DocumentoAdmissional['tipo'] | ''
    nome: string
    data: string
    data_validade: string
    arquivo: File | null
  }>({
    tipo: '',
    nome: '',
    data: '',
    data_validade: '',
    arquivo: null
  })

  const loadDocumentos = async () => {
    setLoading(true)
    try {
      // TODO: Substituir por chamada real da API
      await new Promise(resolve => setTimeout(resolve, 500))
      setDocumentos([])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos admissionais",
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
        nome: documento.nome,
        data: documento.data,
        data_validade: documento.data_validade || '',
        arquivo: null
      })
    } else {
      setEditingDocumento(null)
      setFormData({
        tipo: '',
        nome: '',
        data: '',
        data_validade: '',
        arquivo: null
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.tipo || !formData.nome || !formData.data) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      // TODO: Substituir por chamada real da API
      toast({
        title: "Sucesso",
        description: editingDocumento ? "Documento atualizado com sucesso" : "Documento criado com sucesso"
      })

      setIsDialogOpen(false)
      loadDocumentos()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar documento",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return

    try {
      // TODO: Substituir por chamada real da API
      toast({
        title: "Sucesso",
        description: "Documento excluído"
      })
      loadDocumentos()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir documento",
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
      const dias = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Vencendo em {dias} dias</Badge>
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

  useEffect(() => {
    if (colaboradorId && colaboradorId > 0) {
      loadDocumentos()
    }
  }, [colaboradorId])

  const documentosVencendo = documentos.filter(d => {
    const dias = diasParaVencimento(d.data_validade)
    return dias !== null && dias >= 0 && dias <= 30
  })

  // Validar colaboradorId antes de renderizar
  if (!colaboradorId || colaboradorId <= 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">ID do colaborador inválido</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alerta de documentos vencendo */}
      {documentosVencendo.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Atenção: Documentos Vencendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentosVencendo.map((doc) => {
                const dias = diasParaVencimento(doc.data_validade)
                return (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div>
                      <p className="font-medium">{doc.nome}</p>
                      <p className="text-sm text-gray-600">
                        {doc.data_validade && (
                          <>
                            Vence em {dias} dia{dias !== 1 ? 's' : ''} - {new Date(doc.data_validade).toLocaleDateString('pt-BR')}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(doc)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Renovar
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentos Admissionais</CardTitle>
              <CardDescription>
                {documentos.length} documento(s) cadastrado(s)
              </CardDescription>
            </div>
            {!readOnly && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum documento admissional cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
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
                      <TableCell>{documento.nome}</TableCell>
                      <TableCell>{new Date(documento.data).toLocaleDateString('pt-BR')}</TableCell>
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
                          {documento.arquivo_url && (
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {!readOnly && (
                            <>
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
                                onClick={() => documento.id && handleDelete(documento.id)}
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
                value={formData.tipo || undefined}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as DocumentoAdmissional['tipo'] })}
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
                Nome do Documento <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: ASO - Exame Médico Admissional"
              />
            </div>

            <div>
              <Label>
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
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

