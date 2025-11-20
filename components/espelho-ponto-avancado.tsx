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
import { 
  FileText, 
  Download, 
  Mail, 
  Loader2, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Search,
  X,
  FileSpreadsheet,
  FileDown
} from 'lucide-react'
import { funcionariosApi } from '@/lib/api-funcionarios'
import { apiRegistrosPonto } from '@/lib/api-ponto-eletronico'

interface Funcionario {
  id: number
  nome: string
  cargo?: string
  status?: string
  telefone?: string
  email?: string
}

interface EspelhoPontoAvancadoProps {
  trigger?: React.ReactNode
}

interface RegistroPonto {
  id: number
  funcionario_id: number
  funcionario: {
    id: number
    nome: string
    cargo?: string
  }
  data: string
  entrada?: string
  saida_almoco?: string
  volta_almoco?: string
  saida?: string
  horas_trabalhadas?: number
  horas_extras?: number
  status: string
}

export function EspelhoPontoAvancado({ trigger }: EspelhoPontoAvancadoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [pesquisa, setPesquisa] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registros, setRegistros] = useState<RegistroPonto[]>([])
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [assinaturaFuncionario, setAssinaturaFuncionario] = useState('')
  const [assinaturaGestor, setAssinaturaGestor] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Reset do estado quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      setPesquisa("")
      setFuncionarioSelecionado(null)
      setRegistros([])
      setShowResults(false)
      setError(null)
      setDataInicio("")
      setDataFim("")
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
    setRegistros([])
  }

  const carregarRegistros = async () => {
    if (!funcionarioSelecionado || !dataInicio || !dataFim) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um funcionário e defina o período",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      console.log("🔍 Carregando registros para:", funcionarioSelecionado.nome)
      
      const response = await apiRegistrosPonto.listar({
        funcionario_id: funcionarioSelecionado.id,
        data_inicio: dataInicio,
        data_fim: dataFim,
        limit: 1000
      })
      
      console.log("📊 Registros encontrados:", response.registros)
      setRegistros(response.registros || [])
      
      toast({
        title: "Sucesso",
        description: `${response.registros?.length || 0} registros carregados`,
        variant: "default"
      })
    } catch (error: any) {
      console.error("❌ Erro ao carregar registros:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarCSV = () => {
    if (registros.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Carregue os registros primeiro",
        variant: "destructive"
      })
      return
    }

    try {
      const headers = [
        'Data',
        'Entrada',
        'Saída Almoço',
        'Volta Almoço',
        'Saída',
        'Horas Trabalhadas',
        'Horas Extras',
        'Status'
      ]

      const csvData = registros.map(registro => [
        new Date(registro.data).toLocaleDateString('pt-BR'),
        registro.entrada || '',
        registro.saida_almoco || '',
        registro.volta_almoco || '',
        registro.saida || '',
        registro.horas_trabalhadas?.toFixed(2) || '0.00',
        registro.horas_extras?.toFixed(2) || '0.00',
        registro.status
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `espelho-ponto-${funcionarioSelecionado?.nome}-${dataInicio}-${dataFim}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "CSV exportado!",
        description: "Arquivo CSV baixado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar o CSV",
        variant: "destructive"
      })
    }
  }

  const exportarPDF = async () => {
    if (registros.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Carregue os registros primeiro",
        variant: "destructive"
      })
      return
    }

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
      doc.text(`Funcionário: ${funcionarioSelecionado?.nome}`, 14, yPos)
      yPos += 6
      doc.text(`Período: ${dataInicio} a ${dataFim}`, 14, yPos)
      yPos += 6

      // Dados da tabela
      const tableData = registros.map(registro => [
        new Date(registro.data).toLocaleDateString('pt-BR'),
        registro.entrada || '-',
        registro.saida_almoco || '-',
        registro.volta_almoco || '-',
        registro.saida || '-',
        `${registro.horas_trabalhadas?.toFixed(2) || '0.00'}h`,
        `${registro.horas_extras?.toFixed(2) || '0.00'}h`,
        registro.status
      ])

      autoTable(doc, {
        head: [['Data', 'Entrada', 'Saída Almoço', 'Volta Almoço', 'Saída', 'Horas', 'Extras', 'Status']],
        body: tableData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      })

      // Totalizadores
      const totalHoras = registros.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0)
      const totalExtras = registros.reduce((sum, r) => sum + (r.horas_extras || 0), 0)
      const totalDias = registros.length

      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.text(`Total de dias: ${totalDias}`, 14, finalY)
      doc.text(`Total de horas trabalhadas: ${totalHoras.toFixed(2)}h`, 14, finalY + 5)
      doc.text(`Total de horas extras: ${totalExtras.toFixed(2)}h`, 14, finalY + 10)

      // Assinaturas
      if (assinaturaFuncionario) {
        doc.text(`Assinatura do Funcionário: ${assinaturaFuncionario}`, 14, finalY + 20)
      }
      if (assinaturaGestor) {
        doc.text(`Assinatura do Gestor: ${assinaturaGestor}`, 14, finalY + 25)
      }

      // Adicionar rodapé com informações da empresa
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

      doc.save(`espelho-ponto-${funcionarioSelecionado?.nome}-${dataInicio}-${dataFim}.pdf`)

      toast({
        title: "PDF gerado!",
        description: "Arquivo PDF baixado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive"
      })
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

  const totalHoras = registros.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0)
  const totalExtras = registros.reduce((sum, r) => sum + (r.horas_extras || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button onClick={() => setIsOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Espelho de Ponto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Espelho de Ponto Avançado
          </DialogTitle>
          <DialogDescription>
            Filtre por funcionário e exporte para CSV ou PDF
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
                <Label htmlFor="data-inicio">Data Início *</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="data-fim">Data Fim *</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Carregar Registros */}
          <div className="flex justify-center">
            <Button 
              onClick={carregarRegistros} 
              disabled={!funcionarioSelecionado || !dataInicio || !dataFim || loading}
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
                  Carregar Registros
                </>
              )}
            </Button>
          </div>

          {/* Registros */}
          {registros.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Registros de Ponto ({registros.length})
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportarCSV}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarPDF}>
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      {registros.map((registro) => (
                        <TableRow key={registro.id}>
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
              </CardContent>
            </Card>
          )}

          {/* Totalizadores */}
          {registros.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Totalizadores</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total de Dias</p>
                  <p className="text-2xl font-bold text-blue-600">{registros.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Horas Trabalhadas</p>
                  <p className="text-2xl font-bold">{totalHoras.toFixed(2)}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Horas Extras</p>
                  <p className="text-2xl font-bold text-green-600">{totalExtras.toFixed(2)}h</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assinaturas */}
          {registros.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assinaturas (Opcional)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assinatura-funcionario">Assinatura do Funcionário</Label>
                  <Input
                    id="assinatura-funcionario"
                    placeholder="Digite seu nome completo"
                    value={assinaturaFuncionario}
                    onChange={(e) => setAssinaturaFuncionario(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="assinatura-gestor">Assinatura do Gestor</Label>
                  <Input
                    id="assinatura-gestor"
                    placeholder="Digite seu nome completo"
                    value={assinaturaGestor}
                    onChange={(e) => setAssinaturaGestor(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
