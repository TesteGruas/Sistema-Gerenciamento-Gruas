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
import { getApiOrigin } from "@/lib/runtime-config"
import { colaboradoresDocumentosApi, type CertificadoBackend } from "@/lib/api-colaboradores-documentos"
import { TIPOS_CERTIFICADOS } from "@/lib/rh-documentos-tipos"

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

  useEffect(() => {
    loadCertificados()
  }, [colaboradorId])

  const certificadoAssinado = (c: CertificadoColaborador) => Boolean(c.assinatura_digital && c.assinado_em)

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
                {certificados.length} certificado(s) cadastrado(s). O colaborador assina pelo aplicativo (Perfil), como nos holerites — inclusive Ficha de EPI e demais tipos abaixo.
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
    </div>
  )
}
