"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
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
  Share2,
  FileSignature
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getFuncionarioIdWithFallback } from "@/lib/get-funcionario-id"
import * as pontoApi from "@/lib/api-ponto-eletronico"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  aprovado_por?: number | null
  data_aprovacao?: string | null
  assinatura_digital_path?: string | null
  aprovador?: {
    nome?: string
  } | null
}

export default function PWAEspelhoPontoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [registros, setRegistros] = useState<RegistroPonto[]>([])
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [registroDetalhes, setRegistroDetalhes] = useState<RegistroPonto | null>(null)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)

  // Carregar dados do usuário
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const userData = localStorage.getItem('user_data')
    const userProfile = localStorage.getItem('user_profile')
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        
        // Adicionar dados do profile se existir
        if (userProfile) {
          const parsedProfile = JSON.parse(userProfile)
          parsedUser.profile = parsedProfile
        }
        
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
      
      return
    }

    try {
      setLoading(true)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token não encontrado')
      }
      
      const funcionarioId = await getFuncionarioIdWithFallback(
        user, 
        token, 
        'ID do funcionário não encontrado'
      )
      
      const response = await pontoApi.getRegistros({
        funcionario_id: funcionarioId,
        data_inicio: dataInicio,
        data_fim: dataFim,
        // 🆕 NOVOS FILTROS DISPONÍVEIS:
        // search: 'termo de busca', // Busca textual
        // order_by: 'horas_extras', // Ordenar por campo
        // order_direction: 'desc', // Direção da ordenação
        // status: 'Aprovado', // Filtrar por status
      })
      
      setRegistros((response || []) as RegistroPonto[])
      
    } catch (error: any) {
      console.error("Erro ao carregar registros:", error)
      
    } finally {
      setLoading(false)
    }
  }

  const exportarCSV = () => {
    if (registros.length === 0) {
      
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

    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      
    }
  }

  const exportarPDF = async () => {
    if (registros.length === 0) {
      
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
      doc.text(`Funcionário: ${user?.nome}`, 14, yPos)
      yPos += 6
      doc.text(`Período: ${dataInicio} a ${dataFim}`, 14, yPos)
      yPos += 6

      // Função auxiliar para formatar tipo de dia
      const formatarTipoDia = (tipoDia?: string, isFacultativo?: boolean): string => {
        if (isFacultativo) {
          return 'Facultativo'
        }
        
        const tipoDiaMap: Record<string, string> = {
          'normal': 'Normal',
          'sabado': 'Sábado',
          'domingo': 'Domingo',
          'feriado_nacional': 'Feriado Nacional',
          'feriado_estadual': 'Feriado Estadual',
          'feriado_local': 'Feriado Local'
        }
        
        return tipoDiaMap[tipoDia || 'normal'] || 'Normal'
      }

      // Dados da tabela
      const tableData = registros.map(registro => [
        new Date(registro.data).toLocaleDateString('pt-BR'),
        formatarTipoDia((registro as any).tipo_dia, (registro as any).is_facultativo),
        registro.entrada || '-',
        registro.saida_almoco || '-',
        registro.volta_almoco || '-',
        registro.saida || '-',
        `${registro.horas_trabalhadas?.toFixed(2) || '0.00'}h`,
        `${registro.horas_extras?.toFixed(2) || '0.00'}h`,
        registro.status
      ])

      autoTable(doc, {
        head: [['Data', 'Tipo Dia', 'Entrada', 'Saída Almoço', 'Volta Almoço', 'Saída', 'Horas', 'Extras', 'Status']],
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

      // Assinaturas removidas - não são mais necessárias

      // Adicionar rodapé com informações da empresa
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

      doc.save(`espelho-ponto-${user?.nome}-${dataInicio}-${dataFim}.pdf`)

    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      
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
      case 'Pendente Correção':
      case 'Pendente Correcao':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Pendente Correção</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const totalHoras = registros.reduce((sum, r) => sum + (r.horas_trabalhadas || 0), 0)
  const totalExtras = registros.reduce((sum, r) => sum + (r.horas_extras || 0), 0)

  return (
    <ProtectedRoute permission="ponto_eletronico:visualizar">
      <div className="space-y-4">
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

      {/* Registros - Layout Mobile */}
      {registros.length > 0 && (
        <div className="space-y-4">
          {/* Header com ações */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Registros ({registros.length})
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={compartilhar}>
                <Share2 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={exportarCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button variant="outline" size="sm" onClick={exportarPDF}>
                <FileDown className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>

          {/* Cards de registros */}
          <div className="space-y-3">
            {registros.map((registro) => (
              <Card key={registro.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {new Date(registro.data).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long'
                          })}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(registro.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(registro.status)}
                      {/* Badge de assinatura do gestor/cliente */}
                      {registro.aprovado_por && registro.data_aprovacao ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                          <FileSignature className="w-3 h-3" />
                          <span>Assinado</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-600 flex items-center gap-1">
                          <FileSignature className="w-3 h-3" />
                          <span>Não assinado</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Horários principais */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Entrada</span>
                      </div>
                      <p className="text-lg font-bold text-green-800">
                        {registro.entrada || '--:--'}
                      </p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">Saída</span>
                      </div>
                      <p className="text-lg font-bold text-red-800">
                        {registro.saida || '--:--'}
                      </p>
                    </div>
                  </div>

                  {/* Resumo de horas */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Horas Trabalhadas</p>
                      <p className="text-lg font-bold text-blue-600">
                        {registro.horas_trabalhadas?.toFixed(1) || '0.0'}h
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Horas Extras</p>
                      <p className="text-lg font-bold text-green-600">
                        {registro.horas_extras?.toFixed(1) || '0.0'}h
                      </p>
                    </div>
                  </div>

                  {/* Botão ver detalhes */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setRegistroDetalhes(registro)
                      setShowDetalhesModal(true)
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Ver Detalhes Completos
                  </Button>

                  {(registro.status === 'Pendente Assinatura Funcionário' ||
                    registro.status === 'Pendente Assinatura Funcionario' ||
                    registro.status === 'Pendente Correção' ||
                    registro.status === 'Pendente Correcao') && (
                    <Button
                      className={`w-full mt-2 text-white ${
                        registro.status === 'Pendente Assinatura Funcionário' || registro.status === 'Pendente Assinatura Funcionario'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      onClick={() => router.push(`/pwa/aprovacao-assinatura?id=${registro.id}`)}
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      {registro.status === 'Pendente Assinatura Funcionário' || registro.status === 'Pendente Assinatura Funcionario'
                        ? 'Assinar Registro'
                        : 'Corrigir Horas e Reenviar'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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


      {/* Modal de Detalhes do Registro */}
      <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Detalhes do Registro
            </DialogTitle>
            <DialogDescription>
              {registroDetalhes && new Date(registroDetalhes.data).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </DialogDescription>
          </DialogHeader>
          
          {registroDetalhes && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(registroDetalhes.status)}
              </div>

              {/* Horários detalhados */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Horários</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Entrada</span>
                    </div>
                    <p className="text-lg font-bold text-green-800">
                      {registroDetalhes.entrada || '--:--'}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-700">Saída Almoço</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-800">
                      {registroDetalhes.saida_almoco || '--:--'}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-700">Volta Almoço</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-800">
                      {registroDetalhes.volta_almoco || '--:--'}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-700">Saída</span>
                    </div>
                    <p className="text-lg font-bold text-red-800">
                      {registroDetalhes.saida || '--:--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumo de horas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Resumo de Horas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Horas Trabalhadas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {registroDetalhes.horas_trabalhadas?.toFixed(1) || '0.0'}h
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Horas Extras</p>
                    <p className="text-2xl font-bold text-green-600">
                      {registroDetalhes.horas_extras?.toFixed(1) || '0.0'}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Observações se houver */}
              {registroDetalhes.observacoes && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Observações</h4>
                  <p className="text-sm text-blue-800">{registroDetalhes.observacoes}</p>
                </div>
              )}

              {(registroDetalhes.status === 'Pendente Assinatura Funcionário' ||
                registroDetalhes.status === 'Pendente Assinatura Funcionario' ||
                registroDetalhes.status === 'Pendente Correção' ||
                registroDetalhes.status === 'Pendente Correcao') && (
                <Button
                  className={`w-full text-white ${
                    registroDetalhes.status === 'Pendente Assinatura Funcionário' || registroDetalhes.status === 'Pendente Assinatura Funcionario'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={() => {
                    setShowDetalhesModal(false)
                    router.push(`/pwa/aprovacao-assinatura?id=${registroDetalhes.id}`)
                  }}
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  {registroDetalhes.status === 'Pendente Assinatura Funcionário' || registroDetalhes.status === 'Pendente Assinatura Funcionario'
                    ? 'Assinar Registro'
                    : 'Corrigir Horas e Reenviar'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </ProtectedRoute>
  )
}
