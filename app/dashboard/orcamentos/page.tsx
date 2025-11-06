"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ExportButton } from "@/components/export-button"
import { CardLoader } from "@/components/ui/loader"

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

  useEffect(() => {
    loadOrcamentos()
  }, [])

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
    setIsViewDialogOpen(true)
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/orcamentos/${id}/editar`)
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
                            onClick={() => handleView(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.status === 'rascunho' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item.id)}
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
      {selectedOrcamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Orçamento {selectedOrcamento.numero}</CardTitle>
                  <CardDescription>{selectedOrcamento.obra_nome}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsViewDialogOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Cliente</label>
                  <p className="font-medium">{selectedOrcamento.cliente_nome || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div>{getStatusBadge(selectedOrcamento.status)}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Obra</label>
                  <p className="font-medium">{selectedOrcamento.obra_nome}</p>
                  {selectedOrcamento.obra_endereco && (
                    <p className="text-sm text-gray-600">
                      {selectedOrcamento.obra_endereco}, {selectedOrcamento.obra_cidade} - {selectedOrcamento.obra_estado}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Equipamento</label>
                  <p className="font-medium">{selectedOrcamento.equipamento}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Obra</label>
                  <p className="font-medium">{selectedOrcamento.tipo_obra || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Especificações Técnicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Altura Inicial → Final</label>
                    <p className="font-medium">
                      {selectedOrcamento.altura_inicial || '-'} m → {selectedOrcamento.altura_final || '-'} m
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Comprimento da Lança</label>
                    <p className="font-medium">{selectedOrcamento.comprimento_lanca || '-'} m</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Carga Máxima</label>
                    <p className="font-medium">{selectedOrcamento.carga_maxima || '-'} kg</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Carga na Ponta</label>
                    <p className="font-medium">{selectedOrcamento.carga_ponta || '-'} kg</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Potência Elétrica</label>
                    <p className="font-medium">{selectedOrcamento.potencia_eletrica || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Energia Necessária</label>
                    <p className="font-medium">{selectedOrcamento.energia_necessaria || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Custos Mensais</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Locacao da grua</span>
                    <span className="font-medium">R$ {selectedOrcamento.valor_locacao_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operador</span>
                    <span className="font-medium">R$ {selectedOrcamento.valor_operador.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sinaleiro</span>
                    <span className="font-medium">R$ {selectedOrcamento.valor_sinaleiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manutenção preventiva</span>
                    <span className="font-medium">R$ {selectedOrcamento.valor_manutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Mensal</span>
                    <span>R$ {selectedOrcamento.total_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Prazos e Datas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Prazo de Locação</label>
                    <p className="font-medium">{selectedOrcamento.prazo_locacao_meses} meses</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Início Estimada</label>
                    <p className="font-medium">
                      {selectedOrcamento.data_inicio_estimada 
                        ? new Date(selectedOrcamento.data_inicio_estimada).toLocaleDateString('pt-BR')
                        : '-'}
                      {selectedOrcamento.tolerancia_dias && (
                        <span className="text-sm text-gray-500 ml-2">
                          (±{selectedOrcamento.tolerancia_dias} dias)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrcamento.escopo_incluso && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Escopo Básico Incluso</h3>
                  <p className="text-sm whitespace-pre-line">{selectedOrcamento.escopo_incluso}</p>
                </div>
              )}

              {selectedOrcamento.responsabilidades_cliente && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Responsabilidades do Cliente</h3>
                  <p className="text-sm whitespace-pre-line">{selectedOrcamento.responsabilidades_cliente}</p>
                </div>
              )}

              {selectedOrcamento.condicoes_comerciais && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Condições Comerciais</h3>
                  <p className="text-sm whitespace-pre-line">{selectedOrcamento.condicoes_comerciais}</p>
                </div>
              )}

              {selectedOrcamento.status === 'aprovado' && (
                <div className="border-t pt-4 flex justify-end gap-2">
                  <Button onClick={() => {
                    setIsViewDialogOpen(false)
                    handleCreateObra(selectedOrcamento)
                  }}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Criar Obra a partir deste Orçamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

