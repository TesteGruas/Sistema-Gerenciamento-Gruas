"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SignaturePad } from "@/components/signature-pad"
import { Download, CheckCircle2, Clock, Loader2, ArrowLeft, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colaboradoresDocumentosApi, type HoleriteBackend } from "@/lib/api-colaboradores-documentos"

// Interface compatível com o componente
export interface Holerite {
  id: string | number
  colaborador_id: number
  mes_referencia: string // formato YYYY-MM
  arquivo: string
  assinatura_digital?: string
  assinado_por?: number
  assinado_em?: string
}

export default function HoleritesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const colaboradorId = parseInt(params.id as string)

  const [holerites, setHolerites] = useState<Holerite[]>([])
  const [loading, setLoading] = useState(true)
  const [isAssinaturaDialogOpen, setIsAssinaturaDialogOpen] = useState(false)
  const [holeriteSelecionado, setHoleriteSelecionado] = useState<Holerite | null>(null)
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string>('')

  useEffect(() => {
    loadHolerites()
  }, [colaboradorId])

  const loadHolerites = async () => {
    setLoading(true)
    try {
      const response = await colaboradoresDocumentosApi.holerites.listar(colaboradorId)
      if (response.success && response.data) {
        // Converter HoleriteBackend para Holerite
        const holeritesConvertidos: Holerite[] = response.data.map((h: HoleriteBackend) => ({
          id: h.id,
          colaborador_id: h.funcionario_id,
          mes_referencia: h.mes_referencia,
          arquivo: h.arquivo,
          assinatura_digital: h.assinatura_digital,
          assinado_por: h.assinado_por,
          assinado_em: h.assinado_em
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
      const response = await colaboradoresDocumentosApi.holerites.assinar(
        holerite.id.toString(),
        { assinatura_digital: assinaturaDataUrl }
      )
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Holerite assinado com sucesso"
        })
        setIsAssinaturaDialogOpen(false)
        setAssinaturaDataUrl('')
        loadHolerites()
      }
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
      if (holerite.arquivo) {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')
        
        // Tentar obter URL assinada do arquivo
        try {
          const urlResponse = await fetch(
            `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(holerite.arquivo)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          
          if (urlResponse.ok) {
            const urlData = await urlResponse.json()
            window.open(urlData.url || urlData.data?.url || holerite.arquivo, '_blank')
          } else {
            window.open(holerite.arquivo, '_blank')
          }
        } catch {
          window.open(holerite.arquivo, '_blank')
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

  const formatarMesReferencia = (mesReferencia: string): string => {
    const [ano, mes] = mesReferencia.split('-')
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1)
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const isAssinado = (holerite: Holerite): boolean => {
    return !!holerite.assinatura_digital && !!holerite.assinado_em
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/rh/colaboradores/${colaboradorId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Holerites Mensais</h1>
            <p className="text-gray-600 mt-1">
              Gerencie holerites do colaborador
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Holerites</CardTitle>
          <CardDescription>
            {holerites.length} holerite(s) disponível(is)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
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
                      {formatarMesReferencia(holerite.mes_referencia)}
                    </TableCell>
                    <TableCell>
                      {isAssinado(holerite) ? (
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
                      {holerite.assinado_em ? (
                        new Date(holerite.assinado_em).toLocaleDateString('pt-BR')
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
                        {!isAssinado(holerite) && (
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
              Assine digitalmente o holerite de {holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}
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
              description={`Assine digitalmente o holerite de ${holeriteSelecionado && formatarMesReferencia(holeriteSelecionado.mes_referencia)}`}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

