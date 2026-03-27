"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Download,
  Upload,
  FileText,
  Calculator,
  Save,
  Check,
  ChevronsUpDown,
  Building2,
  AlertCircle,
  X,
  Receipt,
  Edit,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { gruasApi } from "@/lib/api-gruas"
import { obrasApi } from "@/lib/api-obras"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { itensCustosMensaisApi, ItemCustoMensal } from "@/lib/api-itens-custos-mensais"
import { medicoesMensaisApi, MedicaoMensalCreate } from "@/lib/api-medicoes-mensais"
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

interface Grua {
  id: string | number
  codigo?: string
  name: string
  tipo?: string
  modelo?: string
  fabricante?: string
}

interface Obra {
  id: number
  nome: string
  cliente_id?: number
  clientes?: {
    nome?: string
  }
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
  const [error, setError] = useState<string | null>(null)
  const [arquivoPdfMedicao, setArquivoPdfMedicao] = useState<File | null>(null)
  const [arquivosAdicionaisMedicao, setArquivosAdicionaisMedicao] = useState<File[]>([])
  const pdfMedicaoInputRef = useRef<HTMLInputElement | null>(null)
  const anexosAdicionaisInputRef = useRef<HTMLInputElement | null>(null)

  const tiposArquivoPermitidos = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ]
  const acceptArquivosMedicao = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
  
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
    data_inicio_emissao: new Date().toISOString().split('T')[0],
    data_fim_emissao: new Date().toISOString().split('T')[0],
    valor_mensal_bruto: 0,
    valor_aditivos: 0,
    valor_custos_extras: 0,
    valor_descontos: 0,
    observacoes: ""
  })
  const obraSelecionada = obras.find((obra) => String(obra.id) === medicaoForm.obra_id)
  const clienteMedicao = obraSelecionada?.clientes?.nome || (obraSelecionada?.cliente_id ? `Cliente ID ${obraSelecionada.cliente_id}` : "")

  const calcularTotalDiasEmissao = (dataInicio: string, dataFim: string) => {
    if (!dataInicio || !dataFim) return 0
    const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number)
    const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number)
    const inicio = new Date(anoInicio, mesInicio - 1, diaInicio)
    const fim = new Date(anoFim, mesFim - 1, diaFim)
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim < inicio) return 0
    const diffMs = fim.getTime() - inicio.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
  }

  const totalDiasEmissao = calcularTotalDiasEmissao(
    medicaoForm.data_inicio_emissao,
    medicaoForm.data_fim_emissao
  )

  const periodoMedicao = medicaoForm.data_fim_emissao
    ? medicaoForm.data_fim_emissao.slice(0, 7)
    : new Date().toISOString().slice(0, 7)
  
  // Lista de custos mensais
  const [custosMensais, setCustosMensais] = useState<CustoMensalForm[]>([])
  const [isCustoDialogOpen, setIsCustoDialogOpen] = useState(false)
  const [editingCustoIndex, setEditingCustoIndex] = useState<number | null>(null)
  /** Elemento do painel do dialog de custo — portal do Popover de itens fica aqui dentro (evita bloqueio de clique pelo Dialog). */
  const [custoDialogContentEl, setCustoDialogContentEl] = useState<HTMLDivElement | null>(null)

  const custoFormInicial: CustoMensalForm = {
    item: "",
    descricao: "",
    unidade: "mês",
    tipo: "contrato",
    quantidade_orcamento: 0,
    valor_unitario: 0,
    valor_total: 0
  }
  
  // Formulário de novo custo mensal
  const [custoForm, setCustoForm] = useState<CustoMensalForm>({ ...custoFormInicial })

  useEffect(() => {
    carregarObras()
    carregarItens()
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

  const carregarGruasDaObra = async (obraId: number): Promise<Grua[]> => {
    try {
      setLoadingGruas(true)
      const response = await gruaObraApi.buscarGruasPorObra(obraId)
      if (response.success && response.data) {
        const montarNomeGrua = (relacao: any) => {
          const codigo = String(relacao?.grua_id || relacao?.grua?.id || '').trim()
          const tipo = String(relacao?.grua?.tipo || '').trim()
          const modelo = String(relacao?.grua?.modelo || '').trim()

          const base = [codigo, tipo].filter(Boolean).join(' - ')
          if (base && modelo) return `${base} (${modelo})`
          if (base) return base
          return modelo || 'Grua sem identificação'
        }

        // Extrair as gruas do relacionamento
        const gruasDaObra = response.data
          .filter((relacao: any) => relacao.grua)
          .map((relacao: any) => ({
            id: relacao.grua_id || relacao.grua.id,
            codigo: relacao.grua_id || relacao.grua.id,
            name: montarNomeGrua(relacao),
            tipo: relacao.grua.tipo,
            modelo: relacao.grua.modelo,
            fabricante: relacao.grua.fabricante
          }))
        setGruas(gruasDaObra)
        return gruasDaObra
      }
      setGruas([])
      return []
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar gruas da obra",
        variant: "destructive"
      })
      setGruas([])
      return []
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

    if (editingCustoIndex !== null) {
      const proxima = [...custosMensais]
      proxima[editingCustoIndex] = novoCusto
      setCustosMensais(proxima)
      setEditingCustoIndex(null)
    } else {
      setCustosMensais([...custosMensais, novoCusto])
    }

    setCustoForm({ ...custoFormInicial })
    setIsCustoDialogOpen(false)
  }

  const abrirDialogNovoCusto = () => {
    setEditingCustoIndex(null)
    setCustoForm({ ...custoFormInicial })
    setIsCustoDialogOpen(true)
  }

  const abrirDialogEditarCusto = (index: number) => {
    const custo = custosMensais[index]
    if (!custo) return
    setEditingCustoIndex(index)
    setCustoForm({ ...custo })
    setIsCustoDialogOpen(true)
  }

  const preencherDadosCustoMensal = () => {
    const itemSelecionado = itens.find((item) => item.codigo === custoForm.item)
    const itemBase = itemSelecionado || itens[0]

    setCustoForm((prev) => ({
      ...prev,
      item: prev.item || itemBase?.codigo || "ITEM-TESTE",
      descricao: prev.descricao || itemBase?.descricao || "Item Custo Mensal Teste",
      unidade: itemBase?.unidade || prev.unidade || "mês",
      tipo: itemBase?.tipo || prev.tipo || "contrato",
      quantidade_orcamento: prev.quantidade_orcamento > 0 ? prev.quantidade_orcamento : 1,
      valor_unitario: prev.valor_unitario > 0 ? prev.valor_unitario : 1000,
      valor_total: 0
    }))
  }

  const removerCustoMensal = (index: number) => {
    setCustosMensais(custosMensais.filter((_, i) => i !== index))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const adicionarArquivosAdicionais = (files: File[]) => {
    const arquivosInvalidos = files.filter((file) => !tiposArquivoPermitidos.includes(file.type))
    if (arquivosInvalidos.length > 0) {
      toast({
        title: "Erro",
        description: "Um ou mais arquivos têm tipo não permitido. Use PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG ou GIF.",
        variant: "destructive"
      })
      return
    }

    setArquivosAdicionaisMedicao((prev) => {
      const mapa = new Map<string, File>()
      ;[...prev, ...files].forEach((file) => {
        const chave = `${file.name}-${file.size}-${file.lastModified}`
        mapa.set(chave, file)
      })
      return Array.from(mapa.values())
    })
  }

  const removerArquivoAdicional = (index: number) => {
    setArquivosAdicionaisMedicao((prev) => prev.filter((_, i) => i !== index))
  }

  const abrirArquivoAdicional = (file: File) => {
    const url = URL.createObjectURL(file)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const limparPdfMedicao = () => {
    setArquivoPdfMedicao(null)
    if (pdfMedicaoInputRef.current) {
      pdfMedicaoInputRef.current.value = ''
    }
  }

  /** PDF mínimo para testes (upload do documento obrigatório) */
  const criarArquivoPdfPlaceholder = () => {
    const conteudo = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj
trailer<</Size 4/Root 1 0 R>>
%%EOF`
    return new File([conteudo], "medicao-preenchimento-automatico.pdf", { type: "application/pdf" })
  }

  const preencherDadosDebug = async () => {
    const now = new Date()
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const numero = `MED-DEBUG-${periodo}-${Date.now()}`

    let obraIdStr = medicaoForm.obra_id?.trim() || ""
    if (!obraIdStr && obras.length > 0) {
      obraIdStr = String(obras[0].id)
    }

    let gruaIdStr = medicaoForm.grua_id?.trim() || ""
    if (obraIdStr) {
      const listaGruas = await carregarGruasDaObra(parseInt(obraIdStr, 10))
      if (!gruaIdStr && listaGruas.length > 0) {
        gruaIdStr = String(listaGruas[0].id)
      }
    }

    // Preencher formulário principal
    setMedicaoForm((prev) => ({
      ...prev,
      obra_id: obraIdStr || prev.obra_id,
      grua_id: gruaIdStr || prev.grua_id,
      numero,
      data_inicio_emissao: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      data_fim_emissao: now.toISOString().split("T")[0],
      valor_mensal_bruto: 15000.0,
      valor_aditivos: 2500.0,
      valor_custos_extras: 1200.0,
      valor_descontos: 500.0,
      observacoes: "Dados preenchidos automaticamente para testes (botão Preencher dados)."
    }))

    setArquivoPdfMedicao(criarArquivoPdfPlaceholder())

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

    const partesDesc: string[] = ["Número, valores, custos e PDF de exemplo."]
    if (obraIdStr) partesDesc.push("Obra selecionada.")
    else partesDesc.push("Cadastre uma obra ou selecione manualmente.")
    if (gruaIdStr) partesDesc.push("Grua selecionada.")
    else if (obraIdStr) partesDesc.push("Nenhuma grua na obra — vincule uma grua à obra ou escolha manualmente.")

    toast({
      title: "Dados preenchidos",
      description: partesDesc.join(" "),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação de campos obrigatórios - listar todos os campos faltantes
    const camposFaltando: string[] = []

    if (!medicaoForm.obra_id || !medicaoForm.obra_id.trim()) {
      camposFaltando.push('Obra')
    }

    if (!medicaoForm.grua_id || !medicaoForm.grua_id.trim()) {
      camposFaltando.push('Grua')
    }

    if (!medicaoForm.numero || !medicaoForm.numero.trim()) {
      camposFaltando.push('Número da Medição')
    }

    if (!medicaoForm.data_inicio_emissao || !medicaoForm.data_inicio_emissao.trim()) {
      camposFaltando.push('Data Início da Emissão')
    }

    if (!medicaoForm.data_fim_emissao || !medicaoForm.data_fim_emissao.trim()) {
      camposFaltando.push('Data Fim da Emissão')
    }

    if (
      medicaoForm.data_inicio_emissao &&
      medicaoForm.data_fim_emissao &&
      medicaoForm.data_fim_emissao < medicaoForm.data_inicio_emissao
    ) {
      camposFaltando.push('Faixa de Emissão válida (fim deve ser maior ou igual ao início)')
    }

    if (totalDiasEmissao <= 0) {
      camposFaltando.push('Total de Dias da Emissão')
    }
    if (!arquivoPdfMedicao) {
      camposFaltando.push('Documento da Medição')
    }

    if (camposFaltando.length > 0) {
      // Prevenir o comportamento padrão do formulário (scroll automático)
      e.stopPropagation()
      
      // Mostrar mensagem de erro de forma mais visível
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000, // Manter visível por mais tempo
      })
      
      // Também mostrar um alerta visual no topo do formulário
      setError(camposFaltando.length === 1 
        ? `Campo obrigatório faltando: ${camposFaltando[0]}`
        : `Campos obrigatórios faltando: ${camposFaltando.join(', ')}`)
      
      // Scroll suave para o topo da página para mostrar a mensagem de erro
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      
      return
    }
    
    // Limpar erro se tudo estiver válido
    setError(null)

    try {
      setSalvando(true)

      // Extrair mês e ano com base na data final da emissão
      const [ano, mes] = periodoMedicao.split('-')
      
      const numero = medicaoForm.numero.trim()

      // Converter custos mensais para o formato da API (total por linha, não o formulário de novo custo)
      const custosMensaisApi = custosMensais.map(custo => {
        const totalLinha =
          custo.valor_total ||
          custo.quantidade_orcamento * custo.valor_unitario
        return {
          tipo: custo.tipo,
          descricao: `${custo.item} - ${custo.descricao}`,
          valor_mensal: custo.valor_unitario,
          quantidade_meses: custo.quantidade_orcamento,
          valor_total: totalLinha,
          observacoes: `Unidade: ${custo.unidade} | Quantidade (orçamento): ${custo.quantidade_orcamento} | Valor unitário: ${formatCurrency(custo.valor_unitario)} | Total linha: ${formatCurrency(totalLinha)}`
        }
      })

      // Calcular valor total
      const valorTotal = medicaoForm.valor_mensal_bruto + 
                        medicaoForm.valor_aditivos + 
                        medicaoForm.valor_custos_extras - 
                        medicaoForm.valor_descontos

      const medicaoData: MedicaoMensalCreate = {
        obra_id: parseInt(medicaoForm.obra_id),
        grua_id: medicaoForm.grua_id as any,
        numero,
        periodo: periodoMedicao,
        data_medicao: medicaoForm.data_fim_emissao,
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
      
      if (response.success && response.data?.id) {
        let uploadPrincipalSucesso = true
        let uploadAdicionaisSucesso = true
        try {
          await medicoesMensaisApi.criarDocumento(
            response.data.id,
            {
              tipo_documento: 'medicao_pdf',
              numero_documento: numero,
              observacoes: `Documento da medição ${numero} (${clienteMedicao || 'cliente não informado'})`
            },
            arquivoPdfMedicao || undefined
          )
        } catch (uploadError: any) {
          toast({
            title: "Atenção",
            description: uploadError.response?.data?.message || "Medição criada, mas houve erro no upload do documento principal.",
            variant: "destructive"
          })
          uploadPrincipalSucesso = false
        }

        if (arquivosAdicionaisMedicao.length > 0) {
          try {
            await Promise.all(
              arquivosAdicionaisMedicao.map((arquivo) =>
                medicoesMensaisApi.criarDocumento(
                  response.data.id,
                  {
                    tipo_documento: 'medicao_pdf',
                    numero_documento: numero,
                    observacoes: `Anexo adicional da medição ${numero}: ${arquivo.name}`
                  },
                  arquivo
                )
              )
            )
          } catch (uploadAdicionalError: any) {
            toast({
              title: "Atenção",
              description: uploadAdicionalError.response?.data?.message || "Medição criada, mas houve erro no upload dos anexos adicionais.",
              variant: "destructive"
            })
            uploadAdicionaisSucesso = false
          }
        }
        toast({
          title: "Sucesso",
          description: uploadPrincipalSucesso && uploadAdicionaisSucesso
            ? "Medição criada com documentos enviados com sucesso"
            : "Medição criada. Alguns arquivos podem ser enviados depois na tela de detalhes."
        })
        router.push('/dashboard/medicoes')
      }
    } catch (error: any) {
      // Extrair mensagem do response do backend
      let errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         "Erro ao criar medição"
      
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

  return (
    <div className="space-y-6">
      {salvando && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg border px-6 py-4 flex items-center gap-3">
            <Save className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-semibold">Criando medição...</p>
              <p className="text-xs text-gray-500">Aguarde enquanto os dados e arquivos são enviados.</p>
            </div>
          </div>
        </div>
      )}
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
          onClick={() => void preencherDadosDebug()}
          disabled={loadingObras}
          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
          title="Preenche número, datas, valores, custos de exemplo, PDF placeholder e tenta selecionar primeira obra/grua"
        >
          <Zap className="w-4 h-4 mr-2" />
          Preencher dados
        </Button>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">Campos obrigatórios não preenchidos</h3>
            <p className="text-sm text-destructive/90">{error}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Dados da medição (sem arquivos) */}
        <Card className="overflow-hidden">
          <CardHeader className="space-y-1 border-b bg-muted/30 pb-4">
            <CardTitle className="text-base">Informações da medição</CardTitle>
            <CardDescription>
              Obra, grua, identificação, período de emissão, valores e observações. Os documentos ficam no bloco seguinte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="obra_id" className="text-xs">Medição da Obra *</Label>
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
                        {grua.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Identificação e período de emissão
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div>
                <Label htmlFor="numero" className="text-xs">Número da Medição *</Label>
                <Input
                  id="numero"
                  value={medicaoForm.numero}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, numero: e.target.value })}
                  placeholder="Ex: MED-2026-03-001"
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="data_inicio_emissao" className="text-xs">Data Início Emissão *</Label>
                <Input
                  id="data_inicio_emissao"
                  type="date"
                  value={medicaoForm.data_inicio_emissao}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, data_inicio_emissao: e.target.value })}
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="data_fim_emissao" className="text-xs">Data Fim Emissão *</Label>
                <Input
                  id="data_fim_emissao"
                  type="date"
                  value={medicaoForm.data_fim_emissao}
                  min={medicaoForm.data_inicio_emissao || undefined}
                  onChange={(e) => setMedicaoForm({ ...medicaoForm, data_fim_emissao: e.target.value })}
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="total_dias_emissao" className="text-xs">Total de Dias</Label>
                <Input
                  id="total_dias_emissao"
                  value={totalDiasEmissao > 0 ? `${totalDiasEmissao} dia(s)` : ""}
                  readOnly
                  className="bg-white h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="cliente_medicao" className="text-xs">Medição do Cliente *</Label>
                <Input
                  id="cliente_medicao"
                  value={clienteMedicao}
                  readOnly
                  placeholder="Selecione uma obra para carregar o cliente"
                  className="bg-gray-100 h-8 text-sm"
                />
              </div>
              </div>
            </div>

            <div className="border-t pt-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valores (R$)
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="valor_mensal_bruto" className="text-xs">Valor de Locação (R$)</Label>
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
                <Label htmlFor="valor_aditivos" className="text-xs">Valor de Aditivos (R$)</Label>
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
                <Label htmlFor="valor_custos_extras" className="text-xs">Valor de Serviço (R$)</Label>
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
              <div className="mt-4 max-w-md">
                <Label htmlFor="valor_total_medicao" className="text-xs">Valor Total da Medição</Label>
                <Input
                  id="valor_total_medicao"
                  value={formatCurrency(
                    medicaoForm.valor_mensal_bruto +
                    medicaoForm.valor_aditivos +
                    medicaoForm.valor_custos_extras -
                    medicaoForm.valor_descontos
                  )}
                  readOnly
                  className="h-9 bg-muted/50 text-sm font-semibold tabular-nums"
                />
              </div>
            </div>

            <div className="border-t pt-5">
              <Label htmlFor="observacoes" className="text-xs">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={medicaoForm.observacoes}
                onChange={(e) => setMedicaoForm({ ...medicaoForm, observacoes: e.target.value })}
                placeholder="Observações sobre a medição..."
                rows={3}
                className="mt-1.5 bg-white text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documentos — mesmo padrão visual da tela de detalhes da medição */}
        <Card className="overflow-hidden">
          <CardHeader className="space-y-1 border-b bg-muted/30 pb-4">
            <CardTitle className="text-base">Documentos</CardTitle>
            <CardDescription>
              O documento principal é obrigatório (PDF, Word, Excel ou imagem). Anexos adicionais são opcionais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div
              className={`rounded-lg border p-3 ${arquivoPdfMedicao ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="mb-3 flex items-start gap-2">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Documento da medição</p>
                  {arquivoPdfMedicao ? (
                    <>
                      <p className="truncate text-xs text-gray-600" title={arquivoPdfMedicao.name}>
                        {arquivoPdfMedicao.name}
                      </p>
                      <p className="text-xs text-gray-500">Pronto para envio ao salvar</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">Nenhum arquivo selecionado</p>
                      <p className="text-xs text-muted-foreground">
                        Formatos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG ou GIF
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {arquivoPdfMedicao && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-full text-xs sm:flex-1 sm:min-w-[6.5rem]"
                    onClick={() => abrirArquivoAdicional(arquivoPdfMedicao)}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Abrir
                  </Button>
                )}
                <Button
                  type="button"
                  variant={arquivoPdfMedicao ? 'outline' : 'default'}
                  size="sm"
                  className="h-8 w-full text-xs sm:flex-1 sm:min-w-[6.5rem]"
                  onClick={() => pdfMedicaoInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-3 w-3" />
                  {arquivoPdfMedicao ? 'Substituir' : 'Enviar arquivo'}
                </Button>
                {arquivoPdfMedicao && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-full text-xs text-red-600 border-red-300 hover:bg-red-50 sm:w-auto sm:min-w-[6.5rem]"
                    onClick={limparPdfMedicao}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Remover
                  </Button>
                )}
              </div>
              <Input
                ref={pdfMedicaoInputRef}
                id="pdf_medicao"
                type="file"
                accept={acceptArquivosMedicao}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && !tiposArquivoPermitidos.includes(file.type)) {
                    toast({
                      title: "Erro",
                      description:
                        "Tipo de arquivo não permitido. Use PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG ou GIF.",
                      variant: "destructive",
                    })
                    limparPdfMedicao()
                    return
                  }
                  setArquivoPdfMedicao(file)
                }}
              />
            </div>

            <div
              className={`rounded-lg border p-3 ${arquivosAdicionaisMedicao.length > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="mb-3 flex items-start gap-2">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Anexos adicionais</p>
                  {arquivosAdicionaisMedicao.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-600">{arquivosAdicionaisMedicao.length} arquivo(s)</p>
                      <p className="text-xs text-gray-500">Serão enviados ao salvar a medição</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">Nenhum arquivo selecionado</p>
                      <p className="text-xs text-muted-foreground">
                        Formatos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG ou GIF (múltiplos arquivos)
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant={arquivosAdicionaisMedicao.length > 0 ? 'outline' : 'default'}
                  size="sm"
                  className="h-8 w-full text-xs sm:flex-1 sm:min-w-[6.5rem]"
                  onClick={() => anexosAdicionaisInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-3 w-3" />
                  {arquivosAdicionaisMedicao.length > 0 ? 'Adicionar arquivo' : 'Enviar arquivo'}
                </Button>
              </div>
              <Input
                ref={anexosAdicionaisInputRef}
                id="anexos_medicao"
                type="file"
                multiple
                accept={acceptArquivosMedicao}
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length > 0) {
                    adicionarArquivosAdicionais(files)
                  }
                  e.currentTarget.value = ''
                }}
              />
              {arquivosAdicionaisMedicao.length > 0 && (
                <div className="mt-2 space-y-1">
                  {arquivosAdicionaisMedicao.map((arquivo, index) => (
                    <div
                      key={`${arquivo.name}-${arquivo.size}-${arquivo.lastModified}-${index}`}
                      className="flex items-center justify-between rounded border border-gray-200 bg-white px-2 py-1"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          Anexo {index + 1}: {arquivo.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => abrirArquivoAdicional(arquivo)}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Abrir
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => removerArquivoAdicional(index)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custos Mensais — layout alinhado à NF (lista + dialog) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Custos Mensais
            </CardTitle>
            <CardDescription>
              Adicione os itens de custo desta medição (catálogo, quantidades e valores).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 border-t pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold leading-none">Itens de custo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Selecione itens do catálogo ou cadastre novos. Defina quantidade e valor unitário.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={abrirDialogNovoCusto}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar custo
                </Button>
              </div>

              {custosMensais.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Item / Descrição</TableHead>
                        <TableHead className="w-[90px]">Unidade</TableHead>
                        <TableHead className="w-[90px]">Tipo</TableHead>
                        <TableHead className="w-[100px]">Qtd.</TableHead>
                        <TableHead className="w-[120px]">Valor unit.</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {custosMensais.map((custo, index) => (
                        <TableRow key={`${custo.item}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <span className="font-medium text-muted-foreground text-xs block">{custo.item}</span>
                            <span className="font-medium">{custo.descricao}</span>
                          </TableCell>
                          <TableCell>{custo.unidade}</TableCell>
                          <TableCell className="capitalize">{custo.tipo}</TableCell>
                          <TableCell>{custo.quantidade_orcamento}</TableCell>
                          <TableCell>{formatCurrency(custo.valor_unitario)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(custo.quantidade_orcamento * custo.valor_unitario)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => abrirDialogEditarCusto(index)}
                                title="Editar custo"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerCustoMensal(index)}
                                title="Remover custo"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t bg-muted/50">
                    <div className="flex justify-end">
                      <div className="text-right text-sm">
                        <span className="text-muted-foreground">Total dos custos: </span>
                        <span className="font-semibold">
                          {formatCurrency(
                            custosMensais.reduce(
                              (sum, c) => sum + c.quantidade_orcamento * c.valor_unitario,
                              0
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum custo adicionado</p>
                  <p className="text-sm">Clique em &quot;Adicionar custo&quot; para começar</p>
                </div>
              )}
            </div>

            <Dialog
              open={isCustoDialogOpen}
              onOpenChange={(open) => {
                setIsCustoDialogOpen(open)
                if (!open) {
                  setEditingCustoIndex(null)
                  setCustoForm({ ...custoFormInicial })
                  setCustoDialogContentEl(null)
                  setItemSearchOpen(false)
                }
              }}
            >
              <DialogContent
                ref={setCustoDialogContentEl}
                className="max-w-3xl max-h-[90vh] overflow-y-auto isolate"
                onPointerDownOutside={(e) => {
                  const t = e.target as HTMLElement
                  if (
                    t.closest('[data-slot="popover-content"]') ||
                    t.closest("[data-radix-popover-content]") ||
                    t.closest('[data-slot="command-item"]') ||
                    t.closest("[cmdk-item]")
                  ) {
                    e.preventDefault()
                  }
                }}
                onInteractOutside={(e) => {
                  const t = e.target as HTMLElement
                  if (
                    t.closest('[data-slot="popover-content"]') ||
                    t.closest("[data-radix-popover-content]") ||
                    t.closest('[data-slot="command-item"]') ||
                    t.closest("[cmdk-item]")
                  ) {
                    e.preventDefault()
                  }
                }}
                onFocusOutside={(e) => {
                  const t = e.target as HTMLElement
                  if (
                    t.closest('[data-slot="popover-content"]') ||
                    t.closest("[data-radix-popover-content]") ||
                    t.closest('[data-slot="command-list"]') ||
                    t.closest("[cmdk-list]")
                  ) {
                    e.preventDefault()
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>
                    {editingCustoIndex !== null ? "Editar custo mensal" : "Novo custo mensal"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha o item (catálogo), descrição, unidade, tipo e valores. Use &quot;Novo&quot; para cadastrar um item no catálogo.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Label htmlFor="custo_item" className="text-sm font-medium">
                          Item *
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Popover modal={false} open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={itemSearchOpen}
                              className="flex-1 justify-between h-10 text-sm"
                              disabled={loadingItens}
                            >
                              {custoForm.item
                                ? (() => {
                                    const itemSelecionado = itens.find((item) => item.codigo === custoForm.item)
                                    return itemSelecionado ? itemSelecionado.descricao : custoForm.item
                                  })()
                                : loadingItens
                                  ? "Carregando itens..."
                                  : "Selecione um item"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            container={custoDialogContentEl}
                            className="z-[100] w-[400px] p-0"
                            align="start"
                            sideOffset={4}
                          >
                            <Command shouldFilter={true}>
                              <CommandInput placeholder="Buscar item..." />
                              <CommandList>
                                <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {itens.map((item) => (
                                    <CommandItem
                                      key={item.id}
                                      value={`${item.id} ${item.codigo} ${item.descricao}`}
                                      onPointerDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                      }}
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
                            <Button type="button" variant="outline" size="sm" className="h-10 px-3 shrink-0">
                              <Plus className="h-4 w-4 mr-1" />
                              Novo
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Novo item no catálogo</DialogTitle>
                              <DialogDescription>
                                Cadastre um novo item para usar nas medições
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="novo_item_codigo" className="text-sm font-medium">
                                    Código *
                                  </Label>
                                  <Input
                                    id="novo_item_codigo"
                                    value={novoItemForm.codigo}
                                    onChange={(e) => {
                                      const value = e.target.value.slice(0, 20)
                                      setNovoItemForm({ ...novoItemForm, codigo: value })
                                    }}
                                    placeholder="01.01"
                                    maxLength={20}
                                    className="h-9 mt-1.5"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="novo_item_unidade" className="text-sm font-medium">
                                    Unidade *
                                  </Label>
                                  <Select
                                    value={novoItemForm.unidade}
                                    onValueChange={(value: any) => setNovoItemForm({ ...novoItemForm, unidade: value })}
                                  >
                                    <SelectTrigger className="h-9 mt-1.5">
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
                                <Label htmlFor="novo_item_descricao" className="text-sm font-medium">
                                  Descrição *
                                </Label>
                                <Input
                                  id="novo_item_descricao"
                                  value={novoItemForm.descricao}
                                  onChange={(e) => setNovoItemForm({ ...novoItemForm, descricao: e.target.value })}
                                  placeholder="Locação de grua..."
                                  className="h-9 mt-1.5"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="novo_item_tipo" className="text-sm font-medium">
                                    Tipo *
                                  </Label>
                                  <Select
                                    value={novoItemForm.tipo}
                                    onValueChange={(value: any) => setNovoItemForm({ ...novoItemForm, tipo: value })}
                                  >
                                    <SelectTrigger className="h-9 mt-1.5">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="contrato">Contrato</SelectItem>
                                      <SelectItem value="aditivo">Aditivo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="novo_item_categoria" className="text-sm font-medium">
                                    Categoria
                                  </Label>
                                  <Select
                                    value={novoItemForm.categoria || undefined}
                                    onValueChange={(value: any) =>
                                      setNovoItemForm({ ...novoItemForm, categoria: value as any })
                                    }
                                  >
                                    <SelectTrigger className="h-9 mt-1.5">
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
                              <Button type="button" onClick={criarNovoItem} disabled={salvandoItem}>
                                {salvandoItem ? "Salvando..." : "Criar item"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="custo_descricao" className="text-sm font-medium">
                        Descrição *
                      </Label>
                      <Input
                        id="custo_descricao"
                        value={custoForm.descricao}
                        onChange={(e) => setCustoForm({ ...custoForm, descricao: e.target.value })}
                        placeholder="Locação de grua..."
                        className="h-9 mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="custo_unidade" className="text-sm font-medium">
                        Unidade *
                      </Label>
                      <Select
                        value={custoForm.unidade}
                        onValueChange={(value: any) => setCustoForm({ ...custoForm, unidade: value })}
                      >
                        <SelectTrigger className="h-10 mt-1.5">
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
                      <Label htmlFor="custo_tipo" className="text-sm font-medium">
                        Tipo *
                      </Label>
                      <Select
                        value={custoForm.tipo}
                        onValueChange={(value: any) => setCustoForm({ ...custoForm, tipo: value })}
                      >
                        <SelectTrigger className="h-10 mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="aditivo">Aditivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="custo_quantidade_orcamento" className="text-sm font-medium">
                        Qtd. orç. *
                      </Label>
                      <Input
                        id="custo_quantidade_orcamento"
                        type="number"
                        step="0.01"
                        min="0"
                        value={custoForm.quantidade_orcamento === 0 ? "" : custoForm.quantidade_orcamento}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                          setCustoForm({
                            ...custoForm,
                            quantidade_orcamento: value
                          })
                        }}
                        placeholder="0.00"
                        className="h-9 mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custo_valor_unitario" className="text-sm font-medium">
                        Valor unit. *
                      </Label>
                      <Input
                        id="custo_valor_unitario"
                        type="number"
                        step="0.01"
                        min="0"
                        value={custoForm.valor_unitario === 0 ? "" : custoForm.valor_unitario}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                          setCustoForm({
                            ...custoForm,
                            valor_unitario: value
                          })
                        }}
                        placeholder="0.00"
                        className="h-9 mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total orçamento</Label>
                      <Input
                        value={formatCurrency(calcularTotalOrcamento())}
                        disabled
                        className="h-9 mt-1.5 bg-muted/50"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCustoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                    onClick={preencherDadosCustoMensal}
                    title="Preencher linha do custo com valores de exemplo"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Preencher dados
                  </Button>
                  <Button type="button" onClick={adicionarCustoMensal} className="h-9">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingCustoIndex !== null ? "Salvar alterações" : "Adicionar custo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
