"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCompras, createCompra, deleteCompra, addCompraItem, receberCompra, getCompraItens, type Compra, type CompraItem } from "@/lib/api-financial"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ShoppingCart,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { estoqueAPI, type Produto } from "@/lib/api-estoque"

// Função utilitária para cores de status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'aprovado': return 'bg-green-500'
    case 'pendente': return 'bg-yellow-500'
    case 'enviado': return 'bg-blue-500'
    case 'recebido': return 'bg-purple-500'
    case 'cancelado': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export default function ComprasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [compras, setCompras] = useState<Compra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null)
  const [isViewCompraDialogOpen, setIsViewCompraDialogOpen] = useState(false)
  const [isEditCompraDialogOpen, setIsEditCompraDialogOpen] = useState(false)

  // Carregar compras
  const loadCompras = async () => {
    try {
      setIsLoading(true)
      const data = await getCompras()
      setCompras(data)
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar compras",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCompras()
  }, [])

  // Filtrar compras
  const filteredCompras = compras.filter(compra =>
    compra.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compra.fornecedores?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )


  const handleViewCompra = (compra: Compra) => {
    setSelectedCompra(compra)
    setIsViewCompraDialogOpen(true)
  }

  const handleEditCompra = (compra: Compra) => {
    setSelectedCompra(compra)
    setIsEditCompraDialogOpen(true)
  }

  const handleReceberCompra = async (compra: Compra) => {
    try {
      await receberCompra(compra.id)
      toast({
        title: "Compra recebida",
        description: "A compra foi marcada como recebida e as movimentações de estoque foram criadas.",
      })
      loadCompras()
    } catch (error) {
      console.error('Erro ao receber compra:', error)
      toast({
        title: "Erro",
        description: "Erro ao receber compra. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600">Gestão de compras e fornecedores</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Compra
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por número do pedido ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Compras */}
      <Card>
        <CardHeader>
          <CardTitle>Compras ({filteredCompras.length})</CardTitle>
          <CardDescription>Lista de todas as compras registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando compras...</p>
            </div>
          ) : filteredCompras.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma compra encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Número do Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Data de Entrega</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompras.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell className="font-medium">{compra.id}</TableCell>
                    <TableCell className="font-medium">{compra.numero_pedido}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        {compra.fornecedores?.nome || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(compra.data_pedido).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {compra.data_entrega ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(compra.data_entrega).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-gray-400">Não definida</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-red-600" />
                        R$ {compra.valor_total.toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(compra.status)}>
                        {compra.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewCompra(compra)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditCompra(compra)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {compra.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReceberCompra(compra)}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta compra?')) {
                              deleteCompra(compra.id).then(() => loadCompras())
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação */}
      <CreateCompraDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          loadCompras()
        }}
      />

      {/* Dialog de Visualização */}
      <ViewCompraDialog
        compra={selectedCompra}
        isOpen={isViewCompraDialogOpen}
        onClose={() => {
          setIsViewCompraDialogOpen(false)
          setSelectedCompra(null)
        }}
      />

      {/* Dialog de Edição */}
      <EditCompraDialog
        compra={selectedCompra}
        isOpen={isEditCompraDialogOpen}
        onClose={() => {
          setIsEditCompraDialogOpen(false)
          setSelectedCompra(null)
        }}
        onSuccess={() => {
          loadCompras()
          toast({
            title: "Sucesso",
            description: "Compra atualizada com sucesso!",
          })
        }}
      />
    </div>
  )
}

// Interface para itens de compra
interface CreateCompraItemData {
  produto_id: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
}

function CreateCompraDialog({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    fornecedor_id: '',
    numero_pedido: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_entrega: '',
    observacoes: ''
  })
  
  const [itens, setItens] = useState<CreateCompraItemData[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [compraCriada, setCompraCriada] = useState<number | null>(null)

  // Carregar produtos quando o dialog abrir
  useEffect(() => {
    if (isOpen) {
      carregarProdutos()
    }
  }, [isOpen])

  const carregarProdutos = async () => {
    try {
      setLoadingProdutos(true)
      const response = await estoqueAPI.listarProdutos({ limit: 100, status: 'Ativo' })
      setProdutos(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }

  const adicionarItem = () => {
    setItens([...itens, {
      produto_id: '',
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0
    }])
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, campo: keyof CreateCompraItemData, valor: any) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    
    // Se mudou o produto, atualizar todos os campos do produto
    if (campo === 'produto_id') {
      const produto = produtos.find(p => p.id === valor)
      if (produto) {
        novosItens[index].descricao = produto.descricao || produto.nome
        novosItens[index].valor_unitario = produto.valor_unitario
        novosItens[index].valor_total = novosItens[index].quantidade * produto.valor_unitario
      }
    }
    
    // Recalcular valor total se quantidade ou valor unitário mudaram
    if (campo === 'quantidade' || campo === 'valor_unitario') {
      novosItens[index].valor_total = novosItens[index].quantidade * novosItens[index].valor_unitario
    }
    
    setItens(novosItens)
  }

  // Limpar itens quando dialog fechar
  useEffect(() => {
    if (!isOpen) {
      setItens([])
      setCompraCriada(null)
    }
  }, [isOpen])

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Calcular valor total dos itens
      const valorTotalItens = itens.reduce((total, item) => total + (item.quantidade * item.valor_unitario), 0)
      
      // Criar compra primeiro
      const compra = await createCompra({
        fornecedor_id: parseInt(formData.fornecedor_id),
        numero_pedido: formData.numero_pedido,
        data_pedido: formData.data_pedido,
        data_entrega: formData.data_entrega || undefined,
        valor_total: valorTotalItens,
        status: 'pendente' as 'pendente' | 'aprovado' | 'enviado' | 'recebido' | 'cancelado',
        observacoes: formData.observacoes || undefined
      })
      
      setCompraCriada(compra.id)
      
      // Adicionar itens se houver
      if (itens.length > 0) {
        for (const item of itens) {
          await addCompraItem(compra.id, item)
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Compra criada com sucesso!"
      })
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar compra:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar compra. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Compra</DialogTitle>
          <DialogDescription>
            Registre uma nova compra no sistema
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_pedido">Número do Pedido</Label>
              <Input
                id="numero_pedido"
                value={formData.numero_pedido}
                onChange={(e) => setFormData({ ...formData, numero_pedido: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="fornecedor_id">Fornecedor *</Label>
              <FornecedorSelector
                value={formData.fornecedor_id}
                onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                placeholder="Selecione o fornecedor"
                required={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_pedido">Data do Pedido</Label>
              <Input
                id="data_pedido"
                type="date"
                value={formData.data_pedido}
                onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="data_entrega">Data de Entrega (opcional)</Label>
              <Input
                id="data_entrega"
                type="date"
                value={formData.data_entrega}
                onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Seção de Itens */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Itens da Compra</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selecione produtos do estoque para esta compra
                </p>
              </div>
              <Button type="button" onClick={adicionarItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {itens.map((item, index) => (
                <Card key={index} className="w-full">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      {/* Produto - ocupa mais espaço */}
                      <div className="col-span-5">
                        <Label className="text-sm font-medium mb-2 block">Produto *</Label>
                        <Select
                          value={item.produto_id || ''}
                          onValueChange={(value) => atualizarItem(index, 'produto_id', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingProdutos ? (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                Carregando produtos...
                              </div>
                            ) : (
                              produtos.map((produto) => (
                                <SelectItem key={produto.id} value={produto.id}>
                                  {produto.nome} - R$ {produto.valor_unitario}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Quantidade */}
                      <div className="col-span-2">
                        <Label className="text-sm font-medium mb-2 block">Quantidade *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantidade}
                          onChange={(e) => atualizarItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Valor Unitário */}
                      <div className="col-span-2">
                        <Label className="text-sm font-medium mb-2 block">Valor Unitário *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valor_unitario}
                          onChange={(e) => atualizarItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Valor Total */}
                      <div className="col-span-2">
                        <Label className="text-sm font-medium mb-2 block">Valor Total</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantidade * item.valor_unitario}
                          disabled
                          className="w-full bg-gray-50 font-semibold"
                        />
                      </div>
                      
                      {/* Botão Remover */}
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removerItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumo dos Itens */}
            {itens.length > 0 && (
              <Card className="mt-6 bg-gray-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{itens.length}</span> item{itens.length !== 1 ? 's' : ''} adicionado{itens.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total:</div>
                        <div className="text-lg font-bold text-gray-900">
                          R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Compra
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Componente para Seleção de Fornecedores com Filtro
function FornecedorSelector({ 
  value, 
  onValueChange, 
  placeholder = "Selecione o fornecedor",
  required = false 
}: { 
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<any[]>([])
  const [fornecedorFilter, setFornecedorFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // Carregar fornecedores iniciais
  useEffect(() => {
    const carregarFornecedores = async () => {
      try {
        setLoading(true)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const token = localStorage.getItem('access_token') || localStorage.getItem('token')

        const response = await fetch(`${API_URL}/api/fornecedores`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setFornecedores(data.data || data || [])
        } else {
          throw new Error('Erro ao carregar fornecedores')
        }
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar fornecedores. Tente novamente.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    carregarFornecedores()
  }, [])

  // Buscar fornecedores dinamicamente
  const buscarFornecedores = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setFornecedoresFiltrados([])
      return
    }

    try {
      setLoading(true)
      // Simular busca - você pode implementar uma API real aqui
      const resultados = fornecedores.filter(f => 
        f.nome.toLowerCase().includes(termo.toLowerCase()) ||
        f.cnpj.includes(termo) ||
        f.email.toLowerCase().includes(termo.toLowerCase())
      )
      setFornecedoresFiltrados(resultados)
    } catch (error) {
      console.error('Erro na busca de fornecedores:', error)
      setFornecedoresFiltrados([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarFornecedores(fornecedorFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [fornecedorFilter])

  // Filtrar fornecedores baseado no termo de busca
  const fornecedoresDisponiveis = fornecedorFilter.trim() 
    ? fornecedoresFiltrados 
    : fornecedores

  const fornecedorSelecionado = fornecedores.find(f => f.id.toString() === value)

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Input
          placeholder="Buscar fornecedor por nome, CNPJ ou email..."
          value={fornecedorFilter}
          onChange={(e) => setFornecedorFilter(e.target.value)}
          className="text-sm"
        />
        <Select 
          value={value} 
          onValueChange={onValueChange}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {loading ? (
              <div className="p-2 text-sm text-gray-500 text-center">
                Carregando fornecedores...
              </div>
            ) : fornecedoresDisponiveis.length > 0 ? (
              fornecedoresDisponiveis.map(fornecedor => (
                <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{fornecedor.nome}</span>
                    <span className="text-xs text-gray-500">
                      {fornecedor.cnpj} • {fornecedor.email}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500 text-center">
                {fornecedorFilter.trim() ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor disponível'}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      
      {fornecedorFilter.trim() && (
        <div className="text-xs text-gray-500">
          {fornecedoresFiltrados.length} fornecedor(es) encontrado(s)
        </div>
      )}
      
      {!fornecedorFilter.trim() && fornecedores.length > 0 && (
        <div className="text-xs text-gray-500">
          {fornecedores.length} fornecedor(es) disponível(is)
        </div>
      )}

      {fornecedorSelecionado && (
        <div className="p-2 bg-blue-50 rounded-lg text-sm">
          <div className="font-medium text-blue-900">{fornecedorSelecionado.nome}</div>
          <div className="text-blue-700">
            {fornecedorSelecionado.cnpj} • {fornecedorSelecionado.email}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para visualizar compra
function ViewCompraDialog({ compra, isOpen, onClose }: {
  compra: Compra | null
  isOpen: boolean
  onClose: () => void
}) {
  const [compraItens, setCompraItens] = useState<CompraItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (compra && isOpen) {
      loadCompraItens()
    }
  }, [compra, isOpen])

  const loadCompraItens = async () => {
    if (!compra) return
    
    try {
      setLoading(true)
      const itens = await getCompraItens(compra.id)
      setCompraItens(itens)
    } catch (error) {
      console.error('❌ Erro ao carregar itens da compra:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!compra) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Visualizar Compra</DialogTitle>
          <DialogDescription>
            Detalhes da compra {compra.numero_pedido}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações da Compra */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Compra</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Número do Pedido</Label>
                <p className="text-sm text-gray-600">{compra.numero_pedido}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Data do Pedido</Label>
                <p className="text-sm text-gray-600">{new Date(compra.data_pedido).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fornecedor</Label>
                <p className="text-sm text-gray-600">{compra.fornecedores?.nome || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(compra.status)}>
                  {compra.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Valor Total</Label>
                <p className="text-sm text-gray-600 font-semibold">
                  R$ {compra.valor_total.toLocaleString('pt-BR')}
                </p>
              </div>
              {compra.data_entrega && (
                <div>
                  <Label className="text-sm font-medium">Data de Entrega</Label>
                  <p className="text-sm text-gray-600">{new Date(compra.data_entrega).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {compra.observacoes && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-gray-600">{compra.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens da Compra */}
          <Card>
            <CardHeader>
              <CardTitle>Itens da Compra</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Carregando itens...</p>
                </div>
              ) : compraItens.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Unitário</TableHead>
                      <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {compraItens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>R$ {Number(item.valor_unitario).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>R$ {Number(item.valor_total).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
              </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Nenhum item encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
    </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente para editar compra
function EditCompraDialog({ compra, isOpen, onClose, onSuccess }: {
  compra: Compra | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    numero_pedido: '',
    data_pedido: '',
    data_entrega: '',
    observacoes: ''
  })

  useEffect(() => {
    if (compra) {
      setFormData({
        numero_pedido: compra.numero_pedido,
        data_pedido: compra.data_pedido,
        data_entrega: compra.data_entrega || '',
        observacoes: compra.observacoes || ''
      })
    }
  }, [compra])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compra) return

    try {
      // Aqui você pode implementar a função updateCompra se necessário
      // await updateCompra(compra.id, formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar compra:', error)
    }
  }

  if (!compra) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Compra</DialogTitle>
          <DialogDescription>
            Edite as informações da compra {compra.numero_pedido}
          </DialogDescription>
        </DialogHeader>
        
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
              <Label htmlFor="numero_pedido">Número do Pedido</Label>
              <Input
                id="numero_pedido"
                value={formData.numero_pedido}
                onChange={(e) => setFormData({ ...formData, numero_pedido: e.target.value })}
                required
              />
        </div>
        <div>
              <Label htmlFor="data_pedido">Data do Pedido</Label>
          <Input
                id="data_pedido"
            type="date"
                value={formData.data_pedido}
                onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
            <Label htmlFor="data_entrega">Data de Entrega (opcional)</Label>
        <Input
              id="data_entrega"
          type="date"
              value={formData.data_entrega}
              onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })}
        />
      </div>

      <div>
            <Label htmlFor="observacoes">Observações</Label>
        <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
              Atualizar Compra
        </Button>
      </div>
    </form>
      </DialogContent>
    </Dialog>
  )
}