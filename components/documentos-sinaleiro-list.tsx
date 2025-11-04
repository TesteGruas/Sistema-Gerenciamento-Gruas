"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, Upload, Eye, Check, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DocumentoUpload } from "./documento-upload"
import { documentosObrigatorios, type DocumentoSinaleiro } from "@/lib/mocks/sinaleiros-mocks"

interface DocumentosSinaleiroListProps {
  sinaleiroId: string
  readOnly?: boolean
}

// Mock: API de documentos
const mockDocumentosAPI = {
  async listar(sinaleiroId: string): Promise<DocumentoSinaleiro[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Retornar documentos mockados ou vazios
    return []
  },

  async upload(sinaleiroId: string, tipo: string, file: File): Promise<DocumentoSinaleiro> {
    await new Promise(resolve => setTimeout(resolve, 500))
    const novo: DocumentoSinaleiro = {
      id: `doc_${Date.now()}`,
      sinaleiro_id: sinaleiroId,
      tipo: tipo as any,
      arquivo: URL.createObjectURL(file),
      status: 'pendente',
      alerta_enviado: false
    }
    return novo
  },

  async aprovar(documentoId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

export function DocumentosSinaleiroList({
  sinaleiroId,
  readOnly = false
}: DocumentosSinaleiroListProps) {
  const { toast } = useToast()
  const [documentos, setDocumentos] = useState<DocumentoSinaleiro[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null)

  useEffect(() => {
    loadDocumentos()
  }, [sinaleiroId])

  const loadDocumentos = async () => {
    setLoading(true)
    try {
      const data = await mockDocumentosAPI.listar(sinaleiroId)
      setDocumentos(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (tipo: string, file: File) => {
    setUploadingTipo(tipo)
    try {
      const novoDoc = await mockDocumentosAPI.upload(sinaleiroId, tipo, file)
      setDocumentos([...documentos, novoDoc])
      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso (MOCK)"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar documento",
        variant: "destructive"
      })
    } finally {
      setUploadingTipo(null)
    }
  }

  const handleAprovar = async (documentoId: string) => {
    try {
      await mockDocumentosAPI.aprovar(documentoId)
      setDocumentos(documentos.map(doc => 
        doc.id === documentoId 
          ? { ...doc, status: 'aprovado' as const, aprovado_por: 'Você', aprovado_em: new Date().toISOString() }
          : doc
      ))
      toast({
        title: "Sucesso",
        description: "Documento aprovado"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar documento",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado</Badge>
      case 'vencido':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Vencido</Badge>
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>
    }
  }

  const getDocumentoByTipo = (tipo: string) => {
    return documentos.find(doc => doc.tipo === tipo)
  }

  const canApprove = !readOnly // Admin e Cliente podem aprovar, Auditor não

  return (
    <div className="space-y-4 mt-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Documentos do Sinaleiro</h4>
        <Badge variant="outline">
          {documentos.filter(d => d.status === 'aprovado').length} / {documentosObrigatorios.filter(d => d.obrigatorio).length} obrigatórios
        </Badge>
      </div>

      <div className="space-y-4">
        {documentosObrigatorios.map((docTipo) => {
          const documento = getDocumentoByTipo(docTipo.tipo)
          const isUploading = uploadingTipo === docTipo.tipo

          return (
            <Card key={docTipo.tipo} className={docTipo.obrigatorio && !documento ? "border-l-4 border-l-red-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">
                      {docTipo.nome}
                      {docTipo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                    </CardTitle>
                  </div>
                  {documento && getStatusBadge(documento.status)}
                </div>
              </CardHeader>
              <CardContent>
                {documento ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{documento.arquivo.split('/').pop()}</p>
                          {documento.data_validade && (
                            <p className="text-xs text-gray-500">
                              Válido até: {new Date(documento.data_validade).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canApprove && documento.status === 'pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAprovar(documento.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  !readOnly && (
                    <DocumentoUpload
                      accept="application/pdf,image/*"
                      maxSize={5 * 1024 * 1024}
                      onUpload={(file) => handleUpload(docTipo.tipo, file)}
                      label={`Upload ${docTipo.nome}`}
                      required={docTipo.obrigatorio}
                      disabled={isUploading}
                    />
                  )
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

