"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, Upload, Eye, Check, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DocumentoUpload } from "./documento-upload"
import { sinaleirosApi, type DocumentoSinaleiroBackend } from "@/lib/api-sinaleiros"
import { apiArquivos } from "@/lib/api-arquivos"

interface DocumentosSinaleiroListProps {
  sinaleiroId: string
  readOnly?: boolean
}

// Documentos obrigatórios (mantido do mock)
export const documentosObrigatorios = [
  { tipo: 'rg_frente', nome: 'RG (Frente)', obrigatorio: true },
  { tipo: 'rg_verso', nome: 'RG (Verso)', obrigatorio: true },
  { tipo: 'comprovante_vinculo', nome: 'Comprovante de Vínculo', obrigatorio: true },
  { tipo: 'certificado', nome: 'Certificado Aplicável', obrigatorio: false }
]

// Interface compatível com o componente
export interface DocumentoSinaleiro {
  id: string
  sinaleiro_id: string
  tipo: string
  arquivo: string
  data_validade?: string
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'vencido'
  aprovado_por?: string | number
  aprovado_em?: string
  alerta_enviado: boolean
}

export function DocumentosSinaleiroList({
  sinaleiroId,
  readOnly = false
}: DocumentosSinaleiroListProps) {
  const { toast } = useToast()
  const [documentos, setDocumentos] = useState<DocumentoSinaleiro[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null)

  const loadDocumentos = async () => {
    // Validar se o ID é um UUID válido antes de fazer a requisição
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!sinaleiroId || !uuidRegex.test(sinaleiroId)) {
      console.warn('⚠️ Tentativa de carregar documentos com ID inválido:', sinaleiroId)
      setDocumentos([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const response = await sinaleirosApi.listarDocumentos(sinaleiroId)
      if (response.success && response.data) {
        // Converter DocumentoSinaleiroBackend para DocumentoSinaleiro
        const documentosConvertidos: DocumentoSinaleiro[] = response.data.map((doc: DocumentoSinaleiroBackend) => ({
          id: doc.id,
          sinaleiro_id: doc.sinaleiro_id,
          tipo: doc.tipo,
          arquivo: doc.arquivo,
          data_validade: doc.data_validade,
          status: doc.status,
          aprovado_por: doc.aprovado_por,
          aprovado_em: doc.aprovado_em,
          alerta_enviado: doc.alerta_enviado
        }))
        setDocumentos(documentosConvertidos)
      }
    } catch (error: any) {
      // Ignorar erros relacionados a IDs inválidos (temporários)
      if (error.message?.includes('invalid input syntax for type uuid')) {
        console.warn('⚠️ ID temporário detectado, ignorando erro:', sinaleiroId)
        setDocumentos([])
      } else {
        console.error('Erro ao carregar documentos:', error)
        toast({
          title: "Erro",
          description: error.message || "Erro ao carregar documentos do sinaleiro",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Validar se o ID é um UUID válido antes de tentar carregar
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (sinaleiroId && uuidRegex.test(sinaleiroId)) {
      loadDocumentos()
    } else {
      // Se não for UUID válido, limpar documentos e não tentar carregar
      setDocumentos([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinaleiroId])

  const handleUpload = async (tipo: string, file: File) => {
    // Validar se o sinaleiroId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sinaleiroId)) {
      toast({
        title: "Erro",
        description: "O sinaleiro precisa ser salvo no banco antes de adicionar documentos. Salve o sinaleiro primeiro.",
        variant: "destructive"
      })
      return
    }
    
    setUploadingTipo(tipo)
    try {
      // Primeiro fazer upload do arquivo
      // Usar o serviço de upload genérico ou criar URL temporária
      // Por enquanto, vamos usar uma abordagem simples: criar URL do arquivo
      // Nota: Em produção, isso deve fazer upload real para o servidor
      let arquivoUrl: string
      
      try {
        // Tentar fazer upload usando apiArquivos
        // O backend espera apenas uma string (URL/caminho), então precisamos fazer upload primeiro
        const formData = new FormData()
        formData.append('arquivo', file)
        
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        
        // Upload para o endpoint de arquivos (se existir um endpoint genérico)
        // Por enquanto, vamos usar uma URL temporária e depois ajustar quando tiver endpoint específico
        const response = await fetch(`${apiUrl}/api/arquivos/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          arquivoUrl = result.data?.caminho || result.data?.arquivo || URL.createObjectURL(file)
        } else {
          // Se falhar, usar URL temporária (será ajustado quando tiver endpoint específico)
          arquivoUrl = URL.createObjectURL(file)
        }
      } catch (uploadError) {
        // Se falhar o upload, usar URL temporária
        arquivoUrl = URL.createObjectURL(file)
      }

      // Criar documento no backend
      const response = await sinaleirosApi.criarDocumento(sinaleiroId, {
        tipo,
        arquivo: arquivoUrl,
        data_validade: undefined // Pode ser adicionado depois se necessário
      })

      if (response.success && response.data) {
        const novoDoc: DocumentoSinaleiro = {
          id: response.data.id,
          sinaleiro_id: response.data.sinaleiro_id,
          tipo: response.data.tipo,
          arquivo: response.data.arquivo,
          data_validade: response.data.data_validade,
          status: response.data.status,
          aprovado_por: response.data.aprovado_por,
          aprovado_em: response.data.aprovado_em,
          alerta_enviado: response.data.alerta_enviado
        }
        
        setDocumentos([...documentos, novoDoc])
        toast({
          title: "Sucesso",
          description: "Documento enviado com sucesso"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar documento",
        variant: "destructive"
      })
    } finally {
      setUploadingTipo(null)
    }
  }

  const handleAprovar = async (documentoId: string) => {
    try {
      const response = await sinaleirosApi.aprovarDocumento(documentoId, {
        status: 'aprovado'
      })

      if (response.success && response.data) {
        setDocumentos(documentos.map(doc => 
          doc.id === documentoId 
            ? { 
                ...doc, 
                status: 'aprovado' as const, 
                aprovado_por: response.data.aprovado_por || 'Você', 
                aprovado_em: response.data.aprovado_em || new Date().toISOString() 
              }
            : doc
        ))
        toast({
          title: "Sucesso",
          description: "Documento aprovado"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar documento",
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

