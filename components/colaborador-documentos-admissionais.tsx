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
import { Plus, Edit, Trash2, Download, AlertTriangle, CheckCircle2, Clock, FileSignature, Loader2, PenLine } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiBasePath } from "@/lib/runtime-config"
import { caminhoStorageAPartirDoUpload } from "@/lib/caminho-storage-arquivos"
import { TIPOS_DOCUMENTOS_ADMISSIONAIS } from "@/lib/rh-documentos-tipos"
import { tipoAdmissionalParaTipoDocumentoAssinatura } from "@/lib/admissional-tipo-documento-assinatura"
import { SignaturePad } from "@/components/signature-pad"

export interface DocumentoAdmissional {
  id?: string | number
  colaborador_id: number
  tipo: string
  nome: string
  data: string
  data_validade?: string
  arquivo?: File | null
  arquivo_url?: string
  alerta_enviado?: boolean
  assinatura_digital?: string
  assinado_em?: string
}

const tiposDocumentos: string[] = [...TIPOS_DOCUMENTOS_ADMISSIONAIS]

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
    tipo: string
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

  /** Prévia + registro de assinatura (mesma lógica da aba Documentos do RH / PWA). */
  const [assinarOpen, setAssinarOpen] = useState(false)
  const [assinarDoc, setAssinarDoc] = useState<DocumentoAdmissional | null>(null)
  const [assinarPdf, setAssinarPdf] = useState<File | null>(null)
  const [assinarArquivoNome, setAssinarArquivoNome] = useState("documento.pdf")
  const [assinarTitulo, setAssinarTitulo] = useState("")
  const [assinarTipoDocumentoApi, setAssinarTipoDocumentoApi] = useState("")
  const [assinarAssinaturaDataUrl, setAssinarAssinaturaDataUrl] = useState<string | null>(null)
  const [assinarAssinaturaImg, setAssinarAssinaturaImg] = useState<File | null>(null)
  const [assinarPadOpen, setAssinarPadOpen] = useState(false)
  const [assinarPreviewUrl, setAssinarPreviewUrl] = useState<string | null>(null)
  const [assinarLoadingPdf, setAssinarLoadingPdf] = useState(false)
  const [assinarLoadingPrev, setAssinarLoadingPrev] = useState(false)
  const [assinarSalvando, setAssinarSalvando] = useState(false)

  const loadDocumentos = async () => {
    setLoading(true)
    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      const response = await colaboradoresDocumentosApi.documentosAdmissionais.listar(colaboradorId)
      if (response.success && response.data) {
        const documentosConvertidos: DocumentoAdmissional[] = response.data.map((doc: any) => ({
          id: doc.id,
          colaborador_id: doc.funcionario_id,
          tipo: doc.tipo,
          nome: doc.tipo, // Usar tipo como nome se não houver nome separado
          data: doc.created_at || new Date().toISOString(),
          data_validade: doc.data_validade || undefined,
          arquivo_url: doc.arquivo,
          alerta_enviado: doc.alerta_enviado,
          assinatura_digital: doc.assinatura_digital,
          assinado_em: doc.assinado_em,
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

  const documentoAdmissionalAssinado = (d: DocumentoAdmissional) =>
    Boolean(d.assinatura_digital && d.assinado_em)

  const fecharDialogAssinar = () => {
    setAssinarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setAssinarOpen(false)
    setAssinarDoc(null)
    setAssinarPdf(null)
    setAssinarAssinaturaDataUrl(null)
    setAssinarAssinaturaImg(null)
    setAssinarPadOpen(false)
    setAssinarTipoDocumentoApi("")
    setAssinarArquivoNome("documento.pdf")
    setAssinarTitulo("")
  }

  const abrirAssinarAdmissional = async (documento: DocumentoAdmissional) => {
    if (!documento.id || documentoAdmissionalAssinado(documento) || !documento.arquivo_url) return
    setAssinarDoc(documento)
    setAssinarOpen(true)
    setAssinarLoadingPdf(true)
    setAssinarAssinaturaDataUrl(null)
    setAssinarAssinaturaImg(null)
    setAssinarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setAssinarTipoDocumentoApi(tipoAdmissionalParaTipoDocumentoAssinatura(documento.tipo))
    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      const blob = await colaboradoresDocumentosApi.documentosAdmissionais.baixar(String(documento.id), false)
      const baseNome = (documento.nome || documento.tipo || "documento").replace(/[<>:"/\\|?*]+/g, "_").slice(0, 120)
      const nomeArquivo = baseNome.toLowerCase().endsWith(".pdf") ? baseNome : `${baseNome}.pdf`
      setAssinarPdf(new File([blob], nomeArquivo, { type: "application/pdf" }))
      setAssinarArquivoNome(nomeArquivo)
      setAssinarTitulo(`${documento.tipo} — ${documento.nome}`)
      toast({
        title: "PDF carregado",
        description: "Desenhe a assinatura e gere a prévia antes de registrar.",
      })
    } catch (e) {
      toast({
        title: "Erro ao carregar PDF",
        description: e instanceof Error ? e.message : "Falha ao baixar o arquivo",
        variant: "destructive",
      })
      fecharDialogAssinar()
    } finally {
      setAssinarLoadingPdf(false)
    }
  }

  const gerarPreviaAssinaturaAdmissional = async () => {
    if (!assinarPdf) {
      toast({ title: "PDF não disponível", description: "Aguarde o carregamento do arquivo.", variant: "destructive" })
      return
    }
    setAssinarLoadingPrev(true)
    try {
      setAssinarPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      const token = localStorage.getItem("access_token") || localStorage.getItem("token")
      const fd = new FormData()
      fd.append("pdf", assinarPdf)
      fd.append("arquivo_original", assinarArquivoNome || "documento.pdf")
      fd.append("titulo", assinarTitulo || "")
      if (assinarTipoDocumentoApi) {
        fd.append("tipo_documento", assinarTipoDocumentoApi)
      }
      if (assinarAssinaturaDataUrl) {
        const imgRes = await fetch(assinarAssinaturaDataUrl)
        const imgBlob = await imgRes.blob()
        fd.append("assinatura", new File([imgBlob], "assinatura.png", { type: "image/png" }))
      } else if (assinarAssinaturaImg) {
        fd.append("assinatura", assinarAssinaturaImg)
      }

      const res = await fetch(`${getApiBasePath()}/rh/preview-assinatura-pdf`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(err.message || `Erro ${res.status}`)
      }

      const blob = await res.blob()
      setAssinarPreviewUrl(URL.createObjectURL(blob))
      toast({ title: "Prévia gerada", description: "Confira o posicionamento abaixo." })
    } catch (e) {
      toast({
        title: "Erro ao gerar prévia",
        description: e instanceof Error ? e.message : "Falha na simulação",
        variant: "destructive",
      })
    } finally {
      setAssinarLoadingPrev(false)
    }
  }

  const registrarAssinaturaAdmissional = async () => {
    if (!assinarDoc?.id) return
    let assinatura_digital: string | null = assinarAssinaturaDataUrl
    if (!assinatura_digital && assinarAssinaturaImg) {
      assinatura_digital = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(new Error("Leitura da imagem falhou"))
        r.readAsDataURL(assinarAssinaturaImg!)
      })
    }
    if (!assinatura_digital) {
      toast({
        title: "Assinatura obrigatória",
        description: "Desenhe no painel ou envie uma imagem PNG/JPG.",
        variant: "destructive",
      })
      return
    }
    setAssinarSalvando(true)
    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      const response = await colaboradoresDocumentosApi.documentosAdmissionais.assinar(String(assinarDoc.id), {
        assinatura_digital,
      })
      if (response.success) {
        toast({ title: "Assinatura registrada", description: "O PDF com assinatura embutida fica disponível no download." })
        fecharDialogAssinar()
        loadDocumentos()
      } else {
        throw new Error("Falha ao registrar")
      }
    } catch (e) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Não foi possível registrar a assinatura",
        variant: "destructive",
      })
    } finally {
      setAssinarSalvando(false)
    }
  }

  const handleDownloadDocumento = async (documento: DocumentoAdmissional, comAssinatura: boolean) => {
    if (!documento.id) return
    if (comAssinatura && !documentoAdmissionalAssinado(documento)) {
      toast({
        title: "Sem assinatura",
        description: "Este documento ainda não foi assinado pelo colaborador.",
        variant: "destructive",
      })
      return
    }
    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      const blob = await colaboradoresDocumentosApi.documentosAdmissionais.baixar(
        String(documento.id),
        comAssinatura
      )
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const nome = String(documento.tipo || documento.nome || "documento").replace(/[^\w.-]+/g, "_")
      a.download = `${nome}${comAssinatura ? "_assinado" : ""}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível baixar o arquivo."
      toast({
        title: "Erro ao baixar",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!formData.tipo || !formData.data) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    if (!editingDocumento && !formData.arquivo) {
      toast({
        title: "Erro",
        description: "Anexe o arquivo do documento (PDF ou imagem).",
        variant: "destructive",
      })
      return
    }

    try {
      let arquivoUrl = editingDocumento?.arquivo_url?.trim() || ""

      if (formData.arquivo) {
        const formDataUpload = new FormData()
        formDataUpload.append("arquivo", formData.arquivo)

        const token = localStorage.getItem("access_token") || localStorage.getItem("token")
        const uploadResponse = await fetch(`${getApiBasePath()}/arquivos/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          body: formDataUpload,
        })

        const uploadResult = await uploadResponse.json().catch(() => ({}))
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || uploadResult.error || "Falha no upload do arquivo")
        }

        const path = caminhoStorageAPartirDoUpload(uploadResult.data ?? uploadResult)
        if (!path) {
          throw new Error(
            "Upload não retornou caminho válido no storage. Verifique a resposta da API (caminho no bucket arquivos-obras)."
          )
        }
        arquivoUrl = path
      } else if (editingDocumento) {
        if (!arquivoUrl || arquivoUrl.startsWith("blob:")) {
          toast({
            title: "Arquivo inválido",
            description:
              "Este registro não tem arquivo no servidor. Envie o documento novamente ao editar.",
            variant: "destructive",
          })
          return
        }
      }

      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      
      if (editingDocumento && editingDocumento.id) {
        await colaboradoresDocumentosApi.documentosAdmissionais.atualizar(
          editingDocumento.id.toString(),
          {
            tipo: formData.tipo,
            data_validade: formData.data_validade || undefined,
            arquivo: arquivoUrl
          }
        )
      } else {
        await colaboradoresDocumentosApi.documentosAdmissionais.criar(colaboradorId, {
          tipo: formData.tipo,
          data_validade: formData.data_validade || undefined,
          arquivo: arquivoUrl
        })
      }

      toast({
        title: "Sucesso",
        description: editingDocumento ? "Documento atualizado com sucesso" : "Documento criado com sucesso"
      })

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
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
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
                {documentos.length} documento(s) cadastrado(s). O colaborador pode assinar no Perfil; o RH pode pré-visualizar e registrar a assinatura aqui (ícone de caneta), com a mesma lógica de posição dos PDFs.
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
                  <TableHead>Validade doc.</TableHead>
                  <TableHead>Assinatura</TableHead>
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
                      <TableCell>
                        {documentoAdmissionalAssinado(documento) ? (
                          <Badge className="bg-emerald-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Assinado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente assinatura
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {documento.arquivo_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                title="Baixar PDF original"
                                onClick={() => handleDownloadDocumento(documento, false)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {documentoAdmissionalAssinado(documento) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  title="Baixar PDF com assinatura embutida"
                                  className="text-emerald-700"
                                  onClick={() => handleDownloadDocumento(documento, true)}
                                >
                                  <FileSignature className="w-4 h-4" />
                                </Button>
                              )}
                              {!readOnly && !documentoAdmissionalAssinado(documento) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  title="Prévia e registrar assinatura (RH)"
                                  className="text-primary"
                                  disabled={assinarLoadingPdf && assinarDoc?.id === documento.id}
                                  onClick={() => void abrirAssinarAdmissional(documento)}
                                >
                                  {assinarLoadingPdf && assinarDoc?.id === documento.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <PenLine className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </>
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
                                type="button"
                                onClick={() => documento.id != null && handleDelete(documento.id)}
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

      <Dialog
        open={assinarOpen}
        onOpenChange={(open) => {
          if (!open) fecharDialogAssinar()
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia e registro de assinatura</DialogTitle>
            <DialogDescription>
              Mesma lógica da aba Documentos do funcionário e do PWA (âncoras no PDF). Gere a prévia com o posicionamento correto e depois registre a assinatura.
              {assinarDoc ? ` Documento: ${assinarDoc.tipo}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {assinarLoadingPdf ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando PDF do servidor…
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Arquivo: <span className="font-medium text-foreground">{assinarArquivoNome}</span>
              </p>
            )}
            <div>
              <Label htmlFor="adm-sim-tipo-doc">Tipo do documento (regra de posição)</Label>
              <p className="text-xs text-muted-foreground mb-1.5">
                Ajuste se o tipo cadastrado não bater com o modelo do PDF (ex.: ficha de EPIs em duas páginas).
              </p>
              <Select
                value={assinarTipoDocumentoApi || "__auto__"}
                onValueChange={(v) => setAssinarTipoDocumentoApi(v === "__auto__" ? "" : v)}
              >
                <SelectTrigger id="adm-sim-tipo-doc" className="w-full">
                  <SelectValue placeholder="Automático" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__auto__">Automático (nome do arquivo e título)</SelectItem>
                  <SelectItem value="acordo_compensacao">Acordo de compensação de horas</SelectItem>
                  <SelectItem value="contrato_experiencia_prorrogacao">Contrato experiência / prorrogação</SelectItem>
                  <SelectItem value="solicitacao_vale_transporte">Solicitação vale transporte</SelectItem>
                  <SelectItem value="termo_responsabilidade">Termo de responsabilidade</SelectItem>
                  <SelectItem value="ficha_entrega_epis">Ficha de entrega de EPIs (IRBANA)</SelectItem>
                  <SelectItem value="ficha_registro_empregado">Ficha de registro de empregado (2.ª página)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label>Assinatura</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Desenhe como no aplicativo ou envie PNG/JPG.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setAssinarPadOpen(true)}>
                  <FileSignature className="w-4 h-4 mr-2" />
                  Desenhar assinatura
                </Button>
              </div>
              {assinarAssinaturaDataUrl && (
                <div className="flex items-center gap-3 flex-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assinarAssinaturaDataUrl}
                    alt="Prévia da assinatura"
                    className="h-14 max-w-[200px] object-contain border rounded bg-white p-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setAssinarAssinaturaDataUrl(null)}>
                    Remover
                  </Button>
                </div>
              )}
              <div>
                <Label htmlFor="adm-sim-ass-img" className="text-muted-foreground">
                  Ou enviar imagem (PNG/JPG)
                </Label>
                <Input
                  id="adm-sim-ass-img"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="mt-1"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setAssinarAssinaturaImg(f)
                    if (f) setAssinarAssinaturaDataUrl(null)
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void gerarPreviaAssinaturaAdmissional()}
                disabled={assinarLoadingPrev || assinarLoadingPdf || !assinarPdf}
              >
                {assinarLoadingPrev ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando…
                  </>
                ) : (
                  "Gerar prévia"
                )}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => void registrarAssinaturaAdmissional()}
                disabled={assinarSalvando || assinarLoadingPdf}
              >
                {assinarSalvando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registrando…
                  </>
                ) : (
                  "Registrar assinatura"
                )}
              </Button>
            </div>
            {assinarPreviewUrl && (
              <div className="border rounded-md overflow-hidden bg-muted/30 min-h-[320px]">
                <iframe
                  title="Prévia PDF com assinatura"
                  src={assinarPreviewUrl}
                  className="w-full h-[min(60vh,480px)]"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assinarPadOpen} onOpenChange={setAssinarPadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Desenhar assinatura</DialogTitle>
            <DialogDescription>Depois volte e clique em «Gerar prévia».</DialogDescription>
          </DialogHeader>
          <SignaturePad
            compact
            compactDense
            applyLabel="Usar esta assinatura"
            onSave={(dataUrl) => {
              setAssinarAssinaturaDataUrl(dataUrl)
              setAssinarAssinaturaImg(null)
              setAssinarPadOpen(false)
              toast({
                title: "Assinatura capturada",
                description: "Gere a prévia do PDF para conferir o posicionamento.",
              })
            }}
            onCancel={() => setAssinarPadOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

