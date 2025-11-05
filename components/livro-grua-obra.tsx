"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Building2, 
  User, 
  Wrench, 
  Calendar, 
  MapPin, 
  DollarSign,
  FileText,
  Shield,
  ClipboardCheck,
  Users,
  Settings,
  Download,
  Printer,
  Truck,
  CreditCard
} from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend } from "@/lib/api-obras"
import { obrasDocumentosApi } from "@/lib/api-obras-documentos"
import { CardLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"

interface LivroGruaObraProps {
  obraId: string
}

export function LivroGruaObra({ obraId }: LivroGruaObraProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [obra, setObra] = useState<any>(null)
  const [documentos, setDocumentos] = useState<any[]>([])
  const [gruaSelecionada, setGruaSelecionada] = useState<any>(null)

  useEffect(() => {
    carregarDados()
  }, [obraId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const response = await obrasApi.obterObra(parseInt(obraId))
      const obraData = response.data || response
      
      // Converter para formato frontend
      const obraConvertida = converterObraBackendParaFrontend(obraData, {
        gruasVinculadas: obraData.grua_obra || [],
        funcionariosVinculados: obraData.grua_funcionario || []
      })
      setObra(obraConvertida)

      // Carregar documentos
      const docsResponse = await obrasDocumentosApi.listarPorObra(parseInt(obraId))
      if (docsResponse.success && docsResponse.data) {
        setDocumentos(Array.isArray(docsResponse.data) ? docsResponse.data : [docsResponse.data])
      }

      // Selecionar primeira grua se houver
      // Pode vir como grua_obra ou gruasVinculadas
      const gruasDisponiveis = obraConvertida.gruasVinculadas || obraData.grua_obra || []
      if (gruasDisponiveis.length > 0) {
        // Se for da relação grua_obra, pegar a grua dentro
        const primeiraRelacao = gruasDisponiveis[0]
        if (primeiraRelacao.grua) {
          // É uma relação grua_obra com grua aninhada
          setGruaSelecionada({
            ...primeiraRelacao.grua,
            relacao: primeiraRelacao,
            name: primeiraRelacao.grua.modelo || primeiraRelacao.grua.name || `Grua ${primeiraRelacao.grua.id}`,
            modelo: primeiraRelacao.grua.modelo,
            fabricante: primeiraRelacao.grua.fabricante,
            tipo: primeiraRelacao.grua.tipo
          })
        } else if (primeiraRelacao.id) {
          // É uma grua direta
          setGruaSelecionada({
            ...primeiraRelacao,
            relacao: primeiraRelacao
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data: string | undefined) => {
    if (!data) return 'Não informado'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarMoeda = (valor: number | undefined) => {
    if (!valor) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Função auxiliar para fazer download de arquivo
  const downloadArquivo = async (arquivoUrl: string, nomeArquivo: string) => {
    if (!arquivoUrl) {
      throw new Error('URL do arquivo não encontrada')
    }

    // Se for uma URL completa, usar diretamente
    if (arquivoUrl.startsWith('http://') || arquivoUrl.startsWith('https://')) {
      window.open(arquivoUrl, '_blank')
      return
    }

    // Se for um caminho relativo, construir a URL completa
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    
    const url = arquivoUrl.startsWith('/') 
      ? `${apiUrl}${arquivoUrl}`
      : `${apiUrl}/uploads/${arquivoUrl}`

    // Fazer download usando fetch com autenticação
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao baixar arquivo')
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = nomeArquivo || arquivoUrl.split('/').pop() || 'documento.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  }

  // Função para baixar documento usando a API
  const downloadDocumento = async (documento: any) => {
    try {
      // Tentar usar a API de download primeiro
      if (documento.id && obraId) {
        try {
          const downloadData = await obrasDocumentosApi.download(parseInt(obraId), documento.id)
          if (downloadData.download_url) {
            window.open(downloadData.download_url, '_blank')
            return
          }
        } catch (apiError) {
          console.log('API de download não disponível, tentando método alternativo')
        }
      }

      // Método alternativo: usar arquivo_assinado, caminho_arquivo ou arquivo_original
      const arquivoUrl = documento.arquivo_assinado || documento.caminho_arquivo || documento.arquivo_original
      const nomeArquivo = documento.titulo || documento.nome || `documento-${documento.id}`
      
      await downloadArquivo(arquivoUrl, nomeArquivo)
      
      toast({
        title: "Sucesso",
        description: "Documento baixado com sucesso"
      })
    } catch (error: any) {
      console.error('Erro ao baixar documento:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao baixar documento",
        variant: "destructive"
      })
    }
  }

  const calcularPeriodoLocacao = (inicio: string | undefined, fim: string | undefined) => {
    if (!inicio) return 'Não informado'
    if (!fim) return `Desde ${formatarData(inicio)}`
    
    const inicioDate = new Date(inicio)
    const fimDate = new Date(fim)
    const diffTime = Math.abs(fimDate.getTime() - inicioDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return `${formatarData(inicio)} até ${formatarData(fim)} (${diffDays} dias)`
  }

  const handleImprimir = () => {
    window.print()
  }

  const handleExportar = () => {
    // TODO: Implementar exportação PDF
    alert('Exportação PDF em desenvolvimento')
  }

  if (loading) {
    return <CardLoader />
  }

  if (!obra) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Obra não encontrada</p>
        </CardContent>
      </Card>
    )
  }

  // Buscar relação da grua (pode estar em grua_obra ou gruasVinculadas)
  const relacaoGruaBase = gruaSelecionada?.relacao || obra.gruasVinculadas?.find((g: any) => 
    g.id === gruaSelecionada?.id || 
    g.grua_id === gruaSelecionada?.id || 
    g.grua?.id === gruaSelecionada?.id ||
    (g.grua && g.grua.id === gruaSelecionada?.id)
  ) || obra.grua_obra?.find((g: any) => 
    g.grua_id === gruaSelecionada?.id || 
    g.grua?.id === gruaSelecionada?.id
  )

  // Dados mockados para completar os campos quando não estiverem disponíveis
  const dadosMockados = {
    // Parâmetros técnicos
    tipo_base: 'chumbador',
    altura_inicial: 15.5,
    altura_final: 45.0,
    velocidade_giro: 0.8,
    velocidade_elevacao: 60.0,
    velocidade_translacao: 40.0,
    potencia_instalada: 50.0,
    voltagem: '380',
    tipo_ligacao: 'trifasica',
    capacidade_ponta: 2000,
    capacidade_maxima_raio: 8000,
    ano_fabricacao: 2020,
    vida_util: 25,
    // Valores detalhados
    valor_operador: 10200.00,
    valor_manutencao: 3750.00,
    valor_estaiamento: 2600.00,
    valor_chumbadores: 18600.00,
    valor_montagem: 28750.00,
    valor_desmontagem: 36700.00,
    valor_transporte: 7600.00,
    valor_hora_extra: 150.00,
    valor_seguro: 5000.00,
    valor_caucao: 50000.00,
    // Serviços e logística
    guindaste_montagem: 'incluso',
    quantidade_viagens: 2,
    alojamento_alimentacao: 'incluso',
    responsabilidade_acessorios: 'Estropos, caçambas, garfos e baldes fornecidos pela locadora. Cliente responsável por manutenção e reposição de peças de desgaste.',
    // Condições comerciais
    prazo_validade: 30,
    forma_pagamento: 'mensal',
    multa_atraso: 2.0,
    reajuste_indice: 'igp_m',
    garantia_caucao: '10% do valor total da locação',
    retencao_contratual: 10.0
  }

  // Dados mockados para sinaleiros quando não houver dados
  const sinaleirosMockados = (obra?.sinaleiros && obra.sinaleiros.length > 0) ? obra.sinaleiros : [
    {
      nome: 'João Silva',
      tipo_vinculo: 'interno',
      cpf: '123.456.789-00',
      rg: '12.345.678-9',
      documentos: [
        { nome: 'CNH', tipo: 'cnh' },
        { nome: 'Comprovante de Residência', tipo: 'comprovante' }
      ],
      certificados: [
        { nome: 'NR-35 - Trabalho em Altura', tipo: 'nr35', numero: 'NR35-2024-001', validade: '2025-12-31' },
        { nome: 'Sinaleiro de Guindaste', tipo: 'sinaleiro', numero: 'SG-2024-123', validade: '2026-06-30' }
      ]
    },
    {
      nome: 'Maria Santos',
      tipo_vinculo: 'cliente',
      cpf: '987.654.321-00',
      rg: '98.765.432-1',
      documentos: [
        { nome: 'RG', tipo: 'rg' },
        { nome: 'CPF', tipo: 'cpf' }
      ],
      certificados: [
        { nome: 'NR-35 - Trabalho em Altura', tipo: 'nr35', numero: 'NR35-2024-002', validade: '2025-11-30' }
      ]
    }
  ]

  // Combinar dados reais com dados mockados (dados reais têm prioridade)
  const relacaoGrua = {
    ...dadosMockados,
    ...relacaoGruaBase,
    // Garantir que valor_locacao tenha prioridade sobre valor_locacao_mensal
    valor_locacao: relacaoGruaBase?.valor_locacao || relacaoGruaBase?.valor_locacao_mensal || 31600.00
  }
  
  // Buscar funcionários vinculados à grua
  const funcionariosGrua = (obra.funcionariosVinculados || obra.grua_funcionario || []).filter((f: any) => {
    const fGruaId = f.grua_id || f.grua?.id
    const sGruaId = gruaSelecionada?.id
    return fGruaId === sGruaId || fGruaId?.toString() === sGruaId?.toString()
  }) || []

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Cabeçalho do Livro */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 pt-6 pb-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold">Livro da Grua</h2>
              <p className="text-base mt-1 text-muted-foreground">
                Manual de Operação da Obra - {obra.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={handleExportar} className="h-9 px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleImprimir} className="h-9 px-4 py-2">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Seletor de Grua */}
      {(() => {
        const gruasDisponiveis = obra.gruasVinculadas || obra.grua_obra || []
        if (gruasDisponiveis.length > 1) {
          return (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2 flex-wrap">
                  {gruasDisponiveis.map((gruaRel: any) => {
                    const gruaId = gruaRel.grua?.id || gruaRel.id
                    const gruaName = gruaRel.grua?.modelo || gruaRel.name || gruaRel.modelo || `Grua ${gruaId}`
                    const isSelected = gruaSelecionada?.id === gruaId || 
                                     (gruaRel.grua && gruaSelecionada?.id === gruaRel.grua.id)
                    
                    return (
                      <Button
                        key={gruaRel.id || gruaId}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => {
                          if (gruaRel.grua) {
                            setGruaSelecionada({
                              ...gruaRel.grua,
                              relacao: gruaRel,
                              name: gruaName
                            })
                          } else {
                            setGruaSelecionada({
                              ...gruaRel,
                              relacao: gruaRel
                            })
                          }
                        }}
                        className="print:hidden"
                      >
                        {gruaName}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        }
        return null
      })()}

      {(() => {
        const gruasDisponiveis = obra.gruasVinculadas || obra.grua_obra || []
        if (!gruaSelecionada && gruasDisponiveis.length === 0) {
          return (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">Nenhuma grua vinculada a esta obra</p>
              </CardContent>
            </Card>
          )
        }
        return null
      })()}

      {gruaSelecionada ? (
        <>
          {/* 1. DADOS DA OBRA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                1. Dados da Obra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Nome da Obra</p>
                  <p className="font-medium">{obra.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cliente/Contratante</p>
                  <p className="font-medium">{obra.cliente?.nome || obra.client || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CNPJ do Cliente</p>
                  <p className="font-medium">{obra.cliente?.cnpj || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Endereço</p>
                  <p className="font-medium">{obra.endereco || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cidade/Estado</p>
                  <p className="font-medium">{obra.cidade || 'Não informado'}, {obra.estado || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CEP</p>
                  <p className="font-medium">{obra.cep || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Obra</p>
                  <p className="font-medium">{obra.tipo || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge variant="outline">{obra.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Período da Obra</p>
                  <p className="font-medium">
                    {obra.startDate ? formatarData(obra.startDate) : 'Não informado'}
                    {obra.endDate && ` - ${formatarData(obra.endDate)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. EQUIPAMENTO - GRUA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                2. Equipamento - Grua
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Identificação</p>
                  <p className="font-medium">{gruaSelecionada.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Modelo</p>
                  <p className="font-medium">{gruaSelecionada.modelo || gruaSelecionada.model || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fabricante</p>
                  <p className="font-medium">{gruaSelecionada.fabricante || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="font-medium">{gruaSelecionada.tipo || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacidade</p>
                  <p className="font-medium">{gruaSelecionada.capacidade || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Altura Máxima</p>
                  <p className="font-medium">{gruaSelecionada.altura_maxima || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Alcance Máximo (Raio)</p>
                  <p className="font-medium">{gruaSelecionada.alcance_maximo || relacaoGrua?.raio_operacao || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Número de Série</p>
                  <p className="font-medium">{gruaSelecionada.numero_serie || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Base</p>
                  <p className="font-medium">{relacaoGrua?.tipo_base || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Altura Inicial (m)</p>
                  <p className="font-medium">{relacaoGrua?.altura_inicial ? `${relacaoGrua.altura_inicial}m` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Altura Final (m)</p>
                  <p className="font-medium">{relacaoGrua?.altura_final ? `${relacaoGrua.altura_final}m` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Velocidade de Giro (rpm)</p>
                  <p className="font-medium">{relacaoGrua?.velocidade_giro ? `${relacaoGrua.velocidade_giro} rpm` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Velocidade de Elevação (m/min)</p>
                  <p className="font-medium">{relacaoGrua?.velocidade_elevacao ? `${relacaoGrua.velocidade_elevacao} m/min` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Velocidade de Translação (m/min)</p>
                  <p className="font-medium">{relacaoGrua?.velocidade_translacao ? `${relacaoGrua.velocidade_translacao} m/min` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Potência Instalada (kVA)</p>
                  <p className="font-medium">{relacaoGrua?.potencia_instalada ? `${relacaoGrua.potencia_instalada} kVA` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Voltagem</p>
                  <p className="font-medium">{relacaoGrua?.voltagem ? `${relacaoGrua.voltagem}V` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Ligação Elétrica</p>
                  <p className="font-medium">{relacaoGrua?.tipo_ligacao === 'monofasica' ? 'Monofásica' : relacaoGrua?.tipo_ligacao === 'trifasica' ? 'Trifásica' : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacidade na Ponta (kg)</p>
                  <p className="font-medium">{relacaoGrua?.capacidade_ponta ? `${relacaoGrua.capacidade_ponta} kg` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacidade Máx. por Raio (kg)</p>
                  <p className="font-medium">{relacaoGrua?.capacidade_maxima_raio ? `${relacaoGrua.capacidade_maxima_raio} kg` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ano de Fabricação</p>
                  <p className="font-medium">{relacaoGrua?.ano_fabricacao || gruaSelecionada.ano_fabricacao || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vida Útil Estimada (anos)</p>
                  <p className="font-medium">{relacaoGrua?.vida_util ? `${relacaoGrua.vida_util} anos` : 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. RESPONSÁVEIS E EQUIPE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                3. Responsáveis e Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Cliente/Contratante</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{obra.cliente?.nome || obra.client || 'Não informado'}</p>
                    {obra.cliente?.cnpj && <p className="text-sm text-gray-600">CNPJ: {obra.cliente.cnpj}</p>}
                    {obra.cliente?.email && <p className="text-sm text-gray-600">Email: {obra.cliente.email}</p>}
                    {obra.cliente?.telefone && <p className="text-sm text-gray-600">Telefone: {obra.cliente.telefone}</p>}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Responsável pela Obra</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{obra.responsavelName || obra.responsavel_nome || 'Não informado'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Engenheiro do Cliente / Responsável Técnico</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {(obra.responsavel_tecnico?.nome || obra.responsavelTecnico?.nome) ? (
                      <>
                        <p className="font-medium">{obra.responsavel_tecnico?.nome || obra.responsavelTecnico?.nome}</p>
                        {(obra.responsavel_tecnico?.crea || obra.responsavelTecnico?.crea) && (
                          <p className="text-sm text-gray-600">CREA: {obra.responsavel_tecnico?.crea || obra.responsavelTecnico?.crea}</p>
                        )}
                        {(obra.responsavel_tecnico?.email || obra.responsavelTecnico?.email) && (
                          <p className="text-sm text-gray-600">Email: {obra.responsavel_tecnico?.email || obra.responsavelTecnico?.email}</p>
                        )}
                        {(obra.responsavel_tecnico?.telefone || obra.responsavelTecnico?.telefone) && (
                          <p className="text-sm text-gray-600">Telefone: {obra.responsavel_tecnico?.telefone || obra.responsavelTecnico?.telefone}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">Não informado</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Operador da Grua</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador')) ? (
                      <>
                        <p className="font-medium">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador'))?.funcionario?.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador'))?.funcionario?.cargo}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">Não informado</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Sinaleiros</p>
                  <div className="space-y-3">
                    {sinaleirosMockados.length > 0 ? (
                      sinaleirosMockados.map((s: any, idx: number) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Nome</p>
                              <p className="font-medium">{s.nome || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tipo de Vínculo</p>
                              <Badge variant={s.tipo_vinculo === 'interno' ? 'default' : 'outline'}>
                                {s.tipo_vinculo === 'interno' ? 'Interno' : s.tipo_vinculo === 'cliente' ? 'Indicado pelo Cliente' : 'Não informado'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">CPF</p>
                              <p className="font-medium">{s.cpf || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">RG</p>
                              <p className="font-medium">{s.rg || s.rg_cpf || 'Não informado'}</p>
                            </div>
                            {(s.documentos && s.documentos.length > 0) || (s.certificados && s.certificados.length > 0) ? (
                              <>
                                {s.documentos && s.documentos.length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-xs text-gray-500 mb-2">Documentos</p>
                                    <div className="flex flex-wrap gap-2">
                                      {s.documentos.map((doc: any, docIdx: number) => (
                                        <Badge key={docIdx} variant="outline" className="flex items-center gap-1">
                                          <FileText className="w-3 h-3" />
                                          {doc.nome || doc.tipo || 'Documento'}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {s.certificados && s.certificados.length > 0 && (
                                  <div className="md:col-span-2">
                                    <p className="text-xs text-gray-500 mb-2">Certificados</p>
                                    <div className="flex flex-wrap gap-2">
                                      {s.certificados.map((cert: any, certIdx: number) => (
                                        <Badge key={certIdx} variant="outline" className="flex items-center gap-1">
                                          <Shield className="w-3 h-3" />
                                          {cert.nome || cert.tipo || 'Certificado'}
                                          {cert.numero && ` - ${cert.numero}`}
                                          {cert.validade && ` (Válido até ${new Date(cert.validade).toLocaleDateString('pt-BR')})`}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="md:col-span-2">
                                <p className="text-xs text-gray-500">Documentos e Certificados: Não informado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-500">Nenhum sinaleiro cadastrado</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Técnico de Manutenção</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico')) ? (
                      <>
                        <p className="font-medium">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico'))?.funcionario?.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico'))?.funcionario?.cargo}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">Não informado</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. LOCALIZAÇÃO E AMBIENTE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                4. Localização e Ambiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Endereço Completo</p>
                  <p className="font-medium">{obra.endereco || 'Não informado'}</p>
                  <p className="text-sm text-gray-600">{obra.cidade || ''}, {obra.estado || ''} - CEP: {obra.cep || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Canteiro de Obras</p>
                  <p className="font-medium">{obra.canteiro || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fundação da Grua</p>
                  <p className="font-medium">{relacaoGrua?.fundacao || relacaoGrua?.fundacao_tipo || 'Não informado'}</p>
                  {relacaoGrua?.fundacao_dimensoes && (
                    <p className="text-xs text-gray-500 mt-1">Dimensões: {relacaoGrua.fundacao_dimensoes}</p>
                  )}
                  {relacaoGrua?.fundacao_especificacoes && (
                    <p className="text-xs text-gray-500 mt-1">Especificações: {relacaoGrua.fundacao_especificacoes}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Local de Instalação</p>
                  <p className="font-medium">{relacaoGrua?.local_instalacao || relacaoGrua?.local || 'Não informado'}</p>
                  {relacaoGrua?.coordenadas && (
                    <p className="text-xs text-gray-500 mt-1">Coordenadas: {relacaoGrua.coordenadas}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Condições do Ambiente</p>
                  <p className="font-medium">{relacaoGrua?.condicoes_ambiente || relacaoGrua?.ambiente || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Modelo, Raio e Altura</p>
                  <p className="font-medium">
                    {gruaSelecionada.modelo || gruaSelecionada.model || 'Não informado'}
                    {gruaSelecionada.alcance_maximo && ` - Raio: ${gruaSelecionada.alcance_maximo}`}
                    {gruaSelecionada.altura_maxima && ` - Altura: ${gruaSelecionada.altura_maxima}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. PERÍODO DE LOCAÇÃO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                5. Período de Locação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Data de Início</p>
                  <p className="font-medium">{formatarData(relacaoGrua?.data_inicio_locacao)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data de Fim</p>
                  <p className="font-medium">{formatarData(relacaoGrua?.data_fim_locacao) || 'Não definido'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Período Total</p>
                  <p className="font-medium">
                    {calcularPeriodoLocacao(relacaoGrua?.data_inicio_locacao, relacaoGrua?.data_fim_locacao)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. VALORES E CUSTOS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                6. Valores e Custos Detalhados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Locação Mensal da Grua</p>
                  <p className="font-medium text-lg">{formatarMoeda(relacaoGrua?.valor_locacao || relacaoGrua?.valor_locacao_mensal || 31600.00)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Operador / Sinaleiro</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_operador)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Manutenção Preventiva</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_manutencao)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estaiamento por Unidade</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_estaiamento)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Chumbadores</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_chumbadores)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Montagem</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_montagem)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Desmontagem</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_desmontagem)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Transporte Ida/Volta por Viagem</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_transporte)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hora Extra</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_hora_extra)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Seguro Responsabilidade Civil</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_seguro)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Caução / Depósito de Garantia</p>
                  <p className="font-medium">{formatarMoeda(relacaoGrua?.valor_caucao)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Orçamento da Obra</p>
                  <p className="font-medium text-lg">{formatarMoeda(obra.orcamento || obra.budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total de Custos</p>
                  <p className="font-medium text-lg">{formatarMoeda(obra.totalCustos || obra.valorTotalObra)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.5. SERVIÇOS E LOGÍSTICA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4" />
                6.5. Serviços e Logística
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Guindaste para Montagem/Desmontagem</p>
                  <p className="font-medium">
                    {relacaoGrua?.guindaste_montagem === 'incluso' ? 'Incluso' : 
                     relacaoGrua?.guindaste_montagem === 'cliente' ? 'Por conta do cliente' : 
                     'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantidade de Viagens de Transporte</p>
                  <p className="font-medium">{relacaoGrua?.quantidade_viagens || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Alojamento / Alimentação Equipe</p>
                  <p className="font-medium">
                    {relacaoGrua?.alojamento_alimentacao === 'incluso' ? 'Incluso' : 
                     relacaoGrua?.alojamento_alimentacao === 'cliente' ? 'Por conta do cliente' : 
                     relacaoGrua?.alojamento_alimentacao === 'nao_aplicavel' ? 'Não aplicável' : 
                     'Não informado'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">Responsabilidade por Acessórios</p>
                  <p className="font-medium">{relacaoGrua?.responsabilidade_acessorios || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.6. CONDIÇÕES COMERCIAIS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                6.6. Condições Comerciais e Contratuais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Prazo de Validade da Proposta (dias)</p>
                  <p className="font-medium">{relacaoGrua?.prazo_validade ? `${relacaoGrua.prazo_validade} dias` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Forma de Pagamento / Medição</p>
                  <p className="font-medium">
                    {relacaoGrua?.forma_pagamento === 'mensal' ? 'Mensal' : 
                     relacaoGrua?.forma_pagamento === 'quinzenal' ? 'Quinzenal' : 
                     relacaoGrua?.forma_pagamento === 'semanal' ? 'Semanal' : 
                     relacaoGrua?.forma_pagamento === 'unica' ? 'Única' : 
                     'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Multa por Atraso</p>
                  <p className="font-medium">{relacaoGrua?.multa_atraso ? `${relacaoGrua.multa_atraso}%` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reajuste por Índice</p>
                  <p className="font-medium">
                    {relacaoGrua?.reajuste_indice === 'igp_m' ? 'IGP-M' : 
                     relacaoGrua?.reajuste_indice === 'ipca' ? 'IPCA' : 
                     relacaoGrua?.reajuste_indice === 'inpc' ? 'INPC' : 
                     relacaoGrua?.reajuste_indice === 'sem_reajuste' ? 'Sem reajuste' : 
                     'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Garantia / Caução de Mobilização</p>
                  <p className="font-medium">{relacaoGrua?.garantia_caucao || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Retenção Contratual</p>
                  <p className="font-medium">{relacaoGrua?.retencao_contratual ? `${relacaoGrua.retencao_contratual}%` : 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7. DOCUMENTOS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                7. Documentos e Certificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">CNO da Obra</p>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">{obra.cno || obra.cno_obra || 'Não informado'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">ART (Anotação de Responsabilidade Técnica)</p>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">{obra.art_numero || obra.artNumero || 'Não informado'}</p>
                      {(obra.art_arquivo || obra.artArquivo) && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            <ClipboardCheck className="w-3 h-3 mr-1" />
                            Documento anexado
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                const arquivoUrl = obra.art_arquivo || obra.artArquivo
                                await downloadArquivo(arquivoUrl, `ART-${obra.art_numero || obra.artNumero || 'documento'}`)
                                toast({
                                  title: "Sucesso",
                                  description: "ART baixada com sucesso"
                                })
                              } catch (error: any) {
                                toast({
                                  title: "Erro",
                                  description: error.message || "Erro ao baixar ART",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Apólice de Seguro</p>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">{obra.apolice_numero || obra.apoliceNumero || 'Não informado'}</p>
                      {(obra.apolice_arquivo || obra.apoliceArquivo) && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            <Shield className="w-3 h-3 mr-1" />
                            Documento anexado
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                const arquivoUrl = obra.apolice_arquivo || obra.apoliceArquivo
                                await downloadArquivo(arquivoUrl, `Apolice-${obra.apolice_numero || obra.apoliceNumero || 'documento'}`)
                                toast({
                                  title: "Sucesso",
                                  description: "Apólice baixada com sucesso"
                                })
                              } catch (error: any) {
                                toast({
                                  title: "Erro",
                                  description: error.message || "Erro ao baixar Apólice",
                                  variant: "destructive"
                                })
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {documentos.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Outros Documentos</p>
                    <div className="space-y-2">
                      {documentos.map((doc: any) => (
                        <div key={doc.id} className="p-3 bg-gray-50 rounded-md flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{doc.titulo || doc.nome || doc.tipo}</p>
                            {doc.descricao && <p className="text-sm text-gray-600">{doc.descricao}</p>}
                            {doc.arquivo_original && (
                              <p className="text-xs text-gray-500 mt-1">
                                {doc.arquivo_original.split('/').pop() || doc.arquivo_original}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {doc.status?.replace('_', ' ') || 'Documento'}
                            </Badge>
                            {(doc.arquivo_assinado || doc.caminho_arquivo || doc.arquivo_original || doc.id) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadDocumento(doc)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Baixar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 8. CONFIGURAÇÃO E ESPECIFICAÇÕES */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                8. Configuração e Especificações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Raio de Operação (Alcance Máximo)</p>
                  <p className="font-medium">{relacaoGrua?.raio_operacao || relacaoGrua?.raio || gruaSelecionada.alcance_maximo || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Altura de Operação</p>
                  <p className="font-medium">{gruaSelecionada.altura_maxima || relacaoGrua?.altura || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Manual de Operação</p>
                  <p className="font-medium">{relacaoGrua?.manual_operacao || 'Vinculado à obra'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Procedimentos</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">
                      {relacaoGrua?.procedimento_montagem ? '✓ Montagem' : '✗ Montagem'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {relacaoGrua?.procedimento_operacao ? '✓ Operação' : '✗ Operação'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {relacaoGrua?.procedimento_desmontagem ? '✓ Desmontagem' : '✗ Desmontagem'}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">Condições Especiais e Observações</p>
                  <p className="font-medium">{relacaoGrua?.observacoes || obra.observacoes || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 9. OBSERVAÇÕES GERAIS */}
          {(obra.observacoes || relacaoGrua?.observacoes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  9. Observações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {obra.observacoes && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Observações da Obra</p>
                      <p className="text-sm">{obra.observacoes}</p>
                    </div>
                  )}
                  {relacaoGrua?.observacoes && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Observações da Grua</p>
                      <p className="text-sm">{relacaoGrua.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}

