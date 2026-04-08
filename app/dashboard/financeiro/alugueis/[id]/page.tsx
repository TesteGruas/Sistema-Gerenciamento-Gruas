"use client"

import { useState, useEffect, useMemo } from 'react'
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
  Download,
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
import { AlugueisAPI, AluguelResidencia, formatarMoeda } from '@/lib/api-alugueis-residencias'
import { CobrancasAluguelAPI, CobrancaAluguel, formatarMes } from '@/lib/api-cobrancas-aluguel'
import { apiContasBancarias, ContaBancaria } from '@/lib/api-contas-bancarias'
import { boletosApi, Boleto } from '@/lib/api-boletos'

function boletoDaCobranca(cobranca: CobrancaAluguel) {
  const raw = cobranca.boletos
  if (raw == null) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function descricaoTipoCobranca(c: CobrancaAluguel) {
  const va = Number(c.valor_aluguel || 0)
  const vc = Number(c.valor_custos || 0)
  if (va > 0 && vc > 0) {
    return {
      titulo: 'Cobrança combinada',
      badge: 'Aluguel + custos',
      linha: `Aluguel ${formatarMoeda(va)} + custos ${formatarMoeda(vc)}`,
    }
  }
  if (va > 0 && vc === 0) {
    return {
      titulo: 'Cobrança de aluguel',
      badge: 'Aluguel',
      linha: `Aluguel ${formatarMoeda(va)}`,
    }
  }
  return {
    titulo: 'Custos mensais',
    badge: 'Custos',
    linha: `Total custos ${formatarMoeda(vc)}`,
  }
}

export default function AluguelDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const aluguelId = params?.id as string

  const [aluguel, setAluguel] = useState<AluguelResidencia | null>(null)
  const [cobrancas, setCobrancas] = useState<CobrancaAluguel[]>([])
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([])
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateCobrancaOpen, setIsCreateCobrancaOpen] = useState(false)
  const [isCreateCustosMensaisOpen, setIsCreateCustosMensaisOpen] = useState(false)
  const [isEditCobrancaOpen, setIsEditCobrancaOpen] = useState(false)
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<CobrancaAluguel | null>(null)
  /** `__all__` = todos os meses com cobrança (+ mês atual se vazio); senão YYYY-MM */
  const [mesFiltroUnificado, setMesFiltroUnificado] = useState<string | '__all__'>('__all__')

  // Formulário de cobrança mensal (aluguel)
  const [formCobranca, setFormCobranca] = useState({
    mes: '',
    conta_bancaria_id: '',
    valor_aluguel: 0,
    valor_custos: 0, // edição / registros antigos combinados
    data_vencimento: '',
    boleto_id: '',
    boletoFile: null as File | null,
    observacoes: ''
  })

  const [formCustosMensais, setFormCustosMensais] = useState({
    mes: '',
    conta_bancaria_id: '',
    valor_custos: 0,
    data_vencimento: '',
    boleto_id: '',
    boletoFile: null as File | null,
    observacoes: ''
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
      const [aluguelData, cobrancasResponse] = await Promise.all([
        AlugueisAPI.buscarPorId(aluguelId),
        CobrancasAluguelAPI.listar({ aluguel_id: aluguelId })
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
          boletoFile: null,
          observacoes: ''
        })
        setFormCustosMensais({
          mes: mesFormatado,
          conta_bancaria_id: '',
          valor_custos: 0,
          data_vencimento: dataVencimento,
          boleto_id: '',
          boletoFile: null,
          observacoes: ''
        })
      }

      // Garantir que cobrancasData seja um array e filtrar canceladas
      const cobrancasArray = Array.isArray(cobrancasData) 
        ? cobrancasData.filter(c => c?.status !== 'cancelado')
        : []
      setCobrancas(cobrancasArray)
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

    if (formCobranca.valor_aluguel <= 0) {
      toast({
        title: 'Valor do aluguel',
        description: 'Informe um valor de aluguel maior que zero.',
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
        
        const valorBoleto = formCobranca.valor_aluguel
        const boletoData = {
          numero_boleto: `ALUG-${formCobranca.mes}-${Date.now()}`,
          descricao: descricaoBoleto,
          valor: valorBoleto,
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
        description: 'Cobrança de aluguel criada com sucesso'
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

  const handleCreateCustosMensais = async () => {
    if (!formCustosMensais.conta_bancaria_id || !formCustosMensais.mes || !formCustosMensais.data_vencimento) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      })
      return
    }

    if (formCustosMensais.valor_custos <= 0) {
      toast({
        title: 'Valor dos custos',
        description: 'Informe o total de custos mensais maior que zero.',
        variant: 'destructive'
      })
      return
    }

    try {
      let boletoId =
        formCustosMensais.boleto_id && formCustosMensais.boleto_id !== 'none'
          ? parseInt(formCustosMensais.boleto_id)
          : undefined

      if (formCustosMensais.boletoFile && !boletoId) {
        const contaBancaria = contasBancarias.find(
          (c) => c.id.toString() === formCustosMensais.conta_bancaria_id
        )
        const descricaoBoleto = `Custos mensais ${aluguel?.residencia.nome || 'Residência'} - ${formCustosMensais.mes}`

        const boletoData = {
          numero_boleto: `CUST-${formCustosMensais.mes}-${Date.now()}`,
          descricao: descricaoBoleto,
          valor: formCustosMensais.valor_custos,
          data_emissao: new Date().toISOString().split('T')[0],
          data_vencimento: formCustosMensais.data_vencimento,
          tipo: 'pagar' as const,
          banco_origem_id: contaBancaria?.id,
          observacoes: formCustosMensais.observacoes || undefined,
        }

        const boletoResponse = await boletosApi.create(boletoData)
        const boletoCriado = boletoResponse.success
          ? boletoResponse.data
          : Array.isArray(boletoResponse.data)
            ? boletoResponse.data[0]
            : boletoResponse.data || boletoResponse

        if (boletoCriado?.id) {
          boletoId = boletoCriado.id
          try {
            await boletosApi.uploadFile(boletoId, formCustosMensais.boletoFile!)
          } catch (uploadError: any) {
            console.error('Erro ao fazer upload do boleto:', uploadError)
            toast({
              title: 'Aviso',
              description: 'Boleto criado, mas houve erro ao fazer upload do arquivo',
              variant: 'destructive',
            })
          }
        } else {
          throw new Error('Erro ao criar boleto: resposta inválida')
        }
      }

      await CobrancasAluguelAPI.criar({
        aluguel_id: aluguelId,
        mes: formCustosMensais.mes,
        conta_bancaria_id: parseInt(formCustosMensais.conta_bancaria_id),
        valor_aluguel: 0,
        valor_custos: formCustosMensais.valor_custos,
        data_vencimento: formCustosMensais.data_vencimento,
        boleto_id: boletoId,
        observacoes: formCustosMensais.observacoes || undefined,
      })

      toast({
        title: 'Sucesso',
        description: 'Cobrança de custos mensais criada com sucesso',
      })

      setIsCreateCustosMensaisOpen(false)
      resetFormCustosMensais()
      carregarDados()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar cobrança de custos',
        variant: 'destructive',
      })
    }
  }

  const resetFormCustosMensais = () => {
    if (!aluguel) return
    const hoje = new Date()
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    const mesFormatado = proximoMes.toISOString().slice(0, 7)
    const diaVencimento = aluguel.contrato.diaVencimento || 5
    const dataVencimento = new Date(
      proximoMes.getFullYear(),
      proximoMes.getMonth(),
      diaVencimento
    )
      .toISOString()
      .split('T')[0]

    setFormCustosMensais({
      mes: mesFormatado,
      conta_bancaria_id: '',
      valor_custos: 0,
      data_vencimento: dataVencimento,
      boleto_id: '',
      boletoFile: null,
      observacoes: '',
    })
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
      boletoFile: null,
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

  const cobrancasArray = useMemo(
    () => (Array.isArray(cobrancas) ? cobrancas : []),
    [cobrancas]
  )

  const mesesDisponiveis = useMemo(() => {
    const s = new Set(cobrancasArray.map((c) => c.mes).filter(Boolean))
    return Array.from(s).sort((a, b) => b.localeCompare(a))
  }, [cobrancasArray])

  const mesesParaSelect = useMemo(() => {
    const cur = new Date().toISOString().slice(0, 7)
    const set = new Set(mesesDisponiveis)
    set.add(cur)
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [mesesDisponiveis])

  const cobrancasNaTabela = useMemo(() => {
    if (mesFiltroUnificado === '__all__') {
      return [...cobrancasArray].sort((a, b) => a.mes.localeCompare(b.mes))
    }
    return cobrancasArray.filter((c) => c.mes === mesFiltroUnificado)
  }, [cobrancasArray, mesFiltroUnificado])

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
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              resetFormCobranca()
              setIsCreateCobrancaOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Cobrança de aluguel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetFormCustosMensais()
              setIsCreateCustosMensaisOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Cobrança de custos mensais
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

      {/* Cobranças por mês (cadastro manual; contas a pagar geradas na criação da cobrança) */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças por mês</CardTitle>
          <CardDescription>
            Use um botão para a cobrança de aluguel e outro para custos mensais (luz, água, condomínio etc.); no mesmo mês podem existir duas fichas, uma de cada tipo.
            Total: {formatarMoeda(valorTotalCobrancas)} · {cobrancasArray.length} ficha(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4 border-b pb-4">
            <div className="space-y-2">
              <Label htmlFor="mes-filtro-contas">Mês de competência</Label>
              <Select
                value={mesFiltroUnificado}
                onValueChange={(v) => setMesFiltroUnificado(v as string | '__all__')}
              >
                <SelectTrigger id="mes-filtro-contas" className="w-[min(100%,280px)]">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os meses</SelectItem>
                  {mesesParaSelect.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatarMes(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground max-w-md pb-2">
              Não há recorrência automática: use os botões de cobrança de aluguel e de custos mensais conforme o mês.
            </p>
          </div>

          {cobrancasNaTabela.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>Nenhuma cobrança para este filtro.</p>
              <p className="text-xs mt-2">Crie as cobranças do mês pelos botões acima.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cobrancasNaTabela.map((cobranca) => {
                    const tipo = descricaoTipoCobranca(cobranca)
                    return (
                    <TableRow key={`cob-${cobranca.id}-${cobranca.mes}`}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatarMes(cobranca.mes)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{tipo.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {tipo.linha}
                          {cobranca.contas_bancarias?.banco
                            ? ` · ${cobranca.contas_bancarias.banco}`
                            : ''}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {tipo.badge}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {formatarMoeda(cobranca.valor_total)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(cobranca.data_vencimento).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const bol = boletoDaCobranca(cobranca)
                          if (bol?.arquivo_boleto) {
                            return (
                              <Button variant="default" size="sm" className="gap-1" asChild>
                                <a
                                  href={bol.arquivo_boleto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir PDF do boleto"
                                >
                                  <Download className="h-3 w-3" />
                                  Boleto PDF
                                </a>
                              </Button>
                            )
                          }
                          if (bol?.linha_digitavel) {
                            const L = bol.linha_digitavel
                            return (
                              <span
                                className="text-[10px] font-mono leading-tight block max-w-[180px] break-all text-muted-foreground"
                                title={L}
                              >
                                {L.length > 40 ? `${L.slice(0, 40)}…` : L}
                              </span>
                            )
                          }
                          if (bol?.numero_boleto) {
                            return (
                              <span
                                className="text-xs font-mono text-muted-foreground"
                                title={bol.descricao || ''}
                              >
                                {bol.numero_boleto}
                              </span>
                            )
                          }
                          return <span className="text-xs text-muted-foreground">—</span>
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(cobranca.status)}>
                          {getStatusLabel(cobranca.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEditarCobranca(cobranca)}
                            disabled={cobranca.status === 'cancelado'}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {cobranca.status === 'cancelado'
                                    ? 'Cobrança já cancelada'
                                    : 'Cancelar cobrança'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {cobranca.status === 'cancelado'
                                    ? 'Esta cobrança já está cancelada. Confirmar novamente executa a limpeza no servidor (movimentações e vínculos).'
                                    : 'Tem certeza que deseja cancelar esta cobrança? A movimentação bancária também será removida.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCobranca(cobranca.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Cobrança de aluguel */}
      <Dialog open={isCreateCobrancaOpen} onOpenChange={setIsCreateCobrancaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cobrança de aluguel</DialogTitle>
            <DialogDescription>
              Lançamento só da mensalidade do contrato. Para custos (luz, água etc.) use &quot;Cobrança de custos mensais&quot;. Gera as contas a pagar correspondentes.
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
              <Label>Valor do aluguel *</Label>
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
                Criar cobrança de aluguel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Cobrança de custos mensais */}
      <Dialog open={isCreateCustosMensaisOpen} onOpenChange={setIsCreateCustosMensaisOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cobrança de custos mensais</DialogTitle>
            <DialogDescription>
              Total de custos do mês (luz, água, condomínio etc.) em um lançamento separado do aluguel. No mesmo mês pode existir também uma cobrança só de aluguel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês e Ano *</Label>
                <Input
                  type="month"
                  value={formCustosMensais.mes}
                  onChange={(e) => {
                    const [ano, mes] = e.target.value.split('-')
                    const diaVencimento = aluguel?.contrato.diaVencimento || 5
                    const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, diaVencimento)
                      .toISOString()
                      .split('T')[0]
                    setFormCustosMensais({
                      ...formCustosMensais,
                      mes: e.target.value,
                      data_vencimento: dataVencimento,
                    })
                  }}
                />
              </div>
              <div>
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={formCustosMensais.data_vencimento}
                  onChange={(e) =>
                    setFormCustosMensais({ ...formCustosMensais, data_vencimento: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Conta Bancária *</Label>
              <Select
                value={formCustosMensais.conta_bancaria_id}
                onValueChange={(value) =>
                  setFormCustosMensais({ ...formCustosMensais, conta_bancaria_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.banco} - {conta.agencia}/{conta.conta} - Saldo:{' '}
                      {formatarMoeda(conta.saldo_atual || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total de custos do mês *</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={formCustosMensais.valor_custos}
                onChange={(e) =>
                  setFormCustosMensais({
                    ...formCustosMensais,
                    valor_custos: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Boleto (Opcional)</Label>
              <Select
                value={
                  formCustosMensais.boleto_id && formCustosMensais.boleto_id !== ''
                    ? formCustosMensais.boleto_id
                    : 'none'
                }
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormCustosMensais({ ...formCustosMensais, boleto_id: '', boletoFile: null })
                  } else {
                    setFormCustosMensais({ ...formCustosMensais, boleto_id: value, boletoFile: null })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um boleto existente ou faça upload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Criar novo boleto com upload</SelectItem>
                  {boletos.map((boleto) => (
                    <SelectItem key={boleto.id} value={boleto.id.toString()}>
                      {boleto.numero_boleto} - {boleto.descricao} - {formatarMoeda(boleto.valor)} - Venc:{' '}
                      {new Date(boleto.data_vencimento).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formCustosMensais.boleto_id === '' || formCustosMensais.boleto_id === 'none') && (
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
                            variant: 'destructive',
                          })
                          return
                        }
                        setFormCustosMensais({ ...formCustosMensais, boletoFile: file })
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {formCustosMensais.boletoFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{formCustosMensais.boletoFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormCustosMensais({ ...formCustosMensais, boletoFile: null })
                        }
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
                value={formCustosMensais.observacoes}
                onChange={(e) =>
                  setFormCustosMensais({ ...formCustosMensais, observacoes: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateCustosMensaisOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCustosMensais}>Criar cobrança de custos</Button>
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
