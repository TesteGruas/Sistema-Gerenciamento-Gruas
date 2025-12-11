"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calendar
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import ClienteSearch from "@/components/cliente-search"
import { ObraSearch } from "@/components/obra-search"
import { complementosApi } from "@/lib/api-complementos"
import { createOrcamento, updateOrcamento, getOrcamento } from "@/lib/api-orcamentos"
import { obrasApi } from "@/lib/api-obras"

interface ComplementoItem {
  id?: string
  nome: string
  codigo: string
  estado: 'novo' | 'usado' | 'recondicionado'
  medida_capacidade: string
  quantidade: number
  peso: number
  preco_unitario: number
  preco_total: number
  frete: 'CIF' | 'FOB'
  icms_percentual: number
  desconto_percentual: number
  observacoes: string
}

export default function OrcamentoComplementosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const orcamentoId = searchParams.get('id')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nome: '',
    numero_proposta: '',
    data: new Date().toISOString().split('T')[0],
    periodo_locacao_inicio: '',
    periodo_locacao_fim: '',
    tem_grua_nossa: false,
    obra_id: '',
    obra_nome: '',
    tipo_transacao: 'locacao' as 'locacao' | 'venda',
    valor_frete: 0,
    observacoes: ''
  })

  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [obraSelecionada, setObraSelecionada] = useState<any>(null)
  const [complementos, setComplementos] = useState<ComplementoItem[]>([])
  const [catalogoComplementos, setCatalogoComplementos] = useState<any[]>([])
  const [searchComplemento, setSearchComplemento] = useState("")
  const [showComplementosResults, setShowComplementosResults] = useState(false)
  const complementosSearchRef = useRef<HTMLDivElement>(null)

  // Carregar catálogo de complementos
  useEffect(() => {
    const loadCatalogo = async () => {
      try {
        const response = await complementosApi.listar({ ativo: true })
        if (response.success && response.data) {
          setCatalogoComplementos(response.data)
        }
      } catch (error) {
        console.error('Erro ao carregar catálogo:', error)
      }
    }
    loadCatalogo()
  }, [])

  // Carregar orçamento para edição
  useEffect(() => {
    if (orcamentoId) {
      loadOrcamentoForEdit(orcamentoId)
    }
  }, [orcamentoId])

  // Fechar resultados de complementos quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (complementosSearchRef.current && !complementosSearchRef.current.contains(event.target as Node)) {
        setShowComplementosResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadOrcamentoForEdit = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await getOrcamento(parseInt(id))
      if (response.success && response.data) {
        const orcamento = response.data
        setIsEditMode(true)
        
        setFormData({
          cliente_id: orcamento.cliente_id?.toString() || '',
          cliente_nome: orcamento.clientes?.nome || '',
          numero_proposta: orcamento.numero || '',
          data: orcamento.data_orcamento ? new Date(orcamento.data_orcamento).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          periodo_locacao_inicio: '',
          periodo_locacao_fim: '',
          tem_grua_nossa: !!orcamento.obra_id,
          obra_id: orcamento.obra_id?.toString() || '',
          obra_nome: orcamento.obra_nome || '',
          tipo_transacao: orcamento.tipo_orcamento === 'venda' ? 'venda' : 'locacao',
          valor_frete: 0,
          observacoes: orcamento.observacoes || ''
        })

        // Carregar itens do orçamento
        if (orcamento.itens && orcamento.itens.length > 0) {
          const itensComplementos: ComplementoItem[] = orcamento.itens.map((item: any) => ({
            id: item.id?.toString(),
            nome: item.produto_servico || '',
            codigo: item.codigo || '',
            estado: item.estado || 'novo',
            medida_capacidade: item.medida_capacidade || '',
            quantidade: item.quantidade || 1,
            peso: item.peso || 0,
            preco_unitario: item.valor_unitario || 0,
            preco_total: item.valor_total || 0,
            frete: item.frete || 'CIF',
            icms_percentual: item.icms_percentual || 0,
            desconto_percentual: item.desconto_percentual || 0,
            observacoes: item.observacoes || ''
          }))
          setComplementos(itensComplementos)
        }

        // Carregar cliente e obra se existirem
        if (orcamento.cliente_id) {
          setClienteSelecionado({
            id: orcamento.cliente_id,
            name: orcamento.clientes?.nome || '',
            nome: orcamento.clientes?.nome || ''
          })
        }

        if (orcamento.obra_id) {
          try {
            const obraResponse = await obrasApi.obterObra(orcamento.obra_id)
            if (obraResponse.success && obraResponse.data) {
              setObraSelecionada(obraResponse.data)
            }
          } catch (error) {
            console.error('Erro ao carregar obra:', error)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o orçamento",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    setFormData({
      ...formData,
      cliente_id: cliente.id.toString(),
      cliente_nome: cliente.name || cliente.nome
    })
  }

  const handleObraSelect = (obra: any) => {
    setObraSelecionada(obra)
    setFormData({
      ...formData,
      obra_id: obra.id.toString(),
      obra_nome: obra.nome,
      tem_grua_nossa: true
    })
  }

  const handleAddComplemento = (complementoCatalogo?: any) => {
    const novoComplemento: ComplementoItem = {
      nome: complementoCatalogo?.nome || '',
      codigo: complementoCatalogo?.sku || '',
      estado: 'novo',
      medida_capacidade: '',
      quantidade: 1,
      peso: 0,
      preco_unitario: complementoCatalogo ? (complementoCatalogo.preco_unitario_centavos / 100) : 0,
      preco_total: 0,
      frete: 'CIF',
      icms_percentual: 0,
      desconto_percentual: 0,
      observacoes: ''
    }
    
    novoComplemento.preco_total = calcularPrecoTotal(novoComplemento)
    setComplementos([...complementos, novoComplemento])
    setSearchComplemento("")
    setShowComplementosResults(false)
  }

  const handleRemoveComplemento = (index: number) => {
    setComplementos(complementos.filter((_, i) => i !== index))
  }

  const handleComplementoChange = (index: number, field: keyof ComplementoItem, value: any) => {
    const updated = [...complementos]
    updated[index] = { ...updated[index], [field]: value }
    
    // Recalcular preço total quando quantidade, preço unitário, ICMS ou desconto mudar
    if (field === 'quantidade' || field === 'preco_unitario' || field === 'icms_percentual' || field === 'desconto_percentual') {
      updated[index].preco_total = calcularPrecoTotal(updated[index])
    }
    
    setComplementos(updated)
  }

  const calcularPrecoTotal = (complemento: ComplementoItem): number => {
    const valorBase = complemento.preco_unitario * complemento.quantidade
    const valorComDesconto = valorBase * (1 - complemento.desconto_percentual / 100)
    const valorComICMS = valorComDesconto * (1 + complemento.icms_percentual / 100)
    return valorComICMS
  }

  const calcularTotalICMS = () => {
    return complementos.reduce((total, comp) => {
      const valorBase = comp.preco_unitario * comp.quantidade
      const valorComDesconto = valorBase * (1 - comp.desconto_percentual / 100)
      const valorICMS = valorComDesconto * (comp.icms_percentual / 100)
      return total + valorICMS
    }, 0)
  }

  const calcularTotalGeral = () => {
    const totalItens = complementos.reduce((sum, comp) => sum + comp.preco_total, 0)
    return totalItens + formData.valor_frete
  }

  const handleSave = async (isDraft: boolean = false) => {
    try {
      setIsSaving(true)

      // Validações
      if (!isDraft) {
        if (!clienteSelecionado) {
          toast({
            title: "Erro",
            description: "Selecione um cliente",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }

        if (complementos.length === 0) {
          toast({
            title: "Erro",
            description: "Adicione pelo menos um item de complemento",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }

        if (formData.tem_grua_nossa && !obraSelecionada) {
          toast({
            title: "Erro",
            description: "Selecione uma obra quando tiver grua nossa",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }
      }

      // Gerar número do orçamento
      let numero = formData.numero_proposta
      if (!numero) {
        const hoje = new Date()
        numero = `COMP-${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      }

      const valorTotal = calcularTotalGeral()
      const dataValidade = new Date(formData.data)
      dataValidade.setDate(dataValidade.getDate() + 30)

      const orcamentoData = {
        cliente_id: parseInt(formData.cliente_id),
        data_orcamento: formData.data,
        data_validade: dataValidade.toISOString().split('T')[0],
        valor_total: valorTotal,
        desconto: 0,
        observacoes: formData.observacoes,
        status: isDraft ? 'rascunho' : 'enviado',
        tipo_orcamento: formData.tipo_transacao === 'venda' ? 'venda' : 'equipamento',
        numero: numero,
        obra_id: formData.tem_grua_nossa && formData.obra_id ? parseInt(formData.obra_id) : null,
        obra_nome: formData.obra_nome || '',
        itens: complementos.map(comp => ({
          produto_servico: comp.nome,
          descricao: `${comp.codigo} - ${comp.medida_capacidade} - ${comp.estado}`,
          quantidade: comp.quantidade,
          valor_unitario: comp.preco_unitario,
          valor_total: comp.preco_total,
          tipo: 'equipamento' as const,
          unidade: 'unidade',
          observacoes: comp.observacoes,
          // Campos específicos de complementos
          codigo: comp.codigo,
          estado: comp.estado,
          medida_capacidade: comp.medida_capacidade,
          peso: comp.peso,
          frete: comp.frete,
          icms_percentual: comp.icms_percentual,
          desconto_percentual: comp.desconto_percentual
        }))
      }

      let response
      if (isEditMode && orcamentoId) {
        response = await updateOrcamento(parseInt(orcamentoId), orcamentoData)
      } else {
        response = await createOrcamento(orcamentoData)
      }

      if (response.success) {
        toast({
          title: "Sucesso",
          description: isDraft ? "Rascunho salvo com sucesso" : "Orçamento salvo com sucesso",
        })
        router.push('/dashboard/orcamentos')
      } else {
        throw new Error(response.message || 'Erro ao salvar orçamento')
      }
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o orçamento",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const complementosFiltrados = catalogoComplementos.filter(comp =>
    comp.nome.toLowerCase().includes(searchComplemento.toLowerCase()) ||
    comp.sku?.toLowerCase().includes(searchComplemento.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/orcamentos')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Orçamento de Complementos</h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Editando orçamento' : 'Novo orçamento de complementos'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Orçamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 orcamento-complementos-grid">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Cliente *</Label>
                <ClienteSearch
                  onClienteSelect={handleClienteSelect}
                  selectedCliente={clienteSelecionado}
                  placeholder="Buscar cliente..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações do Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Número da Proposta</Label>
                  <Input
                    value={formData.numero_proposta}
                    onChange={(e) => setFormData({ ...formData, numero_proposta: e.target.value })}
                    placeholder="Será gerado automaticamente se vazio"
                  />
                </div>
                <div>
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Período de Locação - Início</Label>
                  <Input
                    type="date"
                    value={formData.periodo_locacao_inicio}
                    onChange={(e) => setFormData({ ...formData, periodo_locacao_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Período de Locação - Fim</Label>
                  <Input
                    type="date"
                    value={formData.periodo_locacao_fim}
                    onChange={(e) => setFormData({ ...formData, periodo_locacao_fim: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Tem Grua Nossa?</Label>
                <Select
                  value={formData.tem_grua_nossa ? 'sim' : 'nao'}
                  onValueChange={(value) => {
                    const temGrua = value === 'sim'
                    setFormData({
                      ...formData,
                      tem_grua_nossa: temGrua,
                      obra_id: temGrua ? formData.obra_id : '',
                      obra_nome: temGrua ? formData.obra_nome : ''
                    })
                    if (!temGrua) {
                      setObraSelecionada(null)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tem_grua_nossa && (
                <div>
                  <Label>Selecione a Obra *</Label>
                  <ObraSearch
                    onObraSelect={handleObraSelect}
                    selectedObra={obraSelecionada}
                    placeholder="Buscar obra..."
                  />
                </div>
              )}

              {!formData.tem_grua_nossa && (
                <div>
                  <Label>Tipo de Transação *</Label>
                  <Select
                    value={formData.tipo_transacao}
                    onValueChange={(value) => setFormData({ ...formData, tipo_transacao: value as 'locacao' | 'venda' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="locacao">Locação</SelectItem>
                      <SelectItem value="venda">Venda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens de Complementos */}
          <Card>
            <CardHeader>
              <CardTitle>Itens de Complementos</CardTitle>
              <CardDescription>Adicione os complementos do orçamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Busca de Complementos */}
              <div className="relative" ref={complementosSearchRef}>
                <Input
                  placeholder="Buscar complemento por nome ou código..."
                  value={searchComplemento}
                  onChange={(e) => {
                    setSearchComplemento(e.target.value)
                    setShowComplementosResults(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowComplementosResults(searchComplemento.length > 0)}
                />
                {showComplementosResults && complementosFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {complementosFiltrados.map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleAddComplemento(comp)}
                      >
                        <div className="font-medium">{comp.nome}</div>
                        <div className="text-sm text-gray-500">{comp.sku}</div>
                        <div className="text-sm text-gray-500">R$ {(comp.preco_unitario_centavos / 100).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddComplemento()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item Manualmente
              </Button>

              {/* Lista de Complementos */}
              <div className="space-y-4">
                {complementos.map((comp, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveComplemento(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Item / Código *</Label>
                        <Input
                          value={comp.nome}
                          onChange={(e) => handleComplementoChange(index, 'nome', e.target.value)}
                          placeholder="Nome do item"
                        />
                      </div>
                      <div>
                        <Label>Código</Label>
                        <Input
                          value={comp.codigo}
                          onChange={(e) => handleComplementoChange(index, 'codigo', e.target.value)}
                          placeholder="Código do item"
                        />
                      </div>
                      <div>
                        <Label>Estado *</Label>
                        <Select
                          value={comp.estado}
                          onValueChange={(value) => handleComplementoChange(index, 'estado', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="usado">Usado</SelectItem>
                            <SelectItem value="recondicionado">Recondicionado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Medida / Capacidade</Label>
                        <Input
                          value={comp.medida_capacidade}
                          onChange={(e) => handleComplementoChange(index, 'medida_capacidade', e.target.value)}
                          placeholder="Ex: 2m, 500kg"
                        />
                      </div>
                      <div>
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={comp.quantidade}
                          onChange={(e) => handleComplementoChange(index, 'quantidade', parseFloat(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label>Peso (kg)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={comp.peso}
                          onChange={(e) => handleComplementoChange(index, 'peso', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Preço Unitário (R$) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={comp.preco_unitario}
                          onChange={(e) => handleComplementoChange(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Preço Total (R$)</Label>
                        <Input
                          type="number"
                          value={comp.preco_total.toFixed(2)}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      <div>
                        <Label>Frete</Label>
                        <Select
                          value={comp.frete}
                          onValueChange={(value) => handleComplementoChange(index, 'frete', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CIF">CIF</SelectItem>
                            <SelectItem value="FOB">FOB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>ICMS (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={comp.icms_percentual}
                          onChange={(e) => handleComplementoChange(index, 'icms_percentual', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Desconto sobre a Venda (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={comp.desconto_percentual}
                          onChange={(e) => handleComplementoChange(index, 'desconto_percentual', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={comp.observacoes}
                          onChange={(e) => handleComplementoChange(index, 'observacoes', e.target.value)}
                          placeholder="Observações sobre este item"
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Observações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações gerais do orçamento"
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Resumo */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal Itens:</span>
                  <span className="font-medium">
                    R$ {complementos.reduce((sum, comp) => sum + comp.preco_total, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor do ICMS:</span>
                  <span className="font-medium">
                    R$ {calcularTotalICMS().toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Valor do Frete (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_frete}
                    onChange={(e) => setFormData({ ...formData, valor_frete: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">
                      R$ {calcularTotalGeral().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Garantia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                3 meses contra defeitos de fabricação
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

