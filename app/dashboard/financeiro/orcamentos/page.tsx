"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  getOrcamentos, 
  createOrcamento, 
  updateOrcamento, 
  deleteOrcamento,
  enviarOrcamento,
  aprovarOrcamento,
  rejeitarOrcamento,
  gerarPDFOrcamento,
  type Orcamento,
  type CreateOrcamentoData,
  type OrcamentoFilters,
  formatarStatusOrcamento,
  formatarTipoOrcamento,
  gerarNumeroOrcamento,
  podeEditarOrcamento,
  podeExcluirOrcamento,
  podeEnviarOrcamento,
  podeAprovarOrcamento,
  podeRejeitarOrcamento
} from "@/lib/api-orcamentos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Check, 
  X, 
  FileText, 
  Download,
  Calendar,
  User,
  DollarSign,
  Filter,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OrcamentosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('list')
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null)
  const [filters, setFilters] = useState<OrcamentoFilters>({
    page: 1,
    limit: 10
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Carregar orçamentos
  const loadOrcamentos = async () => {
    setLoading(true)
    try {
      const response = await getOrcamentos(filters)
      setOrcamentos(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar orçamentos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrcamentos()
  }, [filters])

  // Handlers
  const handleCreateOrcamento = async (data: CreateOrcamentoData) => {
    try {
      await createOrcamento(data)
      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso"
      })
      setIsCreateDialogOpen(false)
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao criar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleUpdateOrcamento = async (data: CreateOrcamentoData) => {
    if (!selectedOrcamento) return
    
    try {
      await updateOrcamento({ id: selectedOrcamento.id, ...data })
      toast({
        title: "Sucesso",
        description: "Orçamento atualizado com sucesso"
      })
      setIsEditDialogOpen(false)
      setSelectedOrcamento(null)
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleDeleteOrcamento = async (id: number) => {
    try {
      await deleteOrcamento(id)
      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso"
      })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir orçamento",
        variant: "destructive"
      })
    }
  }

  const handleEnviarOrcamento = async (id: number) => {
    try {
      await enviarOrcamento(id)
      toast({
        title: "Sucesso",
        description: "Orçamento enviado com sucesso"
      })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleAprovarOrcamento = async (id: number) => {
    try {
      await aprovarOrcamento(id)
      toast({
        title: "Sucesso",
        description: "Orçamento aprovado com sucesso"
      })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao aprovar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleRejeitarOrcamento = async (id: number, motivo: string) => {
    try {
      await rejeitarOrcamento(id, motivo)
      toast({
        title: "Sucesso",
        description: "Orçamento rejeitado com sucesso"
      })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao rejeitar orçamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao rejeitar orçamento",
        variant: "destructive"
      })
    }
  }

  const handleGerarPDF = async (id: number) => {
    try {
      const response = await gerarPDFOrcamento(id)
      // Aqui você pode implementar o download do PDF
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento)
    setIsEditDialogOpen(true)
  }

  const handleView = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento)
    setActiveTab('view')
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-600">Gestão de orçamentos e propostas comerciais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadOrcamentos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filters.status || ''} 
                onValueChange={(value) => setFilters({ ...filters, status: value || undefined, page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value || undefined, page: 1 })}
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => setFilters({ ...filters, data_fim: e.target.value || undefined, page: 1 })}
              />
            </div>
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar orçamentos..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="view" disabled={!selectedOrcamento}>Visualizar</TabsTrigger>
        </TabsList>

        {/* Lista de Orçamentos */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos ({pagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Carregando orçamentos...</p>
                </div>
              ) : orcamentos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
                  <p className="text-gray-500 mb-4">Comece criando seu primeiro orçamento</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Orçamento
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamentos.map((orcamento) => {
                        const statusInfo = formatarStatusOrcamento(orcamento.status)
                        return (
                          <TableRow key={orcamento.id}>
                            <TableCell className="font-medium">
                              #{orcamento.id.toString().padStart(4, '0')}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{orcamento.clientes?.nome}</p>
                                <p className="text-sm text-gray-500">{orcamento.clientes?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(orcamento.data_orcamento).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              {new Date(orcamento.data_validade).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              {formatarTipoOrcamento(orcamento.tipo_orcamento)}
                            </TableCell>
                            <TableCell className="font-medium">
                              R$ {orcamento.valor_total.toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleView(orcamento)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {podeEditarOrcamento(orcamento.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(orcamento)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                {podeEnviarOrcamento(orcamento.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEnviarOrcamento(orcamento.id)}
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}
                                {podeAprovarOrcamento(orcamento.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAprovarOrcamento(orcamento.id)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGerarPDF(orcamento.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                {podeExcluirOrcamento(orcamento.status) && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteOrcamento(orcamento.id)}
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} orçamentos
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                          disabled={pagination.page === 1}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                          Página {pagination.page} de {pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                          disabled={pagination.page === pagination.pages}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visualizar Orçamento */}
        <TabsContent value="view" className="space-y-4">
          {selectedOrcamento && (
            <OrcamentoView 
              orcamento={selectedOrcamento}
              onBack={() => setActiveTab('list')}
              onEdit={() => handleEdit(selectedOrcamento)}
              onEnviar={() => handleEnviarOrcamento(selectedOrcamento.id)}
              onAprovar={() => handleAprovarOrcamento(selectedOrcamento.id)}
              onRejeitar={(motivo) => handleRejeitarOrcamento(selectedOrcamento.id, motivo)}
              onGerarPDF={() => handleGerarPDF(selectedOrcamento.id)}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Orçamento</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo orçamento
            </DialogDescription>
          </DialogHeader>
          <OrcamentoForm
            onSubmit={handleCreateOrcamento}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Orçamento</DialogTitle>
            <DialogDescription>
              Edite os dados do orçamento
            </DialogDescription>
          </DialogHeader>
          {selectedOrcamento && (
            <OrcamentoForm
              orcamento={selectedOrcamento}
              onSubmit={handleUpdateOrcamento}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedOrcamento(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente de Formulário de Orçamento
function OrcamentoForm({ 
  orcamento, 
  onSubmit, 
  onCancel 
}: { 
  orcamento?: Orcamento
  onSubmit: (data: CreateOrcamentoData) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState<CreateOrcamentoData>({
    cliente_id: orcamento?.cliente_id || 0,
    data_orcamento: orcamento?.data_orcamento || new Date().toISOString().split('T')[0],
    data_validade: orcamento?.data_validade || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    valor_total: orcamento?.valor_total || 0,
    desconto: orcamento?.desconto || 0,
    observacoes: orcamento?.observacoes || '',
    status: orcamento?.status || 'rascunho',
    vendedor_id: orcamento?.vendedor_id || undefined,
    condicoes_pagamento: orcamento?.condicoes_pagamento || '',
    prazo_entrega: orcamento?.prazo_entrega || '',
    tipo_orcamento: orcamento?.tipo_orcamento || 'servico',
    itens: orcamento?.itens || []
  })

  const [itens, setItens] = useState<OrcamentoItem[]>(formData.itens || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calcular valor total dos itens
    const valorTotalItens = itens.reduce((total, item) => total + item.valor_total, 0)
    
    onSubmit({
      ...formData,
      valor_total: valorTotalItens - formData.desconto,
      itens
    })
  }

  const addItem = () => {
    setItens([...itens, {
      produto_servico: '',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      tipo: 'servico',
      unidade: '',
      observacoes: ''
    }])
  }

  const updateItem = (index: number, field: keyof OrcamentoItem, value: any) => {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }
    
    // Recalcular valor total se necessário
    if (field === 'quantidade' || field === 'valor_unitario') {
      newItens[index].valor_total = newItens[index].quantidade * newItens[index].valor_unitario
    }
    
    setItens(newItens)
  }

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Dados Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Select 
            value={formData.cliente_id.toString()} 
            onValueChange={(value) => setFormData({ ...formData, cliente_id: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Cliente Exemplo 1</SelectItem>
              <SelectItem value="2">Cliente Exemplo 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tipo_orcamento">Tipo de Orçamento *</Label>
          <Select 
            value={formData.tipo_orcamento} 
            onValueChange={(value) => setFormData({ ...formData, tipo_orcamento: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipamento">Equipamento</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="locacao">Locação</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="data_orcamento">Data do Orçamento *</Label>
          <Input
            id="data_orcamento"
            type="date"
            value={formData.data_orcamento}
            onChange={(e) => setFormData({ ...formData, data_orcamento: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="data_validade">Data de Validade *</Label>
          <Input
            id="data_validade"
            type="date"
            value={formData.data_validade}
            onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="desconto">Desconto (R$)</Label>
          <Input
            id="desconto"
            type="number"
            step="0.01"
            value={formData.desconto}
            onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="rejeitado">Rejeitado</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Condições e Prazos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
          <Input
            id="condicoes_pagamento"
            value={formData.condicoes_pagamento}
            onChange={(e) => setFormData({ ...formData, condicoes_pagamento: e.target.value })}
            placeholder="Ex: 30 dias, à vista, etc."
          />
        </div>
        <div>
          <Label htmlFor="prazo_entrega">Prazo de Entrega</Label>
          <Input
            id="prazo_entrega"
            value={formData.prazo_entrega}
            onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
            placeholder="Ex: 15 dias úteis"
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
          placeholder="Observações adicionais sobre o orçamento"
        />
      </div>

      {/* Itens do Orçamento */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <Label>Itens do Orçamento</Label>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {itens.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <Label>Produto/Serviço *</Label>
                    <Input
                      value={item.produto_servico}
                      onChange={(e) => updateItem(index, 'produto_servico', e.target.value)}
                      placeholder="Nome do produto/serviço"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={item.descricao}
                      onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      placeholder="Descrição detalhada"
                    />
                  </div>
                  <div>
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Valor Unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_unitario}
                      onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_total}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={item.tipo} 
                      onValueChange={(value) => updateItem(index, 'tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produto">Produto</SelectItem>
                        <SelectItem value="servico">Serviço</SelectItem>
                        <SelectItem value="equipamento">Equipamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input
                      value={item.unidade || ''}
                      onChange={(e) => updateItem(index, 'unidade', e.target.value)}
                      placeholder="Ex: un, kg, m²"
                    />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Input
                      value={item.observacoes || ''}
                      onChange={(e) => updateItem(index, 'observacoes', e.target.value)}
                      placeholder="Observações do item"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {itens.reduce((total, item) => total + item.valor_total, 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto:</span>
              <span>- R$ {formData.desconto.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>R$ {(itens.reduce((total, item) => total + item.valor_total, 0) - formData.desconto).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {orcamento ? 'Atualizar' : 'Criar'} Orçamento
        </Button>
      </div>
    </form>
  )
}

// Componente de Visualização de Orçamento
function OrcamentoView({ 
  orcamento, 
  onBack, 
  onEdit, 
  onEnviar, 
  onAprovar, 
  onRejeitar, 
  onGerarPDF 
}: { 
  orcamento: Orcamento
  onBack: () => void
  onEdit: () => void
  onEnviar: () => void
  onAprovar: () => void
  onRejeitar: (motivo: string) => void
  onGerarPDF: () => void
}) {
  const statusInfo = formatarStatusOrcamento(orcamento.status)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Orçamento #{orcamento.id.toString().padStart(4, '0')}</h2>
            <p className="text-gray-600">{orcamento.clientes?.nome}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {podeEditarOrcamento(orcamento.status) && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {podeEnviarOrcamento(orcamento.status) && (
            <Button variant="outline" onClick={onEnviar}>
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          )}
          {podeAprovarOrcamento(orcamento.status) && (
            <Button variant="outline" onClick={onAprovar}>
              <Check className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
          )}
          <Button variant="outline" onClick={onGerarPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Informações do Orçamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Número</Label>
                <p className="font-medium">#{orcamento.id.toString().padStart(4, '0')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Data</Label>
                <p>{new Date(orcamento.data_orcamento).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Validade</Label>
                <p>{new Date(orcamento.data_validade).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                <p>{formatarTipoOrcamento(orcamento.tipo_orcamento)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                <p className="font-bold text-lg">R$ {orcamento.valor_total.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Nome</Label>
              <p className="font-medium">{orcamento.clientes?.nome}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p>{orcamento.clientes?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Telefone</Label>
              <p>{orcamento.clientes?.telefone}</p>
            </div>
            {orcamento.clientes?.endereco && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                <p>{orcamento.clientes.endereco}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Itens do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto/Serviço</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orcamento.itens?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.produto_servico}</TableCell>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>R$ {item.valor_unitario.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">R$ {item.valor_total.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Observações */}
      {orcamento.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{orcamento.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

