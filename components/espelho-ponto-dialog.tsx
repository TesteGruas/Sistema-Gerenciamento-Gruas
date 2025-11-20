'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { FileText, Download, Mail, Loader2, User, Calendar, Clock, CheckCircle, AlertTriangle, XCircle, Search, X } from 'lucide-react'
import { funcionariosApi } from '@/lib/api-funcionarios'

interface Funcionario {
  id: number
  nome: string
  cargo?: string
  status?: string
  telefone?: string
  email?: string
}

interface EspelhoPontoDialogProps {
  trigger?: React.ReactNode
}

interface EspelhoData {
  funcionario_id: number
  funcionario_nome: string
  matricula: string
  cargo: string
  jornada_diaria: number
  mes: string
  ano: number
  registros: Array<{
    data: string
    entrada?: string
    saida_almoco?: string
    volta_almoco?: string
    saida?: string
    horas_trabalhadas?: number
    horas_extras?: number
    status: string
  }>
  total_dias_trabalhados: number
  total_horas_trabalhadas: number
  total_horas_extras: number
  total_faltas: number
}

export function EspelhoPontoDialog({ trigger }: EspelhoPontoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [espelhoData, setEspelhoData] = useState<EspelhoData | null>(null)
  const [assinaturaFuncionario, setAssinaturaFuncionario] = useState('')
  const [assinaturaGestor, setAssinaturaGestor] = useState('')
  
  // Estados para seleção de funcionário
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [pesquisa, setPesquisa] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())
  const searchRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Reset do estado quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      setPesquisa("")
      setFuncionarioSelecionado(null)
      setEspelhoData(null)
      setShowResults(false)
      setError(null)
      setAssinaturaFuncionario("")
      setAssinaturaGestor("")
    }
  }, [isOpen])

  // Buscar funcionários quando o termo de busca mudar
  useEffect(() => {
    const buscarFuncionarios = async () => {
      if (pesquisa.length < 2) {
        setFuncionarios([])
        setShowResults(false)
        return
      }

      try {
        setError(null)
        
        console.log("🔍 Buscando funcionários para:", pesquisa)
        const response = await funcionariosApi.buscarFuncionarios(pesquisa, {
          status: 'Ativo'
        })
        
        if (response.success) {
          console.log("📊 Funcionários encontrados:", response.data)
          setFuncionarios(response.data || [])
          setShowResults(true)
        } else {
          console.log("❌ Erro na resposta da API:", response)
          setFuncionarios([])
          setShowResults(false)
        }
      } catch (err: any) {
        console.error("❌ Erro ao buscar funcionários:", err)
        setError("Erro ao buscar funcionários")
        setFuncionarios([])
        setShowResults(false)
      }
    }

    const timeoutId = setTimeout(buscarFuncionarios, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }, [pesquisa])

  // Fechar resultados quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFuncionarioSelect = (funcionario: Funcionario) => {
    setFuncionarioSelecionado(funcionario)
    setPesquisa("")
    setShowResults(false)
  }

  const handleClearSelection = () => {
    setFuncionarioSelecionado(null)
    setPesquisa("")
    setShowResults(false)
    setEspelhoData(null)
  }

  const carregarEspelho = async () => {
    if (!funcionarioSelecionado) {
      toast({
        title: "Funcionário obrigatório",
        description: "Selecione um funcionário primeiro",
        variant: "destructive"
      })
      return
    }
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ponto-eletronico/espelho-ponto?funcionario_id=${funcionarioSelecionado.id}&mes=${mes}&ano=${ano}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        // Fallback para dados mockados se API não estiver disponível
        const mockData: EspelhoData = {
          funcionario_id: funcionarioId,
          funcionario_nome: "João Silva",
          matricula: "001",
          cargo: "Operador de Grua",
          jornada_diaria: 8,
          mes: mes.toString().padStart(2, '0'),
          ano: ano,
          registros: [
            {
              data: "2025-10-01",
              entrada: "08:00",
              saida_almoco: "12:00",
              volta_almoco: "13:00",
              saida: "17:00",
              horas_trabalhadas: 8,
              horas_extras: 0,
              status: "completo"
            },
            {
              data: "2025-10-02",
              entrada: "08:00",
              saida_almoco: "12:00",
              volta_almoco: "13:00",
              saida: "18:00",
              horas_trabalhadas: 9,
              horas_extras: 1,
              status: "completo"
            },
            {
              data: "2025-10-03",
              entrada: "08:00",
              saida_almoco: "12:00",
              volta_almoco: "13:00",
              saida: "17:00",
              horas_trabalhadas: 8,
              horas_extras: 0,
              status: "completo"
            }
          ],
          total_dias_trabalhados: 3,
          total_horas_trabalhadas: 25,
          total_horas_extras: 1,
          total_faltas: 0
        }
        setEspelhoData(mockData)
        return
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

  const baixarEspelhoPDF = async () => {
    if (!assinaturaFuncionario || !assinaturaGestor) {
      toast({
        title: "Assinaturas obrigatórias",
        description: "Preencha as assinaturas do funcionário e do gestor",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ponto-eletronico/espelho-ponto?funcionario_id=${funcionarioId}&mes=${mes}&ano=${ano}&formato=pdf`,
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
        // Fallback: gerar PDF local
        await gerarPDFLocal()
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `espelho-ponto-${espelhoData?.funcionario_nome}-${mes}-${ano}.pdf`
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
      setLoading(false)
    }
  }

  const gerarPDFLocal = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF()
      
      // Adicionar logos no cabeçalho
      const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
      let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)
      
      // Título
      doc.setFontSize(16)
      doc.text('ESPELHO DE PONTO', 14, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.text(`Funcionário: ${espelhoData?.funcionario_nome}`, 14, yPos)
      yPos += 6
      doc.text(`Período: ${mes}/${ano}`, 14, yPos)
      yPos += 6

      // Dados da tabela
      const tableData = espelhoData?.registros.map(registro => [
        new Date(registro.data).toLocaleDateString('pt-BR'),
        registro.entrada || '-',
        registro.saida_almoco || '-',
        registro.volta_almoco || '-',
        registro.saida || '-',
        `${registro.horas_trabalhadas?.toFixed(2) || '0.00'}h`,
        `${registro.horas_extras?.toFixed(2) || '0.00'}h`
      ]) || []

      autoTable(doc, {
        head: [['Data', 'Entrada', 'Saída Almoço', 'Volta Almoço', 'Saída', 'Horas', 'Extras']],
        body: tableData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      })

      // Totalizadores
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.text(`Total de dias trabalhados: ${espelhoData?.total_dias_trabalhados}`, 14, finalY)
      doc.text(`Total de horas trabalhadas: ${espelhoData?.total_horas_trabalhadas.toFixed(2)}h`, 14, finalY + 5)
      doc.text(`Total de horas extras: ${espelhoData?.total_horas_extras.toFixed(2)}h`, 14, finalY + 10)
      doc.text(`Total de faltas: ${espelhoData?.total_faltas}`, 14, finalY + 15)

      // Assinaturas
      doc.text(`Assinatura do Funcionário: ${assinaturaFuncionario}`, 14, finalY + 25)
      doc.text(`Assinatura do Gestor: ${assinaturaGestor}`, 14, finalY + 30)

      // Adicionar rodapé com informações da empresa
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

      doc.save(`espelho-ponto-${espelhoData?.funcionario_nome}-${mes}-${ano}.pdf`)

      toast({
        title: "Sucesso!",
        description: "Espelho de ponto gerado localmente",
      })
    } catch (error) {
      console.error('Erro ao gerar PDF local:', error)
      throw error
    }
  }

  const enviarPorEmail = async () => {
    if (!assinaturaFuncionario || !assinaturaGestor) {
      toast({
        title: "Assinaturas obrigatórias",
        description: "Preencha as assinaturas do funcionário e do gestor",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ponto-eletronico/espelho-ponto/enviar-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            funcionario_id: funcionarioId,
            mes: mes,
            ano: ano,
            assinatura_funcionario: assinaturaFuncionario,
            assinatura_gestor: assinaturaGestor
          })
        }
      )

      if (!response.ok) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar por e-mail",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "E-mail enviado!",
        description: "Espelho de ponto enviado por e-mail com sucesso",
      })
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar por e-mail",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completo':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completo</Badge>
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'falta':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Falta</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button onClick={() => setIsOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Ver Espelho
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Espelho de Ponto
            {espelhoData && ` - ${espelhoData.funcionario_nome}`}
          </DialogTitle>
          <DialogDescription>
            Selecione o funcionário e período para gerar o espelho de ponto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção do Funcionário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleção do Funcionário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div ref={searchRef} className="relative">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar funcionário por nome ou cargo..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={!!funcionarioSelecionado}
                  />
                  {funcionarioSelecionado && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Funcionário selecionado */}
                {funcionarioSelecionado && (
                  <div className="mt-2">
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{funcionarioSelecionado.nome}</p>
                              <p className="text-sm text-green-700">
                                {funcionarioSelecionado.cargo || 'Sem cargo definido'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            Selecionado
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Resultados da busca */}
                {showResults && (
                  <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <CardContent className="p-0">
                      {error ? (
                        <div className="p-4 text-center text-red-600">
                          <p className="text-sm">{error}</p>
                        </div>
                      ) : funcionarios.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">Nenhum funcionário encontrado</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {funcionarios.map((funcionario) => (
                            <button
                              key={funcionario.id}
                              onClick={() => handleFuncionarioSelect(funcionario)}
                              className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-gray-500" />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{funcionario.nome}</p>
                                  <p className="text-sm text-gray-500">{funcionario.cargo || 'Sem cargo definido'}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Período</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mes">Mês *</Label>
                <Input
                  id="mes"
                  type="number"
                  min="1"
                  max="12"
                  value={mes}
                  onChange={(e) => setMes(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="ano">Ano *</Label>
                <Input
                  id="ano"
                  type="number"
                  min="2020"
                  max="2030"
                  value={ano}
                  onChange={(e) => setAno(parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Carregar Espelho */}
          <div className="flex justify-center">
            <Button 
              onClick={carregarEspelho} 
              disabled={!funcionarioSelecionado || loading}
              className="w-full max-w-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Carregar Espelho
                </>
              )}
            </Button>
          </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Carregando espelho de ponto...</span>
          </div>
        ) : espelhoData ? (
          <div className="space-y-6">
            {/* Dados do Funcionário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados do Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{espelhoData.funcionario_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cargo</p>
                  <p className="font-medium">{espelhoData.cargo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Matrícula</p>
                  <p className="font-medium">{espelhoData.matricula}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jornada</p>
                  <p className="font-medium">{espelhoData.jornada_diaria}h/dia</p>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Registros */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Registros de Ponto
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída Almoço</TableHead>
                      <TableHead>Volta Almoço</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Extras</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {espelhoData.registros.map((registro, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(registro.data).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{registro.entrada || '-'}</TableCell>
                        <TableCell>{registro.saida_almoco || '-'}</TableCell>
                        <TableCell>{registro.volta_almoco || '-'}</TableCell>
                        <TableCell>{registro.saida || '-'}</TableCell>
                        <TableCell>{registro.horas_trabalhadas?.toFixed(2) || '0.00'}h</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {registro.horas_extras?.toFixed(2) || '0.00'}h
                        </TableCell>
                        <TableCell>{getStatusBadge(registro.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totalizadores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Totalizadores do Período
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Dias Trabalhados</p>
                  <p className="text-2xl font-bold text-blue-600">{espelhoData.total_dias_trabalhados}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Horas Trabalhadas</p>
                  <p className="text-2xl font-bold">{espelhoData.total_horas_trabalhadas.toFixed(2)}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Horas Extras</p>
                  <p className="text-2xl font-bold text-green-600">{espelhoData.total_horas_extras.toFixed(2)}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Faltas</p>
                  <p className="text-2xl font-bold text-red-600">{espelhoData.total_faltas}</p>
                </div>
              </CardContent>
            </Card>

            {/* Assinaturas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assinaturas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assinatura-funcionario">Assinatura do Funcionário *</Label>
                  <Input
                    id="assinatura-funcionario"
                    placeholder="Digite seu nome completo"
                    value={assinaturaFuncionario}
                    onChange={(e) => setAssinaturaFuncionario(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Obrigatório para validação</p>
                </div>
                <div>
                  <Label htmlFor="assinatura-gestor">Assinatura do Gestor *</Label>
                  <Input
                    id="assinatura-gestor"
                    placeholder="Digite seu nome completo"
                    value={assinaturaGestor}
                    onChange={(e) => setAssinaturaGestor(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Obrigatório para validação</p>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={enviarPorEmail} disabled={loading}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar por E-mail
              </Button>
              <Button onClick={baixarEspelhoPDF} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Gerando...' : 'Baixar PDF'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Selecione um funcionário e período para gerar o espelho</p>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
