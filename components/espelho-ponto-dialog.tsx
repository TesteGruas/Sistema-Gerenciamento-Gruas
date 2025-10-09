'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Download, Loader2, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EspelhoPontoData {
  funcionario_id: number
  funcionario_nome: string
  matricula: string
  cargo: string
  mes: string
  ano: number
  jornada_diaria: number
  registros: Array<{
    data: string
    entrada?: string
    saida_almoco?: string
    volta_almoco?: string
    saida?: string
    horas_trabalhadas: number
    horas_extras: number
    status: string
  }>
  total_dias_trabalhados: number
  total_horas_trabalhadas: number
  total_horas_extras: number
  total_faltas: number
}

interface EspelhoPontoDialogProps {
  funcionarioId: number
  mes: number
  ano: number
  trigger?: React.ReactNode
}

export function EspelhoPontoDialog({ funcionarioId, mes, ano, trigger }: EspelhoPontoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [espelhoData, setEspelhoData] = useState<EspelhoPontoData | null>(null)
  const [assinaturaFuncionario, setAssinaturaFuncionario] = useState('')
  const [assinaturaGestor, setAssinaturaGestor] = useState('')
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const { toast } = useToast()

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const carregarEspelho = async () => {
    if (!open) return

    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(
        `${apiUrl}/api/ponto-eletronico/espelho-ponto?funcionario_id=${funcionarioId}&mes=${mes}&ano=${ano}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar espelho de ponto')
      }

      const data = await response.json()
      setEspelhoData(data.data)
    } catch (error) {
      console.error('Erro ao carregar espelho:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o espelho de ponto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const baixarPDF = async () => {
    if (!espelhoData) return

    if (!assinaturaFuncionario || !assinaturaGestor) {
      toast({
        title: "Assinaturas obrigatórias",
        description: "Por favor, preencha ambas as assinaturas",
        variant: "destructive"
      })
      return
    }

    try {
      setDownloadingPDF(true)
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(
        `${apiUrl}/api/ponto-eletronico/espelho-ponto?funcionario_id=${funcionarioId}&mes=${mes}&ano=${ano}&formato=pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assinatura_funcionario: assinaturaFuncionario,
            assinatura_gestor: assinaturaGestor
          })
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `espelho-ponto-${espelhoData.funcionario_nome.replace(/\s+/g, '-')}-${mes.toString().padStart(2, '0')}-${ano}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Sucesso!",
        description: "Espelho de ponto baixado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao baixar PDF:', error)
      toast({
        title: "Erro",
        description: "Não foi possível baixar o PDF",
        variant: "destructive"
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const enviarPorEmail = async () => {
    if (!espelhoData) return

    if (!assinaturaFuncionario || !assinaturaGestor) {
      toast({
        title: "Assinaturas obrigatórias",
        description: "Por favor, preencha ambas as assinaturas antes de enviar",
        variant: "destructive"
      })
      return
    }

    try {
      setEnviandoEmail(true)
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

      const response = await fetch(
        `${apiUrl}/api/ponto-eletronico/espelho-ponto/enviar-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            funcionario_id: funcionarioId,
            mes,
            ano,
            assinatura_funcionario: assinaturaFuncionario,
            assinatura_gestor: assinaturaGestor
          })
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao enviar e-mail')
      }

      toast({
        title: "E-mail enviado!",
        description: "O espelho de ponto foi enviado para o e-mail do funcionário",
      })
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar o e-mail",
        variant: "destructive"
      })
    } finally {
      setEnviandoEmail(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completo':
        return 'bg-green-100 text-green-800'
      case 'Pendente Aprovação':
        return 'bg-yellow-100 text-yellow-800'
      case 'Falta':
        return 'bg-red-100 text-red-800'
      case 'Atraso':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) {
        carregarEspelho()
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Espelho de Ponto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Espelho de Ponto {espelhoData && `- ${espelhoData.funcionario_nome}`}
          </DialogTitle>
          <DialogDescription>
            Período: {mesesNomes[mes - 1]}/{ano}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando espelho de ponto...</span>
          </div>
        ) : espelhoData ? (
          <div className="space-y-6">
            {/* Dados do Funcionário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Funcionário</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{espelhoData.funcionario_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Matrícula</p>
                  <p className="font-medium">{espelhoData.matricula}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cargo</p>
                  <p className="font-medium">{espelhoData.cargo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jornada Diária</p>
                  <p className="font-medium">{espelhoData.jornada_diaria}h</p>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Registros */}
            <div>
              <h3 className="font-semibold mb-3">Registros de Ponto do Período</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída Almoço</TableHead>
                      <TableHead>Volta Almoço</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-right">Extras</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {espelhoData.registros.map((registro, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{formatarData(registro.data)}</TableCell>
                        <TableCell>{registro.entrada || '-'}</TableCell>
                        <TableCell>{registro.saida_almoco || '-'}</TableCell>
                        <TableCell>{registro.volta_almoco || '-'}</TableCell>
                        <TableCell>{registro.saida || '-'}</TableCell>
                        <TableCell className="text-right">{registro.horas_trabalhadas?.toFixed(2) || '0.00'}h</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {registro.horas_extras?.toFixed(2) || '0.00'}h
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(registro.status)}`}>
                            {registro.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totalizadores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Totalizadores do Período</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dias Trabalhados</p>
                  <p className="text-3xl font-bold text-blue-600">{espelhoData.total_dias_trabalhados}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Horas Trabalhadas</p>
                  <p className="text-3xl font-bold">{espelhoData.total_horas_trabalhadas?.toFixed(2)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Horas Extras</p>
                  <p className="text-3xl font-bold text-green-600">{espelhoData.total_horas_extras?.toFixed(2)}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Faltas</p>
                  <p className="text-3xl font-bold text-red-600">{espelhoData.total_faltas}</p>
                </div>
              </CardContent>
            </Card>

            {/* Assinaturas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assinaturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assinatura-funcionario">Assinatura do Funcionário *</Label>
                    <Input
                      id="assinatura-funcionario"
                      placeholder="Digite o nome completo"
                      value={assinaturaFuncionario}
                      onChange={(e) => setAssinaturaFuncionario(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ao assinar, você confirma que as informações estão corretas
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="assinatura-gestor">Assinatura do Gestor *</Label>
                    <Input
                      id="assinatura-gestor"
                      placeholder="Digite o nome completo"
                      value={assinaturaGestor}
                      onChange={(e) => setAssinaturaGestor(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Confirma a aprovação dos registros de ponto
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={enviarPorEmail}
                disabled={enviandoEmail || !assinaturaFuncionario || !assinaturaGestor}
              >
                {enviandoEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar por E-mail
                  </>
                )}
              </Button>
              <Button 
                onClick={baixarPDF}
                disabled={downloadingPDF || !assinaturaFuncionario || !assinaturaGestor}
              >
                {downloadingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p>Nenhum dado encontrado para este período</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

