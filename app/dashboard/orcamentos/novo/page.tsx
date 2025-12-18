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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Building2,
  Wrench,
  DollarSign,
  Calendar,
  FileText,
  Plus,
  Minus,
  Loader2,
  Save,
  FileText as FileTextIcon,
  Package,
  Trash2,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEmpresa } from "@/hooks/use-empresa"
import { useAuth } from "@/hooks/use-auth"
import { useDebugMode } from "@/hooks/use-debug-mode"
import ClienteSearch from "@/components/cliente-search"
import GruaSearch from "@/components/grua-search"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { clientesApi, converterClienteBackendParaFrontend } from "@/lib/api-clientes"
import { orcamentosLocacaoApi } from "@/lib/api-orcamentos-locacao"
import { createOrcamento, updateOrcamento, getOrcamento } from "@/lib/api-orcamentos"

// Funções de máscara de moeda
const formatCurrency = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Se não há números, retorna vazio
  if (!numbers || numbers === '0') return ''
  
  // Converte para número e divide por 100 para ter centavos
  const amount = parseInt(numbers) / 100
  
  // Formata como moeda brasileira (sem símbolo R$)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Função para formatar valor já em reais (não em centavos)
const formatCurrencyFromReais = (value: number) => {
  if (!value || value === 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Função para converter valor formatado para número
const parseCurrency = (value: string) => {
  const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleanValue) || 0
}

// Catálogo de complementos disponíveis
const CATALOGO_COMPLEMENTOS = [
  // Acessórios/Produtos
  { sku: 'ACESS-001', nome: 'Garfo Paleteiro', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 50000, descricao: 'Garfo para movimentação de paletes' },
  { sku: 'ACESS-002', nome: 'Balde de Concreto', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 30000, descricao: 'Balde para transporte de concreto' },
  { sku: 'ACESS-003', nome: 'Caçamba de Entulho', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 40000, descricao: 'Caçamba para descarte de entulho' },
  { sku: 'ACESS-004', nome: 'Plataforma de Descarga', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 60000, descricao: 'Plataforma para descarga de materiais nos pavimentos' },
  { sku: 'ACESS-005', nome: 'Estaiamentos', tipo_precificacao: 'por_metro' as const, unidade: 'm' as const, preco_unitario_centavos: 65000, fator: 650, descricao: 'Estaiamentos para fixação lateral da grua' },
  { sku: 'ACESS-006', nome: 'Chumbadores/Base de Fundação', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 150000, descricao: 'Peças de ancoragem concretadas no bloco da grua' },
  { sku: 'ACESS-007', nome: 'Auto-transformador (Energia)', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 80000, descricao: 'Adequação elétrica 220/380V' },
  { sku: 'ACESS-008', nome: 'Plano de Rigging / ART de Engenheiro', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 500000, descricao: 'Projeto técnico e responsabilidade civil' },
  { sku: 'ACESS-012', nome: 'Seguro RC / Roubo', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 120000, descricao: 'Seguro de responsabilidade civil e riscos' },
  
  // Serviços
  { sku: 'SERV-001', nome: 'Serviço de Montagem', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 15000, descricao: 'Mão de obra para montagem e fixação da grua' },
  { sku: 'SERV-002', nome: 'Serviço de Desmontagem', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 15000, descricao: 'Mão de obra para desmontagem da grua' },
  { sku: 'SERV-003', nome: 'Ascensão da Torre', tipo_precificacao: 'por_metro' as const, unidade: 'm' as const, preco_unitario_centavos: 65000, fator: 650, descricao: 'Serviço de elevação da torre conforme a obra cresce' },
  { sku: 'SERV-004', nome: 'Transporte de Ida e Retorno', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 300000, descricao: 'Transporte da grua até a obra e retorno ao depósito' },
  { sku: 'SERV-005', nome: 'Serviço de Operador', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 800000, descricao: 'Locação mensal de operador de grua' },
  { sku: 'SERV-006', nome: 'Serviço de Sinaleiro', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 600000, descricao: 'Locação mensal de sinaleiro' },
  { sku: 'SERV-007', nome: 'Serviço de Manutenção Preventiva', tipo_precificacao: 'mensal' as const, unidade: 'unidade' as const, preco_unitario_centavos: 200000, descricao: 'Manutenção preventiva mensal da grua' },
  { sku: 'SERV-008', nome: 'Serviço de Manutenção Corretiva', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 20000, descricao: 'Serviço de manutenção corretiva (cobrado por hora)' },
  { sku: 'SERV-009', nome: 'Serviço de Técnico de Segurança', tipo_precificacao: 'por_dia' as const, unidade: 'dia' as const, preco_unitario_centavos: 50000, descricao: 'Serviço de técnico de segurança (NR-18)' },
  { sku: 'SERV-010', nome: 'Consultoria Técnica', tipo_precificacao: 'por_hora' as const, unidade: 'h' as const, preco_unitario_centavos: 25000, descricao: 'Consultoria técnica especializada' },
  { sku: 'SERV-011', nome: 'Treinamento de Operadores', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 150000, descricao: 'Treinamento e capacitação de operadores' },
  { sku: 'SERV-012', nome: 'Inspeção Técnica', tipo_precificacao: 'unico' as const, unidade: 'unidade' as const, preco_unitario_centavos: 80000, descricao: 'Inspeção técnica periódica da grua' }
]

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const { debugMode } = useDebugMode()
  const orcamentoId = searchParams.get('id')
  const tipo = searchParams.get('tipo') || 'locacao' // 'obra' ou 'locacao'
  const isObra = tipo === 'obra'
  const [isLoadingOrcamento, setIsLoadingOrcamento] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Verificar se o usuário é admin@admin.com
  const isAdminUser = user?.email === 'admin@admin.com'
  
  const [formData, setFormData] = useState({
    // Identificação básica
    cliente_id: '',
    cliente_nome: '',
    obra_nome: '',
    obra_endereco: '',
    obra_cidade: '',
    obra_estado: '',
    tipo_obra: '',
    equipamento: '',
    
    // Especificações técnicas
    altura_inicial: '',
    altura_final: '',
    comprimento_lanca: '',
    carga_maxima: '',
    carga_ponta: '',
    potencia_eletrica: '',
    energia_necessaria: '',
    
    // Custos mensais
    valor_locacao_mensal: '',
    valor_operador: '',
    valor_sinaleiro: '',
    valor_manutencao: '',
    
    // Prazos e datas
    prazo_locacao_meses: '',
    data_inicio_estimada: '',
    tolerancia_dias: '15',
    
    // Escopo básico
    escopo_incluso: '',
    
    // Responsabilidades do cliente
    responsabilidades_cliente: '',
    
    // Condições comerciais
    condicoes_comerciais: '',
    
    // Condições gerais, logística e garantias
    condicoes_gerais: '',
    logistica: '',
    garantias: '',
    
    // Observações
    observacoes: ''
  })

  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [gruaSelecionada, setGruaSelecionada] = useState<any>(null)
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false)
  const [isCreatingCliente, setIsCreatingCliente] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [complementosSelecionados, setComplementosSelecionados] = useState<any[]>([])
  const [searchComplemento, setSearchComplemento] = useState("")
  const [showComplementosResults, setShowComplementosResults] = useState(false)
  const complementosSearchRef = useRef<HTMLDivElement>(null)
  const [valoresFixos, setValoresFixos] = useState<Array<{
    id?: string
    tipo: 'Locação' | 'Serviço'
    descricao: string
    quantidade: number
    valor_unitario: number
    valor_total: number
    observacoes?: string
  }>>([])
  const [custosMensais, setCustosMensais] = useState<Array<{
    id?: string
    tipo: string
    descricao: string
    valor_mensal: number
    obrigatorio: boolean
    observacoes?: string
  }>>([
    {
      id: 'cm_1',
      tipo: 'Locação',
      descricao: 'Locação da grua',
      valor_mensal: 0,
      obrigatorio: true
    },
    {
      id: 'cm_2',
      tipo: 'Operador',
      descricao: 'Operador',
      valor_mensal: 0,
      obrigatorio: true
    },
    {
      id: 'cm_3',
      tipo: 'Sinaleiro',
      descricao: 'Sinaleiro',
      valor_mensal: 0,
      obrigatorio: true
    },
    {
      id: 'cm_4',
      tipo: 'Manutenção',
      descricao: 'Manutenção preventiva',
      valor_mensal: 0,
      obrigatorio: true
    }
  ])
  const [clienteFormData, setClienteFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    contato: '',
    contato_email: '',
    contato_cpf: '',
    contato_telefone: '',
    status: 'ativo',
    criar_usuario: false,
    usuario_senha: ''
  })

  const calcularTotalMensal = () => {
    return custosMensais.reduce((sum, cm) => sum + (cm.valor_mensal || 0), 0)
  }

  // Carregar dados do orçamento quando houver ID na query
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
    setIsLoadingOrcamento(true)
    try {
      // Usar a API de orçamentos de locação
      const response = await orcamentosLocacaoApi.get(parseInt(id))
      
      if (!response.success || !response.data) {
        toast({
          title: "Erro",
          description: response.message || "Orçamento não encontrado",
          variant: "destructive"
        })
        router.push('/dashboard/orcamentos')
        return
      }

      const orcamento = response.data
      setIsEditMode(true)
      
      // Mapear dados da API para o formato do formulário
      const clienteNome = orcamento.clientes?.nome || ''
      const obraNome = orcamento.obra_nome || ''
      const obraEndereco = orcamento.obra_endereco || ''
      const equipamento = orcamento.equipamento || ''
      
      // Preencher formData
      setFormData({
        cliente_id: orcamento.cliente_id?.toString() || '',
        cliente_nome: clienteNome,
        obra_nome: obraNome,
        obra_endereco: obraEndereco,
        obra_cidade: orcamento.obra_cidade || '',
        obra_estado: orcamento.obra_estado || '',
        tipo_obra: orcamento.tipo_obra || '',
        equipamento: equipamento,
        altura_inicial: orcamento.altura_inicial?.toString() || '',
        altura_final: orcamento.altura_final?.toString() || '',
        comprimento_lanca: orcamento.comprimento_lanca?.toString() || '',
        carga_maxima: orcamento.carga_maxima?.toString() || '',
        carga_ponta: orcamento.carga_ponta?.toString() || '',
        potencia_eletrica: orcamento.potencia_eletrica || '',
        energia_necessaria: orcamento.energia_necessaria || '',
        valor_locacao_mensal: orcamento.valor_locacao_mensal?.toString() || '',
        valor_operador: orcamento.valor_operador?.toString() || '',
        valor_sinaleiro: orcamento.valor_sinaleiro?.toString() || '',
        valor_manutencao: orcamento.valor_manutencao?.toString() || '',
        prazo_locacao_meses: orcamento.prazo_locacao_meses?.toString() || '',
        data_inicio_estimada: orcamento.data_inicio_estimada || '',
        tolerancia_dias: orcamento.tolerancia_dias?.toString() || '15',
        escopo_incluso: orcamento.escopo_incluso || '',
        responsabilidades_cliente: orcamento.responsabilidades_cliente || '',
        condicoes_comerciais: orcamento.condicoes_comerciais || '',
        condicoes_gerais: orcamento.condicoes_gerais || '',
        logistica: orcamento.logistica || '',
        garantias: orcamento.garantias || '',
        observacoes: orcamento.observacoes || ''
      })

      // Preencher cliente selecionado
      if (orcamento.cliente_id && orcamento.clientes) {
        setClienteSelecionado({
          id: orcamento.cliente_id,
          name: clienteNome,
          nome: clienteNome
        })
      }

      // Preencher custos mensais a partir dos dados da API
      const custosMensaisData = orcamento.orcamento_custos_mensais_locacao || []
      if (custosMensaisData.length > 0) {
        setCustosMensais(custosMensaisData.map((cm: any, index: number) => ({
          id: `cm_${index + 1}`,
          tipo: cm.tipo || '',
          descricao: cm.descricao || '',
          valor_mensal: cm.valor_mensal || 0,
          obrigatorio: cm.obrigatorio || false,
          observacoes: cm.observacoes || ''
        })))
      } else {
        // Se não houver custos mensais, tentar usar os valores diretos do orçamento
        const custosPadrao = []
        if (orcamento.valor_locacao_mensal) {
          custosPadrao.push({ id: 'cm_1', tipo: 'Locação', descricao: 'Locação da grua', valor_mensal: orcamento.valor_locacao_mensal, obrigatorio: true })
        }
        if (orcamento.valor_operador) {
          custosPadrao.push({ id: 'cm_2', tipo: 'Operador', descricao: 'Operador', valor_mensal: orcamento.valor_operador, obrigatorio: true })
        }
        if (orcamento.valor_sinaleiro) {
          custosPadrao.push({ id: 'cm_3', tipo: 'Sinaleiro', descricao: 'Sinaleiro', valor_mensal: orcamento.valor_sinaleiro, obrigatorio: true })
        }
        if (orcamento.valor_manutencao) {
          custosPadrao.push({ id: 'cm_4', tipo: 'Manutenção', descricao: 'Manutenção preventiva', valor_mensal: orcamento.valor_manutencao, obrigatorio: true })
        }
        
        if (custosPadrao.length > 0) {
          setCustosMensais(custosPadrao)
        } else {
          // Se não houver nenhum valor, usar valores padrão vazios
          setCustosMensais([
            { id: 'cm_1', tipo: 'Locação', descricao: 'Locação da grua', valor_mensal: 0, obrigatorio: true },
            { id: 'cm_2', tipo: 'Operador', descricao: 'Operador', valor_mensal: 0, obrigatorio: true },
            { id: 'cm_3', tipo: 'Sinaleiro', descricao: 'Sinaleiro', valor_mensal: 0, obrigatorio: true },
            { id: 'cm_4', tipo: 'Manutenção', descricao: 'Manutenção preventiva', valor_mensal: 0, obrigatorio: true }
          ])
        }
      }

      // Preencher valores fixos
      const valoresFixosData = orcamento.orcamento_valores_fixos_locacao || []
      if (valoresFixosData.length > 0) {
        setValoresFixos(valoresFixosData.map((vf: any, index: number) => ({
          id: `vf_${index + 1}`,
          tipo: vf.tipo || 'Locação',
          descricao: vf.descricao || '',
          quantidade: vf.quantidade || 1,
          valor_unitario: vf.valor_unitario || 0,
          valor_total: (vf.quantidade || 1) * (vf.valor_unitario || 0),
          observacoes: vf.observacoes || ''
        })))
      }

      // Preencher complementos/itens
      const itensData = orcamento.orcamento_itens_locacao || []
      if (itensData.length > 0) {
        // Mapear itens para complementos (se necessário)
        // Por enquanto, apenas logamos para debug
        console.log('Itens encontrados:', itensData)
      }
    } catch (error: any) {
      console.error('Erro ao carregar orçamento:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao carregar dados do orçamento",
        variant: "destructive"
      })
    } finally {
      setIsLoadingOrcamento(false)
    }
  }

  // Informações da empresa do hook (não precisa mais definir aqui)

  const handleSave = async (isDraft: boolean = false) => {
    try {
      setIsSaving(true)

      // Validações básicas
      if (!isDraft) {
        if (isObra) {
          // Validações para orçamento de obra
          const camposFaltando = []
          if (!formData.obra_nome) camposFaltando.push('Nome da Obra')
          if (!formData.tipo_obra) camposFaltando.push('Tipo de Obra')
          if (!formData.equipamento && !gruaSelecionada) camposFaltando.push('Equipamento Ofertado')
          if (!clienteSelecionado && !formData.cliente_id) camposFaltando.push('Cliente')
          
          if (camposFaltando.length > 0) {
            toast({
              title: "Erro",
              description: `Preencha os campos obrigatórios: ${camposFaltando.join(', ')}`,
              variant: "destructive"
            })
            setIsSaving(false)
            return
          }
        } else {
          // Validações para orçamento de locação
          const camposFaltando = []
          if (!formData.obra_nome) camposFaltando.push('Nome da Obra')
          if (!formData.equipamento && !gruaSelecionada) camposFaltando.push('Equipamento Ofertado')
          if (!clienteSelecionado && !formData.cliente_id) camposFaltando.push('Cliente')
          
          if (camposFaltando.length > 0) {
            toast({
              title: "Erro",
              description: `Preencha os campos obrigatórios: ${camposFaltando.join(', ')}`,
              variant: "destructive"
            })
            setIsSaving(false)
            return
          }
        }
      } else {
        // Para rascunho, apenas cliente é obrigatório
        if (!clienteSelecionado && !formData.cliente_id) {
          toast({
            title: "Erro",
            description: "Selecione um cliente para salvar o rascunho",
            variant: "destructive"
          })
          setIsSaving(false)
          return
        }
      }

      // Calcular total mensal dos custos mensais
      const totalMensal = calcularTotalMensal()

      // Gerar número do orçamento apenas se for criação (não edição)
      let numero = ''
      if (!isEditMode) {
        const hoje = new Date()
        numero = `ORC-${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      }

      // Preparar dados para a API
      const clienteId = clienteSelecionado?.id || formData.cliente_id
      if (!clienteId) {
        toast({
          title: "Erro",
          description: "Cliente é obrigatório",
          variant: "destructive"
        })
        setIsSaving(false)
        return
      }

      // Garantir que equipamento esteja preenchido se uma grua foi selecionada
      let equipamentoFinal = formData.equipamento
      if (!equipamentoFinal && gruaSelecionada) {
        equipamentoFinal = `${gruaSelecionada.tipo || 'Grua Torre'} / ${gruaSelecionada.fabricante} ${gruaSelecionada.modelo}`
        setFormData({ ...formData, equipamento: equipamentoFinal })
      }

      const prazoMeses = parseInt(formData.prazo_locacao_meses || '1')
      const hoje = new Date()
      
      let response
      
      if (isObra) {
        // ===== ORÇAMENTO DE OBRA =====
        // Calcular valor total dos complementos
        let valorTotalComplementos = 0
        const itensComplementos = complementosSelecionados.map(complemento => {
          let valorItem = 0
          let quantidade = complemento.quantidade || 1
          
          // Calcular valor baseado no tipo de precificação
          if (complemento.tipo_precificacao === 'mensal') {
            valorItem = (complemento.preco_unitario_centavos / 100) * quantidade * prazoMeses
          } else if (complemento.tipo_precificacao === 'unico') {
            valorItem = (complemento.preco_unitario_centavos / 100) * quantidade
          } else {
            // Para por_metro, por_hora, por_dia - usar o valor_total já calculado
            valorItem = complemento.valor_total || (complemento.preco_unitario_centavos / 100) * quantidade
          }
          
          valorTotalComplementos += valorItem
          
          return {
            produto_servico: complemento.nome,
            descricao: complemento.descricao || `${complemento.nome} - ${complemento.sku || ''}`,
            quantidade: complemento.tipo_precificacao === 'mensal' ? quantidade * prazoMeses : quantidade,
            valor_unitario: complemento.preco_unitario_centavos / 100,
            valor_total: valorItem,
            tipo: (complemento.sku?.startsWith('ACESS') ? 'equipamento' : 'servico') as 'equipamento' | 'servico' | 'produto',
            unidade: complemento.unidade || 'unidade',
            observacoes: complemento.descricao || ''
          }
        })
        
        // Calcular valor total dos custos mensais
        const valorTotalCustosMensais = custosMensais.reduce((sum, cm) => sum + (cm.valor_mensal * prazoMeses), 0)
        
        const valorTotalOrcamento = valorTotalCustosMensais + valorTotalComplementos
        
        // Extrair informações da grua selecionada
        // Converter grua_id para número se possível, caso contrário usar null
        // IMPORTANTE: Se o ID for uma string com prefixo (ex: "G0062"), usar null
        // pois o número extraído pode não corresponder ao ID real na tabela
        // A API aceita null para grua_id, então é seguro não enviar se não tivermos certeza
        let gruaId: number | null = null
        if (gruaSelecionada?.id) {
          if (typeof gruaSelecionada.id === 'number') {
            // Se já é um número, usar diretamente
            gruaId = gruaSelecionada.id > 0 ? gruaSelecionada.id : null
          } else if (typeof gruaSelecionada.id === 'string') {
            // Se for string, verificar se é um número puro (sem prefixo)
            const isNumericString = /^\d+$/.test(gruaSelecionada.id)
            if (isNumericString) {
              const idNum = parseInt(gruaSelecionada.id)
              gruaId = !isNaN(idNum) && idNum > 0 ? idNum : null
            } else {
              // Se tiver prefixo (ex: "G0062"), usar null para evitar erro de foreign key
              // O ID real na tabela pode ser diferente do número extraído
              gruaId = null
            }
          }
        }
        
        // Log para debug (pode remover depois)
        if (gruaSelecionada && !gruaId) {
          console.log('[Orçamento] Grua selecionada mas grua_id será null:', {
            gruaIdOriginal: gruaSelecionada.id,
            tipo: typeof gruaSelecionada.id,
            motivo: typeof gruaSelecionada.id === 'string' && !/^\d+$/.test(gruaSelecionada.id) 
              ? 'ID tem prefixo (ex: G0062)' 
              : 'ID inválido ou zero'
          })
        }
        const gruaModelo = equipamentoFinal || gruaSelecionada?.modelo || ''
        const gruaLanca = formData.comprimento_lanca ? parseFloat(formData.comprimento_lanca) : (gruaSelecionada?.lanca || null)
        const gruaAlturaFinal = formData.altura_final ? parseFloat(formData.altura_final) : (gruaSelecionada?.altura_final || null)
        const gruaTipoBase = gruaSelecionada?.tipo_base || ''
        const gruaAno = gruaSelecionada?.ano || null
        const gruaPotencia = formData.potencia_eletrica ? parseFloat(formData.potencia_eletrica) : (gruaSelecionada?.potencia_instalada || null)
        const gruaCapacidade1 = formData.carga_maxima ? parseFloat(formData.carga_maxima) : (gruaSelecionada?.capacidade_1_cabo || null)
        const gruaCapacidade2 = formData.carga_ponta ? parseFloat(formData.carga_ponta) : (gruaSelecionada?.capacidade_2_cabos || null)
        const gruaVoltagem = formData.energia_necessaria || gruaSelecionada?.voltagem || ''
        
        const orcamentoData = {
          cliente_id: parseInt(clienteId.toString()),
          data_orcamento: hoje.toISOString().split('T')[0],
          data_validade: formData.data_inicio_estimada 
            ? new Date(new Date(formData.data_inicio_estimada).getTime() + (prazoMeses * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            : new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          valor_total: valorTotalOrcamento,
          desconto: 0,
          status: (isDraft ? 'rascunho' : 'enviado') as 'rascunho' | 'enviado',
          tipo_orcamento: 'locacao' as 'equipamento' | 'servico' | 'locacao' | 'venda',
          condicoes_pagamento: formData.condicoes_comerciais || '',
          prazo_entrega: formData.prazo_locacao_meses ? `${formData.prazo_locacao_meses} meses` : '',
          observacoes: formData.observacoes || '',
          // Campos de obra
          obra_nome: formData.obra_nome || '',
          obra_tipo: formData.tipo_obra || '',
          obra_endereco: formData.obra_endereco || '',
          obra_cidade: formData.obra_cidade || '',
          // Campos de grua
          grua_id: gruaId,
          grua_modelo: gruaModelo,
          grua_lanca: gruaLanca,
          grua_altura_final: gruaAlturaFinal,
          grua_tipo_base: gruaTipoBase,
          grua_ano: gruaAno,
          grua_potencia: gruaPotencia,
          grua_capacidade_1_cabo: gruaCapacidade1,
          grua_capacidade_2_cabos: gruaCapacidade2,
          grua_voltagem: gruaVoltagem,
          // Campos gerais
          prazo_locacao_meses: prazoMeses,
          data_inicio_estimada: formData.data_inicio_estimada || null,
          tolerancia_dias: parseInt(formData.tolerancia_dias || '15'),
          escopo_incluso: formData.escopo_incluso || '',
          responsabilidades_cliente: formData.responsabilidades_cliente || '',
          condicoes_comerciais: formData.condicoes_comerciais || '',
          condicoes_gerais: formData.condicoes_gerais || '',
          logistica: formData.logistica || '',
          garantias: formData.garantias || '',
          itens: [
            // Incluir custos mensais como itens
            ...custosMensais.map(cm => ({
              produto_servico: cm.tipo,
              descricao: cm.descricao,
              quantidade: prazoMeses,
              valor_unitario: cm.valor_mensal,
              valor_total: cm.valor_mensal * prazoMeses,
              tipo: (cm.tipo === 'Locação' ? 'equipamento' : 'servico') as 'equipamento' | 'servico' | 'produto',
              unidade: 'mês',
              observacoes: cm.observacoes || ''
            })),
            ...itensComplementos
          ]
        }
        
        if (isEditMode && orcamentoId) {
          response = await updateOrcamento({ id: parseInt(orcamentoId), ...orcamentoData })
        } else {
          response = await createOrcamento(orcamentoData)
        }
      } else {
        // ===== ORÇAMENTO DE LOCAÇÃO =====
        // Calcular valor total dos complementos
        let valorTotalComplementos = 0
        const itensComplementos = complementosSelecionados.map(complemento => {
          let valorItem = 0
          let quantidade = complemento.quantidade || 1
          
          // Calcular valor baseado no tipo de precificação
          if (complemento.tipo_precificacao === 'mensal') {
            valorItem = (complemento.preco_unitario_centavos / 100) * quantidade * prazoMeses
          } else if (complemento.tipo_precificacao === 'unico') {
            valorItem = (complemento.preco_unitario_centavos / 100) * quantidade
          } else {
            // Para por_metro, por_hora, por_dia - usar o valor_total já calculado
            valorItem = complemento.valor_total || (complemento.preco_unitario_centavos / 100) * quantidade
          }
          
          valorTotalComplementos += valorItem
          
          return {
            produto_servico: complemento.nome,
            descricao: complemento.descricao || `${complemento.nome} - ${complemento.sku || ''}`,
            quantidade: complemento.tipo_precificacao === 'mensal' ? quantidade * prazoMeses : quantidade,
            valor_unitario: complemento.preco_unitario_centavos / 100,
            valor_total: valorItem,
            tipo: (complemento.sku?.startsWith('ACESS') ? 'equipamento' : 'servico') as 'equipamento' | 'servico' | 'produto',
            unidade: complemento.unidade || 'unidade',
            observacoes: complemento.descricao || ''
          }
        })
        
        // Calcular valor total dos valores fixos
        const valorTotalValoresFixos = valoresFixos.reduce((sum, vf) => sum + (vf.quantidade * vf.valor_unitario), 0)
        
        const valorTotalOrcamento = (totalMensal * prazoMeses) + valorTotalComplementos + valorTotalValoresFixos
        
        const orcamentoData = {
          numero,
          cliente_id: parseInt(clienteId.toString()),
          data_orcamento: hoje.toISOString().split('T')[0],
          data_validade: formData.data_inicio_estimada 
            ? new Date(new Date(formData.data_inicio_estimada).getTime() + (prazoMeses * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            : new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          valor_total: valorTotalOrcamento,
          desconto: 0,
          status: (isDraft ? 'rascunho' : 'enviado') as 'rascunho' | 'enviado',
          tipo_orcamento: 'locacao_grua' as 'locacao_grua' | 'locacao_plataforma',
          condicoes_pagamento: formData.condicoes_comerciais || '',
          condicoes_gerais: formData.condicoes_gerais || '',
          logistica: formData.logistica || '',
          garantias: formData.garantias || '',
          prazo_entrega: formData.prazo_locacao_meses ? `${formData.prazo_locacao_meses} meses` : '',
          observacoes: formData.observacoes || '',
          valores_fixos: valoresFixos.map(vf => ({
            tipo: vf.tipo,
            descricao: vf.descricao,
            quantidade: vf.quantidade,
            valor_unitario: vf.valor_unitario,
            valor_total: vf.quantidade * vf.valor_unitario,
            observacoes: vf.observacoes || ''
          })),
          custos_mensais: custosMensais.map(cm => ({
            tipo: cm.tipo,
            descricao: cm.descricao,
            valor_mensal: cm.valor_mensal,
            obrigatorio: cm.obrigatorio,
            observacoes: cm.observacoes || ''
          })),
          itens: [
            // Incluir custos mensais como itens para compatibilidade
            ...custosMensais.map(cm => ({
              produto_servico: cm.tipo,
              descricao: cm.descricao,
              quantidade: prazoMeses,
              valor_unitario: cm.valor_mensal,
              valor_total: cm.valor_mensal * prazoMeses,
              tipo: (cm.tipo === 'Locação' ? 'equipamento' : 'servico') as 'equipamento' | 'servico' | 'produto',
              unidade: 'mês',
              observacoes: cm.observacoes || ''
            })),
            ...itensComplementos
          ]
        }

        if (isEditMode && orcamentoId) {
          response = await orcamentosLocacaoApi.update(parseInt(orcamentoId), orcamentoData)
        } else {
          response = await orcamentosLocacaoApi.create(orcamentoData)
        }
      }

      if (response.success) {
        toast({
          title: "Sucesso",
          description: isEditMode
            ? (isDraft 
                ? "Orçamento atualizado como rascunho com sucesso!" 
                : "Orçamento atualizado e enviado com sucesso!")
            : (isDraft 
                ? "Orçamento salvo como rascunho com sucesso!" 
                : "Orçamento salvo e enviado com sucesso!"),
        })
        
        // Redirecionar para a lista de orçamentos
        setTimeout(() => {
          router.push('/dashboard/orcamentos')
        }, 1500)
      }
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar orçamento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    setFormData({ ...formData, cliente_id: cliente.id.toString(), cliente_nome: cliente.name || cliente.nome })
  }

  const handleGruaSelect = (grua: any) => {
    setGruaSelecionada(grua)
    const equipamento = `${grua.tipo || 'Grua Torre'} / ${grua.fabricante} ${grua.modelo}`
    setFormData({ ...formData, equipamento })
  }

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsCreatingCliente(true)
      
      // Remover máscaras antes de enviar
      const dadosFormatados = {
        ...clienteFormData,
        cnpj: clienteFormData.cnpj.replace(/\D/g, ''),
        telefone: clienteFormData.telefone ? clienteFormData.telefone.replace(/\D/g, '') : '',
        cep: clienteFormData.cep ? clienteFormData.cep.replace(/\D/g, '') : '',
        contato_cpf: clienteFormData.contato_cpf ? clienteFormData.contato_cpf.replace(/\D/g, '') : '',
        contato_telefone: clienteFormData.contato_telefone ? clienteFormData.contato_telefone.replace(/\D/g, '') : '',
        criar_usuario: clienteFormData.criar_usuario || false,
        usuario_senha: clienteFormData.criar_usuario ? clienteFormData.usuario_senha : undefined
      }
      
      const response = await clientesApi.criarCliente(dadosFormatados)
      
      if (response.success && response.data) {
        // Converter o cliente criado para o formato esperado
        const novoCliente = converterClienteBackendParaFrontend(response.data)
        
        // Selecionar automaticamente o cliente criado
        handleClienteSelect(novoCliente)
        
        // Resetar formulário e fechar modal
        setClienteFormData({
          nome: '',
          email: '',
          telefone: '',
          cnpj: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: '',
          contato: '',
          contato_email: '',
          contato_cpf: '',
          contato_telefone: '',
          status: 'ativo',
          criar_usuario: false,
          usuario_senha: ''
        })
        setIsClienteModalOpen(false)
        
        toast({
          title: "Sucesso",
          description: "Cliente criado e selecionado com sucesso!",
        })
      }
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err)
      toast({
        title: "Erro",
        description: err.response?.data?.message || "Erro ao criar cliente. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingCliente(false)
    }
  }

  // Função para preencher todos os campos com dados de debug
  const handleDebugFill = () => {
    // Proteger função de debug - apenas em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      console.warn('Função de debug desabilitada em produção')
      return
    }
    // Preencher formData
    setFormData({
      cliente_id: '1',
      cliente_nome: 'Cliente Teste Debug',
      obra_nome: 'Obra Residencial Jardim das Flores - Debug',
      obra_endereco: 'Rua das Flores, 123 - Centro',
      obra_cidade: 'São Paulo',
      obra_estado: 'SP',
      tipo_obra: 'Residencial',
      equipamento: 'Grua Torre / XCMG QTZ40B',
      altura_inicial: '21',
      altura_final: '95',
      comprimento_lanca: '30',
      carga_maxima: '2000',
      carga_ponta: '1300',
      potencia_eletrica: '42 KVA',
      energia_necessaria: '380V',
      valor_locacao_mensal: '15000',
      valor_operador: '8000',
      valor_sinaleiro: '6000',
      valor_manutencao: '2000',
      prazo_locacao_meses: '13',
      data_inicio_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tolerancia_dias: '15',
      escopo_incluso: 'Operador e sinaleiro por turno (carga horária mensal definida). Manutenção em horário normal de trabalho. Treinamento, ART e documentação conforme NR-18.',
      responsabilidades_cliente: 'Fornecer energia 380V no local. Disponibilizar sinaleiros para içamento. Acessos preparados para transporte e montagem. Cumprimento das normas NR-18 e infraestrutura para instalação.',
      condicoes_comerciais: 'Medição mensal e pagamento até dia 15. Valores isentos de impostos por serem locação. Multa em caso de cancelamento após mobilização (geralmente 2 meses de locação). Validade da proposta enquanto houver equipamento disponível.',
      condicoes_gerais: 'Condições gerais de contrato, termos legais, cláusulas contratuais conforme legislação vigente.',
      logistica: 'Transporte da grua até a obra e retorno ao depósito. Prazo de entrega: 15 dias úteis após assinatura do contrato.',
      garantias: 'Garantia de funcionamento da grua durante todo o período de locação. Garantia de peças e manutenção preventiva.',
      observacoes: 'Dados preenchidos automaticamente para debug e testes do sistema.'
    })

    // Preencher cliente selecionado (mock)
    setClienteSelecionado({
      id: 1,
      name: 'Cliente Teste Debug',
      nome: 'Cliente Teste Debug'
    })

    // Preencher grua selecionada (mock)
    setGruaSelecionada({
      id: 1,
      tipo: 'Grua Torre',
      fabricante: 'XCMG',
      modelo: 'QTZ40B',
      lanca: 30,
      altura_final: 95,
      tipo_base: 'Fixada',
      ano: 2020,
      potencia_instalada: 42,
      capacidade_1_cabo: 2000,
      capacidade_2_cabos: 1300,
      voltagem: '380V'
    })

    // Preencher custos mensais
    setCustosMensais([
      {
        id: 'cm_1',
        tipo: 'Locação',
        descricao: 'Locação da grua',
        valor_mensal: 15000,
        obrigatorio: true,
        observacoes: 'Valor mensal de locação do equipamento'
      },
      {
        id: 'cm_2',
        tipo: 'Operador',
        descricao: 'Operador',
        valor_mensal: 8000,
        obrigatorio: true,
        observacoes: 'Operador qualificado'
      },
      {
        id: 'cm_3',
        tipo: 'Sinaleiro',
        descricao: 'Sinaleiro',
        valor_mensal: 6000,
        obrigatorio: true,
        observacoes: 'Sinaleiro certificado'
      },
      {
        id: 'cm_4',
        tipo: 'Manutenção',
        descricao: 'Manutenção preventiva',
        valor_mensal: 2000,
        obrigatorio: true,
        observacoes: 'Manutenção mensal preventiva'
      }
    ])

    // Preencher valores fixos (apenas para locação)
    if (!isObra) {
      setValoresFixos([
        {
          id: 'vf_1',
          tipo: 'Locação',
          descricao: 'Transporte de Ida e Retorno',
          quantidade: 1,
          valor_unitario: 3000,
          valor_total: 3000,
          observacoes: 'Transporte da grua até a obra e retorno'
        },
        {
          id: 'vf_2',
          tipo: 'Serviço',
          descricao: 'Serviço de Montagem',
          quantidade: 8,
          valor_unitario: 150,
          valor_total: 1200,
          observacoes: '8 horas de montagem'
        }
      ])
    }

    // Adicionar alguns complementos
    const garfoPaleteiro = CATALOGO_COMPLEMENTOS.find(c => c.sku === 'ACESS-001')
    const transporte = CATALOGO_COMPLEMENTOS.find(c => c.sku === 'SERV-004')
    
    const complementosDebug = []
    if (garfoPaleteiro) {
      // Mensal: preço * quantidade
      complementosDebug.push({
        ...garfoPaleteiro,
        quantidade: 2,
        valor_total: (garfoPaleteiro.preco_unitario_centavos / 100) * 2
      })
    }
    if (transporte) {
      // Único: preço * quantidade
      complementosDebug.push({
        ...transporte,
        quantidade: 1,
        valor_total: transporte.preco_unitario_centavos / 100
      })
    }
    setComplementosSelecionados(complementosDebug)

    toast({
      title: "Debug",
      description: "Todos os campos foram preenchidos com dados de teste!",
    })
  }

  if (isLoadingOrcamento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode 
                ? (isObra ? 'Editar Orçamento de Obra' : 'Editar Orçamento de Locação')
                : (isObra ? 'Novo Orçamento de Obra' : 'Novo Orçamento de Locação')}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? (isObra ? 'Edite os dados do orçamento de obra' : 'Edite os dados do orçamento de locação')
                : (isObra ? 'Preencha os dados essenciais do orçamento de obra' : 'Preencha os dados essenciais do orçamento de locação')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Botão de Debug - apenas para admin@admin.com */}
          {isAdminUser && (
            <Button 
              variant="outline" 
              onClick={handleDebugFill}
              className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
              title="Preencher todos os campos com dados de teste"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Debug Campos
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileTextIcon className="w-4 h-4 mr-2" />
            )}
            Salvar como Rascunho
          </Button>
          <Button 
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identificacao" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="identificacao">
            <Building2 className="w-4 h-4 mr-2" />
            Identificação
          </TabsTrigger>
          <TabsTrigger value="tecnico">
            <Wrench className="w-4 h-4 mr-2" />
            Técnico
          </TabsTrigger>
          <TabsTrigger value="custos">
            <DollarSign className="w-4 h-4 mr-2" />
            Custos
          </TabsTrigger>
          <TabsTrigger value="prazos">
            <Calendar className="w-4 h-4 mr-2" />
            Prazos
          </TabsTrigger>
          <TabsTrigger value="condicoes">
            <FileText className="w-4 h-4 mr-2" />
            Condições
          </TabsTrigger>
          <TabsTrigger value="itens">
            <Package className="w-4 h-4 mr-2" />
            Itens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identificacao" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Identificação Básica</CardTitle>
              <CardDescription>
                Dados da empresa fornecedora, construtora e obra
              </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cliente *</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ClienteSearch
                        onClienteSelect={handleClienteSelect}
                        selectedCliente={clienteSelecionado}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsClienteModalOpen(true)}
                      className="flex-shrink-0"
                      title="Adicionar novo cliente"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Obra *</Label>
                  <Input
                    value={formData.obra_nome}
                    onChange={(e) => setFormData({ ...formData, obra_nome: e.target.value })}
                    placeholder="Ex: Residencial Jardim das Flores"
                  />
                </div>
                <div>
                  <Label>Tipo de Obra *</Label>
                  <Select
                    value={formData.tipo_obra}
                    onValueChange={(value) => setFormData({ ...formData, tipo_obra: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residencial">Residencial</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Endereço da Obra</Label>
                <Input
                  value={formData.obra_endereco}
                  onChange={(e) => setFormData({ ...formData, obra_endereco: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.obra_cidade}
                    onChange={(e) => setFormData({ ...formData, obra_cidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={formData.obra_estado}
                    onChange={(e) => setFormData({ ...formData, obra_estado: e.target.value.toUpperCase() })}
                    maxLength={2}
                    placeholder="SP"
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tecnico" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Especificações Técnicas da Grua</CardTitle>
              <CardDescription>
                Dados técnicos essenciais do equipamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Altura Inicial (m)</Label>
                  <Input
                    type="number"
                    value={formData.altura_inicial}
                    onChange={(e) => setFormData({ ...formData, altura_inicial: e.target.value })}
                    placeholder="Ex: 21"
                  />
                </div>
                <div>
                  <Label>Altura Final Prevista (m)</Label>
                  <Input
                    type="number"
                    value={formData.altura_final}
                    onChange={(e) => setFormData({ ...formData, altura_final: e.target.value })}
                    placeholder="Ex: 95"
                  />
                </div>
                <div>
                  <Label>Comprimento da Lança (m)</Label>
                  <Input
                    type="number"
                    value={formData.comprimento_lanca}
                    onChange={(e) => setFormData({ ...formData, comprimento_lanca: e.target.value })}
                    placeholder="Ex: 30"
                  />
                </div>
                <div>
                  <Label>Carga Máxima (kg)</Label>
                  <Input
                    type="number"
                    value={formData.carga_maxima}
                    onChange={(e) => setFormData({ ...formData, carga_maxima: e.target.value })}
                    placeholder="Ex: 2000"
                  />
                </div>
                <div>
                  <Label>Carga na Ponta (kg)</Label>
                  <Input
                    type="number"
                    value={formData.carga_ponta}
                    onChange={(e) => setFormData({ ...formData, carga_ponta: e.target.value })}
                    placeholder="Ex: 1300"
                  />
                </div>
                <div>
                  <Label>Potência Elétrica</Label>
                  <Input
                    value={formData.potencia_eletrica}
                    onChange={(e) => setFormData({ ...formData, potencia_eletrica: e.target.value })}
                    placeholder="Ex: 42 KVA"
                  />
                </div>
                <div>
                  <Label>Energia Necessária</Label>
                  <Input
                    value={formData.energia_necessaria}
                    onChange={(e) => setFormData({ ...formData, energia_necessaria: e.target.value })}
                    placeholder="Ex: 380V"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos Mensais Principais</CardTitle>
              <CardDescription>
                Valores mensais básicos (locação, operador, sinaleiro e manutenção)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botão para adicionar novo custo mensal */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCustosMensais([
                    ...custosMensais,
                    {
                      id: `cm_${Date.now()}`,
                      tipo: '',
                      descricao: '',
                      valor_mensal: 0,
                      obrigatorio: false,
                      observacoes: ''
                    }
                  ])
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Custo Mensal
              </Button>

              {/* Lista de custos mensais */}
              {custosMensais.length > 0 ? (
                <div className="space-y-4">
                  {custosMensais.map((custoMensal, index) => (
                    <Card key={custoMensal.id || index} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            {custoMensal.tipo && ['Locação', 'Operador', 'Sinaleiro', 'Manutenção'].includes(custoMensal.tipo) ? (
                              <>
                                <Label>Tipo *</Label>
                                <Select
                                  value={custoMensal.tipo}
                                  disabled={true}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Locação">Locação</SelectItem>
                                    <SelectItem value="Operador">Operador</SelectItem>
                                    <SelectItem value="Sinaleiro">Sinaleiro</SelectItem>
                                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </>
                            ) : (
                              <>
                                <Label>Tipo *</Label>
                                <Input
                                  value={custoMensal.tipo}
                                  onChange={(e) => {
                                    const updated = custosMensais.map((cm, i) =>
                                      i === index ? { ...cm, tipo: e.target.value } : cm
                                    )
                                    setCustosMensais(updated)
                                  }}
                                  placeholder="Ex: Locação, Operador, Sinaleiro"
                                />
                              </>
                            )}
                          </div>
                          <div>
                            <Label>Descrição *</Label>
                            <Input
                              value={custoMensal.descricao}
                              onChange={(e) => {
                                const updated = custosMensais.map((cm, i) =>
                                  i === index ? { ...cm, descricao: e.target.value } : cm
                                )
                                setCustosMensais(updated)
                              }}
                              placeholder="Ex: Locação da grua"
                            />
                          </div>
                          <div>
                            <Label>Valor Mensal (R$/mês) *</Label>
                            <Input
                              type="text"
                              value={custoMensal.valor_mensal > 0 ? formatCurrencyFromReais(custoMensal.valor_mensal) : ''}
                              onChange={(e) => {
                                const formatted = formatCurrency(e.target.value)
                                const valor = parseCurrency(formatted)
                                const updated = custosMensais.map((cm, i) =>
                                  i === index ? { ...cm, valor_mensal: valor } : cm
                                )
                                setCustosMensais(updated)
                              }}
                              placeholder="0,00"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center space-x-2 w-full">
                              <input
                                type="checkbox"
                                id={`obrigatorio-${index}`}
                                checked={custoMensal.obrigatorio}
                                onChange={(e) => {
                                  const updated = custosMensais.map((cm, i) =>
                                    i === index ? { ...cm, obrigatorio: e.target.checked } : cm
                                  )
                                  setCustosMensais(updated)
                                }}
                                className="w-4 h-4"
                              />
                              <Label htmlFor={`obrigatorio-${index}`} className="cursor-pointer">
                                Obrigatório
                              </Label>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label>Observações</Label>
                            <Input
                              value={custoMensal.observacoes || ''}
                              onChange={(e) => {
                                const updated = custosMensais.map((cm, i) =>
                                  i === index ? { ...cm, observacoes: e.target.value } : cm
                                )
                                setCustosMensais(updated)
                              }}
                              placeholder="Observações adicionais..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustosMensais(custosMensais.filter((_, i) => i !== index))
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Mensal</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {calcularTotalMensal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Horas extras, ascensões, acessórios e transporte ficam no Complemento de Obra
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prazos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prazos e Datas</CardTitle>
              <CardDescription>
                Prazo de locação previsto e data de início estimada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prazo de Locação (meses) *</Label>
                  <Input
                    type="number"
                    value={formData.prazo_locacao_meses}
                    onChange={(e) => setFormData({ ...formData, prazo_locacao_meses: e.target.value })}
                    placeholder="Ex: 13"
                  />
                </div>
                <div>
                  <Label>Data de Início Estimada</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio_estimada}
                    onChange={(e) => setFormData({ ...formData, data_inicio_estimada: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tolerância (± dias)</Label>
                  <Input
                    type="number"
                    value={formData.tolerancia_dias}
                    onChange={(e) => setFormData({ ...formData, tolerancia_dias: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="condicoes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Escopo Básico Incluso</CardTitle>
              <CardDescription>
                O que está incluído no orçamento básico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.escopo_incluso}
                onChange={(e) => setFormData({ ...formData, escopo_incluso: e.target.value })}
                rows={5}
                placeholder="Ex: Operador e sinaleiro por turno (carga horária mensal definida). Manutenção em horário normal de trabalho. Treinamento, ART e documentação conforme NR-18."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsabilidades do Cliente</CardTitle>
              <CardDescription>
                O que o cliente deve fornecer/preparar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.responsabilidades_cliente}
                onChange={(e) => setFormData({ ...formData, responsabilidades_cliente: e.target.value })}
                rows={5}
                placeholder="Ex: Fornecer energia 380V no local. Disponibilizar sinaleiros para içamento. Acessos preparados para transporte e montagem. Cumprimento das normas NR-18 e infraestrutura para instalação."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condições Comerciais</CardTitle>
              <CardDescription>
                Termos de pagamento e condições gerais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.condicoes_comerciais}
                onChange={(e) => setFormData({ ...formData, condicoes_comerciais: e.target.value })}
                rows={5}
                placeholder="Ex: Medição mensal e pagamento até dia 15. Valores isentos de impostos por serem locação. Multa em caso de cancelamento após mobilização (geralmente 2 meses de locação). Validade da proposta enquanto houver equipamento disponível."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condições Gerais</CardTitle>
              <CardDescription>
                Condições gerais do contrato e termos legais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.condicoes_gerais}
                onChange={(e) => setFormData({ ...formData, condicoes_gerais: e.target.value })}
                rows={5}
                placeholder="Ex: Condições gerais de contrato, termos legais, cláusulas contratuais..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logística</CardTitle>
              <CardDescription>
                Informações sobre transporte, entrega e instalação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.logistica}
                onChange={(e) => setFormData({ ...formData, logistica: e.target.value })}
                rows={5}
                placeholder="Ex: Transporte, prazo de entrega, condições de instalação, responsabilidades logísticas..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Garantias</CardTitle>
              <CardDescription>
                Garantias oferecidas e condições de garantia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.garantias}
                onChange={(e) => setFormData({ ...formData, garantias: e.target.value })}
                rows={5}
                placeholder="Ex: Garantia de funcionamento, garantia de peças, prazo de garantia, condições de cobertura..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                placeholder="Observações adicionais..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itens" className="space-y-4 mt-4">
          {/* Seção de Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Equipamento Ofertado</CardTitle>
              <CardDescription>
                Selecione o equipamento principal do orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Equipamento Ofertado *</Label>
                <GruaSearch
                  onGruaSelect={handleGruaSelect}
                  selectedGrua={gruaSelecionada}
                />
                {formData.equipamento && (
                  <Input
                    value={formData.equipamento}
                    onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                    className="mt-2"
                    placeholder="Ex: Grua Torre / XCMG QTZ40B"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seção de Complementos */}
          <Card>
            <CardHeader>
              <CardTitle>Complementos do Orçamento</CardTitle>
              <CardDescription>
                Adicione complementos adicionais que podem ser atrelados a este orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Busca de complementos */}
              <div ref={complementosSearchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Digite para buscar ou clique para ver todos os complementos..."
                    value={searchComplemento}
                    onChange={(e) => {
                      setSearchComplemento(e.target.value)
                      setShowComplementosResults(true)
                    }}
                    onClick={() => {
                      if (searchComplemento.length === 0) {
                        setShowComplementosResults(true)
                      }
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Resultados da busca */}
                {showComplementosResults && (
                  <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <CardContent className="p-0">
                      {(() => {
                        const complementosFiltrados = CATALOGO_COMPLEMENTOS.filter(c => 
                          !complementosSelecionados.find(sel => sel.sku === c.sku) &&
                          (searchComplemento === "" || 
                           c.nome.toLowerCase().includes(searchComplemento.toLowerCase()) ||
                           c.sku.toLowerCase().includes(searchComplemento.toLowerCase()) ||
                           c.descricao?.toLowerCase().includes(searchComplemento.toLowerCase()))
                        )

                        if (complementosFiltrados.length === 0) {
                          return (
                            <div className="p-4 text-center text-gray-500">
                              <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Nenhum complemento encontrado</p>
                              <p className="text-xs">Tente buscar por nome, SKU ou descrição</p>
                            </div>
                          )
                        }

                        return (
                          <div className="divide-y">
                            {complementosFiltrados.map((complemento) => (
                              <button
                                key={complemento.sku}
                                onClick={() => {
                                  if (!complementosSelecionados.find(c => c.sku === complemento.sku)) {
                                    setComplementosSelecionados([
                                      ...complementosSelecionados,
                                      {
                                        ...complemento,
                                        quantidade: 1,
                                        valor_total: complemento.preco_unitario_centavos / 100
                                      }
                                    ])
                                    setSearchComplemento("")
                                    setShowComplementosResults(false)
                                  }
                                }}
                                className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Package className="w-4 h-4 text-gray-500" />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{complemento.nome}</p>
                                    <p className="text-sm text-gray-600">
                                      {complemento.sku} - {complemento.descricao}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {(() => {
                                          const tipo = (complemento as any).tipo_precificacao
                                          if (tipo === 'mensal') return 'Mensal'
                                          if (tipo === 'unico') return 'Único'
                                          if (tipo === 'por_metro') return 'Por Metro'
                                          if (tipo === 'por_hora') return 'Por Hora'
                                          if (tipo === 'por_dia') return 'Por Dia'
                                          return tipo || 'N/A'
                                        })()}
                                      </Badge>
                                      <span className="text-xs font-semibold text-gray-700">
                                        R$ {((complemento as any).preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Lista de complementos selecionados */}
              {complementosSelecionados.length > 0 ? (
                <div className="space-y-2">
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 font-semibold text-sm border-b">
                      <div className="col-span-4">Nome</div>
                      <div className="col-span-2">Tipo</div>
                      <div className="col-span-2">Preço Unit.</div>
                      <div className="col-span-2">Quantidade</div>
                      <div className="col-span-2">Ações</div>
                    </div>
                    {complementosSelecionados.map((complemento, index) => (
                      <div key={complemento.sku || index} className="grid grid-cols-12 gap-2 p-3 border-b last:border-b-0 items-center">
                        <div className="col-span-4">
                          <div className="font-medium">{complemento.nome}</div>
                          {complemento.sku && (
                            <div className="text-xs text-gray-500">{complemento.sku}</div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Badge variant="outline">
                            {complemento.tipo_precificacao === 'mensal' ? 'Mensal' :
                             complemento.tipo_precificacao === 'unico' ? 'Único' :
                             complemento.tipo_precificacao === 'por_metro' ? 'Por Metro' :
                             complemento.tipo_precificacao === 'por_hora' ? 'Por Hora' :
                             complemento.tipo_precificacao === 'por_dia' ? 'Por Dia' : complemento.tipo_precificacao}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          R$ {(complemento.preco_unitario_centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentQty = complemento.quantidade || 1
                                if (currentQty > 1) {
                                  const newQty = currentQty - 1
                                  const updated = complementosSelecionados.map(c =>
                                    c.sku === complemento.sku
                                      ? { ...c, quantidade: newQty, valor_total: (complemento.preco_unitario_centavos / 100) * newQty }
                                      : c
                                  )
                                  setComplementosSelecionados(updated)
                                }
                              }}
                              className="h-9 w-9 p-0"
                              disabled={(complemento.quantidade || 1) <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={complemento.quantidade || 1}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 1
                                const updated = complementosSelecionados.map(c =>
                                  c.sku === complemento.sku
                                    ? { ...c, quantidade: newQty, valor_total: (complemento.preco_unitario_centavos / 100) * newQty }
                                    : c
                                )
                                setComplementosSelecionados(updated)
                              }}
                              className="w-16 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentQty = complemento.quantidade || 1
                                const newQty = currentQty + 1
                                const updated = complementosSelecionados.map(c =>
                                  c.sku === complemento.sku
                                    ? { ...c, quantidade: newQty, valor_total: (complemento.preco_unitario_centavos / 100) * newQty }
                                    : c
                                )
                                setComplementosSelecionados(updated)
                              }}
                              className="h-9 w-9 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setComplementosSelecionados(
                                complementosSelecionados.filter(c => c.sku !== complemento.sku)
                              )
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total dos Complementos:</div>
                      <div className="text-xl font-bold text-green-600">
                        R$ {complementosSelecionados.reduce((sum, c) => sum + (c.valor_total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Seção de Valores Fixos - Apenas para Locação */}
          {!isObra && (
          <Card>
            <CardHeader>
              <CardTitle>Valores Fixos</CardTitle>
              <CardDescription>
                Adicione itens de locação ou serviço com valores fixos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botão para adicionar novo valor fixo */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setValoresFixos([
                    ...valoresFixos,
                    {
                      id: `vf_${Date.now()}`,
                      tipo: 'Locação',
                      descricao: '',
                      quantidade: 1,
                      valor_unitario: 0,
                      valor_total: 0,
                      observacoes: ''
                    }
                  ])
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Valor Fixo
              </Button>

              {/* Lista de valores fixos */}
              {valoresFixos.length > 0 ? (
                <div className="space-y-4">
                  {valoresFixos.map((valorFixo, index) => (
                    <Card key={valorFixo.id || index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Tipo *</Label>
                            <Select
                              value={valorFixo.tipo}
                              onValueChange={(value: 'Locação' | 'Serviço') => {
                                const updated = valoresFixos.map((vf, i) =>
                                  i === index ? { ...vf, tipo: value } : vf
                                )
                                setValoresFixos(updated)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Locação">Locação</SelectItem>
                                <SelectItem value="Serviço">Serviço</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Descrição *</Label>
                            <Input
                              value={valorFixo.descricao}
                              onChange={(e) => {
                                const updated = valoresFixos.map((vf, i) =>
                                  i === index ? { ...vf, descricao: e.target.value } : vf
                                )
                                setValoresFixos(updated)
                              }}
                              placeholder="Ex: Locação de grua torre"
                            />
                          </div>
                          <div>
                            <Label>Quantidade *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={valorFixo.quantidade}
                              onChange={(e) => {
                                const qty = parseFloat(e.target.value) || 0
                                const valorTotal = qty * valorFixo.valor_unitario
                                const updated = valoresFixos.map((vf, i) =>
                                  i === index ? { ...vf, quantidade: qty, valor_total: valorTotal } : vf
                                )
                                setValoresFixos(updated)
                              }}
                            />
                          </div>
                          <div>
                            <Label>Valor Unitário (R$) *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={valorFixo.valor_unitario}
                              onChange={(e) => {
                                const valorUnit = parseFloat(e.target.value) || 0
                                const valorTotal = valorUnit * valorFixo.quantidade
                                const updated = valoresFixos.map((vf, i) =>
                                  i === index ? { ...vf, valor_unitario: valorUnit, valor_total: valorTotal } : vf
                                )
                                setValoresFixos(updated)
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label>Valor Total (R$)</Label>
                            <Input
                              value={(valorFixo.quantidade * valorFixo.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              disabled
                              className="bg-gray-50 font-semibold"
                            />
                          </div>
                          <div>
                            <Label>Observações</Label>
                            <Input
                              value={valorFixo.observacoes || ''}
                              onChange={(e) => {
                                const updated = valoresFixos.map((vf, i) =>
                                  i === index ? { ...vf, observacoes: e.target.value } : vf
                                )
                                setValoresFixos(updated)
                              }}
                              placeholder="Observações adicionais..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setValoresFixos(valoresFixos.filter((_, i) => i !== index))
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total dos Valores Fixos:</div>
                      <div className="text-xl font-bold text-green-600">
                        R$ {valoresFixos.reduce((sum, vf) => sum + (vf.quantidade * vf.valor_unitario), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-white p-4 border-t -mx-6 px-6">
        {/* Botão de Debug - apenas para admin com debug mode ativado */}
        {isAdminUser && debugMode && (
          <Button 
            variant="outline" 
            onClick={handleDebugFill}
            className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
            title="Preencher todos os campos com dados de teste"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Debug Campos
          </Button>
        )}
        <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>
          Voltar
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleSave(true)}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileTextIcon className="w-4 h-4 mr-2" />
          )}
          Salvar como Rascunho
        </Button>
        <Button 
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      {/* Modal de Criação de Cliente */}
      <Dialog open={isClienteModalOpen} onOpenChange={setIsClienteModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCliente} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    value={clienteFormData.nome}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, nome: e.target.value })}
                    placeholder="Ex: Construtora ABC Ltda"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={clienteFormData.cnpj}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '.' + value.substring(2)
                      }
                      if (value.length >= 6) {
                        value = value.substring(0, 6) + '.' + value.substring(6)
                      }
                      if (value.length >= 10) {
                        value = value.substring(0, 10) + '/' + value.substring(10)
                      }
                      if (value.length >= 15) {
                        value = value.substring(0, 15) + '-' + value.substring(15, 17)
                      }
                      setClienteFormData({ ...clienteFormData, cnpj: value })
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clienteFormData.email || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={clienteFormData.telefone || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                      }
                      if (value.length >= 10) {
                        value = value.substring(0, 10) + '-' + value.substring(10, 14)
                      }
                      setClienteFormData({ ...clienteFormData, telefone: value })
                    }}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={clienteFormData.endereco || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={clienteFormData.cep || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 5) {
                        value = value.substring(0, 5) + '-' + value.substring(5, 8)
                      }
                      setClienteFormData({ ...clienteFormData, cep: value })
                    }}
                    placeholder="01234-567"
                    maxLength={9}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={clienteFormData.cidade || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, cidade: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={clienteFormData.estado || undefined}
                    onValueChange={(value) => setClienteFormData({ ...clienteFormData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Acre (AC)</SelectItem>
                      <SelectItem value="AL">Alagoas (AL)</SelectItem>
                      <SelectItem value="AP">Amapá (AP)</SelectItem>
                      <SelectItem value="AM">Amazonas (AM)</SelectItem>
                      <SelectItem value="BA">Bahia (BA)</SelectItem>
                      <SelectItem value="CE">Ceará (CE)</SelectItem>
                      <SelectItem value="DF">Distrito Federal (DF)</SelectItem>
                      <SelectItem value="ES">Espírito Santo (ES)</SelectItem>
                      <SelectItem value="GO">Goiás (GO)</SelectItem>
                      <SelectItem value="MA">Maranhão (MA)</SelectItem>
                      <SelectItem value="MT">Mato Grosso (MT)</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul (MS)</SelectItem>
                      <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
                      <SelectItem value="PA">Pará (PA)</SelectItem>
                      <SelectItem value="PB">Paraíba (PB)</SelectItem>
                      <SelectItem value="PR">Paraná (PR)</SelectItem>
                      <SelectItem value="PE">Pernambuco (PE)</SelectItem>
                      <SelectItem value="PI">Piauí (PI)</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte (RN)</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul (RS)</SelectItem>
                      <SelectItem value="RO">Rondônia (RO)</SelectItem>
                      <SelectItem value="RR">Roraima (RR)</SelectItem>
                      <SelectItem value="SC">Santa Catarina (SC)</SelectItem>
                      <SelectItem value="SP">São Paulo (SP)</SelectItem>
                      <SelectItem value="SE">Sergipe (SE)</SelectItem>
                      <SelectItem value="TO">Tocantins (TO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pessoa de Contato (Representante)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contato">Nome do Representante</Label>
                  <Input
                    id="contato"
                    value={clienteFormData.contato || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, contato: e.target.value })}
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="contato_cpf">CPF do Representante</Label>
                  <Input
                    id="contato_cpf"
                    value={clienteFormData.contato_cpf || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 3) {
                        value = value.substring(0, 3) + '.' + value.substring(3)
                      }
                      if (value.length >= 7) {
                        value = value.substring(0, 7) + '.' + value.substring(7)
                      }
                      if (value.length >= 11) {
                        value = value.substring(0, 11) + '-' + value.substring(11, 13)
                      }
                      setClienteFormData({ ...clienteFormData, contato_cpf: value })
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contato_email">Email do Representante</Label>
                  <Input
                    id="contato_email"
                    type="email"
                    value={clienteFormData.contato_email || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, contato_email: e.target.value })}
                    placeholder="joao.silva@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contato_telefone">Telefone do Representante</Label>
                  <Input
                    id="contato_telefone"
                    value={clienteFormData.contato_telefone || ''}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = '(' + value.substring(0, 2) + ') ' + value.substring(2)
                      }
                      if (value.length >= 10) {
                        value = value.substring(0, 10) + '-' + value.substring(10, 14)
                      }
                      setClienteFormData({ ...clienteFormData, contato_telefone: value })
                    }}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsClienteModalOpen(false)} 
                disabled={isCreatingCliente}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingCliente}>
                {isCreatingCliente && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

