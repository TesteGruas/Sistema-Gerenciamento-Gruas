"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Download,
  Upload,
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
  Share2
} from "lucide-react"
import { ExportButton } from "@/components/export-button"
import { medicoesMensaisApi, MedicaoMensal, MedicaoDocumento } from "@/lib/api-medicoes-mensais"
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
  const [tipoDocumentoUpload, setTipoDocumentoUpload] = useState<'nf_servico' | 'nf_produto' | 'boleto' | null>(null)
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null)
  const [numeroDocumentoUpload, setNumeroDocumentoUpload] = useState("")
  const [uploading, setUploading] = useState(false)
  
  // Estados para envio
  const [isEnviarDialogOpen, setIsEnviarDialogOpen] = useState(false)
  const [emailsEnvio, setEmailsEnvio] = useState<string[]>([""])
  const [telefonesEnvio, setTelefonesEnvio] = useState<string[]>([""])
  const [enviando, setEnviando] = useState(false)

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

  const handleUploadDocumento = (tipo: 'nf_servico' | 'nf_produto' | 'boleto') => {
    if (!medicao) return
    setTipoDocumentoUpload(tipo)
    setIsUploadDialogOpen(true)
    setArquivoUpload(null)
    setNumeroDocumentoUpload("")
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
          numero_documento: numeroDocumentoUpload || null,
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
        setNumeroDocumentoUpload("")
        setTipoDocumentoUpload(null)
        
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

    // Filtrar e-mails e telefones vazios
    const emailsValidos = emailsEnvio.filter(email => email.trim() !== "")
    const telefonesValidos = telefonesEnvio.filter(tel => tel.trim() !== "")

    if (emailsValidos.length === 0 && telefonesValidos.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos um e-mail ou telefone",
        variant: "destructive"
      })
      return
    }

    try {
      setEnviando(true)
      // Enviar para todos os e-mails e telefones
      // Por enquanto, vamos enviar o primeiro e-mail e telefone (a API pode precisar ser ajustada para múltiplos)
      const response = await medicoesMensaisApi.enviar(
        medicao.id, 
        emailsValidos.length > 0 ? emailsValidos[0] : undefined, 
        telefonesValidos.length > 0 ? telefonesValidos[0] : undefined
      )
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição enviada ao cliente com sucesso"
        })
        setIsEnviarDialogOpen(false)
        setEmailsEnvio([""])
        setTelefonesEnvio([""])
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
          <ExportButton
            dados={[medicao]}
            tipo="medicoes"
            nomeArquivo={`medicao-${medicao.numero}`}
            titulo={`Medição ${medicao.numero}`}
            variant="outline"
          />
          <Button
            variant="outline"
            onClick={() => setIsEnviarDialogOpen(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          {medicao.status === 'finalizada' && medicao.status !== 'enviada' && (
            <Button
              variant="default"
              onClick={() => setIsEnviarDialogOpen(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar ao Cliente
            </Button>
          )}
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
                  {['nf_servico', 'nf_produto', 'boleto'].map((tipo) => {
                    const documento = documentos.find(d => d.tipo_documento === tipo)
                    const labels: Record<string, { label: string; icon: any; color: string }> = {
                      nf_servico: { label: 'NF de Serviço', icon: Receipt, color: 'text-blue-600' },
                      nf_produto: { label: 'NF de Produto', icon: FileCheck, color: 'text-green-600' },
                      boleto: { label: 'Boleto', icon: FileText, color: 'text-orange-600' }
                    }
                    const info = labels[tipo]
                    const Icon = info.icon
                    
                    return (
                      <div key={tipo} className={`border rounded-lg p-3 ${documento ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${info.color}`} />
                            <div>
                              <p className="font-semibold text-sm">{info.label}</p>
                              {documento ? (
                                <>
                                  {documento.numero_documento && (
                                    <p className="text-xs text-gray-600">Nº {documento.numero_documento}</p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    Status: {documento.status === 'gerado' ? 'Gerado' : documento.status === 'enviado' ? 'Enviado' : documento.status === 'pago' ? 'Pago' : 'Pendente'}
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
                            variant={documento ? "outline" : "default"}
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleUploadDocumento(tipo as 'nf_servico' | 'nf_produto' | 'boleto')}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            {documento ? 'Substituir' : 'Enviar'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
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
              {tipoDocumentoUpload === 'nf_produto' && 'Enviar Nota Fiscal de Produto'}
              {tipoDocumentoUpload === 'boleto' && 'Enviar Boleto'}
            </DialogTitle>
            <DialogDescription>
              Faça upload do arquivo do documento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="numero_documento" className="text-xs">Número do Documento (opcional)</Label>
              <Input
                id="numero_documento"
                value={numeroDocumentoUpload}
                onChange={(e) => setNumeroDocumentoUpload(e.target.value)}
                placeholder="Ex: 000123"
                className="h-8 text-sm bg-white"
              />
            </div>
            <div>
              <Label htmlFor="arquivo" className="text-xs">Arquivo *</Label>
              <Input
                id="arquivo"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
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
                setNumeroDocumentoUpload("")
                setTipoDocumentoUpload(null)
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
            <DialogTitle>Compartilhar Medição</DialogTitle>
            <DialogDescription>
              Adicione os e-mails e telefones (WhatsApp) para envio das notificações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* E-mails */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>E-mails</Label>
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

            {/* Telefones */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Telefones (WhatsApp)</Label>
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
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEnviarDialogOpen(false)
                setEmailsEnvio([""])
                setTelefonesEnvio([""])
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
    </div>
  )
}

