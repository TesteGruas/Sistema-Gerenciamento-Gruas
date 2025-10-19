"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileSpreadsheet,
  FileDown,
  ArrowLeft,
  Loader2,
  Share2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import * as pontoApi from "@/lib/api-ponto-eletronico"

interface RegistroPonto {
  id: string | number
  data: string
  entrada?: string
  saida_almoco?: string
  volta_almoco?: string
  saida?: string
  horas_trabalhadas?: number
  horas_extras?: number
  status: string
}

export default function PWAEspelhoPontoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [registros, setRegistros] = useState<RegistroPonto[]>([])
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [assinaturaFuncionario, setAssinaturaFuncionario] = useState("")
  const [assinaturaGestor, setAssinaturaGestor] = useState("")

  // Carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Definir período padrão (mês atual)
        const hoje = new Date()
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        
        setDataInicio(primeiroDia.toISOString().split('T')[0])
        setDataFim(ultimoDia.toISOString().split('T')[0])
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      }
    }
  }, [])

  const carregarRegistros = async () => {
    if (!user?.id || !dataInicio || !dataFim) {
      toast({
        title: "Campos obrigatórios",
        description: "Período deve ser definido",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await pontoApi.getRegistros({
        funcionario_id: user.id,
        data_inicio: dataInicio,
        data_fim: dataFim
      })
      
      setRegistros((response || []) as RegistroPonto[])
      
      toast({
        title: "Sucesso",
        description: `${response?.length || 0} registros carregados`,
        variant: "default"
      })
    } catch (error: any) {
      console.error("Erro ao carregar registros:", error)
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
      link.setAttribute('download', `espelho-ponto-${user?.nome}-${dataInicio}-${dataFim}.csv`)
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
      
      // Título
      doc.setFontSize(16)
      doc.text('ESPELHO DE PONTO', 14, 22)
      doc.setFontSize(10)
      doc.text(`Funcionário: ${user?.nome}`, 14, 30)
      doc.text(`Período: ${dataInicio} a ${dataFim}`, 14, 35)

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
        startY: 45,
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

      doc.save(`espelho-ponto-${user?.nome}-${dataInicio}-${dataFim}.pdf`)

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

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Espelho de Ponto',
          text: `Espelho de ponto de ${user?.nome} - Período: ${dataInicio} a ${dataFim}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Erro ao compartilhar:', error)
      }
    } else {
      // Fallback para copiar para área de transferência
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copiado!",
        description: "Link copiado para a área de transferência",
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
      case 'Aprovado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>
      case 'Autorizado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Autorizado</Badge>
      case 'Pendente Aprovação':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'Rejeitado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const totalHoras = registros.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0)
  const totalExtras = registros.reduce((sum, r) => sum + (r.horas_extras || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Espelho de Ponto</h1>
          <p className="text-gray-600">Visualize e exporte seus registros</p>
        </div>
      </div>

      {/* Informações do usuário */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.nome || 'Carregando...'}</p>
              <p className="text-sm text-gray-600">{user?.cargo || user?.role || 'Funcionário'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="data-inicio">Data Início</Label>
            <Input
              id="data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="data-fim">Data Fim</Label>
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
          disabled={!dataInicio || !dataFim || loading}
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
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Registros de Ponto ({registros.length})
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={compartilhar}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
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
    </div>
  )
}
