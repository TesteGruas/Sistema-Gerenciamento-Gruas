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
import { Plus, Edit, Trash2, Download, AlertTriangle, CheckCircle2, Clock, FileSignature } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiBasePath } from "@/lib/runtime-config"
import { caminhoStorageAPartirDoUpload } from "@/lib/caminho-storage-arquivos"
import { TIPOS_DOCUMENTOS_DEMISSAO } from "@/lib/rh-documentos-tipos"

export interface DocumentoDemissao {
  id?: string | number
  colaborador_id: number
  tipo: string
  nome: string
  data: string
  data_validade?: string
  arquivo_url?: string
  assinatura_digital?: string
  assinado_em?: string
}

const tiposDocumentos: string[] = [...TIPOS_DOCUMENTOS_DEMISSAO]

interface ColaboradorDocumentosDemissaoProps {
  colaboradorId: number
  readOnly?: boolean
}

export function ColaboradorDocumentosDemissao({ colaboradorId, readOnly = false }: ColaboradorDocumentosDemissaoProps) {
  const { toast } = useToast()
  const [documentos, setDocumentos] = useState<DocumentoDemissao[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDocumento, setEditingDocumento] = useState<DocumentoDemissao | null>(null)
  const [formData, setFormData] = useState<{
    tipo: string
    nome: string
    data: string
    data_validade: string
    arquivo: File | null
  }>({
    tipo: "",
    nome: "",
    data: "",
    data_validade: "",
    arquivo: null,
  })

  const loadDocumentos = async () => {
    setLoading(true)
    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      const response = await colaboradoresDocumentosApi.documentosDemissao.listar(colaboradorId)
      if (response.success && response.data) {
        const documentosConvertidos: DocumentoDemissao[] = response.data.map((doc: any) => ({
          id: doc.id,
          colaborador_id: doc.funcionario_id,
          tipo: doc.tipo,
          nome: doc.tipo,
          data: doc.created_at || new Date().toISOString(),
          data_validade: doc.data_validade || undefined,
          arquivo_url: doc.arquivo,
          assinatura_digital: doc.assinatura_digital,
          assinado_em: doc.assinado_em,
        }))
        setDocumentos(documentosConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar documentos de demissão",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (documento?: DocumentoDemissao) => {
    if (documento) {
      setEditingDocumento(documento)
      setFormData({
        tipo: documento.tipo,
        nome: documento.nome,
        data: documento.data,
        data_validade: documento.data_validade || "",
        arquivo: null,
      })
    } else {
      setEditingDocumento(null)
      setFormData({
        tipo: "",
        nome: "",
        data: "",
        data_validade: "",
        arquivo: null,
      })
    }
    setIsDialogOpen(true)
  }

  const documentoAssinado = (d: DocumentoDemissao) => Boolean(d.assinatura_digital && d.assinado_em)

  const handleDownloadDocumento = async (documento: DocumentoDemissao, comAssinatura: boolean) => {
    if (!documento.id) return
    if (comAssinatura && !documentoAssinado(documento)) {
      toast({
        title: "Sem assinatura",
        description: "Este documento ainda não foi assinado pelo colaborador.",
        variant: "destructive",
      })
      return
    }
    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      const blob = await colaboradoresDocumentosApi.documentosDemissao.baixar(String(documento.id), comAssinatura)
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
        variant: "destructive",
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
            description: "Este registro não tem arquivo no servidor. Envie o documento novamente ao editar.",
            variant: "destructive",
          })
          return
        }
      }

      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")

      if (editingDocumento && editingDocumento.id) {
        await colaboradoresDocumentosApi.documentosDemissao.atualizar(editingDocumento.id.toString(), {
          tipo: formData.tipo,
          data_validade: formData.data_validade || undefined,
          arquivo: arquivoUrl,
        })
      } else {
        await colaboradoresDocumentosApi.documentosDemissao.criar(colaboradorId, {
          tipo: formData.tipo,
          data_validade: formData.data_validade || undefined,
          arquivo: arquivoUrl,
        })
      }

      toast({
        title: "Sucesso",
        description: editingDocumento ? "Documento atualizado com sucesso" : "Documento criado com sucesso",
      })

      setIsDialogOpen(false)
      loadDocumentos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar documento",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return

    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      await colaboradoresDocumentosApi.documentosDemissao.excluir(id.toString())
      toast({
        title: "Sucesso",
        description: "Documento excluído",
      })
      loadDocumentos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir documento",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (documento: DocumentoDemissao) => {
    if (!documento.data_validade) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Válido
        </Badge>
      )
    }

    const hoje = new Date()
    const dataValidade = new Date(documento.data_validade)
    const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (dataValidade < hoje) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" /> Vencido
        </Badge>
      )
    } else if (dataValidade <= trintaDias) {
      const dias = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" /> Vencendo em {dias} dias
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

  const documentosVencendo = documentos.filter((d) => {
    const dias = diasParaVencimento(d.data_validade)
    return dias !== null && dias >= 0 && dias <= 30
  })

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
      {documentosVencendo.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Atenção: documentos vencendo
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
                            Vence em {dias} dia{dias !== 1 ? "s" : ""} - {new Date(doc.data_validade).toLocaleDateString("pt-BR")}
                          </>
                        )}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(doc)}>
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
              <CardTitle>Documentos de demissão</CardTitle>
              <CardDescription>
                {documentos.length} documento(s). O colaborador pode assinar pelo aplicativo (Perfil), como nos holerites.
              </CardDescription>
            </div>
            {!readOnly && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo documento
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum documento de demissão cadastrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Data de validade</TableHead>
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
                      <TableCell>{new Date(documento.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        {documento.data_validade ? (
                          <>
                            {new Date(documento.data_validade).toLocaleDateString("pt-BR")}
                            {dias !== null && dias >= 0 && dias <= 30 && (
                              <span className="text-xs text-yellow-600 ml-2">({dias} dias)</span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">Não possui</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(documento)}</TableCell>
                      <TableCell>
                        {documentoAssinado(documento) ? (
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
                              {documentoAssinado(documento) && (
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
                            </>
                          )}
                          {!readOnly && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(documento)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDocumento ? "Editar documento" : "Novo documento de demissão"}</DialogTitle>
            <DialogDescription>
              Anexe o PDF ou imagem. A lista de tipos pode ser ajustada quando a documentação oficial for enviada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.tipo || undefined} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
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
                Nome / observação <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex.: rescisão contrato fulano — obra X"
              />
            </div>

            <div>
              <Label>
                Data <span className="text-red-500">*</span>
              </Label>
              <Input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
            </div>

            <div>
              <Label>Data de validade (opcional)</Label>
              <Input
                type="date"
                value={formData.data_validade}
                onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
              />
            </div>

            <div>
              <DocumentoUpload
                accept="application/pdf,image/*"
                maxSize={5 * 1024 * 1024}
                onUpload={(file) => setFormData({ ...formData, arquivo: file })}
                label="Upload do documento"
                required={!editingDocumento}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>{editingDocumento ? "Atualizar" : "Criar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
