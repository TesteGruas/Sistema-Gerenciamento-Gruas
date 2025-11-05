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
import { Plus, Edit, Trash2, Download, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface CertificadoColaborador {
  id?: number
  colaborador_id: number
  tipo: string
  nome: string
  data_validade: string
  arquivo?: File | null
  arquivo_url?: string
  alerta_enviado?: boolean
}

const tiposCertificados = [
  'Ficha de EPI',
  'Ordem de Serviço',
  'NR06',
  'NR11',
  'NR12',
  'NR18',
  'NR35',
  'Certificado de Especificação'
]

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
    tipo: '',
    nome: '',
    data_validade: '',
    arquivo: null as File | null
  })

  useEffect(() => {
    loadCertificados()
  }, [colaboradorId])

  const loadCertificados = async () => {
    setLoading(true)
    try {
      // TODO: Substituir por chamada real da API
      // const response = await certificadosApi.listar(colaboradorId)
      // setCertificados(response.data)
      
      // Mock temporário
      await new Promise(resolve => setTimeout(resolve, 500))
      setCertificados([])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar certificados",
        variant: "destructive"
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
        arquivo: null
      })
    } else {
      setEditingCertificado(null)
      setFormData({
        tipo: '',
        nome: '',
        data_validade: '',
        arquivo: null
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.tipo || !formData.nome || !formData.data_validade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      // TODO: Substituir por chamada real da API
      if (editingCertificado?.id) {
        // await certificadosApi.atualizar(editingCertificado.id, formData)
        toast({
          title: "Sucesso",
          description: "Certificado atualizado com sucesso"
        })
      } else {
        // await certificadosApi.criar(colaboradorId, formData)
        toast({
          title: "Sucesso",
          description: "Certificado criado com sucesso"
        })
      }

      setIsDialogOpen(false)
      loadCertificados()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar certificado",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este certificado?")) return

    try {
      // TODO: Substituir por chamada real da API
      // await certificadosApi.excluir(id)
      toast({
        title: "Sucesso",
        description: "Certificado excluído"
      })
      loadCertificados()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir certificado",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (certificado: CertificadoColaborador) => {
    const hoje = new Date()
    const dataValidade = new Date(certificado.data_validade)
    const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (dataValidade < hoje) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Vencido</Badge>
    } else if (dataValidade <= trintaDias) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Vencendo em {Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))} dias</Badge>
    } else {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Válido</Badge>
    }
  }

  const diasParaVencimento = (dataValidade: string): number => {
    const hoje = new Date()
    const vencimento = new Date(dataValidade)
    const diff = vencimento.getTime() - hoje.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const certificadosVencendo = certificados.filter(c => {
    const dias = diasParaVencimento(c.data_validade)
    return dias >= 0 && dias <= 30
  })

  return (
    <div className="space-y-4">
      {/* Alerta de certificados vencendo */}
      {certificadosVencendo.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Atenção: Certificados Vencendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {certificadosVencendo.map((cert) => {
                const dias = diasParaVencimento(cert.data_validade)
                return (
                  <div key={cert.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div>
                      <p className="font-medium">{cert.nome}</p>
                      <p className="text-sm text-gray-600">
                        Vence em {dias} dia{dias !== 1 ? 's' : ''} - {new Date(cert.data_validade).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(cert)}
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
              <CardTitle>Certificados</CardTitle>
              <CardDescription>
                {certificados.length} certificado(s) cadastrado(s)
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
            <div className="text-center py-8 text-gray-500">
              Nenhum certificado cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Validade</TableHead>
                  <TableHead>Status</TableHead>
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
                        {new Date(certificado.data_validade).toLocaleDateString('pt-BR')}
                        {dias >= 0 && dias <= 30 && (
                          <span className="text-xs text-yellow-600 ml-2">
                            ({dias} dias)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(certificado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {certificado.arquivo_url && (
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {!readOnly && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(certificado)}
                              >
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

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCertificado ? 'Editar Certificado' : 'Novo Certificado'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do certificado. Alerta será enviado 30 dias antes do vencimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>
                Tipo de Certificado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
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
                maxSize={5 * 1024 * 1024}
                onUpload={(file) => setFormData({ ...formData, arquivo: file })}
                label="Upload do Certificado"
                required={!editingCertificado}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingCertificado ? 'Atualizar' : 'Criar'} Certificado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

