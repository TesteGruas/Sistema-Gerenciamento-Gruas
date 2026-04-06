"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast, toast as toastNotify } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Building2,
  Receipt,
  Download,
  Upload,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  Loader2,
} from "lucide-react"
import { notasFiscaisApi, NotaFiscal, NotaFiscalCreate } from "@/lib/api-notas-fiscais"
import { clientesApi } from "@/lib/api-clientes"
import { fornecedoresApi } from "@/lib/api-fornecedores"
import { medicoesMensaisApi, type MedicaoMensal, type MedicaoDocumento } from "@/lib/api-medicoes-mensais"
import { locacoesApi, Locacao as LocacaoFull } from "@/lib/api-locacoes"
import { gruasApi } from "@/lib/api-gruas"
import { apiCompras } from "@/lib/api-compras"
import { apiContasBancarias, ContaBancaria } from "@/lib/api-contas-bancarias"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DebugButton } from "@/components/debug-button"
import { formatBrlMoneyInputValue, parseBrlMoneyDigitsInput } from "@/lib/medicoes-utils"

interface Cliente {
  id: number
  nome: string
  cnpj?: string
}

interface Fornecedor {
  id: number
  nome: string
  cnpj?: string
}

interface Medicao {
  id: number
  numero: string
  periodo: string
  status_aprovacao?: string | null
}

interface Locacao {
  id: number
  numero: string
  equipamento_id?: string
  tipo_equipamento?: 'grua' | 'plataforma'
  status?: string
}

interface Compra {
  id: number
  numero_pedido?: string
  numero_compra?: string
}

const NF_FROM_MEDICAO_STORAGE_KEY = "sgg_nf_prefill_medicao_id"

/** Alinha ao painel da medição (NF serviço / locação / produto). */
function mapTipoNotaParaDocumentoMedicao(
  tipoNota: string | undefined
): 'nf_servico' | 'nf_locacao' | 'nf_produto' {
  switch (tipoNota) {
    case 'nf_locacao':
      return 'nf_locacao'
    case 'nf_servico':
      return 'nf_servico'
    case 'nf_produto':
    case 'nfe_eletronica':
      return 'nf_produto'
    case 'fatura':
    default:
      return 'nf_servico'
  }
}

/** Usa _1 se vazio; senão _2 (dois boletos por tipo na medição). */
function escolherTipoBoletoMedicao(
  tipoNota: string | undefined,
  docs: MedicaoDocumento[]
): 'boleto_nf_servico_1' | 'boleto_nf_servico_2' | 'boleto_nf_locacao_1' | 'boleto_nf_locacao_2' {
  const isLocacao = tipoNota === 'nf_locacao'
  if (isLocacao) {
    const has1 = docs.some((d) => d.tipo_documento === 'boleto_nf_locacao_1')
    return has1 ? 'boleto_nf_locacao_2' : 'boleto_nf_locacao_1'
  }
  const has1 = docs.some((d) => d.tipo_documento === 'boleto_nf_servico_1')
  return has1 ? 'boleto_nf_servico_2' : 'boleto_nf_servico_1'
}

async function anexarArquivosNotaNaMedicao(opts: {
  medicaoId: number
  notaId: number
  tipoNota: string | undefined
  numeroNf: string
  dataEmissao: string
  dataVencimento: string | null | undefined
  valorTotal: number
  formFile: File | null
  boletoFile: File | null
  anexarBoletoNaMedicao: boolean
}): Promise<void> {
  const docsRes = await medicoesMensaisApi.listarDocumentos(opts.medicaoId)
  const docs = docsRes.success && docsRes.data ? docsRes.data : []

  if (opts.formFile) {
    const tipoDoc = mapTipoNotaParaDocumentoMedicao(opts.tipoNota)
    await medicoesMensaisApi.criarDocumento(
      opts.medicaoId,
      {
        tipo_documento: tipoDoc,
        numero_documento: opts.numeroNf,
        data_emissao: opts.dataEmissao,
        data_vencimento: opts.dataVencimento || null,
        valor: opts.valorTotal,
        status: 'pendente',
        observacoes: `Nota fiscal de saída #${opts.notaId} — NF ${opts.numeroNf}.`
      },
      opts.formFile
    )
  }

  if (opts.anexarBoletoNaMedicao && opts.boletoFile) {
    const tipoBoleto = escolherTipoBoletoMedicao(opts.tipoNota, docs)
    await medicoesMensaisApi.criarDocumento(
      opts.medicaoId,
      {
        tipo_documento: tipoBoleto,
        numero_documento: opts.numeroNf,
        data_emissao: opts.dataEmissao,
        data_vencimento: opts.dataVencimento || null,
        valor: opts.valorTotal,
        status: 'pendente',
        observacoes: `Boleto — NF ${opts.numeroNf} (nota fiscal #${opts.notaId}).`
      },
      opts.boletoFile
    )
  }
}

export default function NotasFiscaisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  /** Valor primitivo — evita reexecutar o efeito a cada render (objeto searchParams muda de referência). */
  const fromMedicaoQuery = searchParams.get("fromMedicao")
  /** Fallback se a query atrasar no primeiro paint ou for perdida na navegação */
  const [medicaoIdFallback, setMedicaoIdFallback] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'saida' | 'entrada'>('saida')
  
  // Estados
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null)
  const [viewingNota, setViewingNota] = useState<NotaFiscal | null>(null)
  const [loadingDetalhesNota, setLoadingDetalhesNota] = useState(false)
  const [viewingItens, setViewingItens] = useState<NotaFiscalItem[]>([])
  const [uploadingNota, setUploadingNota] = useState<NotaFiscal | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formFile, setFormFile] = useState<File | null>(null)

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailNota, setEmailNota] = useState<NotaFiscal | null>(null)
  const [emailExtra, setEmailExtra] = useState("")
  const [incluirEmailsCliente, setIncluirEmailsCliente] = useState(true)
  const [anexarBoletoEmail, setAnexarBoletoEmail] = useState(true)
  const [emailSending, setEmailSending] = useState(false)
  const [exportandoCsv, setExportandoCsv] = useState(false)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tipoNotaFilter, setTipoNotaFilter] = useState("all")
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20
  
  // Dados para formulários
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [locacoes, setLocacoes] = useState<Locacao[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  const [contaBancariaSelecionada, setContaBancariaSelecionada] = useState<number | null>(null)
  /** Seleção no bloco "Importar da medição" (nova NF de saída) */
  const [medicaoIdParaImportar, setMedicaoIdParaImportar] = useState("")
  const [importandoMedicao, setImportandoMedicao] = useState(false)
  /** Salvar criar/editar NF (evita cliques repetidos e mostra feedback) */
  const [salvandoNotaFiscal, setSalvandoNotaFiscal] = useState(false)
  /** Leitura/parsing do XML no diálogo */
  const [parseandoXmlNfe, setParseandoXmlNfe] = useState(false)
  /** Após escolher Serviço vs Locação no diálogo */
  const [dialogEscolhaTipoImportOpen, setDialogEscolhaTipoImportOpen] = useState(false)
  const [medicaoParaEscolherTipo, setMedicaoParaEscolherTipo] = useState<MedicaoMensal | null>(null)
  const [importModoSelecionado, setImportModoSelecionado] = useState<'servico' | 'locacao'>('locacao')
  const [pendingImportCtx, setPendingImportCtx] = useState<{
    abrirDialogoNf: boolean
    origemUrl: boolean
  } | null>(null)
  const ignorarCloseEscolhaImportTipo = useRef(false)

  const medicoesAprovadasListar = useMemo(
    () => medicoes.filter((m) => m.status_aprovacao === 'aprovada'),
    [medicoes]
  )

  // Formulário
  const [formData, setFormData] = useState<NotaFiscalCreate>({
    numero_nf: '',
    serie: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    valor_total: 0,
    tipo: 'saida',
    status: 'pendente',
    tipo_nota: 'nf_servico',
    observacoes: ''
  })

  // Itens da nota fiscal
  interface ImpostoDinamico {
    id: string
    nome: string
    tipo?: string
    tipo_calculo: 'porcentagem' | 'valor_fixo'
    base_calculo: number
    aliquota: number
    valor_fixo?: number
    valor_calculado: number
  }

  interface NotaFiscalItem {
    id?: number
    codigo_produto?: string
    descricao: string
    ncm_sh?: string
    cfop?: string
    unidade: string
    quantidade: number
    preco_unitario: number
    preco_total: number
    csosn?: string
    base_calculo_icms?: number
    percentual_icms?: number
    valor_icms?: number
    percentual_ipi?: number
    valor_ipi?: number
    // Impostos de serviços
    base_calculo_issqn?: number
    aliquota_issqn?: number
    valor_issqn?: number
    valor_inss?: number
    valor_cbs?: number
    valor_liquido?: number
    // Impostos dinâmicos
    impostos_dinamicos?: ImpostoDinamico[]
  }

  const [itens, setItens] = useState<NotaFiscalItem[]>([])
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isCreateFornecedorDialogOpen, setIsCreateFornecedorDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NotaFiscalItem | null>(null)
  const [criarBoleto, setCriarBoleto] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState<string>('')
  const [tipoPagamentoPersonalizado, setTipoPagamentoPersonalizado] = useState<string>('')
  const [boletoFile, setBoletoFile] = useState<File | null>(null)
  const [vincularCompraExistente, setVincularCompraExistente] = useState(false)
  const [itemFormData, setItemFormData] = useState<NotaFiscalItem>({
    descricao: '',
    unidade: 'UN',
    quantidade: 1,
    preco_unitario: 0,
    preco_total: 0,
    base_calculo_icms: 0,
    percentual_icms: 0,
    valor_icms: 0,
    percentual_ipi: 0,
    valor_ipi: 0,
    base_calculo_issqn: 0,
    aliquota_issqn: 0,
    valor_issqn: 0,
    valor_inss: 0,
    valor_cbs: 0,
    valor_liquido: 0,
    impostos_dinamicos: []
  })

  // Função para calcular impostos automaticamente
  const calcularImpostos = useCallback((item: NotaFiscalItem): NotaFiscalItem => {
    const novoItem = { ...item }
    
    // Calcular valor total
    novoItem.preco_total = novoItem.quantidade * novoItem.preco_unitario
    
    // Calcular ICMS se base e percentual estiverem preenchidos
    if (novoItem.base_calculo_icms && novoItem.percentual_icms) {
      novoItem.valor_icms = (novoItem.base_calculo_icms * novoItem.percentual_icms) / 100
    } else if (novoItem.percentual_icms && novoItem.preco_total) {
      // Se não tiver base, usar o valor total como base
      novoItem.base_calculo_icms = novoItem.preco_total
      novoItem.valor_icms = (novoItem.preco_total * novoItem.percentual_icms) / 100
    }
    
    // Calcular IPI se percentual estiver preenchido
    if (novoItem.percentual_ipi && novoItem.preco_total) {
      novoItem.valor_ipi = (novoItem.preco_total * novoItem.percentual_ipi) / 100
    }
    
    // Calcular ISSQN se base e alíquota estiverem preenchidos
    if (novoItem.base_calculo_issqn && novoItem.aliquota_issqn) {
      novoItem.valor_issqn = (novoItem.base_calculo_issqn * novoItem.aliquota_issqn) / 100
    } else if (novoItem.aliquota_issqn && novoItem.preco_total) {
      // Se não tiver base, usar o valor total como base
      novoItem.base_calculo_issqn = novoItem.preco_total
      novoItem.valor_issqn = (novoItem.preco_total * novoItem.aliquota_issqn) / 100
    }
    
    // Calcular impostos dinâmicos
    if (novoItem.impostos_dinamicos && novoItem.impostos_dinamicos.length > 0) {
      novoItem.impostos_dinamicos = novoItem.impostos_dinamicos.map(imposto => {
        let valorCalculado = 0
        if (imposto.tipo_calculo === 'valor_fixo') {
          // Se for valor fixo, usar o valor_fixo diretamente
          valorCalculado = imposto.valor_fixo || 0
        } else {
          // Se for porcentagem, calcular normalmente
          const baseCalculo = imposto.base_calculo > 0 ? imposto.base_calculo : novoItem.preco_total
          valorCalculado = (baseCalculo * imposto.aliquota) / 100
        }
        return {
          ...imposto,
          base_calculo: imposto.base_calculo > 0 ? imposto.base_calculo : novoItem.preco_total,
          valor_calculado: valorCalculado
        }
      })
    }
    
    // Calcular valor líquido (valor total - todos os impostos)
    const totalImpostosFixos = (novoItem.valor_icms || 0) + 
                               (novoItem.valor_ipi || 0) + 
                               (novoItem.valor_issqn || 0) + 
                               (novoItem.valor_inss || 0) + 
                               (novoItem.valor_cbs || 0)
    
    const totalImpostosDinamicos = novoItem.impostos_dinamicos?.reduce((sum, imp) => sum + (imp.valor_calculado || 0), 0) || 0
    
    novoItem.valor_liquido = novoItem.preco_total - totalImpostosFixos - totalImpostosDinamicos
    
    return novoItem
  }, [])

  // Funções para gerenciar impostos dinâmicos
  const adicionarImpostoDinamico = () => {
    const novoImposto: ImpostoDinamico = {
      id: Date.now().toString(),
      nome: '',
      tipo: '',
      tipo_calculo: 'porcentagem',
      base_calculo: itemFormData.preco_total || 0,
      aliquota: 0,
      valor_fixo: 0,
      valor_calculado: 0
    }
    const impostosAtuais = itemFormData.impostos_dinamicos || []
    const itemAtualizado = calcularImpostos({
      ...itemFormData,
      impostos_dinamicos: [...impostosAtuais, novoImposto]
    })
    setItemFormData(itemAtualizado)
  }

  const removerImpostoDinamico = (id: string) => {
    const impostosAtuais = itemFormData.impostos_dinamicos || []
    const itemAtualizado = calcularImpostos({
      ...itemFormData,
      impostos_dinamicos: impostosAtuais.filter(imp => imp.id !== id)
    })
    setItemFormData(itemAtualizado)
  }

  const atualizarImpostoDinamico = (id: string, campo: keyof ImpostoDinamico, valor: any) => {
    const impostosAtuais = itemFormData.impostos_dinamicos || []
    const impostosAtualizados = impostosAtuais.map(imp => {
      if (imp.id === id) {
        return { ...imp, [campo]: valor }
      }
      return imp
    })
    const itemAtualizado = calcularImpostos({
      ...itemFormData,
      impostos_dinamicos: impostosAtualizados
    })
    setItemFormData(itemAtualizado)
  }

  useEffect(() => {
    if (fromMedicaoQuery) {
      setMedicaoIdFallback(null)
      return
    }
    try {
      const s = sessionStorage.getItem(NF_FROM_MEDICAO_STORAGE_KEY)
      if (s) setMedicaoIdFallback(s)
    } catch {
      /* ignore */
    }
  }, [fromMedicaoQuery])

  /** Aplica medição já carregada conforme o modo (Serviço = custos extras / detalhe; Locação = bruto + aditivos) */
  const aplicarMedicaoComModoNaForma = useCallback(
    (
      m: MedicaoMensal,
      modo: 'servico' | 'locacao',
      ctx: { abrirDialogoNf: boolean; origemUrl: boolean }
    ) => {
      const unwrapRel = <T,>(x: T | T[] | null | undefined): T | undefined => {
        if (x == null) return undefined
        return Array.isArray(x) ? x[0] : x
      }

      const normId = (v: unknown): number | undefined => {
        if (v == null || v === '') return undefined
        const n = typeof v === 'string' ? parseInt(v, 10) : Number(v)
        return Number.isFinite(n) ? n : undefined
      }

      const mkItem = (descricao: string, quantidade: number, valorUnit: number, valorTotal?: number): NotaFiscalItem => {
        const q = quantidade > 0 ? quantidade : 1
        const vu = Number(valorUnit) || 0
        const pt = valorTotal !== undefined ? Number(valorTotal) : q * vu
        return calcularImpostos({
          descricao,
          unidade: 'UN',
          quantidade: q,
          preco_unitario: vu,
          preco_total: pt,
          base_calculo_icms: 0,
          percentual_icms: 0,
          valor_icms: 0,
          percentual_ipi: 0,
          valor_ipi: 0,
          base_calculo_issqn: 0,
          aliquota_issqn: 0,
          valor_issqn: 0,
          valor_inss: 0,
          valor_cbs: 0,
          valor_liquido: 0,
          impostos_dinamicos: []
        })
      }

      const obra = unwrapRel(m.obras as any)
      const orc = unwrapRel(m.orcamentos as any)
      const cliente = obra?.clientes || orc?.clientes || null
      const clienteId =
        normId(cliente?.id) ?? normId(obra?.cliente_id) ?? normId(orc?.cliente_id)

      const dataEmissao = m.data_medicao
        ? String(m.data_medicao).split('T')[0]
        : new Date().toISOString().split('T')[0]

      const itensMedicao: NotaFiscalItem[] = []
      let valorTotalForm = 0
      let tipoNota: 'nf_servico' | 'nf_locacao' = 'nf_locacao'

      const descontoMed = Number(m.valor_descontos) || 0

      if (modo === 'locacao') {
        tipoNota = 'nf_locacao'
        const vLoc = Number(m.valor_mensal_bruto) || 0
        const vAdit = Number(m.valor_aditivos) || 0
        if (vLoc > 0) {
          itensMedicao.push(
            mkItem(`Locação — período ${m.periodo} (ref. medição ${m.numero || m.id})`, 1, vLoc, vLoc)
          )
        }
        if (vAdit > 0) {
          itensMedicao.push(
            mkItem(`Aditivos — ref. medição ${m.numero || m.id} (${m.periodo})`, 1, vAdit, vAdit)
          )
        }
        valorTotalForm = vLoc + vAdit
      } else {
        tipoNota = 'nf_servico'
        const temDetalheServico =
          (m.custos_mensais?.length || 0) > 0 ||
          (m.horas_extras?.length || 0) > 0 ||
          (m.servicos_adicionais?.length || 0) > 0

        if (temDetalheServico) {
          for (const c of m.custos_mensais || []) {
            const qtd = Number(c.quantidade_meses) > 0 ? Number(c.quantidade_meses) : 1
            const vu = Number(c.valor_mensal) || 0
            const tot = Number(c.valor_total) || qtd * vu
            const label = `${c.descricao || c.tipo || 'Custo mensal'} — ref. medição ${m.numero || m.id} (${m.periodo})`
            itensMedicao.push(mkItem(label, qtd, vu, tot))
          }
          for (const h of m.horas_extras || []) {
            const q = Number(h.quantidade_horas) || 0
            const tot = Number(h.valor_total) || 0
            const vu = q > 0 ? tot / q : Number(h.valor_hora) || 0
            itensMedicao.push(
              mkItem(
                `Horas extras (${h.tipo} / ${h.dia_semana}) — ref. medição ${m.numero || m.id}`,
                q > 0 ? q : 1,
                vu,
                tot || vu
              )
            )
          }
          for (const s of m.servicos_adicionais || []) {
            const q = Number(s.quantidade) > 0 ? Number(s.quantidade) : 1
            const vu = Number(s.valor_unitario) || 0
            const tot = Number(s.valor_total) || q * vu
            itensMedicao.push(mkItem(s.descricao || 'Serviço adicional', q, vu, tot))
          }
          valorTotalForm = itensMedicao.reduce((acc, it) => acc + (Number(it.preco_total) || 0), 0)
        } else {
          const vServ = Number(m.valor_custos_extras) || 0
          if (vServ > 0) {
            itensMedicao.push(
              mkItem(
                `Serviços / custos extras — ref. medição ${m.numero || m.id} (${m.periodo})`,
                1,
                vServ,
                vServ
              )
            )
          }
          valorTotalForm = vServ
        }
      }

      const obsLinhas = [
        `Importação (${modo === 'locacao' ? 'Locação' : 'Serviço'}) — medição ${m.numero || '#' + m.id} (período ${m.periodo}).`,
        obra?.nome ? `Obra: ${obra.nome}.` : '',
        cliente?.nome ? `Cliente: ${cliente.nome}.` : '',
        descontoMed > 0
          ? `Descontos na medição: R$ ${descontoMed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
          : ''
      ].filter(Boolean)

      const numeroSugerido = `REF-MED-${m.id}-${modo === 'locacao' ? 'LOC' : 'SRV'}`

      setActiveTab('saida')
      setFormData({
        numero_nf: numeroSugerido,
        serie: '',
        data_emissao: dataEmissao,
        data_vencimento: '',
        valor_total: valorTotalForm,
        tipo: 'saida',
        status: 'pendente',
        tipo_nota: tipoNota,
        cliente_id: clienteId,
        medicao_id: m.id,
        fornecedor_id: undefined,
        observacoes: obsLinhas.join(' ')
      })
      setItens(itensMedicao)
      setFormFile(null)
      setGruaInfo(null)
      setCriarBoleto(false)
      setFormaPagamento('')
      setTipoPagamentoPersonalizado('')
      setBoletoFile(null)
      setContaBancariaSelecionada(null)
      setVincularCompraExistente(false)
      setMedicaoIdParaImportar(String(m.id))
      if (ctx.abrirDialogoNf) {
        setIsCreateDialogOpen(true)
      }

      try {
        sessionStorage.removeItem(NF_FROM_MEDICAO_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      setMedicaoIdFallback(null)

      toastNotify({
        title: 'Dados importados da medição',
        description: clienteId
          ? 'Revise o número da NF, valores e itens antes de salvar.'
          : 'Cliente não identificado na medição — selecione o cliente manualmente. Revise valores e itens antes de salvar.'
      })
    },
    [calcularImpostos, toastNotify]
  )

  /** Busca medição e abre o diálogo Serviço vs Locação */
  const prepararImportacaoMedicao = useCallback(
    async (
      medicaoId: number,
      opts: { abrirDialogoNf: boolean; origemUrl: boolean; isCancelled?: () => boolean }
    ) => {
      try {
        const medRes = await medicoesMensaisApi.obter(medicaoId)
        if (opts.isCancelled?.()) return

        if (!medRes.success || !medRes.data) {
          toastNotify({
            title: 'Erro',
            description: 'Não foi possível carregar a medição para pré-preencher a nota fiscal.',
            variant: 'destructive'
          })
          return
        }

        const m = medRes.data as MedicaoMensal
        if (m.status_aprovacao !== 'aprovada') {
          try {
            sessionStorage.removeItem(NF_FROM_MEDICAO_STORAGE_KEY)
          } catch {
            /* ignore */
          }
          if (opts.origemUrl) {
            setMedicaoIdFallback(null)
            router.replace('/dashboard/financeiro/notas-fiscais', { scroll: false })
          }
          toastNotify({
            title: 'Medição não aprovada',
            description:
              m.status_aprovacao === 'rejeitada'
                ? 'Esta medição foi rejeitada. Não é possível gerar nota fiscal.'
                : 'Aprove a medição antes de gerar a nota fiscal. A nota só pode ser criada após a aprovação.',
            variant: 'destructive'
          })
          return
        }

        const podeLocacao =
          (Number(m.valor_mensal_bruto) || 0) > 0 || (Number(m.valor_aditivos) || 0) > 0
        const temDetalheServico =
          (m.custos_mensais?.length || 0) > 0 ||
          (m.horas_extras?.length || 0) > 0 ||
          (m.servicos_adicionais?.length || 0) > 0
        const podeServico = temDetalheServico || (Number(m.valor_custos_extras) || 0) > 0

        if (!podeLocacao && !podeServico) {
          toastNotify({
            title: 'Nada para importar',
            description: 'Esta medição não possui valores de locação nem de serviço utilizáveis.',
            variant: 'destructive'
          })
          if (opts.origemUrl) {
            setMedicaoIdFallback(null)
            router.replace('/dashboard/financeiro/notas-fiscais', { scroll: false })
          }
          return
        }

        setMedicaoParaEscolherTipo(m)
        setPendingImportCtx({ abrirDialogoNf: opts.abrirDialogoNf, origemUrl: opts.origemUrl })
        setImportModoSelecionado(podeLocacao ? 'locacao' : 'servico')
        setDialogEscolhaTipoImportOpen(true)
      } catch (e: any) {
        if (!opts.isCancelled?.()) {
          toastNotify({
            title: 'Erro',
            description: e?.message || 'Falha ao preparar importação da medição.',
            variant: 'destructive'
          })
        }
      }
    },
    [router, toastNotify]
  )

  const confirmarImportacaoTipoMedicao = useCallback(() => {
    if (!medicaoParaEscolherTipo || !pendingImportCtx) return
    const m = medicaoParaEscolherTipo
    const podeLocacao =
      (Number(m.valor_mensal_bruto) || 0) > 0 || (Number(m.valor_aditivos) || 0) > 0
    const temDetalheServico =
      (m.custos_mensais?.length || 0) > 0 ||
      (m.horas_extras?.length || 0) > 0 ||
      (m.servicos_adicionais?.length || 0) > 0
    const podeServico = temDetalheServico || (Number(m.valor_custos_extras) || 0) > 0
    if (importModoSelecionado === 'locacao' && !podeLocacao) {
      toastNotify({
        title: 'Valor de locação indisponível',
        description: 'Não há valor de locação ou aditivos nesta medição.',
        variant: 'destructive'
      })
      return
    }
    if (importModoSelecionado === 'servico' && !podeServico) {
      toastNotify({
        title: 'Valor de serviço indisponível',
        description: 'Não há custos extras nem itens de serviço nesta medição.',
        variant: 'destructive'
      })
      return
    }
    ignorarCloseEscolhaImportTipo.current = true
    aplicarMedicaoComModoNaForma(medicaoParaEscolherTipo, importModoSelecionado, pendingImportCtx)
    setDialogEscolhaTipoImportOpen(false)
    setMedicaoParaEscolherTipo(null)
    setPendingImportCtx(null)
    queueMicrotask(() => {
      ignorarCloseEscolhaImportTipo.current = false
    })
  }, [medicaoParaEscolherTipo, pendingImportCtx, importModoSelecionado, aplicarMedicaoComModoNaForma])

  const cancelarDialogEscolhaTipoImport = useCallback(() => {
    if (ignorarCloseEscolhaImportTipo.current) return
    const eraUrl = pendingImportCtx?.origemUrl
    setDialogEscolhaTipoImportOpen(false)
    setMedicaoParaEscolherTipo(null)
    setPendingImportCtx(null)
    try {
      sessionStorage.removeItem(NF_FROM_MEDICAO_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setMedicaoIdFallback(null)
    if (eraUrl) {
      router.replace('/dashboard/financeiro/notas-fiscais', { scroll: false })
    }
  }, [pendingImportCtx, router])

  const handleImportarDadosMedicao = async () => {
    const id = parseInt(medicaoIdParaImportar, 10)
    if (!Number.isFinite(id) || id <= 0) {
      toast({
        title: 'Selecione uma medição',
        description: 'Escolha uma medição aprovada na lista antes de importar.',
        variant: 'destructive'
      })
      return
    }
    setImportandoMedicao(true)
    try {
      await prepararImportacaoMedicao(id, { abrirDialogoNf: false, origemUrl: false })
    } finally {
      setImportandoMedicao(false)
    }
  }

  /** Pré-preenche NF de saída a partir da medição (?fromMedicao=id) — abre escolha Serviço/Locação */
  useEffect(() => {
    const rawId = fromMedicaoQuery ?? medicaoIdFallback
    if (!rawId) return

    const medicaoId = parseInt(rawId, 10)
    if (Number.isNaN(medicaoId)) return

    let cancelled = false

    ;(async () => {
      setImportandoMedicao(true)
      try {
        await prepararImportacaoMedicao(medicaoId, {
          abrirDialogoNf: true,
          origemUrl: true,
          isCancelled: () => cancelled
        })
      } finally {
        if (!cancelled) setImportandoMedicao(false)
      }
    })()

    return () => {
      cancelled = true
      setImportandoMedicao(false)
    }
  }, [fromMedicaoQuery, medicaoIdFallback, prepararImportacaoMedicao])

  /** Diálogo criar/editar NF: operação em andamento (salvar, XML ou medição) */
  const dialogFormNfOcupado =
    salvandoNotaFiscal || parseandoXmlNfe || importandoMedicao

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarNotasFiscais()
  }, [activeTab, currentPage, statusFilter, searchTerm])

  // Estado para armazenar informações da grua carregada
  const [gruaInfo, setGruaInfo] = useState<{id: string, modelo?: string, fabricante?: string} | null>(null)

  // Buscar grua automaticamente quando tipo for locação e cliente for selecionado
  useEffect(() => {
    const buscarGruaAutomatica = async () => {
      const tipoNotaFiscal = formData.tipo || activeTab
      if (
        formData.tipo_nota === 'nf_locacao' && 
        formData.cliente_id && 
        tipoNotaFiscal === 'saida'
      ) {
        try {
          // Buscar locações ativas do cliente
          const response = await locacoesApi.list({
            cliente_id: formData.cliente_id,
            status: 'ativa',
            limit: 10
          })

          // A resposta pode vir em response.data ou response.data.data
          const locacoesData = response.data?.data || response.data || []
          
          if (locacoesData.length > 0) {
            // Pegar a primeira locação ativa
            const locacaoAtiva = locacoesData[0]
            
            // Atualizar o campo locacao_id (para relacionamento no backend)
            setFormData(prev => ({
              ...prev,
              locacao_id: locacaoAtiva.id
            }))

            // Se a locação tiver equipamento_id (grua), buscar informações da grua
            if (locacaoAtiva.equipamento_id && locacaoAtiva.tipo_equipamento === 'grua') {
              try {
                const gruaResponse = await gruasApi.obterGrua(locacaoAtiva.equipamento_id)
                
                if (gruaResponse.success && gruaResponse.data) {
                  setGruaInfo({
                    id: locacaoAtiva.equipamento_id,
                    modelo: gruaResponse.data.modelo || gruaResponse.data.model,
                    fabricante: gruaResponse.data.fabricante
                  })

                  toast({
                    title: "Grua encontrada",
                    description: `Grua ${gruaResponse.data.modelo || gruaResponse.data.model || locacaoAtiva.equipamento_id} carregada automaticamente da locação ${locacaoAtiva.numero}`,
                  })
                }
              } catch (gruaError) {
                console.error('Erro ao buscar informações da grua:', gruaError)
                // Mesmo sem buscar detalhes, armazenar o ID
                setGruaInfo({
                  id: locacaoAtiva.equipamento_id
                })
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar grua automática:', error)
        }
      } else {
        // Limpar informações da grua quando não for mais locação
        setGruaInfo(null)
      }
    }

    buscarGruaAutomatica()
  }, [formData.tipo_nota, formData.cliente_id, activeTab, toast])

  const carregarDados = async () => {
    try {
      // Carregar clientes
      const clientesResponse = await clientesApi.listarClientes({ limit: 1000 })
      if (clientesResponse.success) {
        setClientes(clientesResponse.data || [])
      }
      
      // Carregar fornecedores
      const fornecedoresResponse = await fornecedoresApi.list({ limit: 1000 })
      const fornecedoresData = fornecedoresResponse.fornecedores || []
      setFornecedores(fornecedoresData.map((f: any) => ({
        id: typeof f.id === 'string' ? parseInt(f.id) : f.id,
        nome: f.nome,
        cnpj: f.cnpj
      })))
      
      // Carregar medições
      try {
        const medicoesResponse = await medicoesMensaisApi.listar({ limit: 1000 })
        console.log('Resposta completa da API de medições:', medicoesResponse)
        
        if (medicoesResponse && medicoesResponse.success) {
          // A resposta pode ter data diretamente ou dentro de data.data
          const medicoesData = Array.isArray(medicoesResponse.data) 
            ? medicoesResponse.data 
            : (medicoesResponse.data?.data || [])
          
          console.log('Medições processadas:', medicoesData.length, 'medições encontradas')
          setMedicoes(medicoesData)
        } else {
          console.warn('Resposta da API não indica sucesso:', medicoesResponse)
          setMedicoes([])
        }
      } catch (error: any) {
        console.error('Erro ao carregar medições:', error)
        toast({
          title: "Aviso",
          description: "Não foi possível carregar as medições. Verifique se há medições cadastradas.",
          variant: "default"
        })
        setMedicoes([])
      }
      
      // Carregar locações
      const locacoesResponse = await locacoesApi.list({ limit: 1000 })
      if (locacoesResponse.success) {
        setLocacoes(locacoesResponse.data || [])
      } else if (locacoesResponse.data) {
        setLocacoes(locacoesResponse.data || [])
      }
      
      // Carregar compras
      try {
        const comprasResponse = await apiCompras.listar({ limit: 1000 })
        const comprasData = Array.isArray(comprasResponse?.data)
          ? comprasResponse.data
          : Array.isArray((comprasResponse as any)?.compras)
            ? (comprasResponse as any).compras
            : []

        setCompras(comprasData)
      } catch (comprasError) {
        console.error('Erro ao carregar compras via API de compras:', comprasError)
        setCompras([])
      }
      
      // Carregar contas bancárias
      try {
        const contasResponse = await apiContasBancarias.listar({ limit: 1000 })
        
        // apiContasBancarias.listar() retorna array direto ou { success, data }
        let contasArr: any[] = []
        if (Array.isArray(contasResponse)) {
          contasArr = contasResponse
        } else if (contasResponse?.success && Array.isArray(contasResponse.data)) {
          contasArr = contasResponse.data
        } else if (Array.isArray(contasResponse?.data)) {
          contasArr = contasResponse.data
        }
        
        const contasAtivas = contasArr.filter((c: any) => {
          if ('ativa' in c) {
            return c.ativa !== false
          }
          if ('status' in c && c.status) {
            return c.status === 'ativa'
          }
          return true
        })
        setContasBancarias(contasAtivas)
      } catch (error) {
        console.error('Erro ao carregar contas bancárias:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const carregarNotasFiscais = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notasFiscaisApi.list({
        tipo: activeTab,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage
      })
      
      if (response.success) {
        setNotasFiscais(response.data || [])
        
        // Atualizar informações de paginação se a API retornar
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1)
          setTotalItems(response.pagination.total || 0)
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar notas fiscais",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, statusFilter, searchTerm, toast])

  // Função helper para limpar dados antes de enviar (converter strings vazias para null)
  const limparDadosNotaFiscal = (data: any) => {
    const dadosLimpos: any = {}
    
    // Processar cada campo
    Object.keys(data).forEach(key => {
      const value = data[key]
      
      // Se for string vazia, tratar conforme o tipo de campo
      if (value === '') {
        // Campos de data vazios devem ser null
        if (key.includes('data') || key.includes('vencimento') || key.includes('emissao')) {
          dadosLimpos[key] = null
        }
        // Campos opcionais de texto vazios podem ser omitidos ou null
        else if (key.includes('observacoes') || key.includes('descricao') || key.includes('serie')) {
          dadosLimpos[key] = null
        }
        // Outros campos opcionais são omitidos
        // (não adicionar ao objeto)
      }
      // Se for null ou undefined, manter como está
      else if (value === null || value === undefined) {
        dadosLimpos[key] = value
      }
      // Caso contrário, incluir o valor
      else {
        dadosLimpos[key] = value
      }
    })
    
    return dadosLimpos
  }

  const handleCreate = async () => {
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!formData.numero_nf || !formData.numero_nf.trim()) {
      camposFaltando.push('Número da Nota Fiscal')
    }

    if (!formData.data_emissao || !formData.data_emissao.trim()) {
      camposFaltando.push('Data de Emissão')
    }

    if (!formData.valor_total || formData.valor_total <= 0) {
      camposFaltando.push('Valor Total (R$)')
    }

    const tipoNotaFiscal = formData.tipo || activeTab
    if (tipoNotaFiscal === 'saida' && !formData.cliente_id) {
      camposFaltando.push('Cliente')
    }

    if (tipoNotaFiscal === 'entrada' && !formData.fornecedor_id) {
      camposFaltando.push('Fornecedor')
    }

    if (!formData.tipo_nota || !formData.tipo_nota.trim()) {
      camposFaltando.push('Tipo de Nota')
    }

    // Validar forma de pagamento personalizada
    if (formaPagamento === 'outro' && (!tipoPagamentoPersonalizado || !tipoPagamentoPersonalizado.trim())) {
      camposFaltando.push('Tipo de Pagamento Personalizado')
    }

    if (camposFaltando.length > 0) {
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000,
      })
      return
    }

    try {
      setSalvandoNotaFiscal(true)
      // Log dos dados antes de enviar
      console.log('📋 [NOTAS-FISCAIS] Dados do formulário antes de enviar:', {
        formData,
        activeTab,
        formaPagamento,
        criarBoleto,
        tipoPagamentoPersonalizado,
        boletoFile: boletoFile ? { name: boletoFile.name, size: boletoFile.size } : null,
        itens: itens.length,
        formFile: formFile ? { name: formFile.name, size: formFile.size } : null
      })

      // Limpar dados antes de enviar
      // Usar formData.tipo que foi definido quando o botão foi clicado
      // Garantir que o tipo está correto
      const tipoNotaFiscal = formData.tipo || activeTab
      console.log('📋 [NOTAS-FISCAIS] Tipo da nota fiscal:', tipoNotaFiscal, 'formData.tipo:', formData.tipo, 'activeTab:', activeTab)
      
      const dadosLimpos = limparDadosNotaFiscal({
        ...formData,
        tipo: tipoNotaFiscal
      })

      console.log('📋 [NOTAS-FISCAIS] Dados limpos para envio:', dadosLimpos)

      console.log('📋 [NOTAS-FISCAIS] Estado do formulário antes de criar:')
      console.log('  - formaPagamento:', formaPagamento)
      console.log('  - tipoPagamentoPersonalizado:', tipoPagamentoPersonalizado)
      console.log('  - contaBancariaSelecionada:', contaBancariaSelecionada)
      console.log('  - valor_total:', formData.valor_total)
      
      const response = await notasFiscaisApi.create(dadosLimpos)
      
      console.log('📋 [NOTAS-FISCAIS] Resposta da criação:', response)
      
      if (response.success && response.data?.id) {
        const notaId = response.data.id
        // Usar o tipo retornado pela API para garantir que está correto
        const tipoNotaFiscalCriada = response.data.tipo || tipoNotaFiscal
        console.log('📋 [NOTAS-FISCAIS] Tipo da nota fiscal criada (da API):', tipoNotaFiscalCriada)

        // Criar movimentação bancária se uma conta foi selecionada
        if (contaBancariaSelecionada && formData.valor_total > 0) {
          try {
            console.log('💰 [FLUXO-CAIXA] Criando movimentação bancária')
            // Nota de Saída → Movimentação tipo "entrada" (incrementa saldo)
            // Nota de Entrada → Movimentação tipo "saida" (decrementa saldo)
            const tipoMovimentacao = tipoNotaFiscalCriada === 'saida' ? 'entrada' : 'saida'
            const descricao = `Nota Fiscal ${formData.numero_nf}${formData.serie ? ` Série ${formData.serie}` : ''} - ${tipoNotaFiscalCriada === 'saida' ? 'Recebimento' : 'Pagamento'}`
            
            // Determinar forma de pagamento
            let formaPagamentoTexto = ''
            console.log('💰 [FLUXO-CAIXA] Forma de pagamento capturada:', formaPagamento)
            console.log('💰 [FLUXO-CAIXA] Tipo pagamento personalizado:', tipoPagamentoPersonalizado)
            console.log('💰 [FLUXO-CAIXA] Tipo de formaPagamento:', typeof formaPagamento)
            console.log('💰 [FLUXO-CAIXA] Valor de formaPagamento:', JSON.stringify(formaPagamento))
            
            if (formaPagamento === 'boleto') {
              formaPagamentoTexto = 'Boleto'
            } else if (formaPagamento === 'outro' && tipoPagamentoPersonalizado && tipoPagamentoPersonalizado.trim()) {
              formaPagamentoTexto = tipoPagamentoPersonalizado.trim()
            } else if (formaPagamento && formaPagamento.trim()) {
              // Processar diferentes formatos de forma de pagamento
              const valorProcessado = formaPagamento.trim()
              if (valorProcessado === 'pix') {
                formaPagamentoTexto = 'PIX'
              } else if (valorProcessado === 'transferencia') {
                formaPagamentoTexto = 'Transferência Bancária'
              } else if (valorProcessado === 'cartao_credito') {
                formaPagamentoTexto = 'Cartão de Crédito'
              } else if (valorProcessado === 'cartao_debito') {
                formaPagamentoTexto = 'Cartão de Débito'
              } else {
                formaPagamentoTexto = valorProcessado.charAt(0).toUpperCase() + valorProcessado.slice(1).replace(/_/g, ' ')
              }
            }
            
            console.log('💰 [FLUXO-CAIXA] Forma de pagamento processada:', formaPagamentoTexto)
            console.log('💰 [FLUXO-CAIXA] Forma de pagamento tem valor?', !!formaPagamentoTexto)
            
            // Construir objeto de dados da movimentação
            // Sempre incluir categoria, mesmo que seja null, para garantir que seja enviado
            const dadosMovimentacao: {
              tipo: 'entrada' | 'saida'
              valor: number
              descricao: string
              referencia: string
              data: string
              categoria: string | null
            } = {
              tipo: tipoMovimentacao,
              valor: formData.valor_total,
              descricao: descricao,
              referencia: `NF-${notaId}`,
              data: formData.data_emissao,
              categoria: (formaPagamentoTexto && formaPagamentoTexto.trim().length > 0) 
                ? formaPagamentoTexto.trim() 
                : null
            }
            
            console.log('💰 [FLUXO-CAIXA] Categoria final:', dadosMovimentacao.categoria)
            console.log('💰 [FLUXO-CAIXA] Dados da movimentação a serem enviados:', JSON.stringify(dadosMovimentacao, null, 2))
            
            const movimentacaoResponse = await apiContasBancarias.registrarMovimentacao(contaBancariaSelecionada, dadosMovimentacao)
            
            if (movimentacaoResponse.success) {
              console.log('✅ [FLUXO-CAIXA] Movimentação bancária criada com sucesso')
              toast({
                title: "Sucesso",
                description: `Movimentação bancária registrada. Saldo da conta atualizado.`,
                variant: "default"
              })
            } else {
              console.error('❌ [FLUXO-CAIXA] Erro ao criar movimentação:', movimentacaoResponse)
              toast({
                title: "Aviso",
                description: "Nota fiscal criada, mas houve erro ao registrar movimentação bancária.",
                variant: "destructive"
              })
            }
          } catch (movimentacaoError: any) {
            console.error('❌ [FLUXO-CAIXA] Erro ao criar movimentação bancária:', movimentacaoError)
            toast({
              title: "Aviso",
              description: "Nota fiscal criada, mas houve erro ao registrar movimentação bancária: " + (movimentacaoError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        }

        // Salvar itens se houver
        if (itens.length > 0) {
          try {
            console.log('📋 [NOTAS-FISCAIS] Salvando itens:', itens.length)
            for (const item of itens) {
              // Limpar dados do item antes de enviar
              const itemLimpo = limparDadosNotaFiscal({
                ...item,
                nota_fiscal_id: notaId
              })
              console.log('📋 [NOTAS-FISCAIS] Enviando item:', itemLimpo)
              const itemResponse = await notasFiscaisApi.adicionarItem(notaId, itemLimpo)
              console.log('📋 [NOTAS-FISCAIS] Resposta do item:', itemResponse)
            }
            console.log('✅ [NOTAS-FISCAIS] Todos os itens salvos com sucesso')
          } catch (itensError: any) {
            console.error('❌ [NOTAS-FISCAIS] Erro ao salvar itens:', itensError)
            toast({
              title: "Aviso",
              description: "Nota fiscal criada, mas houve erro ao salvar os itens: " + (itensError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          console.log('📋 [NOTAS-FISCAIS] Nenhum item para salvar')
        }

        // Criar boleto vinculado à nota fiscal (se forma de pagamento for boleto e solicitado)
        if (formaPagamento === 'boleto' && criarBoleto) {
          console.log('📋 [NOTAS-FISCAIS] Criando boleto vinculado à nota fiscal')
          try {
            const { boletosApi } = await import('@/lib/api-boletos')
            
            // Verificar se já existe boleto vinculado a esta nota fiscal
            let boletoJaExiste = null
            try {
              console.log('📋 [NOTAS-FISCAIS] Verificando se já existe boleto para nota fiscal:', notaId)
              const boletosResponse = await boletosApi.list({ nota_fiscal_id: notaId })
              console.log('📋 [NOTAS-FISCAIS] Resposta da verificação de boletos:', boletosResponse)
              if (boletosResponse.success && boletosResponse.data && boletosResponse.data.length > 0) {
                boletoJaExiste = boletosResponse.data[0] // Pegar o primeiro boleto encontrado
                console.log('📋 [NOTAS-FISCAIS] Boleto já existe:', boletoJaExiste)
              }
            } catch (checkError) {
              // Se não conseguir buscar, continuar tentando criar
              console.log('⚠️ [NOTAS-FISCAIS] Não foi possível verificar boletos existentes, tentando criar novo:', checkError)
            }
            
            if (boletoJaExiste) {
              console.log('📋 [NOTAS-FISCAIS] Boleto já existe, apenas fazendo upload do arquivo se houver')
              // Se já existe boleto, apenas fazer upload do arquivo se houver
              if (boletoFile) {
                try {
                  console.log('📋 [NOTAS-FISCAIS] Fazendo upload do arquivo do boleto:', boletoFile.name)
                  await boletosApi.uploadFile(boletoJaExiste.id, boletoFile)
                  console.log('✅ [NOTAS-FISCAIS] Upload do arquivo do boleto concluído')
                  toast({
                    title: "Sucesso",
                    description: "Arquivo do boleto enviado com sucesso. O boleto já estava vinculado à nota fiscal.",
                    variant: "default"
                  })
                } catch (uploadBoletoError: any) {
                  console.error('❌ [NOTAS-FISCAIS] Erro ao fazer upload do boleto:', uploadBoletoError)
                  toast({
                    title: "Aviso",
                    description: "Boleto já existe, mas houve erro ao fazer upload do arquivo: " + (uploadBoletoError.message || "Erro desconhecido"),
                    variant: "destructive"
                  })
                }
              } else {
                console.log('📋 [NOTAS-FISCAIS] Boleto já existe, mas nenhum arquivo para upload')
                toast({
                  title: "Info",
                  description: "Boleto já existe vinculado a esta nota fiscal.",
                  variant: "default"
                })
              }
            } else {
              console.log('📋 [NOTAS-FISCAIS] Criando novo boleto')
              // Determinar tipo do boleto baseado no tipo da nota fiscal
              // Nota Fiscal de SAÍDA -> Boleto tipo "receber" (aparece em Boletos de Entrada)
              // Nota Fiscal de ENTRADA -> Boleto tipo "pagar" (aparece em Boletos de Saída)
              // Usar o tipo retornado pela API da nota fiscal para garantir que está correto
              const tipoNotaFiscalParaBoleto = tipoNotaFiscalCriada || formData.tipo || activeTab
              const tipoBoleto = tipoNotaFiscalParaBoleto === 'saida' ? 'receber' : 'pagar'
              console.log('📋 [NOTAS-FISCAIS] Criando boleto - Tipo da nota fiscal:', tipoNotaFiscalParaBoleto, 'Tipo do boleto a ser criado:', tipoBoleto, 'tipoNotaFiscalCriada:', tipoNotaFiscalCriada, 'formData.tipo:', formData.tipo, 'activeTab:', activeTab)
              
              // Usar data de vencimento da nota fiscal ou adicionar 30 dias à data de emissão
              const dataVencimento = formData.data_vencimento || (() => {
                const dataEmissao = new Date(formData.data_emissao)
                dataEmissao.setDate(dataEmissao.getDate() + 30)
                return dataEmissao.toISOString().split('T')[0]
              })()
              
              // Gerar número único do boleto incluindo o ID da nota fiscal para garantir unicidade
              const numeroBoleto = `NF-${notaId}-${formData.numero_nf}${formData.serie ? `-${formData.serie}` : ''}`
              
              const boletoData = {
                numero_boleto: numeroBoleto,
                descricao: `Boleto - Nota Fiscal ${formData.numero_nf}${formData.serie ? ` Série ${formData.serie}` : ''}`,
                valor: formData.valor_total,
                data_emissao: formData.data_emissao,
                data_vencimento: dataVencimento,
                tipo: tipoBoleto, // Garantir que o tipo está correto: 'pagar' para saída, 'receber' para entrada
                forma_pagamento: 'Boleto',
                nota_fiscal_id: notaId,
                cliente_id: (formData.tipo || activeTab) === 'saida' ? formData.cliente_id : undefined,
                observacoes: formData.observacoes || undefined
              }
              
              console.log('📋 [NOTAS-FISCAIS] Dados do boleto a ser criado:', boletoData)
              console.log('📋 [NOTAS-FISCAIS] Validação - tipoNotaFiscal:', tipoNotaFiscal, 'tipoBoleto:', tipoBoleto, 'boletoData.tipo:', boletoData.tipo)
              
              const boletoResponse = await boletosApi.create(boletoData)
              
              console.log('📋 [NOTAS-FISCAIS] Resposta da criação do boleto:', boletoResponse)
              
              if (!boletoResponse.success) {
                console.error('❌ [NOTAS-FISCAIS] Erro ao criar boleto:', boletoResponse)
                // Se o erro for de duplicata, tentar com número diferente incluindo timestamp
                if (boletoResponse.error && (boletoResponse.error.includes('duplicate') || boletoResponse.error.includes('unique'))) {
                  console.log('⚠️ [NOTAS-FISCAIS] Número de boleto duplicado, tentando com timestamp')
                  const numeroBoletoAlternativo = `NF-${notaId}-${formData.numero_nf}${formData.serie ? `-${formData.serie}` : ''}-${Date.now()}`
                  try {
                    const boletoDataAlternativo = { ...boletoData, numero_boleto: numeroBoletoAlternativo }
                    console.log('📋 [NOTAS-FISCAIS] Tentando criar boleto com número alternativo:', numeroBoletoAlternativo)
                    const boletoResponseAlternativo = await boletosApi.create(boletoDataAlternativo)
                    console.log('📋 [NOTAS-FISCAIS] Resposta do boleto alternativo:', boletoResponseAlternativo)
                    if (boletoResponseAlternativo.success) {
                      if (boletoFile && boletoResponseAlternativo.data?.id) {
                        console.log('📋 [NOTAS-FISCAIS] Fazendo upload do arquivo do boleto alternativo')
                        await boletosApi.uploadFile(boletoResponseAlternativo.data.id, boletoFile)
                        console.log('✅ [NOTAS-FISCAIS] Upload do arquivo do boleto alternativo concluído')
                      }
                    }
                  } catch (retryError: any) {
                    console.error('❌ [NOTAS-FISCAIS] Erro ao criar boleto alternativo:', retryError)
                    toast({
                      title: "Aviso",
                      description: "Nota fiscal criada, mas houve erro ao criar o boleto vinculado: " + (retryError.message || "Erro desconhecido"),
                      variant: "destructive"
                    })
                  }
                } else {
                  toast({
                    title: "Aviso",
                    description: "Nota fiscal criada, mas houve erro ao criar o boleto vinculado: " + (boletoResponse.error || "Erro desconhecido"),
                    variant: "destructive"
                  })
                }
              } else {
                console.log('✅ [NOTAS-FISCAIS] Boleto criado com sucesso')
                // Se houver arquivo do boleto, fazer upload
                if (boletoFile && boletoResponse.data?.id) {
                  try {
                    console.log('📋 [NOTAS-FISCAIS] Fazendo upload do arquivo do boleto:', boletoFile.name)
                    await boletosApi.uploadFile(boletoResponse.data.id, boletoFile)
                    console.log('✅ [NOTAS-FISCAIS] Upload do arquivo do boleto concluído')
                  } catch (uploadBoletoError: any) {
                    console.error('❌ [NOTAS-FISCAIS] Erro ao fazer upload do boleto:', uploadBoletoError)
                    toast({
                      title: "Aviso",
                      description: "Boleto criado, mas houve erro ao fazer upload do arquivo: " + (uploadBoletoError.message || "Erro desconhecido"),
                      variant: "destructive"
                    })
                  }
                }
              }
            }
          } catch (boletoError: any) {
            console.error('❌ [NOTAS-FISCAIS] Erro ao criar boleto:', boletoError)
            toast({
              title: "Aviso",
              description: "Nota fiscal criada, mas houve erro ao criar o boleto vinculado: " + (boletoError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          console.log('📋 [NOTAS-FISCAIS] Boleto não será criado (forma de pagamento:', formaPagamento, ', criarBoleto:', criarBoleto, ')')
        }
        
        // Salvar forma de pagamento nas observações se não for boleto
        if (formaPagamento && formaPagamento !== 'boleto') {
          console.log('📋 [NOTAS-FISCAIS] Salvando forma de pagamento nas observações:', formaPagamento)
          try {
            const formaPagamentoTexto = formaPagamento === 'outro' 
              ? tipoPagamentoPersonalizado 
              : formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1).replace('_', ' ')
            
            const observacoesAtualizadas = formData.observacoes 
              ? `${formData.observacoes}\n\nForma de Pagamento: ${formaPagamentoTexto}`
              : `Forma de Pagamento: ${formaPagamentoTexto}`
            
            console.log('📋 [NOTAS-FISCAIS] Observações atualizadas:', observacoesAtualizadas)
            const updateResponse = await notasFiscaisApi.update(notaId, {
              observacoes: observacoesAtualizadas
            })
            console.log('✅ [NOTAS-FISCAIS] Forma de pagamento salva:', updateResponse)
          } catch (updateError: any) {
            console.error('❌ [NOTAS-FISCAIS] Erro ao atualizar forma de pagamento:', updateError)
            // Não mostrar erro ao usuário, pois a nota já foi criada
          }
        }

        // Se houver arquivo, fazer upload após criar
        if (formFile) {
          console.log('📋 [NOTAS-FISCAIS] Fazendo upload do arquivo da nota fiscal:', formFile.name)
          try {
            const uploadResponse = await notasFiscaisApi.uploadFile(notaId, formFile)
            console.log('✅ [NOTAS-FISCAIS] Upload do arquivo concluído:', uploadResponse)
            const temBoleto = formaPagamento === 'boleto' && criarBoleto
            const temItens = itens.length > 0
            const temFormaPagamento = formaPagamento && formaPagamento !== '' && !temBoleto
            
            let mensagemSucesso = "Nota fiscal criada"
            if (temBoleto) mensagemSucesso += ", boleto vinculado"
            if (temItens) mensagemSucesso += " e itens salvos"
            mensagemSucesso += " e arquivo enviado"
            if (temFormaPagamento) mensagemSucesso += ` (Forma de pagamento: ${formaPagamento === 'outro' ? tipoPagamentoPersonalizado : formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1).replace('_', ' ')})`
            mensagemSucesso += " com sucesso"
            
            toast({
              title: "Sucesso",
              description: mensagemSucesso
            })
          } catch (uploadError: any) {
            console.error('❌ [NOTAS-FISCAIS] Erro ao fazer upload do arquivo:', uploadError)
            toast({
              title: "Aviso",
              description: "Nota fiscal criada, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          const temBoleto = formaPagamento === 'boleto' && criarBoleto
          const temItens = itens.length > 0
          const temFormaPagamento = formaPagamento && formaPagamento !== ''
          
          let mensagem = "Nota fiscal criada"
          if (temBoleto) mensagem += ", boleto vinculado"
          if (temItens) mensagem += " e itens salvos"
          if (temFormaPagamento && !temBoleto) mensagem += ` (Forma de pagamento: ${formaPagamento === 'outro' ? tipoPagamentoPersonalizado : formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1).replace('_', ' ')})`
          mensagem += " com sucesso"
          
          toast({
            title: "Sucesso",
            description: mensagem
          })
        }

        const tipoCriada = tipoNotaFiscalCriada || tipoNotaFiscal
        if (
          formData.medicao_id &&
          tipoCriada === 'saida' &&
          (formFile || boletoFile)
        ) {
          try {
            await anexarArquivosNotaNaMedicao({
              medicaoId: formData.medicao_id,
              notaId,
              tipoNota: formData.tipo_nota,
              numeroNf: formData.numero_nf,
              dataEmissao: formData.data_emissao,
              dataVencimento: formData.data_vencimento,
              valorTotal: formData.valor_total,
              formFile,
              boletoFile,
              anexarBoletoNaMedicao: Boolean(boletoFile)
            })
          } catch (medDocErr: any) {
            console.error('[NOTAS-FISCAIS] Erro ao anexar documentos na medição:', medDocErr)
            toast({
              title: 'Aviso',
              description:
                'Nota fiscal criada, mas não foi possível registrar o arquivo na medição: ' +
                (medDocErr?.message || 'Erro desconhecido'),
              variant: 'destructive'
            })
          }
        }

        setIsCreateDialogOpen(false)
        resetForm()
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar nota fiscal",
        variant: "destructive"
      })
    } finally {
      setSalvandoNotaFiscal(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingNota) return
    
    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!formData.numero_nf || !formData.numero_nf.trim()) {
      camposFaltando.push('Número da Nota Fiscal')
    }

    if (!formData.data_emissao || !formData.data_emissao.trim()) {
      camposFaltando.push('Data de Emissão')
    }

    if (!formData.valor_total || formData.valor_total <= 0) {
      camposFaltando.push('Valor Total (R$)')
    }

    if (formData.tipo === 'saida' && !formData.cliente_id) {
      camposFaltando.push('Cliente')
    }

    if (formData.tipo === 'entrada' && !formData.fornecedor_id) {
      camposFaltando.push('Fornecedor')
    }

    if (!formData.tipo_nota || !formData.tipo_nota.trim()) {
      camposFaltando.push('Tipo de Nota')
    }

    if (camposFaltando.length > 0) {
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000,
      })
      return
    }

    try {
      setSalvandoNotaFiscal(true)

      // Limpar dados antes de enviar
      const dadosLimpos = limparDadosNotaFiscal(formData)

      const response = await notasFiscaisApi.update(editingNota.id, dadosLimpos)
      
      if (response.success) {
        // Atualizar itens
        try {
          // Buscar itens existentes
          const itensExistentesResponse = await notasFiscaisApi.listarItens(editingNota.id)
          const itensExistentes = itensExistentesResponse.success ? itensExistentesResponse.data || [] : []
          const itensExistentesIds = itensExistentes.map((item: any) => item.id)
          const itensNovosIds = itens.filter(item => item.id).map(item => item.id!)

          // Deletar itens removidos
          for (const itemExistente of itensExistentes) {
            if (!itensNovosIds.includes(itemExistente.id)) {
              await notasFiscaisApi.deletarItem(itemExistente.id)
            }
          }

          // Adicionar ou atualizar itens
          for (const item of itens) {
            // Limpar dados do item antes de enviar
            const itemLimpo = limparDadosNotaFiscal({
              ...item,
              nota_fiscal_id: editingNota.id
            })
            
            if (item.id) {
              // Atualizar item existente
              await notasFiscaisApi.atualizarItem(item.id, itemLimpo)
            } else {
              // Adicionar novo item
              await notasFiscaisApi.adicionarItem(editingNota.id, itemLimpo)
            }
          }
        } catch (itensError: any) {
          console.error('Erro ao atualizar itens:', itensError)
          toast({
            title: "Aviso",
            description: "Nota fiscal atualizada, mas houve erro ao atualizar os itens: " + (itensError.message || "Erro desconhecido"),
            variant: "destructive"
          })
        }

        // Se houver arquivo, fazer upload após atualizar
        if (formFile) {
          try {
            await notasFiscaisApi.uploadFile(editingNota.id, formFile)
            const tipoEd = formData.tipo || activeTab
            if (formData.medicao_id && tipoEd === 'saida') {
              try {
                await anexarArquivosNotaNaMedicao({
                  medicaoId: formData.medicao_id,
                  notaId: editingNota.id,
                  tipoNota: formData.tipo_nota,
                  numeroNf: formData.numero_nf,
                  dataEmissao: formData.data_emissao,
                  dataVencimento: formData.data_vencimento,
                  valorTotal: formData.valor_total,
                  formFile,
                  boletoFile: null,
                  anexarBoletoNaMedicao: false
                })
              } catch (medDocErr: any) {
                console.error('[NOTAS-FISCAIS] Erro ao anexar na medição (edição):', medDocErr)
                toast({
                  title: 'Aviso',
                  description:
                    'Arquivo da nota enviado, mas não foi possível registrar na medição: ' +
                    (medDocErr?.message || 'Erro desconhecido'),
                  variant: 'destructive'
                })
              }
            }
            toast({
              title: "Sucesso",
              description: "Nota fiscal atualizada e arquivo enviado com sucesso"
            })
          } catch (uploadError: any) {
            toast({
              title: "Aviso",
              description: "Nota fiscal atualizada, mas houve erro ao enviar o arquivo: " + (uploadError.message || "Erro desconhecido"),
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Sucesso",
            description: itens.length > 0 ? "Nota fiscal e itens atualizados com sucesso" : "Nota fiscal atualizada com sucesso"
          })
        }
        setIsEditDialogOpen(false)
        setEditingNota(null)
        resetForm()
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nota fiscal",
        variant: "destructive"
      })
    } finally {
      setSalvandoNotaFiscal(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await notasFiscaisApi.delete(id)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Nota fiscal excluída com sucesso"
        })
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir nota fiscal",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (nota: NotaFiscal) => {
    setEditingNota(nota)
    setVincularCompraExistente(Boolean(nota.compra_id))
    setFormData({
      numero_nf: nota.numero_nf,
      serie: nota.serie || '',
      data_emissao: nota.data_emissao,
      data_vencimento: nota.data_vencimento || '',
      valor_total: nota.valor_total,
      tipo: nota.tipo,
      status: nota.status,
      cliente_id: nota.cliente_id,
      fornecedor_id: nota.fornecedor_id,
      medicao_id: nota.medicao_id,
      locacao_id: nota.locacao_id,
      compra_id: nota.compra_id,
      tipo_nota: nota.tipo_nota,
      observacoes: nota.observacoes || ''
    })
    
    // Carregar itens da nota fiscal
    try {
      const itensResponse = await notasFiscaisApi.listarItens(nota.id)
      if (itensResponse.success && itensResponse.data) {
        setItens(itensResponse.data.map((item: any) => {
          // Parse impostos dinâmicos se existirem
          let impostosDinamicos: ImpostoDinamico[] = []
          if (item.impostos_dinamicos) {
            try {
              if (typeof item.impostos_dinamicos === 'string') {
                impostosDinamicos = JSON.parse(item.impostos_dinamicos)
              } else if (Array.isArray(item.impostos_dinamicos)) {
                impostosDinamicos = item.impostos_dinamicos
              }
            } catch (e) {
              console.error('Erro ao fazer parse de impostos_dinamicos:', e)
              impostosDinamicos = []
            }
          }
          
          return {
            id: item.id,
            codigo_produto: item.codigo_produto,
            descricao: item.descricao,
            ncm_sh: item.ncm_sh,
            cfop: item.cfop,
            unidade: item.unidade,
            quantidade: parseFloat(item.quantidade),
            preco_unitario: parseFloat(item.preco_unitario),
            preco_total: parseFloat(item.preco_total),
            csosn: item.csosn,
            base_calculo_icms: item.base_calculo_icms ? parseFloat(item.base_calculo_icms) : undefined,
            percentual_icms: item.percentual_icms ? parseFloat(item.percentual_icms) : undefined,
            valor_icms: item.valor_icms ? parseFloat(item.valor_icms) : undefined,
            percentual_ipi: item.percentual_ipi ? parseFloat(item.percentual_ipi) : undefined,
            valor_ipi: item.valor_ipi ? parseFloat(item.valor_ipi) : undefined,
            base_calculo_issqn: item.base_calculo_issqn ? parseFloat(item.base_calculo_issqn) : undefined,
            aliquota_issqn: item.aliquota_issqn ? parseFloat(item.aliquota_issqn) : undefined,
            valor_issqn: item.valor_issqn ? parseFloat(item.valor_issqn) : undefined,
            valor_inss: item.valor_inss ? parseFloat(item.valor_inss) : undefined,
            valor_cbs: item.valor_cbs ? parseFloat(item.valor_cbs) : undefined,
            valor_liquido: item.valor_liquido ? parseFloat(item.valor_liquido) : undefined,
            impostos_dinamicos: impostosDinamicos
          }
        }))
        
        // Recalcular valor total da nota fiscal baseado nos itens
        const totalItens = itensResponse.data.reduce((sum: number, item: any) => {
          return sum + parseFloat(item.preco_total || 0)
        }, 0)
        setFormData(prev => ({ ...prev, valor_total: totalItens }))
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      setItens([])
    }
    
    setIsEditDialogOpen(true)
  }

  const handleView = async (nota: NotaFiscal) => {
    console.log('🔍 [NOTAS-FISCAIS] Botão visualizar clicado')
    console.log('🔍 [NOTAS-FISCAIS] Dados da nota:', nota)
    
    // Abrir modal imediatamente com dados básicos
    setViewingNota(nota)
    setIsViewDialogOpen(true)
    setLoadingDetalhesNota(true)
    setViewingItens([]) // Limpar itens anteriores
    
    try {
      // Buscar detalhes completos da nota fiscal e itens em paralelo
      console.log('🔍 [NOTAS-FISCAIS] Chamando API getById com ID:', nota.id)
      const [detalhesResponse, itensResponse] = await Promise.all([
        notasFiscaisApi.getById(nota.id),
        notasFiscaisApi.listarItens(nota.id)
      ])
      
      console.log('🔍 [NOTAS-FISCAIS] Resposta da API:', detalhesResponse)
      console.log('🔍 [NOTAS-FISCAIS] Resposta dos itens:', itensResponse)
      
      if (detalhesResponse.success && detalhesResponse.data) {
        console.log('✅ [NOTAS-FISCAIS] Dados recebidos com sucesso:', detalhesResponse.data)
        setViewingNota(detalhesResponse.data)
      } else {
        console.warn('⚠️ [NOTAS-FISCAIS] Não foi possível buscar detalhes completos, usando dados disponíveis')
        console.warn('⚠️ [NOTAS-FISCAIS] Resposta:', detalhesResponse)
      }
      
      if (itensResponse.success && itensResponse.data) {
        console.log('✅ [NOTAS-FISCAIS] Itens recebidos com sucesso:', itensResponse.data)
        // Processar impostos dinâmicos se vierem como string JSON
        const itensProcessados = itensResponse.data.map((item: any) => {
          if (item.impostos_dinamicos && typeof item.impostos_dinamicos === 'string') {
            try {
              item.impostos_dinamicos = JSON.parse(item.impostos_dinamicos)
            } catch (e) {
              console.error('Erro ao fazer parse de impostos_dinamicos:', e)
              item.impostos_dinamicos = []
            }
          }
          return item
        })
        setViewingItens(itensProcessados)
      } else {
        console.warn('⚠️ [NOTAS-FISCAIS] Não foi possível buscar itens')
        setViewingItens([])
      }
    } catch (error) {
      console.error('❌ [NOTAS-FISCAIS] Erro ao buscar detalhes da nota fiscal:', error)
      console.error('❌ [NOTAS-FISCAIS] Stack:', error instanceof Error ? error.stack : 'N/A')
      toast({
        title: "Aviso",
        description: "Não foi possível carregar todos os detalhes. Exibindo informações disponíveis.",
        variant: "default"
      })
      setViewingItens([])
    } finally {
      console.log('🔍 [NOTAS-FISCAIS] Finalizando loading...')
      setLoadingDetalhesNota(false)
    }
  }

  const handleUpload = (nota: NotaFiscal) => {
    setUploadingNota(nota)
    setUploadFile(null)
    setIsUploadDialogOpen(true)
  }

  const handleFileUpload = async () => {
    if (!uploadingNota || !uploadFile) return

    try {
      setUploading(true)
      const response = await notasFiscaisApi.uploadFile(uploadingNota.id, uploadFile)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Arquivo enviado com sucesso"
        })
        setIsUploadDialogOpen(false)
        setUploadingNota(null)
        setUploadFile(null)
        await carregarNotasFiscais()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do arquivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (nota: NotaFiscal) => {
    if (!nota.arquivo_nf) {
      toast({
        title: "Aviso",
        description: "Arquivo não disponível",
        variant: "destructive"
      })
      return
    }

    try {
      // Abrir arquivo em nova aba
      window.open(nota.arquivo_nf, '_blank')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer download do arquivo",
        variant: "destructive"
      })
    }
  }

  const getBoletoComArquivo = (nota: NotaFiscal) => {
    return nota.boletos?.find((boleto) => Boolean(boleto.arquivo_boleto))
  }

  const handleDownloadBoletoVinculado = (nota: NotaFiscal) => {
    const boleto = getBoletoComArquivo(nota)
    if (!boleto?.arquivo_boleto) {
      toast({
        title: "Aviso",
        description: "Nenhum arquivo de boleto vinculado disponível para download",
        variant: "destructive"
      })
      return
    }

    try {
      window.open(boleto.arquivo_boleto, '_blank')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer download do boleto",
        variant: "destructive"
      })
    }
  }

  const handleDownloadBoletoPorArquivo = (arquivoBoleto?: string | null) => {
    if (!arquivoBoleto) {
      toast({
        title: "Aviso",
        description: "Arquivo do boleto não disponível para download",
        variant: "destructive"
      })
      return
    }

    try {
      window.open(arquivoBoleto, '_blank')
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer download do boleto",
        variant: "destructive"
      })
    }
  }

  const handleOpenEnviarEmail = (nota: NotaFiscal) => {
    if (!nota.cliente_id) {
      toast({
        title: "Aviso",
        description: "Associe um cliente à nota para enviar por e-mail",
        variant: "destructive"
      })
      return
    }
    if (!nota.arquivo_nf) {
      toast({
        title: "Aviso",
        description: "Faça o upload do arquivo da nota fiscal antes de enviar por e-mail",
        variant: "destructive"
      })
      return
    }
    setEmailNota(nota)
    setEmailExtra("")
    setIncluirEmailsCliente(true)
    setAnexarBoletoEmail(true)
    setEmailDialogOpen(true)
  }

  const handleConfirmEnviarEmail = async () => {
    if (!emailNota) return
    setEmailSending(true)
    try {
      const res = await notasFiscaisApi.enviarPorEmail(emailNota.id, {
        email: emailExtra.trim() || undefined,
        incluir_contato_cliente: incluirEmailsCliente,
        anexar_boleto: anexarBoletoEmail,
      })
      const avisos = res?.data?.avisos as string[] | undefined
      toast({
        title: "E-mail enviado",
        description: avisos?.length
          ? `${res?.message || "Enviado com sucesso"} ${avisos.join(" ")}`
          : res?.message || "Nota fiscal enviada por e-mail",
      })
      setEmailDialogOpen(false)
      setEmailNota(null)
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Erro ao enviar e-mail"
      toast({
        title: "Erro",
        description: typeof msg === "string" ? msg : "Erro ao enviar e-mail",
        variant: "destructive",
      })
    } finally {
      setEmailSending(false)
    }
  }

  const resetForm = () => {
    setFormData({
      numero_nf: '',
      serie: '',
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: '',
      valor_total: 0,
      tipo: activeTab,
      status: 'pendente',
      tipo_nota: activeTab === 'saida' ? 'nf_locacao' : 'nf_servico',
      observacoes: ''
    })
    setFormFile(null)
    setItens([])
    setGruaInfo(null)
    setCriarBoleto(false)
    setFormaPagamento('')
    setTipoPagamentoPersonalizado('')
    setBoletoFile(null)
    setContaBancariaSelecionada(null)
    setVincularCompraExistente(false)
    setMedicaoIdParaImportar('')
  }

  // Função para preencher dados de teste do item
  const preencherDadosItemTeste = () => {
    const precoUnitario = 1000
    const quantidade = 1
    const precoTotal = precoUnitario * quantidade
    
    const itemTeste: NotaFiscalItem = {
      descricao: 'Serviço de Locação de Guindaste',
      unidade: 'MES',
      quantidade: quantidade,
      preco_unitario: precoUnitario,
      preco_total: precoTotal,
      codigo_produto: 'SRV001',
      ncm_sh: '8425.20.00',
      cfop: '5102',
      csosn: '101',
      base_calculo_icms: precoTotal,
      percentual_icms: 12,
      valor_icms: 0, // Será calculado
      percentual_ipi: 0,
      valor_ipi: 0,
      base_calculo_issqn: precoTotal,
      aliquota_issqn: 5,
      valor_issqn: 0, // Será calculado
      valor_inss: 0,
      valor_cbs: 0,
      valor_liquido: 0, // Será calculado
      impostos_dinamicos: []
    }
    
    // Calcular impostos usando a função calcularImpostos
    const itemCalculado = calcularImpostos(itemTeste)
    setItemFormData(itemCalculado)
    
    toast({
      title: "Dados de teste preenchidos",
      description: "Os campos do item foram preenchidos com dados de exemplo",
    })
  }

  // Função para preencher dados de teste
  const preencherDadosTeste = () => {
    const hoje = new Date()
    const vencimento = new Date(hoje)
    vencimento.setDate(vencimento.getDate() + 30) // 30 dias a partir de hoje
    
    // Calcular valores do item de teste
    const precoTotal = 10000
    const valorICMS = 1200
    const valorIPI = 0
    const valorISSQN = 500
    const valorINSS = 0
    const valorCBS = 0
    const totalImpostosFixos = valorICMS + valorIPI + valorISSQN + valorINSS + valorCBS
    const valorLiquido = precoTotal - totalImpostosFixos
    
    // Usar formData.tipo se disponível, senão usar activeTab
    const tipoNotaFiscal = formData.tipo || activeTab
    
    const dadosTeste: NotaFiscalCreate = {
      numero_nf: `NF${Date.now().toString().slice(-8)}`,
      serie: '001',
      data_emissao: hoje.toISOString().split('T')[0],
      data_vencimento: vencimento.toISOString().split('T')[0],
      valor_total: precoTotal,
      tipo: tipoNotaFiscal,
      status: 'pendente',
      tipo_nota: tipoNotaFiscal === 'saida' ? 'nf_locacao' : 'nf_servico',
      observacoes: 'Nota fiscal de teste - dados preenchidos automaticamente',
      cliente_id: tipoNotaFiscal === 'saida' && clientes.length > 0 ? clientes[0].id : undefined,
      fornecedor_id: tipoNotaFiscal === 'entrada' && fornecedores.length > 0 ? fornecedores[0].id : undefined
    }
    
    setFormData(dadosTeste)
    
    // Adicionar um item de teste com cálculo correto
    const itemTeste: NotaFiscalItem = {
      descricao: 'Serviço de Locação de Guindaste',
      unidade: 'MES',
      quantidade: 1,
      preco_unitario: precoTotal,
      preco_total: precoTotal,
      codigo_produto: 'SRV001',
      ncm_sh: '8425.20.00',
      cfop: '5102',
      csosn: '101',
      base_calculo_icms: precoTotal,
      percentual_icms: 12,
      valor_icms: valorICMS,
      percentual_ipi: 0,
      valor_ipi: valorIPI,
      base_calculo_issqn: precoTotal,
      aliquota_issqn: 5,
      valor_issqn: valorISSQN,
      valor_inss: valorINSS,
      valor_cbs: valorCBS,
      valor_liquido: valorLiquido,
      impostos_dinamicos: []
    }
    
    // Calcular impostos do item usando a função calcularImpostos
    const itemCalculado = calcularImpostos(itemTeste)
    setItens([itemCalculado])
    
    // Atualizar valor total do formulário
    setFormData({ ...dadosTeste, valor_total: precoTotal })
    
    toast({
      title: "Dados de teste preenchidos",
      description: "Os campos foram preenchidos com dados de exemplo",
    })
  }

  // Função para parsear XML de NFe e preencher o formulário automaticamente
  const parseNFeXML = async (file: File) => {
    setParseandoXmlNfe(true)
    try {
      const xmlBuffer = await file.arrayBuffer()
      const xmlBytes = new Uint8Array(xmlBuffer)

      // Alguns emissores geram XML em ANSI/Latin-1 mesmo declarando UTF-8.
      // Fazemos fallback de decodificação para preservar acentuação.
      const utf8Text = new TextDecoder('utf-8').decode(xmlBytes)
      const encodingMatch = utf8Text.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i)
      const declaredEncoding = encodingMatch?.[1]?.trim().toLowerCase()

      const decodeCandidates = Array.from(new Set([
        declaredEncoding,
        'utf-8',
        'windows-1252',
        'iso-8859-1'
      ].filter(Boolean) as string[]))

      const decodingScore = (value: string) => {
        const replacementChars = (value.match(/\uFFFD/g) || []).length
        return replacementChars
      }

      let text = utf8Text
      let bestScore = decodingScore(utf8Text)

      for (const encoding of decodeCandidates) {
        try {
          const candidateText = new TextDecoder(encoding).decode(xmlBytes)
          const candidateScore = decodingScore(candidateText)
          if (candidateScore < bestScore) {
            text = candidateText
            bestScore = candidateScore
          }
        } catch {
          // Ignora encoding não suportado no navegador
        }
      }

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')

      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        toast({
          title: "Erro no XML",
          description: "O arquivo XML não é válido ou está corrompido",
          variant: "destructive"
        })
        return
      }

      // Helper: busca tag considerando namespace
      const getTagValue = (parent: Element | Document, tagName: string): string => {
        const el = parent.getElementsByTagNameNS('*', tagName)[0] ||
                   parent.getElementsByTagName(tagName)[0]
        return el?.textContent?.trim() || ''
      }

      const getTagElement = (parent: Element | Document, tagName: string): Element | null => {
        return parent.getElementsByTagNameNS('*', tagName)[0] ||
               parent.getElementsByTagName(tagName)[0] || null
      }

      /** CNPJ/CPF em NFS-e ABRASF: geralmente em IdentificacaoTomador/CpfCnpj/Cnpj ou Prestador/CpfCnpj/Cnpj */
      const getDocFromNfseParty = (partyEl: Element | null): string => {
        if (!partyEl) return ''
        const direto =
          getTagValue(partyEl, 'CNPJ') ||
          getTagValue(partyEl, 'CPF') ||
          getTagValue(partyEl, 'Cnpj') ||
          getTagValue(partyEl, 'Cpf')
        if (direto) return direto.replace(/\D/g, '')
        const idTom = getTagElement(partyEl, 'IdentificacaoTomador')
        const idPrest = getTagElement(partyEl, 'IdentificacaoPrestador')
        const idEl = idTom || idPrest
        if (idEl) {
          const cpfCnpj = getTagElement(idEl, 'CpfCnpj')
          if (cpfCnpj) {
            const nested =
              getTagValue(cpfCnpj, 'CNPJ') ||
              getTagValue(cpfCnpj, 'CPF') ||
              getTagValue(cpfCnpj, 'Cnpj') ||
              getTagValue(cpfCnpj, 'Cpf')
            if (nested) return nested.replace(/\D/g, '')
          }
        }
        const cpfCnpjRoot = getTagElement(partyEl, 'CpfCnpj')
        if (cpfCnpjRoot) {
          const nested =
            getTagValue(cpfCnpjRoot, 'CNPJ') ||
            getTagValue(cpfCnpjRoot, 'CPF') ||
            getTagValue(cpfCnpjRoot, 'Cnpj') ||
            getTagValue(cpfCnpjRoot, 'Cpf')
          if (nested) return nested.replace(/\D/g, '')
        }
        return ''
      }

      const normalizeImportedText = (value: string): string => {
        if (!value) return value

        const replacements: Array<[RegExp, string]> = [
          [/Servi\?os/g, 'Serviços'],
          [/servi\?os/g, 'serviços'],
          [/Servi\?o/g, 'Serviço'],
          [/servi\?o/g, 'serviço'],
          [/per\?odo/g, 'período'],
          [/Per\?odo/g, 'Período'],
          [/MEDI\?\?O/g, 'MEDIÇÃO'],
          [/Medi\?\?o/g, 'Medição'],
          [/medi\?\?o/g, 'medição'],
          [/opera\?\?o/g, 'operação'],
          [/Opera\?\?o/g, 'Operação'],
          [/eleva\?\?o/g, 'elevação'],
          [/Eleva\?\?o/g, 'Elevação'],
          [/manuten\?\?o/g, 'manutenção'],
          [/Manuten\?\?o/g, 'Manutenção']
        ]

        return replacements.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), value)
      }

      // Verificar se é um XML de NFe/NFS-e válido
      const infNFe = getTagElement(xmlDoc, 'infNFe')
      const infNfse =
        getTagElement(xmlDoc, 'InfNfse') ||
        getTagElement(xmlDoc, 'infNFSe') ||
        getTagElement(xmlDoc, 'infNfse')
      if (!infNFe && !infNfse) {
        toast({
          title: "XML inválido",
          description: "Este arquivo não parece ser um XML de NFe/NFS-e válido",
          variant: "destructive"
        })
        return
      }

      // Branch NFS-e (serviços): ABRASF (InfNfse) ou NFS-e Nacional (infNFSe + DPS/infDPS)
      if (!infNFe && infNfse) {
        const dpsWrapper = getTagElement(infNfse, 'DPS')
        const infDps = dpsWrapper ? getTagElement(dpsWrapper, 'infDPS') : null

        let prestador: Element | null = null
        let tomador: Element | null = null
        let numeroNfse = ''
        let dataEmissaoNfse = ''
        let valorTotalCalculado = 0
        let valorIss = 0
        let valorInss = 0
        let codigoVerificacao = ''
        let chaveAcessoNfse: string | undefined
        let discriminacao = ''
        let xDocReembolso = ''
        let itemListaServico = ''
        let serieNfse = 'NFS-e'
        let infoComplObs = ''

        if (infDps) {
          prestador = getTagElement(infDps, 'prest')
          tomador = getTagElement(infDps, 'toma')
          serieNfse = getTagValue(infDps, 'serie') || 'NFS-e'

          const valoresRaiz = getTagElement(infNfse, 'valores')
          const vLiqRaiz = valoresRaiz ? parseFloat(getTagValue(valoresRaiz, 'vLiq')) : 0

          const ibsRoot = getTagElement(infNfse, 'IBSCBS')
          const valoresIbsRoot = ibsRoot ? getTagElement(ibsRoot, 'valores') : null
          const totCibsRoot = ibsRoot ? getTagElement(ibsRoot, 'totCIBS') : null
          const vTotNfXmlRoot = parseFloat(totCibsRoot ? getTagValue(totCibsRoot, 'vTotNF') : '0') || 0
          const vCalcReeRepResRoot =
            parseFloat(valoresIbsRoot ? getTagValue(valoresIbsRoot, 'vCalcReeRepRes') : '0') || 0

          const serv = getTagElement(infDps, 'serv')
          const cServ = serv ? getTagElement(serv, 'cServ') : null
          const infoCompl = serv ? getTagElement(serv, 'infoCompl') : null
          infoComplObs = infoCompl ? normalizeImportedText(getTagValue(infoCompl, 'xInfComp')) : ''

          const valoresDps = getTagElement(infDps, 'valores')
          const vServPrest = valoresDps ? getTagElement(valoresDps, 'vServPrest') : null
          const valorServicos = vServPrest ? parseFloat(getTagValue(vServPrest, 'vServ')) : 0

          const ibscbsDps = getTagElement(infDps, 'IBSCBS')
          let docOutroEl: Element | null = null
          let vlrReeRepResXml = 0
          if (ibscbsDps) {
            const valoresIb = getTagElement(ibscbsDps, 'valores')
            const gRee = valoresIb ? getTagElement(valoresIb, 'gReeRepRes') : null
            const documentosEl = gRee ? getTagElement(gRee, 'documentos') : null
            docOutroEl = documentosEl ? getTagElement(documentosEl, 'docOutro') : null
            vlrReeRepResXml = parseFloat(documentosEl ? getTagValue(documentosEl, 'vlrReeRepRes') : '0') || 0
          }

          numeroNfse =
            getTagValue(infNfse, 'nNFSe') ||
            getTagValue(infNfse, 'nDFSe') ||
            getTagValue(infDps, 'nDPS')
          const dataEmissaoNfseRaw = getTagValue(infDps, 'dhEmi') || getTagValue(infNfse, 'dhProc')
          dataEmissaoNfse = dataEmissaoNfseRaw
            ? dataEmissaoNfseRaw.split('T')[0]
            : new Date().toISOString().split('T')[0]

          valorTotalCalculado =
            valorServicos > 0
              ? valorServicos
              : vLiqRaiz || vTotNfXmlRoot || vCalcReeRepResRoot || vlrReeRepResXml || 0

          discriminacao = cServ ? normalizeImportedText(getTagValue(cServ, 'xDescServ')) : ''
          xDocReembolso = docOutroEl ? normalizeImportedText(getTagValue(docOutroEl, 'xDoc')) : ''
          itemListaServico = cServ ? getTagValue(cServ, 'cTribNac') || getTagValue(cServ, 'cTribMun') : ''

          const idNf = infNfse.getAttribute('Id')
          if (idNf) chaveAcessoNfse = idNf.replace(/^NFS/i, '')
        } else {
          const declaracao = getTagElement(infNfse, 'InfDeclaracaoPrestacaoServico')
          const servico = declaracao ? getTagElement(declaracao, 'Servico') : null
          const valoresServico = servico ? getTagElement(servico, 'Valores') : null
          tomador =
            declaracao
              ? getTagElement(declaracao, 'TomadorServico') || getTagElement(declaracao, 'Tomador')
              : null
          prestador = declaracao ? getTagElement(declaracao, 'Prestador') : null

          const valoresNfseEl = getTagElement(infNfse, 'ValoresNfse')
          const valorLiquidoNfse = parseFloat(valoresNfseEl ? getTagValue(valoresNfseEl, 'ValorLiquidoNfse') : '0') || 0
          const notaNacional = getTagElement(infNfse, 'NotaNacional')
          const ibscbsNacional = notaNacional ? getTagElement(notaNacional, 'IBSCBS') : null
          const valoresNacional = ibscbsNacional ? getTagElement(ibscbsNacional, 'valores') : null
          const totCibs = ibscbsNacional ? getTagElement(ibscbsNacional, 'totCIBS') : null
          const vTotNfXml = parseFloat(totCibs ? getTagValue(totCibs, 'vTotNF') : '0') || 0
          const vCalcReeRepRes = parseFloat(valoresNacional ? getTagValue(valoresNacional, 'vCalcReeRepRes') : '0') || 0
          const documentosEl = servico ? getTagElement(servico, 'documentos') : null
          const docOutroEl = documentosEl
            ? getTagElement(documentosEl, 'docOutro')
            : servico
              ? getTagElement(servico, 'docOutro')
              : null
          const vlrReeRepResXml =
            parseFloat(documentosEl ? getTagValue(documentosEl, 'vlrReeRepRes') : '0') || 0

          numeroNfse = getTagValue(infNfse, 'Numero')
          const dataEmissaoNfseRaw = getTagValue(infNfse, 'DataEmissao')
          dataEmissaoNfse = dataEmissaoNfseRaw
            ? dataEmissaoNfseRaw.split('T')[0]
            : new Date().toISOString().split('T')[0]
          const valorServicos = parseFloat(valoresServico ? getTagValue(valoresServico, 'ValorServicos') : '0') || 0
          /** Muitos XMLs ABRASF 2.x deixam ValorServicos em 0 e o total em ValorLiquidoNfse / Nota Nacional / reembolso */
          valorTotalCalculado =
            valorServicos > 0
              ? valorServicos
              : valorLiquidoNfse ||
                vTotNfXml ||
                vCalcReeRepRes ||
                vlrReeRepResXml ||
                0
          valorIss =
            parseFloat(
              (valoresServico ? getTagValue(valoresServico, 'ValorIss') : '') || getTagValue(infNfse, 'ValorIss')
            ) || 0
          valorInss = parseFloat(valoresServico ? getTagValue(valoresServico, 'ValorInss') : '0') || 0
          codigoVerificacao = getTagValue(infNfse, 'CodigoVerificacao')
          discriminacao = normalizeImportedText(servico ? getTagValue(servico, 'Discriminacao') : '')
          xDocReembolso = docOutroEl ? normalizeImportedText(getTagValue(docOutroEl, 'xDoc')) : ''
          itemListaServico = servico ? getTagValue(servico, 'ItemListaServico') : ''
        }

        const descricaoItem =
          discriminacao && !/^nota fiscal sem item de servi[cç]o\s*$/i.test(discriminacao.trim())
            ? discriminacao
            : xDocReembolso || discriminacao || 'Serviço'

        const tipoNotaSelecionado: 'saida' | 'entrada' = (formData.tipo || activeTab) as 'saida' | 'entrada'
        const dadosNfse: NotaFiscalCreate = {
          numero_nf: numeroNfse || `NFSE-${Date.now().toString().slice(-6)}`,
          serie: serieNfse,
          data_emissao: dataEmissaoNfse,
          data_vencimento: '',
          valor_total: valorTotalCalculado,
          tipo: tipoNotaSelecionado,
          status: 'pendente',
          tipo_nota: 'nf_servico',
          eletronica: true,
          chave_acesso: codigoVerificacao || chaveAcessoNfse || undefined,
          observacoes:
            [normalizeImportedText(discriminacao), xDocReembolso, infoComplObs].filter(Boolean).join('\n\n') ||
            undefined
        }

        if (tipoNotaSelecionado === 'saida' && tomador) {
          const docTomador = getDocFromNfseParty(tomador)

          if (docTomador) {
            const clienteEncontrado = clientes.find((c) => (c.cnpj || '').replace(/\D/g, '') === docTomador)
            if (clienteEncontrado) {
              dadosNfse.cliente_id = clienteEncontrado.id
            }
          }
        } else if (tipoNotaSelecionado === 'entrada' && prestador) {
          const docPrestador = getDocFromNfseParty(prestador)

          if (docPrestador) {
            const fornecedorEncontrado = fornecedores.find((f) => (f.cnpj || '').replace(/\D/g, '') === docPrestador)
            if (fornecedorEncontrado) {
              dadosNfse.fornecedor_id = fornecedorEncontrado.id
            }
          }
        }

        const itemNfse: NotaFiscalItem = calcularImpostos({
          codigo_produto: itemListaServico || 'SERVICO',
          ncm_sh: '',
          descricao: descricaoItem,
          unidade: 'SV',
          quantidade: 1,
          preco_unitario: valorTotalCalculado,
          preco_total: valorTotalCalculado,
          cfop: '',
          csosn: '',
          base_calculo_icms: undefined,
          percentual_icms: undefined,
          valor_icms: 0,
          percentual_ipi: undefined,
          valor_ipi: 0,
          valor_issqn: valorIss,
          valor_inss: valorInss,
          valor_cbs: 0,
          valor_liquido: valorTotalCalculado - valorIss - valorInss,
          impostos_dinamicos: []
        })

        setFormData(dadosNfse)
        setItens([itemNfse])

        toast({
          title: "XML NFS-e importado com sucesso",
          description: `Dados extraídos: NFS-e ${dadosNfse.numero_nf}. Valor: R$ ${valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Confira e complete os dados antes de salvar.`,
        })

        return
      }

      const ide = getTagElement(infNFe, 'ide')
      const dest = getTagElement(infNFe, 'dest')
      const emit = getTagElement(infNFe, 'emit')
      const totalEl = getTagElement(infNFe, 'total')
      const pagEl = getTagElement(infNFe, 'pag')
      const infAdic = getTagElement(infNFe, 'infAdic')

      // === Dados do Cabeçalho ===
      const nNF = ide ? getTagValue(ide, 'nNF') : ''
      const serie = ide ? getTagValue(ide, 'serie') : ''
      const tpNF = ide ? getTagValue(ide, 'tpNF') : ''
      const dhEmi = ide ? getTagValue(ide, 'dhEmi') : ''
      const natOp = ide ? getTagValue(ide, 'natOp') : ''

      const dataEmissao = dhEmi ? dhEmi.split('T')[0] : new Date().toISOString().split('T')[0]

      // Valor total
      const icmsTot = totalEl ? getTagElement(totalEl, 'ICMSTot') : null
      const vNF = icmsTot ? getTagValue(icmsTot, 'vNF') : '0'

      // Chave de acesso
      const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || ''

      // Data de vencimento (duplicatas)
      let dataVencimento = ''
      const cobr = getTagElement(infNFe, 'cobr')
      if (cobr) {
        const dup = getTagElement(cobr, 'dup')
        if (dup) {
          dataVencimento = getTagValue(dup, 'dVenc')
        }
      }

      // Forma de pagamento
      let formaPagamentoXML = ''
      if (pagEl) {
        const detPag = getTagElement(pagEl, 'detPag')
        if (detPag) {
          const tPag = getTagValue(detPag, 'tPag')
          switch (tPag) {
            case '01': formaPagamentoXML = 'dinheiro'; break
            case '02': formaPagamentoXML = 'cheque'; break
            case '03': case '04': formaPagamentoXML = 'cartao_credito'; break
            case '05': formaPagamentoXML = 'cartao_credito'; break
            case '10': case '11': case '12': case '13': formaPagamentoXML = 'cartao_debito'; break
            case '15': formaPagamentoXML = 'boleto'; break
            case '17': formaPagamentoXML = 'pix'; break
            case '16': formaPagamentoXML = 'transferencia'; break
            case '90': formaPagamentoXML = ''; break // sem pagamento
            default: formaPagamentoXML = ''; break
          }
        }
      }

      // Observações
      const observacoes = normalizeImportedText(infAdic ? getTagValue(infAdic, 'infCpl') : '')

      // Tipo indicado no XML (tpNF: 1=saida, 0=entrada)
      const tipoNotaXml: 'saida' | 'entrada' = tpNF === '1' ? 'saida' : 'entrada'
      // Regra da tela: manter o tipo escolhido manualmente no formulário/aba
      const tipoNotaSelecionado: 'saida' | 'entrada' = (formData.tipo || activeTab) as 'saida' | 'entrada'

      // Tipo de nota fiscal: NFe eletrônica por padrão quando vem de XML
      const tipoNotaCategoria = 'nfe_eletronica'

      // === Preencher FormData ===
      const dadosXML: NotaFiscalCreate = {
        numero_nf: nNF,
        serie: serie,
        data_emissao: dataEmissao,
        data_vencimento: dataVencimento,
        valor_total: parseFloat(vNF) || 0,
        tipo: tipoNotaSelecionado,
        status: 'pendente',
        tipo_nota: tipoNotaCategoria,
        eletronica: true,
        chave_acesso: chaveAcesso,
        observacoes: observacoes
      }

      // === Buscar cliente/fornecedor pelo CNPJ ===
      if (tipoNotaSelecionado === 'saida' && dest) {
        const cnpjDest = getTagValue(dest, 'CNPJ')
        const cpfDest = getTagValue(dest, 'CPF')
        const docDest = cnpjDest || cpfDest

        if (docDest) {
          const docLimpo = docDest.replace(/\D/g, '')
          const clienteEncontrado = clientes.find(c => {
            const cnpjCliente = (c.cnpj || '').replace(/\D/g, '')
            return cnpjCliente === docLimpo
          })
          if (clienteEncontrado) {
            dadosXML.cliente_id = clienteEncontrado.id
          } else {
            const nomeDest = getTagValue(dest, 'xNome')
            toast({
              title: "Cliente não encontrado",
              description: `Nenhum cliente com CNPJ/CPF ${docDest} encontrado. Nome no XML: "${nomeDest}". Selecione manualmente.`,
              variant: "default"
            })
          }
        }
      } else if (tipoNotaSelecionado === 'entrada' && emit) {
        const cnpjEmit = getTagValue(emit, 'CNPJ')
        const cpfEmit = getTagValue(emit, 'CPF')
        const docEmit = cnpjEmit || cpfEmit

        if (docEmit) {
          const docLimpo = docEmit.replace(/\D/g, '')
          const fornecedorEncontrado = fornecedores.find(f => {
            const cnpjFornecedor = (f.cnpj || '').replace(/\D/g, '')
            return cnpjFornecedor === docLimpo
          })
          if (fornecedorEncontrado) {
            dadosXML.fornecedor_id = fornecedorEncontrado.id
          } else {
            const nomeEmit = getTagValue(emit, 'xNome')
            toast({
              title: "Fornecedor não encontrado",
              description: `Nenhum fornecedor com CNPJ/CPF ${docEmit} encontrado. Nome no XML: "${nomeEmit}". Selecione manualmente.`,
              variant: "default"
            })
          }
        }
      }

      setFormData(dadosXML)
      if (formaPagamentoXML) {
        setFormaPagamento(formaPagamentoXML)
        setCriarBoleto(formaPagamentoXML === 'boleto')
      }

      // === Itens da Nota ===
      const detElements = infNFe.getElementsByTagNameNS('*', 'det')
      const detFallback = detElements.length > 0 ? detElements : infNFe.getElementsByTagName('det')
      const itensXML: NotaFiscalItem[] = []

      for (let i = 0; i < detFallback.length; i++) {
        const det = detFallback[i]
        const prod = getTagElement(det, 'prod')
        const impostoEl = getTagElement(det, 'imposto')
        if (!prod) continue

        const qCom = parseFloat(getTagValue(prod, 'qCom')) || 1
        const vUnCom = parseFloat(getTagValue(prod, 'vUnCom')) || 0
        const vProd = parseFloat(getTagValue(prod, 'vProd')) || qCom * vUnCom

        // Extrair CSOSN ou CST do ICMS
        let csosn = ''
        if (impostoEl) {
          const icmsEl = getTagElement(impostoEl, 'ICMS')
          if (icmsEl) {
            csosn = getTagValue(icmsEl, 'CSOSN') || getTagValue(icmsEl, 'CST') || ''
          }
        }

        // Extrair valores de impostos do item
        let baseCalcICMS = 0
        let pICMS = 0
        let vICMS = 0
        let pIPI = 0
        let vIPI = 0
        let vPIS = 0
        let pPIS = 0
        let vCOFINS = 0
        let pCOFINS = 0
        let vTotTribItem = 0

        if (impostoEl) {
          // ICMS
          const icmsEl = getTagElement(impostoEl, 'ICMS')
          if (icmsEl) {
            baseCalcICMS = parseFloat(getTagValue(icmsEl, 'vBC')) || 0
            pICMS = parseFloat(getTagValue(icmsEl, 'pICMS')) || 0
            vICMS = parseFloat(getTagValue(icmsEl, 'vICMS')) || 0
          }
          // IPI
          const ipiEl = getTagElement(impostoEl, 'IPI')
          if (ipiEl) {
            pIPI = parseFloat(getTagValue(ipiEl, 'pIPI')) || 0
            vIPI = parseFloat(getTagValue(ipiEl, 'vIPI')) || 0
          }
          // PIS
          const pisEl = getTagElement(impostoEl, 'PIS')
          if (pisEl) {
            vPIS = parseFloat(getTagValue(pisEl, 'vPIS')) || 0
            pPIS = parseFloat(getTagValue(pisEl, 'pPIS')) || 0
          }
          // COFINS
          const cofinsEl = getTagElement(impostoEl, 'COFINS')
          if (cofinsEl) {
            vCOFINS = parseFloat(getTagValue(cofinsEl, 'vCOFINS')) || 0
            pCOFINS = parseFloat(getTagValue(cofinsEl, 'pCOFINS')) || 0
          }
          // Tributos aproximados (IBPT)
          vTotTribItem = parseFloat(getTagValue(impostoEl, 'vTotTrib')) || 0
        }

        // Montar impostos dinâmicos a partir dos dados do XML
        const impostosDinamicos: ImpostoDinamico[] = []

        if (vPIS > 0 || pPIS > 0) {
          impostosDinamicos.push({
            id: `pis_${i}`,
            nome: 'PIS',
            tipo: 'federal',
            tipo_calculo: pPIS > 0 ? 'porcentagem' : 'valor_fixo',
            base_calculo: pPIS > 0 ? vProd : 0,
            aliquota: pPIS,
            valor_fixo: pPIS > 0 ? undefined : vPIS,
            valor_calculado: vPIS || (vProd * pPIS / 100)
          })
        }

        if (vCOFINS > 0 || pCOFINS > 0) {
          impostosDinamicos.push({
            id: `cofins_${i}`,
            nome: 'COFINS',
            tipo: 'federal',
            tipo_calculo: pCOFINS > 0 ? 'porcentagem' : 'valor_fixo',
            base_calculo: pCOFINS > 0 ? vProd : 0,
            aliquota: pCOFINS,
            valor_fixo: pCOFINS > 0 ? undefined : vCOFINS,
            valor_calculado: vCOFINS || (vProd * pCOFINS / 100)
          })
        }

        if (vTotTribItem > 0) {
          const totalJaContabilizado = vICMS + vIPI + vPIS + vCOFINS
          const tribApprox = vTotTribItem - totalJaContabilizado
          if (tribApprox > 0.01) {
            impostosDinamicos.push({
              id: `trib_aprox_${i}`,
              nome: 'Tributos Aproximados (IBPT)',
              tipo: 'informativo',
              tipo_calculo: 'valor_fixo',
              base_calculo: vProd,
              aliquota: 0,
              valor_fixo: tribApprox,
              valor_calculado: tribApprox
            })
          }
        }

        const item: NotaFiscalItem = {
          codigo_produto: getTagValue(prod, 'cProd'),
          ncm_sh: getTagValue(prod, 'NCM'),
          descricao: normalizeImportedText(getTagValue(prod, 'xProd')),
          unidade: getTagValue(prod, 'uCom') || 'UN',
          quantidade: qCom,
          preco_unitario: vUnCom,
          preco_total: vProd,
          cfop: getTagValue(prod, 'CFOP'),
          csosn: csosn,
          base_calculo_icms: baseCalcICMS || undefined,
          percentual_icms: pICMS || undefined,
          valor_icms: vICMS,
          percentual_ipi: pIPI || undefined,
          valor_ipi: vIPI,
          valor_issqn: 0,
          valor_inss: 0,
          valor_cbs: 0,
          valor_liquido: 0,
          impostos_dinamicos: impostosDinamicos
        }

        const itemCalculado = calcularImpostos(item)
        /**
         * NF-e: vNF e vProd refletem o valor da mercadoria; tributos (ICMS, PIS, COFINS etc.) vêm discriminados.
         * Não reduzir valor_liquido pela soma dos tributos — isso gerava linha ~2681 quando vNF=3091 (ex.: compra interestadual),
         * divergindo do total da nota e da expectativa do cliente.
         */
        itemCalculado.valor_liquido = itemCalculado.preco_total
        itensXML.push(itemCalculado)
      }

      if (itensXML.length > 0) {
        setItens(itensXML)
      }

      if (tipoNotaXml !== tipoNotaSelecionado) {
        toast({
          title: "Importação concluída",
          description: `O XML indica nota de ${tipoNotaXml === 'saida' ? 'saída' : 'entrada'}, mas o tipo escolhido foi mantido como ${tipoNotaSelecionado === 'saida' ? 'saída' : 'entrada'}.`,
          variant: "default"
        })
      }

      const totalItens = itensXML.length
      toast({
        title: "XML importado com sucesso",
        description: `Dados extraídos: NF ${nNF}, Série ${serie}, ${totalItens} item(ns). Valor: R$ ${parseFloat(vNF).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Confira e complete os dados antes de salvar.`,
      })

    } catch (error: any) {
      console.error('Erro ao parsear XML:', error)
      toast({
        title: "Erro ao ler XML",
        description: error.message || "Não foi possível extrair os dados do XML",
        variant: "destructive"
      })
    } finally {
      setParseandoXmlNfe(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-'
      
      // Se já está no formato YYYY-MM-DD, parsear manualmente para evitar problemas de timezone
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (match) {
        const [, ano, mes, dia] = match
        // Criar Date usando ano, mês e dia diretamente (mês é 0-indexed no JavaScript)
        const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
        return format(date, "dd/MM/yyyy", { locale: ptBR })
      }
      
      // Se tem T (ISO format), parsear manualmente também
      if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0]
        const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
          const [, ano, mes, dia] = match
          const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
          return format(date, "dd/MM/yyyy", { locale: ptBR })
        }
      }
      
      // Fallback para formato padrão
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      paga: { label: "Paga", variant: "default" },
      vencida: { label: "Vencida", variant: "destructive" },
      cancelada: { label: "Cancelada", variant: "secondary" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getStatusBoletoBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      pago: { label: "Pago", variant: "default" },
      vencido: { label: "Vencido", variant: "destructive" },
      cancelado: { label: "Cancelado", variant: "secondary" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const renderCobrancaNota = (nota: NotaFiscal) => {
    const boletosVinculados = nota.boletos || []
    if (boletosVinculados.length === 0) {
      return <span className="text-gray-400">Sem boleto</span>
    }

    const boletoPrincipal = boletosVinculados[0]
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">Boleto {boletoPrincipal.numero_boleto}</div>
        <div className="text-xs text-muted-foreground">Forma de cobrança vinculada</div>
      </div>
    )
  }

  const getTipoNotaLabel = (tipo?: string) => {
    const tipos: Record<string, string> = {
      nf_servico: 'NFs (Serviço)',
      nf_locacao: 'NF Locação',
      fatura: 'Fatura',
      nfe_eletronica: 'NFe (Eletrônica)',
      // Compatibilidade com valores antigos
      locacao: 'NF Locação',
      circulacao_equipamentos: 'NFs (Serviço)',
      outros_equipamentos: 'NFs (Serviço)',
      medicao: 'NFs (Serviço)',
      fornecedor: 'NFs (Serviço)'
    }
    return tipos[tipo || ''] || tipo || '-'
  }

  const calcularValorSaidaSemImpostos = (nota: NotaFiscal) => {
    const totalImpostos = (
      (nota.valor_icms || 0) +
      (nota.valor_icms_st || 0) +
      (nota.valor_fcp_st || 0) +
      (nota.valor_ipi || 0) +
      (nota.valor_pis || 0) +
      (nota.valor_cofins || 0) +
      (nota.valor_inss || 0) +
      (nota.valor_ir || 0) +
      (nota.valor_csll || 0) +
      (nota.valor_issqn || 0) +
      (nota.retencoes_federais || 0) +
      (nota.outras_retencoes || 0)
    )
    return Math.max((nota.valor_total || 0) - totalImpostos, 0)
  }

  const getValorExibicaoNota = (nota: NotaFiscal) => {
    if (nota.tipo === 'saida') {
      return nota.valor_liquido ?? calcularValorSaidaSemImpostos(nota)
    }
    return nota.valor_liquido ?? nota.valor_total
  }

  const renderValorNota = (nota: NotaFiscal) => {
    const valorTotal = Number(nota.valor_total || 0)
    const valorLiquido = Number(getValorExibicaoNota(nota) || 0)
    const exibirTotalSeparado = Math.abs(valorTotal - valorLiquido) > 0.009

    if (!exibirTotalSeparado) {
      return <span className="font-semibold">{formatCurrency(valorLiquido)}</span>
    }

    return (
      <div className="space-y-0.5">
        <div className="text-xs text-muted-foreground">
          Total: <span className="font-medium">{formatCurrency(valorTotal)}</span>
        </div>
        <div className="font-semibold">
          Líquido: {formatCurrency(valorLiquido)}
        </div>
      </div>
    )
  }

  // Filtrar notas fiscais
  const filteredNotas = useMemo(() => {
    let filtered = notasFiscais
    
    // Filtrar por tipo (entrada/saída) baseado na aba ativa
    filtered = filtered.filter(nf => nf.tipo === activeTab)
    
    if (tipoNotaFilter !== 'all') {
      filtered = filtered.filter(nf => nf.tipo_nota === tipoNotaFilter)
    }
    
    return filtered
  }, [notasFiscais, tipoNotaFilter, activeTab])

  const escapeCsvCelulaNf = (valor: unknown) => {
    const s = valor === null || valor === undefined ? "" : String(valor)
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const exportarCsvNotasFiscais = async () => {
    setExportandoCsv(true)
    try {
      const response = await notasFiscaisApi.exportacaoCompleta({
        tipo: activeTab,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined,
        tipo_nota: tipoNotaFilter,
      })

      if (!response?.success) {
        toast({
          title: "Erro ao exportar",
          description: "Resposta inválida do servidor.",
          variant: "destructive",
        })
        return
      }

      const entries = (response.data || []) as Array<{
        nota: NotaFiscal & {
          medicoes_mensais?: { numero?: string; periodo?: string }
          medicoes?: { numero?: string; periodo?: string }
        }
        itens: Array<Record<string, unknown>>
        totais_itens: {
          quantidade_linhas: number
          soma_preco_total: number
          soma_valor_icms: number
          soma_valor_ipi: number
          soma_valor_pis: number
          soma_valor_cofins: number
          soma_valor_issqn: number
          soma_valor_inss: number
          soma_valor_ir: number
          soma_valor_csll: number
        }
      }>

      const cobrancaTxt = (n: NotaFiscal) => {
        const b = n.boletos?.[0]
        return b ? `Boleto ${b.numero_boleto}` : "Sem boleto"
      }

      const statusTxt = (s: string) => {
        const m: Record<string, string> = {
          pendente: "Pendente",
          paga: "Paga",
          vencida: "Vencida",
          cancelada: "Cancelada",
        }
        return m[s] || s
      }

      const fmt = (v: unknown) => {
        const n = Number(v)
        return Number.isFinite(n) ? formatCurrency(n) : ""
      }

      const detalheItens = (itens: Array<Record<string, unknown>>) =>
        itens
          .map((it, idx) => {
            let extras = ""
            const din = it.impostos_dinamicos
            if (Array.isArray(din) && din.length > 0) {
              extras =
                " [extras: " +
                din
                  .map((x: { nome?: string; tipo?: string; valor_calculado?: number }) =>
                    `${x.nome || x.tipo || "?"} ${x.valor_calculado ?? ""}`.trim()
                  )
                  .join("; ") +
                "]"
            }
            return `#${idx + 1} ${String(it.descricao ?? "")} | qtd ${String(it.quantidade ?? "")} | total ${fmt(it.preco_total)} | ICMS ${fmt(it.valor_icms)} | IPI ${fmt(it.valor_ipi)} | ISS ${fmt(it.valor_issqn)} | INSS ${fmt(it.valor_inss)} | Líq.item ${fmt(it.valor_liquido)}${extras}`
          })
          .join(" || ")

      const header = [
        "Número",
        "Série",
        "Tipo nota",
        "Tipo",
        "Cliente",
        "Fornecedor",
        "Compra / Venda ref.",
        "Data Emissão",
        "Vencimento",
        "Valor Total",
        "Valor Líquido (nota)",
        "ICMS (nota)",
        "ICMS ST (nota)",
        "FCP ST (nota)",
        "IPI (nota)",
        "PIS (nota)",
        "COFINS (nota)",
        "INSS (nota)",
        "IR (nota)",
        "CSLL (nota)",
        "ISSQN (nota)",
        "Ret. federais (nota)",
        "Outras ret. (nota)",
        "Chave acesso",
        "Observações",
        "Cobrança",
        "Status",
        "Qtd itens",
        "Soma preço itens",
        "Soma ICMS itens",
        "Soma IPI itens",
        "Soma PIS itens",
        "Soma COFINS itens",
        "Soma ISSQN itens",
        "Soma INSS itens",
        "Soma IR itens",
        "Soma CSLL itens",
        "Detalhamento dos itens (impostos por linha)",
      ]

      const linhas: string[][] = [
        header,
        ...entries.map(({ nota: n, itens, totais_itens: t }) => {
          const compraVenda =
            n.compras?.numero_pedido
              ? `Pedido ${n.compras.numero_pedido}`
              : n.vendas?.numero_venda
                ? `Venda ${n.vendas.numero_venda}`
                : "-"
          return [
            n.numero_nf,
            n.serie || "-",
            getTipoNotaLabel(n.tipo_nota),
            n.tipo,
            n.clientes?.nome || "-",
            n.fornecedores?.nome || "-",
            compraVenda,
            formatDate(n.data_emissao),
            n.data_vencimento ? formatDate(n.data_vencimento) : "-",
            fmt(n.valor_total),
            fmt(n.valor_liquido ?? getValorExibicaoNota(n)),
            fmt(n.valor_icms),
            fmt(n.valor_icms_st),
            fmt(n.valor_fcp_st),
            fmt(n.valor_ipi),
            fmt(n.valor_pis),
            fmt(n.valor_cofins),
            fmt(n.valor_inss),
            fmt(n.valor_ir),
            fmt(n.valor_csll),
            fmt(n.valor_issqn),
            fmt(n.retencoes_federais),
            fmt(n.outras_retencoes),
            n.chave_acesso || "",
            (n.observacoes || "").replace(/\r?\n/g, " ").slice(0, 2000),
            cobrancaTxt(n),
            statusTxt(n.status),
            String(t?.quantidade_linhas ?? itens?.length ?? 0),
            fmt(t?.soma_preco_total),
            fmt(t?.soma_valor_icms),
            fmt(t?.soma_valor_ipi),
            fmt(t?.soma_valor_pis),
            fmt(t?.soma_valor_cofins),
            fmt(t?.soma_valor_issqn),
            fmt(t?.soma_valor_inss),
            fmt(t?.soma_valor_ir),
            fmt(t?.soma_valor_csll),
            detalheItens(itens || []),
          ]
        }),
      ]

      const bom = "\ufeff"
      const corpo = linhas.map((linha) => linha.map(escapeCsvCelulaNf).join(",")).join("\r\n")
      const blob = new Blob([bom + corpo], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `notas-fiscais-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: "CSV exportado",
        description: `${entries.length} nota(s) com itens e impostos (exportação completa).`,
      })
    } catch (e: unknown) {
      const err = e as { message?: string }
      toast({
        title: "Erro ao exportar",
        description: err?.message || "Não foi possível gerar o CSV.",
        variant: "destructive",
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notas Fiscais</h1>
          <p className="text-gray-600">Notas fiscais como registro principal, com boleto vinculado na própria nota</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setActiveTab('saida')
              // Usar setTimeout para garantir que activeTab seja atualizado antes do resetForm
              setTimeout(() => {
                resetForm()
                setFormData(prev => ({ ...prev, tipo: 'saida' }))
                setIsCreateDialogOpen(true)
              }, 0)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota de Saída
          </Button>
          <Button 
            onClick={() => {
              setActiveTab('entrada')
              // Usar setTimeout para garantir que activeTab seja atualizado antes do resetForm
              setTimeout(() => {
                resetForm()
                setFormData(prev => ({ ...prev, tipo: 'entrada' }))
                setIsCreateDialogOpen(true)
              }, 0)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota de Entrada
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => {
        const novoActiveTab = v as 'saida' | 'entrada'
        setActiveTab(novoActiveTab)
        // Sincronizar formData.tipo quando mudar de aba (apenas se o modal não estiver aberto)
        if (!isCreateDialogOpen && !isEditDialogOpen) {
          setFormData(prev => ({ ...prev, tipo: novoActiveTab }))
        }
      }}>
        <TabsList>
          <TabsTrigger value="saida">Notas Fiscais de Saída</TabsTrigger>
          <TabsTrigger value="entrada">Notas Fiscais de Entrada</TabsTrigger>
        </TabsList>

        {/* Tab: Notas Fiscais de Saída */}
        <TabsContent value="saida" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Saída</CardTitle>
              <CardDescription>
                Notas de locações, circulação de equipamentos, outros equipamentos e medições
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="relative min-w-[200px] flex-1 basis-[min(100%,28rem)]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <Input
                      placeholder="Buscar por número, série, cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="w-full min-[480px]:w-[11rem] shrink-0">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full min-[480px]:w-[12.5rem] shrink-0">
                    <Select value={tipoNotaFilter} onValueChange={setTipoNotaFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tipo de Nota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="nf_servico">NFs (Serviço)</SelectItem>
                        <SelectItem value="nf_locacao">NF Locação</SelectItem>
                        <SelectItem value="fatura">Fatura</SelectItem>
                        <SelectItem value="nfe_eletronica">NFe (Eletrônica)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={carregarNotasFiscais} className="shrink-0">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={exportarCsvNotasFiscais}
                    disabled={exportandoCsv}
                    className="gap-2 shrink-0"
                  >
                    {exportandoCsv ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredNotas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma nota fiscal encontrada</div>
              ) : (
                <>
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[11%] min-w-[7rem]">Número</TableHead>
                        <TableHead className="w-[5%] min-w-[3rem]">Série</TableHead>
                        <TableHead className="w-[11%] min-w-[7.5rem]">Tipo</TableHead>
                        <TableHead className="w-[24%] min-w-[11rem]">Cliente</TableHead>
                        <TableHead className="w-[9%] whitespace-nowrap">Data Emissão</TableHead>
                        <TableHead className="w-[9%] whitespace-nowrap">Vencimento</TableHead>
                        <TableHead className="w-[10%] whitespace-nowrap text-right">Valor</TableHead>
                        <TableHead className="w-[15%] min-w-0">Cobrança</TableHead>
                        <TableHead className="w-[8%] whitespace-nowrap">Status</TableHead>
                        <TableHead className="w-[88px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotas.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-medium align-top">{nota.numero_nf}</TableCell>
                          <TableCell className="align-top">{nota.serie || '-'}</TableCell>
                          <TableCell className="align-top">
                            <Badge variant="outline" className="max-w-full truncate">{getTipoNotaLabel(nota.tipo_nota)}</Badge>
                          </TableCell>
                          <TableCell className="align-top min-w-0">
                            {nota.clientes ? (
                              <div className="flex items-start gap-2 min-w-0">
                                <Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <span className="truncate" title={nota.clientes.nome}>{nota.clientes.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap align-top">{formatDate(nota.data_emissao)}</TableCell>
                          <TableCell className="whitespace-nowrap align-top">
                            {nota.data_vencimento ? formatDate(nota.data_vencimento) : '-'}
                          </TableCell>
                          <TableCell className="text-right align-top whitespace-nowrap">{renderValorNota(nota)}</TableCell>
                          <TableCell className="align-top min-w-0">
                            <div className="min-w-0 break-words">{renderCobrancaNota(nota)}</div>
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">{getStatusBadge(nota.status)}</TableCell>
                          <TableCell className="w-[88px] text-right align-top">
                            <div className="flex items-start justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleView(nota)}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleEdit(nota)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-red-600 hover:text-red-700"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a nota fiscal <strong>{nota.numero_nf}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(nota.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {!loading && filteredNotas.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} notas fiscais
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-4 text-sm text-muted-foreground">
                              Página {currentPage} de {totalPages}
                            </span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notas Fiscais de Entrada */}
        <TabsContent value="entrada" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais de Entrada</CardTitle>
              <CardDescription>
                Notas fiscais de fornecedores de cada compra que a empresa faz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-semibold">Filtros</h3>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="relative min-w-[200px] flex-1 basis-[min(100%,28rem)]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <Input
                      placeholder="Buscar por número, série, fornecedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="w-full min-[480px]:w-[11rem] shrink-0">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="vencida">Vencida</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full min-[480px]:w-[12.5rem] shrink-0">
                    <Select value={tipoNotaFilter} onValueChange={setTipoNotaFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tipo de Nota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="nf_servico">NFs (Serviço)</SelectItem>
                        <SelectItem value="nf_locacao">NF Locação</SelectItem>
                        <SelectItem value="fatura">Fatura</SelectItem>
                        <SelectItem value="nfe_eletronica">NFe (Eletrônica)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={carregarNotasFiscais} className="shrink-0">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={exportarCsvNotasFiscais}
                    disabled={exportandoCsv}
                    className="gap-2 shrink-0"
                  >
                    {exportandoCsv ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Exportar CSV
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredNotas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma nota fiscal encontrada</div>
              ) : (
                <>
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[11%] min-w-[7rem]">Número</TableHead>
                        <TableHead className="w-[5%] min-w-[3rem]">Série</TableHead>
                        <TableHead className="w-[20%] min-w-[10rem]">Fornecedor</TableHead>
                        <TableHead className="w-[12%] min-w-[7rem]">Compra</TableHead>
                        <TableHead className="w-[9%] whitespace-nowrap">Data Emissão</TableHead>
                        <TableHead className="w-[9%] whitespace-nowrap">Vencimento</TableHead>
                        <TableHead className="w-[10%] whitespace-nowrap text-right">Valor</TableHead>
                        <TableHead className="w-[15%] min-w-0">Cobrança</TableHead>
                        <TableHead className="w-[8%] whitespace-nowrap">Status</TableHead>
                        <TableHead className="w-[88px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotas.map((nota) => (
                        <TableRow key={nota.id}>
                          <TableCell className="font-medium align-top">{nota.numero_nf}</TableCell>
                          <TableCell className="align-top">{nota.serie || '-'}</TableCell>
                          <TableCell className="align-top min-w-0">
                            {nota.fornecedores ? (
                              <div className="flex items-start gap-2 min-w-0">
                                <Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <span className="truncate" title={nota.fornecedores.nome}>{nota.fornecedores.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="align-top min-w-0 text-sm">
                            {nota.compras ? (
                              <div className="flex items-start gap-2 min-w-0">
                                <Receipt className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <span className="truncate">{nota.compras.numero_pedido}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap align-top">{formatDate(nota.data_emissao)}</TableCell>
                          <TableCell className="whitespace-nowrap align-top">
                            {nota.data_vencimento ? formatDate(nota.data_vencimento) : '-'}
                          </TableCell>
                          <TableCell className="text-right align-top whitespace-nowrap">{renderValorNota(nota)}</TableCell>
                          <TableCell className="align-top min-w-0">
                            <div className="min-w-0 break-words">{renderCobrancaNota(nota)}</div>
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">{getStatusBadge(nota.status)}</TableCell>
                          <TableCell className="w-[88px] text-right align-top">
                            <div className="flex items-start justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleView(nota)}
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleEdit(nota)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-red-600 hover:text-red-700"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a nota fiscal <strong>{nota.numero_nf}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(nota.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Paginação */}
                  {!loading && filteredNotas.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} notas fiscais
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-4 text-sm text-muted-foreground">
                              Página {currentPage} de {totalPages}
                            </span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open && dialogFormNfOcupado) return
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          setEditingNota(null)
          resetForm()
          // Remove ?fromMedicao= da URL sem remontar com estado “aberto” (replace só após fechar)
          if (typeof window !== "undefined" && window.location.search.includes("fromMedicao=")) {
            router.replace("/dashboard/financeiro/notas-fiscais", { scroll: false })
          }
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="relative min-h-0">
          {dialogFormNfOcupado && (
            <div
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 rounded-lg bg-background/85 backdrop-blur-[2px]"
              aria-busy="true"
              aria-live="polite"
            >
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {salvandoNotaFiscal
                  ? 'Salvando nota fiscal…'
                  : parseandoXmlNfe
                    ? 'Importando XML…'
                    : importandoMedicao
                      ? 'Importando dados da medição…'
                      : 'Aguarde…'}
              </p>
              <p className="text-xs text-muted-foreground px-6 text-center max-w-sm">
                Aguarde — não feche esta janela.
              </p>
            </div>
          )}
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle>
                  {isEditDialogOpen ? 'Editar Nota Fiscal' : (formData.tipo || activeTab) === 'saida' ? 'Nova Nota Fiscal de Saída' : 'Nova Nota Fiscal de Entrada'}
                </DialogTitle>
                <DialogDescription>
                  {(formData.tipo || activeTab) === 'saida' 
                    ? 'Preencha os dados da nota fiscal de saída (locação, circulação de equipamentos, outros equipamentos ou medição)'
                    : 'Preencha os dados da nota fiscal de entrada (fornecedor)'}
                </DialogDescription>
              </div>
              {!isEditDialogOpen && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={dialogFormNfOcupado}
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.xml,.XML'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          setFormFile(file)
                          parseNFeXML(file)
                        }
                      }
                      input.click()
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                    title="Importar dados de um XML de NFe/NFS-e"
                  >
                    {parseandoXmlNfe ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {parseandoXmlNfe ? 'Lendo XML…' : 'Importar XML'}
                  </Button>
                  <DebugButton
                    onClick={preencherDadosTeste}
                    size="sm"
                    variant="outline"
                    label="Preencher Dados"
                    title="Preencher com dados de teste"
                    disabled={dialogFormNfOcupado}
                  />
                </div>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {!isEditDialogOpen && (formData.tipo || activeTab) === 'saida' && (
              <div className="flex flex-wrap items-end gap-2 pb-1 text-xs text-muted-foreground border-b border-border/50">
                <span className="sr-only">Importar dados de medição aprovada</span>
                <span className="hidden sm:inline self-center shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  Medição
                </span>
                <Select
                  value={medicaoIdParaImportar}
                  onValueChange={setMedicaoIdParaImportar}
                  disabled={dialogFormNfOcupado}
                >
                  <SelectTrigger className="h-8 w-full sm:w-[min(100%,240px)] text-xs bg-background/80">
                    <SelectValue
                      placeholder={
                        medicoesAprovadasListar.length === 0
                          ? 'Nenhuma aprovada'
                          : 'Selecionar…'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {medicoesAprovadasListar.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Nenhuma medição aprovada.
                      </div>
                    ) : (
                      medicoesAprovadasListar.map((med) => (
                        <SelectItem key={med.id} value={String(med.id)} className="text-xs">
                          {med.numero} — {med.periodo}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImportarDadosMedicao}
                  disabled={
                    dialogFormNfOcupado ||
                    !medicaoIdParaImportar ||
                    medicoesAprovadasListar.length === 0
                  }
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {importandoMedicao ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin inline" />
                      Carregando…
                    </>
                  ) : (
                    'Importar da medição'
                  )}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_nf">Número da Nota Fiscal *</Label>
                <Input
                  id="numero_nf"
                  value={formData.numero_nf}
                  onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="serie">Série</Label>
                <Input
                  id="serie"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                />
              </div>
            </div>

            {(formData.tipo || activeTab) === 'saida' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_nota">Tipo de Nota *</Label>
                    <Select 
                      value={formData.tipo_nota || 'nf_servico'} 
                      onValueChange={(value) => setFormData({ ...formData, tipo_nota: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nf_servico">NFs (Serviço)</SelectItem>
                        <SelectItem value="nf_locacao">NF Locação</SelectItem>
                        <SelectItem value="fatura">Fatura</SelectItem>
                        <SelectItem value="nfe_eletronica">NFe (Eletrônica)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cliente_id">Cliente *</Label>
                    <Select 
                      value={formData.cliente_id?.toString() || ''} 
                      onValueChange={(value) => setFormData({ ...formData, cliente_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.medicao_id ? (
                  <p className="text-xs text-muted-foreground rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    Vinculada à medição <span className="font-medium">#{formData.medicao_id}</span>
                    {medicoes.find((med) => med.id === formData.medicao_id) && (
                      <>
                        {' '}
                        — {medicoes.find((med) => med.id === formData.medicao_id)?.numero}{' '}
                        ({medicoes.find((med) => med.id === formData.medicao_id)?.periodo})
                      </>
                    )}
                  </p>
                ) : null}

                {formData.tipo_nota === 'nf_locacao' && gruaInfo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Grua (Carregada Automaticamente)</Label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                        <span className="font-medium">
                          {gruaInfo.modelo && gruaInfo.fabricante
                            ? `${gruaInfo.fabricante} - ${gruaInfo.modelo}`
                            : gruaInfo.modelo
                              ? gruaInfo.modelo
                              : `Grua ID: ${gruaInfo.id}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Grua carregada automaticamente da locação ativa do cliente
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {(formData.tipo || activeTab) === 'entrada' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_nota_entrada">Tipo de Nota *</Label>
                    <Select
                      value={formData.tipo_nota || 'nf_servico'}
                      onValueChange={(value) => setFormData({ ...formData, tipo_nota: value as any })}
                    >
                      <SelectTrigger id="tipo_nota_entrada">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nf_servico">NF de Serviço (Entrada)</SelectItem>
                        <SelectItem value="nfe_eletronica">NFe de Produto (Entrada)</SelectItem>
                        <SelectItem value="fatura">Fatura / Outros</SelectItem>
                        <SelectItem value="nf_locacao">NF de Locação (Entrada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateFornecedorDialogOpen(true)}
                        className="h-7 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Novo
                      </Button>
                    </div>
                    <Select 
                      value={formData.fornecedor_id?.toString() || ''} 
                      onValueChange={(value) => setFormData({ ...formData, fornecedor_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map(fornecedor => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.medicao_id ? (
                  <p className="text-xs text-muted-foreground rounded-md border border-dashed bg-muted/30 px-3 py-2">
                    Vinculada à medição <span className="font-medium">#{formData.medicao_id}</span>
                    {medicoes.find((med) => med.id === formData.medicao_id) && (
                      <>
                        {' '}
                        — {medicoes.find((med) => med.id === formData.medicao_id)?.numero}{' '}
                        ({medicoes.find((med) => med.id === formData.medicao_id)?.periodo})
                      </>
                    )}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vincular_compra_existente"
                      checked={vincularCompraExistente}
                      onCheckedChange={(checked) => {
                        const habilitar = checked === true
                        setVincularCompraExistente(habilitar)
                        if (!habilitar) {
                          setFormData({ ...formData, compra_id: undefined })
                        }
                      }}
                    />
                    <Label htmlFor="vincular_compra_existente" className="text-sm font-medium cursor-pointer">
                      Vincular compra existente (opcional)
                    </Label>
                  </div>

                  {vincularCompraExistente && (
                    <>
                      <Select
                        value={formData.compra_id?.toString() || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, compra_id: value === 'none' ? undefined : parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a compra (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem compra vinculada</SelectItem>
                          {compras.map(compra => (
                            <SelectItem key={compra.id} value={compra.id.toString()}>
                              {compra.numero_pedido || compra.numero_compra || `Compra #${compra.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {compras.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Não há compras cadastradas no módulo de compras para vincular.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Campo de seleção de banco para fluxo de caixa */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="conta_bancaria_id">Conta Bancária (para movimentação de caixa)</Label>
                <Select 
                  value={contaBancariaSelecionada?.toString() || undefined} 
                  onValueChange={(value) => setContaBancariaSelecionada(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta bancária (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {contasBancarias
                      .filter(conta => {
                        // Garantir que o ID existe, não é null/undefined, e quando convertido para string não é vazio
                        const id = conta?.id
                        if (id == null || id === undefined) return false
                        const idStr = String(id).trim()
                        return idStr.length > 0
                      })
                      .map(conta => {
                        const nomeConta = (conta as any).nome || conta.banco
                        const tipoConta = conta.tipo || (conta as any).tipo_conta || 'corrente'
                        const saldoFormatado = conta.saldo_atual?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'
                        const contaId = String(conta.id).trim()
                        // Validação adicional: garantir que contaId não está vazio
                        if (!contaId || contaId.length === 0) return null
                        return (
                          <SelectItem key={conta.id} value={contaId}>
                            {nomeConta} - {conta.agencia}/{conta.conta} ({tipoConta}) - Saldo: R$ {saldoFormatado}
                          </SelectItem>
                        )
                      })
                      .filter(Boolean) // Remove qualquer null retornado
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {(formData.tipo || activeTab) === 'saida' 
                    ? 'Nota de Saída: o valor será adicionado ao saldo da conta selecionada'
                    : 'Nota de Entrada: o valor será subtraído do saldo da conta selecionada'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data_emissao">Data de Emissão *</Label>
                <Input
                  id="data_emissao"
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="valor_total">Valor Total (R$) *</Label>
                <Input
                  id="valor_total"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0,00"
                  className="text-right tabular-nums"
                  title="Digite apenas números; os dois últimos dígitos são centavos (ex.: 1250000 → 12.500,00)"
                  value={formatBrlMoneyInputValue(Number(formData.valor_total) || 0, !formData.valor_total)}
                  onChange={(e) => {
                    const valor = parseBrlMoneyDigitsInput(e.target.value)
                    setFormData({ ...formData, valor_total: valor })
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status || 'pendente'} 
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="border-t pt-4">
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select 
                  value={formaPagamento} 
                  onValueChange={(value) => {
                    setFormaPagamento(value)
                    setCriarBoleto(value === 'boleto')
                    if (value !== 'boleto') {
                      setBoletoFile(null)
                    }
                    if (value === 'outro') {
                      setTipoPagamentoPersonalizado('')
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Se for Boleto */}
              {formaPagamento === 'boleto' && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="criar_boleto"
                      checked={criarBoleto}
                      onCheckedChange={(checked) => setCriarBoleto(checked === true)}
                    />
                    <Label htmlFor="criar_boleto" className="text-sm font-medium cursor-pointer">
                      Criar boleto vinculado a esta nota fiscal
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    {(formData.tipo || activeTab) === 'saida' 
                      ? 'O boleto será criado como "A Receber" (tipo receber) e ficará vinculado a esta nota fiscal.'
                      : 'O boleto será criado como "A Pagar" (tipo pagar) e ficará vinculado a esta nota fiscal.'}
                  </p>
                  
                  {criarBoleto && (
                    <div>
                      <Label htmlFor="arquivo_boleto">Upload do Boleto (PDF ou Imagem)</Label>
                      <Input
                        id="arquivo_boleto"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast({
                                title: "Erro",
                                description: "Arquivo muito grande. Tamanho máximo: 10MB",
                                variant: "destructive"
                              })
                              return
                            }
                            setBoletoFile(file)
                          }
                        }}
                      />
                      {boletoFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Arquivo selecionado: {boletoFile.name} ({(boletoFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Se for outro tipo de pagamento */}
              {formaPagamento === 'outro' && (
                <div className="mt-4">
                  <Label htmlFor="tipo_pagamento_personalizado">Especifique o tipo de pagamento *</Label>
                  <Input
                    id="tipo_pagamento_personalizado"
                    value={tipoPagamentoPersonalizado}
                    onChange={(e) => setTipoPagamentoPersonalizado(e.target.value)}
                    placeholder="Ex: Boleto parcelado, Cartão corporativo, etc."
                  />
                </div>
              )}
            </div>

            {/* Seção de Itens/Produtos/Serviços */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Itens da Nota Fiscal</Label>
                  <p className="text-sm text-muted-foreground">Adicione produtos ou serviços desta nota fiscal</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItemFormData({
                      descricao: '',
                      unidade: 'UN',
                      quantidade: 1,
                      preco_unitario: 0,
                      preco_total: 0,
                      base_calculo_icms: 0,
                      percentual_icms: 0,
                      valor_icms: 0,
                      percentual_ipi: 0,
                      valor_ipi: 0,
                      base_calculo_issqn: 0,
                      aliquota_issqn: 0,
                      valor_issqn: 0,
                      valor_inss: 0,
                      valor_cbs: 0,
                      valor_liquido: 0
                    })
                    setEditingItem(null)
                    setIsItemDialogOpen(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              {itens.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[80px]">Unidade</TableHead>
                        <TableHead className="w-[100px]">Quantidade</TableHead>
                        <TableHead className="w-[120px]">Valor Unit.</TableHead>
                        <TableHead className="w-[120px]">Valor Total</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.descricao}</TableCell>
                          <TableCell>{item.unidade}</TableCell>
                          <TableCell>{item.quantidade.toFixed(3)}</TableCell>
                          <TableCell>R$ {item.preco_unitario.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">R$ {item.preco_total.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Parse impostos dinâmicos se vierem como string JSON
                                  const itemParaEditar = { ...item }
                                  if (itemParaEditar.impostos_dinamicos && typeof itemParaEditar.impostos_dinamicos === 'string') {
                                    try {
                                      itemParaEditar.impostos_dinamicos = JSON.parse(itemParaEditar.impostos_dinamicos as any)
                                    } catch (e) {
                                      itemParaEditar.impostos_dinamicos = []
                                    }
                                  } else if (!itemParaEditar.impostos_dinamicos) {
                                    itemParaEditar.impostos_dinamicos = []
                                  }
                                  const itemCalculado = calcularImpostos(itemParaEditar)
                                  setItemFormData(itemCalculado)
                                  setEditingItem(item)
                                  setIsItemDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const novosItens = itens.filter((_, i) => i !== index)
                                  setItens(novosItens)
                                  // Recalcular valor total automaticamente
                                  const novoTotal = novosItens.reduce((sum, item) => sum + item.preco_total, 0)
                                  setFormData({ ...formData, valor_total: novoTotal })
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t bg-muted/50 space-y-2">
                    <div className="flex justify-end">
                      <div className="text-right space-y-1">
                        <div className="flex justify-between gap-8">
                          <span className="text-sm text-muted-foreground">Total dos Itens:</span>
                          <span className="text-sm font-medium">R$ {itens.reduce((sum, item) => sum + item.preco_total, 0).toFixed(2)}</span>
                        </div>
                        {(() => {
                          const totalImpostosFixos = itens.reduce((sum, item) => 
                            sum + (item.valor_icms || 0) + (item.valor_ipi || 0) + (item.valor_issqn || 0) + (item.valor_inss || 0) + (item.valor_cbs || 0), 0
                          )
                          const totalImpostosDinamicos = itens.reduce((sum, item) => {
                            if (item.impostos_dinamicos) {
                              const impostos = typeof item.impostos_dinamicos === 'string' 
                                ? JSON.parse(item.impostos_dinamicos) 
                                : item.impostos_dinamicos
                              return sum + (impostos.reduce((impSum: number, imp: any) => impSum + (imp.valor_calculado || 0), 0))
                            }
                            return sum
                          }, 0)
                          const totalImpostos = totalImpostosFixos + totalImpostosDinamicos
                          const totalLiquido = itens.reduce((sum, item) => sum + (item.valor_liquido || item.preco_total), 0)
                          
                          return (
                            <>
                              <div className="flex justify-between gap-8">
                                <span className="text-sm text-muted-foreground">Total de Impostos:</span>
                                <span className="text-sm font-medium text-red-600">R$ {totalImpostos.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between gap-8 border-t pt-1">
                                <span className="text-sm font-semibold">Valor Líquido:</span>
                                <span className="text-lg font-bold text-green-600">R$ {totalLiquido.toFixed(2)}</span>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}
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

            <div>
              <Label htmlFor="arquivo_nf">Arquivo da Nota Fiscal (apenas anexo PDF/XML)</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Este campo somente anexa o arquivo (PDF ou XML).
              </p>
              <Input
                id="arquivo_nf"
                type="file"
                accept=".pdf,.xml,.PDF,.XML"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "Erro",
                        description: "Arquivo muito grande. Tamanho máximo: 10MB",
                        variant: "destructive"
                      })
                      e.target.value = ''
                      return
                    }
                    const validTypes = ['application/pdf', 'application/xml', 'text/xml']
                    const validExtensions = ['.pdf', '.xml']
                    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
                    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                      toast({
                        title: "Erro",
                        description: "Tipo de arquivo inválido. Use PDF ou XML",
                        variant: "destructive"
                      })
                      e.target.value = ''
                      return
                    }
                    setFormFile(file)
                  } else {
                    setFormFile(null)
                  }
                }}
              />
              {formFile && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo selecionado: {formFile.name} ({(formFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {isEditDialogOpen && editingNota?.arquivo_nf && !formFile && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Arquivo atual: {editingNota.nome_arquivo || 'Arquivo anexado'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={dialogFormNfOcupado}
              onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              setEditingNota(null)
              resetForm()
            }}
            >
              Cancelar
            </Button>
            <Button
              disabled={dialogFormNfOcupado}
              onClick={isEditDialogOpen ? handleUpdate : handleCreate}
            >
              {salvandoNotaFiscal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditDialogOpen ? 'Salvando…' : 'Criando…'}
                </>
              ) : (
                <>
                  {isEditDialogOpen ? 'Atualizar' : 'Criar'} Nota Fiscal
                </>
              )}
            </Button>
          </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogEscolhaTipoImportOpen}
        onOpenChange={(open) => {
          if (!open) cancelarDialogEscolhaTipoImport()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tipo de importação</DialogTitle>
            <DialogDescription>
              Escolha o que esta nota deve registrar: valores de <strong>locação</strong> (mensal + aditivos) ou de{' '}
              <strong>serviço</strong> (custos extras e itens de serviço, quando houver).
            </DialogDescription>
          </DialogHeader>
          {medicaoParaEscolherTipo ? (() => {
            const m = medicaoParaEscolherTipo
            const fmt = (n: number) =>
              n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const vLoc = Number(m.valor_mensal_bruto) || 0
            const vAdit = Number(m.valor_aditivos) || 0
            const vServ = Number(m.valor_custos_extras) || 0
            const temDetalheServico =
              (m.custos_mensais?.length || 0) > 0 ||
              (m.horas_extras?.length || 0) > 0 ||
              (m.servicos_adicionais?.length || 0) > 0
            /** Mesma regra que `aplicarMedicaoComModoNaForma` (modo serviço). */
            const totalServicoImport = (() => {
              if (!temDetalheServico) return vServ
              let acc = 0
              for (const c of m.custos_mensais || []) {
                const qtd = Number(c.quantidade_meses) > 0 ? Number(c.quantidade_meses) : 1
                const vu = Number(c.valor_mensal) || 0
                acc += Number(c.valor_total) || qtd * vu
              }
              for (const h of m.horas_extras || []) {
                const q = Number(h.quantidade_horas) || 0
                const tot = Number(h.valor_total) || 0
                const vu = q > 0 ? tot / q : Number(h.valor_hora) || 0
                acc += tot || vu
              }
              for (const s of m.servicos_adicionais || []) {
                const q = Number(s.quantidade) > 0 ? Number(s.quantidade) : 1
                const vu = Number(s.valor_unitario) || 0
                acc += Number(s.valor_total) || q * vu
              }
              return acc
            })()
            const podeLocacao = vLoc > 0 || vAdit > 0
            const podeServico = temDetalheServico || vServ > 0
            const totalLoc = vLoc + vAdit
            return (
              <RadioGroup
                value={importModoSelecionado}
                onValueChange={(v) => setImportModoSelecionado(v as 'servico' | 'locacao')}
                className="gap-3"
              >
                <div
                  className={`flex gap-3 rounded-md border p-3 text-left ${importModoSelecionado === 'locacao' ? 'border-primary/50 bg-muted/30' : 'border-border'}`}
                >
                  <RadioGroupItem value="locacao" id="nf-imp-loc" className="mt-1 shrink-0" disabled={!podeLocacao} />
                  <Label htmlFor="nf-imp-loc" className="flex-1 cursor-pointer font-normal leading-snug">
                    <span className="text-sm font-medium text-foreground">Locação</span>
                    <p className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <span>Valor de locação (R$) + Valor de aditivos (R$)</span>
                      <span className="block text-foreground/90">
                        R$ {fmt(vLoc)} + R$ {fmt(vAdit)} ={' '}
                        <strong className="text-foreground">R$ {fmt(totalLoc)}</strong>
                      </span>
                    </p>
                  </Label>
                </div>
                <div
                  className={`flex gap-3 rounded-md border p-3 text-left ${importModoSelecionado === 'servico' ? 'border-primary/50 bg-muted/30' : 'border-border'}`}
                >
                  <RadioGroupItem value="servico" id="nf-imp-srv" className="mt-1 shrink-0" disabled={!podeServico} />
                  <Label htmlFor="nf-imp-srv" className="flex-1 cursor-pointer font-normal leading-snug">
                    <span className="text-sm font-medium text-foreground">Serviço</span>
                    <p className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <span>Valor de serviço (R$)</span>
                      <span className="block text-foreground/90">
                        {temDetalheServico ? (
                          <>
                            Soma dos itens (custos mensais, horas extras e serviços adicionais):{' '}
                            <strong className="text-foreground">R$ {fmt(totalServicoImport)}</strong>
                          </>
                        ) : (
                          <>
                            Consolidado em custos extras:{' '}
                            <strong className="text-foreground">R$ {fmt(vServ)}</strong>
                          </>
                        )}
                      </span>
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            )
          })() : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={cancelarDialogEscolhaTipoImport}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmarImportacaoTipoMedicao}>
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open)
        if (!open) {
          setViewingNota(null)
          setLoadingDetalhesNota(false)
          setViewingItens([])
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetalhesNota && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-600">Carregando detalhes...</span>
            </div>
          )}
          
          {viewingNota && !loadingDetalhesNota && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número</Label>
                  <p className="text-lg font-semibold">{viewingNota.numero_nf}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Série</Label>
                  <p className="text-lg">{viewingNota.serie || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className="text-lg">{viewingNota.tipo === 'saida' ? 'Saída' : 'Entrada'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo de Nota</Label>
                  <p className="text-lg">{getTipoNotaLabel(viewingNota.tipo_nota)}</p>
                </div>
              </div>

              {viewingNota.tipo === 'saida' && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                  <p className="text-lg font-semibold">
                    {viewingNota.clientes?.nome || '-'}
                  </p>
                  {viewingNota.clientes?.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {viewingNota.clientes.cnpj}</p>
                  )}
                </div>
              )}

              {viewingNota.tipo === 'entrada' && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fornecedor</Label>
                  <p className="text-lg font-semibold">
                    {viewingNota.fornecedores?.nome || '-'}
                  </p>
                  {viewingNota.fornecedores?.cnpj && (
                    <p className="text-sm text-gray-600">CNPJ: {viewingNota.fornecedores.cnpj}</p>
                  )}
                </div>
              )}

              {viewingNota.medicoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Medição Vinculada</Label>
                  <p className="text-lg">
                    {viewingNota.medicoes.numero} - {viewingNota.medicoes.periodo}
                  </p>
                </div>
              )}

              {viewingNota.locacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Locação Vinculada</Label>
                  <p className="text-lg">{viewingNota.locacoes.numero}</p>
                </div>
              )}

              {viewingNota.compras && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Compra Vinculada</Label>
                  <p className="text-lg">{viewingNota.compras.numero_pedido}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Emissão</Label>
                  <p className="text-lg">{formatDate(viewingNota.data_emissao)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                  <p className="text-lg">{viewingNota.data_vencimento ? formatDate(viewingNota.data_vencimento) : '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(viewingNota.valor_total)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="mt-2">{getStatusBadge(viewingNota.status)}</div>
              </div>

              {viewingNota.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{viewingNota.observacoes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-500">Cobrança Vinculada</Label>
                {viewingNota.boletos && viewingNota.boletos.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {viewingNota.boletos.map((boleto) => (
                      <div key={boleto.id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold">{boleto.numero_boleto}</p>
                            <p className="text-xs text-gray-600">
                              Vencimento: {formatDate(boleto.data_vencimento)} | Valor: {formatCurrency(boleto.valor)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(viewingNota.status)}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadBoletoPorArquivo(boleto.arquivo_boleto)}
                              disabled={!boleto.arquivo_boleto}
                              title={boleto.arquivo_boleto ? "Baixar arquivo do boleto" : "Boleto sem arquivo disponível"}
                              aria-label={boleto.arquivo_boleto ? "Baixar arquivo do boleto" : "Boleto sem arquivo disponível"}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar boleto
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Sem boleto vinculado</p>
                )}
              </div>

              {/* Seção de Itens da Nota Fiscal */}
              {viewingItens.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Itens da Nota Fiscal</h3>
                  <div className="space-y-4">
                    {viewingItens.map((item, index) => (
                      <div key={item.id || index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-700">Item {index + 1}</span>
                              {item.codigo_produto && (
                                <Badge variant="outline" className="text-xs">
                                  Código: {item.codigo_produto}
                                </Badge>
                              )}
                              {item.ncm_sh && (
                                <Badge variant="outline" className="text-xs">
                                  NCM/SH: {item.ncm_sh}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-2">{item.descricao}</p>
                            <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">Quantidade:</span> {item.quantidade} {item.unidade}
                              </div>
                              <div>
                                <span className="font-medium">Valor Unitário:</span> {formatCurrency(item.preco_unitario)}
                              </div>
                              <div>
                                <span className="font-medium">Valor Total:</span> <span className="font-semibold text-green-600">{formatCurrency(item.preco_total)}</span>
                              </div>
                              {item.valor_liquido !== undefined && item.valor_liquido !== null && (
                                <div>
                                  <span className="font-medium">Valor Líquido:</span> <span className="font-semibold text-blue-600">{formatCurrency(item.valor_liquido)}</span>
                                </div>
                              )}
                            </div>
                            {(item.cfop || item.csosn) && (
                              <div className="mt-2 flex gap-2 text-xs text-gray-500">
                                {item.cfop && <span>CFOP: {item.cfop}</span>}
                                {item.csosn && <span>CSOSN: {item.csosn}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Impostos do Item */}
                        {(item.valor_icms || item.valor_ipi || item.valor_issqn || item.valor_inss || item.valor_cbs || 
                          (item.impostos_dinamicos && item.impostos_dinamicos.length > 0)) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Impostos do Item</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {/* Impostos de Produtos */}
                              {item.base_calculo_icms > 0 && (
                                <div>
                                  <span className="text-gray-600">Base Cálculo ICMS:</span> <span className="font-medium">{formatCurrency(item.base_calculo_icms)}</span>
                                </div>
                              )}
                              {item.percentual_icms > 0 && (
                                <div>
                                  <span className="text-gray-600">% ICMS:</span> <span className="font-medium">{item.percentual_icms.toFixed(2)}%</span>
                                </div>
                              )}
                              {item.valor_icms > 0 && (
                                <div>
                                  <span className="text-gray-600">Valor ICMS:</span> <span className="font-medium text-red-600">{formatCurrency(item.valor_icms)}</span>
                                </div>
                              )}
                              {item.percentual_ipi > 0 && (
                                <div>
                                  <span className="text-gray-600">% IPI:</span> <span className="font-medium">{item.percentual_ipi.toFixed(2)}%</span>
                                </div>
                              )}
                              {item.valor_ipi > 0 && (
                                <div>
                                  <span className="text-gray-600">Valor IPI:</span> <span className="font-medium text-red-600">{formatCurrency(item.valor_ipi)}</span>
                                </div>
                              )}
                              
                              {/* Impostos de Serviços */}
                              {item.base_calculo_issqn > 0 && (
                                <div>
                                  <span className="text-gray-600">Base Cálculo ISSQN:</span> <span className="font-medium">{formatCurrency(item.base_calculo_issqn)}</span>
                                </div>
                              )}
                              {item.aliquota_issqn > 0 && (
                                <div>
                                  <span className="text-gray-600">Alíquota ISSQN:</span> <span className="font-medium">{item.aliquota_issqn.toFixed(2)}%</span>
                                </div>
                              )}
                              {item.valor_issqn > 0 && (
                                <div>
                                  <span className="text-gray-600">Valor ISSQN:</span> <span className="font-medium text-red-600">{formatCurrency(item.valor_issqn)}</span>
                                </div>
                              )}
                              {item.valor_inss > 0 && (
                                <div>
                                  <span className="text-gray-600">Valor INSS:</span> <span className="font-medium text-red-600">{formatCurrency(item.valor_inss)}</span>
                                </div>
                              )}
                              {item.valor_cbs > 0 && (
                                <div>
                                  <span className="text-gray-600">Valor CBS:</span> <span className="font-medium text-red-600">{formatCurrency(item.valor_cbs)}</span>
                                </div>
                              )}
                              
                              {/* Impostos Dinâmicos */}
                              {item.impostos_dinamicos && item.impostos_dinamicos.length > 0 && (
                                <>
                                  {item.impostos_dinamicos.map((imposto: any, impIndex: number) => (
                                    <div key={imposto.id || impIndex} className="col-span-2">
                                      <span className="text-gray-600">{imposto.nome}:</span> <span className="font-medium text-red-600">{formatCurrency(imposto.valor_calculado || 0)}</span>
                                      {imposto.tipo_calculo === 'porcentagem' && imposto.aliquota > 0 && (
                                        <span className="text-gray-500 ml-1">({imposto.aliquota.toFixed(2)}%)</span>
                                      )}
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumo dos Itens */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-md">
                      <span className="text-sm font-semibold text-gray-700">Total dos Itens:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(viewingItens.reduce((sum, item) => sum + item.preco_total, 0))}
                      </span>
                    </div>
                    {viewingItens.some(item => item.valor_liquido !== undefined && item.valor_liquido !== null) && (
                      <div className="flex justify-between items-center bg-green-50 p-3 rounded-md mt-2">
                        <span className="text-sm font-semibold text-gray-700">Total Líquido dos Itens:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(viewingItens.reduce((sum, item) => sum + (item.valor_liquido || item.preco_total), 0))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingNota.arquivo_nf && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Arquivo da Nota Fiscal</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{viewingNota.nome_arquivo || 'Arquivo anexado'}</span>
                    {viewingNota.tamanho_arquivo && (
                      <span className="text-xs text-gray-500">
                        ({(viewingNota.tamanho_arquivo / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(viewingNota)}
                      className="ml-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
            <DialogDescription>
              Envie o arquivo da nota fiscal (PDF ou XML)
            </DialogDescription>
          </DialogHeader>
          
          {uploadingNota && (
            <div className="space-y-4">
              <div>
                <Label>Nota Fiscal</Label>
                <p className="text-sm text-gray-600">
                  {uploadingNota.numero_nf} {uploadingNota.serie && `- Série ${uploadingNota.serie}`}
                </p>
              </div>
              
              <div>
                <Label htmlFor="arquivo">Arquivo (PDF ou XML) *</Label>
                <Input
                  id="arquivo"
                  type="file"
                  accept=".pdf,.xml,.PDF,.XML"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Validar tamanho (10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "Erro",
                          description: "Arquivo muito grande. Tamanho máximo: 10MB",
                          variant: "destructive"
                        })
                        return
                      }
                      // Validar tipo
                      const validTypes = ['application/pdf', 'application/xml', 'text/xml']
                      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.xml')) {
                        toast({
                          title: "Erro",
                          description: "Tipo de arquivo inválido. Use PDF ou XML",
                          variant: "destructive"
                        })
                        return
                      }
                      setUploadFile(file)
                    }
                  }}
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Arquivo selecionado: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadDialogOpen(false)
                setUploadingNota(null)
                setUploadFile(null)
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleFileUpload}
              disabled={!uploadFile || uploading}
            >
              {uploading ? 'Enviando...' : 'Enviar Arquivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enviar nota fiscal por e-mail */}
      <Dialog open={emailDialogOpen} onOpenChange={(open) => {
        setEmailDialogOpen(open)
        if (!open) setEmailNota(null)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar por e-mail</DialogTitle>
            <DialogDescription>
              O sistema envia o modelo <strong>nota_fiscal_enviada</strong> com o arquivo da nota em anexo
              {anexarBoletoEmail ? " e o boleto, quando houver arquivo disponível" : ""}.
              Requer permissão de edição no financeiro.
            </DialogDescription>
          </DialogHeader>
          {emailNota && (
            <div className="space-y-4">
              <div>
                <Label>Nota</Label>
                <p className="text-sm text-muted-foreground">
                  {emailNota.numero_nf}
                  {emailNota.serie ? ` · ${emailNota.serie}` : ""}
                  {emailNota.clientes?.nome ? ` · ${emailNota.clientes.nome}` : ""}
                </p>
              </div>
              <div>
                <Label htmlFor="email-extra">E-mail adicional (opcional)</Label>
                <Input
                  id="email-extra"
                  type="email"
                  placeholder="outro@empresa.com.br"
                  value={emailExtra}
                  onChange={(e) => setEmailExtra(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir-cliente-email"
                  checked={incluirEmailsCliente}
                  onCheckedChange={(v) => setIncluirEmailsCliente(v === true)}
                />
                <label htmlFor="incluir-cliente-email" className="text-sm leading-none cursor-pointer">
                  Incluir e-mails do cadastro do cliente (contato e principal)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anexar-boleto-email"
                  checked={anexarBoletoEmail}
                  onCheckedChange={(v) => setAnexarBoletoEmail(v === true)}
                />
                <label htmlFor="anexar-boleto-email" className="text-sm leading-none cursor-pointer">
                  Anexar arquivo do boleto (se existir)
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={emailSending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmEnviarEmail} disabled={emailSending || !emailNota}>
              {emailSending ? "Enviando…" : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Item da Nota Fiscal */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle>{editingItem ? 'Editar Item' : 'Adicionar Item'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do produto ou serviço
                </DialogDescription>
              </div>
              {!editingItem && (
                <DebugButton
                  onClick={preencherDadosItemTeste}
                  size="sm"
                  variant="outline"
                  className="ml-4"
                  label="Preencher Dados"
                  title="Preencher com dados de teste"
                />
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_codigo_produto">Código do Produto</Label>
                <Input
                  id="item_codigo_produto"
                  value={itemFormData.codigo_produto || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, codigo_produto: e.target.value })}
                  placeholder="Código interno ou CFOP"
                />
              </div>
              <div>
                <Label htmlFor="item_ncm_sh">NCM/SH</Label>
                <Input
                  id="item_ncm_sh"
                  value={itemFormData.ncm_sh || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, ncm_sh: e.target.value })}
                  placeholder="Ex: 8425.20.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="item_descricao">Descrição *</Label>
              <Textarea
                id="item_descricao"
                value={itemFormData.descricao}
                onChange={(e) => setItemFormData({ ...itemFormData, descricao: e.target.value })}
                rows={2}
                placeholder="Descrição completa do produto ou serviço"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="item_unidade">Unidade *</Label>
                <Select
                  value={itemFormData.unidade}
                  onValueChange={(value) => setItemFormData({ ...itemFormData, unidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">UN</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="M2">M²</SelectItem>
                    <SelectItem value="M3">M³</SelectItem>
                    <SelectItem value="LT">LT</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="CX">CX</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="DIA">DIA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item_quantidade">Quantidade *</Label>
                <Input
                  id="item_quantidade"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Ex: 1.000"
                  value={itemFormData.quantidade > 0 ? itemFormData.quantidade : ''}
                  onChange={(e) => {
                    const qtd = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    const itemAtualizado = calcularImpostos({ ...itemFormData, quantidade: qtd })
                    setItemFormData(itemAtualizado)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="item_preco_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="item_preco_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 250.00"
                  value={itemFormData.preco_unitario > 0 ? itemFormData.preco_unitario : ''}
                  onChange={(e) => {
                    const unit = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    const itemAtualizado = calcularImpostos({ ...itemFormData, preco_unitario: unit })
                    setItemFormData(itemAtualizado)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="item_preco_total">Valor Total (R$)</Label>
                <Input
                  id="item_preco_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemFormData.preco_total > 0 ? itemFormData.preco_total.toFixed(2) : ''}
                  placeholder="Calculado automaticamente"
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_cfop">CFOP</Label>
                <Input
                  id="item_cfop"
                  value={itemFormData.cfop || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, cfop: e.target.value })}
                  placeholder="Ex: 5102"
                />
              </div>
              <div>
                <Label htmlFor="item_csosn">CSOSN</Label>
                <Input
                  id="item_csosn"
                  value={itemFormData.csosn || ''}
                  onChange={(e) => setItemFormData({ ...itemFormData, csosn: e.target.value })}
                  placeholder="Ex: 101"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-2 block">Impostos de Produtos (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_base_calculo_icms">Base Cálculo ICMS (R$)</Label>
                  <Input
                    id="item_base_calculo_icms"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.base_calculo_icms || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, base_calculo_icms: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_percentual_icms">% ICMS</Label>
                  <Input
                    id="item_percentual_icms"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemFormData.percentual_icms || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, percentual_icms: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_icms">Valor ICMS (R$)</Label>
                  <Input
                    id="item_valor_icms"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_icms && itemFormData.valor_icms > 0 ? itemFormData.valor_icms.toFixed(2) : ''}
                    placeholder="Calculado automaticamente"
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="item_percentual_ipi">% IPI</Label>
                  <Input
                    id="item_percentual_ipi"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemFormData.percentual_ipi || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, percentual_ipi: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_ipi">Valor IPI (R$)</Label>
                  <Input
                    id="item_valor_ipi"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_ipi && itemFormData.valor_ipi > 0 ? itemFormData.valor_ipi.toFixed(2) : ''}
                    placeholder="Calculado automaticamente"
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-2 block">Impostos de Serviços (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_base_calculo_issqn">Base Cálculo ISSQN (R$)</Label>
                  <Input
                    id="item_base_calculo_issqn"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.base_calculo_issqn || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, base_calculo_issqn: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                    placeholder="Geralmente igual ao valor do serviço"
                  />
                </div>
                <div>
                  <Label htmlFor="item_aliquota_issqn">Alíquota ISSQN (%)</Label>
                  <Input
                    id="item_aliquota_issqn"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={itemFormData.aliquota_issqn || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, aliquota_issqn: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                    placeholder="Ex: 5.00 para 5%"
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_issqn">Valor ISSQN (R$)</Label>
                  <Input
                    id="item_valor_issqn"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_issqn && itemFormData.valor_issqn > 0 ? itemFormData.valor_issqn.toFixed(2) : ''}
                    placeholder="Calculado automaticamente"
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_inss">Valor INSS - Retenção (R$)</Label>
                  <Input
                    id="item_valor_inss"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_inss || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, valor_inss: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_cbs">Valor CBS (R$)</Label>
                  <Input
                    id="item_valor_cbs"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_cbs || ''}
                    onChange={(e) => {
                      const itemAtualizado = calcularImpostos({ ...itemFormData, valor_cbs: parseFloat(e.target.value) || 0 })
                      setItemFormData(itemAtualizado)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="item_valor_liquido">Valor Líquido (R$)</Label>
                  <Input
                    id="item_valor_liquido"
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemFormData.valor_liquido && itemFormData.valor_liquido > 0 ? itemFormData.valor_liquido.toFixed(2) : ''}
                    placeholder="Calculado automaticamente"
                    readOnly
                    className="bg-muted font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Impostos Personalizados (Opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarImpostoDinamico}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Imposto
                </Button>
              </div>
              
              {itemFormData.impostos_dinamicos && itemFormData.impostos_dinamicos.length > 0 ? (
                <div className="space-y-3">
                  {itemFormData.impostos_dinamicos.map((imposto) => (
                    <div key={imposto.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Imposto: {imposto.nome || 'Sem nome'}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerImpostoDinamico(imposto.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`imposto_nome_${imposto.id}`} className="text-xs">Nome do Imposto *</Label>
                          <Input
                            id={`imposto_nome_${imposto.id}`}
                            value={imposto.nome}
                            onChange={(e) => atualizarImpostoDinamico(imposto.id, 'nome', e.target.value)}
                            placeholder="Ex: PIS, COFINS, IRPJ"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`imposto_tipo_${imposto.id}`} className="text-xs">Tipo (Opcional)</Label>
                          <Input
                            id={`imposto_tipo_${imposto.id}`}
                            value={imposto.tipo || ''}
                            onChange={(e) => atualizarImpostoDinamico(imposto.id, 'tipo', e.target.value)}
                            placeholder="Ex: Federal, Estadual"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`imposto_tipo_calculo_${imposto.id}`} className="text-xs">Tipo de Cálculo *</Label>
                          <Select
                            value={imposto.tipo_calculo || 'porcentagem'}
                            onValueChange={(value: 'porcentagem' | 'valor_fixo') => {
                              atualizarImpostoDinamico(imposto.id, 'tipo_calculo', value)
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="porcentagem">Porcentagem (%)</SelectItem>
                              <SelectItem value="valor_fixo">Valor Fixo (R$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {imposto.tipo_calculo === 'porcentagem' ? (
                          <>
                            <div>
                              <Label htmlFor={`imposto_base_${imposto.id}`} className="text-xs">Base de Cálculo (R$)</Label>
                              <Input
                                id={`imposto_base_${imposto.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                value={imposto.base_calculo || ''}
                                onChange={(e) => {
                                  const base = parseFloat(e.target.value) || 0
                                  atualizarImpostoDinamico(imposto.id, 'base_calculo', base)
                                }}
                                placeholder="0.00"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`imposto_aliquota_${imposto.id}`} className="text-xs">Alíquota (%)</Label>
                              <Input
                                id={`imposto_aliquota_${imposto.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={imposto.aliquota || ''}
                                onChange={(e) => {
                                  const aliquota = parseFloat(e.target.value) || 0
                                  atualizarImpostoDinamico(imposto.id, 'aliquota', aliquota)
                                }}
                                placeholder="0.00"
                                className="h-8 text-sm"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2">
                            <Label htmlFor={`imposto_valor_fixo_${imposto.id}`} className="text-xs">Valor Fixo (R$)</Label>
                            <Input
                              id={`imposto_valor_fixo_${imposto.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={imposto.valor_fixo || ''}
                              onChange={(e) => {
                                const valorFixo = parseFloat(e.target.value) || 0
                                atualizarImpostoDinamico(imposto.id, 'valor_fixo', valorFixo)
                              }}
                              placeholder="0.00"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                        <div className="col-span-2">
                          <Label htmlFor={`imposto_valor_${imposto.id}`} className="text-xs">Valor Calculado (R$)</Label>
                          <Input
                            id={`imposto_valor_${imposto.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={imposto.valor_calculado && imposto.valor_calculado > 0 ? imposto.valor_calculado.toFixed(2) : ''}
                            placeholder="Calculado automaticamente"
                            readOnly
                            className="h-8 text-sm bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum imposto personalizado adicionado. Clique em "Adicionar Imposto" para criar um novo.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsItemDialogOpen(false)
              setEditingItem(null)
              setItemFormData({
                descricao: '',
                unidade: 'UN',
                quantidade: 1,
                preco_unitario: 0,
                preco_total: 0,
                base_calculo_icms: 0,
                percentual_icms: 0,
                valor_icms: 0,
                percentual_ipi: 0,
                valor_ipi: 0,
                base_calculo_issqn: 0,
                aliquota_issqn: 0,
                valor_issqn: 0,
                valor_inss: 0,
                valor_cbs: 0,
                valor_liquido: 0,
                impostos_dinamicos: []
              })
            }}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Validação de campos obrigatórios
              const camposFaltando: string[] = []

              if (!itemFormData.descricao || !itemFormData.descricao.trim()) {
                camposFaltando.push('Descrição')
              }

              if (!itemFormData.unidade || !itemFormData.unidade.trim()) {
                camposFaltando.push('Unidade')
              }

              if (!itemFormData.quantidade || itemFormData.quantidade <= 0) {
                camposFaltando.push('Quantidade')
              }

              if (!itemFormData.preco_unitario || itemFormData.preco_unitario <= 0) {
                camposFaltando.push('Valor Unitário (R$)')
              }

              if (camposFaltando.length > 0) {
                const mensagemErro = camposFaltando.length === 1 
                  ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
                  : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
                toast({
                  title: "Campos obrigatórios não preenchidos",
                  description: mensagemErro,
                  variant: "destructive",
                  duration: 10000,
                })
                return
              }

              // Garantir que os impostos estão calculados
              const itemCalculado = calcularImpostos(itemFormData)

              if (editingItem) {
                // Editar item existente
                const index = itens.findIndex(item => item.id === editingItem.id || item === editingItem)
                const novosItens = [...itens]
                novosItens[index] = itemCalculado
                setItens(novosItens)
              } else {
                // Adicionar novo item
                setItens([...itens, itemCalculado])
              }

              // Recalcular valor total da nota fiscal automaticamente
              const novosItens = editingItem 
                ? itens.map((item, i) => (item.id === editingItem.id || item === editingItem) ? itemCalculado : item)
                : [...itens, itemCalculado]
              const novoTotal = novosItens.reduce((sum, item) => sum + item.preco_total, 0)
              setFormData({ ...formData, valor_total: novoTotal })

              setIsItemDialogOpen(false)
              setEditingItem(null)
              setItemFormData({
                descricao: '',
                unidade: 'UN',
                quantidade: 1,
                preco_unitario: 0,
                preco_total: 0,
                base_calculo_icms: 0,
                percentual_icms: 0,
                valor_icms: 0,
                percentual_ipi: 0,
                valor_ipi: 0,
                base_calculo_issqn: 0,
                aliquota_issqn: 0,
                valor_issqn: 0,
                valor_inss: 0,
                valor_cbs: 0,
                valor_liquido: 0,
                impostos_dinamicos: []
              })
            }}>
              {editingItem ? 'Atualizar' : 'Adicionar'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar novo fornecedor */}
      <CreateFornecedorDialog
        isOpen={isCreateFornecedorDialogOpen}
        onClose={() => setIsCreateFornecedorDialogOpen(false)}
        onSuccess={(novoFornecedor) => {
          // Adicionar o novo fornecedor à lista
          setFornecedores([...fornecedores, novoFornecedor])
          // Selecionar automaticamente o novo fornecedor
          setFormData({ ...formData, fornecedor_id: novoFornecedor.id })
          setIsCreateFornecedorDialogOpen(false)
          toast({
            title: "Sucesso",
            description: "Fornecedor cadastrado e selecionado!",
          })
        }}
      />
    </div>
  )
}

// Componente para criar novo fornecedor
function CreateFornecedorDialog({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: (fornecedor: Fornecedor) => void
}) {
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    categoria: '',
    observacoes: '',
    status: 'ativo' as 'ativo' | 'inativo'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Função para formatar CNPJ
  const formatarCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  // Função para formatar CEP
  const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  // Função para formatar telefone
  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3')
      } else {
        return numbers.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3')
      }
    }
    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSubmitting(true)

    // Validação de campos obrigatórios
    const camposFaltando: string[] = []

    if (!formData.nome || !formData.nome.trim()) {
      camposFaltando.push('Nome/Razão Social')
    }

    if (!formData.cnpj || !formData.cnpj.trim()) {
      camposFaltando.push('CNPJ')
    }

    if (camposFaltando.length > 0) {
      const mensagemErro = camposFaltando.length === 1 
        ? `O campo "${camposFaltando[0]}" é obrigatório e precisa ser preenchido.`
        : `Os seguintes campos são obrigatórios e precisam ser preenchidos:\n\n${camposFaltando.map((campo, index) => `${index + 1}. ${campo}`).join('\n')}`
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: mensagemErro,
        variant: "destructive",
        duration: 10000,
      })
      setIsSubmitting(false)
      return
    }

    try {

      // Criar fornecedor
      const novoFornecedor = await fornecedoresApi.create({
        nome: formData.nome,
        cnpj: formData.cnpj,
        contato: formData.contato || undefined,
        telefone: formData.telefone || undefined,
        email: formData.email || undefined,
        endereco: formData.endereco || undefined,
        cidade: formData.cidade || undefined,
        estado: formData.estado || undefined,
        cep: formData.cep || undefined,
        categoria: formData.categoria || undefined,
        observacoes: formData.observacoes || undefined,
        status: formData.status
      })

      // Limpar formulário
      setFormData({
        nome: '',
        cnpj: '',
        contato: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        categoria: '',
        observacoes: '',
        status: 'ativo'
      })

      onSuccess(novoFornecedor)
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao criar fornecedor. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Cadastre um novo fornecedor no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome/Razão Social *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo ou razão social"
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatarCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contato">Nome do Contato</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                placeholder="Nome da pessoa de contato"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: formatarCEP(e.target.value) })}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Material de construção, Equipamentos, etc."
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              placeholder="Informações adicionais sobre o fornecedor"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Cadastrar Fornecedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

