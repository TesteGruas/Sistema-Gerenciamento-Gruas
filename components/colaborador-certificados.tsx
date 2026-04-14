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
import { getApiOrigin, getApiBasePath } from "@/lib/runtime-config"
import { colaboradoresDocumentosApi, type CertificadoBackend } from "@/lib/api-colaboradores-documentos"
import { TIPOS_CERTIFICADOS } from "@/lib/rh-documentos-tipos"
import {
  TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO,
  TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12,
  certificadoTipoParaTipoDocumentoAssinatura,
} from "@/lib/certificado-tipo-documento-assinatura"
import { SignaturePad } from "@/components/signature-pad"

export interface CertificadoColaborador {
  id?: string
  colaborador_id: number
  tipo: string
  nome: string
  data_validade: string
  arquivo?: File | null
  arquivo_url?: string
  alerta_enviado?: boolean
  assinatura_digital?: string
  assinado_em?: string
}

const tiposCertificados: string[] = [...TIPOS_CERTIFICADOS]

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
    tipo: "",
    nome: "",
    data_validade: "",
    arquivo: null as File | null,
  })

  const [assinarOpen, setAssinarOpen] = useState(false)
  const [assinarCert, setAssinarCert] = useState<CertificadoColaborador | null>(null)
  const [assinarPdf, setAssinarPdf] = useState<File | null>(null)
  const [assinarArquivoNome, setAssinarArquivoNome] = useState("certificado.pdf")
  const [assinarTitulo, setAssinarTitulo] = useState("")
  const [assinarTipoDocumentoApi, setAssinarTipoDocumentoApi] = useState(TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO)
  const [assinarAssinaturaDataUrl, setAssinarAssinaturaDataUrl] = useState<string | null>(null)
  const [assinarAssinaturaImg, setAssinarAssinaturaImg] = useState<File | null>(null)
  const [assinarPadOpen, setAssinarPadOpen] = useState(false)
  const [assinarPreviewUrl, setAssinarPreviewUrl] = useState<string | null>(null)
  const [assinarLoadingPdf, setAssinarLoadingPdf] = useState(false)
  const [assinarLoadingPrev, setAssinarLoadingPrev] = useState(false)
  const [assinarSalvando, setAssinarSalvando] = useState(false)

  useEffect(() => {
    loadCertificados()
  }, [colaboradorId])

  const certificadoAssinado = (c: CertificadoColaborador) => Boolean(c.assinatura_digital && c.assinado_em)

  const fecharDialogAssinar = () => {
    setAssinarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setAssinarOpen(false)
    setAssinarCert(null)
    setAssinarPdf(null)
    setAssinarAssinaturaDataUrl(null)
    setAssinarAssinaturaImg(null)
    setAssinarPadOpen(false)
    setAssinarTipoDocumentoApi(TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO)
    setAssinarArquivoNome("certificado.pdf")
    setAssinarTitulo("")
  }

  const abrirAssinarCertificado = async (certificado: CertificadoColaborador) => {
    if (!certificado.id || certificadoAssinado(certificado) || !certificado.arquivo_url) return
    setAssinarCert(certificado)
    setAssinarOpen(true)
    setAssinarLoadingPdf(true)
    setAssinarAssinaturaDataUrl(null)
    setAssinarAssinaturaImg(null)
    setAssinarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setAssinarTipoDocumentoApi(certificadoTipoParaTipoDocumentoAssinatura(certificado.tipo))
    try {
      const blob = await colaboradoresDocumentosApi.certificados.baixar(certificado.id, false)
      const baseNome = `${certificado.tipo}_${certificado.nome}`.replace(/[<>:"/\\|?*]+/g, "_").slice(0, 120)
      const nomeArquivo = baseNome.toLowerCase().endsWith(".pdf") ? baseNome : `${baseNome}.pdf`
      setAssinarPdf(new File([blob], nomeArquivo, { type: "application/pdf" }))
      setAssinarArquivoNome(nomeArquivo)
      setAssinarTitulo(`${certificado.tipo} — ${certificado.nome}`)
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

  const gerarPreviaAssinaturaCertificado = async () => {
    if (!assinarPdf) {
      toast({
        title: "PDF não disponível",
        description: "Aguarde o carregamento do arquivo.",
        variant: "destructive",
      })
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
      fd.append("arquivo_original", assinarArquivoNome || "certificado.pdf")
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
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(err.message || `Erro ${res.status}`)
      }

      const blob = await res.blob()
      setAssinarPreviewUrl(URL.createObjectURL(blob))
      toast({ title: "Prévia gerada", description: "Confira o posicionamento junto ao campo ALUNO." })
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

  const registrarAssinaturaCertificado = async () => {
    if (!assinarCert?.id) return
    let assinatura_digital: string | null = assinarAssinaturaDataUrl
    if (!assinatura_digital && assinarAssinaturaImg) {
      assinatura_digital = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(new Error("Leitura da imagem falhou"))
        r.readAsDataURL(assinarAssinaturaImg)
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
      const response = await colaboradoresDocumentosApi.certificados.assinar(assinarCert.id, {
        assinatura_digital,
      })
      if (response.success) {
        toast({
          title: "Assinatura registrada",
          description: "O download com assinatura usará o campo do aluno no PDF.",
        })
        fecharDialogAssinar()
        await loadCertificados()
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

  const loadCertificados = async () => {
    setLoading(true)
    try {
      const response = await colaboradoresDocumentosApi.certificados.listar(colaboradorId)
      if (response.success && response.data) {
        const certificadosConvertidos: CertificadoColaborador[] = response.data.map((cert: CertificadoBackend) => ({
          id: cert.id,
          colaborador_id: cert.funcionario_id,
          tipo: cert.tipo,
          nome: cert.nome,
          data_validade: cert.data_validade || "",
          arquivo_url: cert.arquivo,
          alerta_enviado: cert.alerta_enviado,
          assinatura_digital: cert.assinatura_digital,
          assinado_em: cert.assinado_em,
        }))
        setCertificados(certificadosConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar certificados",
        variant: "destructive",
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
        arquivo: null,
      })
    } else {
      setEditingCertificado(null)
      setFormData({
        tipo: "",
        nome: "",
        data_validade: "",
        arquivo: null,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCertificado(null)
    setFormData({
      tipo: "",
      nome: "",
      data_validade: "",
      arquivo: null,
    })
  }

  const handleDownload = async (certificado: CertificadoColaborador, comAssinatura: boolean) => {
    if (!certificado.id) return
    if (comAssinatura && !certificadoAssinado(certificado)) {
      toast({
        title: "Sem assinatura",
        description: "Este certificado ainda não foi assinado pelo colaborador.",
        variant: "destructive",
      })
      return
    }
    try {
      const blob = await colaboradoresDocumentosApi.certificados.baixar(certificado.id, comAssinatura)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const base = `${certificado.tipo}_${certificado.nome}`.replace(/[^\w.-]+/g, "_")
      a.download = `${base}${comAssinatura ? "_assinado" : ""}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível baixar."
      toast({
        title: "Erro ao baixar",
        description: msg,
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!formData.tipo || !formData.nome || !formData.data_validade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Tipo, Nome e Data de Validade)",
        variant: "destructive",
      })
      return
    }

    if (!editingCertificado && !formData.arquivo) {
      toast({
        title: "Erro",
        description: "O arquivo do certificado é obrigatório",
        variant: "destructive",
      })
      return
    }

    const dataValidade = new Date(formData.data_validade)
    if (isNaN(dataValidade.getTime())) {
      toast({
        title: "Erro",
        description: "Data de validade inválida",
        variant: "destructive",
      })
      return
    }

    try {
      let arquivoUrl = editingCertificado?.arquivo_url || ""

      if (formData.arquivo) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append("arquivo", formData.arquivo)
          formDataUpload.append("categoria", "certificados")

          const apiUrl = getApiOrigin()
          const token = localStorage.getItem("access_token") || localStorage.getItem("token")

          const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataUpload,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}))
            throw new Error(errorData.message || errorData.error || "Erro ao fazer upload do arquivo")
          }

          const uploadResult = await uploadResponse.json()
          arquivoUrl = uploadResult.data?.arquivo || uploadResult.data?.caminho || uploadResult.arquivo || uploadResult.caminho

          if (!arquivoUrl) {
            throw new Error("URL do arquivo não retornada após upload")
          }
        } catch (uploadError: any) {
          toast({
            title: "Erro",
            description: uploadError.message || "Erro ao fazer upload do arquivo",
            variant: "destructive",
          })
          return
        }
      }

      const certificadoData = {
        tipo: formData.tipo,
        nome: formData.nome,
        data_validade: formData.data_validade,
        arquivo: arquivoUrl,
      }

      if (editingCertificado?.id) {
        await colaboradoresDocumentosApi.certificados.atualizar(editingCertificado.id, certificadoData)
        toast({
          title: "Sucesso",
          description: "Certificado atualizado com sucesso",
        })
      } else {
        await colaboradoresDocumentosApi.certificados.criar(colaboradorId, certificadoData)
        toast({
          title: "Sucesso",
          description: "Certificado criado com sucesso",
        })
      }

      handleCloseDialog()
      await loadCertificados()
    } catch (error: any) {
      console.error("Erro ao salvar certificado:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar certificado",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este certificado?")) return

    try {
      await colaboradoresDocumentosApi.certificados.excluir(id)
      toast({
        title: "Sucesso",
        description: "Certificado excluído com sucesso",
      })
      await loadCertificados()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir certificado",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (certificado: CertificadoColaborador) => {
    const hoje = new Date()
    const dataValidade = new Date(certificado.data_validade)
    const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (dataValidade < hoje) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" /> Vencido
        </Badge>
      )
    } else if (dataValidade <= trintaDias) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" /> Vencendo em{" "}
          {Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))} dias
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Válido
        </Badge>
      )
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
                {certificados.length} certificado(s) cadastrado(s). O colaborador pode assinar no Perfil; o RH pode pré-visualizar e registrar a assinatura aqui (ícone de caneta), posicionada no rótulo «ALUNO» do PDF.
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
            <div className="text-center py-8 text-gray-500">Nenhum certificado cadastrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Assinatura</TableHead>
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
                        {new Date(certificado.data_validade).toLocaleDateString("pt-BR")}
                        {dias >= 0 && dias <= 30 && (
                          <span className="text-xs text-yellow-600 ml-2">({dias} dias)</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(certificado)}</TableCell>
                      <TableCell>
                        {certificadoAssinado(certificado) ? (
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
                          {certificado.arquivo_url && certificado.id && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                title="Baixar PDF original"
                                onClick={() => handleDownload(certificado, false)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {certificadoAssinado(certificado) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  title="Baixar PDF com assinatura"
                                  className="text-emerald-700"
                                  onClick={() => handleDownload(certificado, true)}
                                >
                                  <FileSignature className="w-4 h-4" />
                                </Button>
                              )}
                              {!readOnly && !certificadoAssinado(certificado) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  title="Prévia e registrar assinatura (RH)"
                                  className="text-primary"
                                  disabled={assinarLoadingPdf && assinarCert?.id === certificado.id}
                                  onClick={() => void abrirAssinarCertificado(certificado)}
                                >
                                  {assinarLoadingPdf && assinarCert?.id === certificado.id ? (
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
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(certificado)}>
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

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog()
          } else {
            setIsDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCertificado ? "Editar Certificado" : "Novo Certificado"}</DialogTitle>
            <DialogDescription>Preencha os dados do certificado. Alerta será enviado 30 dias antes do vencimento.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>
                Tipo de Certificado <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
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
              <Button onClick={handleSave}>{editingCertificado ? "Atualizar" : "Criar"} Certificado</Button>
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
              Padrão: rótulo «ALUNO». NR12: 1.ª página junto ao nome do instrutor (ANDERSON); páginas seguintes no canto inferior direito. Gere a prévia e registre quando estiver correto.
              {assinarCert ? ` ${assinarCert.tipo} — ${assinarCert.nome}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {assinarLoadingPdf ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando PDF…
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Arquivo: <span className="font-medium text-foreground">{assinarArquivoNome}</span>
              </p>
            )}
            <div>
              <Label htmlFor="cert-sim-tipo">Regra de posição</Label>
              <Select
                value={assinarTipoDocumentoApi || "__auto__"}
                onValueChange={(v) =>
                  setAssinarTipoDocumentoApi(v === "__auto__" ? "" : v)
                }
              >
                <SelectTrigger id="cert-sim-tipo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_PADRAO}>
                    Certificado padrão (rótulo ALUNO)
                  </SelectItem>
                  <SelectItem value={TIPO_DOCUMENTO_ASSINATURA_CERTIFICADO_NR12}>
                    NR12 — instrutor (1.ª pág.) + canto direito nas demais
                  </SelectItem>
                  <SelectItem value="__auto__">Automático (nome do arquivo)</SelectItem>
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
                <Label htmlFor="cert-sim-img" className="text-muted-foreground">
                  Ou enviar imagem (PNG/JPG)
                </Label>
                <Input
                  id="cert-sim-img"
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
                onClick={() => void gerarPreviaAssinaturaCertificado()}
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
                onClick={() => void registrarAssinaturaCertificado()}
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
            <DialogDescription>Depois clique em «Gerar prévia».</DialogDescription>
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
                description: "Gere a prévia do PDF para conferir o posicionamento no campo ALUNO.",
              })
            }}
            onCancel={() => setAssinarPadOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
