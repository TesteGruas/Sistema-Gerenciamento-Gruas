"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Edit, 
  User,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2,
  Shield,
  DollarSign,
  Clock,
  FileText,
  Briefcase,
  History,
  Award,
  AlertCircle,
  Loader2,
  Calculator,
  Gift,
  Download,
  Upload,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { funcionariosApi } from "@/lib/api-funcionarios"
import { rhApi } from "@/lib/api-rh-completo"
import { apiRegistrosPonto } from "@/lib/api-ponto-eletronico"
import { ColaboradorCertificados } from "@/components/colaborador-certificados"
import { ColaboradorDocumentosAdmissionais } from "@/components/colaborador-documentos-admissionais"
import { ColaboradorHolerites } from "@/components/colaborador-holerites"
import { CARGOS_PREDEFINIDOS } from "@/lib/utils/cargos-predefinidos"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral'
  observacoes?: string
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

interface SalarioDetalhado {
  id: number
  funcionario_id: number
  mes: string
  ano: number
  salario_base: number
  total_proventos: number
  total_descontos: number
  salario_liquido: number
  status: string
  data_pagamento?: string
  created_at: string
  updated_at: string
  funcionario?: {
    nome: string
    cargo: string
  }
}

interface BeneficioFuncionario {
  id: number
  funcionario_id: number
  beneficio_tipo_id: number
  data_inicio: string
  data_fim?: string
  status: string
  observacoes?: string
  funcionario?: {
    nome: string
    cargo?: string
  }
  beneficios_tipo?: {
    tipo: string
    descricao: string
    valor: number
  }
}

interface DocumentoFuncionario {
  id: string
  tipo: 'rg' | 'cpf' | 'ctps' | 'pis' | 'titulo-eleitor' | 'certificado-reservista' | 'comprovante-residencia' | 'outros'
  nome: string
  numero: string
  dataEmissao: string
  dataVencimento?: string
  arquivo?: string
  observacoes?: string
}

interface PontoDetalhado {
  id: string
  funcionario_id: number
  data: string
  entrada?: string
  saida?: string
  saida_almoco?: string
  volta_almoco?: string
  horas_trabalhadas: number
  horas_extras: number
  status: string
  aprovado_por?: number
  data_aprovacao?: string
  observacoes?: string
  localizacao?: string
  created_at: string
  updated_at: string
  funcionario?: {
    nome: string
    cargo?: string
  }
}

interface HistoricoEvento {
  id: number
  funcionario_id: number
  tipo: string
  titulo: string
  descricao: string
  obra_id?: number
  valor?: number
  status?: string
  dados_adicionais?: any
  created_at: string
  funcionario?: {
    nome: string
    cargo?: string
  }
}

export default function FuncionarioDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [funcionario, setFuncionario] = useState<FuncionarioRH | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isBeneficioDialogOpen, setIsBeneficioDialogOpen] = useState(false)
  const [isEditBeneficioDialogOpen, setIsEditBeneficioDialogOpen] = useState(false)
  const [beneficioSelecionado, setBeneficioSelecionado] = useState<BeneficioFuncionario | null>(null)
  const [isDocumentoDialogOpen, setIsDocumentoDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Formulário de edição
  const [editFormData, setEditFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    cargo: '',
    departamento: '',
    turno: 'Diurno' as 'Diurno' | 'Noturno' | 'Sob Demanda' | 'Integral',
    status: 'Ativo' as 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido',
    data_admissao: '',
    salario: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: ''
  })
  
  // Estados para formulários
  const [beneficioForm, setBeneficioForm] = useState({
    tipo: '',
    dataInicio: '',
    observacoes: ''
  })
  
  const [documentoForm, setDocumentoForm] = useState({
    tipo: '',
    nome: '',
    numero: '',
    orgaoEmissor: '',
    dataEmissao: '',
    dataVencimento: '',
    observacoes: ''
  })

  // Estados para dados das tabs
  const [salarios, setSalarios] = useState<SalarioDetalhado[]>([])
  const [beneficios, setBeneficios] = useState<BeneficioFuncionario[]>([])
  const [pontos, setPontos] = useState<PontoDetalhado[]>([])
  const [historico, setHistorico] = useState<HistoricoEvento[]>([])
  const [tiposBeneficios, setTiposBeneficios] = useState<any[]>([])
  const [obrasFuncionario, setObrasFuncionario] = useState<any[]>([])

  // Documentos
  const [documentos, setDocumentos] = useState<DocumentoFuncionario[]>([])

  // Função para carregar dados das tabs
  const carregarDadosTabs = async (funcionarioId: number) => {
    try {
      // Carregar salários/folhas de pagamento
      const salariosResponse = await rhApi.listarFolhasPagamento({ 
        funcionario_id: funcionarioId
      })
      setSalarios(salariosResponse.data || [])

      // Carregar benefícios
      const beneficiosResponse = await rhApi.listarBeneficiosFuncionarios({ 
        funcionario_id: funcionarioId
      })
      setBeneficios(beneficiosResponse.data || [])

      // Carregar registros de ponto (últimos 30 dias)
      const hoje = new Date()
      const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const pontosResponse = await apiRegistrosPonto.listar({
        funcionario_id: funcionarioId,
        data_inicio: format(dataInicio, 'yyyy-MM-dd'),
        data_fim: format(hoje, 'yyyy-MM-dd')
      })
      setPontos(pontosResponse.data || [])

      // Carregar histórico
      const historicoResponse = await rhApi.listarHistoricoRH({ 
        funcionario_id: funcionarioId
      })
      setHistorico(historicoResponse.data || [])

      // Carregar documentos
      const documentosResponse = await funcionariosApi.listarDocumentosFuncionario(funcionarioId)
      if (documentosResponse.data) {
        // Converter formato do backend para o frontend
        const docsFormatados = documentosResponse.data.map((doc: any) => ({
          id: doc.id.toString(),
          tipo: doc.tipo,
          nome: doc.nome,
          numero: doc.numero,
          orgaoEmissor: doc.orgao_emissor,
          dataEmissao: doc.data_emissao,
          dataVencimento: doc.data_vencimento,
          arquivoUrl: doc.arquivo_url,
          observacoes: doc.observacoes
        }))
        setDocumentos(docsFormatados)
      }

      // Carregar histórico de obras
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.60.118:3001'
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const obrasResponse = await fetch(
            `${apiUrl}/api/funcionarios/${funcionarioId}/historico-obras`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
          if (obrasResponse.ok) {
            const obrasData = await obrasResponse.json()
            setObrasFuncionario(obrasData.data || [])
          }
        } catch (obrasError) {
          // Silenciar erro, apenas não carregar obras
        }
      }

    } catch (error) {
      // Não mostrar erro para não atrapalhar se alguma tab falhar
    }
  }

  // Carregar tipos de benefícios disponíveis
  useEffect(() => {
    const carregarTiposBeneficios = async () => {
      try {
        const response = await rhApi.listarTiposBeneficios()
        if (response.success && response.data) {
          setTiposBeneficios(response.data)
        }
      } catch (error) {
        console.error('Erro ao carregar tipos de benefícios:', error)
      }
    }
    carregarTiposBeneficios()
  }, [])

  // Função para carregar dados do funcionário (exportada para ser usada em outros lugares)
  const carregarFuncionario = async () => {
    try {
      setLoading(true)
      const funcionarioId = parseInt(params.id as string)
      const response = await funcionariosApi.obterFuncionario(funcionarioId)
      
      if (response.success && response.data) {
        const func = response.data
        
        // Mapear dados do backend para o formato esperado
        const funcAny = func as any
        const funcionarioMapeado: FuncionarioRH = {
          id: func.id,
          nome: func.nome,
          cpf: func.cpf || '',
          cargo: func.cargo,
          departamento: funcAny.departamento || '',
          salario: func.salario || 0,
          data_admissao: func.data_admissao || '',
          telefone: func.telefone,
          email: func.email,
          endereco: funcAny.endereco || '',
          cidade: funcAny.cidade || '',
          estado: funcAny.estado || '',
          cep: funcAny.cep || '',
          status: func.status as any,
          turno: funcAny.turno as any,
          observacoes: func.observacoes,
          created_at: func.created_at,
          updated_at: func.updated_at,
          usuario: funcAny.usuario && Array.isArray(funcAny.usuario) && funcAny.usuario.length > 0 ? funcAny.usuario[0] : undefined,
          obra_atual: funcAny.obra_atual || undefined
        }
        
        setFuncionario(funcionarioMapeado)
        
        // Carregar dados das tabs
        await carregarDadosTabs(funcionarioId)
      } else {
        throw new Error('Funcionário não encontrado')
      }
      
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do funcionário",
        variant: "destructive"
      })
      router.push('/dashboard/rh')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados reais do funcionário
  useEffect(() => {
    if (params.id) {
      carregarFuncionario()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800'
      case 'Inativo': return 'bg-gray-100 text-gray-800'
      case 'Afastado': return 'bg-yellow-100 text-yellow-800'
      case 'Demitido': return 'bg-red-100 text-red-800'
      case 'calculado': return 'bg-blue-100 text-blue-800'
      case 'pago': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'normal': return 'bg-green-100 text-green-800'
      case 'atraso': return 'bg-yellow-100 text-yellow-800'
      case 'falta': return 'bg-red-100 text-red-800'
      case 'hora-extra': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo': return <UserCheck className="w-4 h-4" />
      case 'Inativo': return <UserX className="w-4 h-4" />
      case 'Afastado': return <AlertCircle className="w-4 h-4" />
      case 'Demitido': return <UserX className="w-4 h-4" />
      case 'calculado': return <Calculator className="w-4 h-4" />
      case 'pago': return <CheckCircle className="w-4 h-4" />
      case 'pendente': return <AlertCircle className="w-4 h-4" />
      case 'normal': return <CheckCircle className="w-4 h-4" />
      case 'atraso': return <AlertCircle className="w-4 h-4" />
      case 'falta': return <AlertCircle className="w-4 h-4" />
      case 'hora-extra': return <TrendingUp className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getTipoDocumentoColor = (tipo: string) => {
    switch (tipo) {
      case 'rg': return 'bg-blue-100 text-blue-800'
      case 'cpf': return 'bg-green-100 text-green-800'
      case 'ctps': return 'bg-purple-100 text-purple-800'
      case 'pis': return 'bg-orange-100 text-orange-800'
      case 'titulo-eleitor': return 'bg-red-100 text-red-800'
      case 'certificado-reservista': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoBeneficioColor = (tipo: string) => {
    switch (tipo) {
      case 'plano-saude': return 'bg-green-100 text-green-800'
      case 'plano-odonto': return 'bg-blue-100 text-blue-800'
      case 'seguro-vida': return 'bg-purple-100 text-purple-800'
      case 'vale-transporte': return 'bg-orange-100 text-orange-800'
      case 'vale-refeicao': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEdit = () => {
    if (!isEditMode && funcionario) {
      // Preencher formulário com dados atuais
      setEditFormData({
        nome: funcionario.nome || '',
        email: funcionario.email || '',
        telefone: funcionario.telefone || '',
        cpf: funcionario.cpf || '',
        cargo: funcionario.cargo || '',
        departamento: funcionario.departamento || '',
        turno: funcionario.turno || 'Diurno',
        status: funcionario.status || 'Ativo',
        data_admissao: funcionario.data_admissao || '',
        salario: funcionario.salario ? funcionario.salario.toString() : '',
        endereco: funcionario.endereco || '',
        cidade: funcionario.cidade || '',
        estado: funcionario.estado || '',
        cep: funcionario.cep || '',
        observacoes: funcionario.observacoes || ''
      })
    }
    setIsEditMode(!isEditMode)
    toast({
      title: isEditMode ? "Modo Visualização" : "Modo Edição",
      description: isEditMode ? "Alterações canceladas" : "Agora você pode editar as informações",
    })
  }

  const handleSave = async () => {
    if (!funcionario) return

    try {
      setSubmitting(true)

      // Preparar dados para atualização
      const updateData = {
        nome: editFormData.nome,
        email: editFormData.email,
        telefone: editFormData.telefone,
        cpf: editFormData.cpf,
        cargo: editFormData.cargo,
        turno: editFormData.turno,
        status: editFormData.status,
        data_admissao: editFormData.data_admissao,
        salario: editFormData.salario ? parseFloat(editFormData.salario) : undefined,
        observacoes: editFormData.observacoes
      }

      // Atualizar funcionário via API
      const response = await funcionariosApi.atualizarFuncionario(funcionario.id, updateData)

      if (response.success) {
        // Recarregar dados do funcionário
        await carregarFuncionario()
        setIsEditMode(false)
        toast({
          title: "Sucesso",
          description: "Informações atualizadas com sucesso!",
        })
      } else {
        throw new Error('Erro ao atualizar funcionário')
      }
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar informações do funcionário",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetBeneficioForm = () => {
    setBeneficioForm({
      tipo: '',
      dataInicio: '',
      observacoes: ''
    })
  }
  
  const resetDocumentoForm = () => {
    setDocumentoForm({
      tipo: '',
      nome: '',
      numero: '',
      orgaoEmissor: '',
      dataEmissao: '',
      dataVencimento: '',
      observacoes: ''
    })
  }
  
  const handleCriarBeneficio = async () => {
    try {
      // Validação básica
      if (!beneficioForm.tipo || !beneficioForm.dataInicio) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Tipo de Benefício e Data Início)",
          variant: "destructive"
        })
        return
      }
      
      const funcionarioId = parseInt(params.id as string)
      
      // Chamar API para adicionar benefício
      const response = await rhApi.adicionarBeneficioFuncionario({
        funcionario_id: funcionarioId,
        beneficio_tipo_id: parseInt(beneficioForm.tipo),
        data_inicio: beneficioForm.dataInicio,
        observacoes: beneficioForm.observacoes || undefined
      } as any)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Benefício adicionado com sucesso!",
        })
        
        // Recarregar benefícios
        await carregarDadosTabs(funcionarioId)
        
        setIsBeneficioDialogOpen(false)
        resetBeneficioForm()
      } else {
        throw new Error(response.message || 'Erro ao adicionar benefício')
      }
    } catch (error) {
      console.error('Erro ao criar benefício:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar benefício",
        variant: "destructive"
      })
    }
  }

  const handleEditarBeneficio = (beneficio: BeneficioFuncionario) => {
    setBeneficioSelecionado(beneficio)
    setBeneficioForm({
      tipo: beneficio.beneficio_tipo_id.toString(),
      dataInicio: beneficio.data_inicio.split('T')[0],
      observacoes: beneficio.observacoes || ''
    })
    setIsEditBeneficioDialogOpen(true)
  }

  const handleSalvarEdicaoBeneficio = async () => {
    if (!beneficioSelecionado) return
    
    try {
      // Validação básica
      if (!beneficioForm.tipo || !beneficioForm.dataInicio) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Tipo de Benefício e Data Início)",
          variant: "destructive"
        })
        return
      }
      
      const funcionarioId = parseInt(params.id as string)
      
      // Chamar API para atualizar benefício
      const response = await rhApi.atualizarBeneficioFuncionario(beneficioSelecionado.id, {
        funcionario_id: funcionarioId,
        beneficio_tipo_id: parseInt(beneficioForm.tipo),
        data_inicio: beneficioForm.dataInicio,
        observacoes: beneficioForm.observacoes || undefined
      } as any)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Benefício atualizado com sucesso!",
        })
        
        // Recarregar benefícios
        await carregarDadosTabs(funcionarioId)
        
        setIsEditBeneficioDialogOpen(false)
        setBeneficioSelecionado(null)
        resetBeneficioForm()
      } else {
        throw new Error(response.message || 'Erro ao atualizar benefício')
      }
    } catch (error) {
      console.error('Erro ao atualizar benefício:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar benefício",
        variant: "destructive"
      })
    }
  }

  const handleRemoverBeneficio = async (beneficioId: number) => {
    if (!confirm('Tem certeza que deseja remover este benefício?')) {
      return
    }
    
    try {
      const funcionarioId = parseInt(params.id as string)
      
      // Chamar API para excluir benefício
      const response = await rhApi.excluirBeneficioFuncionario(beneficioId)
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Benefício removido com sucesso!",
        })
        
        // Recarregar benefícios
        await carregarDadosTabs(funcionarioId)
      } else {
        throw new Error(response.message || 'Erro ao remover benefício')
      }
    } catch (error) {
      console.error('Erro ao remover benefício:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover benefício",
        variant: "destructive"
      })
    }
  }
  
  const handleCriarDocumento = async () => {
    try {
      // Validação básica
      if (!documentoForm.tipo || !documentoForm.nome || !documentoForm.numero) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios (Tipo, Nome e Número)",
          variant: "destructive"
        })
        return
      }
      
      const funcionarioId = parseInt(params.id as string)
      
      // Chamar API para adicionar documento
      const response = await funcionariosApi.criarDocumento({
        funcionario_id: funcionarioId,
        tipo: documentoForm.tipo,
        nome: documentoForm.nome,
        numero: documentoForm.numero,
        orgao_emissor: documentoForm.orgaoEmissor || undefined,
        data_emissao: documentoForm.dataEmissao || undefined,
        data_vencimento: documentoForm.dataVencimento || undefined,
        observacoes: documentoForm.observacoes || undefined
      })
      
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Documento adicionado com sucesso!",
        })
        
        // Recarregar documentos
        await carregarDadosTabs(funcionarioId)
        
        setIsDocumentoDialogOpen(false)
        resetDocumentoForm()
      } else {
        throw new Error(response.message || 'Erro ao adicionar documento')
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar documento",
        variant: "destructive"
      })
    }
  }

  const calcularSalario = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Salário Calculado",
        description: "Cálculo de salário realizado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao calcular salário",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando informações do funcionário...</p>
        </div>
      </div>
    )
  }

  if (!funcionario) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Funcionário não encontrado</h2>
        <p className="text-gray-600 mb-4">O funcionário solicitado não foi encontrado.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{funcionario.nome}</h1>
            <p className="text-gray-600">{funcionario.cargo}{funcionario.departamento ? ` • ${funcionario.departamento}` : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditMode ? 'Cancelar' : 'Editar'}
          </Button>
          {isEditMode && (
            <Button onClick={handleSave} disabled={submitting}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={`/api/avatar/${funcionario.id}`} />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                {getInitials(funcionario.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                    <p className="text-lg font-semibold">{funcionario.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">CPF</Label>
                    <p className="text-sm">{funcionario.cpf}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cargo</Label>
                    <p className="text-sm">{funcionario.cargo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                    <p className="text-sm">{funcionario.departamento || '-'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(funcionario.status)} border`}>
                        {getStatusIcon(funcionario.status)}
                        <span className="ml-1">{funcionario.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Admissão</Label>
                    <p className="text-sm">{funcionario.data_admissao ? format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Salário</Label>
                    <p className="text-sm font-semibold">R$ {(funcionario.salario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Obra Atual</Label>
                    <p className="text-sm">{funcionario.obra_atual?.nome || 'Sem obra'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Usuário do Sistema</Label>
                    <div className="flex items-center gap-2">
                      {funcionario.usuario ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600">{funcionario.usuario.email}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Sem usuário</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="salarios">Salários</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="documentos-admissionais">Admissionais</TabsTrigger>
          <TabsTrigger value="holerites">Holerites</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="pontos">Pontos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Tab Informações */}
        <TabsContent value="informacoes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.email || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.telefone}
                      onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.telefone || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.endereco}
                      onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                      placeholder="Rua, número, complemento"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.endereco || '-'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cidade</Label>
                    {isEditMode ? (
                      <Input
                        value={editFormData.cidade}
                        onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                        placeholder="Cidade"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm">{funcionario.cidade || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estado</Label>
                    {isEditMode ? (
                      <Input
                        value={editFormData.estado}
                        onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                        placeholder="UF"
                        maxLength={2}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm">{funcionario.estado || '-'}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CEP</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.cep}
                      onChange={(e) => setEditFormData({ ...editFormData, cep: e.target.value })}
                      placeholder="00000-000"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{funcionario.cep || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Dados Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Turno</Label>
                  {isEditMode ? (
                    <Select
                      value={editFormData.turno}
                      onValueChange={(value) => setEditFormData({ ...editFormData, turno: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diurno">Diurno</SelectItem>
                        <SelectItem value="Noturno">Noturno</SelectItem>
                        <SelectItem value="Sob Demanda">Sob Demanda</SelectItem>
                        <SelectItem value="Integral">Integral</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{funcionario.turno || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  {isEditMode ? (
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({ ...editFormData, status: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Afastado">Afastado</SelectItem>
                        <SelectItem value="Demitido">Demitido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      <Badge className={`${getStatusColor(funcionario.status)} border`}>
                        {getStatusIcon(funcionario.status)}
                        <span className="ml-1">{funcionario.status}</span>
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  {isEditMode ? (
                    <Textarea
                      value={editFormData.observacoes}
                      onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                      placeholder="Observações sobre o funcionário"
                      className="mt-1"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm">{funcionario.observacoes || '-'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card de Dados Básicos (Nome, CPF, Cargo, Salário) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Básicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.nome}
                      onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                      placeholder="Nome completo"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-semibold mt-1">{funcionario.nome}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">CPF</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.cpf}
                      onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{funcionario.cpf}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cargo</Label>
                  {isEditMode ? (
                    <Select
                      value={editFormData.cargo}
                      onValueChange={(value) => setEditFormData({ ...editFormData, cargo: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARGOS_PREDEFINIDOS.map((cargo) => (
                          <SelectItem key={cargo} value={cargo}>
                            {cargo}
                          </SelectItem>
                        ))}
                        {/* Se o cargo atual não estiver na lista, mostrar também */}
                        {editFormData.cargo && !CARGOS_PREDEFINIDOS.some(c => c.toLowerCase() === editFormData.cargo.toLowerCase()) && (
                          <SelectItem value={editFormData.cargo}>
                            {editFormData.cargo}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm mt-1">{funcionario.cargo}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Departamento</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.departamento}
                      onChange={(e) => setEditFormData({ ...editFormData, departamento: e.target.value })}
                      placeholder="Departamento"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{funcionario.departamento || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Admissão</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editFormData.data_admissao}
                      onChange={(e) => setEditFormData({ ...editFormData, data_admissao: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {funcionario.data_admissao ? format(new Date(funcionario.data_admissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Salário</Label>
                  {isEditMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editFormData.salario}
                      onChange={(e) => setEditFormData({ ...editFormData, salario: e.target.value })}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-semibold mt-1">
                      R$ {(funcionario.salario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Salários */}
        <TabsContent value="salarios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Histórico de Salários</CardTitle>
                  <CardDescription>Controle de salários e pagamentos</CardDescription>
                </div>
                <Button onClick={calcularSalario} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Calcular Salário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salarios.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês/Ano</TableHead>
                      <TableHead>Salário Base</TableHead>
                      <TableHead>Proventos</TableHead>
                      <TableHead>Descontos</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salarios.map((salario) => (
                      <TableRow key={salario.id}>
                        <TableCell>
                          <span className="font-medium">
                            {salario.mes}/{salario.ano}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">R$ {(salario.salario_base || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            R$ {(salario.total_proventos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-red-600">
                            R$ {(salario.total_descontos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-blue-600">
                            R$ {(salario.salario_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(salario.status)} border`}>
                            {getStatusIcon(salario.status)}
                            <span className="ml-1">{salario.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {salario.data_pagamento ? format(new Date(salario.data_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum registro de salário encontrado</p>
                  <p className="text-sm">Os dados de salários serão implementados em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Benefícios */}
        <TabsContent value="beneficios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Benefícios do Funcionário</CardTitle>
                  <CardDescription>Benefícios oferecidos ao funcionário</CardDescription>
                </div>
                <Dialog open={isBeneficioDialogOpen} onOpenChange={setIsBeneficioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Benefício
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Benefício</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo-beneficio">Tipo de Benefício *</Label>
                        <Select
                          value={beneficioForm.tipo}
                          onValueChange={(value) => setBeneficioForm({ ...beneficioForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposBeneficios.length === 0 ? (
                              <SelectItem value="loading" disabled>Carregando tipos...</SelectItem>
                            ) : (
                              tiposBeneficios.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.tipo} - R$ {parseFloat(tipo.valor || '0').toFixed(2)}
                                  {tipo.descricao && ` (${tipo.descricao})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="data-inicio-beneficio">Data de Início *</Label>
                        <Input
                          id="data-inicio-beneficio"
                          type="date"
                          value={beneficioForm.dataInicio}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, dataInicio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="observacoes-beneficio">Observações</Label>
                        <Textarea
                          id="observacoes-beneficio"
                          placeholder="Informações adicionais sobre o benefício"
                          value={beneficioForm.observacoes}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsBeneficioDialogOpen(false)
                            resetBeneficioForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCriarBeneficio}>
                          Adicionar Benefício
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Dialog de Editar Benefício */}
                <Dialog open={isEditBeneficioDialogOpen} onOpenChange={setIsEditBeneficioDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Benefício</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo-beneficio-edit">Tipo de Benefício *</Label>
                        <Select
                          value={beneficioForm.tipo}
                          onValueChange={(value) => setBeneficioForm({ ...beneficioForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposBeneficios.length === 0 ? (
                              <SelectItem value="loading" disabled>Carregando tipos...</SelectItem>
                            ) : (
                              tiposBeneficios.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.tipo} - R$ {parseFloat(tipo.valor || '0').toFixed(2)}
                                  {tipo.descricao && ` (${tipo.descricao})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="data-inicio-beneficio-edit">Data de Início *</Label>
                        <Input
                          id="data-inicio-beneficio-edit"
                          type="date"
                          value={beneficioForm.dataInicio}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, dataInicio: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="observacoes-beneficio-edit">Observações</Label>
                        <Textarea
                          id="observacoes-beneficio-edit"
                          placeholder="Informações adicionais sobre o benefício"
                          value={beneficioForm.observacoes}
                          onChange={(e) => setBeneficioForm({ ...beneficioForm, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditBeneficioDialogOpen(false)
                            setBeneficioSelecionado(null)
                            resetBeneficioForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSalvarEdicaoBeneficio}>
                          Salvar Alterações
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {beneficios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {beneficios.map((beneficio) => (
                    <Card key={beneficio.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Gift className="w-5 h-5" />
                            {beneficio.beneficios_tipo?.descricao || 'Benefício'}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditarBeneficio(beneficio)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverBeneficio(beneficio.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo:</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              {beneficio.beneficios_tipo?.tipo || 'N/A'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Valor:</span>
                            <span className="font-semibold">R$ {(beneficio.beneficios_tipo?.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Data Início:</span>
                            <span className="text-sm">{format(new Date(beneficio.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          {beneficio.data_fim && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Data Fim:</span>
                              <span className="text-sm">{format(new Date(beneficio.data_fim), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge className={beneficio.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {beneficio.status}
                            </Badge>
                          </div>
                          {beneficio.observacoes && (
                            <div>
                              <span className="text-sm text-gray-600">Observações:</span>
                              <p className="text-sm">{beneficio.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum benefício cadastrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Certificados */}
        <TabsContent value="certificados" className="space-y-6">
          {funcionario && (
            <ColaboradorCertificados
              colaboradorId={funcionario.id}
              readOnly={false}
            />
          )}
        </TabsContent>

        {/* Tab Documentos Admissionais */}
        <TabsContent value="documentos-admissionais" className="space-y-6">
          {funcionario && funcionario.id ? (
            <ColaboradorDocumentosAdmissionais
              colaboradorId={funcionario.id}
              readOnly={false}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Carregando dados do funcionário...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Holerites */}
        <TabsContent value="holerites" className="space-y-6">
          {funcionario && (
            <ColaboradorHolerites
              colaboradorId={funcionario.id}
              readOnly={false}
              isCliente={false}
              isFuncionario={false}
            />
          )}
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Documentos do Funcionário</CardTitle>
                  <CardDescription>Documentos pessoais e profissionais</CardDescription>
                </div>
                <Dialog open={isDocumentoDialogOpen} onOpenChange={setIsDocumentoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Novo Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tipo-documento">Tipo de Documento *</Label>
                        <Select
                          value={documentoForm.tipo}
                          onValueChange={(value) => setDocumentoForm({ ...documentoForm, tipo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rg">RG</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="ctps">Carteira de Trabalho</SelectItem>
                            <SelectItem value="pis">PIS/PASEP</SelectItem>
                            <SelectItem value="titulo-eleitor">Título de Eleitor</SelectItem>
                            <SelectItem value="certificado-reservista">Certificado de Reservista</SelectItem>
                            <SelectItem value="comprovante-residencia">Comprovante de Residência</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="nome-documento">Nome do Documento *</Label>
                        <Input
                          id="nome-documento"
                          placeholder="Ex: RG, CPF, etc"
                          value={documentoForm.nome}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero-documento">Número do Documento *</Label>
                        <Input
                          id="numero-documento"
                          placeholder="Ex: 12.345.678-9"
                          value={documentoForm.numero}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, numero: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="orgao-emissor">Órgão Emissor</Label>
                        <Input
                          id="orgao-emissor"
                          placeholder="Ex: SSP/PE, Receita Federal, etc"
                          value={documentoForm.orgaoEmissor}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, orgaoEmissor: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="data-emissao">Data de Emissão *</Label>
                          <Input
                            id="data-emissao"
                            type="date"
                            value={documentoForm.dataEmissao}
                            onChange={(e) => setDocumentoForm({ ...documentoForm, dataEmissao: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="data-vencimento">Data de Vencimento</Label>
                          <Input
                            id="data-vencimento"
                            type="date"
                            value={documentoForm.dataVencimento}
                            onChange={(e) => setDocumentoForm({ ...documentoForm, dataVencimento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="observacoes-documento">Observações</Label>
                        <Textarea
                          id="observacoes-documento"
                          placeholder="Informações adicionais sobre o documento"
                          value={documentoForm.observacoes}
                          onChange={(e) => setDocumentoForm({ ...documentoForm, observacoes: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDocumentoDialogOpen(false)
                            resetDocumentoForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCriarDocumento}>
                          Adicionar Documento
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Data Vencimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentos.map((documento) => (
                      <TableRow key={documento.id}>
                        <TableCell>
                          <Badge className={`${getTipoDocumentoColor(documento.tipo)} border`}>
                            {documento.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{documento.nome}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{documento.numero}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(documento.dataEmissao), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {documento.dataVencimento ? format(new Date(documento.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum documento cadastrado</p>
                  <p className="text-sm">Adicione documentos usando o botão acima</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pontos */}
        <TabsContent value="pontos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Ponto</CardTitle>
              <CardDescription>Controle de frequência e horas trabalhadas</CardDescription>
            </CardHeader>
            <CardContent>
              {pontos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Almoço</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pontos.map((ponto) => (
                      <TableRow key={ponto.id}>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(ponto.data), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{ponto.entrada || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{ponto.saida || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {ponto.saida_almoco && ponto.volta_almoco 
                              ? `${ponto.saida_almoco} - ${ponto.volta_almoco}`
                              : '-'
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{ponto.horas_trabalhadas.toFixed(1)}h</div>
                            {ponto.horas_extras > 0 && (
                              <div className="text-orange-600">+{ponto.horas_extras.toFixed(1)}h extra</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Building2 className="w-3 h-3" />
                            <span>{ponto.localizacao || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(ponto.status)} border`}>
                            {getStatusIcon(ponto.status)}
                            <span className="ml-1">{ponto.status}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum registro de ponto encontrado</p>
                  <p className="text-sm">Os registros de ponto serão implementados em breve</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
              <CardDescription>Timeline de eventos e mudanças</CardDescription>
            </CardHeader>
            <CardContent>
              {historico.length > 0 ? (
                <div className="space-y-4">
                  {historico.map((evento) => (
                    <div key={evento.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <History className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{evento.titulo}</h4>
                            <Badge className="bg-purple-100 text-purple-800 mb-2">
                              {evento.tipo}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">{evento.descricao}</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-800">
                            {format(new Date(evento.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Registrado em {format(new Date(evento.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum evento registrado no histórico</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}