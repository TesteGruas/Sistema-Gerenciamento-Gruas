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
import { SignaturePad } from "./signature-pad"
import { Download, Eye, FileText, CheckCircle2, Clock, AlertCircle, Upload, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DocumentoUpload } from "./documento-upload"

export interface Holerite {
  id?: number
  colaborador_id: number
  mes: string
  ano: number
  arquivo_url?: string
  assinado: boolean
  data_assinatura?: string
  assinatura_digital?: string
  created_at?: string
}

interface ColaboradorHoleritesProps {
  colaboradorId: number
  readOnly?: boolean
  isCliente?: boolean
  isFuncionario?: boolean
}

export function ColaboradorHolerites({ colaboradorId, readOnly = false, isCliente = false, isFuncionario = false }: ColaboradorHoleritesProps) {
  const { toast } = useToast()
  const [holerites, setHolerites] = useState<Holerite[]>([])
  const [loading, setLoading] = useState(true)
  const [isAssinaturaDialogOpen, setIsAssinaturaDialogOpen] = useState(false)
  const [holeriteSelecionado, setHoleriteSelecionado] = useState<Holerite | null>(null)
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string>('')
  
  // Estados para upload de holerite
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [arquivoHolerite, setArquivoHolerite] = useState<File | null>(null)
  const [mesReferencia, setMesReferencia] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadHolerites()
  }, [colaboradorId])

  const loadHolerites = async () => {
    setLoading(true)
    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      const response = await colaboradoresDocumentosApi.holerites.listar(colaboradorId)
      if (response.success && response.data) {
        const holeritesConvertidos: Holerite[] = response.data.map((h: any) => ({
          id: h.id,
          colaborador_id: h.funcionario_id,
          mes: h.mes_referencia ? new Date(h.mes_referencia + '-01').toLocaleString('pt-BR', { month: 'long' }) : '',
          ano: h.mes_referencia ? parseInt(h.mes_referencia.split('-')[0]) : new Date().getFullYear(),
          arquivo_url: h.arquivo,
          assinado: !!h.assinatura_digital && !!h.assinado_em,
          data_assinatura: h.assinado_em,
          assinatura_digital: h.assinatura_digital
        }))
        setHolerites(holeritesConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar holerites",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssinar = async (holerite: Holerite) => {
    if (!assinaturaDataUrl) {
      toast({
        title: "Erro",
        description: "Por favor, assine o holerite",
        variant: "destructive"
      })
      return
    }

    try {
      const { colaboradoresDocumentosApi } = await import("@/lib/api-colaboradores-documentos")
      await colaboradoresDocumentosApi.holerites.assinar(
        holerite.id?.toString() || '',
        { assinatura_digital: assinaturaDataUrl }
      )
      
      toast({
        title: "Sucesso",
        description: "Holerite assinado com sucesso"
      })

      setIsAssinaturaDialogOpen(false)
      setAssinaturaDataUrl('')
      loadHolerites()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao assinar holerite",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (holerite: Holerite) => {
    try {
      if (holerite.arquivo_url) {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        
        // Tentar obter URL assinada do arquivo
        try {
          const urlResponse = await fetch(
            `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(holerite.arquivo_url)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          
          if (urlResponse.ok) {
            const urlData = await urlResponse.json()
            window.open(urlData.url || urlData.data?.url || holerite.arquivo_url, '_blank')
          } else {
            window.open(holerite.arquivo_url, '_blank')
          }
        } catch {
          window.open(holerite.arquivo_url, '_blank')
        }
      } else {
        toast({
          title: "Aviso",
          description: "Arquivo do holerite não disponível",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao baixar holerite",
        variant: "destructive"
      })
    }
  }

  // Verificar se o usuário pode assinar (apenas funcionário pode assinar seu próprio holerite)
  const podeAssinar = isFuncionario && !readOnly

  const handleUploadHolerite = async () => {
    if (!arquivoHolerite) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para upload",
        variant: "destructive"
      })
      return
    }

    if (!mesReferencia) {
      toast({
        title: "Erro",
        description: "A data (mês/ano) é obrigatória",
        variant: "destructive"
      })
      return
    }

    // Validar formato do mês (YYYY-MM)
    const mesRegex = /^\d{4}-\d{2}$/
    if (!mesRegex.test(mesReferencia)) {
      toast({
        title: "Erro",
        description: "Formato de data inválido. Use o formato YYYY-MM (ex: 2025-01)",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      // Fazer upload do arquivo primeiro
      const formData = new FormData()
      formData.append('arquivo', arquivoHolerite)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do arquivo')
      }
      
      const uploadResult = await uploadResponse.json()
      const arquivoUrl = uploadResult.data?.caminho || uploadResult.data?.arquivo || uploadResult.caminho || uploadResult.arquivo
      
      // Salvar holerite usando a API de colaboradores-documentos
      const holeriteResponse = await fetch(
        `${apiUrl}/api/colaboradores/${colaboradorId}/holerites`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mes_referencia: mesReferencia,
            arquivo: arquivoUrl
          })
        }
      )
      
      if (!holeriteResponse.ok) {
        const errorData = await holeriteResponse.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Erro ao salvar holerite')
      }
      
      toast({
        title: "Sucesso",
        description: "Holerite enviado com sucesso!",
      })
      
      // Recarregar holerites
      await loadHolerites()
      
      // Fechar dialog e limpar
      setIsUploadDialogOpen(false)
      setArquivoHolerite(null)
      setMesReferencia('')
    } catch (error: any) {
      console.error('Erro ao fazer upload de holerite:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do holerite",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Holerites Mensais</CardTitle>
              <CardDescription>
                {holerites.length} holerite(s) disponível(is)
              </CardDescription>
            </div>
            {!readOnly && (
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                variant="default"
              >
                <Plus className="w-4 h-4 mr-2" />
                Enviar Holerite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : holerites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum holerite disponível
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Assinatura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holerites.map((holerite) => (
                  <TableRow key={holerite.id}>
                    <TableCell className="font-medium capitalize">
                      {holerite.mes} / {holerite.ano}
                    </TableCell>
                    <TableCell>
                      {holerite.assinado ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Assinado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente Assinatura
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {holerite.data_assinatura ? (
                        new Date(holerite.data_assinatura).toLocaleDateString('pt-BR')
                      ) : (
                        <span className="text-gray-400">Não assinado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(holerite)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Baixar
                        </Button>
                        {!holerite.assinado && podeAssinar && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setHoleriteSelecionado(holerite)
                              setIsAssinaturaDialogOpen(true)
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Assinar
                          </Button>
                        )}
                        {holerite.assinado && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Assinado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Assinatura */}
      <Dialog open={isAssinaturaDialogOpen} onOpenChange={setIsAssinaturaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinar Holerite</DialogTitle>
            <DialogDescription>
              Assine digitalmente o holerite de {holeriteSelecionado?.mes} / {holeriteSelecionado?.ano}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <SignaturePad
              onSave={(signature) => {
                setAssinaturaDataUrl(signature)
                if (holeriteSelecionado) {
                  handleAssinar(holeriteSelecionado)
                }
              }}
              onCancel={() => {
                setIsAssinaturaDialogOpen(false)
                setAssinaturaDataUrl('')
              }}
              title="Assinar Holerite"
              description={`Assine digitalmente o holerite de ${holeriteSelecionado?.mes} / ${holeriteSelecionado?.ano}`}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload de Holerite */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Holerite</DialogTitle>
            <DialogDescription>
              Faça upload do holerite em PDF. A data (mês/ano) é obrigatória.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mes-referencia">
                Mês/Ano de Referência <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mes-referencia"
                type="month"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
                required
                className="mt-1"
                placeholder="YYYY-MM"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Selecione o mês e ano de referência do holerite (formato: YYYY-MM)
              </p>
            </div>

            <div>
              <DocumentoUpload
                accept="application/pdf"
                maxSize={10 * 1024 * 1024} // 10MB
                onUpload={(file) => setArquivoHolerite(file)}
                onRemove={() => setArquivoHolerite(null)}
                label="Arquivo do Holerite (PDF)"
                required={true}
                currentFile={arquivoHolerite}
                disabled={uploading}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  setArquivoHolerite(null)
                  setMesReferencia('')
                }}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadHolerite}
                disabled={!arquivoHolerite || !mesReferencia || uploading}
              >
                {uploading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Holerite
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

