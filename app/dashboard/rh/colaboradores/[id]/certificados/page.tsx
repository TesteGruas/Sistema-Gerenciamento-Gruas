"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Download, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colaboradoresDocumentosApi, type CertificadoBackend } from "@/lib/api-colaboradores-documentos"
import { DocumentoUpload } from "@/components/documento-upload"

// Tipos de certificados (mantido do mock)
export const tiposCertificados = [
  'Ficha de EPI',
  'Ordem de Serviço',
  'NR06',
  'NR11',
  'NR12',
  'NR18',
  'NR35',
  'Certificado de Especificação'
]

// Interface compatível com o componente
export interface Certificado {
  id: string
  colaborador_id: number
  tipo: string
  nome: string
  data_validade: string
  arquivo: string
  alerta_enviado: boolean
}

export default function CertificadosPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const colaboradorId = parseInt(params.id as string)

  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCertificado, setEditingCertificado] = useState<Certificado | null>(null)
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
      const response = await colaboradoresDocumentosApi.certificados.listar(colaboradorId)
      if (response.success && response.data) {
        // Converter CertificadoBackend para Certificado
        const certificadosConvertidos: Certificado[] = response.data.map((cert: CertificadoBackend) => ({
          id: cert.id,
          colaborador_id: cert.funcionario_id,
          tipo: cert.tipo,
          nome: cert.nome,
          data_validade: cert.data_validade || '',
          arquivo: cert.arquivo || '',
          alerta_enviado: cert.alerta_enviado
        }))
        setCertificados(certificadosConvertidos)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar certificados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (certificado?: Certificado) => {
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
      let arquivoUrl = editingCertificado?.arquivo || ''
      
      // Se tiver arquivo novo, fazer upload primeiro
      if (formData.arquivo) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('arquivo', formData.arquivo)
          
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          const uploadResponse = await fetch(`${apiUrl}/api/arquivos/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            arquivoUrl = uploadResult.data?.caminho || uploadResult.data?.arquivo || URL.createObjectURL(formData.arquivo)
          } else {
            // Se falhar, usar URL temporária
            arquivoUrl = URL.createObjectURL(formData.arquivo)
          }
        } catch (uploadError) {
          arquivoUrl = URL.createObjectURL(formData.arquivo)
        }
      }

      if (editingCertificado) {
        const response = await colaboradoresDocumentosApi.certificados.atualizar(
          editingCertificado.id,
          {
            tipo: formData.tipo,
            nome: formData.nome,
            data_validade: formData.data_validade,
            arquivo: arquivoUrl
          }
        )
        
        if (response.success) {
          toast({
            title: "Sucesso",
            description: "Certificado atualizado com sucesso"
          })
        }
      } else {
        const response = await colaboradoresDocumentosApi.certificados.criar(colaboradorId, {
          tipo: formData.tipo,
          nome: formData.nome,
          data_validade: formData.data_validade,
          arquivo: arquivoUrl
        })
        
        if (response.success) {
          toast({
            title: "Sucesso",
            description: "Certificado criado com sucesso"
          })
        }
      }

      setIsDialogOpen(false)
      loadCertificados()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar certificado",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este certificado?")) return

    try {
      await colaboradoresDocumentosApi.certificados.excluir(id)
      toast({
        title: "Sucesso",
        description: "Certificado excluído"
      })
      loadCertificados()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir certificado",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (certificado: Certificado) => {
    const hoje = new Date()
    const dataValidade = new Date(certificado.data_validade)
    const trintaDias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (dataValidade < hoje) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Vencido</Badge>
    } else if (dataValidade <= trintaDias) {
      return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" /> Vencendo</Badge>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificados do Colaborador</h1>
          <p className="text-gray-600 mt-1">
            Gerencie certificados e documentos do colaborador
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Certificado
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Certificados</CardTitle>
          <CardDescription>
            {certificados.length} certificado(s) cadastrado(s)
          </CardDescription>
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
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
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
                            onClick={() => handleDelete(certificado.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
              Preencha os dados do certificado
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

