"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  Calculator,
  Save,
  Check,
  ChevronsUpDown,
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { itensCustosMensaisApi, ItemCustoMensal } from "@/lib/api-itens-custos-mensais"
import { medicoesMensaisApi, MedicaoMensalCreate } from "@/lib/api-medicoes-mensais"

interface CustoMensalForm {
  item: string
  descricao: string
  unidade: 'mês' | 'und' | 'und.' | 'km' | 'h' | 'hora' | 'kg' | 'm²' | 'm³'
  tipo: 'contrato' | 'aditivo'
  quantidade_orcamento: number
  valor_unitario: number
  valor_total: number
}

interface Grua {
  id: string | number
  name: string
  modelo?: string
  fabricante?: string
}

interface Obra {
  id: number
  nome: string
  cliente_id?: number
  status?: string
}

export default function NovaMedicaoPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [obras, setObras] = useState<Obra[]>([])
  const [gruas, setGruas] = useState<Grua[]>([])
  const [loadingObras, setLoadingObras] = useState(false)
  const [loadingGruas, setLoadingGruas] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [obraSearchOpen, setObraSearchOpen] = useState(false)
  
  // Estados para itens de custos mensais
  const [itens, setItens] = useState<ItemCustoMensal[]>([])
  const [loadingItens, setLoadingItens] = useState(false)
  const [itemSearchOpen, setItemSearchOpen] = useState(false)
  const [itemSearchValue, setItemSearchValue] = useState("")
  const [novoItemDialogOpen, setNovoItemDialogOpen] = useState(false)
  const [salvandoItem, setSalvandoItem] = useState(false)
  const [novoItemForm, setNovoItemForm] = useState({
    codigo: "",
    descricao: "",
    unidade: "mês" as const,
    tipo: "contrato" as const,
    categoria: "" as "" | "funcionario" | "horas_extras" | "servico" | "produto"
  })
  
  // Formulário principal da medição
  const [medicaoForm, setMedicaoForm] = useState({
    obra_id: "",
    grua_id: "",
    numero: "",
    periodo: "",
    data_medicao: new Date().toISOString().split('T')[0],
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
    carregarObras()
    carregarItens()
    // Definir período padrão (mês atual)
    const now = new Date()
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setMedicaoForm(prev => ({ ...prev, periodo }))
  }, [])

  useEffect(() => {
    if (medicaoForm.obra_id) {
      carregarGruasDaObra(parseInt(medicaoForm.obra_id))
    } else {
      setGruas([])
      setMedicaoForm(prev => ({ ...prev, grua_id: "" }))
    }
  }, [medicaoForm.obra_id])

  const carregarObras = async () => {
    try {
      setLoadingObras(true)
      const response = await obrasApi.listarObras({ limit: 1000 })
      if (response.success) {
        setObras(response.data || [])
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao carregar obras",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error("Erro ao carregar obras:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar obras",
        variant: "destructive"
      })
    } finally {
      setLoadingObras(false)
    }
  }

  const carregarGruasDaObra = async (obraId: number) => {
    try {
      setLoadingGruas(true)
      const response = await gruaObraApi.buscarGruasPorObra(obraId)
      if (response.success && response.data) {
        // Extrair as gruas do relacionamento
        const gruasDaObra = response.data
          .filter((relacao: any) => relacao.grua)
          .map((relacao: any) => ({
            id: relacao.grua.id,
            name: relacao.grua.name || relacao.grua.modelo || relacao.grua_id,
            modelo: relacao.grua.modelo,
            fabricante: relacao.grua.fabricante
          }))
        setGruas(gruasDaObra)
      } else {
        setGruas([])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar gruas da obra",
        variant: "destructive"
      })
      setGruas([])
    } finally {
      setLoadingGruas(false)
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

      // Atualizar lista de itens
      await carregarItens()

      // Selecionar o item recém-criado no formulário
      setCustoForm({
        ...custoForm,
        item: itemCriado.codigo,
        descricao: itemCriado.descricao,
        unidade: itemCriado.unidade,
        tipo: itemCriado.tipo
      })

      // Fechar dialog e limpar formulário
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
    
    // Limpar formulário
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const preencherDadosDebug = () => {
    const now = new Date()
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const numero = `MED-DEBUG-${periodo}-${Date.now()}`
    
    // Preencher formulário principal
    setMedicaoForm({
      ...medicaoForm,
      numero: numero,
      periodo: periodo,
      data_medicao: now.toISOString().split('T')[0],
      valor_mensal_bruto: 15000.00,
      valor_aditivos: 2500.00,
      valor_custos_extras: 1200.00,
      valor_descontos: 500.00,
      observacoes: "Dados preenchidos automaticamente para debug e testes do sistema."
    })

    // Adicionar alguns custos mensais de exemplo se houver itens disponíveis
    if (itens.length > 0) {
      const custosExemplo: CustoMensalForm[] = []
      
      // Adicionar até 3 itens de exemplo
      const itensParaAdicionar = itens.slice(0, 3)
      
      itensParaAdicionar.forEach((item, index) => {
        // Garantir que a descrição sempre esteja preenchida
        const descricao = item.descricao || item.codigo || `Item ${index + 1}`
        
        custosExemplo.push({
          item: item.codigo || `ITEM-${index + 1}`,
          descricao: descricao,
          unidade: item.unidade || 'mês',
          tipo: item.tipo || 'contrato',
          quantidade_orcamento: (index + 1) * 2,
          valor_unitario: 1000.00 * (index + 1),
          valor_total: (index + 1) * 2 * 1000.00 * (index + 1)
        })
      })
      
      setCustosMensais(custosExemplo)
      
      // Preencher o formulário de custo mensal com o primeiro item para facilitar adicionar mais
      const primeiroItem = itensParaAdicionar[0]
      const descricaoPrimeiro = primeiroItem.descricao || primeiroItem.codigo || "Item 1"
      setCustoForm({
        item: primeiroItem.codigo || "01.01",
        descricao: descricaoPrimeiro,
        unidade: primeiroItem.unidade || 'mês',
        tipo: primeiroItem.tipo || 'contrato',
        quantidade_orcamento: 2,
        valor_unitario: 1000.00,
        valor_total: 2000.00
      })
    } else {
      // Se não houver itens, criar custos de exemplo com valores padrão
      const custosExemplo: CustoMensalForm[] = [
        {
          item: "01.01",
          descricao: "Locação de Grua - Exemplo 1",
          unidade: "mês",
          tipo: "contrato",
          quantidade_orcamento: 2,
          valor_unitario: 1000.00,
          valor_total: 2000.00
        },
        {
          item: "01.02",
          descricao: "Serviço de Montagem - Exemplo 2",
          unidade: "und",
          tipo: "aditivo",
          quantidade_orcamento: 4,
          valor_unitario: 2000.00,
          valor_total: 8000.00
        },
        {
          item: "01.03",
          descricao: "Manutenção Preventiva - Exemplo 3",
          unidade: "hora",
          tipo: "contrato",
          quantidade_orcamento: 6,
          valor_unitario: 3000.00,
          valor_total: 18000.00
        }
      ]
      
      setCustosMensais(custosExemplo)
      
      // Preencher o formulário de custo mensal com um exemplo
      setCustoForm({
        item: "01.01",
        descricao: "Locação de Grua - Exemplo 1",
        unidade: "mês",
        tipo: "contrato",
        quantidade_orcamento: 2,
        valor_unitario: 1000.00,
        valor_total: 2000.00
      })
    }

    toast({
      title: "Dados Preenchidos",
      description: "Todos os campos foram preenchidos com valores de exemplo (exceto obra e grua)",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!medicaoForm.obra_id) {
      toast({
        title: "Erro",
        description: "Selecione uma obra",
        variant: "destructive"
      })
      return
    }

    if (!medicaoForm.grua_id) {
      toast({
        title: "Erro",
        description: "Selecione uma grua",
        variant: "destructive"
      })
      return
    }

    if (!medicaoForm.periodo || !medicaoForm.data_medicao) {
      toast({
        title: "Erro",
        description: "Preencha período e data da medição",
        variant: "destructive"
      })
      return
    }

    try {
      setSalvando(true)

      // Extrair mês e ano do período
      const [ano, mes] = medicaoForm.periodo.split('-')
      
      // Gerar número da medição se não fornecido
      const numero = medicaoForm.numero || `MED-${medicaoForm.periodo}-${Date.now()}`

      // Converter custos mensais para o formato da API
      const custosMensaisApi = custosMensais.map(custo => ({
        tipo: custo.tipo,
        descricao: `${custo.item} - ${custo.descricao}`,
        valor_mensal: custo.valor_unitario,
        quantidade_meses: custo.quantidade_orcamento,
        valor_total: calcularTotalOrcamento(),
        observacoes: `Unidade: ${custo.unidade} | Quantidade Realizada: ${custo.quantidade_realizada} | Quantidade Acumulada: ${custo.quantidade_acumulada} | Valor Acumulado: ${formatCurrency(custo.valor_acumulado)}`
      }))

      // Calcular valor total
      const valorTotal = medicaoForm.valor_mensal_bruto + 
                        medicaoForm.valor_aditivos + 
                        medicaoForm.valor_custos_extras - 
                        medicaoForm.valor_descontos

      const medicaoData: MedicaoMensalCreate = {
        obra_id: parseInt(medicaoForm.obra_id),
        grua_id: medicaoForm.grua_id as any,
        numero,
        periodo: medicaoForm.periodo,
        data_medicao: medicaoForm.data_medicao,
        mes_referencia: parseInt(mes),
        ano_referencia: parseInt(ano),
        valor_mensal_bruto: medicaoForm.valor_mensal_bruto,
        valor_aditivos: medicaoForm.valor_aditivos,
        valor_custos_extras: medicaoForm.valor_custos_extras,
        valor_descontos: medicaoForm.valor_descontos,
        status: "pendente",
        observacoes: medicaoForm.observacoes,
        custos_mensais: custosMensaisApi.length > 0 ? custosMensaisApi : undefined
      }

      const response = await medicoesMensaisApi.criar(medicaoData)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição criada com sucesso"
        })
        router.push('/dashboard/medicoes')
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar medição",
        variant: "destructive"
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova Medição</h1>
            <p className="text-gray-600">Crie uma nova medição vinculada a uma grua</p>
          </div>
        </div>
        <Button 
          type="button"
          variant="outline" 
          onClick={preencherDadosDebug}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Preencher Dados
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Informações Básicas da Medição */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="obra_id" className="text-xs">Obra *</Label>
                <Popover open={obraSearchOpen} onOpenChange={setObraSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={obraSearchOpen}
                      className="w-full justify-between h-8 text-sm bg-white"
                      disabled={loadingObras}
                    >
                      {medicaoForm.obra_id
                        ? obras.find((obra) => String(obra.id) === medicaoForm.obra_id)?.nome
                        : loadingObras ? "Carregando obras..." : "Selecione uma obra"}
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar obra..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma obra encontrada.</CommandEmpty>
                        <CommandGroup>
                          {obras.map((obra) => (
                              <CommandItem
                                key={obra.id}
                                value={obra.nome}
                                onSelect={() => {
                                  setMedicaoForm({ ...medicaoForm, obra_id: String(obra.id), grua_id: "" })
                                  setObraSearchOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    medicaoForm.obra_id === String(obra.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <Building2 className="mr-2 h-4 w-4" />
                                {obra.nome}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="grua_id" className="text-xs">Grua *</Label>
                <Select
                  value={medicaoForm.grua_id}
                  onValueChange={(value) => setMedicaoForm({ ...medicaoForm, grua_id: value })}
                  required
                  disabled={!medicaoForm.obra_id || loadingGruas}
                >
                  <SelectTrigger className="bg-white h-8 text-sm">
                    <SelectValue 
                      placeholder={
                        !medicaoForm.obra_id 
                          ? "Selecione uma obra primeiro" 
                          : loadingGruas 
                          ? "Carregando gruas..." 
                          : gruas.length === 0
                          ? "Nenhuma grua encontrada"
                          : "Selecione uma grua"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {gruas.map((grua) => (
                      <SelectItem key={grua.id} value={String(grua.id)}>
                        {grua.name} {grua.modelo && `- ${grua.modelo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              <div>
                <Label htmlFor="numero" className="text-xs">Número</Label>
                <Input
                  id="numero"
                  value={medicaoForm.numero}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, numero: e.target.value })}
                  placeholder="Auto-gerado se vazio"
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="periodo" className="text-xs">Período (YYYY-MM) *</Label>
                <Input
                  id="periodo"
                  type="text"
                  placeholder="2025-01"
                  value={medicaoForm.periodo}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9-]/g, '')
                    if (value.length <= 7) {
                      setMedicaoForm({ ...medicaoForm, periodo: value })
                    }
                  }}
                  pattern="\d{4}-\d{2}"
                  required
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="data_medicao" className="text-xs">Data da Medição *</Label>
                <Input
                  id="data_medicao"
                  type="date"
                  value={medicaoForm.data_medicao}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, data_medicao: e.target.value })}
                  required
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="valor_mensal_bruto" className="text-xs">Valor Mensal Bruto (R$)</Label>
                <Input
                  id="valor_mensal_bruto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_mensal_bruto === 0 ? '' : medicaoForm.valor_mensal_bruto}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, valor_mensal_bruto: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="valor_aditivos" className="text-xs">Valor Aditivos (R$)</Label>
                <Input
                  id="valor_aditivos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_aditivos === 0 ? '' : medicaoForm.valor_aditivos}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, valor_aditivos: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="valor_custos_extras" className="text-xs">Custos Extras (R$)</Label>
                <Input
                  id="valor_custos_extras"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_custos_extras === 0 ? '' : medicaoForm.valor_custos_extras}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, valor_custos_extras: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="valor_descontos" className="text-xs">Descontos (R$)</Label>
                <Input
                  id="valor_descontos"
                  type="number"
                  step="0.01"
                  min="0"
                  value={medicaoForm.valor_descontos === 0 ? '' : medicaoForm.valor_descontos}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, valor_descontos: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="bg-white h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="observacoes" className="text-xs">Observações</Label>
              <Textarea
                id="observacoes"
                value={medicaoForm.observacoes}
                onChange={(e) => setMedicaoForm({ ...medicaoForm, observacoes: e.target.value })}
                placeholder="Observações sobre a medição..."
                rows={2}
                className="bg-white text-sm"
              />
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
                Criar Medição
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
