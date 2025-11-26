"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Wrench,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para obter o token correto
const getAuthToken = () => {
  return localStorage.getItem('access_token') || localStorage.getItem('token')
}

type TipoPrecificacao = 'mensal' | 'unico' | 'por_metro' | 'por_hora' | 'por_dia'
type Unidade = 'm' | 'h' | 'unidade' | 'dia' | 'mes'
type TipoComplemento = 'acessorio' | 'servico'

interface ComplementoCatalogo {
  id: number | string
  nome: string
  sku: string
  tipo: TipoComplemento
  tipo_precificacao: TipoPrecificacao
  unidade: Unidade
  preco_unitario_centavos: number
  fator?: number
  descricao?: string
  rule_key?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export default function ComplementosPage() {
  const { toast } = useToast()
  
  const [complementos, setComplementos] = useState<ComplementoCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "acessorio" | "servico">("todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ComplementoCatalogo | null>(null)
  
  const [formData, setFormData] = useState<Partial<ComplementoCatalogo>>({
    nome: "",
    sku: "",
    tipo: "acessorio",
    tipo_precificacao: "mensal",
    unidade: "unidade",
    preco_unitario_centavos: 0,
    fator: undefined,
    descricao: "",
    rule_key: undefined,
    ativo: true,
  })

  // Carregar dados da API
  useEffect(() => {
    const loadComplementos = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()
        if (!token) {
          toast({
            title: "Erro",
            description: "Token de autenticação não encontrado",
            variant: "destructive"
          })
          setLoading(false)
          return
        }

        const response = await fetch(`${API_URL}/api/complementos?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar complementos')
        }

        const result = await response.json()
        if (result.success && result.data) {
          setComplementos(result.data)
        } else {
          setComplementos([])
        }
      } catch (error) {
        console.error('Erro ao carregar complementos:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar complementos. Tente novamente.",
          variant: "destructive"
        })
        setComplementos([])
      } finally {
        setLoading(false)
      }
    }
    
    loadComplementos()
  }, [toast])

  const filteredComplementos = complementos.filter(item => {
    const matchesSearch = !searchTerm || 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTipo = filtroTipo === "todos" || item.tipo === filtroTipo
    
    return matchesSearch && matchesTipo
  })

  const handleOpenDialog = (item?: ComplementoCatalogo) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        nome: item.nome,
        sku: item.sku,
        tipo: item.tipo,
        tipo_precificacao: item.tipo_precificacao,
        unidade: item.unidade,
        preco_unitario_centavos: item.preco_unitario_centavos / 100,
        fator: item.fator,
        descricao: item.descricao,
        rule_key: item.rule_key,
        ativo: item.ativo,
      })
    } else {
      setEditingItem(null)
      setFormData({
        nome: "",
        sku: "",
        tipo: "acessorio",
        tipo_precificacao: "mensal",
        unidade: "unidade",
        preco_unitario_centavos: 0,
        fator: undefined,
        descricao: "",
        rule_key: undefined,
        ativo: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData({
      nome: "",
      sku: "",
      tipo: "acessorio",
      tipo_precificacao: "mensal",
      unidade: "unidade",
      preco_unitario_centavos: 0,
      fator: undefined,
      descricao: "",
      rule_key: undefined,
      ativo: true,
    })
  }

  const handleSave = async () => {
    if (!formData.nome || !formData.sku || !formData.tipo_precificacao || !formData.unidade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Erro",
        description: "Token de autenticação não encontrado",
        variant: "destructive"
      })
      return
    }

    try {
      const payload = {
        nome: formData.nome!,
        sku: formData.sku!,
        tipo: formData.tipo!,
        tipo_precificacao: formData.tipo_precificacao!,
        unidade: formData.unidade!,
        preco_unitario_centavos: Math.round((formData.preco_unitario_centavos || 0) * 100),
        fator: formData.fator,
        descricao: formData.descricao || '',
        rule_key: formData.rule_key || '',
        ativo: formData.ativo ?? true
      }

      let response
      if (editingItem) {
        // Atualizar
        response = await fetch(`${API_URL}/api/complementos/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      } else {
        // Criar novo
        response = await fetch(`${API_URL}/api/complementos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao salvar complemento')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: editingItem ? "Complemento atualizado com sucesso" : "Complemento criado com sucesso",
        })
        
        // Recarregar lista
        const loadResponse = await fetch(`${API_URL}/api/complementos?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (loadResponse.ok) {
          const loadResult = await loadResponse.json()
          if (loadResult.success && loadResult.data) {
            setComplementos(loadResult.data)
          }
        }
        
        handleCloseDialog()
      } else {
        throw new Error(result.message || 'Erro ao salvar complemento')
      }
    } catch (error: any) {
      console.error('Erro ao salvar complemento:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar complemento. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number | string) => {
    if (!confirm("Tem certeza que deseja excluir este complemento?")) {
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Erro",
        description: "Token de autenticação não encontrado",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/complementos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao excluir complemento')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Complemento excluído com sucesso",
        })
        
        // Recarregar lista
        const loadResponse = await fetch(`${API_URL}/api/complementos?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (loadResponse.ok) {
          const loadResult = await loadResponse.json()
          if (loadResult.success && loadResult.data) {
            setComplementos(loadResult.data)
          }
        }
      } else {
        throw new Error(result.message || 'Erro ao excluir complemento')
      }
    } catch (error: any) {
      console.error('Erro ao excluir complemento:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir complemento. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleToggleAtivo = async (id: number | string) => {
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Erro",
        description: "Token de autenticação não encontrado",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/complementos/${id}/toggle-ativo`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao atualizar status')
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Status do complemento atualizado",
        })
        
        // Recarregar lista
        const loadResponse = await fetch(`${API_URL}/api/complementos?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (loadResponse.ok) {
          const loadResult = await loadResponse.json()
          if (loadResult.success && loadResult.data) {
            setComplementos(loadResult.data)
          }
        }
      } else {
        throw new Error(result.message || 'Erro ao atualizar status')
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const getTipoPrecificacaoLabel = (tipo: TipoPrecificacao) => {
    const labels = {
      mensal: 'Mensal',
      unico: 'Único',
      por_metro: 'Por Metro',
      por_hora: 'Por Hora',
      por_dia: 'Por Dia'
    }
    return labels[tipo] || tipo
  }

  const acessorios = filteredComplementos.filter(c => c.tipo === 'acessorio')
  const servicos = filteredComplementos.filter(c => c.tipo === 'servico')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complementos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie produtos e serviços pré-cadastrados para uso em obras
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Complemento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catálogo de Complementos</CardTitle>
              <CardDescription>
                Produtos e serviços disponíveis para adicionar às obras
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
              <Select value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as typeof filtroTipo)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="acessorio">Acessórios</SelectItem>
                  <SelectItem value="servico">Serviços</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Tabs defaultValue="todos" className="w-full">
              <TabsList>
                <TabsTrigger value="todos">
                  Todos ({filteredComplementos.length})
                </TabsTrigger>
                <TabsTrigger value="acessorios">
                  <Package className="w-4 h-4 mr-2" />
                  Acessórios ({acessorios.length})
                </TabsTrigger>
                <TabsTrigger value="servicos">
                  <Wrench className="w-4 h-4 mr-2" />
                  Serviços ({servicos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todos" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Precificação</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Unitário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplementos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Nenhum complemento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredComplementos.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.nome}</div>
                              {item.descricao && (
                                <div className="text-xs text-gray-500">{item.descricao}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.tipo === 'servico' ? 'secondary' : 'outline'}>
                              {item.tipo === 'servico' ? 'Serviço' : 'Acessório'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getTipoPrecificacaoLabel(item.tipo_precificacao)}</TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell>
                            R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            {item.fator && (
                              <div className="text-xs text-gray-500">Fator: {item.fator}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.ativo ? 'default' : 'secondary'}>
                              {item.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAtivo(item.id)}
                              >
                                {item.ativo ? (
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="acessorios" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Precificação</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Unitário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acessorios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhum acessório encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      acessorios.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.nome}</div>
                              {item.descricao && (
                                <div className="text-xs text-gray-500">{item.descricao}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTipoPrecificacaoLabel(item.tipo_precificacao)}</TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell>
                            R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            {item.fator && (
                              <div className="text-xs text-gray-500">Fator: {item.fator}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.ativo ? 'default' : 'secondary'}>
                              {item.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAtivo(item.id)}
                              >
                                {item.ativo ? (
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="servicos" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Precificação</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Preço Unitário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhum serviço encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      servicos.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.nome}</div>
                              {item.descricao && (
                                <div className="text-xs text-gray-500">{item.descricao}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getTipoPrecificacaoLabel(item.tipo_precificacao)}</TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell>
                            R$ {(item.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            {item.fator && (
                              <div className="text-xs text-gray-500">Fator: {item.fator}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.ativo ? 'default' : 'secondary'}>
                              {item.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAtivo(item.id)}
                              >
                                {item.ativo ? (
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Complemento' : 'Adicionar Complemento'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Atualize as informações do complemento' : 'Cadastre um novo produto ou serviço para uso em obras'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoComplemento })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acessorio">Acessório/Produto</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SKU *</Label>
                <Input
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="Ex: ACESS-001 ou SERV-001"
                />
              </div>
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do produto ou serviço"
                />
              </div>
              <div>
                <Label>Tipo de Precificação *</Label>
                <Select
                  value={formData.tipo_precificacao}
                  onValueChange={(value) => setFormData({ ...formData, tipo_precificacao: value as TipoPrecificacao })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal (Recorrente)</SelectItem>
                    <SelectItem value="unico">Único (Uma vez)</SelectItem>
                    <SelectItem value="por_metro">Por Metro</SelectItem>
                    <SelectItem value="por_hora">Por Hora</SelectItem>
                    <SelectItem value="por_dia">Por Dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade *</Label>
                <Select
                  value={formData.unidade}
                  onValueChange={(value) => setFormData({ ...formData, unidade: value as Unidade })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="m">Metro (m)</SelectItem>
                    <SelectItem value="h">Hora (h)</SelectItem>
                    <SelectItem value="dia">Dia</SelectItem>
                    <SelectItem value="mes">Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preço Unitário (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_unitario_centavos || ''}
                  onChange={(e) => setFormData({ ...formData, preco_unitario_centavos: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              {(formData.tipo_precificacao === 'por_metro' || formData.tipo_precificacao === 'por_hora') && (
                <div>
                  <Label>Fator</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.fator || ''}
                    onChange={(e) => setFormData({ ...formData, fator: parseFloat(e.target.value) || undefined })}
                    placeholder="Ex: 650"
                  />
                </div>
              )}
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  placeholder="Descrição detalhada do produto ou serviço"
                />
              </div>
              <div className="col-span-2">
                <Label>Regra Técnica (Rule Key)</Label>
                <Input
                  value={formData.rule_key || ''}
                  onChange={(e) => setFormData({ ...formData, rule_key: e.target.value || undefined })}
                  placeholder="Ex: estaiamento_por_altura, autotrafo_se_sem_380v"
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.ativo ?? true}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded"
                  />
                  <Label>Ativo (disponível para uso)</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Atualizar' : 'Criar'} Complemento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

