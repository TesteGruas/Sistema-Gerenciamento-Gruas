"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Home,
  User,
  Calendar,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  X,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { AlugueisAPI, AluguelResidencia, ContaRecorrenteAluguel, formatarMoeda } from '@/lib/api-alugueis-residencias'
import { CobrancasAluguelAPI, CobrancaAluguel, formatarMes } from '@/lib/api-cobrancas-aluguel'
import { apiContasBancarias, ContaBancaria } from '@/lib/api-contas-bancarias'
import { boletosApi, Boleto } from '@/lib/api-boletos'

export default function AluguelDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const aluguelId = params?.id as string

  const [aluguel, setAluguel] = useState<AluguelResidencia | null>(null)
  const [cobrancas, setCobrancas] = useState<CobrancaAluguel[]>([])
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [contasRecorrentes, setContasRecorrentes] = useState<ContaRecorrenteAluguel[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateCobrancaOpen, setIsCreateCobrancaOpen] = useState(false)
  const [isAddCustoOpen, setIsAddCustoOpen] = useState(false)
  const [isEditCobrancaOpen, setIsEditCobrancaOpen] = useState(false)
  const [isContaRecorrenteOpen, setIsContaRecorrenteOpen] = useState(false)
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<CobrancaAluguel | null>(null)
  const [contaRecorrenteSelecionada, setContaRecorrenteSelecionada] = useState<ContaRecorrenteAluguel | null>(null)
  const [subindoArquivoContaRecorrente, setSubindoArquivoContaRecorrente] = useState(false)

  // Formulário de cobrança mensal (aluguel)
  const [formCobranca, setFormCobranca] = useState({
    mes: '',
    conta_bancaria_id: '',
    valor_aluguel: 0,
    valor_custos: 0, // Mantido para edição
    data_vencimento: '',
    boleto_id: '',
    boletoFile: null as File | null,
    observacoes: ''
  })

  // Formulário de custo adicional
  const [formCusto, setFormCusto] = useState({
    mes: '',
    tipo_custo: 'luz' as 'luz' | 'agua' | 'energia' | 'outros',
    valor: 0,
    descricao: '',
    conta_bancaria_id: '',
    boleto_id: '',
    boletoFile: null as File | null,
    observacoes: ''
  })

  // Formulário de conta recorrente
  const [formContaRecorrente, setFormContaRecorrente] = useState({
    nome_conta: '',
    tipo_conta: 'luz' as 'luz' | 'agua' | 'energia' | 'internet' | 'gas' | 'condominio' | 'outros',
    valor_mensal: 0,
    dia_vencimento: '',
    arquivo_pdf: '',
    observacoes: '',
    ativo: true
  })

  useEffect(() => {
    if (aluguelId) {
      carregarDados()
      carregarContasBancarias()
      carregarBoletos()
    }
  }, [aluguelId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [aluguelData, cobrancasResponse, contasRecorrentesData] = await Promise.all([
        AlugueisAPI.buscarPorId(aluguelId),
        CobrancasAluguelAPI.listar({ aluguel_id: aluguelId }),
        AlugueisAPI.listarContasRecorrentes(aluguelId)
      ])
      
      // Garantir que cobrancasResponse seja um array
      let cobrancasData = []
      if (Array.isArray(cobrancasResponse)) {
        cobrancasData = cobrancasResponse
      } else if (cobrancasResponse?.data && Array.isArray(cobrancasResponse.data)) {
        cobrancasData = cobrancasResponse.data
      } else if (cobrancasResponse?.success && Array.isArray(cobrancasResponse.data)) {
        cobrancasData = cobrancasResponse.data
      }

      if (aluguelData) {
        setAluguel(aluguelData)
        // Preencher formulário com valores padrão
        const hoje = new Date()
        const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
        const mesFormatado = proximoMes.toISOString().slice(0, 7)
        const diaVencimento = aluguelData.contrato.diaVencimento || 5
        const dataVencimento = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), diaVencimento).toISOString().split('T')[0]

        setFormCobranca({
          mes: mesFormatado,
          conta_bancaria_id: '',
          valor_aluguel: aluguelData.contrato.valorMensal,
          valor_custos: 0,
          data_vencimento: dataVencimento,
          boleto_id: '',
          observacoes: ''
        })
      }

      // Garantir que cobrancasData seja um array e filtrar canceladas
      const cobrancasArray = Array.isArray(cobrancasData) 
        ? cobrancasData.filter(c => c?.status !== 'cancelado')
        : []
      setCobrancas(cobrancasArray)
      setContasRecorrentes(Array.isArray(contasRecorrentesData) ? contasRecorrentesData : [])
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar dados',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarContasBancarias = async () => {
    try {
      const response = await apiContasBancarias.listar()
      console.log('📊 [COBRANCAS-ALUGUEL] Resposta das contas:', response)
      
      // A API retorna response.data que contém { success: true, data: [...] }
      let contasArray = []
      
      if (response?.success && Array.isArray(response.data)) {
        contasArray = response.data
      } else if (Array.isArray(response)) {
        contasArray = response
      } else if (response?.data && Array.isArray(response.data)) {
        contasArray = response.data
      }
      
      console.log('📊 [COBRANCAS-ALUGUEL] Array de contas:', contasArray)
      
      // Garantir que contasArray é um array antes de filtrar
      if (!Array.isArray(contasArray)) {
        console.warn('⚠️ [COBRANCAS-ALUGUEL] Resposta não é um array:', contasArray)
        setContasBancarias([])
        return
      }
      
      // Filtrar contas ativas (o campo é 'status' com valor 'ativa')
      const contasAtivas = contasArray.filter(c => 
        c && (c.status === 'ativa' || c.ativa === true)
      )
      
      console.log('📊 [COBRANCAS-ALUGUEL] Contas ativas:', contasAtivas)
      setContasBancarias(contasAtivas)
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error)
      setContasBancarias([])
    }
  }

  const carregarBoletos = async () => {
    try {
      const response = await boletosApi.list({ tipo: 'pagar', status: 'pendente', limit: 100 })
      const boletosData = Array.isArray(response) ? response : (response?.data || [])
      setBoletos(boletosData)
    } catch (error) {
      console.error('Erro ao carregar boletos:', error)
      setBoletos([])
    }
  }

  const handleCreateCobranca = async () => {
    if (!formCobranca.conta_bancaria_id || !formCobranca.mes || !formCobranca.data_vencimento) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      let boletoId = formCobranca.boleto_id && formCobranca.boleto_id !== 'none' ? parseInt(formCobranca.boleto_id) : undefined

      // Se houver arquivo de boleto, criar o boleto primeiro
      if (formCobranca.boletoFile && !boletoId) {
        const contaBancaria = contasBancarias.find(c => c.id.toString() === formCobranca.conta_bancaria_id)
        const descricaoBoleto = `Boleto Aluguel ${aluguel?.residencia.nome || 'Residência'} - ${formCobranca.mes}`
        
        const boletoData = {
          numero_boleto: `ALUG-${formCobranca.mes}-${Date.now()}`,
          descricao: descricaoBoleto,
          valor: formCobranca.valor_aluguel,
          data_emissao: new Date().toISOString().split('T')[0],
          data_vencimento: formCobranca.data_vencimento,
          tipo: 'pagar' as const,
          banco_origem_id: contaBancaria?.id,
          observacoes: formCobranca.observacoes || undefined
        }

        const boletoResponse = await boletosApi.create(boletoData)
        const boletoCriado = boletoResponse.success ? boletoResponse.data : (Array.isArray(boletoResponse.data) ? boletoResponse.data[0] : boletoResponse.data || boletoResponse)
        
        if (boletoCriado?.id) {
          boletoId = boletoCriado.id
          
          // Fazer upload do arquivo
          try {
            await boletosApi.uploadFile(boletoId, formCobranca.boletoFile!)
          } catch (uploadError: any) {
            console.error('Erro ao fazer upload do boleto:', uploadError)
            toast({
              title: 'Aviso',
              description: 'Boleto criado, mas houve erro ao fazer upload do arquivo',
              variant: 'destructive'
            })
          }
        } else {
          throw new Error('Erro ao criar boleto: resposta inválida')
        }
      }

      await CobrancasAluguelAPI.criar({
        aluguel_id: aluguelId,
        mes: formCobranca.mes,
        conta_bancaria_id: parseInt(formCobranca.conta_bancaria_id),
        valor_aluguel: formCobranca.valor_aluguel,
        valor_custos: 0,
        data_vencimento: formCobranca.data_vencimento,
        boleto_id: boletoId,
        observacoes: formCobranca.observacoes || undefined
      })

      toast({
        title: 'Sucesso',
        description: 'Cobrança mensal criada com sucesso'
      })

      setIsCreateCobrancaOpen(false)
      resetFormCobranca()
      carregarDados()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar cobrança',
        variant: 'destructive'
      })
    }
  }

  const handleAddCusto = async () => {
    if (!formCusto.conta_bancaria_id || !formCusto.mes || !formCusto.valor) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    if (formCusto.tipo_custo === 'outros' && !formCusto.descricao.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Quando o tipo é "Outros", a descrição é obrigatória',
        variant: 'destructive'
      })
      return
    }

    try {
      let boletoId = formCusto.boleto_id && formCusto.boleto_id !== 'none' ? parseInt(formCusto.boleto_id) : undefined

      // Se houver arquivo de boleto, criar o boleto primeiro
      if (formCusto.boletoFile && !boletoId) {
        const contaBancaria = contasBancarias.find(c => c.id.toString() === formCusto.conta_bancaria_id)
        const descricaoBoleto = `${formCusto.tipo_custo.toUpperCase()} - ${aluguel?.residencia.nome || 'Residência'} - ${formCusto.mes}${formCusto.descricao ? ` - ${formCusto.descricao}` : ''}`
        
        const [ano, mes] = formCusto.mes.split('-')
        const diaVencimento = aluguel?.contrato.diaVencimento || 5
        const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, diaVencimento).toISOString().split('T')[0]

        const boletoData = {
          numero_boleto: `${formCusto.tipo_custo.toUpperCase()}-${formCusto.mes}-${Date.now()}`,
          descricao: descricaoBoleto,
          valor: formCusto.valor,
          data_emissao: new Date().toISOString().split('T')[0],
          data_vencimento: dataVencimento,
          tipo: 'pagar' as const,
          banco_origem_id: contaBancaria?.id,
          observacoes: formCusto.observacoes || undefined
        }

        const boletoResponse = await boletosApi.create(boletoData)
        const boletoCriado = boletoResponse.success ? boletoResponse.data : (Array.isArray(boletoResponse.data) ? boletoResponse.data[0] : boletoResponse.data || boletoResponse)
        
        if (boletoCriado?.id) {
          boletoId = boletoCriado.id
          
          // Fazer upload do arquivo
          try {
            await boletosApi.uploadFile(boletoId, formCusto.boletoFile!)
          } catch (uploadError: any) {
            console.error('Erro ao fazer upload do boleto:', uploadError)
            toast({
              title: 'Aviso',
              description: 'Boleto criado, mas houve erro ao fazer upload do arquivo',
              variant: 'destructive'
            })
          }
        } else {
          throw new Error('Erro ao criar boleto: resposta inválida')
        }
      }

      // Buscar cobrança existente para o mês ou criar nova
      const cobrancaExistente = cobrancas.find(c => c.mes === formCusto.mes && c.status !== 'cancelado')
      
      if (cobrancaExistente) {
        // Adicionar custo à cobrança existente
        const novoValorCustos = (cobrancaExistente.valor_custos || 0) + formCusto.valor
        await CobrancasAluguelAPI.atualizar(cobrancaExistente.id, {
          valor_custos: novoValorCustos,
          boleto_id: boletoId || cobrancaExistente.boleto_id || null,
          observacoes: `${cobrancaExistente.observacoes || ''}\n${formCusto.tipo_custo.toUpperCase()}: ${formCusto.descricao || formCusto.tipo_custo} - ${formatarMoeda(formCusto.valor)}`.trim()
        })
      } else {
        // Criar nova cobrança do mês com mensalidade + custo avulso
        const [ano, mes] = formCusto.mes.split('-')
        const diaVencimento = aluguel?.contrato.diaVencimento || 5
        const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, diaVencimento).toISOString().split('T')[0]
        const valorMensalAluguel = Number(aluguel?.contrato?.valorMensal || 0)

        await CobrancasAluguelAPI.criar({
          aluguel_id: aluguelId,
          mes: formCusto.mes,
          conta_bancaria_id: parseInt(formCusto.conta_bancaria_id),
          valor_aluguel: valorMensalAluguel,
          valor_custos: formCusto.valor,
          data_vencimento: dataVencimento,
          boleto_id: boletoId,
          observacoes: `${formCusto.tipo_custo.toUpperCase()}: ${formCusto.descricao || formCusto.tipo_custo}${formCusto.observacoes ? ` - ${formCusto.observacoes}` : ''}`.trim()
        })
      }

      toast({
        title: 'Sucesso',
        description: 'Custo adicionado com sucesso'
      })

      setIsAddCustoOpen(false)
      resetFormCusto()
      carregarDados()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar custo',
        variant: 'destructive'
      })
    }
  }

  const resetFormCusto = () => {
    const hoje = new Date()
    const mesFormatado = hoje.toISOString().slice(0, 7)
    setFormCusto({
      mes: mesFormatado,
      tipo_custo: 'luz',
      valor: 0,
      descricao: '',
      conta_bancaria_id: '',
      boleto_id: '',
      boletoFile: null,
      observacoes: ''
    })
  }

  const resetFormContaRecorrente = () => {
    setFormContaRecorrente({
      nome_conta: '',
      tipo_conta: 'luz',
      valor_mensal: 0,
      dia_vencimento: aluguel?.contrato?.diaVencimento ? String(aluguel.contrato.diaVencimento) : '',
      arquivo_pdf: '',
      observacoes: '',
      ativo: true
    })
  }

  const handleUploadArquivoContaRecorrente = async (file?: File) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Formato inválido',
        description: 'Apenas arquivos PDF são permitidos para contas recorrentes.',
        variant: 'destructive'
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O PDF deve ter no máximo 10MB.',
        variant: 'destructive'
      })
      return
    }

    try {
      setSubindoArquivoContaRecorrente(true)
      const urlArquivo = await AlugueisAPI.uploadArquivoContaRecorrente(file)
      setFormContaRecorrente(prev => ({ ...prev, arquivo_pdf: urlArquivo }))
      toast({
        title: 'PDF enviado',
        description: 'Arquivo vinculado à conta recorrente.'
      })
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar o PDF.',
        variant: 'destructive'
      })
    } finally {
      setSubindoArquivoContaRecorrente(false)
    }
  }

  const handleSalvarContaRecorrente = async () => {
    if (!formContaRecorrente.nome_conta.trim() || !formContaRecorrente.valor_mensal) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe nome da conta e valor mensal.',
        variant: 'destructive'
      })
      return
    }

    try {
      const payload = {
        nome_conta: formContaRecorrente.nome_conta.trim(),
        tipo_conta: formContaRecorrente.tipo_conta,
        valor_mensal: formContaRecorrente.valor_mensal,
        dia_vencimento: formContaRecorrente.dia_vencimento ? parseInt(formContaRecorrente.dia_vencimento) : null,
        arquivo_pdf: formContaRecorrente.arquivo_pdf || null,
        observacoes: formContaRecorrente.observacoes || null,
        ativo: formContaRecorrente.ativo
      }

      if (contaRecorrenteSelecionada) {
        await AlugueisAPI.atualizarContaRecorrente(contaRecorrenteSelecionada.id, payload)
        toast({ title: 'Sucesso', description: 'Conta recorrente atualizada.' })
      } else {
        await AlugueisAPI.criarContaRecorrente(aluguelId, payload)
        toast({ title: 'Sucesso', description: 'Conta recorrente criada.' })
      }

      setIsContaRecorrenteOpen(false)
      setContaRecorrenteSelecionada(null)
      resetFormContaRecorrente()
      carregarDados()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a conta recorrente.',
        variant: 'destructive'
      })
    }
  }

  const abrirEditarContaRecorrente = (conta: ContaRecorrenteAluguel) => {
    setContaRecorrenteSelecionada(conta)
    setFormContaRecorrente({
      nome_conta: conta.nome_conta || '',
      tipo_conta: conta.tipo_conta || 'outros',
      valor_mensal: parseFloat(String(conta.valor_mensal || 0)),
      dia_vencimento: conta.dia_vencimento ? String(conta.dia_vencimento) : '',
      arquivo_pdf: conta.arquivo_pdf || '',
      observacoes: conta.observacoes || '',
      ativo: conta.ativo !== false
    })
    setIsContaRecorrenteOpen(true)
  }

  const handleInativarContaRecorrente = async (contaId: string) => {
    try {
      await AlugueisAPI.inativarContaRecorrente(contaId)
      toast({ title: 'Sucesso', description: 'Conta recorrente inativada.' })
      carregarDados()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível inativar a conta recorrente.',
        variant: 'destructive'
      })
    }
  }

  const handleEditCobranca = async () => {
    if (!cobrancaSelecionada) return

    try {
      await CobrancasAluguelAPI.atualizar(cobrancaSelecionada.id, {
        valor_custos: formCobranca.valor_custos,
        data_vencimento: formCobranca.data_vencimento,
        boleto_id: formCobranca.boleto_id && formCobranca.boleto_id !== 'none' ? parseInt(formCobranca.boleto_id) : null,
        observacoes: formCobranca.observacoes || undefined
      })

      toast({
        title: 'Sucesso',
        description: 'Cobrança atualizada com sucesso'
      })

      setIsEditCobrancaOpen(false)
      setCobrancaSelecionada(null)
      resetFormCobranca()
      carregarDados()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar cobrança',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteCobranca = async (id: string) => {
    try {
      await CobrancasAluguelAPI.cancelar(id)
      toast({
        title: 'Sucesso',
        description: 'Cobrança cancelada com sucesso'
      })
      // Aguardar um pouco antes de recarregar para garantir que o banco foi atualizado
      setTimeout(() => {
        carregarDados()
      }, 500)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cancelar cobrança',
        variant: 'destructive'
      })
    }
  }

  const abrirEditarCobranca = (cobranca: CobrancaAluguel) => {
    setCobrancaSelecionada(cobranca)
    setFormCobranca({
      mes: cobranca.mes,
      conta_bancaria_id: cobranca.conta_bancaria_id.toString(),
      valor_aluguel: cobranca.valor_aluguel,
      valor_custos: cobranca.valor_custos || 0,
      data_vencimento: cobranca.data_vencimento,
      boleto_id: cobranca.boleto_id?.toString() || '',
      observacoes: cobranca.observacoes || ''
    })
    setIsEditCobrancaOpen(true)
  }

  const resetFormCobranca = () => {
    if (aluguel) {
      const hoje = new Date()
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
      const mesFormatado = proximoMes.toISOString().slice(0, 7)
      const diaVencimento = aluguel.contrato.diaVencimento || 5
      const dataVencimento = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), diaVencimento).toISOString().split('T')[0]

      setFormCobranca({
        mes: mesFormatado,
        conta_bancaria_id: '',
        valor_aluguel: aluguel.contrato.valorMensal,
        valor_custos: 0,
        data_vencimento: dataVencimento,
        boleto_id: '',
        boletoFile: null,
        observacoes: ''
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'atrasado':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'cancelado':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago'
      case 'atrasado':
        return 'Atrasado'
      case 'cancelado':
        return 'Cancelado'
      default:
        return 'Pendente'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!aluguel) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aluguel não encontrado</p>
            <Button onClick={() => router.push('/dashboard/financeiro/alugueis')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Garantir que cobrancas seja um array antes de usar métodos de array
  const cobrancasArray = Array.isArray(cobrancas) ? cobrancas : []
  const mensalidadesCriadas = [...cobrancasArray]
    .filter((c) => Number(c?.valor_aluguel || 0) > 0)
    .sort((a, b) => (a.mes < b.mes ? 1 : -1))
  const valorTotalCobrancas = cobrancasArray.reduce((sum, c) => sum + (c?.valor_total || 0), 0)
  const cobrancasPagas = cobrancasArray.filter(c => c?.status === 'pago').length
  const cobrancasPendentes = cobrancasArray.filter(c => c?.status === 'pendente').length
  const cobrancasAtrasadas = cobrancasArray.filter(c => c?.status === 'atrasado').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/financeiro/alugueis')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Aluguel</h1>
            <p className="text-sm text-gray-500">{aluguel.residencia.nome}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateCobrancaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança Mensal
          </Button>
          <Button
            onClick={() => {
              setContaRecorrenteSelecionada(null)
              resetFormContaRecorrente()
              setIsContaRecorrenteOpen(true)
            }}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta Recorrente
          </Button>
          <Button onClick={() => setIsAddCustoOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Custo Avulso
          </Button>
        </div>
      </div>

      {/* Informações do Aluguel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Residência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-semibold">{aluguel.residencia.nome}</p>
                <p className="text-sm text-gray-500">
                  {aluguel.residencia.endereco}, {aluguel.residencia.cidade}/{aluguel.residencia.estado}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Funcionário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-semibold">{aluguel.funcionario.nome}</p>
                <p className="text-sm text-gray-500">{aluguel.funcionario.cargo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Valor Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <p className="text-2xl font-bold">{formatarMoeda(aluguel.contrato.valorMensal)}</p>
            </div>
            {aluguel.contrato.porcentagemDesconto && (
              <p className="text-sm text-blue-600 mt-1">
                Subsídio: {aluguel.contrato.porcentagemDesconto}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas de Cobranças */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Cobranças</p>
                <p className="text-2xl font-bold">{cobrancas.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pagas</p>
                <p className="text-2xl font-bold text-green-600">{cobrancasPagas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{cobrancasPendentes}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{cobrancasAtrasadas}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contas Recorrentes */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Recorrentes do Aluguel</CardTitle>
          <CardDescription>
            Mensalidade fixa + contas como luz, agua, energia, internet e outras (com PDF opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Mensalidades criadas por mês</p>
              {mensalidadesCriadas.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>Nenhuma mensalidade criada ainda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Valor Mensalidade</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mensalidadesCriadas.map((item) => (
                      <TableRow key={`mensalidade-${item.id}`}>
                        <TableCell className="font-medium">{formatarMes(item.mes)}</TableCell>
                        <TableCell>{formatarMoeda(Number(item.valor_aluguel || 0))}</TableCell>
                        <TableCell>{new Date(item.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">Outras contas recorrentes</p>
              {contasRecorrentes.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>Nenhuma conta recorrente cadastrada.</p>
                  <p className="text-xs mt-1">Cadastre para lançar automaticamente em contas a pagar todo mês.</p>
                </div>
              ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasRecorrentes.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">{conta.nome_conta}</TableCell>
                    <TableCell className="uppercase">{conta.tipo_conta}</TableCell>
                    <TableCell>{formatarMoeda(conta.valor_mensal || 0)}</TableCell>
                    <TableCell>{conta.dia_vencimento ? `Dia ${conta.dia_vencimento}` : `Dia ${aluguel.contrato.diaVencimento}`}</TableCell>
                    <TableCell>
                      {conta.arquivo_pdf ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(conta.arquivo_pdf || '', '_blank')}
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          Abrir
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500">Sem PDF</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={conta.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {conta.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditarContaRecorrente(conta)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {conta.ativo && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleInativarContaRecorrente(conta.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças Mensais</CardTitle>
          <CardDescription>
            Total: {formatarMoeda(valorTotalCobrancas)} | {cobrancasArray.length} cobrança(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cobrancasArray.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma cobrança registrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Valor Aluguel</TableHead>
                  <TableHead>Custos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobrancasArray.map((cobranca) => (
                  <TableRow key={cobranca.id}>
                    <TableCell className="font-medium">{formatarMes(cobranca.mes)}</TableCell>
                    <TableCell>
                      {cobranca.contas_bancarias?.banco || 'N/A'}
                    </TableCell>
                    <TableCell>{formatarMoeda(cobranca.valor_aluguel)}</TableCell>
                    <TableCell>{formatarMoeda(cobranca.valor_custos)}</TableCell>
                    <TableCell className="font-bold">{formatarMoeda(cobranca.valor_total)}</TableCell>
                    <TableCell>
                      {new Date(cobranca.data_vencimento).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(cobranca.status)}>
                        {getStatusLabel(cobranca.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEditarCobranca(cobranca)}
                          disabled={cobranca.status === 'cancelado'}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {cobranca.status !== 'cancelado' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar Cobrança</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja cancelar esta cobrança? A movimentação bancária também será removida.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCobranca(cobranca.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Conta Recorrente */}
      <Dialog open={isContaRecorrenteOpen} onOpenChange={setIsContaRecorrenteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{contaRecorrenteSelecionada ? 'Editar Conta Recorrente' : 'Nova Conta Recorrente'}</DialogTitle>
            <DialogDescription>
              Essas contas serão lançadas automaticamente em contas a pagar junto da mensalidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome da Conta *</Label>
                <Input
                  value={formContaRecorrente.nome_conta}
                  onChange={(e) => setFormContaRecorrente({ ...formContaRecorrente, nome_conta: e.target.value })}
                  placeholder="Ex: Conta de Luz"
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formContaRecorrente.tipo_conta}
                  onValueChange={(value: any) => setFormContaRecorrente({ ...formContaRecorrente, tipo_conta: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="luz">Luz</SelectItem>
                    <SelectItem value="agua">Água</SelectItem>
                    <SelectItem value="energia">Energia</SelectItem>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="gas">Gás</SelectItem>
                    <SelectItem value="condominio">Condomínio</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Mensal *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formContaRecorrente.valor_mensal}
                  onChange={(e) => setFormContaRecorrente({ ...formContaRecorrente, valor_mensal: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Dia de Vencimento (opcional)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formContaRecorrente.dia_vencimento}
                  onChange={(e) => setFormContaRecorrente({ ...formContaRecorrente, dia_vencimento: e.target.value })}
                  placeholder={`Padrão: dia ${aluguel.contrato.diaVencimento}`}
                />
              </div>
            </div>

            <div>
              <Label>PDF da Conta (opcional)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleUploadArquivoContaRecorrente(e.target.files?.[0])}
                  disabled={subindoArquivoContaRecorrente}
                />
                {subindoArquivoContaRecorrente && <span className="text-xs text-gray-500">Enviando...</span>}
              </div>
              {formContaRecorrente.arquivo_pdf && (
                <div className="mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => window.open(formContaRecorrente.arquivo_pdf, '_blank')}>
                    <FileText className="h-3 w-3 mr-1" />
                    Visualizar PDF
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formContaRecorrente.observacoes}
                onChange={(e) => setFormContaRecorrente({ ...formContaRecorrente, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsContaRecorrenteOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarContaRecorrente}>
                {contaRecorrenteSelecionada ? 'Salvar Alterações' : 'Criar Conta Recorrente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Cobrança Mensal */}
      <Dialog open={isCreateCobrancaOpen} onOpenChange={setIsCreateCobrancaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Cobrança Mensal</DialogTitle>
            <DialogDescription>
              Crie uma nova cobrança mensal do aluguel (sem custos adicionais)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês e Ano *</Label>
                <Input
                  type="month"
                  value={formCobranca.mes}
                  onChange={(e) => {
                    const [ano, mes] = e.target.value.split('-')
                    const diaVencimento = aluguel?.contrato.diaVencimento || 5
                    const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, diaVencimento).toISOString().split('T')[0]
                    setFormCobranca({ ...formCobranca, mes: e.target.value, data_vencimento: dataVencimento })
                  }}
                />
              </div>
              <div>
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={formCobranca.data_vencimento}
                  onChange={(e) => setFormCobranca({ ...formCobranca, data_vencimento: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Conta Bancária *</Label>
              <Select
                value={formCobranca.conta_bancaria_id}
                onValueChange={(value) => setFormCobranca({ ...formCobranca, conta_bancaria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map(conta => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.banco} - {conta.agencia}/{conta.conta} - Saldo: {formatarMoeda(conta.saldo_atual || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor do Aluguel *</Label>
              <Input
                type="number"
                step="0.01"
                value={formCobranca.valor_aluguel}
                onChange={(e) => setFormCobranca({ ...formCobranca, valor_aluguel: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Boleto (Opcional)</Label>
              <Select
                value={formCobranca.boleto_id && formCobranca.boleto_id !== '' ? formCobranca.boleto_id : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormCobranca({ ...formCobranca, boleto_id: '', boletoFile: null })
                  } else {
                    setFormCobranca({ ...formCobranca, boleto_id: value, boletoFile: null })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um boleto existente ou faça upload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Criar novo boleto com upload</SelectItem>
                  {boletos.map(boleto => (
                    <SelectItem key={boleto.id} value={boleto.id.toString()}>
                      {boleto.numero_boleto} - {boleto.descricao} - {formatarMoeda(boleto.valor)} - Venc: {new Date(boleto.data_vencimento).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formCobranca.boleto_id === '' || formCobranca.boleto_id === 'none') && (
              <div>
                <Label>Upload do Boleto (PDF ou Imagem)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast({
                            title: 'Arquivo muito grande',
                            description: 'O arquivo deve ter no máximo 10MB',
                            variant: 'destructive'
                          })
                          return
                        }
                        setFormCobranca({ ...formCobranca, boletoFile: file })
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {formCobranca.boletoFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{formCobranca.boletoFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormCobranca({ ...formCobranca, boletoFile: null })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</p>
              </div>
            )}
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formCobranca.observacoes}
                onChange={(e) => setFormCobranca({ ...formCobranca, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateCobrancaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCobranca}>
                Criar Cobrança Mensal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Custo */}
      <Dialog open={isAddCustoOpen} onOpenChange={setIsAddCustoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Custo Avulso</DialogTitle>
            <DialogDescription>
              Adicione um custo pontual para um mês específico (não recorrente)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês e Ano *</Label>
                <Input
                  type="month"
                  value={formCusto.mes}
                  onChange={(e) => setFormCusto({ ...formCusto, mes: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo de Custo *</Label>
                <Select
                  value={formCusto.tipo_custo}
                  onValueChange={(value: 'luz' | 'agua' | 'energia' | 'outros') => setFormCusto({ ...formCusto, tipo_custo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="luz">Luz</SelectItem>
                    <SelectItem value="agua">Água</SelectItem>
                    <SelectItem value="energia">Energia</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição {formCusto.tipo_custo === 'outros' ? '*' : '(Opcional)'}</Label>
              <Input
                value={formCusto.descricao}
                onChange={(e) => setFormCusto({ ...formCusto, descricao: e.target.value })}
                placeholder={formCusto.tipo_custo === 'outros' ? 'Descreva o custo' : 'Ex: Conta de luz de janeiro'}
              />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                value={formCusto.valor}
                onChange={(e) => setFormCusto({ ...formCusto, valor: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Conta Bancária *</Label>
              <Select
                value={formCusto.conta_bancaria_id}
                onValueChange={(value) => setFormCusto({ ...formCusto, conta_bancaria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map(conta => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.banco} - {conta.agencia}/{conta.conta} - Saldo: {formatarMoeda(conta.saldo_atual || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Boleto (Opcional)</Label>
              <Select
                value={formCusto.boleto_id && formCusto.boleto_id !== '' ? formCusto.boleto_id : 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormCusto({ ...formCusto, boleto_id: '', boletoFile: null })
                  } else {
                    setFormCusto({ ...formCusto, boleto_id: value, boletoFile: null })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um boleto existente ou faça upload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Criar novo boleto com upload</SelectItem>
                  {boletos.map(boleto => (
                    <SelectItem key={boleto.id} value={boleto.id.toString()}>
                      {boleto.numero_boleto} - {boleto.descricao} - {formatarMoeda(boleto.valor)} - Venc: {new Date(boleto.data_vencimento).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formCusto.boleto_id === '' || formCusto.boleto_id === 'none') && (
              <div>
                <Label>Upload do Boleto (PDF ou Imagem)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast({
                            title: 'Arquivo muito grande',
                            description: 'O arquivo deve ter no máximo 10MB',
                            variant: 'destructive'
                          })
                          return
                        }
                        setFormCusto({ ...formCusto, boletoFile: file })
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {formCusto.boletoFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{formCusto.boletoFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormCusto({ ...formCusto, boletoFile: null })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</p>
              </div>
            )}
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formCusto.observacoes}
                onChange={(e) => setFormCusto({ ...formCusto, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddCustoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCusto}>
                Adicionar Custo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Cobrança */}
      <Dialog open={isEditCobrancaOpen} onOpenChange={setIsEditCobrancaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cobrança</DialogTitle>
            <DialogDescription>
              Edite os custos adicionais e outras informações da cobrança
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês</Label>
                <Input value={formatarMes(formCobranca.mes)} disabled />
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formCobranca.data_vencimento}
                  onChange={(e) => setFormCobranca({ ...formCobranca, data_vencimento: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor do Aluguel</Label>
                <Input value={formatarMoeda(formCobranca.valor_aluguel)} disabled />
              </div>
              <div>
                <Label>Custos Adicionais (Luz, Água, etc.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formCobranca.valor_custos}
                  onChange={(e) => setFormCobranca({ ...formCobranca, valor_custos: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <Label>Valor Total</Label>
              <Input
                value={formatarMoeda(formCobranca.valor_aluguel + formCobranca.valor_custos)}
                disabled
                className="font-bold text-lg"
              />
            </div>
            <div>
              <Label>Boleto (Opcional)</Label>
              <Select
                value={formCobranca.boleto_id && formCobranca.boleto_id !== '' ? formCobranca.boleto_id : 'none'}
                onValueChange={(value) => setFormCobranca({ ...formCobranca, boleto_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um boleto para vincular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum boleto</SelectItem>
                  {boletos.map(boleto => (
                    <SelectItem key={boleto.id} value={boleto.id.toString()}>
                      {boleto.numero_boleto} - {boleto.descricao} - {formatarMoeda(boleto.valor)} - Venc: {new Date(boleto.data_vencimento).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formCobranca.observacoes}
                onChange={(e) => setFormCobranca({ ...formCobranca, observacoes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditCobrancaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditCobranca}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
