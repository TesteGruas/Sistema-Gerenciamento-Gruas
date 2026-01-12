"use client"

import { useState, useEffect } from "react"
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
  Shield
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
import { SinaleirosForm } from "@/components/sinaleiros-form"
import { responsavelTecnicoApi } from "@/lib/api-responsavel-tecnico"
import { sinaleirosApi } from "@/lib/api-sinaleiros"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { clientesApi, converterClienteBackendParaFrontend } from "@/lib/api-clientes"
import { Checkbox } from "@/components/ui/checkbox"
import { useDebugMode } from "@/hooks/use-debug-mode"
import { DebugButton } from "@/components/debug-button"

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
  
  // Estados do formulário
  const [obraFormData, setObraFormData] = useState({
    name: '',
    description: '',
    status: 'Em Andamento',
    startDate: '',
    endDate: '',
    budget: '',
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
    // Dados do responsável
    responsavelId: '',
    responsavelName: '',
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
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<any>(null)
  
  // Estados para novos campos obrigatórios
  const [cno, setCno] = useState<string>('')
  const [artNumero, setArtNumero] = useState<string>('')
  const [artArquivo, setArtArquivo] = useState<File | null>(null)
  const [apoliceNumero, setApoliceNumero] = useState<string>('')
  const [apoliceArquivo, setApoliceArquivo] = useState<File | null>(null)
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
  
  const [sinaleiros, setSinaleiros] = useState<any[]>([])
  
  // Estados para orçamento aprovado
  const [orcamentoAprovado, setOrcamentoAprovado] = useState<Orcamento | null>(null)
  const [orcamentoId, setOrcamentoId] = useState<number | null>(null)
  const [loadingOrcamento, setLoadingOrcamento] = useState(false)
  
  // Estados para Dados de Montagem do Equipamento
  const [dadosMontagemEquipamento, setDadosMontagemEquipamento] = useState({
    altura_final: '',
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
            toast({
              title: "Atenção",
              description: "Nenhum orçamento aprovado encontrado para este cliente. É necessário ter um orçamento aprovado para criar uma obra.",
              variant: "destructive"
            })
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
      role: funcionario.role,
      name: funcionario.name,
      isSupervisor: false,
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

  // Função para alternar status de supervisor
  const handleToggleSupervisor = (funcionarioId: string) => {
    const funcionariosAtualizados = funcionariosSelecionados.map(f => 
      f.id === funcionarioId ? { ...f, isSupervisor: !f.isSupervisor } : f
    )
    setFuncionariosSelecionados(funcionariosAtualizados)
    setObraFormData({
      ...obraFormData,
      funcionarios: obraFormData.funcionarios.map(f => 
        f.id === funcionarioId ? { ...f, isSupervisor: !f.isSupervisor } : f
      )
    })
  }

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

  // Função para lidar com seleção de responsável
  const handleResponsavelSelect = (responsavel: any) => {
    setResponsavelSelecionado(responsavel)
    if (responsavel) {
      setObraFormData({ 
        ...obraFormData, 
        responsavelId: responsavel.id,
        responsavelName: responsavel.name
      })
    }
  }

  // Função para criar obra
  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Determinar clienteId - usar clienteSelecionado como fallback
    const clienteIdFinal = obraFormData.clienteId || clienteSelecionado?.id || clienteSelecionado?.cliente_id
    
    if (!obraFormData.name || !clienteIdFinal || !obraFormData.location || !obraFormData.cidade || !obraFormData.estado || !obraFormData.tipo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Nome, Cliente, Endereço, Cidade, Estado, Tipo)",
        variant: "destructive"
      })
      return
    }

    // Validação de orçamento aprovado obrigatório
    if (!orcamentoId || !orcamentoAprovado) {
      toast({
        title: "Erro",
        description: "É necessário ter um orçamento aprovado para criar uma obra. Selecione um cliente com orçamento aprovado.",
        variant: "destructive"
      })
      return
    }

    // Validações dos novos campos obrigatórios
    if (!cno) {
      toast({
        title: "Erro",
        description: "O campo CNO da obra é obrigatório",
        variant: "destructive"
      })
      return
    }

    if (!artNumero || !artArquivo) {
      toast({
        title: "Erro",
        description: "O número e o arquivo da ART são obrigatórios",
        variant: "destructive"
      })
      return
    }

    if (!apoliceNumero || !apoliceArquivo) {
      toast({
        title: "Erro",
        description: "O número e o arquivo da Apólice de Seguro são obrigatórios",
        variant: "destructive"
      })
      return
    }

    // Validação do responsável técnico removida - agora é opcional na criação
    // O responsável técnico pode ser cadastrado depois de criar a obra

    try {
      setCreating(true)
      setError(null)

      // Debug: Log dos dados antes da conversão
      console.log('🔍 DEBUG - Dados antes da conversão:')
      console.log('  - custosMensais:', custosMensais)
      console.log('  - funcionariosSelecionados:', funcionariosSelecionados)
      console.log('  - gruasSelecionadas:', gruasSelecionadas)
      console.log('  - obraFormData:', obraFormData)

      // Preparar dados para o backend
      const obraData = {
        name: obraFormData.name,
        description: obraFormData.description,
        status: obraFormData.status,
        startDate: obraFormData.startDate,
        endDate: obraFormData.endDate,
        budget: parseCurrency(obraFormData.budget),
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
        // Múltiplas gruas
        gruasSelecionadas: gruasSelecionadas.map(grua => ({
          ...grua,
          // Incluir dados de montagem do equipamento na grua
          altura_final: dadosMontagemEquipamento.altura_final ? parseFloat(dadosMontagemEquipamento.altura_final) : undefined,
          tipo_base: dadosMontagemEquipamento.tipo_base || undefined,
          capacidade_1_cabo: dadosMontagemEquipamento.capacidade_1_cabo ? parseFloat(dadosMontagemEquipamento.capacidade_1_cabo) : undefined,
          capacidade_2_cabos: dadosMontagemEquipamento.capacidade_2_cabos ? parseFloat(dadosMontagemEquipamento.capacidade_2_cabos) : undefined,
          capacidade_ponta: dadosMontagemEquipamento.capacidade_ponta ? parseFloat(dadosMontagemEquipamento.capacidade_ponta) : undefined,
          potencia_instalada: dadosMontagemEquipamento.potencia_instalada ? parseFloat(dadosMontagemEquipamento.potencia_instalada) : undefined,
          voltagem: dadosMontagemEquipamento.voltagem || undefined,
          tipo_ligacao: dadosMontagemEquipamento.tipo_ligacao || undefined,
          velocidade_rotacao: dadosMontagemEquipamento.velocidade_rotacao ? parseFloat(dadosMontagemEquipamento.velocidade_rotacao) : undefined,
          velocidade_elevacao: dadosMontagemEquipamento.velocidade_elevacao ? parseFloat(dadosMontagemEquipamento.velocidade_elevacao) : undefined,
          velocidade_translacao: dadosMontagemEquipamento.velocidade_translacao ? parseFloat(dadosMontagemEquipamento.velocidade_translacao) : undefined,
        })),
        // Dados de montagem do equipamento (geral)
        dados_montagem_equipamento: dadosMontagemEquipamento,
        // Dados do responsável
        responsavelId: obraFormData.responsavelId,
        responsavelName: obraFormData.responsavelName,
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

      // Debug: Log dos dados finais
      console.log('🚀 DEBUG - Dados finais que serão enviados:')
      console.log('  - Obra básica:', {
        name: obraData.name,
        cidade: obraData.cidade,
        estado: obraData.estado,
        tipo: obraData.tipo,
        cep: obraData.cep,
        contato_obra: obraData.contato_obra,
        telefone_obra: obraData.telefone_obra,
        email_obra: obraData.email_obra
      })
      console.log('  - gruaId:', obraData.gruaId)
      console.log('  - gruaValue:', obraData.gruaValue)
      console.log('  - monthlyFee:', obraData.monthlyFee)
      console.log('  - gruasSelecionadas:', obraData.gruasSelecionadas)
      console.log('  - custos_mensais:', obraData.custos_mensais)
      console.log('  - funcionarios:', obraData.funcionarios)
      console.log('  - responsavel_tecnico:', obraData.responsavel_tecnico)
      console.log('  - sinaleiros:', obraData.sinaleiros)

      // 1. Fazer upload dos arquivos ART e Apólice (precisamos criar a obra primeiro)
      // Por enquanto, vamos criar a obra sem os arquivos e depois atualizar
      
      // Converter para formato do backend (sem arquivos ainda)
      const obraBackendData = converterObraFrontendParaBackend(obraData)
      // Remover arquivos do payload inicial (serão enviados depois)
      delete obraBackendData.art_arquivo
      delete obraBackendData.apolice_arquivo
      
      // 2. Criar a obra
      const response = await obrasApi.criarObra(obraBackendData)
      
      if (!response.success || !response.data?.id) {
        throw new Error('Erro ao criar obra')
      }
      
      const obraId = response.data.id
      console.log('✅ Obra criada com ID:', obraId)
      console.log('🔍 DEBUG - Estado antes de salvar responsável e sinaleiros:')
      console.log('  - responsavelTecnico:', responsavelTecnico)
      console.log('  - sinaleiros:', sinaleiros)
      
      // 3. Fazer upload dos arquivos ART, Apólice e documentos adicionais
      let artArquivoUrl = ''
      let apoliceArquivoUrl = ''
      
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
        // Upload ART
        if (artArquivo) {
          artArquivoUrl = await fazerUploadArquivo(artArquivo, 'art')
        }
        
        // Upload Apólice
        if (apoliceArquivo) {
          apoliceArquivoUrl = await fazerUploadArquivo(apoliceArquivo, 'apolice')
        }
        
        // Upload Manual Técnico
        if (manualTecnicoArquivo) {
          await fazerUploadArquivo(manualTecnicoArquivo, 'manual_tecnico')
        }
        
        // Upload Termo de Entrega Técnica
        if (termoEntregaArquivo) {
          await fazerUploadArquivo(termoEntregaArquivo, 'termo_entrega_tecnica')
        }
        
        // Upload Plano de Carga
        if (planoCargaArquivo) {
          await fazerUploadArquivo(planoCargaArquivo, 'plano_carga')
        }
        
        // Upload Aterramento
        if (aterramentoArquivo) {
          await fazerUploadArquivo(aterramentoArquivo, 'aterramento')
        }
        
        // 4. Atualizar documentos da obra (rota parcial, não exige demais campos)
        await obrasApi.atualizarDocumentos(obraId, {
          cno,
          art_numero: artNumero || undefined,
          art_arquivo: artArquivoUrl || undefined,
          apolice_numero: apoliceNumero || undefined,
          apolice_arquivo: apoliceArquivoUrl || undefined
        })
      } catch (uploadError) {
        console.error('Erro ao fazer upload de arquivos:', uploadError)
        // Continuar mesmo com erro no upload - a obra já foi criada
      }
      
      // 5. Salvar responsável técnico (apenas se houver dados válidos)
      // IMPORTANTE: Fora do try/catch de upload para garantir que seja executado
      console.log('🔍 DEBUG - Responsável técnico no estado:', responsavelTecnico)
      if (responsavelTecnico) {
        const temFuncionarioId = !!responsavelTecnico.funcionario_id
        const temDadosCompletos = !!(responsavelTecnico.nome && responsavelTecnico.cpf_cnpj)
        
        console.log('🔍 DEBUG - Validação responsável:', { temFuncionarioId, temDadosCompletos })
        
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
            console.log('📤 Enviando responsável técnico:', payload)
            const response = await responsavelTecnicoApi.criarOuAtualizar(obraId, payload)
            console.log('✅ Responsável técnico salvo:', response)
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
        console.log('⚠️ Nenhum responsável técnico no estado')
      }
      
      // 6. Salvar sinaleiros (apenas se houver dados válidos)
      // IMPORTANTE: Fora do try/catch de upload para garantir que seja executado
      console.log('🔍 DEBUG - Sinaleiros no estado:', sinaleiros)
      if (sinaleiros && sinaleiros.length > 0) {
        // Filtrar apenas sinaleiros com dados válidos (nome e rg_cpf preenchidos)
        const sinaleirosValidos = sinaleiros.filter(s => {
          const temNome = !!s.nome
          const temDocumento = !!(s.rg_cpf || s.cpf || s.rg)
          return temNome && temDocumento
        })
        
        console.log('🔍 DEBUG - Sinaleiros válidos:', sinaleirosValidos)
        
        if (sinaleirosValidos.length > 0) {
          try {
            // Converter para o formato esperado pelo backend (remover IDs temporários)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            const sinaleirosParaEnviar = sinaleirosValidos.map(s => ({
              id: s.id && uuidRegex.test(s.id) ? s.id : undefined,
              nome: s.nome,
              rg_cpf: s.rg_cpf || s.cpf || s.rg || '',
              telefone: s.telefone || '',
              email: s.email || '',
              tipo: s.tipo || (s.tipo_vinculo === 'interno' ? 'principal' : 'reserva')
            }))
            console.log('📤 Enviando sinaleiros:', sinaleirosParaEnviar)
            const response = await sinaleirosApi.criarOuAtualizar(obraId, sinaleirosParaEnviar)
            console.log('✅ Sinaleiros salvos:', response)
          } catch (error) {
            console.error('❌ Erro ao salvar sinaleiros:', error)
            toast({
              title: "Aviso",
              description: "Obra criada, mas houve erro ao salvar os sinaleiros. Você pode editá-los depois.",
              variant: "destructive"
            })
          }
        } else {
          console.warn('⚠️ Nenhum sinaleiro válido para salvar')
        }
      } else {
        console.log('⚠️ Nenhum sinaleiro no estado')
      }
      
      toast({
        title: "Sucesso",
        description: "Obra criada com sucesso!"
      })
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
      budget: '',
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
      responsavelId: '',
      responsavelName: '',
      funcionarios: []
    })
    setCno('')
    setArtNumero('')
    setArtArquivo(null)
    setApoliceNumero('')
    setApoliceArquivo(null)
    setManualTecnicoArquivo(null)
    setTermoEntregaArquivo(null)
    setPlanoCargaArquivo(null)
    setAterramentoArquivo(null)
    setResponsavelTecnico(null)
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
    setGruasSelecionadas([])
    setFuncionariosSelecionados([])
    setResponsavelSelecionado(null)
    setClienteSelecionado(null)
    setCustosMensais([])
    setOrcamentoAprovado(null)
    setOrcamentoId(null)
    setDadosMontagemEquipamento({
      altura_final: '',
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
      budget: '1500000,00',
      location: 'Rua das Flores, 123 - Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      tipo: 'Residencial',
      clienteId: '',
      observations: 'Obra de teste para validação do sistema. Todos os campos foram preenchidos automaticamente.',
      // Campos adicionais
      cep: '01310-100',
      contato_obra: 'João Silva',
      telefone_obra: '(11) 98765-4321',
      email_obra: 'joao.silva@construtora.com.br',
      responsavelId: '',
      responsavelName: '',
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

    // Sinaleiros
    setSinaleiros([
      {
        id: undefined,
        nome: 'Pedro Oliveira',
        rg_cpf: '98765432100',
        telefone: '(11) 91234-5678',
        email: 'pedro.oliveira@empresa.com.br',
        tipo: 'principal',
        tipo_vinculo: 'interno'
      },
      {
        id: undefined,
        nome: 'Maria Santos',
        rg_cpf: '11122233344',
        telefone: '(11) 92345-6789',
        email: 'maria.santos@cliente.com.br',
        tipo: 'reserva',
        tipo_vinculo: 'cliente'
      }
    ])

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
      responsavelId: 'resp-teste-001',
      responsavelName: 'Eng. Maria Costa'
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

    toast({
      title: "Dados de teste preenchidos",
      description: "Todos os campos foram preenchidos com dados de teste para validação.",
    })
  }

  return (
    <div className="space-y-6 w-full">
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

      {/* Formulário */}
      <form onSubmit={handleCreateObra} className="">
        <Tabs defaultValue="obra" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="responsavel-tecnico">Responsável Técnico</TabsTrigger>
            <TabsTrigger value="grua">Grua</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="custos">Valores</TabsTrigger>
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
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5">
                    <Label htmlFor="name">Nome da Obra *</Label>
                    <Input
                      id="name"
                      value={obraFormData.name}
                      onChange={(e) => setObraFormData({ ...obraFormData, name: e.target.value })}
                      placeholder="Ex: Obra Residencial Jardim das Flores"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
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
                  <div className="md:col-span-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={obraFormData.startDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={obraFormData.endDate}
                      onChange={(e) => setObraFormData({ ...obraFormData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <Label htmlFor="location">Endereço *</Label>
                    <Input
                      id="location"
                      value={obraFormData.location}
                      onChange={(e) => setObraFormData({ ...obraFormData, location: e.target.value })}
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                      required
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Label htmlFor="budget">Orçamento (R$)</Label>
                    <Input
                      id="budget"
                      type="text"
                      value={obraFormData.budget}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        setObraFormData({ ...obraFormData, budget: formatted })
                      }}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={obraFormData.cidade}
                      onChange={(e) => setObraFormData({ ...obraFormData, cidade: e.target.value })}
                      placeholder="Ex: São Paulo"
                      required
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
                    <Label htmlFor="capacidade_1_cabo">Capacidade com 1 Cabo (kg)</Label>
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
                    <Label htmlFor="capacidade_2_cabos">Capacidade com 2 Cabos (kg)</Label>
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
                        label="CNO da Obra (CNPJ/Documento)"
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
                        required
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
                        required
                      />
                    </div>
                  </div>

                  {/* Coluna Direita - Uploads */}
                  <div className="space-y-6">
                    {/* Upload ART */}
                    <div className="space-y-2">
                      <DocumentoUpload
                        label="Upload do Documento ART (PDF)"
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
                        label="Upload da Apólice de Seguro (PDF)"
                        accept="application/pdf"
                        maxSize={5 * 1024 * 1024}
                        required={true}
                        onUpload={(file) => setApoliceArquivo(file)}
                        onRemove={() => setApoliceArquivo(null)}
                        currentFile={apoliceArquivo}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Gruas */}
          <TabsContent value="grua" className="space-y-4" forceMount>
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
                              {/* Seção: Parâmetros Técnicos */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    Parâmetros Técnicos
                                  </CardTitle>
                                  <CardDescription className="text-xs text-gray-500 mt-1">
                                    Os dados técnicos devem ser definidos no orçamento. Estes campos são apenas para ajustes finais se necessário.
                                  </CardDescription>
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

                              {/* Seção: Valores Detalhados */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Valores Detalhados e Itens de Cobrança
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                      <Label htmlFor={`valorLocacao-${grua.id}`}>Locação Mensal da Grua (R$)</Label>
                                      <Input
                                        id={`valorLocacao-${grua.id}`}
                                        type="text"
                                        value={grua.valor_locacao && grua.valor_locacao > 0 ? formatCurrency((grua.valor_locacao * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_locacao: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorOperador-${grua.id}`}>Operador / Sinaleiro (R$)</Label>
                                      <Input
                                        id={`valorOperador-${grua.id}`}
                                        type="text"
                                        value={grua.valor_operador && grua.valor_operador > 0 ? formatCurrency((grua.valor_operador * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_operador: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorManutencao-${grua.id}`}>Manutenção Preventiva (R$)</Label>
                                      <Input
                                        id={`valorManutencao-${grua.id}`}
                                        type="text"
                                        value={grua.valor_manutencao && grua.valor_manutencao > 0 ? formatCurrency((grua.valor_manutencao * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_manutencao: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorEstaiamento-${grua.id}`}>Estaiamento por Unidade (R$)</Label>
                                      <Input
                                        id={`valorEstaiamento-${grua.id}`}
                                        type="text"
                                        value={grua.valor_estaiamento && grua.valor_estaiamento > 0 ? formatCurrency((grua.valor_estaiamento * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_estaiamento: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorChumbadores-${grua.id}`}>Chumbadores (R$)</Label>
                                      <Input
                                        id={`valorChumbadores-${grua.id}`}
                                        type="text"
                                        value={grua.valor_chumbadores && grua.valor_chumbadores > 0 ? formatCurrency((grua.valor_chumbadores * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_chumbadores: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorMontagem-${grua.id}`}>Montagem (R$)</Label>
                                      <Input
                                        id={`valorMontagem-${grua.id}`}
                                        type="text"
                                        value={grua.valor_montagem && grua.valor_montagem > 0 ? formatCurrency((grua.valor_montagem * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_montagem: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorDesmontagem-${grua.id}`}>Desmontagem (R$)</Label>
                                      <Input
                                        id={`valorDesmontagem-${grua.id}`}
                                        type="text"
                                        value={grua.valor_desmontagem && grua.valor_desmontagem > 0 ? formatCurrency((grua.valor_desmontagem * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_desmontagem: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorTransporte-${grua.id}`}>Transporte Ida/Volta por Viagem (R$)</Label>
                                      <Input
                                        id={`valorTransporte-${grua.id}`}
                                        type="text"
                                        value={grua.valor_transporte && grua.valor_transporte > 0 ? formatCurrency((grua.valor_transporte * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_transporte: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorHoraExtra-${grua.id}`}>Hora Extra (R$)</Label>
                                      <Input
                                        id={`valorHoraExtra-${grua.id}`}
                                        type="text"
                                        value={grua.valor_hora_extra && grua.valor_hora_extra > 0 ? formatCurrency((grua.valor_hora_extra * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_hora_extra: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorSeguro-${grua.id}`}>Seguro Responsabilidade Civil (R$)</Label>
                                      <Input
                                        id={`valorSeguro-${grua.id}`}
                                        type="text"
                                        value={grua.valor_seguro && grua.valor_seguro > 0 ? formatCurrency((grua.valor_seguro * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_seguro: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`valorCaucao-${grua.id}`}>Caução / Depósito de Garantia (R$)</Label>
                                      <Input
                                        id={`valorCaucao-${grua.id}`}
                                        type="text"
                                        value={grua.valor_caucao && grua.valor_caucao > 0 ? formatCurrency((grua.valor_caucao * 100).toString()) : ''}
                                        onChange={(e) => {
                                          const formatted = formatCurrency(e.target.value)
                                          const numericValue = parseCurrency(formatted)
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, valor_caucao: numericValue } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0,00"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Seção: Serviços e Logística */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <Truck className="w-4 h-4" />
                                    Serviços e Logística
                                  </CardTitle>
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

                              {/* Seção: Condições Comerciais */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Condições Comerciais e Contratuais
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                      <Label htmlFor={`prazoValidade-${grua.id}`}>Prazo de Validade da Proposta (dias)</Label>
                                      <Input
                                        id={`prazoValidade-${grua.id}`}
                                        type="number"
                                        min="0"
                                        value={grua.prazo_validade || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, prazo_validade: parseInt(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`formaPagamento-${grua.id}`}>Forma de Pagamento / Medição Mensal</Label>
                                      <Select 
                                        value={grua.forma_pagamento || ''} 
                                        onValueChange={(value) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, forma_pagamento: value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="mensal">Mensal</SelectItem>
                                          <SelectItem value="quinzenal">Quinzenal</SelectItem>
                                          <SelectItem value="semanal">Semanal</SelectItem>
                                          <SelectItem value="unica">Única</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`multaAtraso-${grua.id}`}>Multa por Atraso (%)</Label>
                                      <Input
                                        id={`multaAtraso-${grua.id}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={grua.multa_atraso || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, multa_atraso: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`reajusteIndice-${grua.id}`}>Reajuste por Índice</Label>
                                      <Select 
                                        value={grua.reajuste_indice || ''} 
                                        onValueChange={(value) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, reajuste_indice: value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="igp_m">IGP-M</SelectItem>
                                          <SelectItem value="ipca">IPCA</SelectItem>
                                          <SelectItem value="inpc">INPC</SelectItem>
                                          <SelectItem value="sem_reajuste">Sem reajuste</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`garantiaCaucao-${grua.id}`}>Garantia / Caução de Mobilização</Label>
                                      <Input
                                        id={`garantiaCaucao-${grua.id}`}
                                        type="text"
                                        value={grua.garantia_caucao || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, garantia_caucao: e.target.value } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="Ex: 10% do valor total"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`retencaoContratual-${grua.id}`}>Retenção Contratual (%)</Label>
                                      <Input
                                        id={`retencaoContratual-${grua.id}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={grua.retencao_contratual || ''}
                                        onChange={(e) => {
                                          const updatedGruas = gruasSelecionadas.map(g => 
                                            g.id === grua.id ? { ...g, retencao_contratual: parseFloat(e.target.value) || 0 } : g
                                          )
                                          setGruasSelecionadas(updatedGruas)
                                        }}
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
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
                  sinaleiros={sinaleiros}
                  onSave={(data) => {
                    console.log('💾 Salvando sinaleiros no estado:', data)
                    setSinaleiros(data)
                    toast({
                      title: "Sucesso",
                      description: "Sinaleiros salvos com sucesso"
                    })
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
                    allowedRoles={['Operador', 'Sinaleiro', 'Técnico Manutenção', 'Supervisor', 'Mecânico', 'Engenheiro', 'Chefe de Obras']}
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
                      <div key={funcionario.id} className={`flex gap-2 p-3 border rounded-lg ${funcionario.isSupervisor ? 'bg-blue-50 border-blue-200' : 'bg-green-50'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {funcionario.isSupervisor ? (
                              <Shield className="w-4 h-4 text-blue-600" />
                            ) : (
                              <User className="w-4 h-4 text-green-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${funcionario.isSupervisor ? 'text-blue-900' : 'text-green-900'}`}>{funcionario.name}</p>
                                {funcionario.isSupervisor && (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                    Supervisor
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm ${funcionario.isSupervisor ? 'text-blue-700' : 'text-green-700'}`}>{funcionario.role}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`supervisor-${funcionario.id}`}
                              checked={funcionario.isSupervisor === true}
                              onCheckedChange={() => handleToggleSupervisor(funcionario.id)}
                            />
                            <Label 
                              htmlFor={`supervisor-${funcionario.id}`}
                              className="text-sm cursor-pointer flex items-center gap-1"
                            >
                              <Shield className="w-3 h-3" />
                              Supervisor
                            </Label>
                          </div>
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

                <div>
                  <Label htmlFor="responsavelSearch">Responsável pela Obra</Label>
                  <FuncionarioSearch
                    onFuncionarioSelect={handleResponsavelSelect}
                    placeholder="Buscar responsável por nome ou cargo..."
                    className="mt-1"
                    onlyActive={true}
                    allowedRoles={['Supervisor', 'Engenheiro', 'Chefe de Obras','Operador']}
                  />
                  {responsavelSelecionado && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">{responsavelSelecionado.name}</p>
                          <p className="text-sm text-blue-700">{responsavelSelecionado.role}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o nome ou cargo do responsável para buscar
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Valores */}
          <TabsContent value="custos" className="space-y-4" forceMount>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Valores da Obra
                </CardTitle>
                <CardDescription>
                  Configure os valores que serão aplicados a esta obra
                </CardDescription>
              </CardHeader>
              <CardContent className="">
                {/* Formulário para adicionar custo */}
                <div className="rounded-lg">
                  <h4 className="font-medium text-sm">Adicionar Novo Custo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="custoItem">Item *</Label>
                      <Input
                        id="custoItem"
                        value={custoForm.item}
                        onChange={(e) => setCustoForm({...custoForm, item: e.target.value})}
                        placeholder="Ex: 01.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoDescricao">Descrição *</Label>
                      <Input
                        id="custoDescricao"
                        value={custoForm.descricao}
                        onChange={(e) => setCustoForm({...custoForm, descricao: e.target.value})}
                        placeholder="Ex: Locação de grua torre"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoUnidade">Unidade *</Label>
                      <Select value={custoForm.unidade} onValueChange={(value) => setCustoForm({...custoForm, unidade: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mês">Mês</SelectItem>
                          <SelectItem value="dia">Dia</SelectItem>
                          <SelectItem value="hora">Hora</SelectItem>
                          <SelectItem value="un">Unidade</SelectItem>
                          <SelectItem value="kg">Quilograma</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                          <SelectItem value="m²">Metro Quadrado</SelectItem>
                          <SelectItem value="m³">Metro Cúbico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="custoMes">Mês *</Label>
                      <Input
                        id="custoMes"
                        type="month"
                        value={custoForm.mes}
                        onChange={(e) => setCustoForm({...custoForm, mes: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoQuantidade">Quantidade Orçada *</Label>
                      <Input
                        id="custoQuantidade"
                        type="text"
                        value={custoForm.quantidadeOrcamento && custoForm.quantidadeOrcamento > 0 ? custoForm.quantidadeOrcamento.toString().replace('.', ',') : ''}
                        onChange={(e) => {
                          const formatted = formatDecimal(e.target.value)
                          const numericValue = parseDecimal(formatted)
                          setCustoForm({...custoForm, quantidadeOrcamento: numericValue})
                        }}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custoValorUnitario">Valor Unitário (R$) *</Label>
                      <Input
                        id="custoValorUnitario"
                        type="text"
                        value={custoForm.valorUnitario && custoForm.valorUnitario > 0 ? formatCurrency((custoForm.valorUnitario * 100).toString()) : ''}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value)
                          const numericValue = parseCurrency(formatted)
                          setCustoForm({...custoForm, valorUnitario: numericValue})
                        }}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" onClick={adicionarCustoMensal} disabled={!custoForm.item || !custoForm.descricao || !custoForm.unidade || custoForm.quantidadeOrcamento <= 0 || custoForm.valorUnitario <= 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Custo
                    </Button>
                  </div>
                </div>

                {/* Lista de custos mensais */}
                {custosMensais.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Valores Configurados ({custosMensais.length})</h4>
                    <div className="space-y-2">
                      {custosMensais.map((custo) => (
                        <div key={custo.id} className="flex gap-2 p-3 border rounded-lg bg-purple-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="font-medium text-purple-900">{custo.item} - {custo.descricao}</p>
                                <p className="text-sm text-purple-700">
                                  {custo.quantidadeOrcamento} {custo.unidade} × R$ {custo.valorUnitario.toLocaleString('pt-BR')} = R$ {custo.totalOrcamento.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-xs text-purple-600">Mês: {custo.mes}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removerCustoMensal(custo.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
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
