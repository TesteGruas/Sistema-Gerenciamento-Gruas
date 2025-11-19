"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  X,
  Trash2,
  Building2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Download,
  Save
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import { ExportButton } from "@/components/export-button"
import { CardLoader } from "@/components/ui/loader"
import { OrcamentoPDFDocument } from "@/components/orcamento-pdf"
import { pdf } from "@react-pdf/renderer"

type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado'

interface Orcamento {
  id: string
  numero: string
  cliente_id?: number
  cliente_nome?: string
  obra_nome: string
  obra_endereco?: string
  obra_cidade?: string
  obra_estado?: string
  tipo_obra?: string
  equipamento: string
  altura_inicial?: number
  altura_final?: number
  comprimento_lanca?: number
  carga_maxima?: number
  carga_ponta?: number
  potencia_eletrica?: string
  energia_necessaria?: string
  valor_locacao_mensal: number
  valor_operador: number
  valor_sinaleiro: number
  valor_manutencao: number
  total_mensal: number
  prazo_locacao_meses: number
  data_inicio_estimada?: string
  tolerancia_dias?: number
  status: StatusOrcamento
  validade_proposta?: string
  condicoes_comerciais?: string
  responsabilidades_cliente?: string
  escopo_incluso?: string
  created_at: string
  updated_at?: string
  aprovado_por?: string
  aprovado_em?: string
  observacoes?: string
}

export default function OrcamentosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<StatusOrcamento | "todos">("todos")
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editedOrcamento, setEditedOrcamento] = useState<Orcamento | null>(null)
  
  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!dadosIniciaisCarregados && !loadingRef.current) {
      loadingRef.current = true
      loadOrcamentos().finally(() => {
        setDadosIniciaisCarregados(true)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIniciaisCarregados])

  const loadOrcamentos = async () => {
    setLoading(true)
    try {
      // TODO: Integrar com API
      const mockData: Orcamento[] = [
        {
          id: '1',
          numero: 'ORC-2025-001',
          cliente_nome: 'Construtora ABC',
          obra_nome: 'Residencial Jardim das Flores',
          obra_endereco: 'Rua das Flores, 123',
          obra_cidade: 'São Paulo',
          obra_estado: 'SP',
          tipo_obra: 'Residencial',
          equipamento: 'Grua Torre / XCMG QTZ40B',
          altura_inicial: 21,
          altura_final: 95,
          comprimento_lanca: 30,
          carga_maxima: 2000,
          carga_ponta: 1300,
          potencia_eletrica: '42 KVA',
          energia_necessaria: '380V',
          valor_locacao_mensal: 31600,
          valor_operador: 10200,
          valor_sinaleiro: 10200,
          valor_manutencao: 3750,
          total_mensal: 55750,
          prazo_locacao_meses: 13,
          data_inicio_estimada: '2025-02-01',
          tolerancia_dias: 15,
          status: 'aprovado',
          created_at: '2025-01-15T10:00:00Z',
          aprovado_por: 'João Silva',
          aprovado_em: '2025-01-20T14:30:00Z'
        },
        {
          id: '2',
          numero: 'ORC-2025-002',
          cliente_nome: 'Empresa XYZ',
          obra_nome: 'Shopping Center Norte',
          obra_endereco: 'Av. Principal, 456',
          obra_cidade: 'São Paulo',
          obra_estado: 'SP',
          tipo_obra: 'Comercial',
          equipamento: 'Grua Torre / Potain MDT 178',
          altura_inicial: 25,
          altura_final: 120,
          comprimento_lanca: 35,
          carga_maxima: 2500,
          carga_ponta: 1500,
          potencia_eletrica: '50 KVA',
          energia_necessaria: '380V',
          valor_locacao_mensal: 38000,
          valor_operador: 10200,
          valor_sinaleiro: 10200,
          valor_manutencao: 4500,
          total_mensal: 62900,
          prazo_locacao_meses: 18,
          data_inicio_estimada: '2025-03-01',
          tolerancia_dias: 15,
          status: 'enviado',
          created_at: '2025-01-20T09:00:00Z'
        },
        {
          id: '3',
          numero: 'ORC-2025-003',
          cliente_nome: 'Construtora DEF',
          obra_nome: 'Condomínio Vista Mar',
          obra_endereco: 'Rua do Mar, 789',
          obra_cidade: 'Rio de Janeiro',
          obra_estado: 'RJ',
          tipo_obra: 'Residencial',
          equipamento: 'Grua Torre / Liebherr 132 EC-H',
          altura_inicial: 20,
          altura_final: 80,
          comprimento_lanca: 28,
          carga_maxima: 1800,
          carga_ponta: 1100,
          potencia_eletrica: '38 KVA',
          energia_necessaria: '380V',
          valor_locacao_mensal: 29000,
          valor_operador: 10200,
          valor_sinaleiro: 10200,
          valor_manutencao: 3500,
          total_mensal: 52900,
          prazo_locacao_meses: 10,
          data_inicio_estimada: '2025-02-15',
          tolerancia_dias: 15,
          status: 'rascunho',
          created_at: '2025-01-22T11:00:00Z'
        }
      ]
      setOrcamentos(mockData)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar orçamentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredOrcamentos = orcamentos.filter(item => {
    const matchesSearch = !searchTerm || 
      item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.obra_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipamento.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filtroStatus === "todos" || item.status === filtroStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: StatusOrcamento) => {
    const configs: Record<StatusOrcamento, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: any; className?: string }> = {
      rascunho: { label: 'Rascunho', variant: 'secondary', icon: FileText },
      enviado: { label: 'Enviado', variant: 'default', icon: Clock },
      aprovado: { label: 'Aprovado', variant: 'default', icon: CheckCircle2, className: 'bg-green-500 text-white' },
      rejeitado: { label: 'Rejeitado', variant: 'destructive', icon: XCircle }
    }
    
    const config = configs[status]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const handleView = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento)
    setEditedOrcamento({ ...orcamento })
    setIsViewDialogOpen(true)
  }

  // Garantir que editedOrcamento está sincronizado quando o dialog abrir
  useEffect(() => {
    if (isViewDialogOpen && selectedOrcamento && !editedOrcamento) {
      setEditedOrcamento({ ...selectedOrcamento })
    }
  }, [isViewDialogOpen, selectedOrcamento, editedOrcamento])

  const handleSaveEdit = () => {
    if (!editedOrcamento) return
    
    // Atualizar na lista
    setOrcamentos(orcamentos.map(item => 
      item.id === editedOrcamento.id ? editedOrcamento : item
    ))
    
    setSelectedOrcamento(editedOrcamento)
    setIsViewDialogOpen(false)
    setEditedOrcamento(null)
    
    toast({
      title: "Sucesso",
      description: "Orçamento atualizado com sucesso",
    })
  }

  const handleCancelEdit = () => {
    setEditedOrcamento(null)
    setIsViewDialogOpen(false)
    setSelectedOrcamento(null)
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/orcamentos/novo?id=${id}`)
  }

  const handleCreateObra = (orcamento: Orcamento) => {
    if (orcamento.status !== 'aprovado') {
      toast({
        title: "Atenção",
        description: "Apenas orçamentos aprovados podem gerar obras",
        variant: "destructive"
      })
      return
    }
    router.push(`/dashboard/orcamentos/${orcamento.id}/criar-obra`)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      setOrcamentos(orcamentos.filter(item => item.id !== id))
      toast({
        title: "Sucesso",
        description: "Orçamento excluído",
      })
    }
  }

  const handleCreate = () => {
    router.push('/dashboard/orcamentos/novo')
  }

  // Função para formatar texto em Title Case (primeira letra maiúscula)
  const formatTitleCase = (text: string | undefined | null): string => {
    if (!text) return '-'
    
    const palavrasMinusculas = ['de', 'da', 'do', 'das', 'dos', 'em', 'e', 'a', 'o', 'para', 'com', 'por']
    
    return text
      .toLowerCase()
      .split(' ')
      .map((palavra, index) => {
        if (index === 0) {
          return palavra.charAt(0).toUpperCase() + palavra.slice(1)
        }
        if (palavrasMinusculas.includes(palavra)) {
          return palavra
        }
        return palavra.charAt(0).toUpperCase() + palavra.slice(1)
      })
      .join(' ')
  }

  // Função para formatar valores monetários (para exibição)
  const formatCurrencyDisplay = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Função para formatar input de moeda (máscara)
  const formatCurrency = (value: string | number): string => {
    // Se for número, converte para string formatada diretamente
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }
    
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    // Se não há números, retorna vazio
    if (!numbers || numbers === '0') return ''
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers) / 100
    
    // Formata como moeda brasileira (sem símbolo R$)
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Função para converter valor formatado para número
  const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanValue) || 0
  }

  // Informações da empresa do hook
  const { empresa, getEnderecoCompleto, getContatoCompleto } = useEmpresa()

  const handleExportPDF = async (orcamento: Orcamento | null) => {
    if (!orcamento) return
    
    try {
      // Usar API do backend para gerar PDF
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/relatorios/orcamentos/${orcamento.id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF')
      }

      // Obter o blob do PDF
      const blob = await response.blob()
      
      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Orcamento-${orcamento.numero}-${orcamento.obra_nome?.replace(/\s+/g, '-') || 'obra'}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Orçamento exportado em PDF com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar orçamento. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos de Obra</h1>
          <p className="text-gray-600 mt-1">
            Gerencie orçamentos que podem ser aprovados para criar obras
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Orçamentos</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os orçamentos de obras
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as StatusOrcamento | "todos")}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="todos">Todos os Status</option>
                <option value="rascunho">Rascunho</option>
                <option value="enviado">Enviado</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CardLoader text="Carregando orçamentos..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Orçamento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrcamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum orçamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrcamentos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">{item.numero}</TableCell>
                      <TableCell>{item.cliente_nome || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.obra_nome}</div>
                          {item.obra_endereco && (
                            <div className="text-xs text-gray-500">
                              {item.obra_endereco}, {item.obra_cidade} - {item.obra_estado}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.equipamento}</TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          R$ {item.total_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.prazo_locacao_meses} meses
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.data_inicio_estimada && (
                          <div className="text-sm">
                            {new Date(item.data_inicio_estimada).toLocaleDateString('pt-BR')}
                            {item.tolerancia_dias && (
                              <div className="text-xs text-gray-500">
                                ±{item.tolerancia_dias} dias
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportPDF(item)}
                            title="Exportar PDF"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(item)}
                            title="Visualizar/Editar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.status === 'rascunho' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item.id)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {item.status === 'aprovado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateObra(item)}
                              className="text-green-600 hover:text-green-700"
                              title="Criar Obra"
                            >
                              <Building2 className="w-4 h-4 mr-1" />
                              Criar Obra
                            </Button>
                          )}
                          {item.status === 'rascunho' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      {isViewDialogOpen && selectedOrcamento && (() => {
        // Garantir que editedOrcamento está sincronizado com selectedOrcamento
        const orcamentoAtual = editedOrcamento || selectedOrcamento
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewDialogOpen(false)
                setSelectedOrcamento(null)
                setEditedOrcamento(null)
              }
            }}
          >
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Orçamento {selectedOrcamento.numero}</CardTitle>
                    <CardDescription>{selectedOrcamento.obra_nome}</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      setSelectedOrcamento(null)
                      setEditedOrcamento(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Identificação Básica */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">Identificação</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Cliente</label>
                      <Input
                        value={orcamentoAtual?.cliente_nome || ''}
                        onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, cliente_nome: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, cliente_nome: e.target.value } : null)}
                        className="text-gray-900 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="h-9 flex items-center">
                        {orcamentoAtual && getStatusBadge(orcamentoAtual.status)}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium text-gray-700">Obra</label>
                      <Input
                        value={orcamentoAtual?.obra_nome || ''}
                        onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, obra_nome: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, obra_nome: e.target.value } : null)}
                        className="text-gray-900 font-medium"
                      />
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Input
                          placeholder="Endereço"
                          value={orcamentoAtual?.obra_endereco || ''}
                          onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, obra_endereco: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, obra_endereco: e.target.value } : null)}
                          className="text-gray-600 text-sm"
                        />
                        <Input
                          placeholder="Cidade"
                          value={orcamentoAtual?.obra_cidade || ''}
                          onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, obra_cidade: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, obra_cidade: e.target.value } : null)}
                          className="text-gray-600 text-sm"
                        />
                        <Input
                          placeholder="Estado"
                          value={orcamentoAtual?.obra_estado || ''}
                          onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, obra_estado: e.target.value.toUpperCase() } : selectedOrcamento ? { ...selectedOrcamento, obra_estado: e.target.value.toUpperCase() } : null)}
                          className="text-gray-600 text-sm"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Equipamento</label>
                      <Input
                        value={orcamentoAtual?.equipamento || ''}
                        onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, equipamento: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, equipamento: e.target.value } : null)}
                        className="text-gray-900 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tipo de Obra</label>
                      <Input
                        value={orcamentoAtual?.tipo_obra || ''}
                        onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, tipo_obra: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, tipo_obra: e.target.value } : null)}
                        className="text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Especificações Técnicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Altura Inicial (m)</label>
                    <Input
                      type="number"
                      value={orcamentoAtual?.altura_inicial || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || undefined
                        setEditedOrcamento(prev => prev ? { ...prev, altura_inicial: valor } : selectedOrcamento ? { ...selectedOrcamento, altura_inicial: valor } : null)
                      }}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 21"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Altura Final (m)</label>
                    <Input
                      type="number"
                      value={orcamentoAtual?.altura_final || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || undefined
                        setEditedOrcamento(prev => prev ? { ...prev, altura_final: valor } : selectedOrcamento ? { ...selectedOrcamento, altura_final: valor } : null)
                      }}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 95"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Comprimento da Lança (m)</label>
                    <Input
                      type="number"
                      value={orcamentoAtual?.comprimento_lanca || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || undefined
                        setEditedOrcamento(prev => prev ? { ...prev, comprimento_lanca: valor } : selectedOrcamento ? { ...selectedOrcamento, comprimento_lanca: valor } : null)
                      }}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Carga Máxima (kg)</label>
                    <Input
                      type="number"
                      value={orcamentoAtual?.carga_maxima || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || undefined
                        setEditedOrcamento(prev => prev ? { ...prev, carga_maxima: valor } : selectedOrcamento ? { ...selectedOrcamento, carga_maxima: valor } : null)
                      }}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Carga na Ponta (kg)</label>
                    <Input
                      type="number"
                      value={orcamentoAtual?.carga_ponta || ''}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || undefined
                        setEditedOrcamento(prev => prev ? { ...prev, carga_ponta: valor } : selectedOrcamento ? { ...selectedOrcamento, carga_ponta: valor } : null)
                      }}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 1300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Potência Elétrica</label>
                    <Input
                      value={orcamentoAtual?.potencia_eletrica || ''}
                      onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, potencia_eletrica: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, potencia_eletrica: e.target.value } : null)}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 42 KVA"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Energia Necessária</label>
                    <Input
                      value={orcamentoAtual?.energia_necessaria || ''}
                      onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, energia_necessaria: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, energia_necessaria: e.target.value } : null)}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 380V"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Custos Mensais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Locação da Grua (R$)</label>
                    <Input
                      type="text"
                      value={orcamentoAtual?.valor_locacao_mensal 
                        ? formatCurrency(orcamentoAtual.valor_locacao_mensal)
                        : ''}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        const valor = parseCurrency(formatted)
                        setEditedOrcamento(prev => {
                          const base = prev || selectedOrcamento
                          if (!base) return null
                          const total = valor + (base.valor_operador || 0) + (base.valor_sinaleiro || 0) + (base.valor_manutencao || 0)
                          return { ...base, valor_locacao_mensal: valor, total_mensal: total }
                        })
                      }}
                      className="text-gray-900 font-semibold"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Operador (R$)</label>
                    <Input
                      type="text"
                      value={orcamentoAtual?.valor_operador 
                        ? formatCurrency(orcamentoAtual.valor_operador)
                        : ''}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        const valor = parseCurrency(formatted)
                        setEditedOrcamento(prev => {
                          const base = prev || selectedOrcamento
                          if (!base) return null
                          const total = (base.valor_locacao_mensal || 0) + valor + (base.valor_sinaleiro || 0) + (base.valor_manutencao || 0)
                          return { ...base, valor_operador: valor, total_mensal: total }
                        })
                      }}
                      className="text-gray-900 font-semibold"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Sinaleiro (R$)</label>
                    <Input
                      type="text"
                      value={orcamentoAtual?.valor_sinaleiro 
                        ? formatCurrency(orcamentoAtual.valor_sinaleiro)
                        : ''}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        const valor = parseCurrency(formatted)
                        setEditedOrcamento(prev => {
                          const base = prev || selectedOrcamento
                          if (!base) return null
                          const total = (base.valor_locacao_mensal || 0) + (base.valor_operador || 0) + valor + (base.valor_manutencao || 0)
                          return { ...base, valor_sinaleiro: valor, total_mensal: total }
                        })
                      }}
                      className="text-gray-900 font-semibold"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Manutenção Preventiva (R$)</label>
                    <Input
                      type="text"
                      value={orcamentoAtual?.valor_manutencao 
                        ? formatCurrency(orcamentoAtual.valor_manutencao)
                        : ''}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        const valor = parseCurrency(formatted)
                        setEditedOrcamento(prev => {
                          const base = prev || selectedOrcamento
                          if (!base) return null
                          const total = (base.valor_locacao_mensal || 0) + (base.valor_operador || 0) + (base.valor_sinaleiro || 0) + valor
                          return { ...base, valor_manutencao: valor, total_mensal: total }
                        })
                      }}
                      className="text-gray-900 font-semibold"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="col-span-2 space-y-2 pt-2 border-t-2 border-gray-300">
                    <label className="text-base font-bold text-gray-900">Total Mensal</label>
                    <Input
                      readOnly
                      value={formatCurrencyDisplay(orcamentoAtual?.total_mensal || 0)}
                      className="bg-blue-50 border-blue-200 text-blue-700 text-lg font-bold cursor-default"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Prazos e Datas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Prazo de Locação (meses)</label>
                    <Input
                      type="number"
                      value={orcamentoAtual?.prazo_locacao_meses || ''}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 0
                        setEditedOrcamento(prev => prev ? { ...prev, prazo_locacao_meses: valor } : selectedOrcamento ? { ...selectedOrcamento, prazo_locacao_meses: valor } : null)
                      }}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 13"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Data de Início Estimada</label>
                    <Input
                      type="date"
                      value={orcamentoAtual?.data_inicio_estimada ? orcamentoAtual.data_inicio_estimada.split('T')[0] : ''}
                      onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, data_inicio_estimada: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, data_inicio_estimada: e.target.value } : null)}
                      className="text-gray-900 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tolerância (± dias)</label>
                    <Input
                      type="number"
                      value={orcamentoAtual?.tolerancia_dias || ''}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || undefined
                        setEditedOrcamento(prev => prev ? { ...prev, tolerancia_dias: valor } : selectedOrcamento ? { ...selectedOrcamento, tolerancia_dias: valor } : null)
                      }}
                      className="text-gray-900 font-medium"
                      placeholder="Ex: 15"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Escopo Básico Incluso</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <Textarea
                    value={orcamentoAtual?.escopo_incluso || ''}
                    onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, escopo_incluso: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, escopo_incluso: e.target.value } : null)}
                    className="bg-blue-50 border-blue-200 text-gray-700 min-h-[100px] resize-none"
                    rows={4}
                    placeholder="Descreva o escopo básico incluso no orçamento..."
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Responsabilidades do Cliente</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <Textarea
                    value={orcamentoAtual?.responsabilidades_cliente || ''}
                    onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, responsabilidades_cliente: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, responsabilidades_cliente: e.target.value } : null)}
                    className="bg-amber-50 border-amber-200 text-gray-700 min-h-[100px] resize-none"
                    rows={4}
                    placeholder="Descreva as responsabilidades do cliente..."
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Condições Comerciais</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <Textarea
                    value={orcamentoAtual?.condicoes_comerciais || ''}
                    onChange={(e) => setEditedOrcamento(prev => prev ? { ...prev, condicoes_comerciais: e.target.value } : selectedOrcamento ? { ...selectedOrcamento, condicoes_comerciais: e.target.value } : null)}
                    className="bg-green-50 border-green-200 text-gray-700 min-h-[100px] resize-none"
                    rows={4}
                    placeholder="Descreva as condições comerciais..."
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => orcamentoAtual && handleExportPDF(orcamentoAtual)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  {orcamentoAtual && orcamentoAtual.status === 'aprovado' && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        handleCancelEdit()
                        handleCreateObra(orcamentoAtual)
                      }}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Criar Obra
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveEdit}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )
      })()}
    </div>
  )
}

