"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Building2, 
  Plus, 
  Calendar, 
  Users, 
  User,
  DollarSign, 
  ArrowLeft,
  ConeIcon as Crane,
  X,
  Trash2,
  Package,
  Settings,
  FileText,
  Zap,
  Gauge,
  Battery,
  Truck,
  CreditCard,
  Loader2,
  Shield,
  AlertCircle,
  UserCheck,
  Phone,
  Mail,
  Edit
} from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend, converterObraFrontendParaBackend, ObraBackend } from "@/lib/api-obras"
import { CustoMensal } from "@/lib/api-custos-mensais"
import { getOrcamentoAprovadoPorCliente, getOrcamentoCompleto, Orcamento } from "@/lib/api-orcamentos"
import { ButtonLoader } from "@/components/ui/loader"
import ClienteSearch from "@/components/cliente-search"
import GruaSearch from "@/components/grua-search"
import FuncionarioSearch from "@/components/funcionario-search"
import { useToast } from "@/hooks/use-toast"
import { CnoInput } from "@/components/cno-input"
import { DocumentoUpload } from "@/components/documento-upload"
import { ResponsavelTecnicoForm, ResponsavelTecnicoData } from "@/components/responsavel-tecnico-form"
import { SinaleirosForm, type SinaleirosFormRef } from "@/components/sinaleiros-form"
import { responsavelTecnicoApi } from "@/lib/api-responsavel-tecnico"
import { sinaleirosApi } from "@/lib/api-sinaleiros"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { clientesApi, converterClienteBackendParaFrontend } from "@/lib/api-clientes"
import { Checkbox } from "@/components/ui/checkbox"
import { useDebugMode } from "@/hooks/use-debug-mode"
import { DebugButton } from "@/components/debug-button"
import { responsaveisObraApi, type ResponsavelObraCreateData } from "@/lib/api-responsaveis-obra"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Funções de máscara
const formatCurrency = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Se não há números, retorna vazio
  if (!numbers || numbers === '0') return ''
  
  // Converte para número e divide por 100 para ter centavos
  const amount = parseInt(numbers) / 100
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatCNPJ = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara do CNPJ
  return numbers
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

const formatPhone = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara do telefone
  if (numbers.length <= 10) {
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14)
  } else {
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15)
  }
}

const formatCEP = (value: string) => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara do CEP
  return numbers
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9)
}

// Função para remover máscaras
const removeMasks = (value: string) => {
  return value.replace(/\D/g, '')
}

// Função para converter valor formatado para número
const parseCurrency = (value: string) => {
  const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleanValue) || 0
}

// Função para formatar números decimais
const formatDecimal = (value: string) => {
  // Remove tudo que não é dígito ou ponto
  const numbers = value.replace(/[^\d,]/g, '')
  
  // Se não há números, retorna vazio
  if (!numbers || numbers === '0') return ''
  
  // Se tem vírgula, formata como decimal
  if (numbers.includes(',')) {
    const parts = numbers.split(',')
    if (parts.length === 2) {
      // Limita a 2 casas decimais
      const decimal = parts[1].substring(0, 2)
      return `${parts[0]},${decimal}`
    }
  }
  
  return numbers
}

// Função para converter valor decimal formatado para número
const parseDecimal = (value: string) => {
  const cleanValue = value.replace(',', '.')
  return parseFloat(cleanValue) || 0
}

export default function NovaObraPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { debugMode } = useDebugMode()
  
  // Estados para integração com backend
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevenir saída da página durante criação
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (creating) {
        e.preventDefault()
        e.returnValue = 'A criação da obra está em andamento. Tem certeza que deseja sair?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [creating])
  
  // Estados do formulário
  const [obraFormData, setObraFormData] = useState({
    name: '',
    description: '',
    status: 'Em Andamento',
    startDate: '',
    endDate: '',
    location: '',
    cidade: '',
    estado: 'SP',
    tipo: 'Residencial',
    clienteId: '',
    observations: '',
    // Campos adicionais
    cep: '',
    contato_obra: '',
    telefone_obra: '',
    email_obra: '',
    // Lista de funcionários
    funcionarios: [] as Array<{
      id: string
      userId: string
      role: string
      name: string
      gruaId?: string
    }>
  })
  
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [gruasSelecionadas, setGruasSelecionadas] = useState<any[]>([])
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<any[]>([])
  
  // Estados para novos campos obrigatórios
  const [cno, setCno] = useState<string>('')
  const [artNumero, setArtNumero] = useState<string>('')
  const [artArquivo, setArtArquivo] = useState<File | null>(null)
  const [apoliceNumero, setApoliceNumero] = useState<string>('')
  const [apoliceArquivo, setApoliceArquivo] = useState<File | null>(null)
  const [cnoArquivo, setCnoArquivo] = useState<File | null>(null)
  // Novos documentos adicionais
  const [manualTecnicoArquivo, setManualTecnicoArquivo] = useState<File | null>(null)
  const [termoEntregaArquivo, setTermoEntregaArquivo] = useState<File | null>(null)
  const [planoCargaArquivo, setPlanoCargaArquivo] = useState<File | null>(null)
  const [aterramentoArquivo, setAterramentoArquivo] = useState<File | null>(null)
  const [responsavelTecnico, setResponsavelTecnico] = useState<ResponsavelTecnicoData | null>(null)
  
  // Estados para Responsáveis Técnicos IRBANA
  const [responsavelEquipamentos, setResponsavelEquipamentos] = useState<ResponsavelTecnicoData>({
    nome: 'ALEX MARCELO DA SILVA NASCIMENTO',
    cpf_cnpj: '',
    crea: '5071184591',
    email: '',
    telefone: ''
  })
  const [responsavelManutencoes, setResponsavelManutencoes] = useState<ResponsavelTecnicoData>({
    nome: 'NESTOR ALVAREZ GONZALEZ',
    cpf_cnpj: '',
    crea: '',
    email: '',
    telefone: '(11) 98818-5951'
  })
  const [responsavelMontagemOperacao, setResponsavelMontagemOperacao] = useState<ResponsavelTecnicoData>({
    nome: 'ALEX MARCELO DA SILVA NASCIMENTO',
    cpf_cnpj: '',
    crea: '5071184591',
    email: '',
    telefone: ''
  })
  
  // Estado para responsáveis técnicos adicionais dinâmicos
  const [responsaveisAdicionais, setResponsaveisAdicionais] = useState<Array<ResponsavelTecnicoData & { tipo?: string; area?: string }>>([])
  
  const [sinaleiros, setSinaleiros] = useState<any[]>([])
  const sinaleirosFormRef = useRef<SinaleirosFormRef>(null)
  
  // Estados para responsáveis de obra (aprovadores de horas)
  const [responsaveisObra, setResponsaveisObra] = useState<ResponsavelObraCreateData[]>([])
  const [isModalResponsavelObraOpen, setIsModalResponsavelObraOpen] = useState(false)
  const [editandoResponsavelObraIndex, setEditandoResponsavelObraIndex] = useState<number | null>(null)
  const [formResponsavelObra, setFormResponsavelObra] = useState<ResponsavelObraCreateData>({
    nome: '', usuario: '', email: '', telefone: ''
  })
  
  // Estados para orçamento aprovado
  const [orcamentoAprovado, setOrcamentoAprovado] = useState<Orcamento | null>(null)
  const [orcamentoId, setOrcamentoId] = useState<number | null>(null)
  const [loadingOrcamento, setLoadingOrcamento] = useState(false)
  
  // Estados para Dados de Montagem do Equipamento
  const [dadosMontagemEquipamento, setDadosMontagemEquipamento] = useState({
    altura_final: '',
    raio_trabalho: '',
    tipo_base: '',
    capacidade_1_cabo: '',
    capacidade_2_cabos: '',
    potencia_instalada: '',
    voltagem: '',
    velocidade_rotacao: '',
    velocidade_elevacao: '',
    velocidade_translacao: '',
    tipo_ligacao: '',
    capacidade_ponta: '',
    observacoes_montagem: ''
  })
  
  // Estados para modal de criação de cliente
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false)
  const [isCreatingCliente, setIsCreatingCliente] = useState(false)
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
  
  // Estados para valores
  const [custosMensais, setCustosMensais] = useState<CustoMensal[]>([])
  const [custoForm, setCustoForm] = useState({
    item: '',
    descricao: '',
    unidade: '',
    quantidadeOrcamento: 0,
    valorUnitario: 0,
    totalOrcamento: 0,
    mes: new Date().toISOString().slice(0, 7)
  })

  // Funções para valores
  const adicionarCustoMensal = () => {
    const novoCusto: CustoMensal = {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      obraId: '',
      item: custoForm.item,
      descricao: custoForm.descricao,
      unidade: custoForm.unidade,
      quantidadeOrcamento: custoForm.quantidadeOrcamento,
      valorUnitario: custoForm.valorUnitario,
      totalOrcamento: custoForm.quantidadeOrcamento * custoForm.valorUnitario,
      mes: custoForm.mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: custoForm.quantidadeOrcamento,
      valorSaldo: custoForm.quantidadeOrcamento * custoForm.valorUnitario,
      tipo: 'contrato',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('💰 DEBUG - Adicionando custo mensal:', novoCusto)
    const novosCustos = [...custosMensais, novoCusto]
    console.log('💰 DEBUG - Lista de custos atualizada:', novosCustos)
    setCustosMensais(novosCustos)
    setCustoForm({
      item: '',
      descricao: '',
      unidade: '',
      quantidadeOrcamento: 0,
      valorUnitario: 0,
      totalOrcamento: 0,
      mes: new Date().toISOString().slice(0, 7)
    })
  }

  const removerCustoMensal = (id: string) => {
    setCustosMensais(custosMensais.filter(custo => custo.id !== id))
  }

  const duplicarCustosParaMes = (mes: string) => {
    const custosDuplicados = custosMensais.map(custo => ({
      ...custo,
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mes: mes,
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: custo.quantidadeAcumulada,
      valorAcumulado: custo.valorAcumulado,
      quantidadeSaldo: custo.quantidadeOrcamento,
      valorSaldo: custo.totalOrcamento,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    setCustosMensais([...custosMensais, ...custosDuplicados])
  }

  // Função para lidar com seleção de cliente
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

  const handleClienteSelect = async (cliente: any) => {
    setClienteSelecionado(cliente)
    if (cliente) {
      setObraFormData({ ...obraFormData, clienteId: cliente.id })
      
      // Buscar orçamento aprovado para este cliente
      setLoadingOrcamento(true)
      try {
        const clienteId = cliente.id || cliente.cliente_id
        if (clienteId) {
          const orcamento = await getOrcamentoAprovadoPorCliente(clienteId)
          
          if (orcamento) {
            // Buscar dados completos do orçamento (incluindo custos mensais)
            const orcamentoCompleto = await getOrcamentoCompleto(orcamento.id)
            
            if (orcamentoCompleto.success && orcamentoCompleto.data) {
              setOrcamentoAprovado(orcamentoCompleto.data)
              setOrcamentoId(orcamento.id)
              
              // Pré-preencher valores do orçamento
              if (orcamentoCompleto.data.orcamento_custos_mensais && orcamentoCompleto.data.orcamento_custos_mensais.length > 0) {
                const custosDoOrcamento = orcamentoCompleto.data.orcamento_custos_mensais.map((cm: any, index: number) => ({
                  id: `cm_orc_${cm.id || index + 1}`,
                  obraId: '',
                  item: `0${index + 1}.0${index + 1}`,
                  descricao: cm.descricao || cm.tipo || '',
                  unidade: 'mês',
                  quantidadeOrcamento: 1,
                  valorUnitario: parseFloat(cm.valor_mensal) || 0,
                  totalOrcamento: parseFloat(cm.valor_mensal) || 0,
                  mes: new Date().toISOString().slice(0, 7),
                  quantidadeRealizada: 0,
                  valorRealizado: 0,
                  quantidadeAcumulada: 0,
                  valorAcumulado: 0,
                  quantidadeSaldo: 1,
                  valorSaldo: parseFloat(cm.valor_mensal) || 0,
                  tipo: 'contrato' as const,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }))
                
                setCustosMensais(custosDoOrcamento)
                
                toast({
                  title: "Orçamento encontrado",
                  description: `Valores do orçamento aprovado #${orcamento.id} foram pré-preenchidos.`,
                  variant: "default"
                })
              }
            }
          } else {
            setOrcamentoAprovado(null)
            setOrcamentoId(null)
            // Orçamento não é obrigatório - obra pode ser criada sem orçamento
          }
        }
      } catch (error) {
        console.error('Erro ao buscar orçamento aprovado:', error)
        toast({
          title: "Erro",
          description: "Erro ao buscar orçamento aprovado. Verifique sua conexão.",
          variant: "destructive"
        })
      } finally {
        setLoadingOrcamento(false)
      }
    }
  }

  // Função para lidar com seleção de grua
  const handleGruaSelect = (grua: any) => {
    console.log('🔧 DEBUG - Grua selecionada:', grua)
    if (gruasSelecionadas.find(g => g.id === grua.id)) {
      return // Já está selecionada
    }
    
    const novaGrua = {
      ...grua,
      valor_locacao: grua.valor_locacao || 0,
      taxa_mensal: grua.valor_locacao || 0
    }
    
    console.log('🔧 DEBUG - Nova grua criada:', novaGrua)
    const novasGruas = [...gruasSelecionadas, novaGrua]
    console.log('🔧 DEBUG - Lista de gruas atualizada:', novasGruas)
    setGruasSelecionadas(novasGruas)
  }

  // Função para remover grua selecionada
  const removeGruaSelecionada = (gruaId: string) => {
    setGruasSelecionadas(gruasSelecionadas.filter(g => g.id !== gruaId))
  }

  // Função para lidar com seleção de funcionário
  const handleFuncionarioSelect = (funcionario: any) => {
    console.log('👥 DEBUG - Funcionário selecionado:', funcionario)
    if (funcionariosSelecionados.find(f => f.id === funcionario.id)) {
      return // Já está selecionado
    }
    
    const novoFuncionario = {
      id: `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: funcionario.id,
      role: funcionario.role || funcionario.cargo || 'não informado',
      name: funcionario.name,
      gruaId: '' // Removido - usando array de gruas
    }
    
    console.log('👥 DEBUG - Novo funcionário criado:', novoFuncionario)
    const novosFuncionarios = [...funcionariosSelecionados, novoFuncionario]
    console.log('👥 DEBUG - Lista de funcionários atualizada:', novosFuncionarios)
    setFuncionariosSelecionados(novosFuncionarios)
    setObraFormData({
      ...obraFormData,
      funcionarios: [...obraFormData.funcionarios, novoFuncionario]
    })
  }

  // Função removida: handleToggleSupervisor - sistema não utiliza mais supervisor

  // Função para remover funcionário selecionado
  const removeFuncionarioSelecionado = (id: string) => {
    const funcionarioRemovido = funcionariosSelecionados.find(f => f.id === id)
    if (funcionarioRemovido) {
      setFuncionariosSelecionados(funcionariosSelecionados.filter(f => f.id !== id))
      setObraFormData({
        ...obraFormData,
        funcionarios: obraFormData.funcionarios.filter(f => f.id !== id)
      })
    }
  }


  // Funções para responsáveis de obra
  const abrirModalResponsavelObra = (index?: number) => {
    if (index !== undefined) {
      setEditandoResponsavelObraIndex(index)
      setFormResponsavelObra({ ...responsaveisObra[index] })
    } else {
      setEditandoResponsavelObraIndex(null)
      setFormResponsavelObra({ nome: '', usuario: '', email: '', telefone: '' })
    }
    setIsModalResponsavelObraOpen(true)
  }

  const salvarResponsavelObraLocal = () => {
    if (!formResponsavelObra.nome.trim()) {
      toast({ title: "Erro", description: "O nome é obrigatório", variant: "destructive" })
      return
    }
    if (editandoResponsavelObraIndex !== null) {
      const updated = [...responsaveisObra]
      updated[editandoResponsavelObraIndex] = { ...formResponsavelObra }
      setResponsaveisObra(updated)
    } else {
      setResponsaveisObra([...responsaveisObra, { ...formResponsavelObra }])
    }
    setIsModalResponsavelObraOpen(false)
    setEditandoResponsavelObraIndex(null)
    setFormResponsavelObra({ nome: '', usuario: '', email: '', telefone: '' })
  }

  const removerResponsavelObraLocal = (index: number) => {
    setResponsaveisObra(responsaveisObra.filter((_, i) => i !== index))
  }

  // Função para criar obra
  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Determinar clienteId - usar clienteSelecionado como fallback
    const clienteIdFinal = obraFormData.clienteId || clienteSelecionado?.id || clienteSelecionado?.cliente_id
    
    // Validação de campos obrigatórios - listar todos os campos faltantes
    const camposFaltando: string[] = []
    
    if (!obraFormData.name || !obraFormData.name.trim()) {
      camposFaltando.push('Nome da Obra')
    }
    
    if (!clienteIdFinal) {
      camposFaltando.push('Cliente')
    }
    
    if (!obraFormData.location || !obraFormData.location.trim()) {
      camposFaltando.push('Endereço')
    }
    
    if (!obraFormData.cidade || !obraFormData.cidade.trim()) {
      camposFaltando.push('Cidade')
    }
    
    if (!obraFormData.estado || !obraFormData.estado.trim()) {
      camposFaltando.push('Estado')
    }
    
    if (!obraFormData.tipo || !obraFormData.tipo.trim()) {
      camposFaltando.push('Tipo de Obra')
    }
    
    // Orçamento não é obrigatório - obra pode ser criada sem orçamento
    
    if (!cno || !cno.trim()) {
      camposFaltando.push('CNO da Obra')
    }
    
    if (!artNumero || !artNumero.trim()) {
      camposFaltando.push('Número da ART')
    }
    
    if (!artArquivo) {
      camposFaltando.push('Arquivo da ART')
    }
    
    if (!apoliceNumero || !apoliceNumero.trim()) {
      camposFaltando.push('Número da Apólice de Seguro')
    }
    
    if (!apoliceArquivo) {
      camposFaltando.push('Arquivo da Apólice de Seguro')
    }
    
    if (camposFaltando.length > 0) {
      // Prevenir o comportamento padrão do formulário (scroll automático)
      e.preventDefault()
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

    // Validação do responsável técnico removida - agora é opcional na criação
    // O responsável técnico pode ser cadastrado depois de criar a obra

    try {
      setCreating(true)
      setError(null)

      // Debug: Log dos dados antes da conversão
      console.debug('🔍 DEBUG - Dados antes da conversão:')
      console.debug('  - custosMensais:', custosMensais)
      console.debug('  - funcionariosSelecionados:', funcionariosSelecionados)
      console.debug('  - gruasSelecionadas:', gruasSelecionadas)
      console.debug('  - obraFormData:', obraFormData)

      // Preparar dados para o backend
      const obraData = {
        name: obraFormData.name,
        description: obraFormData.description,
        status: obraFormData.status,
        startDate: obraFormData.startDate,
        endDate: obraFormData.endDate,
        location: obraFormData.location,
        cidade: obraFormData.cidade,
        estado: obraFormData.estado,
        tipo: obraFormData.tipo,
        clienteId: clienteIdFinal,
        orcamento_id: orcamentoId, // ID do orçamento aprovado vinculado
        observations: obraFormData.observations,
        // Campos adicionais
        cep: obraFormData.cep ? obraFormData.cep.replace(/\D/g, '') : '',
        contato_obra: obraFormData.contato_obra || '',
        telefone_obra: obraFormData.telefone_obra || '',
        email_obra: obraFormData.email_obra || '',
        // Novos campos obrigatórios
        cno: cno,
        art_numero: artNumero,
        art_arquivo: artArquivo,
        apolice_numero: apoliceNumero,
        apolice_arquivo: apoliceArquivo,
        responsavel_tecnico: responsavelTecnico,
        sinaleiros: sinaleiros,
        // Dados das gruas - usar a primeira grua selecionada (compatibilidade)
        gruaId: gruasSelecionadas.length > 0 ? gruasSelecionadas[0].id : '',
        gruaValue: gruasSelecionadas.length > 0 ? gruasSelecionadas[0].valor_locacao?.toString() || '' : '',
        monthlyFee: gruasSelecionadas.length > 0 ? gruasSelecionadas[0].taxa_mensal?.toString() || '' : '',
        // Múltiplas gruas - usar dados específicos de cada grua quando disponíveis, senão usar dados gerais
        gruasSelecionadas: gruasSelecionadas.map(grua => ({
          ...grua,
          // Parâmetros Técnicos - usar dados específicos da grua, senão usar dados gerais
          tipo_base: grua.tipo_base || dadosMontagemEquipamento.tipo_base || undefined,
          altura_inicial: grua.altura_inicial || (dadosMontagemEquipamento.altura_inicial ? parseFloat(dadosMontagemEquipamento.altura_inicial) : undefined),
          altura_final: grua.altura_final || (dadosMontagemEquipamento.altura_final ? parseFloat(dadosMontagemEquipamento.altura_final) : undefined),
          raio_trabalho: grua.raio_trabalho || (dadosMontagemEquipamento.raio_trabalho ? parseFloat(dadosMontagemEquipamento.raio_trabalho) : undefined),
          velocidade_giro: grua.velocidade_giro || (dadosMontagemEquipamento.velocidade_rotacao ? parseFloat(dadosMontagemEquipamento.velocidade_rotacao) : undefined),
          velocidade_elevacao: grua.velocidade_elevacao || (dadosMontagemEquipamento.velocidade_elevacao ? parseFloat(dadosMontagemEquipamento.velocidade_elevacao) : undefined),
          velocidade_translacao: grua.velocidade_translacao || (dadosMontagemEquipamento.velocidade_translacao ? parseFloat(dadosMontagemEquipamento.velocidade_translacao) : undefined),
          potencia_instalada: grua.potencia_instalada || (dadosMontagemEquipamento.potencia_instalada ? parseFloat(dadosMontagemEquipamento.potencia_instalada) : undefined),
          voltagem: grua.voltagem || dadosMontagemEquipamento.voltagem || undefined,
          tipo_ligacao: grua.tipo_ligacao || dadosMontagemEquipamento.tipo_ligacao || undefined,
          capacidade_ponta: grua.capacidade_ponta || (dadosMontagemEquipamento.capacidade_ponta ? parseFloat(dadosMontagemEquipamento.capacidade_ponta) : undefined),
          capacidade_maxima_raio: grua.capacidade_maxima_raio || undefined,
          ano_fabricacao: grua.ano_fabricacao || grua.ano || undefined,
          vida_util: grua.vida_util || undefined,
          // Dados de montagem específicos (seção geral)
          capacidade_1_cabo: dadosMontagemEquipamento.capacidade_1_cabo ? parseFloat(dadosMontagemEquipamento.capacidade_1_cabo) : undefined,
          capacidade_2_cabos: dadosMontagemEquipamento.capacidade_2_cabos ? parseFloat(dadosMontagemEquipamento.capacidade_2_cabos) : undefined,
          velocidade_rotacao: dadosMontagemEquipamento.velocidade_rotacao ? parseFloat(dadosMontagemEquipamento.velocidade_rotacao) : undefined,
          // Serviços e Logística (específicos de cada grua)
          guindaste_montagem: grua.guindaste_montagem || undefined,
          quantidade_viagens: grua.quantidade_viagens || undefined,
          alojamento_alimentacao: grua.alojamento_alimentacao || undefined,
          responsabilidade_acessorios: grua.responsabilidade_acessorios || undefined,
        })),
        // Dados de montagem do equipamento (geral)
        dados_montagem_equipamento: dadosMontagemEquipamento,
        // Lista de funcionários
        funcionarios: funcionariosSelecionados,
        // Valores - converter para formato do backend
        custos_mensais: custosMensais.map(custo => ({
          item: custo.item,
          descricao: custo.descricao,
          unidade: custo.unidade,
          quantidadeOrcamento: custo.quantidadeOrcamento,
          valorUnitario: custo.valorUnitario,
          totalOrcamento: custo.totalOrcamento,
          mes: custo.mes,
          tipo: custo.tipo || 'contrato'
        }))
      }

      const getArquivoDebug = (arquivo: File | null) => ({
        selecionado: !!arquivo,
        nome: arquivo?.name || null,
        tamanhoBytes: arquivo?.size || 0,
        tipoMime: arquivo?.type || null
      })

      const snapshotTabsPreenchimento = {
        timestamp: new Date().toISOString(),
        abaDadosObra: {
          name: obraData.name,
          description: obraData.description,
          status: obraData.status,
          startDate: obraData.startDate,
          endDate: obraData.endDate,
          location: obraData.location,
          cidade: obraData.cidade,
          estado: obraData.estado,
          tipo: obraData.tipo,
          clienteId: obraData.clienteId,
          observations: obraData.observations,
          cep: obraData.cep,
          contato_obra: obraData.contato_obra,
          telefone_obra: obraData.telefone_obra,
          email_obra: obraData.email_obra
        },
        abaDocumentos: {
          cno: obraData.cno,
          art_numero: obraData.art_numero,
          apolice_numero: obraData.apolice_numero,
          cno_arquivo: getArquivoDebug(cnoArquivo),
          art_arquivo: getArquivoDebug(artArquivo),
          apolice_arquivo: getArquivoDebug(apoliceArquivo),
          manual_tecnico_arquivo: getArquivoDebug(manualTecnicoArquivo),
          termo_entrega_tecnica_arquivo: getArquivoDebug(termoEntregaArquivo),
          plano_carga_arquivo: getArquivoDebug(planoCargaArquivo),
          aterramento_arquivo: getArquivoDebug(aterramentoArquivo)
        },
        abaResponsavelTecnico: {
          responsavel_cliente: responsavelTecnico,
          irbana: {
            equipamentos: responsavelEquipamentos,
            manutencoes: responsavelManutencoes,
            montagem_operacao: responsavelMontagemOperacao,
            adicionais: responsaveisAdicionais
          }
        },
        abaGrua: {
          dados_montagem_equipamento: dadosMontagemEquipamento,
          gruas_selecionadas: obraData.gruasSelecionadas
        },
        abaFuncionarios: {
          responsaveis_obra: responsaveisObra,
          funcionarios: funcionariosSelecionados,
          sinaleiros
        },
        payloadCriacaoObra: obraData
      }

      console.debug('🧭 [Nova Obra] Snapshot de preenchimento por aba', snapshotTabsPreenchimento)

      // Debug: Log COMPLETO de todos os dados que serão enviados
      console.debug('═══════════════════════════════════════════════════════════')
      console.debug('🚀 DEBUG COMPLETO - TODOS OS DADOS QUE SERÃO ENVIADOS')
      console.debug('═══════════════════════════════════════════════════════════')
      
      console.debug('\n📋 1. DADOS BÁSICOS DA OBRA:')
      console.debug(JSON.stringify({
        name: obraData.name,
        description: obraData.description,
        status: obraData.status,
        startDate: obraData.startDate,
        endDate: obraData.endDate,
        location: obraData.location,
        cidade: obraData.cidade,
        estado: obraData.estado,
        tipo: obraData.tipo,
        cep: obraData.cep,
        contato_obra: obraData.contato_obra,
        telefone_obra: obraData.telefone_obra,
        email_obra: obraData.email_obra,
        clienteId: obraData.clienteId,
        orcamento_id: obraData.orcamento_id,
        observations: obraData.observations
      }, null, 2))
      
      console.debug('\n📄 2. DOCUMENTOS:')
      console.debug(JSON.stringify({
        cno: obraData.cno,
        art_numero: obraData.art_numero,
        art_arquivo: obraData.art_arquivo?.name || 'Arquivo não selecionado',
        apolice_numero: obraData.apolice_numero,
        apolice_arquivo: obraData.apolice_arquivo?.name || 'Arquivo não selecionado',
        cnoArquivo: cnoArquivo?.name || 'Não selecionado',
        manualTecnicoArquivo: manualTecnicoArquivo?.name || 'Não selecionado',
        termoEntregaArquivo: termoEntregaArquivo?.name || 'Não selecionado',
        planoCargaArquivo: planoCargaArquivo?.name || 'Não selecionado',
        aterramentoArquivo: aterramentoArquivo?.name || 'Não selecionado'
      }, null, 2))
      
      console.debug('\n🏗️ 3. GRUAS SELECIONADAS:')
      console.debug(JSON.stringify({
        quantidade: obraData.gruasSelecionadas.length,
        gruaId: obraData.gruaId,
        gruaValue: obraData.gruaValue,
        monthlyFee: obraData.monthlyFee,
        detalhes: obraData.gruasSelecionadas.map((g: any, idx: number) => ({
          indice: idx + 1,
          id: g.id,
          name: g.name,
          modelo: g.modelo,
          fabricante: g.fabricante,
          tipo: g.tipo,
          capacidade: g.capacidade,
          valor_locacao: g.valor_locacao,
          taxa_mensal: g.taxa_mensal,
          // Parâmetros Técnicos
          tipo_base: g.tipo_base,
          altura_inicial: g.altura_inicial,
          altura_final: g.altura_final,
          raio_trabalho: g.raio_trabalho,
          velocidade_giro: g.velocidade_giro,
          velocidade_elevacao: g.velocidade_elevacao,
          velocidade_translacao: g.velocidade_translacao,
          potencia_instalada: g.potencia_instalada,
          voltagem: g.voltagem,
          tipo_ligacao: g.tipo_ligacao,
          capacidade_ponta: g.capacidade_ponta,
          capacidade_maxima_raio: g.capacidade_maxima_raio,
          ano_fabricacao: g.ano_fabricacao,
          vida_util: g.vida_util,
          // Dados de montagem específicos (seção geral)
          capacidade_1_cabo: g.capacidade_1_cabo,
          capacidade_2_cabos: g.capacidade_2_cabos,
          velocidade_rotacao: g.velocidade_rotacao,
          // Serviços e Logística
          guindaste_montagem: g.guindaste_montagem,
          quantidade_viagens: g.quantidade_viagens,
          alojamento_alimentacao: g.alojamento_alimentacao,
          responsabilidade_acessorios: g.responsabilidade_acessorios
        }))
      }, null, 2))
      
      console.debug('\n⚙️ 4. DADOS DE MONTAGEM DO EQUIPAMENTO (geral):')
      console.debug(JSON.stringify(obraData.dados_montagem_equipamento, null, 2))
      
      console.debug('\n👥 5. FUNCIONÁRIOS SELECIONADOS:')
      console.debug(JSON.stringify({
        quantidade: obraData.funcionarios.length,
        funcionarios: obraData.funcionarios.map((f: any, idx: number) => ({
          indice: idx + 1,
          id: f.id,
          userId: f.userId,
          role: f.role,
          name: f.name,
          gruaId: f.gruaId
        }))
      }, null, 2))
      
      console.debug('\n👨‍💼 6. RESPONSÁVEL TÉCNICO:')
      console.debug(JSON.stringify({
        responsavel_tecnico: obraData.responsavel_tecnico ? {
          nome: obraData.responsavel_tecnico.nome,
          cpf_cnpj: obraData.responsavel_tecnico.cpf_cnpj,
          crea: obraData.responsavel_tecnico.crea,
          email: obraData.responsavel_tecnico.email,
          telefone: obraData.responsavel_tecnico.telefone,
          funcionario_id: obraData.responsavel_tecnico.funcionario_id
        } : null
      }, null, 2))
      
      console.debug('\n🚦 7. SINALEIROS:')
      console.debug(JSON.stringify({
        quantidade: obraData.sinaleiros.length,
        sinaleiros: obraData.sinaleiros.map((s: any, idx: number) => ({
          indice: idx + 1,
          nome: s.nome,
          rg_cpf: s.rg_cpf,
          telefone: s.telefone,
          email: s.email,
          tipo: s.tipo
        }))
      }, null, 2))
      
      console.debug('\n💰 8. CUSTOS MENSAIS:')
      console.debug(JSON.stringify({
        quantidade: obraData.custos_mensais.length,
        total: obraData.custos_mensais.reduce((acc: number, c: any) => acc + (c.totalOrcamento || 0), 0),
        custos: obraData.custos_mensais.map((c: any, idx: number) => ({
          indice: idx + 1,
          item: c.item,
          descricao: c.descricao,
          unidade: c.unidade,
          quantidadeOrcamento: c.quantidadeOrcamento,
          valorUnitario: c.valorUnitario,
          totalOrcamento: c.totalOrcamento,
          mes: c.mes,
          tipo: c.tipo
        }))
      }, null, 2))
      
      console.debug('\n📦 9. DADOS COMPLETOS (OBJETO FINAL):')
      console.debug(JSON.stringify(obraData, null, 2))
      
      console.debug('\n═══════════════════════════════════════════════════════════')
      console.debug('✅ FIM DO DEBUG - Dados prontos para envio')
      console.debug('═══════════════════════════════════════════════════════════\n')

      // 1. Fazer upload dos arquivos ART e Apólice (precisamos criar a obra primeiro)
      // Por enquanto, vamos criar a obra sem os arquivos e depois atualizar
      
      // Converter para formato do backend (sem arquivos ainda)
      const obraBackendData = converterObraFrontendParaBackend(obraData)
      // Remover arquivos do payload inicial (serão enviados depois)
      delete obraBackendData.art_arquivo
      delete obraBackendData.apolice_arquivo
      
      console.debug('\n🔄 10. DADOS CONVERTIDOS PARA BACKEND:')
      console.debug(JSON.stringify(obraBackendData, null, 2))
      console.debug('\n')
      
      // 2. Criar a obra
      const response = await obrasApi.criarObra(obraBackendData)
      
      if (!response.success || !response.data?.id) {
        throw new Error('Erro ao criar obra')
      }
      
      const obraId = response.data.id
      console.debug('\n✅ Obra criada com ID:', obraId)
      console.debug('📥 RESPOSTA DA API (criação da obra):')
      console.debug(JSON.stringify(response.data, null, 2))
      
      console.debug('\n🔍 DEBUG - Estado antes de salvar responsável e sinaleiros:')
      console.debug('  - responsavelTecnico:', JSON.stringify(responsavelTecnico, null, 2))
      console.debug('  - sinaleiros:', JSON.stringify(sinaleiros, null, 2))
      
      // 3. Fazer upload dos arquivos ART, Apólice e documentos adicionais
      let artArquivoUrl = ''
      let apoliceArquivoUrl = ''
      let cnoArquivoUrl = ''
      const uploadResultados: Record<string, { enviado: boolean; nome: string | null; url: string | null }> = {
        cno: { enviado: false, nome: cnoArquivo?.name || null, url: null },
        art: { enviado: false, nome: artArquivo?.name || null, url: null },
        apolice: { enviado: false, nome: apoliceArquivo?.name || null, url: null },
        manual_tecnico: { enviado: false, nome: manualTecnicoArquivo?.name || null, url: null },
        termo_entrega_tecnica: { enviado: false, nome: termoEntregaArquivo?.name || null, url: null },
        plano_carga: { enviado: false, nome: planoCargaArquivo?.name || null, url: null },
        aterramento: { enviado: false, nome: aterramentoArquivo?.name || null, url: null }
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      // Função auxiliar para fazer upload de arquivo
      const fazerUploadArquivo = async (arquivo: File, categoria: string): Promise<string> => {
        const formData = new FormData()
        formData.append('arquivo', arquivo)
        formData.append('categoria', categoria)
        
        const response = await fetch(`${apiUrl}/api/arquivos/upload/${obraId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          return result.data?.caminho || result.data?.arquivo || ''
        }
        return ''
      }
      
      try {
        // Upload CNO
        if (cnoArquivo) {
          cnoArquivoUrl = await fazerUploadArquivo(cnoArquivo, 'cno')
          uploadResultados.cno = { enviado: !!cnoArquivoUrl, nome: cnoArquivo.name, url: cnoArquivoUrl || null }
        }
        
        // Upload ART
        if (artArquivo) {
          artArquivoUrl = await fazerUploadArquivo(artArquivo, 'art')
          uploadResultados.art = { enviado: !!artArquivoUrl, nome: artArquivo.name, url: artArquivoUrl || null }
        }
        
        // Upload Apólice
        if (apoliceArquivo) {
          apoliceArquivoUrl = await fazerUploadArquivo(apoliceArquivo, 'apolice')
          uploadResultados.apolice = { enviado: !!apoliceArquivoUrl, nome: apoliceArquivo.name, url: apoliceArquivoUrl || null }
        }
        
        // Upload Manual Técnico
        if (manualTecnicoArquivo) {
          console.debug('📤 Fazendo upload do Manual Técnico...')
          const manualTecnicoUrl = await fazerUploadArquivo(manualTecnicoArquivo, 'manual_tecnico')
          uploadResultados.manual_tecnico = { enviado: !!manualTecnicoUrl, nome: manualTecnicoArquivo.name, url: manualTecnicoUrl || null }
          console.debug('✅ Manual Técnico enviado:', manualTecnicoUrl)
        }
        
        // Upload Termo de Entrega Técnica
        if (termoEntregaArquivo) {
          console.debug('📤 Fazendo upload do Termo de Entrega Técnica...')
          const termoEntregaUrl = await fazerUploadArquivo(termoEntregaArquivo, 'termo_entrega_tecnica')
          uploadResultados.termo_entrega_tecnica = { enviado: !!termoEntregaUrl, nome: termoEntregaArquivo.name, url: termoEntregaUrl || null }
          console.debug('✅ Termo de Entrega Técnica enviado:', termoEntregaUrl)
        }
        
        // Upload Plano de Carga
        if (planoCargaArquivo) {
          console.debug('📤 Fazendo upload do Plano de Carga...')
          const planoCargaUrl = await fazerUploadArquivo(planoCargaArquivo, 'plano_carga')
          uploadResultados.plano_carga = { enviado: !!planoCargaUrl, nome: planoCargaArquivo.name, url: planoCargaUrl || null }
          console.debug('✅ Plano de Carga enviado:', planoCargaUrl)
        }
        
        // Upload Aterramento
        if (aterramentoArquivo) {
          console.debug('📤 Fazendo upload do Aterramento...')
          const aterramentoUrl = await fazerUploadArquivo(aterramentoArquivo, 'aterramento')
          uploadResultados.aterramento = { enviado: !!aterramentoUrl, nome: aterramentoArquivo.name, url: aterramentoUrl || null }
          console.debug('✅ Aterramento enviado:', aterramentoUrl)
        }
        
        // 4. Atualizar documentos da obra (rota parcial, não exige demais campos)
        console.debug('\n📝 Atualizando documentos da obra...')
        const documentosUpdate = {
          cno,
          cno_arquivo: cnoArquivoUrl || undefined,
          art_numero: artNumero || undefined,
          art_arquivo: artArquivoUrl || undefined,
          apolice_numero: apoliceNumero || undefined,
          apolice_arquivo: apoliceArquivoUrl || undefined
        }
        console.debug('🧭 [Nova Obra] Snapshot de documentos enviados', {
          timestamp: new Date().toISOString(),
          obraId,
          uploadResultados,
          payloadAtualizacaoDocumentos: documentosUpdate
        })
        console.debug('📤 Dados de documentos para atualizar:', JSON.stringify(documentosUpdate, null, 2))
        const documentosResponse = await obrasApi.atualizarDocumentos(obraId, documentosUpdate)
        console.debug('✅ Documentos atualizados:', JSON.stringify(documentosResponse, null, 2))
      } catch (uploadError) {
        console.error('Erro ao fazer upload de arquivos:', uploadError)
        // Continuar mesmo com erro no upload - a obra já foi criada
      }
      
      // 5. Salvar responsável técnico (apenas se houver dados válidos)
      // IMPORTANTE: Fora do try/catch de upload para garantir que seja executado
      console.debug('🔍 DEBUG - Responsável técnico no estado:', responsavelTecnico)
      if (responsavelTecnico) {
        const temFuncionarioId = !!responsavelTecnico.funcionario_id
        const temDadosCompletos = !!(responsavelTecnico.nome && responsavelTecnico.cpf_cnpj)
        
        console.debug('🔍 DEBUG - Validação responsável:', { temFuncionarioId, temDadosCompletos })
        
        if (temFuncionarioId || temDadosCompletos) {
          try {
            // Se tiver funcionario_id, enviar apenas ele. Caso contrário, enviar os dados completos
            const payload = responsavelTecnico.funcionario_id
              ? { funcionario_id: responsavelTecnico.funcionario_id }
              : {
                  nome: responsavelTecnico.nome,
                  cpf_cnpj: responsavelTecnico.cpf_cnpj,
                  crea: responsavelTecnico.crea,
                  email: responsavelTecnico.email,
                  telefone: responsavelTecnico.telefone
                }
            console.debug('📤 Enviando responsável técnico:', payload)
            const response = await responsavelTecnicoApi.criarOuAtualizar(obraId, payload)
            console.debug('✅ Responsável técnico salvo:', response)
          } catch (error) {
            console.error('❌ Erro ao salvar responsável técnico:', error)
            toast({
              title: "Aviso",
              description: "Obra criada, mas houve erro ao salvar o responsável técnico. Você pode editá-lo depois.",
              variant: "destructive"
            })
          }
        } else {
          console.warn('⚠️ Responsável técnico não tem dados válidos para salvar')
        }
      } else {
        console.debug('⚠️ Nenhum responsável técnico no estado')
      }

      // 5.1. Salvar responsáveis técnicos IRBANA (equipamentos, manutenções, montagem e operação)
      const responsaveisIrbana = [
        { data: responsavelEquipamentos, tipo: 'irbana_equipamentos' },
        { data: responsavelManutencoes, tipo: 'irbana_manutencoes' },
        { data: responsavelMontagemOperacao, tipo: 'irbana_montagem_operacao' }
      ]

      for (const { data, tipo } of responsaveisIrbana) {
        if (data && data.nome) {
          try {
            const payload: any = {
              nome: data.nome,
              tipo: tipo
            }
            if (data.cpf_cnpj) payload.cpf_cnpj = data.cpf_cnpj
            if (data.crea) payload.crea = data.crea
            if (data.email) payload.email = data.email
            if (data.telefone) payload.telefone = data.telefone
            if (tipo === 'irbana_equipamentos' || tipo === 'irbana_manutencoes') {
              payload.crea_empresa = 'SP 2494244' // CREA da empresa IRBANA
            }

            console.debug(`📤 Enviando responsável técnico ${tipo}:`, payload)
            const response = await responsavelTecnicoApi.criarOuAtualizar(obraId, payload)
            console.debug(`✅ Responsável técnico ${tipo} salvo:`, response)
          } catch (error) {
            console.error(`❌ Erro ao salvar responsável técnico ${tipo}:`, error)
            toast({
              title: "Aviso",
              description: `Obra criada, mas houve erro ao salvar o responsável técnico ${tipo}. Você pode editá-lo depois.`,
              variant: "destructive"
            })
          }
        }
      }

      // 5.2. Salvar responsáveis técnicos adicionais dinâmicos
      if (responsaveisAdicionais && responsaveisAdicionais.length > 0) {
        const responsaveisValidos = responsaveisAdicionais.filter(rt => rt.nome && rt.cpf_cnpj)
        
        for (const responsavel of responsaveisValidos) {
          try {
            const payload: any = {
              nome: responsavel.nome,
              cpf_cnpj: responsavel.cpf_cnpj,
              tipo: 'adicional' // Tipo genérico para responsáveis adicionais
            }
            if (responsavel.crea) payload.crea = responsavel.crea
            if (responsavel.email) payload.email = responsavel.email
            if (responsavel.telefone) payload.telefone = responsavel.telefone
            // Incluir área no nome se fornecida (formato: "Nome - Área")
            if (responsavel.area) {
              payload.nome = `${responsavel.nome} - ${responsavel.area}`
            }

            console.debug(`📤 Enviando responsável técnico adicional:`, payload)
            const response = await responsavelTecnicoApi.criarOuAtualizar(obraId, payload)
            console.debug(`✅ Responsável técnico adicional salvo:`, response)
          } catch (error) {
            console.error(`❌ Erro ao salvar responsável técnico adicional:`, error)
            toast({
              title: "Aviso",
              description: `Obra criada, mas houve erro ao salvar um responsável técnico adicional. Você pode editá-lo depois.`,
              variant: "destructive"
            })
          }
        }
      }
      
      // 6. Salvar sinaleiros (apenas se houver dados válidos)
      // IMPORTANTE: Fora do try/catch de upload para garantir que seja executado
      // Buscar sinaleiros do estado atual (que foram preenchidos no formulário)
      // O componente SinaleirosForm mantém o estado local, precisamos obter os dados dele
      // Primeiro tentar obter do ref (estado mais atualizado), depois do estado
      console.debug('═══════════════════════════════════════════════════════════')
      console.debug('🚦 INICIANDO PROCESSAMENTO DE SINALEIROS')
      console.debug('═══════════════════════════════════════════════════════════')
      console.debug('🔍 DEBUG - Obra ID:', obraId)
      
      // Tentar obter sinaleiros do componente via ref (estado mais atualizado)
      let sinaleirosParaProcessar = sinaleiros
      console.debug('🔍 Tentando obter sinaleiros via ref...')
      console.debug('   - Estado atual:', sinaleiros.length)
      console.debug('   - Ref existe?', !!sinaleirosFormRef.current)
      
      if (sinaleirosFormRef.current) {
        try {
          const sinaleirosDoComponente = sinaleirosFormRef.current.getSinaleiros()
          console.debug('📥 Sinaleiros obtidos via ref:', sinaleirosDoComponente.length)
          console.debug('   - Dados:', JSON.stringify(sinaleirosDoComponente, null, 2))
          
          if (sinaleirosDoComponente && Array.isArray(sinaleirosDoComponente) && sinaleirosDoComponente.length > 0) {
            sinaleirosParaProcessar = sinaleirosDoComponente
            // Sincronizar com o estado também
            setSinaleiros(sinaleirosDoComponente)
            console.debug('✅ Usando sinaleiros do ref:', sinaleirosDoComponente.length)
          } else {
            console.debug('⚠️ Ref retornou array vazio ou inválido, usando estado')
          }
        } catch (error) {
          console.error('❌ Erro ao obter sinaleiros via ref:', error)
          console.debug('⚠️ Usando estado como fallback')
        }
      } else {
        console.debug('⚠️ Ref não disponível, usando estado')
        console.debug('   - Estado tem', sinaleiros.length, 'sinaleiros')
      }
      
      // Se ainda não temos sinaleiros, tentar forçar uma última sincronização
      if (sinaleirosParaProcessar.length === 0 && sinaleirosFormRef.current) {
        console.debug('🔄 Tentando forçar sincronização final...')
        try {
          const sinaleirosFinais = sinaleirosFormRef.current.getSinaleiros()
          if (sinaleirosFinais && sinaleirosFinais.length > 0) {
            sinaleirosParaProcessar = sinaleirosFinais
            setSinaleiros(sinaleirosFinais)
            console.debug('✅ Sincronização forçada bem-sucedida:', sinaleirosFinais.length)
          }
        } catch (error) {
          console.error('❌ Erro na sincronização forçada:', error)
        }
      }
      
      console.debug('🔍 DEBUG - Sinaleiros no estado:', sinaleirosParaProcessar)
      console.debug('🔍 DEBUG - Tipo de sinaleiros:', typeof sinaleirosParaProcessar)
      console.debug('🔍 DEBUG - É array?', Array.isArray(sinaleirosParaProcessar))
      console.debug('🔍 DEBUG - Length:', sinaleirosParaProcessar?.length || 0)
      console.debug('🔍 DEBUG - Conteúdo completo:', JSON.stringify(sinaleirosParaProcessar, null, 2))
      console.debug('🔍 DEBUG - Verificação detalhada:')
      if (Array.isArray(sinaleirosParaProcessar)) {
        sinaleirosParaProcessar.forEach((s, index) => {
          console.debug(`   - Sinaleiro ${index + 1}:`, {
            id: s?.id,
            nome: s?.nome,
            rg_cpf: s?.rg_cpf,
            tipo: s?.tipo,
            tipo_vinculo: s?.tipo_vinculo
          })
        })
      }
      
      if (!obraId) {
        console.error('❌ ERRO: obraId não está disponível! Não é possível salvar sinaleiros.')
        toast({
          title: "Erro",
          description: "ID da obra não disponível. Os sinaleiros não puderam ser salvos.",
          variant: "destructive"
        })
      } else if (sinaleirosParaProcessar && Array.isArray(sinaleirosParaProcessar) && sinaleirosParaProcessar.length > 0) {
        console.debug('✅ Condição passou: sinaleiros encontrados, processando...')
        // Filtrar apenas sinaleiros com dados válidos (nome e rg_cpf preenchidos)
        const sinaleirosValidos = sinaleirosParaProcessar.filter((s: any) => {
          const temNome = !!s.nome && s.nome.trim() !== ''
          
          // Verificar se tem documento válido (RG ou CPF)
          const documento = (s.rg_cpf || s.cpf || s.rg || '').trim()
          // Remover formatação e contar apenas dígitos
          const apenasDigitos = documento.replace(/\D/g, '')
          // RG deve ter pelo menos 7 dígitos, CPF deve ter 11
          const temDocumentoValido = apenasDigitos.length >= 7 && apenasDigitos.length <= 11
          
          const valido = temNome && temDocumentoValido
          if (!valido) {
            console.warn('⚠️ Sinaleiro inválido ignorado:', { 
              nome: s.nome, 
              rg_cpf: s.rg_cpf, 
              cpf: s.cpf, 
              rg: s.rg,
              motivo: !temNome ? 'Nome ausente' : `Documento inválido (${apenasDigitos.length} dígitos, mínimo 7)`
            })
          }
          return valido
        })
        
        console.debug('🔍 DEBUG - Sinaleiros válidos após filtro:', sinaleirosValidos.length)
        console.debug('🔍 DEBUG - Sinaleiros válidos:', JSON.stringify(sinaleirosValidos, null, 2))
        
        if (sinaleirosValidos.length > 0) {
          try {
            // Converter para o formato esperado pelo backend (remover IDs temporários)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            const sinaleirosParaEnviar = sinaleirosValidos.map((s: any) => {
              // Determinar tipo corretamente
              let tipo: 'principal' | 'reserva' = 'principal'
              if (s.tipo === 'principal' || s.tipo === 'reserva') {
                tipo = s.tipo
              } else if (s.tipo_vinculo === 'interno') {
                tipo = 'principal'
              } else if (s.tipo_vinculo === 'cliente') {
                tipo = 'reserva'
              }
              
              // Garantir que rg_cpf está válido antes de enviar
              const rgCpf = (s.rg_cpf || s.cpf || s.rg || '').trim()
              const apenasDigitos = rgCpf.replace(/\D/g, '')
              
              if (apenasDigitos.length < 7) {
                console.error(`❌ Sinaleiro "${s.nome}" tem documento inválido: ${rgCpf} (${apenasDigitos.length} dígitos)`)
                throw new Error(`O documento do sinaleiro "${s.nome}" está incompleto. RG deve ter pelo menos 7 dígitos e CPF deve ter 11 dígitos.`)
              }
              
              return {
                id: s.id && uuidRegex.test(s.id) ? s.id : undefined,
                nome: s.nome.trim(),
                rg_cpf: rgCpf,
                telefone: (s.telefone || '').trim(),
                email: (s.email || '').trim(),
                tipo: tipo
              }
            })
            console.debug('═══════════════════════════════════════════════════════════')
            console.debug('📤 CHAMANDO API PARA SALVAR SINALEIROS')
            console.debug('═══════════════════════════════════════════════════════════')
            console.debug('📤 Obra ID:', obraId)
            console.debug('📤 Quantidade de sinaleiros:', sinaleirosParaEnviar.length)
            console.debug('📤 Dados dos sinaleiros formatados:', JSON.stringify(sinaleirosParaEnviar, null, 2))
            console.debug('📤 URL da API:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/obras/${obraId}/sinaleiros`)
            
            let response: any = null
            try {
              console.debug('🔄 Iniciando chamada à API...')
              const startTime = Date.now()
              response = await sinaleirosApi.criarOuAtualizar(obraId, sinaleirosParaEnviar)
              const endTime = Date.now()
              console.debug(`✅ API chamada concluída em ${endTime - startTime}ms`)
              console.debug('✅ Resposta da API:', JSON.stringify(response, null, 2))
              
              if (!response.success) {
                console.error('❌ Erro ao salvar sinaleiros:', response.error)
                toast({
                  title: "Aviso",
                  description: `Erro ao salvar sinaleiros: ${response.error || 'Erro desconhecido'}`,
                  variant: "destructive"
                })
              } else {
                if (!response.data || response.data.length === 0) {
                  console.warn('⚠️ Nenhum sinaleiro foi retornado na resposta')
                  toast({
                    title: "Aviso",
                    description: "Sinaleiros foram enviados, mas nenhum foi retornado na resposta.",
                    variant: "default"
                  })
                } else {
                  console.debug(`✅ ${response.data.length} sinaleiro(s) salvo(s) com sucesso`)
                  toast({
                    title: "Sucesso",
                    description: `${response.data.length} sinaleiro(s) atrelado(s) à obra com sucesso.`,
                    variant: "default"
                  })
                }
              }
            } catch (error: any) {
              console.error('❌ Erro ao salvar sinaleiros:', error)
              toast({
                title: "Erro ao salvar sinaleiros",
                description: error.message || 'Erro desconhecido ao salvar sinaleiros',
                variant: "destructive"
              })
              // Não continuar com validação de documentos se houve erro ao salvar
              return
            }
            
            // Validar documentos completos para sinaleiros externos (clientes)
            // Conforme especificação: "CASO ESSE NÃO ESTEJA COM OS DOCUMENTOS COMPLETOS, O SISTEMA NÃO PERMITE ATRELAR A OBRA"
            if (response && response.success && response.data) {
              const sinaleirosSalvos = response.data
              const sinaleirosComDocumentosIncompletos: string[] = []
              
              // Validar documentos para cada sinaleiro externo (cliente)
              for (const sinaleiro of sinaleirosSalvos) {
                // Apenas validar sinaleiros externos (não internos)
                const sinaleiroOriginal = sinaleirosValidos.find(s => 
                  (s.id && s.id === sinaleiro.id) || 
                  (s.nome === sinaleiro.nome && (s.rg_cpf || s.cpf || s.rg) === sinaleiro.rg_cpf)
                )
                
                // Se for sinaleiro externo (cliente), validar documentos
                if (sinaleiroOriginal && sinaleiroOriginal.tipo_vinculo !== 'interno' && sinaleiro.id) {
                  try {
                    const validacao = await sinaleirosApi.validarDocumentosCompletos(sinaleiro.id)
                    
                    if (!validacao.completo) {
                      const documentosFaltando = validacao.documentosFaltando || []
                      const nomesDocumentos: Record<string, string> = {
                        'rg_frente': 'RG (Frente)',
                        'rg_verso': 'RG (Verso)',
                        'comprovante_vinculo': 'Comprovante de Vínculo'
                      }
                      const nomesFaltando = documentosFaltando.map(tipo => nomesDocumentos[tipo] || tipo).join(', ')
                      sinaleirosComDocumentosIncompletos.push(`${sinaleiro.nome} (faltando: ${nomesFaltando})`)
                    }
                  } catch (validacaoError: any) {
                    // Se a validação falhar, permitir continuar mas avisar
                    console.warn('Erro ao validar documentos do sinaleiro:', validacaoError)
                    toast({
                      title: "Aviso",
                      description: `Não foi possível validar os documentos do sinaleiro "${sinaleiro.nome}". Verifique se todos os documentos obrigatórios estão completos.`,
                      variant: "default"
                    })
                  }
                }
              }
              
              // Se houver sinaleiros com documentos incompletos, bloquear criação da obra
              if (sinaleirosComDocumentosIncompletos.length > 0) {
                const mensagemErro = `A obra foi criada, mas não é possível vincular os seguintes sinaleiros porque não possuem documentos completos:\n${sinaleirosComDocumentosIncompletos.join('\n')}\n\nATENÇÃO: Complete o cadastro dos sinaleiros pelo RH antes de vincular à obra. A obra foi criada mas os sinaleiros não foram vinculados.`
                
                toast({
                  title: "Erro - Documentos Incompletos",
                  description: mensagemErro,
                  variant: "destructive"
                })
                
                // Não lançar erro aqui para não reverter tudo, mas mostrar aviso claro
                // A obra foi criada mas os sinaleiros não foram vinculados corretamente
                setError(mensagemErro)
              }
            }
          } catch (error: any) {
            // Este catch captura erros na conversão/formatação dos dados
            console.error('❌ Erro ao salvar sinaleiros:', error)
            console.error('❌ Detalhes do erro:', {
              message: error?.message,
              error: error?.error,
              details: error?.details,
              obraId: obraId,
              sinaleirosEnviados: sinaleirosParaEnviar
            })
            toast({
              title: "Erro ao salvar sinaleiros",
              description: error.message || 'Erro desconhecido ao salvar sinaleiros',
              variant: "destructive"
            })
            
            toast({
              title: "Erro ao processar sinaleiros",
              description: error.message || 'Erro desconhecido ao processar sinaleiros',
              variant: "destructive"
            })
          }
        } else {
          console.debug('⚠️ Nenhum sinaleiro válido encontrado após filtro')
        }
      } else {
        console.debug('⚠️ Nenhum sinaleiro encontrado para salvar')
        console.debug('   - obraData.sinaleiros existe?', !!obraData.sinaleiros)
        console.debug('   - obraData.sinaleiros é array?', Array.isArray(obraData.sinaleiros))
        console.debug('   - obraData.sinaleiros.length:', obraData.sinaleiros?.length || 0)
        console.debug('   - sinaleiros (estado) existe?', !!sinaleiros)
        console.debug('   - sinaleiros (estado) é array?', Array.isArray(sinaleiros))
        console.debug('   - sinaleiros (estado).length:', sinaleiros?.length || 0)
      }
      
      console.debug('═══════════════════════════════════════════════════════════')
      console.debug('🚦 FIM DO PROCESSAMENTO DE SINALEIROS')
      console.debug('═══════════════════════════════════════════════════════════')
      
      // 7. Salvar responsáveis de obra (aprovadores de horas)
      if (responsaveisObra.length > 0) {
        console.debug(`📤 Salvando ${responsaveisObra.length} responsáveis de obra...`)
        for (const responsavel of responsaveisObra) {
          try {
            await responsaveisObraApi.criar(obraId, responsavel)
            console.debug(`✅ Responsável de obra salvo: ${responsavel.nome}`)
          } catch (error: any) {
            console.error(`❌ Erro ao salvar responsável de obra ${responsavel.nome}:`, error)
            toast({
              title: "Aviso",
              description: `Obra criada, mas houve erro ao salvar o responsável ${responsavel.nome}. Você pode adicioná-lo depois.`,
              variant: "destructive"
            })
          }
        }
      }
      
      toast({
        title: "Sucesso",
        description: "Obra criada com sucesso!"
      })
      // Resumo final de tudo que foi enviado e salvo
      console.debug('\n═══════════════════════════════════════════════════════════')
      console.debug('📊 RESUMO FINAL - TUDO QUE FOI ENVIADO E SALVO')
      console.debug('═══════════════════════════════════════════════════════════')
      console.debug(`✅ Obra criada com ID: ${obraId}`)
      console.debug(`✅ Nome da Obra: ${obraData.name}`)
      console.debug(`✅ Cliente ID: ${obraData.clienteId}`)
      console.debug(`✅ Gruas vinculadas: ${obraData.gruasSelecionadas.length}`)
      console.debug(`✅ Funcionários vinculados: ${obraData.funcionarios.length}`)
      console.debug(`✅ Sinaleiros cadastrados: ${sinaleiros.length}`)
      console.debug(`✅ Responsável técnico: ${responsavelTecnico ? 'Sim' : 'Não'}`)
      console.debug(`✅ Custos mensais: ${obraData.custos_mensais.length}`)
      console.debug(`✅ Documentos enviados:`)
      console.debug(`   - CNO: ${cno ? 'Sim' : 'Não'}`)
      console.debug(`   - ART: ${artNumero ? 'Sim' : 'Não'}`)
      console.debug(`   - Apólice: ${apoliceNumero ? 'Sim' : 'Não'}`)
      console.debug(`   - Manual Técnico: ${manualTecnicoArquivo ? 'Sim' : 'Não'}`)
      console.debug(`   - Termo Entrega: ${termoEntregaArquivo ? 'Sim' : 'Não'}`)
      console.debug(`   - Plano Carga: ${planoCargaArquivo ? 'Sim' : 'Não'}`)
      console.debug(`✅ Dados de montagem: ${Object.keys(dadosMontagemEquipamento).filter(k => dadosMontagemEquipamento[k as keyof typeof dadosMontagemEquipamento]).length} campos preenchidos`)
      console.debug('\n═══════════════════════════════════════════════════════════')
      console.debug('🎉 PROCESSO CONCLUÍDO COM SUCESSO!')
      console.debug('═══════════════════════════════════════════════════════════\n')
      
      router.push('/dashboard/obras')
    } catch (err) {
      console.error('Erro ao criar obra:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar obra')
      toast({
        title: "Erro",
        description: "Erro ao criar obra",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setObraFormData({
      name: '',
      description: '',
      status: 'Em Andamento',
      startDate: '',
      endDate: '',
      location: '',
      cidade: '',
      estado: 'SP',
      tipo: 'Residencial',
      clienteId: '',
      observations: '',
      // Campos adicionais
      cep: '',
      contato_obra: '',
      telefone_obra: '',
      email_obra: '',
      funcionarios: []
    })
    setCno('')
    setCnoArquivo(null)
    setArtNumero('')
    setArtArquivo(null)
    setApoliceNumero('')
    setApoliceArquivo(null)
    setManualTecnicoArquivo(null)
    setTermoEntregaArquivo(null)
    setPlanoCargaArquivo(null)
    setAterramentoArquivo(null)
    setResponsavelTecnico(null)
    setResponsaveisAdicionais([])
    setResponsavelEquipamentos({
      nome: 'ALEX MARCELO DA SILVA NASCIMENTO',
      cpf_cnpj: '',
      crea: '5071184591',
      email: '',
      telefone: ''
    })
    setResponsavelManutencoes({
      nome: 'NESTOR ALVAREZ GONZALEZ',
      cpf_cnpj: '',
      crea: '',
      email: '',
      telefone: '(11) 98818-5951'
    })
    setResponsavelMontagemOperacao({
      nome: 'ALEX MARCELO DA SILVA NASCIMENTO',
      cpf_cnpj: '',
      crea: '5071184591',
      email: '',
      telefone: ''
    })
    setSinaleiros([])
    setResponsaveisObra([])
    setGruasSelecionadas([])
    setFuncionariosSelecionados([])
    setClienteSelecionado(null)
    setCustosMensais([])
    setOrcamentoAprovado(null)
    setOrcamentoId(null)
    setDadosMontagemEquipamento({
      altura_final: '',
      raio_trabalho: '',
      tipo_base: '',
      capacidade_1_cabo: '',
      capacidade_2_cabos: '',
      potencia_instalada: '',
      voltagem: '',
      velocidade_rotacao: '',
      velocidade_elevacao: '',
      velocidade_translacao: '',
      tipo_ligacao: '',
      capacidade_ponta: '',
      observacoes_montagem: ''
    })
  }

  // Função para preencher todos os campos com dados de teste
  const preencherDadosTeste = () => {
    // Dados básicos da obra
    setObraFormData({
      name: 'Obra Residencial Teste - Jardim das Flores',
      description: 'Construção de edifício residencial com 20 andares, localizado no bairro Jardim das Flores. Projeto completo de arquitetura e engenharia.',
      status: 'Em Andamento',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano a partir de hoje
      location: 'Rua das Flores, 123 - Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      tipo: 'Residencial',
      clienteId: '',
      observations: 'Obra de teste para validação do sistema. Todos os campos foram preenchidos automaticamente.',
      // Campos adicionais
      cep: '01310-100',
      contato_obra: '',
      telefone_obra: '',
      email_obra: '',
      funcionarios: []
    })

    // Documentos
    setCno('12345678000190')
    setArtNumero('12345678901234567890')
    setApoliceNumero('AP-2025-001234')

    // Responsável técnico
    setResponsavelTecnico({
      funcionario_id: undefined,
      nome: 'Eng. Carlos Roberto Santos',
      cpf_cnpj: '12345678901',
      crea: 'SP-123456',
      email: 'carlos.santos@engenharia.com.br',
      telefone: '(11) 98765-4321'
    })

    // Sinaleiros - removidos dados mockados
    setSinaleiros([])

    // Grua de teste (simulada)
    const gruaTeste = {
      id: 'grua-teste-001',
      name: 'Grua Torre Teste 001',
      modelo: 'GT-500',
      fabricante: 'Liebherr',
      tipo: 'Grua Torre',
      capacidade: '5000 kg',
      valor_locacao: 15000,
      taxa_mensal: 2000,
      tipo_base: 'Chumbador',
      altura_inicial: 20,
      altura_final: 60,
      velocidade_giro: 0.8,
      velocidade_elevacao: 60,
      velocidade_translacao: 0,
      potencia_instalada: 25,
      voltagem: '380V',
      tipo_ligacao: 'Trifásica',
      capacidade_ponta: 2000,
      capacidade_maxima_raio: 5000,
      ano_fabricacao: 2020,
      vida_util: 10,
      valor_operador: 5000,
      valor_manutencao: 1500,
      valor_estaiamento: 3000,
      valor_chumbadores: 2000,
      valor_montagem: 8000,
      valor_desmontagem: 6000,
      valor_transporte: 4000,
      valor_hora_extra: 200,
      valor_seguro: 1000,
      valor_caucao: 50000,
      guindaste_montagem: 'Guindaste 50T',
      quantidade_viagens: 2,
      alojamento_alimentacao: 'Incluído',
      responsabilidade_acessorios: 'Cliente',
      prazo_validade: '12 meses',
      forma_pagamento: 'Boleto mensal',
      multa_atraso: 2,
      reajuste_indice: 'IPCA',
      garantia_caucao: 50000,
      retencao_contratual: 5
    }
    setGruasSelecionadas([gruaTeste])

    // Funcionário de teste (simulado)
    const funcionarioTeste = {
      id: 'func-teste-001',
      userId: 'user-teste-001',
      role: 'Operador de Grua',
      name: 'José da Silva',
      gruaId: 'grua-teste-001'
    }
    setFuncionariosSelecionados([funcionarioTeste])
    setObraFormData(prev => ({
      ...prev,
      funcionarios: [funcionarioTeste]
    }))

    // Responsável pela obra
    setObraFormData(prev => ({
      ...prev,
    }))

    // Valores de teste
    const custoTeste1 = {
      id: `cm_${Date.now()}_teste1`,
      obraId: '',
      item: '01.01',
      descricao: 'Locação de grua torre',
      unidade: 'mês',
      quantidadeOrcamento: 12,
      valorUnitario: 15000,
      totalOrcamento: 180000,
      mes: new Date().toISOString().slice(0, 7), // YYYY-MM
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: 12,
      valorSaldo: 180000,
      tipo: 'contrato' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const custoTeste2 = {
      id: `cm_${Date.now() + 1}_teste2`,
      obraId: '',
      item: '01.02',
      descricao: 'Operador de grua',
      unidade: 'mês',
      quantidadeOrcamento: 12,
      valorUnitario: 5000,
      totalOrcamento: 60000,
      mes: new Date().toISOString().slice(0, 7),
      quantidadeRealizada: 0,
      valorRealizado: 0,
      quantidadeAcumulada: 0,
      valorAcumulado: 0,
      quantidadeSaldo: 12,
      valorSaldo: 60000,
      tipo: 'contrato' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCustosMensais([custoTeste1, custoTeste2] as any)

    // Dados de Montagem do Equipamento
    setDadosMontagemEquipamento({
      altura_final: '60',
      raio_trabalho: '50',
      tipo_base: 'Chumbador',
      capacidade_1_cabo: '5000',
      capacidade_2_cabos: '10000',
      capacidade_ponta: '2000',
      potencia_instalada: '25',
      voltagem: '380V',
      tipo_ligacao: 'Trifásica',
      velocidade_rotacao: '0.8',
      velocidade_elevacao: '60',
      velocidade_translacao: '0',
      observacoes_montagem: 'Equipamento instalado conforme especificações técnicas. Altura final de 60 metros com base tipo chumbador.'
    })

    // Responsáveis Técnicos IRBANA
    setResponsaveisAdicionais([])
    setResponsavelEquipamentos({
      nome: 'ALEX MARCELO DA SILVA NASCIMENTO',
      cpf_cnpj: '12345678901',
      crea: '5071184591',
      email: 'alex.nascimento@irbana.com.br',
      telefone: '(11) 98765-4321'
    })

    setResponsavelManutencoes({
      nome: 'NESTOR ALVAREZ GONZALEZ',
      cpf_cnpj: '98765432100',
      crea: '123456789',
      email: 'nestor.gonzalez@irbana.com.br',
      telefone: '(11) 98818-5951'
    })
  }

  // Função para preencher apenas os Parâmetros Técnicos de todas as gruas selecionadas
  const preencherParametrosTecnicos = () => {
    if (gruasSelecionadas.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma grua antes de preencher os parâmetros técnicos.",
        variant: "destructive"
      })
      return
    }

    const dadosParametrosTecnicos = {
      tipo_base: 'chumbador',
      altura_inicial: 20,
      altura_final: 60,
      raio_trabalho: 50,
      velocidade_giro: 0.8,
      velocidade_elevacao: 60,
      velocidade_translacao: 0,
      potencia_instalada: 25,
      voltagem: '380',
      tipo_ligacao: 'trifasica',
      capacidade_ponta: 2000,
      capacidade_maxima_raio: 5000,
      ano_fabricacao: 2020,
      vida_util: 10
    }

    const gruasAtualizadas = gruasSelecionadas.map(grua => ({
      ...grua,
      ...dadosParametrosTecnicos
    }))

    setGruasSelecionadas(gruasAtualizadas)

    toast({
      title: "Sucesso",
      description: `Parâmetros técnicos preenchidos para ${gruasSelecionadas.length} grua(s).`,
      variant: "default"
    })
  }

  // Função para preencher apenas os Serviços e Logística de todas as gruas selecionadas
  const preencherServicosLogistica = () => {
    if (gruasSelecionadas.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos uma grua antes de preencher os serviços e logística.",
        variant: "destructive"
      })
      return
    }

    const dadosServicosLogistica = {
      guindaste_montagem: 'incluso',
      quantidade_viagens: 2,
      alojamento_alimentacao: 'incluso',
      responsabilidade_acessorios: 'Estropos, caçambas, garfos, baldes fornecidos por conta do cliente'
    }

    const gruasAtualizadas = gruasSelecionadas.map(grua => ({
      ...grua,
      ...dadosServicosLogistica
    }))

    setGruasSelecionadas(gruasAtualizadas)

    toast({
      title: "Sucesso",
      description: `Serviços e logística preenchidos para ${gruasSelecionadas.length} grua(s).`,
      variant: "default"
    })
  }

  // Função para preencher Parâmetros Técnicos de uma grua específica
  const preencherParametrosTecnicosGrua = (gruaId: string) => {
    const dadosParametrosTecnicos = {
      tipo_base: 'chumbador',
      altura_inicial: 20,
      altura_final: 60,
      raio_trabalho: 50,
      velocidade_giro: 0.8,
      velocidade_elevacao: 60,
      velocidade_translacao: 0,
      potencia_instalada: 25,
      voltagem: '380',
      tipo_ligacao: 'trifasica',
      capacidade_ponta: 2000,
      capacidade_maxima_raio: 5000,
      ano_fabricacao: 2020,
      vida_util: 10
    }

    const gruasAtualizadas = gruasSelecionadas.map(grua => 
      grua.id === gruaId ? { ...grua, ...dadosParametrosTecnicos } : grua
    )

    setGruasSelecionadas(gruasAtualizadas)

    toast({
      title: "Sucesso",
      description: "Parâmetros técnicos preenchidos para esta grua.",
      variant: "default"
    })
  }

  // Função para preencher Serviços e Logística de uma grua específica
  const preencherServicosLogisticaGrua = (gruaId: string) => {
    const dadosServicosLogistica = {
      guindaste_montagem: 'incluso',
      quantidade_viagens: 2,
      alojamento_alimentacao: 'incluso',
      responsabilidade_acessorios: 'Estropos, caçambas, garfos, baldes fornecidos por conta do cliente'
    }

    const gruasAtualizadas = gruasSelecionadas.map(grua => 
      grua.id === gruaId ? { ...grua, ...dadosServicosLogistica } : grua
    )

    setGruasSelecionadas(gruasAtualizadas)

    toast({
      title: "Sucesso",
      description: "Serviços e logística preenchidos para esta grua.",
      variant: "default"
    })
  }

  // Função para preencher todos os dados de uma grua específica
  const preencherTodosDadosGrua = (gruaId: string) => {
    const dadosCompletos = {
      tipo_base: 'chumbador',
      altura_inicial: 20,
      altura_final: 60,
      raio_trabalho: 50,
      velocidade_giro: 0.8,
      velocidade_elevacao: 60,
      velocidade_translacao: 0,
      potencia_instalada: 25,
      voltagem: '380',
      tipo_ligacao: 'trifasica',
      capacidade_ponta: 2000,
      capacidade_maxima_raio: 5000,
      ano_fabricacao: 2020,
      vida_util: 10,
      guindaste_montagem: 'incluso',
      quantidade_viagens: 2,
      alojamento_alimentacao: 'incluso',
      responsabilidade_acessorios: 'Estropos, caçambas, garfos, baldes fornecidos por conta do cliente'
    }

    const gruasAtualizadas = gruasSelecionadas.map(grua => 
      grua.id === gruaId ? { ...grua, ...dadosCompletos } : grua
    )

    setGruasSelecionadas(gruasAtualizadas)

    toast({
      title: "Sucesso",
      description: "Todos os dados preenchidos para esta grua.",
      variant: "default"
    })
  }

  return (
    <div className="space-y-6 w-full relative">
      {/* Loading Overlay */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Criando Obra...</h3>
              <p className="text-sm text-gray-600">
                Por favor, aguarde enquanto processamos os dados e fazemos o upload dos arquivos.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Não feche esta página ou navegue para outra aba.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/dashboard/obras')}
              className="text-gray-600 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Obra</h1>
          <p className="text-gray-600">Crie uma nova obra com grua e funcionários</p>
        </div>
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

      {/* Formulário */}
      <form onSubmit={handleCreateObra} className="">
        <Tabs defaultValue="obra" className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-1">
            <TabsTrigger value="obra" className="px-4">Dados da Obra</TabsTrigger>
            <TabsTrigger value="documentos" className="px-4">Documentos</TabsTrigger>
            <TabsTrigger value="responsavel-tecnico" className="px-4">Responsável Técnico</TabsTrigger>
            <TabsTrigger value="grua" className="px-4">Grua</TabsTrigger>
            <TabsTrigger value="funcionarios" className="px-4">Funcionários</TabsTrigger>
          </TabsList>

          {/* Aba: Dados da Obra */}
          <TabsContent value="obra" className="space-y-4" forceMount>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Informações da Obra
                </CardTitle>
                <CardDescription>
                  Preencha os dados básicos da obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-2 lg:col-span-2">
                    <Label htmlFor="name">Nome da Obra *</Label>
                    <Input
                      id="name"
                      value={obraFormData.name}
                      onChange={(e) => setObraFormData({ ...obraFormData, name: e.target.value })}
                      placeholder="Ex: Obra Residencial Jardim das Flores"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={obraFormData.status} onValueChange={(value) => setObraFormData({ ...obraFormData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Suspensa">Suspensa</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Obra *</Label>
                    <Select value={obraFormData.tipo} onValueChange={(value) => setObraFormData({ ...obraFormData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residencial">Residencial</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={obraFormData.startDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={obraFormData.endDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, endDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Select value={obraFormData.estado} onValueChange={(value) => setObraFormData({ ...obraFormData, estado: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">AC</SelectItem>
                        <SelectItem value="AL">AL</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="DF">DF</SelectItem>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="MA">MA</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="MS">MS</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                        <SelectItem value="PB">PB</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="PE">PE</SelectItem>
                        <SelectItem value="PI">PI</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                        <SelectItem value="RO">RO</SelectItem>
                        <SelectItem value="RR">RR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="SE">SE</SelectItem>
                        <SelectItem value="TO">TO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={obraFormData.cidade}
                      onChange={(e) => setObraFormData({ ...obraFormData, cidade: e.target.value })}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Endereço *</Label>
                    <Input
                      id="location"
                      value={obraFormData.location}
                      onChange={(e) => setObraFormData({ ...obraFormData, location: e.target.value })}
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={obraFormData.description}
                    onChange={(e) => setObraFormData({ ...obraFormData, description: e.target.value })}
                    placeholder="Descrição detalhada da obra..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="clienteSearch">Cliente *</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1">
                      <ClienteSearch
                        onClienteSelect={handleClienteSelect}
                        placeholder="Buscar cliente por nome ou CNPJ..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsClienteModalOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {clienteSelecionado && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{clienteSelecionado.name}</p>
                          <p className="text-sm text-green-700">{clienteSelecionado.cnpj}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou CNPJ do cliente para buscar
                  </p>
                </div>

                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={obraFormData.observations}
                    onChange={(e) => setObraFormData({ ...obraFormData, observations: e.target.value })}
                    placeholder="Observações adicionais sobre a obra..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Documentos */}
          <TabsContent value="documentos" className="space-y-4" forceMount>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documentos Obrigatórios da Obra
                </CardTitle>
                <CardDescription>
                  Preencha os documentos obrigatórios para a obra
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0" style={{ padding: '0px !important' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda */}
                  <div className="space-y-6">
                    {/* CNO */}
                    <div className="space-y-2">
                      <CnoInput
                        value={cno}
                        onChange={setCno}
                        label="CNO da Obra (CNPJ/Documento) *"
                        required={true}
                      />
                      <p className="text-xs text-gray-500">
                        Documento identificador da obra
                      </p>
                    </div>

                    {/* Número da ART */}
                    <div className="space-y-2">
                      <Label>
                        Número da ART <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={artNumero}
                        onChange={(e) => setArtNumero(e.target.value)}
                        placeholder="Número da Anotação de Responsabilidade Técnica"
                      />
                    </div>

                    {/* Número da Apólice */}
                    <div className="space-y-2">
                      <Label>
                        Número da Apólice de Seguro <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={apoliceNumero}
                        onChange={(e) => setApoliceNumero(e.target.value)}
                        placeholder="Número da apólice de seguro"
                      />
                    </div>
                  </div>

                  {/* Coluna Direita - Uploads */}
                  <div className="space-y-6">
                    {/* Upload ART */}
                    <div className="space-y-2">
                      <DocumentoUpload
                        label="Upload do Documento ART (PDF) *"
                        accept="application/pdf"
                        maxSize={5 * 1024 * 1024}
                        required={true}
                        onUpload={(file) => setArtArquivo(file)}
                        onRemove={() => setArtArquivo(null)}
                        currentFile={artArquivo}
                      />
                    </div>

                    {/* Upload Apólice */}
                    <div className="space-y-2">
                      <DocumentoUpload
                        label="Upload da Apólice de Seguro (PDF) *"
                        accept="application/pdf"
                        maxSize={5 * 1024 * 1024}
                        required={true}
                        onUpload={(file) => setApoliceArquivo(file)}
                        onRemove={() => setApoliceArquivo(null)}
                        currentFile={apoliceArquivo}
                      />
                    </div>

                    {/* Upload CNO */}
                    <div className="space-y-2">
                      <DocumentoUpload
                        label="Upload do Documento CNO (PDF)"
                        accept="application/pdf"
                        maxSize={5 * 1024 * 1024}
                        required={false}
                        onUpload={(file) => setCnoArquivo(file)}
                        onRemove={() => setCnoArquivo(null)}
                        currentFile={cnoArquivo}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Documentos Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documentos Adicionais do Equipamento
                </CardTitle>
                <CardDescription>
                  Documentos técnicos e de entrega do equipamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Manual Técnico */}
                  <div className="space-y-2">
                    <Label>Manual Técnico do Equipamento</Label>
                    <DocumentoUpload
                      label="Upload do Manual Técnico (PDF)"
                      accept="application/pdf"
                      maxSize={10 * 1024 * 1024}
                      required={false}
                      onUpload={(file) => setManualTecnicoArquivo(file)}
                      onRemove={() => setManualTecnicoArquivo(null)}
                      currentFile={manualTecnicoArquivo}
                    />
                    <p className="text-xs text-gray-500">
                      Manual técnico do equipamento fornecido pelo fabricante
                    </p>
                  </div>

                  {/* Termo de Entrega Técnica */}
                  <div className="space-y-2">
                    <Label>Termo de Entrega Técnica</Label>
                    <DocumentoUpload
                      label="Upload do Termo de Entrega Técnica (PDF)"
                      accept="application/pdf"
                      maxSize={5 * 1024 * 1024}
                      required={false}
                      onUpload={(file) => setTermoEntregaArquivo(file)}
                      onRemove={() => setTermoEntregaArquivo(null)}
                      currentFile={termoEntregaArquivo}
                    />
                    <p className="text-xs text-gray-500">
                      Documento de entrega técnica do equipamento
                    </p>
                  </div>

                  {/* Plano de Carga */}
                  <div className="space-y-2">
                    <Label>Plano de Carga</Label>
                    <DocumentoUpload
                      label="Upload do Plano de Carga (PDF)"
                      accept="application/pdf,image/*"
                      maxSize={5 * 1024 * 1024}
                      required={false}
                      onUpload={(file) => setPlanoCargaArquivo(file)}
                      onRemove={() => setPlanoCargaArquivo(null)}
                      currentFile={planoCargaArquivo}
                    />
                    <p className="text-xs text-gray-500">
                      Plano de carga do equipamento
                    </p>
                  </div>

                  {/* Aterramento */}
                  <div className="space-y-2">
                    <Label>Documento de Aterramento</Label>
                    <DocumentoUpload
                      label="Upload do Documento de Aterramento (PDF)"
                      accept="application/pdf,image/*"
                      maxSize={5 * 1024 * 1024}
                      required={false}
                      onUpload={(file) => setAterramentoArquivo(file)}
                      onRemove={() => setAterramentoArquivo(null)}
                      currentFile={aterramentoArquivo}
                    />
                    <p className="text-xs text-gray-500">
                      Certificado ou documento de aterramento do equipamento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Responsável Técnico */}
          <TabsContent value="responsavel-tecnico" className="space-y-4" forceMount>
            {/* Responsável da Obra (Cliente) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Responsável Técnico da Obra (Cliente)
                </CardTitle>
                <CardDescription>
                  Cadastre o responsável técnico pela obra do cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsavelTecnicoForm
                  responsavel={responsavelTecnico}
                  onSave={(data) => {
                    console.log('💾 Salvando responsável técnico da obra no estado:', data)
                    setResponsavelTecnico(data)
                    toast({
                      title: "Sucesso",
                      description: "Responsável técnico da obra salvo com sucesso"
                    })
                  }}
                  onRemove={() => {
                    setResponsavelTecnico(null)
                    toast({
                      title: "Removido",
                      description: "Responsável técnico removido"
                    })
                  }}
                />
              </CardContent>
            </Card>

            {/* Responsáveis Técnicos IRBANA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Responsáveis Técnicos IRBANA
                </CardTitle>
                <CardDescription>
                  Responsáveis técnicos da empresa IRBANA para diferentes áreas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* RESP PELOS EQUIP */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Responsável pelos Equipamentos</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Responsável Técnico</Label>
                      <Input
                        value={responsavelEquipamentos.nome}
                        onChange={(e) => setResponsavelEquipamentos({ ...responsavelEquipamentos, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label>N° do CREA</Label>
                      <Input
                        value={responsavelEquipamentos.crea}
                        onChange={(e) => setResponsavelEquipamentos({ ...responsavelEquipamentos, crea: e.target.value })}
                        placeholder="Ex: 5071184591"
                      />
                    </div>
                    <div>
                      <Label>N° do CREA da Empresa</Label>
                      <Input
                        value="SP 2494244"
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">CREA da empresa IRBANA</p>
                    </div>
                  </div>
                </div>

                {/* RESP PELAS MANUTEN */}
                <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-green-900">Responsável pelas Manutenções</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Responsável Técnico</Label>
                      <Input
                        value={responsavelManutencoes.nome}
                        onChange={(e) => setResponsavelManutencoes({ ...responsavelManutencoes, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={responsavelManutencoes.telefone}
                        onChange={(e) => setResponsavelManutencoes({ ...responsavelManutencoes, telefone: e.target.value })}
                        placeholder="Ex: (11) 98818-5951"
                      />
                    </div>
                    <div>
                      <Label>N° do CREA da Empresa</Label>
                      <Input
                        value="SP 2494244"
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">CREA da empresa IRBANA</p>
                    </div>
                  </div>
                </div>

                {/* RESP PELA MONTG E OPER */}
                <div className="space-y-4 p-4 border rounded-lg bg-purple-50/50">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Responsável pela Montagem e Operação</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Responsável Técnico</Label>
                      <Input
                        value={responsavelMontagemOperacao.nome}
                        onChange={(e) => setResponsavelMontagemOperacao({ ...responsavelMontagemOperacao, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label>N° do CREA</Label>
                      <Input
                        value={responsavelMontagemOperacao.crea}
                        onChange={(e) => setResponsavelMontagemOperacao({ ...responsavelMontagemOperacao, crea: e.target.value })}
                        placeholder="Ex: 5071184591"
                      />
                    </div>
                  </div>
                </div>

                {/* Responsáveis Técnicos Adicionais Dinâmicos */}
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Responsáveis Técnicos Adicionais</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setResponsaveisAdicionais([
                          ...responsaveisAdicionais,
                          {
                            nome: '',
                            cpf_cnpj: '',
                            crea: '',
                            email: '',
                            telefone: '',
                            area: '',
                            tipo: 'adicional'
                          }
                        ])
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Responsável
                    </Button>
                  </div>

                  {responsaveisAdicionais.map((responsavel, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Responsável Técnico #{index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setResponsaveisAdicionais(responsaveisAdicionais.filter((_, i) => i !== index))
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Área de Responsabilidade</Label>
                          <Input
                            value={responsavel.area || ''}
                            onChange={(e) => {
                              const novos = [...responsaveisAdicionais]
                              novos[index].area = e.target.value
                              setResponsaveisAdicionais(novos)
                            }}
                            placeholder="Ex: Segurança, Qualidade, etc."
                          />
                        </div>
                        <div>
                          <Label>Nome do Responsável Técnico <span className="text-red-500">*</span></Label>
                          <Input
                            value={responsavel.nome}
                            onChange={(e) => {
                              const novos = [...responsaveisAdicionais]
                              novos[index].nome = e.target.value
                              setResponsaveisAdicionais(novos)
                            }}
                            placeholder="Nome completo"
                          />
                        </div>
                        <div>
                          <Label>CPF/CNPJ <span className="text-red-500">*</span></Label>
                          <Input
                            value={responsavel.cpf_cnpj}
                            onChange={(e) => {
                              const novos = [...responsaveisAdicionais]
                              novos[index].cpf_cnpj = e.target.value
                              setResponsaveisAdicionais(novos)
                            }}
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          />
                        </div>
                        <div>
                          <Label>N° do CREA</Label>
                          <Input
                            value={responsavel.crea || ''}
                            onChange={(e) => {
                              const novos = [...responsaveisAdicionais]
                              novos[index].crea = e.target.value
                              setResponsaveisAdicionais(novos)
                            }}
                            placeholder="Ex: 5071184591"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={responsavel.email}
                            onChange={(e) => {
                              const novos = [...responsaveisAdicionais]
                              novos[index].email = e.target.value
                              setResponsaveisAdicionais(novos)
                            }}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <Label>Telefone</Label>
                          <Input
                            value={responsavel.telefone}
                            onChange={(e) => {
                              const novos = [...responsaveisAdicionais]
                              novos[index].telefone = e.target.value
                              setResponsaveisAdicionais(novos)
                            }}
                            placeholder="(11) 98765-4321"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {responsaveisAdicionais.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum responsável técnico adicional adicionado. Clique em "Adicionar Responsável" para adicionar.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Gruas */}
          <TabsContent value="grua" className="space-y-4" forceMount>
            {/* Seção: Dados de Montagem do Equipamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Dados de Montagem do Equipamento
                </CardTitle>
                <CardDescription>
                  Configure a configuração da grua contratada pelo cliente (90% das vezes não vêm com os tamanhos originais)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Importante:</strong> Preencha os dados da configuração real da grua contratada pelo cliente, pois geralmente diferem dos tamanhos originais do equipamento.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="altura_final">Altura Final (m)</Label>
                    <Input
                      id="altura_final"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.altura_final}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, altura_final: e.target.value })}
                      placeholder="Ex: 45.50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo_base">Tipo de Base</Label>
                    <Select 
                      value={dadosMontagemEquipamento.tipo_base} 
                      onValueChange={(value) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, tipo_base: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de base" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chumbador">Chumbador</SelectItem>
                        <SelectItem value="Roda">Roda</SelectItem>
                        <SelectItem value="Carrinho">Carrinho</SelectItem>
                        <SelectItem value="Fixação Direta">Fixação Direta</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="raio_trabalho">Raio de Trabalho (m)</Label>
                    <Input
                      id="raio_trabalho"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.raio_trabalho}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, raio_trabalho: e.target.value })}
                      placeholder="Ex: 50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Determina o tamanho da lança</p>
                  </div>

                  <div>
                    <Label htmlFor="capacidade_1_cabo">Capacidade com 2 Cabos (kg)</Label>
                    <Input
                      id="capacidade_1_cabo"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.capacidade_1_cabo}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, capacidade_1_cabo: e.target.value })}
                      placeholder="Ex: 8000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacidade_2_cabos">Capacidade com 4 Cabos (kg)</Label>
                    <Input
                      id="capacidade_2_cabos"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.capacidade_2_cabos}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, capacidade_2_cabos: e.target.value })}
                      placeholder="Ex: 16000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacidade_ponta">Capacidade na Ponta (kg)</Label>
                    <Input
                      id="capacidade_ponta"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.capacidade_ponta}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, capacidade_ponta: e.target.value })}
                      placeholder="Ex: 2000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="potencia_instalada">Potência Instalada (kVA)</Label>
                    <Input
                      id="potencia_instalada"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.potencia_instalada}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, potencia_instalada: e.target.value })}
                      placeholder="Ex: 30.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="voltagem">Voltagem (V)</Label>
                    <Select 
                      value={dadosMontagemEquipamento.voltagem} 
                      onValueChange={(value) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, voltagem: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a voltagem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="220">220V</SelectItem>
                        <SelectItem value="380">380V</SelectItem>
                        <SelectItem value="440">440V</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo_ligacao">Tipo de Ligação</Label>
                    <Select 
                      value={dadosMontagemEquipamento.tipo_ligacao} 
                      onValueChange={(value) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, tipo_ligacao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trifásica">Trifásica</SelectItem>
                        <SelectItem value="Monofásica">Monofásica</SelectItem>
                        <SelectItem value="Bifásica">Bifásica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="velocidade_rotacao">Velocidade de Rotação (rpm)</Label>
                    <Input
                      id="velocidade_rotacao"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.velocidade_rotacao}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, velocidade_rotacao: e.target.value })}
                      placeholder="Ex: 0.8"
                    />
                  </div>

                  <div>
                    <Label htmlFor="velocidade_elevacao">Velocidade de Elevação (m/min)</Label>
                    <Input
                      id="velocidade_elevacao"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.velocidade_elevacao}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, velocidade_elevacao: e.target.value })}
                      placeholder="Ex: 40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="velocidade_translacao">Velocidade de Translação (m/min)</Label>
                    <Input
                      id="velocidade_translacao"
                      type="number"
                      step="0.01"
                      value={dadosMontagemEquipamento.velocidade_translacao}
                      onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, velocidade_translacao: e.target.value })}
                      placeholder="Ex: 25"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes_montagem">Observações sobre a Montagem</Label>
                  <Textarea
                    id="observacoes_montagem"
                    value={dadosMontagemEquipamento.observacoes_montagem}
                    onChange={(e) => setDadosMontagemEquipamento({ ...dadosMontagemEquipamento, observacoes_montagem: e.target.value })}
                    placeholder="Observações sobre a configuração específica da grua contratada..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crane className="w-5 h-5 text-blue-600" />
                  Gruas para a Obra
                </CardTitle>
                <CardDescription>
                  Selecione uma ou mais gruas que serão utilizadas nesta obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gruaSearch">Buscar Grua</Label>
                  <GruaSearch
                    onGruaSelect={handleGruaSelect}
                    placeholder="Buscar grua por nome ou modelo..."
                    className="mt-1"
                    onlyAvailable={false}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou modelo da grua para buscar
                  </p>
                </div>

                {/* Lista de gruas selecionadas */}
                {gruasSelecionadas.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Gruas Selecionadas ({gruasSelecionadas.length})</h4>
                    <Accordion type="multiple" className="space-y-3">
                      {gruasSelecionadas.map((grua) => (
                        <AccordionItem key={grua.id} value={grua.id} className="border rounded-lg bg-blue-50 px-4">
                          <div className="flex items-center gap-2 py-3">
                            <Crane className="w-5 h-5 text-blue-600" />
                            <AccordionTrigger className="flex-1 hover:no-underline">
                              <div className="flex-1 text-left">
                                <p className="font-medium text-blue-900">{grua.name}</p>
                                <p className="text-sm text-blue-700">{grua.model} - {grua.capacity}</p>
                              </div>
                            </AccordionTrigger>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeGruaSelecionada(grua.id)
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <AccordionContent>
                            <div className="space-y-4 pb-4">
                              {/* Botão para preencher todos os dados desta grua */}
                              <div className="flex justify-end mb-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => preencherTodosDadosGrua(grua.id)}
                                  disabled={creating}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                                  title="Preencher todos os campos desta grua com dados de teste"
                                >
                                  <Zap className="w-3 h-3 mr-1" />
                                  Preencher Todos os Dados desta Grua
                                </Button>
                              </div>
                              
                              {/* Seção: Parâmetros Técnicos */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <CardTitle className="text-base flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Parâmetros Técnicos
                                      </CardTitle>
                                      <CardDescription className="text-xs text-gray-500 mt-1">
                                        Os dados técnicos devem ser definidos no orçamento. Estes campos são apenas para ajustes finais se necessário.
                                      </CardDescription>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={preencherParametrosTecnicos}
                                      disabled={creating || gruasSelecionadas.length === 0}
                                      className="shrink-0"
                                      title="Preencher todos os campos de Parâmetros Técnicos com dados de teste"
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Preencher
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                      <Label htmlFor={`tipoBase-${grua.id}`}>Tipo de Base</Label>
                                      <Select 
                                        value={grua.tipo_base || ''} 
                                        onValueChange={(value) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, tipo_base: value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="chumbador">Chumbador</SelectItem>
                                          <SelectItem value="trilho">Trilho</SelectItem>
                                          <SelectItem value="cruzeta">Cruzeta</SelectItem>
                                          <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`alturaInicial-${grua.id}`}>Altura Inicial (m)</Label>
                                      <Input
                                        id={`alturaInicial-${grua.id}`}
                                        type="number"
                                        step="0.01"
                                        value={grua.altura_inicial || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, altura_inicial: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`alturaFinal-${grua.id}`}>Altura Final (m)</Label>
                                      <Input
                                        id={`alturaFinal-${grua.id}`}
                                        type="number"
                                        step="0.01"
                                        value={grua.altura_final || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, altura_final: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`velocidadeGiro-${grua.id}`}>Velocidade de Giro (rpm)</Label>
                                      <Input
                                        id={`velocidadeGiro-${grua.id}`}
                                        type="number"
                                        step="0.1"
                                        value={grua.velocidade_giro || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, velocidade_giro: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`velocidadeElevacao-${grua.id}`}>Velocidade de Elevação (m/min)</Label>
                                      <Input
                                        id={`velocidadeElevacao-${grua.id}`}
                                        type="number"
                                        step="0.1"
                                        value={grua.velocidade_elevacao || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, velocidade_elevacao: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`velocidadeTranslacao-${grua.id}`}>Velocidade de Translação (m/min)</Label>
                                      <Input
                                        id={`velocidadeTranslacao-${grua.id}`}
                                        type="number"
                                        step="0.1"
                                        value={grua.velocidade_translacao || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, velocidade_translacao: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`potenciaInstalada-${grua.id}`}>Potência Instalada (kVA)</Label>
                                      <Input
                                        id={`potenciaInstalada-${grua.id}`}
                                        type="number"
                                        step="0.1"
                                        value={grua.potencia_instalada || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, potencia_instalada: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`voltagem-${grua.id}`}>Voltagem (V)</Label>
                                      <Select 
                                        value={grua.voltagem || ''} 
                                        onValueChange={(value) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, voltagem: value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="220">220V</SelectItem>
                                          <SelectItem value="380">380V</SelectItem>
                                          <SelectItem value="440">440V</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`tipoLigacao-${grua.id}`}>Tipo de Ligação Elétrica</Label>
                                      <Select 
                                        value={grua.tipo_ligacao || ''} 
                                        onValueChange={(value) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, tipo_ligacao: value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="monofasica">Monofásica</SelectItem>
                                          <SelectItem value="trifasica">Trifásica</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`capacidadePonta-${grua.id}`}>Capacidade na Ponta (kg)</Label>
                                      <Input
                                        id={`capacidadePonta-${grua.id}`}
                                        type="number"
                                        value={grua.capacidade_ponta || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, capacidade_ponta: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`capacidadeMaximaRaio-${grua.id}`}>Capacidade Máx. por Raio (kg)</Label>
                                      <Input
                                        id={`capacidadeMaximaRaio-${grua.id}`}
                                        type="number"
                                        value={grua.capacidade_maxima_raio || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, capacidade_maxima_raio: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`anoFabricacao-${grua.id}`}>Ano de Fabricação</Label>
                                      <Input
                                        id={`anoFabricacao-${grua.id}`}
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        value={grua.ano_fabricacao || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, ano_fabricacao: parseInt(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="YYYY"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`vidaUtil-${grua.id}`}>Vida Útil Estimada (anos)</Label>
                                      <Input
                                        id={`vidaUtil-${grua.id}`}
                                        type="number"
                                        value={grua.vida_util || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, vida_util: parseInt(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Seção: Serviços e Logística */}
                              {/* NOTA: Seção "Valores Detalhados" removida - esses dados devem estar na aba "Valores" (orçamentos) */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <Truck className="w-4 h-4" />
                                      Serviços e Logística
                                    </CardTitle>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={preencherServicosLogistica}
                                      disabled={creating || gruasSelecionadas.length === 0}
                                      className="shrink-0"
                                      title="Preencher todos os campos de Serviços e Logística com dados de teste"
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Preencher
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                      <Label htmlFor={`guindasteMontagem-${grua.id}`}>Guindaste para Montagem/Desmontagem</Label>
                                      <Select 
                                        value={grua.guindaste_montagem || ''} 
                                        onValueChange={(value) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, guindaste_montagem: value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="incluso">Incluso</SelectItem>
                                          <SelectItem value="cliente">Por conta do cliente</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`quantidadeViagens-${grua.id}`}>Quantidade de Viagens de Transporte</Label>
                                      <Input
                                        id={`quantidadeViagens-${grua.id}`}
                                        type="number"
                                        min="0"
                                        value={grua.quantidade_viagens || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, quantidade_viagens: parseInt(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`alojamentoAlimentacao-${grua.id}`}>Alojamento / Alimentação Equipe</Label>
                                      <Select 
                                        value={grua.alojamento_alimentacao || ''} 
                                        onValueChange={(value) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, alojamento_alimentacao: value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="incluso">Incluso</SelectItem>
                                          <SelectItem value="cliente">Por conta do cliente</SelectItem>
                                          <SelectItem value="nao_aplicavel">Não aplicável</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-3">
                                      <Label htmlFor={`responsabilidadeAcessorios-${grua.id}`}>Responsabilidade por Acessórios</Label>
                                      <Textarea
                                        id={`responsabilidadeAcessorios-${grua.id}`}
                                        value={grua.responsabilidade_acessorios || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, responsabilidade_acessorios: e.target.value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="Ex: Estropos, caçambas, garfos, baldes fornecidos por..."
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* NOTA: Seção "Condições Comerciais e Contratuais" removida - esses dados devem estar na aba "Valores" (orçamentos) */}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* Resumo das gruas */}
                {gruasSelecionadas.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Resumo das Gruas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total de Gruas:</span>
                        <p className="font-medium">{gruasSelecionadas.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor Total de Locação:</span>
                        <p className="font-medium text-green-600">
                          R$ {gruasSelecionadas.reduce((total, g) => total + g.valor_locacao, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Taxa Mensal Total:</span>
                        <p className="font-medium text-blue-600">
                          R$ {gruasSelecionadas.reduce((total, g) => total + g.taxa_mensal, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Funcionários */}
          <TabsContent value="funcionarios" className="space-y-4" forceMount>
            {/* Seção: Responsáveis de Obra */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Responsáveis de Obra ({responsaveisObra.length})
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => abrirModalResponsavelObra()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Responsável
                  </Button>
                </div>
                <CardDescription>
                  Responsáveis com acesso para aprovar as horas dos funcionários desta obra
                </CardDescription>
              </CardHeader>
              <CardContent>
                {responsaveisObra.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum responsável cadastrado</p>
                    <p className="text-xs text-gray-400 mt-1">Adicione responsáveis para aprovar horas dos funcionários</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responsaveisObra.map((responsavel, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{responsavel.nome}</TableCell>
                            <TableCell>{responsavel.usuario || '-'}</TableCell>
                            <TableCell>
                              {responsavel.email ? (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm">{responsavel.email}</span>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {responsavel.telefone ? (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm">{responsavel.telefone}</span>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirModalResponsavelObra(index)}
                                  title="Editar"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    if (confirm('Deseja remover este responsável?')) {
                                      removerResponsavelObraLocal(index)
                                    }
                                  }}
                                  title="Remover"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal para adicionar/editar responsável de obra */}
            <Dialog open={isModalResponsavelObraOpen} onOpenChange={setIsModalResponsavelObraOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editandoResponsavelObraIndex !== null ? 'Editar Responsável de Obra' : 'Novo Responsável de Obra'}
                  </DialogTitle>
                  <DialogDescription>
                    {editandoResponsavelObraIndex !== null
                      ? 'Atualize os dados do responsável'
                      : 'Cadastre um responsável para aprovar horas dos funcionários desta obra'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="novo-resp-nome">Nome *</Label>
                    <Input
                      id="novo-resp-nome"
                      value={formResponsavelObra.nome}
                      onChange={(e) => setFormResponsavelObra({ ...formResponsavelObra, nome: e.target.value })}
                      placeholder="Nome do responsável"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="novo-resp-usuario">Usuário</Label>
                    <Input
                      id="novo-resp-usuario"
                      value={formResponsavelObra.usuario || ''}
                      onChange={(e) => setFormResponsavelObra({ ...formResponsavelObra, usuario: e.target.value })}
                      placeholder="Nome de usuário"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="novo-resp-email">Email</Label>
                    <Input
                      id="novo-resp-email"
                      type="email"
                      value={formResponsavelObra.email || ''}
                      onChange={(e) => setFormResponsavelObra({ ...formResponsavelObra, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="novo-resp-telefone">Telefone</Label>
                    <Input
                      id="novo-resp-telefone"
                      value={formResponsavelObra.telefone || ''}
                      onChange={(e) => setFormResponsavelObra({ ...formResponsavelObra, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsModalResponsavelObraOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={salvarResponsavelObraLocal}>
                    {editandoResponsavelObraIndex !== null ? 'Salvar Alterações' : 'Cadastrar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Seção: Sinaleiros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Sinaleiros da Obra
                </CardTitle>
                <CardDescription>
                  Cadastre os sinaleiros da obra (máximo 2: Principal + Reserva)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SinaleirosForm
                  ref={sinaleirosFormRef}
                  sinaleiros={sinaleiros}
                  onSave={(data) => {
                    // Callback para sincronizar estado do componente filho com o componente pai
                    console.log('═══════════════════════════════════════════════════════════')
                    console.log('💾 CALLBACK onSave DO SINALEIROSFORM CHAMADO')
                    console.log('═══════════════════════════════════════════════════════════')
                    console.log('📥 Dados recebidos do componente filho:', data)
                    console.log('   - Quantidade:', data?.length || 0)
                    console.log('   - É array?', Array.isArray(data))
                    if (data && data.length > 0) {
                      console.log('   - Primeiro sinaleiro:', {
                        id: data[0]?.id,
                        nome: data[0]?.nome,
                        rg_cpf: data[0]?.rg_cpf,
                        tipo: data[0]?.tipo
                      })
                    }
                    console.log('📊 Estado ANTES da atualização:', sinaleiros?.length || 0)
                    
                    // Garantir que data é um array válido
                    if (Array.isArray(data)) {
                      setSinaleiros(data)
                      console.log('✅ Estado atualizado com', data.length, 'sinaleiros')
                    } else {
                      console.error('❌ Dados recebidos não são um array:', data)
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Seção: Funcionários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Funcionários da Obra
                </CardTitle>
                <CardDescription>
                  Adicione funcionários para esta obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="funcionarioSearch">Buscar Funcionário</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleFuncionarioSelect}
                    placeholder="Buscar funcionário por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do funcionário para buscar
                  </p>
                </div>

                {/* Lista de funcionários selecionados */}
                {funcionariosSelecionados.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Funcionários Selecionados ({funcionariosSelecionados.length})</h4>
                    {funcionariosSelecionados.map((funcionario) => (
                      <div key={funcionario.id} className="flex gap-2 p-3 border rounded-lg bg-green-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-green-900">{funcionario.name}</p>
                              </div>
                              <p className="text-sm text-green-700">{funcionario.role}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFuncionarioSelecionado(funcionario.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-between pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/obras')}
            disabled={creating}
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={preencherDadosTeste}
              disabled={creating}
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300"
              title="Preencher todos os campos com dados de teste"
            >
              <Zap className="w-4 h-4 mr-2" />
              Preencher Todos os Dados
            </Button>
            <DebugButton 
              onClick={preencherDadosTeste}
              disabled={creating}
              variant="zap"
              label="Preencher Dados"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={creating}
            >
              Limpar Formulário
            </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <ButtonLoader text="Criando..." />
                ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Obra
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Modal de Criação de Cliente */}
      <Dialog open={isClienteModalOpen} onOpenChange={setIsClienteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Novo Cliente
            </DialogTitle>
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
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={clienteFormData.status}
                    onValueChange={(value) => setClienteFormData({ ...clienteFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
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

            {/* Pessoa de Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pessoa de Contato (Representante)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contato">Nome do Representante *</Label>
                  <Input
                    id="contato"
                    value={clienteFormData.contato || ''}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, contato: e.target.value })}
                    placeholder="João Silva"
                    required
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

            {/* Configuração de Usuário */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuração de Usuário</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="criar_usuario"
                  checked={clienteFormData.criar_usuario}
                  onCheckedChange={(checked) => setClienteFormData({ ...clienteFormData, criar_usuario: checked === true })}
                />
                <Label htmlFor="criar_usuario" className="cursor-pointer">
                  Criar usuário para o representante
                </Label>
              </div>
              {clienteFormData.criar_usuario && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <User className="w-5 h-5 mt-0.5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-blue-900">Criação de Usuário</h4>
                      <p className="text-sm mb-3 text-blue-700">
                        Será criado um usuário para o representante com acesso limitado ao sistema.
                      </p>
                      <p className="text-xs text-gray-500">
                        Uma senha temporária será gerada automaticamente e enviada por email e WhatsApp ao representante.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                {isCreatingCliente ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Cliente
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
