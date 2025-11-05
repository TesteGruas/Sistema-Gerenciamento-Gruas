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
import { Download, Eye, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

  useEffect(() => {
    loadHolerites()
  }, [colaboradorId])

  const loadHolerites = async () => {
    setLoading(true)
    try {
      // TODO: Substituir por chamada real da API
      // const response = await holeritesApi.listar(colaboradorId)
      // setHolerites(response.data)
      
      // Mock temporário
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Gerar holerites mockados para os últimos 12 meses
      const hoje = new Date()
      const mockHolerites: Holerite[] = []
      for (let i = 0; i < 12; i++) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
        mockHolerites.push({
          id: i + 1,
          colaborador_id: colaboradorId,
          mes: data.toLocaleString('pt-BR', { month: 'long' }),
          ano: data.getFullYear(),
          assinado: i < 3, // Últimos 3 meses assinados
          data_assinatura: i < 3 ? new Date(data.getFullYear(), data.getMonth(), 15).toISOString() : undefined
        })
      }
      setHolerites(mockHolerites)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar holerites",
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
      // TODO: Substituir por chamada real da API
      // await holeritesApi.assinar(holerite.id, { assinatura_digital: assinaturaDataUrl })
      
      toast({
        title: "Sucesso",
        description: "Holerite assinado com sucesso"
      })

      setIsAssinaturaDialogOpen(false)
      setAssinaturaDataUrl('')
      loadHolerites()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao assinar holerite",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async (holerite: Holerite) => {
    try {
      // TODO: Implementar download real
      if (holerite.arquivo_url) {
        window.open(holerite.arquivo_url, '_blank')
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
    </div>
  )
}

