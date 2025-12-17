"use client"

import { useState, useEffect } from 'react'
import {
  Home,
  Building,
  Plus,
  Search,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  Bed,
  Bath,
  Ruler,
  Trash2,
  Calendar,
  List,
  Upload,
  FileText,
  Edit,
  X,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlugueisAPI,
  ResidenciasAPI,
  AluguelResidencia,
  Residencia,
  formatarMoeda,
  calcularValorFuncionario,
  calcularSubsidioEmpresa,
} from '@/lib/api-alugueis-residencias'
import { FuncionarioSearch } from '@/components/funcionario-search'
import { useToast } from '@/hooks/use-toast'

export default function AlugueisIntegradoPage() {
  const [alugueis, setAlugueis] = useState<AluguelResidencia[]>([])
  const [residencias, setResidencias] = useState<Residencia[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'encerrado'>('todos')
  const [openNovaResidencia, setOpenNovaResidencia] = useState(false)
  const [openNovoAluguel, setOpenNovoAluguel] = useState(false)
  const [openEditarResidencia, setOpenEditarResidencia] = useState(false)
  const [openEditarAluguel, setOpenEditarAluguel] = useState(false)
  const [openArquivosAluguel, setOpenArquivosAluguel] = useState(false)
  const [aluguelSelecionado, setAluguelSelecionado] = useState<AluguelResidencia | null>(null)
  const [residenciaSelecionada, setResidenciaSelecionada] = useState<Residencia | null>(null)
  const [arquivosAluguel, setArquivosAluguel] = useState<any[]>([])
  const [uploadingArquivos, setUploadingArquivos] = useState(false)
  const [activeTab, setActiveTab] = useState('alugueis')
  const { toast } = useToast()

  // Form states - Nova Residência
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('SP')
  const [cep, setCep] = useState('')
  const [quartos, setQuartos] = useState('2')
  const [banheiros, setBanheiros] = useState('1')
  const [area, setArea] = useState('')
  const [valorBase, setValorBase] = useState('')
  const [mobiliada, setMobiliada] = useState(false)

  // Form states - Novo Aluguel
  const [residenciaId, setResidenciaId] = useState('')
  const [funcionarioId, setFuncionarioId] = useState('')
  const [funcionarioNome, setFuncionarioNome] = useState('')
  const [funcionarioCargo, setFuncionarioCargo] = useState('')
  const [funcionarioCpf, setFuncionarioCpf] = useState('')
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<any>(null)
  const [dataInicio, setDataInicio] = useState('')
  const [valorMensal, setValorMensal] = useState('')
  const [diaVencimento, setDiaVencimento] = useState('5')
  const [descontoFolha, setDescontoFolha] = useState(true)
  const [porcentagemDesconto, setPorcentagemDesconto] = useState('')
  const [tipoSinal, setTipoSinal] = useState<'caucao' | 'fiador' | 'outros' | ''>('')
  const [valorDeposito, setValorDeposito] = useState('')
  const [periodoMulta, setPeriodoMulta] = useState('')
  const [contratoArquivos, setContratoArquivos] = useState<File[]>([])
  const [observacoes, setObservacoes] = useState('')

  const carregar = async () => {
    setLoading(true)
    try {
      const [alugueisData, residenciasData] = await Promise.all([
        AlugueisAPI.listar(),
        ResidenciasAPI.listar(),
      ])
      setAlugueis(alugueisData)
      setResidencias(residenciasData)
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  // Cadastrar residência
  const handleCadastrarResidencia = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await ResidenciasAPI.criar({
        nome,
        endereco,
        cidade,
        estado,
        cep,
        quartos: parseInt(quartos),
        banheiros: parseInt(banheiros),
        area: parseFloat(area),
        valorBase: parseFloat(valorBase),
        mobiliada,
      })

      toast({
        title: 'Residência cadastrada!',
        description: 'A residência foi cadastrada com sucesso.',
      })

      setNome('')
      setEndereco('')
      setCidade('')
      setEstado('SP')
      setCep('')
      setQuartos('2')
      setBanheiros('1')
      setArea('')
      setValorBase('')
      setMobiliada(false)
      setOpenNovaResidencia(false)
      setActiveTab('residencias')
      carregar()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar a residência.',
        variant: 'destructive',
      })
    }
  }

  // Criar aluguel
  const handleCriarAluguel = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!residenciaId || !funcionarioId || !dataInicio || !valorMensal) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      const residencia = residencias.find(r => r.id === residenciaId)
      if (!residencia) throw new Error('Residência não encontrada')

      const aluguelCriado = await AlugueisAPI.criar({
        residencia: {
          id: residencia.id,
          nome: residencia.nome,
          endereco: residencia.endereco,
          cidade: residencia.cidade,
          estado: residencia.estado,
          cep: residencia.cep,
          quartos: residencia.quartos,
          banheiros: residencia.banheiros,
          area: residencia.area,
          mobiliada: residencia.mobiliada,
        },
        funcionario: {
          id: funcionarioId,
          nome: funcionarioNome,
          cargo: funcionarioCargo,
          cpf: funcionarioCpf,
        },
        contrato: {
          dataInicio,
          valorMensal: parseFloat(valorMensal),
          diaVencimento: parseInt(diaVencimento),
          descontoFolha,
          porcentagemDesconto: porcentagemDesconto ? parseFloat(porcentagemDesconto) : undefined,
          tipoSinal: tipoSinal || undefined,
          valorDeposito: valorDeposito ? parseFloat(valorDeposito) : undefined,
          periodoMulta: periodoMulta ? parseInt(periodoMulta) : undefined,
        },
        status: 'ativo',
        observacoes: observacoes || undefined,
      })

      // Fazer upload dos arquivos se houver
      if (contratoArquivos.length > 0) {
        try {
          await AlugueisAPI.uploadArquivos(aluguelCriado.id, contratoArquivos, 'contrato')
          toast({
            title: 'Aluguel criado e arquivos enviados!',
            description: `O aluguel foi registrado e ${contratoArquivos.length} arquivo(s) anexado(s) com sucesso.`,
          })
        } catch (error) {
          console.error('Erro ao fazer upload dos arquivos:', error)
          toast({
            title: 'Aluguel criado!',
            description: 'O aluguel foi registrado, mas houve erro ao enviar os arquivos.',
          })
        }
      } else {
        toast({
          title: 'Aluguel criado!',
          description: 'O aluguel foi registrado com sucesso.',
        })
      }

      setResidenciaId('')
      setFuncionarioId('')
      setFuncionarioNome('')
      setFuncionarioCargo('')
      setFuncionarioCpf('')
      setFuncionarioSelecionado(null)
      setDataInicio('')
      setValorMensal('')
      setDiaVencimento('5')
      setDescontoFolha(true)
      setPorcentagemDesconto('')
      setTipoSinal('')
      setValorDeposito('')
      setPeriodoMulta('')
      setContratoArquivos([])
      setObservacoes('')
      
      setOpenNovoAluguel(false)
      setActiveTab('alugueis')
      carregar()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o aluguel.',
        variant: 'destructive',
      })
    }
  }

  const encerrarAluguel = async (id: string) => {
    if (!confirm('Deseja encerrar este aluguel?')) return

    try {
      const dataFim = new Date().toISOString().split('T')[0]
      await AlugueisAPI.encerrar(id, dataFim)
      await carregar()
      toast({
        title: 'Aluguel encerrado',
        description: 'O aluguel foi encerrado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encerrar o aluguel.',
        variant: 'destructive',
      })
    }
  }

  const deletarResidencia = async (id: string) => {
    if (!confirm('Deseja deletar esta residência?')) return

    try {
      await ResidenciasAPI.deletar(id)
      toast({
        title: 'Residência deletada',
        description: 'A residência foi removida com sucesso.',
      })
      carregar()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a residência.',
        variant: 'destructive',
      })
    }
  }

  // Editar residência
  const abrirEditarResidencia = (residencia: Residencia) => {
    setResidenciaSelecionada(residencia)
    setNome(residencia.nome)
    setEndereco(residencia.endereco)
    setCidade(residencia.cidade)
    setEstado(residencia.estado)
    setCep(residencia.cep)
    setQuartos(String(residencia.quartos))
    setBanheiros(String(residencia.banheiros))
    setArea(String(residencia.area))
    setValorBase(String(residencia.valorBase))
    setMobiliada(residencia.mobiliada)
    setOpenEditarResidencia(true)
  }

  const handleEditarResidencia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!residenciaSelecionada) return

    try {
      await ResidenciasAPI.atualizar(residenciaSelecionada.id, {
        nome,
        endereco,
        cidade,
        estado,
        cep,
        quartos: parseInt(quartos),
        banheiros: parseInt(banheiros),
        area: parseFloat(area),
        valorBase: parseFloat(valorBase),
        mobiliada,
      })

      toast({
        title: 'Residência atualizada!',
        description: 'A residência foi atualizada com sucesso.',
      })

      setOpenEditarResidencia(false)
      setResidenciaSelecionada(null)
      carregar()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a residência.',
        variant: 'destructive',
      })
    }
  }

  // Editar aluguel
  const abrirEditarAluguel = (aluguel: AluguelResidencia) => {
    setAluguelSelecionado(aluguel)
    setResidenciaId(aluguel.residencia.id)
    setFuncionarioId(String(aluguel.funcionario.id))
    setFuncionarioNome(aluguel.funcionario.nome)
    setFuncionarioCargo(aluguel.funcionario.cargo)
    setFuncionarioCpf(aluguel.funcionario.cpf)
    setDataInicio(aluguel.contrato.dataInicio)
    setValorMensal(String(aluguel.contrato.valorMensal))
    setDiaVencimento(String(aluguel.contrato.diaVencimento))
    setDescontoFolha(aluguel.contrato.descontoFolha)
    setPorcentagemDesconto(aluguel.contrato.porcentagemDesconto ? String(aluguel.contrato.porcentagemDesconto) : '')
    setTipoSinal(aluguel.contrato.tipoSinal || '')
    setValorDeposito(aluguel.contrato.valorDeposito ? String(aluguel.contrato.valorDeposito) : '')
    setPeriodoMulta(aluguel.contrato.periodoMulta ? String(aluguel.contrato.periodoMulta) : '')
    setObservacoes(aluguel.observacoes || '')
    setContratoArquivos([]) // Limpar arquivos ao abrir edição
    setOpenEditarAluguel(true)
  }

  const handleEditarAluguel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aluguelSelecionado) return

    try {
      await AlugueisAPI.atualizar(aluguelSelecionado.id, {
        contrato: {
          dataInicio,
          valorMensal: parseFloat(valorMensal),
          diaVencimento: parseInt(diaVencimento),
          descontoFolha,
          porcentagemDesconto: porcentagemDesconto ? parseFloat(porcentagemDesconto) : undefined,
          tipoSinal: tipoSinal || undefined,
          valorDeposito: valorDeposito ? parseFloat(valorDeposito) : undefined,
          periodoMulta: periodoMulta ? parseInt(periodoMulta) : undefined,
        },
        observacoes: observacoes || undefined,
      })

      // Fazer upload dos arquivos se houver
      if (contratoArquivos.length > 0) {
        try {
          await AlugueisAPI.uploadArquivos(aluguelSelecionado.id, contratoArquivos, 'contrato')
          toast({
            title: 'Aluguel atualizado e arquivos enviados!',
            description: `O aluguel foi atualizado e ${contratoArquivos.length} arquivo(s) anexado(s) com sucesso.`,
          })
        } catch (error) {
          console.error('Erro ao fazer upload dos arquivos:', error)
          toast({
            title: 'Aluguel atualizado!',
            description: 'O aluguel foi atualizado, mas houve erro ao enviar os arquivos.',
          })
        }
      } else {
        toast({
          title: 'Aluguel atualizado!',
          description: 'O aluguel foi atualizado com sucesso.',
        })
      }

      setOpenEditarAluguel(false)
      setAluguelSelecionado(null)
      setContratoArquivos([])
      carregar()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o aluguel.',
        variant: 'destructive',
      })
    }
  }

  // Gerenciar arquivos do aluguel
  const abrirArquivosAluguel = async (aluguel: AluguelResidencia) => {
    setAluguelSelecionado(aluguel)
    try {
      const arquivos = await AlugueisAPI.listarArquivos(aluguel.id)
      setArquivosAluguel(arquivos)
      setOpenArquivosAluguel(true)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os arquivos.',
        variant: 'destructive',
      })
    }
  }

  const handleUploadArquivos = async (files: File[]) => {
    if (!aluguelSelecionado || files.length === 0) return

    setUploadingArquivos(true)
    try {
      const resultado = await AlugueisAPI.uploadArquivos(aluguelSelecionado.id, files, 'contrato')
      
      if (resultado.sucessos.length > 0) {
        toast({
          title: 'Arquivos enviados!',
          description: `${resultado.sucessos.length} arquivo(s) enviado(s) com sucesso.`,
        })
        // Recarregar lista de arquivos
        const arquivos = await AlugueisAPI.listarArquivos(aluguelSelecionado.id)
        setArquivosAluguel(arquivos)
      }

      if (resultado.erros.length > 0) {
        toast({
          title: 'Alguns arquivos falharam',
          description: `${resultado.erros.length} arquivo(s) não puderam ser enviados.`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload dos arquivos.',
        variant: 'destructive',
      })
    } finally {
      setUploadingArquivos(false)
    }
  }

  const handleDeletarArquivo = async (arquivoId: string) => {
    if (!confirm('Deseja deletar este arquivo?')) return

    try {
      await AlugueisAPI.deletarArquivo(arquivoId)
      toast({
        title: 'Arquivo deletado',
        description: 'O arquivo foi removido com sucesso.',
      })
      // Recarregar lista de arquivos
      if (aluguelSelecionado) {
        const arquivos = await AlugueisAPI.listarArquivos(aluguelSelecionado.id)
        setArquivosAluguel(arquivos)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o arquivo.',
        variant: 'destructive',
      })
    }
  }

  // Filtros
  // Componente de Loading padronizado
  const LoadingContent = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div className="text-lg font-medium">Carregando aluguéis...</div>
        <div className="text-sm text-gray-500">Aguarde enquanto buscamos as informações mais recentes</div>
      </div>
    </div>
  )

  const aluguelsFiltrados = alugueis.filter(a => {
    const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus
    const matchBusca = !busca || 
      a.funcionario.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.residencia.nome.toLowerCase().includes(busca.toLowerCase())
    return matchStatus && matchBusca
  })

  const residenciasFiltradas = residencias.filter(r => 
    !busca || 
    r.nome.toLowerCase().includes(busca.toLowerCase()) ||
    r.endereco.toLowerCase().includes(busca.toLowerCase())
  )

  const residenciasSelecionada = residencias.find(r => r.id === residenciaId)

  // Stats
  const ativos = alugueis.filter(a => a.status === 'ativo').length
  const valorTotalMensal = alugueis
    .filter(a => a.status === 'ativo')
    .reduce((sum, a) => sum + a.contrato.valorMensal, 0)
  const subsidioTotal = alugueis
    .filter(a => a.status === 'ativo')
    .reduce((sum, a) => sum + calcularSubsidioEmpresa(a.contrato.valorMensal, a.contrato.porcentagemDesconto), 0)
  const residenciasDisponiveis = residencias.filter(r => r.disponivel).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-700'
      case 'encerrado': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPagamentoColor = (status: string) => {
    switch (status) {
      case 'pago': return 'text-green-600'
      case 'pendente': return 'text-yellow-600'
      case 'atrasado': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return <LoadingContent />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aluguéis de Residências</h1>
          <p className="text-gray-600 mt-2">
            Gerencie residências e aluguéis para funcionários
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={openNovaResidencia} onOpenChange={setOpenNovaResidencia}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building className="h-4 w-4 mr-2" />
                Nova Residência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Residência</DialogTitle>
                <DialogDescription>
                  Adicione uma nova residência para disponibilizar
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCadastrarResidencia} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome/Identificação *</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Casa Vila Nova"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      placeholder="Rua, número"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quartos *</Label>
                    <Select value={quartos} onValueChange={setQuartos}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Banheiros *</Label>
                    <Select value={banheiros} onValueChange={setBanheiros}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Área (m²) *</Label>
                    <Input
                      id="area"
                      type="number"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorBase">Valor Base (R$) *</Label>
                  <Input
                    id="valorBase"
                    type="number"
                    step="0.01"
                    value={valorBase}
                    onChange={(e) => setValorBase(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobiliada"
                    checked={mobiliada}
                    onCheckedChange={(checked) => setMobiliada(checked as boolean)}
                  />
                  <label htmlFor="mobiliada" className="text-sm font-medium">
                    Mobiliada
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenNovaResidencia(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Cadastrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openNovoAluguel} onOpenChange={setOpenNovoAluguel}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluguel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Aluguel</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo aluguel de residência
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCriarAluguel} className="space-y-4 mt-4">
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Residência
                  </h3>
                  <div className="space-y-2">
                    <Label>Selecione a Residência *</Label>
                    <Select value={residenciaId} onValueChange={setResidenciaId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma residência" />
                      </SelectTrigger>
                      <SelectContent>
                        {residencias.filter(r => r.disponivel).map((residencia) => (
                          <SelectItem key={residencia.id} value={residencia.id}>
                            {residencia.nome} - {residencia.cidade}/{residencia.estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {residenciasSelecionada && (
                    <div className="bg-white border rounded-lg p-3 text-sm">
                      <p className="font-medium">{residenciasSelecionada.endereco}</p>
                      <p className="text-gray-600">{residenciasSelecionada.quartos}Q • {residenciasSelecionada.banheiros}B • {residenciasSelecionada.area}m²</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Funcionário
                  </h3>
                  <div className="space-y-2">
                    <Label>Selecione o Funcionário *</Label>
                    <FuncionarioSearch
                      selectedFuncionario={funcionarioSelecionado}
                      onFuncionarioSelect={(funcionario) => {
                        if (!funcionario) {
                          setFuncionarioId('')
                          setFuncionarioNome('')
                          setFuncionarioCargo('')
                          setFuncionarioCpf('')
                          setFuncionarioSelecionado(null)
                          return
                        }
                        setFuncionarioSelecionado(funcionario)
                        setFuncionarioId(String(funcionario.id))
                        setFuncionarioNome(funcionario.name || funcionario.nome || '')
                        setFuncionarioCargo(funcionario.role || funcionario.cargo || '')
                        setFuncionarioCpf(funcionario.cpf || '')
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold">Contrato</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataInicio">Data de Início *</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valorMensal">Valor Mensal (R$) *</Label>
                      <Input
                        id="valorMensal"
                        type="number"
                        step="0.01"
                        value={valorMensal}
                        onChange={(e) => setValorMensal(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dia Vencimento</Label>
                      <Select value={diaVencimento} onValueChange={setDiaVencimento}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                            <SelectItem key={dia} value={String(dia)}>
                              Dia {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="porcentagemDesconto">Subsídio (%)</Label>
                      <Input
                        id="porcentagemDesconto"
                        type="number"
                        max="100"
                        value={porcentagemDesconto}
                        onChange={(e) => setPorcentagemDesconto(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="descontoFolha"
                      checked={descontoFolha}
                      onCheckedChange={(checked) => setDescontoFolha(checked as boolean)}
                    />
                    <label htmlFor="descontoFolha" className="text-sm font-medium">
                      Descontar da folha
                    </label>
                  </div>

                  {valorMensal && porcentagemDesconto && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-blue-600 text-xs">Total</p>
                          <p className="font-semibold">R$ {parseFloat(valorMensal).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-blue-600 text-xs">Empresa ({porcentagemDesconto}%)</p>
                          <p className="font-semibold">R$ {(parseFloat(valorMensal) * parseFloat(porcentagemDesconto) / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-blue-600 text-xs">Funcionário</p>
                          <p className="font-semibold">R$ {(parseFloat(valorMensal) * (1 - parseFloat(porcentagemDesconto) / 100)).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Novos campos: Tipo de Sinal, Valor do Depósito, Período da Multa */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="tipoSinal">Tipo de Sinal</Label>
                      <Select value={tipoSinal} onValueChange={(value) => setTipoSinal(value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de sinal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="caucao">Caução</SelectItem>
                          <SelectItem value="fiador">Fiador</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valorDeposito">Valor do Depósito (R$)</Label>
                      <Input
                        id="valorDeposito"
                        type="number"
                        step="0.01"
                        value={valorDeposito}
                        onChange={(e) => setValorDeposito(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="periodoMulta">Período da Multa (dias)</Label>
                      <Input
                        id="periodoMulta"
                        type="number"
                        value={periodoMulta}
                        onChange={(e) => setPeriodoMulta(e.target.value)}
                        placeholder="Se tiver multa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contratoArquivo">Arquivos do Contrato</Label>
                      <div className="space-y-2">
                        <Input
                          id="contratoArquivo"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            if (files.length > 0) {
                              setContratoArquivos(prev => [...prev, ...files])
                            }
                          }}
                          className="cursor-pointer"
                        />
                        {contratoArquivos.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {contratoArquivos.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(file.size / 1024).toFixed(2)} KB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setContratoArquivos(prev => prev.filter((_, i) => i !== index))
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB por arquivo)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenNovoAluguel(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Aluguel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aluguéis Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ativos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Total Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(valorTotalMensal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Subsídio Empresa/Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatarMoeda(subsidioTotal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Residências Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{residenciasDisponiveis}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alugueis">
            <List className="h-4 w-4 mr-2" />
            Aluguéis
          </TabsTrigger>
          <TabsTrigger value="residencias">
            <Building className="h-4 w-4 mr-2" />
            Residências
          </TabsTrigger>
        </TabsList>

        {/* Tab: Aluguéis */}
        <TabsContent value="alugueis" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Carregando...
              </CardContent>
            </Card>
          ) : aluguelsFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Home className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum aluguel encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por funcionário ou residência..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as any)}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="encerrado">Encerrados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Residência</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Valor Mensal</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {aluguelsFiltrados.map((aluguel) => (
                        <tr key={aluguel.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-sm">{aluguel.residencia.nome}</p>
                              <p className="text-xs text-gray-500">{aluguel.residencia.cidade}/{aluguel.residencia.estado}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm">{aluguel.funcionario.nome}</p>
                              <p className="text-xs text-gray-500">{aluguel.funcionario.cargo}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold">{formatarMoeda(aluguel.contrato.valorMensal)}</p>
                              {aluguel.contrato.porcentagemDesconto && (
                                <p className="text-xs text-blue-600">Subsídio: {aluguel.contrato.porcentagemDesconto}%</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm">Dia {aluguel.contrato.diaVencimento}</p>
                            <p className="text-xs text-gray-500">
                              {aluguel.contrato.dataInicio ? new Date(aluguel.contrato.dataInicio).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getStatusColor(aluguel.status)}>
                              {aluguel.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirEditarAluguel(aluguel)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirArquivosAluguel(aluguel)}
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                              {aluguel.status === 'ativo' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => encerrarAluguel(aluguel.id)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Residências */}
        <TabsContent value="residencias" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Carregando...
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b bg-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar residências..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Endereço</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Características</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Valor Base</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {residenciasFiltradas.map((residencia) => (
                        <tr key={residencia.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-sm">{residencia.nome}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm">{residencia.endereco}</p>
                              <p className="text-xs text-gray-500">{residencia.cidade}/{residencia.estado}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Bed className="h-4 w-4" />
                                {residencia.quartos}Q
                              </span>
                              <span className="flex items-center gap-1">
                                <Bath className="h-4 w-4" />
                                {residencia.banheiros}B
                              </span>
                              <span className="flex items-center gap-1">
                                <Ruler className="h-4 w-4" />
                                {residencia.area}m²
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold">{formatarMoeda(residencia.valorBase)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={residencia.disponivel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {residencia.disponivel ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Disponível</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Ocupada</>
                              )}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirEditarResidencia(residencia)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deletarResidencia(residencia.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Editar Residência */}
      <Dialog open={openEditarResidencia} onOpenChange={setOpenEditarResidencia}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Residência</DialogTitle>
            <DialogDescription>
              Atualize os dados da residência
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditarResidencia} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome/Identificação *</Label>
              <Input
                id="edit-nome"
                placeholder="Ex: Casa Vila Nova"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-endereco">Endereço *</Label>
                <Input
                  id="edit-endereco"
                  placeholder="Rua, número"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cidade">Cidade *</Label>
                <Input
                  id="edit-cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado *</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cep">CEP *</Label>
                <Input
                  id="edit-cep"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quartos *</Label>
                <Select value={quartos} onValueChange={setQuartos}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Banheiros *</Label>
                <Select value={banheiros} onValueChange={setBanheiros}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-area">Área (m²) *</Label>
                <Input
                  id="edit-area"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-valorBase">Valor Base (R$) *</Label>
              <Input
                id="edit-valorBase"
                type="number"
                step="0.01"
                value={valorBase}
                onChange={(e) => setValorBase(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-mobiliada"
                checked={mobiliada}
                onCheckedChange={(checked) => setMobiliada(checked as boolean)}
              />
              <label htmlFor="edit-mobiliada" className="text-sm font-medium">
                Mobiliada
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditarResidencia(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Aluguel */}
      <Dialog open={openEditarAluguel} onOpenChange={setOpenEditarAluguel}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aluguel</DialogTitle>
            <DialogDescription>
              Atualize os dados do aluguel
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditarAluguel} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dataInicio">Data de Início *</Label>
                <Input
                  id="edit-dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valorMensal">Valor Mensal (R$) *</Label>
                <Input
                  id="edit-valorMensal"
                  type="number"
                  step="0.01"
                  value={valorMensal}
                  onChange={(e) => setValorMensal(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Dia Vencimento</Label>
                <Select value={diaVencimento} onValueChange={setDiaVencimento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                      <SelectItem key={dia} value={String(dia)}>
                        Dia {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-porcentagemDesconto">Subsídio (%)</Label>
                <Input
                  id="edit-porcentagemDesconto"
                  type="number"
                  max="100"
                  value={porcentagemDesconto}
                  onChange={(e) => setPorcentagemDesconto(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-descontoFolha"
                checked={descontoFolha}
                onCheckedChange={(checked) => setDescontoFolha(checked as boolean)}
              />
              <label htmlFor="edit-descontoFolha" className="text-sm font-medium">
                Descontar da folha
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tipoSinal">Tipo de Sinal</Label>
                <Select value={tipoSinal} onValueChange={(value) => setTipoSinal(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de sinal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caucao">Caução</SelectItem>
                    <SelectItem value="fiador">Fiador</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valorDeposito">Valor do Depósito (R$)</Label>
                <Input
                  id="edit-valorDeposito"
                  type="number"
                  step="0.01"
                  value={valorDeposito}
                  onChange={(e) => setValorDeposito(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-periodoMulta">Período da Multa (dias)</Label>
                <Input
                  id="edit-periodoMulta"
                  type="number"
                  value={periodoMulta}
                  onChange={(e) => setPeriodoMulta(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contratoArquivo">Adicionar Arquivos do Contrato</Label>
              <div className="space-y-2">
                <Input
                  id="edit-contratoArquivo"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 0) {
                      setContratoArquivos(prev => [...prev, ...files])
                    }
                  }}
                  className="cursor-pointer"
                />
                {contratoArquivos.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {contratoArquivos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setContratoArquivos(prev => prev.filter((_, i) => i !== index))
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB por arquivo)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditarAluguel(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gerenciar Arquivos do Aluguel */}
      <Dialog open={openArquivosAluguel} onOpenChange={setOpenArquivosAluguel}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Arquivos do Aluguel</DialogTitle>
            <DialogDescription>
              Gerencie os arquivos anexados a este aluguel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Enviar múltiplos arquivos</p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 0) {
                      handleUploadArquivos(files)
                    }
                  }}
                  disabled={uploadingArquivos}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB por arquivo)
                </p>
              </div>
            </div>

            {uploadingArquivos && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Enviando arquivos...</p>
              </div>
            )}

            {arquivosAluguel.length > 0 ? (
              <div className="space-y-2">
                {arquivosAluguel.map((arquivo) => (
                  <div key={arquivo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{arquivo.nome_arquivo}</p>
                        <p className="text-xs text-gray-500">
                          {arquivo.tamanho_arquivo ? `${(arquivo.tamanho_arquivo / 1024).toFixed(2)} KB` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(arquivo.caminho_arquivo, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletarArquivo(arquivo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum arquivo anexado</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
