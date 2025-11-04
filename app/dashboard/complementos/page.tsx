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

type TipoPrecificacao = 'mensal' | 'unico' | 'por_metro' | 'por_hora' | 'por_dia'
type Unidade = 'm' | 'h' | 'unidade' | 'dia' | 'mes'
type TipoComplemento = 'acessorio' | 'servico'

interface ComplementoCatalogo {
  id: string
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

  // Carregar dados (mockado por enquanto)
  useEffect(() => {
    const loadComplementos = async () => {
      setLoading(true)
      try {
        // TODO: Integrar com API
        const mockData: ComplementoCatalogo[] = [
          // Acessórios
          { id: '1', nome: 'Garfo Paleteiro', sku: 'ACESS-001', tipo: 'acessorio', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 50000, descricao: 'Garfo para movimentação de paletes', ativo: true },
          { id: '2', nome: 'Balde de Concreto', sku: 'ACESS-002', tipo: 'acessorio', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 30000, descricao: 'Balde para transporte de concreto', ativo: true },
          { id: '3', nome: 'Caçamba de Entulho', sku: 'ACESS-003', tipo: 'acessorio', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 40000, descricao: 'Caçamba para descarte de entulho', ativo: true },
          { id: '4', nome: 'Plataforma de Descarga', sku: 'ACESS-004', tipo: 'acessorio', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 60000, descricao: 'Plataforma para descarga de materiais nos pavimentos', ativo: true },
          { id: '5', nome: 'Estaiamentos', sku: 'ACESS-005', tipo: 'acessorio', tipo_precificacao: 'por_metro', unidade: 'm', preco_unitario_centavos: 65000, fator: 650, descricao: 'Estaiamentos para fixação lateral da grua', rule_key: 'estaiamento_por_altura', ativo: true },
          { id: '6', nome: 'Chumbadores/Base de Fundação', sku: 'ACESS-006', tipo: 'acessorio', tipo_precificacao: 'unico', unidade: 'unidade', preco_unitario_centavos: 150000, descricao: 'Peças de ancoragem concretadas no bloco da grua', ativo: true },
          { id: '7', nome: 'Auto-transformador (Energia)', sku: 'ACESS-007', tipo: 'acessorio', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 80000, descricao: 'Adequação elétrica 220/380V', rule_key: 'autotrafo_se_sem_380v', ativo: true },
          { id: '8', nome: 'Plano de Rigging / ART de Engenheiro', sku: 'ACESS-008', tipo: 'acessorio', tipo_precificacao: 'unico', unidade: 'unidade', preco_unitario_centavos: 500000, descricao: 'Projeto técnico e responsabilidade civil', ativo: true },
          { id: '9', nome: 'Seguro RC / Roubo', sku: 'ACESS-012', tipo: 'acessorio', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 120000, descricao: 'Seguro de responsabilidade civil e riscos', ativo: true },
          
          // Serviços
          { id: '10', nome: 'Serviço de Montagem', sku: 'SERV-001', tipo: 'servico', tipo_precificacao: 'por_hora', unidade: 'h', preco_unitario_centavos: 15000, descricao: 'Mão de obra para montagem e fixação da grua', ativo: true },
          { id: '11', nome: 'Serviço de Desmontagem', sku: 'SERV-002', tipo: 'servico', tipo_precificacao: 'por_hora', unidade: 'h', preco_unitario_centavos: 15000, descricao: 'Mão de obra para desmontagem da grua', ativo: true },
          { id: '12', nome: 'Ascensão da Torre', sku: 'SERV-003', tipo: 'servico', tipo_precificacao: 'por_metro', unidade: 'm', preco_unitario_centavos: 65000, fator: 650, descricao: 'Serviço de elevação da torre conforme a obra cresce', ativo: true },
          { id: '13', nome: 'Transporte de Ida e Retorno', sku: 'SERV-004', tipo: 'servico', tipo_precificacao: 'unico', unidade: 'unidade', preco_unitario_centavos: 300000, descricao: 'Transporte da grua até a obra e retorno ao depósito', ativo: true },
          { id: '14', nome: 'Serviço de Operador', sku: 'SERV-005', tipo: 'servico', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 800000, descricao: 'Locação mensal de operador de grua', ativo: true },
          { id: '15', nome: 'Serviço de Sinaleiro', sku: 'SERV-006', tipo: 'servico', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 600000, descricao: 'Locação mensal de sinaleiro', ativo: true },
          { id: '16', nome: 'Serviço de Manutenção Preventiva', sku: 'SERV-007', tipo: 'servico', tipo_precificacao: 'mensal', unidade: 'unidade', preco_unitario_centavos: 200000, descricao: 'Manutenção preventiva mensal da grua', ativo: true },
          { id: '17', nome: 'Serviço de Manutenção Corretiva', sku: 'SERV-008', tipo: 'servico', tipo_precificacao: 'por_hora', unidade: 'h', preco_unitario_centavos: 20000, descricao: 'Serviço de manutenção corretiva (cobrado por hora)', ativo: true },
          { id: '18', nome: 'Serviço de Técnico de Segurança', sku: 'SERV-009', tipo: 'servico', tipo_precificacao: 'por_dia', unidade: 'dia', preco_unitario_centavos: 50000, descricao: 'Serviço de técnico de segurança (NR-18)', ativo: true },
          { id: '19', nome: 'Consultoria Técnica', sku: 'SERV-010', tipo: 'servico', tipo_precificacao: 'por_hora', unidade: 'h', preco_unitario_centavos: 25000, descricao: 'Consultoria técnica especializada', ativo: true },
          { id: '20', nome: 'Treinamento de Operadores', sku: 'SERV-011', tipo: 'servico', tipo_precificacao: 'unico', unidade: 'unidade', preco_unitario_centavos: 150000, descricao: 'Treinamento e capacitação de operadores', ativo: true },
          { id: '21', nome: 'Inspeção Técnica', sku: 'SERV-012', tipo: 'servico', tipo_precificacao: 'unico', unidade: 'unidade', preco_unitario_centavos: 80000, descricao: 'Inspeção técnica periódica da grua', ativo: true },
        ]
        setComplementos(mockData)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar complementos",
          variant: "destructive"
        })
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

  const handleSave = () => {
    if (!formData.nome || !formData.sku || !formData.tipo_precificacao || !formData.unidade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    if (editingItem) {
      // Atualizar
      setComplementos(complementos.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              nome: formData.nome!,
              sku: formData.sku!,
              tipo: formData.tipo!,
              tipo_precificacao: formData.tipo_precificacao!,
              unidade: formData.unidade!,
              preco_unitario_centavos: Math.round((formData.preco_unitario_centavos || 0) * 100),
              fator: formData.fator,
              descricao: formData.descricao,
              rule_key: formData.rule_key,
              ativo: formData.ativo ?? true,
              updated_at: new Date().toISOString()
            }
          : item
      ))
      toast({
        title: "Sucesso",
        description: "Complemento atualizado com sucesso",
      })
    } else {
      // Criar novo
      const novoItem: ComplementoCatalogo = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nome: formData.nome!,
        sku: formData.sku!,
        tipo: formData.tipo!,
        tipo_precificacao: formData.tipo_precificacao!,
        unidade: formData.unidade!,
        preco_unitario_centavos: Math.round((formData.preco_unitario_centavos || 0) * 100),
        fator: formData.fator,
        descricao: formData.descricao,
        rule_key: formData.rule_key,
        ativo: formData.ativo ?? true,
        created_at: new Date().toISOString()
      }
      setComplementos([...complementos, novoItem])
      toast({
        title: "Sucesso",
        description: "Complemento criado com sucesso",
      })
    }
    
    handleCloseDialog()
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este complemento?")) {
      setComplementos(complementos.filter(item => item.id !== id))
      toast({
        title: "Sucesso",
        description: "Complemento excluído com sucesso",
      })
    }
  }

  const handleToggleAtivo = (id: string) => {
    setComplementos(complementos.map(item => 
      item.id === id ? { ...item, ativo: !item.ativo } : item
    ))
    toast({
      title: "Sucesso",
      description: "Status do complemento atualizado",
    })
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
    <div className="space-y-6 p-6">
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

