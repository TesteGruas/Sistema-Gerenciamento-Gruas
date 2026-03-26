"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Download,
  Upload,
  Trash2,
  Receipt,
  FileCheck,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Forklift,
  Plus,
  Edit,
  Link2,
  Copy
} from "lucide-react"
import { medicoesMensaisApi, MedicaoMensal, MedicaoDocumento } from "@/lib/api-medicoes-mensais"

type TipoDocumentoMedicaoUpload = MedicaoDocumento["tipo_documento"]
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function MedicaoDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [medicao, setMedicao] = useState<MedicaoMensal | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentos, setDocumentos] = useState<MedicaoDocumento[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  
  // Estados para upload de documentos
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [tipoDocumentoUpload, setTipoDocumentoUpload] = useState<TipoDocumentoMedicaoUpload | null>(null)
  const [uploadEhAnexoAdicional, setUploadEhAnexoAdicional] = useState(false)
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const tiposArquivoPermitidos = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ]
  const acceptArquivosMedicao = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
  
  // Estados para envio
  const [isEnviarDialogOpen, setIsEnviarDialogOpen] = useState(false)
  const [emailsEnvio, setEmailsEnvio] = useState<string[]>([""])
  const [telefonesEnvio, setTelefonesEnvio] = useState<string[]>([""])
  const [incluirContatosCliente, setIncluirContatosCliente] = useState(true)
  const [enviarContatosExtras, setEnviarContatosExtras] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exportandoPdfCompleto, setExportandoPdfCompleto] = useState(false)
  const [isLinkPublicoDialogOpen, setIsLinkPublicoDialogOpen] = useState(false)
  const [gerandoLinkPublico, setGerandoLinkPublico] = useState(false)
  const [linkPublicoPdf, setLinkPublicoPdf] = useState("")
  const [isAprovarDialogOpen, setIsAprovarDialogOpen] = useState(false)
  const [isRejeitarDialogOpen, setIsRejeitarDialogOpen] = useState(false)
  const [observacoesAprovacao, setObservacoesAprovacao] = useState("")
  const [processandoAprovacao, setProcessandoAprovacao] = useState(false)

  useEffect(() => {
    if (params.id) {
      carregarMedicao(Number(params.id))
    }
  }, [params.id])

  const carregarMedicao = async (id: number) => {
    try {
      setLoading(true)
      const response = await medicoesMensaisApi.obter(id)
      if (response.success && response.data) {
        setMedicao(response.data)
        await carregarDocumentos(id)
      } else {
        toast({
          title: "Erro",
          description: "Medição não encontrada",
          variant: "destructive"
        })
        router.push("/dashboard/medicoes")
      }
    } catch (error: any) {
      console.error("Erro ao carregar medição:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar medição",
        variant: "destructive"
      })
      router.push("/dashboard/medicoes")
    } finally {
      setLoading(false)
    }
  }

  const carregarDocumentos = async (medicaoId: number) => {
    try {
      setLoadingDocumentos(true)
      const response = await medicoesMensaisApi.listarDocumentos(medicaoId)
      if (response.success) {
        setDocumentos(response.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    } finally {
      setLoadingDocumentos(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      finalizada: { label: "Finalizada", variant: "default" },
      cancelada: { label: "Cancelada", variant: "destructive" },
      enviada: { label: "Enviada", variant: "secondary" }
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getAprovacaoBadge = (status: string | null | undefined) => {
    if (!status) return null
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente Aprovação", variant: "outline" },
      aprovada: { label: "Aprovada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const handleUploadDocumento = (tipo: TipoDocumentoMedicaoUpload) => {
    if (!medicao) return
    setUploadEhAnexoAdicional(false)
    setTipoDocumentoUpload(tipo)
    setIsUploadDialogOpen(true)
    setArquivoUpload(null)
  }

  const handleUploadAnexoAdicional = () => {
    if (!medicao) return
    setUploadEhAnexoAdicional(true)
    setTipoDocumentoUpload('medicao_pdf')
    setIsUploadDialogOpen(true)
    setArquivoUpload(null)
  }

  const handleRemoverDocumento = async (documentoId: number) => {
    if (!medicao) return
    const confirmou = window.confirm("Deseja realmente remover este arquivo?")
    if (!confirmou) return

    try {
      setUploading(true)
      const response = await medicoesMensaisApi.removerDocumento(medicao.id, documentoId)
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Arquivo removido com sucesso"
        })
        await carregarDocumentos(medicao.id)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao remover arquivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleConfirmarUpload = async () => {
    if (!medicao || !tipoDocumentoUpload || !arquivoUpload) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para enviar",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      const response = await medicoesMensaisApi.criarDocumento(
        medicao.id,
        {
          tipo_documento: tipoDocumentoUpload,
          numero_documento: medicao.numero || null,
          observacoes: uploadEhAnexoAdicional
            ? `Anexo adicional da medição ${medicao.numero}: ${arquivoUpload.name}`
            : undefined,
          status: 'pendente'
        },
        arquivoUpload
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Documento enviado com sucesso"
        })
        setIsUploadDialogOpen(false)
        setArquivoUpload(null)
        setTipoDocumentoUpload(null)
        setUploadEhAnexoAdicional(false)
        
        // Recarregar documentos
        await carregarDocumentos(medicao.id)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao enviar documento",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleEnviar = async () => {
    if (!medicao) return

    const emailClientePadrao =
      medicao.obras?.clientes?.contato_email ||
      medicao.obras?.clientes?.email ||
      medicao.orcamentos?.clientes?.contato_email ||
      medicao.orcamentos?.clientes?.email ||
      ""
    const telefoneClientePadrao =
      medicao.obras?.clientes?.contato_telefone ||
      medicao.obras?.clientes?.telefone ||
      medicao.orcamentos?.clientes?.contato_telefone ||
      medicao.orcamentos?.clientes?.telefone ||
      ""

    // Filtrar e-mails e telefones extras vazios
    const emailsValidos = enviarContatosExtras
      ? emailsEnvio.map((email) => email.trim()).filter((email) => email !== "")
      : []
    const telefonesValidos = enviarContatosExtras
      ? telefonesEnvio.map((tel) => tel.trim()).filter((tel) => tel !== "")
      : []

    const temContatoPadraoSelecionado = incluirContatosCliente && (emailClientePadrao || telefoneClientePadrao)
    const temContatoExtra = emailsValidos.length > 0 || telefonesValidos.length > 0

    if (!temContatoPadraoSelecionado && !temContatoExtra) {
      toast({
        title: "Atenção",
        description: "Selecione os contatos padrão do cliente ou adicione pelo menos um e-mail/telefone extra",
        variant: "destructive"
      })
      return
    }

    try {
      setEnviando(true)
      const response = await medicoesMensaisApi.enviar(
        medicao.id,
        {
          incluir_contatos_cliente: incluirContatosCliente,
          emails_adicionais: emailsValidos,
          telefones_adicionais: telefonesValidos
        }
      )
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição enviada ao cliente com sucesso"
        })
        setIsEnviarDialogOpen(false)
        setEmailsEnvio([""])
        setTelefonesEnvio([""])
        setIncluirContatosCliente(true)
        setEnviarContatosExtras(false)
        await carregarMedicao(medicao.id)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar medição",
        variant: "destructive"
      })
    } finally {
      setEnviando(false)
    }
  }

  const adicionarEmail = () => {
    setEmailsEnvio([...emailsEnvio, ""])
  }

  const removerEmail = (index: number) => {
    if (emailsEnvio.length > 1) {
      setEmailsEnvio(emailsEnvio.filter((_, i) => i !== index))
    }
  }

  const atualizarEmail = (index: number, valor: string) => {
    const novosEmails = [...emailsEnvio]
    novosEmails[index] = valor
    setEmailsEnvio(novosEmails)
  }

  const adicionarTelefone = () => {
    setTelefonesEnvio([...telefonesEnvio, ""])
  }

  const removerTelefone = (index: number) => {
    if (telefonesEnvio.length > 1) {
      setTelefonesEnvio(telefonesEnvio.filter((_, i) => i !== index))
    }
  }

  const atualizarTelefone = (index: number, valor: string) => {
    const novosTelefones = [...telefonesEnvio]
    novosTelefones[index] = valor
    setTelefonesEnvio(novosTelefones)
  }

  const abrirDialogLinkPublico = async () => {
    if (!medicao) return
    try {
      setGerandoLinkPublico(true)
      const response = await medicoesMensaisApi.gerarLinkPublicoPdf(medicao.id)
      if (response.success && response.data?.url) {
        const origem = typeof window !== 'undefined' ? window.location.origin : ''
        setLinkPublicoPdf(`${origem}${response.data.url}`)
        setIsLinkPublicoDialogOpen(true)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o link público",
        variant: "destructive"
      })
    } finally {
      setGerandoLinkPublico(false)
    }
  }

  const copiarLinkPublico = async () => {
    if (!linkPublicoPdf) return
    try {
      await navigator.clipboard.writeText(linkPublicoPdf)
      toast({
        title: "Link copiado",
        description: "Link público copiado para a área de transferência"
      })
    } catch {
      toast({
        title: "Atenção",
        description: "Não foi possível copiar automaticamente. Copie manualmente.",
        variant: "destructive"
      })
    }
  }

  const exportarPdfCompleto = async () => {
    if (!medicao) return
    try {
      setExportandoPdfCompleto(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/relatorios/medicao/${medicao.id}/pdf-completo`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })

      if (!response.ok) {
        throw new Error(`Falha ao exportar PDF completo (${response.status})`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medicao-completa-${medicao.numero || medicao.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "PDF completo exportado com sucesso"
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível exportar o PDF completo",
        variant: "destructive"
      })
    } finally {
      setExportandoPdfCompleto(false)
    }
  }

  const fecharDialogsAprovacao = () => {
    setIsAprovarDialogOpen(false)
    setIsRejeitarDialogOpen(false)
    setObservacoesAprovacao("")
  }

  const handleAprovarMedicao = async () => {
    if (!medicao) return

    try {
      setProcessandoAprovacao(true)
      const response = await medicoesMensaisApi.aprovar(
        medicao.id,
        'aprovada',
        observacoesAprovacao.trim() || undefined
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição aprovada com sucesso"
        })
        fecharDialogsAprovacao()
        await carregarMedicao(medicao.id)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar medição",
        variant: "destructive"
      })
    } finally {
      setProcessandoAprovacao(false)
    }
  }

  const handleRejeitarMedicao = async () => {
    if (!medicao) return
    if (!observacoesAprovacao.trim()) {
      toast({
        title: "Atenção",
        description: "Informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessandoAprovacao(true)
      const response = await medicoesMensaisApi.aprovar(
        medicao.id,
        'rejeitada',
        observacoesAprovacao.trim()
      )

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição rejeitada"
        })
        fecharDialogsAprovacao()
        await carregarMedicao(medicao.id)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar medição",
        variant: "destructive"
      })
    } finally {
      setProcessandoAprovacao(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando medição...</p>
        </div>
      </div>
    )
  }

  if (!medicao) {
    return null
  }

  const podeAprovarNoDashboard =
    medicao.status === 'enviada' &&
    (!medicao.status_aprovacao || medicao.status_aprovacao === 'pendente')
  const motivoBloqueioAprovacao =
    medicao.status !== 'enviada'
      ? 'A medição precisa estar enviada ao cliente para aprovar/rejeitar.'
      : medicao.status_aprovacao === 'aprovada'
        ? 'Esta medição já foi aprovada.'
        : medicao.status_aprovacao === 'rejeitada'
          ? 'Esta medição já foi rejeitada.'
          : 'Aprovação indisponível no momento.'

  const documentosPdf = documentos.filter((d) => d.tipo_documento === 'medicao_pdf')
  const documentoPrincipalPdf = documentosPdf.find((d) => !(d.observacoes || '').toLowerCase().includes('anexo adicional')) || documentosPdf[0]
  const anexosAdicionais = documentosPdf.filter((d) => d.id !== documentoPrincipalPdf?.id)

  const documentosNfServico = documentos
    .filter((d) => d.tipo_documento === 'nf_servico')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const documentosLocacao = documentos
    .filter((d) => d.tipo_documento === 'nf_locacao' || d.tipo_documento === 'nf_produto')
    .sort((a, b) => {
      const pref = (t: string) => (t === 'nf_locacao' ? 0 : 1)
      const c = pref(a.tipo_documento) - pref(b.tipo_documento)
      if (c !== 0) return c
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const documentoBoletoNfServico =
    documentos.find((d) => d.tipo_documento === 'boleto_nf_servico_1') ||
    documentos.find((d) => d.tipo_documento === 'boleto_nf_servico_2')
  const documentoBoletoLocacao =
    documentos.find((d) => d.tipo_documento === 'boleto_nf_locacao_1') ||
    documentos.find((d) => d.tipo_documento === 'boleto_nf_locacao_2')

  const emailClientePadrao =
    medicao.obras?.clientes?.contato_email ||
    medicao.obras?.clientes?.email ||
    medicao.orcamentos?.clientes?.contato_email ||
    medicao.orcamentos?.clientes?.email ||
    ""
  const telefoneClientePadrao =
    medicao.obras?.clientes?.contato_telefone ||
    medicao.obras?.clientes?.telefone ||
    medicao.orcamentos?.clientes?.contato_telefone ||
    medicao.orcamentos?.clientes?.telefone ||
    ""
  const temContatoClientePadrao = Boolean(emailClientePadrao || telefoneClientePadrao)

  const podeGerarNotaFiscal = medicao.status_aprovacao === "aprovada"
  const motivoBloqueioNotaFiscal = podeGerarNotaFiscal
    ? ""
    : medicao.status_aprovacao === "rejeitada"
      ? "Medição rejeitada — não é possível gerar nota fiscal."
      : "Aprove a medição antes de gerar a nota fiscal."

  const abrirDialogEnviar = () => {
    setIncluirContatosCliente(temContatoClientePadrao)
    setEnviarContatosExtras(false)
    setEmailsEnvio([""])
    setTelefonesEnvio([""])
    setIsEnviarDialogOpen(true)
  }

  const renderDocumentoArquivo = (
    key: string,
    label: string,
    Icon: typeof FileText,
    color: string,
    documento: MedicaoDocumento | undefined,
    tipoUpload: TipoDocumentoMedicaoUpload,
    extras: MedicaoDocumento[] = []
  ) => (
    <div key={key} className={`border rounded-lg p-3 ${documento ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <div>
            <p className="font-semibold text-sm">{label}</p>
            {documento ? (
              <>
                {documento.numero_documento && (
                  <p className="text-xs text-gray-600">Nº {documento.numero_documento}</p>
                )}
                {extras.length > 0 && (
                  <p className="text-xs text-gray-500">{extras.length} anexo(s) adicional(is)</p>
                )}
                <p className="text-xs text-gray-500">
                  Status:{' '}
                  {documento.status === 'gerado'
                    ? 'Gerado'
                    : documento.status === 'enviado'
                      ? 'Enviado'
                      : documento.status === 'pago'
                        ? 'Pago'
                        : 'Pendente'}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">Nenhum arquivo</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {documento?.caminho_arquivo && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => window.open(documento.caminho_arquivo || '', '_blank')}
          >
            <Download className="w-3 h-3 mr-1" />
            Baixar
          </Button>
        )}
        <Button
          variant={documento ? 'outline' : 'default'}
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => handleUploadDocumento(tipoUpload)}
        >
          <Upload className="w-3 h-3 mr-1" />
          {documento ? 'Substituir' : 'Enviar'}
        </Button>
        {documento && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => handleRemoverDocumento(documento.id)}
            disabled={uploading}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Remover
          </Button>
        )}
      </div>
      {extras.length > 0 && (
        <div className="mt-2 space-y-1">
          {extras.map((docExtra, index) => (
            <div key={docExtra.id} className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  Anexo {index + 1}: {docExtra.observacoes || docExtra.numero_documento || `Documento #${docExtra.id}`}
                </p>
              </div>
              {docExtra.caminho_arquivo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.open(docExtra.caminho_arquivo || '', '_blank')}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Abrir
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/medicoes")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medição {medicao.numero}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Período: {medicao.periodo} | Data: {format(new Date(medicao.data_medicao), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(medicao.status)}
          {getAprovacaoBadge(medicao.status_aprovacao)}
          <Button
            variant="default"
            onClick={() => setIsAprovarDialogOpen(true)}
            disabled={!podeAprovarNoDashboard}
            title={!podeAprovarNoDashboard ? motivoBloqueioAprovacao : "Aprovar medição"}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprovar
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsRejeitarDialogOpen(true)}
            disabled={!podeAprovarNoDashboard}
            title={!podeAprovarNoDashboard ? motivoBloqueioAprovacao : "Rejeitar medição"}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Rejeitar
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/medicoes/${medicao.id}/editar`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            disabled={!podeGerarNotaFiscal}
            onClick={() => {
              if (!podeGerarNotaFiscal) return
              try {
                sessionStorage.setItem("sgg_nf_prefill_medicao_id", String(medicao.id))
              } catch {
                /* ignore */
              }
              router.push(`/dashboard/financeiro/notas-fiscais?fromMedicao=${medicao.id}`)
            }}
            title={
              podeGerarNotaFiscal
                ? "Abrir formulário de nota fiscal de saída pré-preenchido (a nota só é criada ao salvar)"
                : motivoBloqueioNotaFiscal
            }
            className={
              podeGerarNotaFiscal
                ? "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                : "opacity-60"
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar nota fiscal
          </Button>
          <Button
            variant="outline"
            onClick={exportarPdfCompleto}
            disabled={exportandoPdfCompleto}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportandoPdfCompleto ? "Exportando..." : "Exportar PDF Completo"}
          </Button>
          <Button
            variant="outline"
            onClick={abrirDialogLinkPublico}
            disabled={gerandoLinkPublico}
          >
            <Link2 className="w-4 h-4 mr-2" />
            {gerandoLinkPublico ? "Gerando..." : "Link Público PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={abrirDialogEnviar}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-3">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Número</Label>
                  <p className="font-semibold">{medicao.numero}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Período</Label>
                  <p>{medicao.periodo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Data da Medição</Label>
                  <p>{format(new Date(medicao.data_medicao), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                {medicao.gruas && (
                  <div>
                    <Label className="text-xs text-gray-500">Grua</Label>
                    <div className="flex items-center gap-2">
                      <Forklift className="w-4 h-4 text-gray-400" />
                      <p>{medicao.gruas.name} {medicao.gruas.modelo && `- ${medicao.gruas.modelo}`}</p>
                    </div>
                  </div>
                )}
                {medicao.obras && (
                  <div>
                    <Label className="text-xs text-gray-500">Obra</Label>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p>{medicao.obras.nome}</p>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-gray-500">Valor Total</Label>
                  <p className="font-semibold text-lg text-primary">{formatCurrency(medicao.valor_total || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Valor Mensal Bruto</Label>
                  <p className="font-semibold">{formatCurrency(medicao.valor_mensal_bruto || 0)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Aditivos</Label>
                  <p className="font-semibold text-green-600">{formatCurrency(medicao.valor_aditivos || 0)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Custos Extras</Label>
                  <p className="font-semibold">{formatCurrency(medicao.valor_custos_extras || 0)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Descontos</Label>
                  <p className="font-semibold text-red-600">{formatCurrency(medicao.valor_descontos || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos Mensais */}
          {medicao.custos_mensais && medicao.custos_mensais.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Custos Mensais</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {medicao.custos_mensais.map((custo, index) => (
                    <div key={index} className="border rounded-lg p-2 bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-semibold text-sm">{custo.descricao}</p>
                          <p className="text-xs text-gray-500">{custo.tipo}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(custo.valor_total || 0)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Valor Mensal:</span> {formatCurrency(custo.valor_mensal || 0)}
                        </div>
                        <div>
                          <span className="font-medium">Qtd. Meses:</span> {custo.quantidade_meses || 0}
                        </div>
                        {custo.observacoes && (
                          <div className="col-span-3">
                            <span className="font-medium">Obs:</span> {custo.observacoes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Status da Medição */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico de Status da Medição</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="border rounded-md p-2 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Criada</p>
                      <p className="text-xs text-gray-500">Registro inicial da medição</p>
                    </div>
                    <p className="text-xs text-gray-600">
                      {medicao.created_at
                        ? format(new Date(medicao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : "-"}
                    </p>
                  </div>
                </div>

                {medicao.data_finalizacao && (
                  <div className="border rounded-md p-2 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Finalizada</p>
                        <p className="text-xs text-gray-500">Medição pronta para envio ao cliente</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        {format(new Date(medicao.data_finalizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {medicao.data_envio && (
                  <div className="border rounded-md p-2 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Enviada ao Cliente</p>
                        <p className="text-xs text-gray-500">Aguardando aprovação/rejeição</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        {format(new Date(medicao.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="border rounded-md p-2 bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Status Atual</p>
                      <div>{getStatusBadge(medicao.status)}</div>
                      <div>{getAprovacaoBadge(medicao.status_aprovacao) || <p className="text-xs text-gray-500">Sem aprovação registrada</p>}</div>
                      {medicao.observacoes_aprovacao && (
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">
                          Observação: {medicao.observacoes_aprovacao}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {medicao.data_aprovacao
                        ? format(new Date(medicao.data_aprovacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : medicao.updated_at
                          ? format(new Date(medicao.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {medicao.observacoes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm whitespace-pre-wrap">{medicao.observacoes}</p>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Documentos */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documentos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {loadingDocumentos ? (
                <div className="text-center py-4">
                  <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Carregando...</p>
                </div>
              ) : (
                <>
                  {/* PDF da medição */}
                  <div
                    className={`border rounded-lg p-3 ${documentoPrincipalPdf ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-sm">PDF da Medição</p>
                          {documentoPrincipalPdf ? (
                            <>
                              {documentoPrincipalPdf.numero_documento && (
                                <p className="text-xs text-gray-600">Nº {documentoPrincipalPdf.numero_documento}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Status:{' '}
                                {documentoPrincipalPdf.status === 'gerado'
                                  ? 'Gerado'
                                  : documentoPrincipalPdf.status === 'enviado'
                                    ? 'Enviado'
                                    : documentoPrincipalPdf.status === 'pago'
                                      ? 'Pago'
                                      : 'Pendente'}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">Nenhum arquivo</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {documentoPrincipalPdf?.caminho_arquivo && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => window.open(documentoPrincipalPdf.caminho_arquivo || '', '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Baixar
                        </Button>
                      )}
                      <Button
                        variant={documentoPrincipalPdf ? 'outline' : 'default'}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleUploadDocumento('medicao_pdf')}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        {documentoPrincipalPdf ? 'Substituir' : 'Enviar'}
                      </Button>
                      {documentoPrincipalPdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleRemoverDocumento(documentoPrincipalPdf.id)}
                          disabled={uploading}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>

                  {renderDocumentoArquivo(
                    'nf_servico',
                    'NF de Serviço',
                    Receipt,
                    'text-blue-600',
                    documentosNfServico[0],
                    'nf_servico',
                    documentosNfServico.slice(1)
                  )}
                  {renderDocumentoArquivo(
                    'boleto_nf_servico',
                    'Boleto (NF Serviço)',
                    FileText,
                    'text-orange-600',
                    documentoBoletoNfServico,
                    'boleto_nf_servico_1',
                    []
                  )}
                  {renderDocumentoArquivo(
                    'nf_locacao',
                    'Locação',
                    FileCheck,
                    'text-green-600',
                    documentosLocacao[0],
                    'nf_locacao',
                    documentosLocacao.slice(1)
                  )}
                  {renderDocumentoArquivo(
                    'boleto_nf_locacao',
                    'Boleto (Locação)',
                    FileText,
                    'text-amber-600',
                    documentoBoletoLocacao,
                    'boleto_nf_locacao_1',
                    []
                  )}

                  <div className={`border rounded-lg p-3 ${anexosAdicionais.length > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-sm">Anexos Adicionais</p>
                          {anexosAdicionais.length > 0 ? (
                            <>
                              <p className="text-xs text-gray-600">{anexosAdicionais.length} arquivo(s)</p>
                              <p className="text-xs text-gray-500">Status: Pendente</p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">Nenhum arquivo</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={anexosAdicionais.length > 0 ? "outline" : "default"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={handleUploadAnexoAdicional}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        {anexosAdicionais.length > 0 ? 'Adicionar' : 'Enviar'}
                      </Button>
                    </div>
                    {anexosAdicionais.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {anexosAdicionais.map((docExtra, index) => (
                          <div key={docExtra.id} className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1">
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                Anexo {index + 1}: {docExtra.observacoes || docExtra.numero_documento || `Documento #${docExtra.id}`}
                              </p>
                            </div>
                            {docExtra.caminho_arquivo && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => window.open(docExtra.caminho_arquivo || '', '_blank')}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Abrir
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-red-600 hover:bg-red-50"
                                  onClick={() => handleRemoverDocumento(docExtra.id)}
                                  disabled={uploading}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Remover
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Dialog de Upload de Documento */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {tipoDocumentoUpload === 'nf_servico' && 'Enviar Nota Fiscal de Serviço'}
              {tipoDocumentoUpload === 'nf_locacao' && 'Enviar documento de Locação'}
              {tipoDocumentoUpload === 'boleto_nf_servico_1' && 'Enviar Boleto (NF Serviço)'}
              {tipoDocumentoUpload === 'boleto_nf_locacao_1' && 'Enviar Boleto (Locação)'}
              {tipoDocumentoUpload === 'medicao_pdf' && (uploadEhAnexoAdicional ? 'Enviar Anexo Adicional' : 'Enviar PDF da Medição')}
            </DialogTitle>
            <DialogDescription>
              Faça upload do arquivo do documento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="arquivo" className="text-xs">Arquivo *</Label>
              <Input
                id="arquivo"
                type="file"
                accept={acceptArquivosMedicao}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (!tiposArquivoPermitidos.includes(file.type)) {
                      toast({
                        title: "Erro",
                        description: "Tipo de arquivo não permitido. Use PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG ou GIF.",
                        variant: "destructive"
                      })
                      return
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Erro",
                        description: "Arquivo muito grande. Tamanho máximo: 10MB",
                        variant: "destructive"
                      })
                      return
                    }
                    setArquivoUpload(file)
                  }
                }}
                className="h-8 text-sm bg-white"
              />
              {arquivoUpload && (
                <p className="text-xs text-gray-500 mt-1">
                  Arquivo selecionado: {arquivoUpload.name} ({(arquivoUpload.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false)
                setArquivoUpload(null)
                setTipoDocumentoUpload(null)
                setUploadEhAnexoAdicional(false)
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarUpload}
              disabled={uploading || !arquivoUpload}
            >
              {uploading ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Envio/Compartilhamento */}
      <Dialog open={isEnviarDialogOpen} onOpenChange={setIsEnviarDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar Medição ao Cliente</DialogTitle>
            <DialogDescription>
              Envie para os contatos padrão do cliente e, se quiser, adicione contatos extras.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md border p-3 space-y-2 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm">Contatos padrão do cliente</Label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={incluirContatosCliente}
                    onChange={(e) => setIncluirContatosCliente(e.target.checked)}
                    disabled={!temContatoClientePadrao}
                  />
                  Incluir no envio
                </label>
              </div>
              <p className="text-xs text-gray-600">
                E-mail: {emailClientePadrao || "Não cadastrado"} | WhatsApp: {telefoneClientePadrao || "Não cadastrado"}
              </p>
              {!temContatoClientePadrao && (
                <p className="text-xs text-amber-600">
                  Este cliente não possui contato padrão cadastrado.
                </p>
              )}
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={enviarContatosExtras}
                  onChange={(e) => setEnviarContatosExtras(e.target.checked)}
                />
                Deseja enviar para outro e-mail/telefone além do padrão?
              </label>

              {enviarContatosExtras && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>E-mails adicionais</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarEmail}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {emailsEnvio.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => atualizarEmail(index, e.target.value)}
                            placeholder="email@exemplo.com"
                            className="bg-white flex-1"
                          />
                          {emailsEnvio.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerEmail(index)}
                              className="h-9 w-9 p-0"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Telefones adicionais (WhatsApp)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarTelefone}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {telefonesEnvio.map((telefone, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={telefone}
                            onChange={(e) => atualizarTelefone(index, e.target.value)}
                            placeholder="5511999999999"
                            className="bg-white flex-1"
                          />
                          {telefonesEnvio.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removerTelefone(index)}
                              className="h-9 w-9 p-0"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEnviarDialogOpen(false)
                setEmailsEnvio([""])
                setTelefonesEnvio([""])
                setIncluirContatosCliente(true)
                setEnviarContatosExtras(false)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Aprovar Medição */}
      <Dialog open={isAprovarDialogOpen} onOpenChange={setIsAprovarDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Aprovar medição</DialogTitle>
            <DialogDescription>
              Confirme a aprovação da medição {medicao.numero}. Você pode adicionar uma observação opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="observacoes-aprovacao">Observações (opcional)</Label>
            <Textarea
              id="observacoes-aprovacao"
              value={observacoesAprovacao}
              onChange={(e) => setObservacoesAprovacao(e.target.value)}
              placeholder="Observações da aprovação..."
              className="bg-white min-h-24"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={fecharDialogsAprovacao}
              disabled={processandoAprovacao}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAprovarMedicao}
              disabled={processandoAprovacao}
            >
              {processandoAprovacao ? "Aprovando..." : "Confirmar aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rejeitar Medição */}
      <Dialog open={isRejeitarDialogOpen} onOpenChange={setIsRejeitarDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Rejeitar medição</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição da medição {medicao.numero}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="observacoes-rejeicao">Motivo da rejeição *</Label>
            <Textarea
              id="observacoes-rejeicao"
              value={observacoesAprovacao}
              onChange={(e) => setObservacoesAprovacao(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              className="bg-white min-h-24"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={fecharDialogsAprovacao}
              disabled={processandoAprovacao}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejeitarMedicao}
              disabled={processandoAprovacao}
            >
              {processandoAprovacao ? "Rejeitando..." : "Confirmar rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Link Publico PDF */}
      <Dialog open={isLinkPublicoDialogOpen} onOpenChange={setIsLinkPublicoDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Link Público do PDF da Medição</DialogTitle>
            <DialogDescription>
              Compartilhe este link para acesso público ao PDF principal da medição.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="link-publico-medicao">Link</Label>
            <div className="flex gap-2">
              <Input
                id="link-publico-medicao"
                value={linkPublicoPdf}
                readOnly
                className="bg-white"
              />
              <Button type="button" variant="outline" onClick={copiarLinkPublico}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              O link é temporário e pode expirar automaticamente por segurança.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkPublicoDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


