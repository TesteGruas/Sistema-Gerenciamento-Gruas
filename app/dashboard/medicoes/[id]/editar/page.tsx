"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Save,
  Plus,
  Trash2,
  Calculator,
  Check,
  ChevronsUpDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { medicoesMensaisApi, MedicaoMensal, MedicaoMensalUpdate, MedicaoCustoMensal } from "@/lib/api-medicoes-mensais"
import { itensCustosMensaisApi, ItemCustoMensal } from "@/lib/api-itens-custos-mensais"
import { medicoesUtils } from "@/lib/medicoes-utils"

interface CustoMensalForm {
  item: string
  descricao: string
  unidade: 'mês' | 'und' | 'und.' | 'km' | 'h' | 'hora' | 'kg' | 'm²' | 'm³'
  tipo: 'contrato' | 'aditivo'
  quantidade_orcamento: number
  valor_unitario: number
  valor_total: number
}

export default function EditarMedicaoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [medicao, setMedicao] = useState<MedicaoMensal | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  
  // Estados para itens de custos mensais
  const [itens, setItens] = useState<ItemCustoMensal[]>([])
  const [loadingItens, setLoadingItens] = useState(false)
  const [itemSearchOpen, setItemSearchOpen] = useState(false)
  const [novoItemDialogOpen, setNovoItemDialogOpen] = useState(false)
  const [salvandoItem, setSalvandoItem] = useState(false)
  const [novoItemForm, setNovoItemForm] = useState({
    codigo: "",
    descricao: "",
    unidade: "mês" as const,
    tipo: "contrato" as const,
    categoria: "" as "" | "funcionario" | "horas_extras" | "servico" | "produto"
  })
  
  // Formulário de edição
  const [editForm, setEditForm] = useState({
    data_medicao: "",
    valor_mensal_bruto: 0,
    valor_aditivos: 0,
    valor_custos_extras: 0,
    valor_descontos: 0,
    observacoes: ""
  })
  
  // Lista de custos mensais
  const [custosMensais, setCustosMensais] = useState<CustoMensalForm[]>([])
  
  // Formulário de novo custo mensal
  const [custoForm, setCustoForm] = useState<CustoMensalForm>({
    item: "",
    descricao: "",
    unidade: "mês",
    tipo: "contrato",
    quantidade_orcamento: 0,
    valor_unitario: 0,
    valor_total: 0
  })

  useEffect(() => {
    if (params.id) {
      carregarMedicao(Number(params.id))
      carregarItens()
    }
  }, [params.id])

  const carregarMedicao = async (id: number) => {
    try {
      setLoading(true)
      const response = await medicoesMensaisApi.obter(id)
      if (response.success && response.data) {
        setMedicao(response.data)
        setEditForm({
          data_medicao: response.data.data_medicao ? response.data.data_medicao.split('T')[0] : new Date().toISOString().split('T')[0],
          valor_mensal_bruto: response.data.valor_mensal_bruto || 0,
          valor_aditivos: response.data.valor_aditivos || 0,
          valor_custos_extras: response.data.valor_custos_extras || 0,
          valor_descontos: response.data.valor_descontos || 0,
          observacoes: response.data.observacoes || ""
        })
        
        // Carregar custos mensais existentes
        if (response.data.custos_mensais && response.data.custos_mensais.length > 0) {
          const custosFormatados: CustoMensalForm[] = response.data.custos_mensais.map((custo: MedicaoCustoMensal) => {
            // Extrair item e descrição da descrição completa (formato: "ITEM - Descrição")
            const partes = custo.descricao.split(' - ')
            const item = partes[0] || ''
            const descricao = partes.slice(1).join(' - ') || custo.descricao
            
            return {
              item: item,
              descricao: descricao,
              unidade: 'mês' as const, // Padrão, pode ser extraído das observações se necessário
              tipo: (custo.tipo as 'contrato' | 'aditivo') || 'contrato',
              quantidade_orcamento: custo.quantidade_meses || 0,
              valor_unitario: custo.valor_mensal || 0,
              valor_total: custo.valor_total || 0
            }
          })
          setCustosMensais(custosFormatados)
        }
      } else {
        toast({
          title: "Erro",
          description: "Medição não encontrada",
          variant: "destructive"
        })
        router.push("/dashboard/medicoes")
      }
    } catch (error: any) {
      console.error("Erro ao carregar medição:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar medição",
        variant: "destructive"
      })
      router.push("/dashboard/medicoes")
    } finally {
      setLoading(false)
    }
  }

  const carregarItens = async () => {
    try {
      setLoadingItens(true)
      const itensData = await itensCustosMensaisApi.listar({ ativo: true })
      setItens(itensData)
    } catch (error: any) {
      console.error("Erro ao carregar itens:", error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar itens",
        variant: "destructive"
      })
    } finally {
      setLoadingItens(false)
    }
  }

  const criarNovoItem = async () => {
    if (!novoItemForm.codigo || !novoItemForm.descricao) {
      toast({
        title: "Erro",
        description: "Preencha código e descrição do item",
        variant: "destructive"
      })
      return
    }

    try {
      setSalvandoItem(true)
      const itemCriado = await itensCustosMensaisApi.criar({
        codigo: novoItemForm.codigo,
        descricao: novoItemForm.descricao,
        unidade: novoItemForm.unidade,
        tipo: novoItemForm.tipo,
        categoria: novoItemForm.categoria || undefined
      })

      await carregarItens()

      setCustoForm({
        ...custoForm,
        item: itemCriado.codigo,
        descricao: itemCriado.descricao,
        unidade: itemCriado.unidade,
        tipo: itemCriado.tipo
      })

      setNovoItemDialogOpen(false)
      setNovoItemForm({
        codigo: "",
        descricao: "",
        unidade: "mês",
        tipo: "contrato",
        categoria: ""
      })

      toast({
        title: "Sucesso",
        description: "Item criado com sucesso",
      })
    } catch (error: any) {
      console.error("Erro ao criar item:", error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar item",
        variant: "destructive"
      })
    } finally {
      setSalvandoItem(false)
    }
  }

  const calcularTotalOrcamento = () => {
    return custoForm.quantidade_orcamento * custoForm.valor_unitario
  }

  const adicionarCustoMensal = () => {
    if (!custoForm.item || !custoForm.descricao || custoForm.quantidade_orcamento <= 0 || custoForm.valor_unitario <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios do custo mensal",
        variant: "destructive"
      })
      return
    }

    const valorTotal = calcularTotalOrcamento()

    const novoCusto: CustoMensalForm = {
      ...custoForm,
      valor_total: valorTotal
    }

    setCustosMensais([...custosMensais, novoCusto])
    
    setCustoForm({
      item: "",
      descricao: "",
      unidade: "mês",
      tipo: "contrato",
      quantidade_orcamento: 0,
      valor_unitario: 0,
      valor_total: 0
    })
  }

  const removerCustoMensal = (index: number) => {
    setCustosMensais(custosMensais.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!medicao) return

    try {
      setSalvando(true)
      
      // Converter custos mensais para o formato da API
      const custosMensaisApi = custosMensais.map(custo => ({
        tipo: custo.tipo,
        descricao: `${custo.item} - ${custo.descricao}`,
        valor_mensal: custo.valor_unitario,
        quantidade_meses: custo.quantidade_orcamento,
        valor_total: custo.valor_total,
        observacoes: `Unidade: ${custo.unidade}`
      }))

      const updateData: MedicaoMensalUpdate = {
        data_medicao: editForm.data_medicao || undefined,
        valor_mensal_bruto: editForm.valor_mensal_bruto,
        valor_aditivos: editForm.valor_aditivos,
        valor_custos_extras: editForm.valor_custos_extras,
        valor_descontos: editForm.valor_descontos,
        observacoes: editForm.observacoes.trim() || undefined,
        custos_mensais: custosMensaisApi.length > 0 ? custosMensaisApi : undefined
      }

      const response = await medicoesMensaisApi.atualizar(medicao.id, updateData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição atualizada com sucesso"
        })
        router.push(`/dashboard/medicoes/${medicao.id}`)
      }
    } catch (error: any) {
      // Extrair mensagem do response do backend
      let errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         "Erro ao atualizar medição"
      
      // Formatar período na mensagem se ainda estiver no formato YYYY-MM
      errorMessage = errorMessage.replace(/(\d{4}-\d{2})/g, (match) => {
        return medicoesUtils.formatPeriodo(match);
      });
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSalvando(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando medição...</p>
        </div>
      </div>
    )
  }

  if (!medicao) {
    return null
  }

  const valorTotal = editForm.valor_mensal_bruto + 
                    editForm.valor_aditivos + 
                    editForm.valor_custos_extras - 
                    editForm.valor_descontos

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Medição</h1>
          <p className="text-gray-600">
            {medicao.numero} - Período {medicoesUtils.formatPeriodo(medicao.periodo)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Informações Básicas da Medição */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações da Medição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <span className="font-medium">Número:</span> {medicao.numero}
              </div>
              <div>
                <span className="font-medium">Período:</span> {medicoesUtils.formatPeriodo(medicao.periodo)}
              </div>
              {medicao.obras && (
                <div>
                  <span className="font-medium">Obra:</span> {medicao.obras.nome}
                </div>
              )}
              {medicao.gruas && (
                <div>
                  <span className="font-medium">Grua:</span> {medicao.gruas.name || medicao.gruas.nome}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="data_medicao">Data da Medição</Label>
              <Input
                id="data_medicao"
                type="date"
                value={editForm.data_medicao}
                onChange={(e) => setEditForm({ ...editForm, data_medicao: e.target.value })}
                className="bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="valor_mensal_bruto">Valor Mensal Bruto (R$)</Label>
                <Input
                  id="valor_mensal_bruto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor_mensal_bruto === 0 ? '' : editForm.valor_mensal_bruto}
                  onChange={(e) => setEditForm({ ...editForm, valor_mensal_bruto: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="valor_aditivos">Valor Aditivos (R$)</Label>
                <Input
                  id="valor_aditivos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor_aditivos === 0 ? '' : editForm.valor_aditivos}
                  onChange={(e) => setEditForm({ ...editForm, valor_aditivos: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="valor_custos_extras">Custos Extras (R$)</Label>
                <Input
                  id="valor_custos_extras"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor_custos_extras === 0 ? '' : editForm.valor_custos_extras}
                  onChange={(e) => setEditForm({ ...editForm, valor_custos_extras: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="valor_descontos">Descontos (R$)</Label>
                <Input
                  id="valor_descontos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor_descontos === 0 ? '' : editForm.valor_descontos}
                  onChange={(e) => setEditForm({ ...editForm, valor_descontos: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Valor Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(valorTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custos Mensais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Custos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Formulário de Novo Custo Mensal */}
            <div className="border rounded-lg p-2 bg-gray-50">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-xs">
                <Plus className="w-3 h-3" />
                Novo Custo Mensal
              </h3>
              <div className="space-y-2">
                {/* Primeira linha: Item e Descrição */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="custo_item" className="text-xs">Item *</Label>
                    <div className="flex gap-2">
                      <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={itemSearchOpen}
                            className="flex-1 justify-between h-8 text-sm bg-white"
                            disabled={loadingItens}
                          >
                          {custoForm.item
                            ? (() => {
                                const itemSelecionado = itens.find((item) => item.codigo === custoForm.item)
                                return itemSelecionado ? itemSelecionado.descricao : custoForm.item
                              })()
                            : loadingItens ? "Carregando itens..." : "Selecione um item"}
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar item..." />
                            <CommandList>
                              <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                              <CommandGroup>
                              {itens.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={item.descricao}
                                  onSelect={() => {
                                    setCustoForm({
                                      ...custoForm,
                                      item: item.codigo,
                                      descricao: item.descricao,
                                      unidade: item.unidade,
                                      tipo: item.tipo
                                    })
                                    setItemSearchOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      custoForm.item === item.codigo ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span>{item.descricao}</span>
                                </CommandItem>
                              ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Dialog open={novoItemDialogOpen} onOpenChange={setNovoItemDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="h-8 px-3">
                            <Plus className="h-3 w-3 mr-1" />
                            Novo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Novo Item de Custo Mensal</DialogTitle>
                            <DialogDescription>
                              Cadastre um novo item que poderá ser usado nas medições
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="novo_item_codigo" className="text-xs">Código *</Label>
                                <Input
                                  id="novo_item_codigo"
                                  value={novoItemForm.codigo}
                                  onChange={(e) => {
                                    const value = e.target.value.slice(0, 20)
                                    setNovoItemForm({ ...novoItemForm, codigo: value })
                                  }}
                                  placeholder="01.01"
                                  maxLength={20}
                                  required
                                  className="h-8 text-sm bg-white"
                                />
                              </div>
                              <div>
                                <Label htmlFor="novo_item_unidade" className="text-xs">Unidade *</Label>
                                <Select
                                  value={novoItemForm.unidade}
                                  onValueChange={(value: any) => setNovoItemForm({ ...novoItemForm, unidade: value })}
                                >
                                  <SelectTrigger className="h-8 text-sm bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mês">mês</SelectItem>
                                    <SelectItem value="und">und</SelectItem>
                                    <SelectItem value="und.">und.</SelectItem>
                                    <SelectItem value="km">km</SelectItem>
                                    <SelectItem value="h">h</SelectItem>
                                    <SelectItem value="hora">hora</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="m²">m²</SelectItem>
                                    <SelectItem value="m³">m³</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="novo_item_descricao" className="text-xs">Descrição *</Label>
                              <Input
                                id="novo_item_descricao"
                                value={novoItemForm.descricao}
                                onChange={(e) => setNovoItemForm({ ...novoItemForm, descricao: e.target.value })}
                                placeholder="Locação de grua..."
                                required
                                className="h-8 text-sm bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="novo_item_tipo" className="text-xs">Tipo *</Label>
                                <Select
                                  value={novoItemForm.tipo}
                                  onValueChange={(value: any) => setNovoItemForm({ ...novoItemForm, tipo: value })}
                                >
                                  <SelectTrigger className="h-8 text-sm bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="contrato">Contrato</SelectItem>
                                    <SelectItem value="aditivo">Aditivo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="novo_item_categoria" className="text-xs">Categoria</Label>
                                <Select
                                  value={novoItemForm.categoria || undefined}
                                  onValueChange={(value: any) => setNovoItemForm({ ...novoItemForm, categoria: value as any })}
                                >
                                  <SelectTrigger className="h-8 text-sm bg-white">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="funcionario">Funcionário</SelectItem>
                                    <SelectItem value="horas_extras">Horas Extras</SelectItem>
                                    <SelectItem value="servico">Serviço</SelectItem>
                                    <SelectItem value="produto">Produto</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setNovoItemDialogOpen(false)
                                setNovoItemForm({
                                  codigo: "",
                                  descricao: "",
                                  unidade: "mês",
                                  tipo: "contrato",
                                  categoria: ""
                                })
                              }}
                              disabled={salvandoItem}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              onClick={criarNovoItem}
                              disabled={salvandoItem}
                            >
                              {salvandoItem ? "Salvando..." : "Criar Item"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="custo_descricao" className="text-xs">Descrição *</Label>
                    <Input
                      id="custo_descricao"
                      value={custoForm.descricao}
                      onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
                      placeholder="Locação de grua..."
                      className="h-8 text-sm bg-white"
                    />
                  </div>
                </div>
                
                {/* Segunda linha: Unidade, Tipo, Qtd. Orçamento, Valor Unitário, Total Orçamento */}
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <Label htmlFor="custo_unidade" className="text-xs">Unidade *</Label>
                    <Select
                      value={custoForm.unidade}
                      onValueChange={(value: any) => setCustoForm({ ...custoForm, unidade: value })}
                    >
                      <SelectTrigger className="h-8 text-sm bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mês">mês</SelectItem>
                        <SelectItem value="und">und</SelectItem>
                        <SelectItem value="und.">und.</SelectItem>
                        <SelectItem value="km">km</SelectItem>
                        <SelectItem value="h">h</SelectItem>
                        <SelectItem value="hora">hora</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="m³">m³</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="custo_tipo" className="text-xs">Tipo *</Label>
                    <Select
                      value={custoForm.tipo}
                      onValueChange={(value: any) => setCustoForm({ ...custoForm, tipo: value })}
                    >
                      <SelectTrigger className="h-8 text-sm bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contrato">Contrato</SelectItem>
                        <SelectItem value="aditivo">Aditivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="custo_quantidade_orcamento" className="text-xs">Qtd. Orç. *</Label>
                    <Input
                      id="custo_quantidade_orcamento"
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoForm.quantidade_orcamento === 0 ? '' : custoForm.quantidade_orcamento}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        setCustoForm({ 
                          ...custoForm, 
                          quantidade_orcamento: value
                        })
                      }}
                      placeholder="0.00"
                      className="h-8 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custo_valor_unitario" className="text-xs">Valor Unit. *</Label>
                    <Input
                      id="custo_valor_unitario"
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoForm.valor_unitario === 0 ? '' : custoForm.valor_unitario}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        setCustoForm({ 
                          ...custoForm, 
                          valor_unitario: value
                        })
                      }}
                      placeholder="0.00"
                      className="h-8 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Total Orçamento</Label>
                    <Input
                      value={formatCurrency(calcularTotalOrcamento())}
                      disabled
                      className="h-8 text-sm bg-white disabled:bg-white"
                      style={{ backgroundColor: 'white' }}
                    />
                  </div>
                </div>
                
                {/* Terceira linha: Botão Adicionar */}
                <div className="flex justify-end">
                  <Button type="button" onClick={adicionarCustoMensal} size="sm" className="h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Custos Adicionados */}
            {custosMensais.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Custos Adicionados ({custosMensais.length})</h4>
                <div className="space-y-2">
                  {custosMensais.map((custo, index) => (
                    <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{custo.item}</span>
                          <span className="text-sm text-gray-500">- {custo.descricao}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {custo.unidade} | {custo.tipo} | Qtd: {custo.quantidade_orcamento} | 
                          Valor Unit: {formatCurrency(custo.valor_unitario)} | 
                          Total: {formatCurrency(custo.quantidade_orcamento * custo.valor_unitario)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerCustoMensal(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="observacoes"
              value={editForm.observacoes}
              onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
              placeholder="Observações sobre a medição..."
              rows={4}
              className="bg-white"
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

