"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  AlertCircle,
  Zap,
  Gauge,
  Battery,
  Truck,
  CreditCard
} from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend, converterObraFrontendParaBackend, ObraBackend } from "@/lib/api-obras"
import { CustoMensal } from "@/lib/api-custos-mensais"
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
  const [responsavelTecnico, setResponsavelTecnico] = useState<ResponsavelTecnicoData | null>(null)
  const [sinaleiros, setSinaleiros] = useState<any[]>([])
  
  // Estados para custos mensais
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

  // Funções para custos mensais
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
  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    if (cliente) {
      setObraFormData({ ...obraFormData, clienteId: cliente.id })
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
    
    if (!obraFormData.name || !obraFormData.clienteId || !obraFormData.location || !obraFormData.cidade || !obraFormData.estado || !obraFormData.tipo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Nome, Cliente, Endereço, Cidade, Estado, Tipo)",
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
        clienteId: obraFormData.clienteId,
        observations: obraFormData.observations,
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
        gruasSelecionadas: gruasSelecionadas,
        // Dados do responsável
        responsavelId: obraFormData.responsavelId,
        responsavelName: obraFormData.responsavelName,
        // Lista de funcionários
        funcionarios: funcionariosSelecionados,
        // Custos mensais - converter para formato do backend
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
      console.log('  - gruaId:', obraData.gruaId)
      console.log('  - gruaValue:', obraData.gruaValue)
      console.log('  - monthlyFee:', obraData.monthlyFee)
      console.log('  - gruasSelecionadas:', obraData.gruasSelecionadas)
      console.log('  - custos_mensais:', obraData.custos_mensais)
      console.log('  - funcionarios:', obraData.funcionarios)

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
      
      // 3. Fazer upload dos arquivos ART e Apólice
      let artArquivoUrl = ''
      let apoliceArquivoUrl = ''
      
      try {
        // Upload ART
        if (artArquivo) {
          const formDataArt = new FormData()
          formDataArt.append('arquivo', artArquivo)
          formDataArt.append('categoria', 'art')
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          const uploadArtResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obraId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataArt
          })
          
          if (uploadArtResponse.ok) {
            const uploadArtResult = await uploadArtResponse.json()
            artArquivoUrl = uploadArtResult.data?.caminho || uploadArtResult.data?.arquivo || ''
          }
        }
        
        // Upload Apólice
        if (apoliceArquivo) {
          const formDataApolice = new FormData()
          formDataApolice.append('arquivo', apoliceArquivo)
          formDataApolice.append('categoria', 'apolice')
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
          
          const uploadApoliceResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obraId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataApolice
          })
          
          if (uploadApoliceResponse.ok) {
            const uploadApoliceResult = await uploadApoliceResponse.json()
            apoliceArquivoUrl = uploadApoliceResult.data?.caminho || uploadApoliceResult.data?.arquivo || ''
          }
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
      responsavelId: '',
      responsavelName: '',
      funcionarios: []
    })
    setClienteSelecionado(null)
    setGruasSelecionadas([])
    setFuncionariosSelecionados([])
    setResponsavelSelecionado(null)
    setCustosMensais([])
    // Reset dos novos campos
    setCno('')
    setArtNumero('')
    setArtArquivo(null)
    setApoliceNumero('')
    setApoliceArquivo(null)
    setResponsavelTecnico(null)
    setSinaleiros([])
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
      <form onSubmit={handleCreateObra} className="space-y-6">
        <Tabs defaultValue="obra" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="obra">Dados da Obra</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="responsavel-tecnico">Responsável Técnico</TabsTrigger>
            <TabsTrigger value="sinaleiros">Sinaleiros</TabsTrigger>
            <TabsTrigger value="grua">Grua</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="custos">Custos Mensais</TabsTrigger>
          </TabsList>

          {/* Aba: Dados da Obra */}
          <TabsContent value="obra" className="space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Obra *</Label>
                    <Input
                      id="name"
                      value={obraFormData.name}
                      onChange={(e) => setObraFormData({ ...obraFormData, name: e.target.value })}
                      placeholder="Ex: Obra Residencial Jardim das Flores"
                      required
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
                  <div>
                    <Label htmlFor="location">Endereço *</Label>
                    <Input
                      id="location"
                      value={obraFormData.location}
                      onChange={(e) => setObraFormData({ ...obraFormData, location: e.target.value })}
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                      required
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
                  <ClienteSearch
                    onClienteSelect={handleClienteSelect}
                    placeholder="Buscar cliente por nome ou CNPJ..."
                    className="mt-1"
                  />
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
          <TabsContent value="documentos" className="space-y-4">
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
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-900">Campos Obrigatórios</h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Todos os campos abaixo são obrigatórios para o cadastro da obra
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CNO */}
                  <div>
                    <CnoInput
                      value={cno}
                      onChange={setCno}
                      label="CNO da Obra (CNPJ/Documento)"
                      required={true}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Documento identificador da obra
                    </p>
                  </div>

                  {/* ART */}
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

                  {/* Apólice de Seguro */}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Responsável Técnico */}
          <TabsContent value="responsavel-tecnico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Responsável Técnico da Obra
                </CardTitle>
                <CardDescription>
                  Cadastre o responsável técnico pela obra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsavelTecnicoForm
                  responsavel={responsavelTecnico}
                  onSave={(data) => {
                    console.log('💾 Salvando responsável técnico no estado:', data)
                    setResponsavelTecnico(data)
                    toast({
                      title: "Sucesso",
                      description: "Responsável técnico salvo com sucesso"
                    })
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Sinaleiros */}
          <TabsContent value="sinaleiros" className="space-y-4">
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
          </TabsContent>

          {/* Aba: Gruas */}
          <TabsContent value="grua" className="space-y-4">
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
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crane className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Gruas da Obra</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Selecione uma ou mais gruas que serão utilizadas nesta obra
                  </p>
                </div>

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
          <TabsContent value="funcionarios" className="space-y-4">
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
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-900">Funcionários da Obra</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Busque e adicione funcionários para esta obra
                  </p>
                </div>

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
                      <div key={funcionario.id} className="flex gap-2 p-3 border rounded-lg bg-green-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="font-medium text-green-900">{funcionario.name}</p>
                              <p className="text-sm text-green-700">{funcionario.role}</p>
                            </div>
                          </div>
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

          {/* Aba: Custos Mensais */}
          <TabsContent value="custos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Custos Mensais da Obra
                </CardTitle>
                <CardDescription>
                  Configure os custos mensais que serão aplicados a esta obra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h3 className="font-medium text-purple-900">Custos Mensais da Obra</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    Configure os custos mensais que serão aplicados a esta obra
                  </p>
                </div>

                {/* Formulário para adicionar custo */}
                <div className="border rounded-lg p-4 space-y-4">
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
                    <h4 className="font-medium text-sm">Custos Mensais Configurados ({custosMensais.length})</h4>
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

                {/* Botões de ação para custos */}
                {custosMensais.length > 0 && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const proximoMes = new Date(custoForm.mes + '-01')
                        proximoMes.setMonth(proximoMes.getMonth() + 1)
                        const proximoMesStr = proximoMes.toISOString().slice(0, 7)
                        duplicarCustosParaMes(proximoMesStr)
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Duplicar para Próximo Mês
                    </Button>
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
    </div>
  )
}
