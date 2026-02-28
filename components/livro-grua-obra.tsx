"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
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
  CreditCard,
  BookOpen,
  FileCheck,
  Package,
  Loader2
} from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend } from "@/lib/api-obras"
import { obrasDocumentosApi } from "@/lib/api-obras-documentos"
import { obrasArquivosApi } from "@/lib/api-obras-arquivos"
import api from "@/lib/api"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { gruasApi } from "@/lib/api-gruas"
import { CardLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

// Nota: Este componente usa gruaObraApi (não obraGruasApi) para buscar relacionamentos grua-obra

interface LivroGruaObraProps {
  obraId: string
  cachedData?: any
  onDataLoaded?: (data: any) => void
  onRequestEdit?: () => void
}

export function LivroGruaObra({ obraId, cachedData, onDataLoaded, onRequestEdit }: LivroGruaObraProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(!cachedData)
  const [obra, setObra] = useState<any>(cachedData?.obra || null)
  const [documentos, setDocumentos] = useState<any[]>(cachedData?.documentos || [])
  const [gruaSelecionada, setGruaSelecionada] = useState<any>(cachedData?.gruaSelecionada || null)
  const [isEditingLivro, setIsEditingLivro] = useState(false)
  const [savingLivro, setSavingLivro] = useState(false)
  const [livroForm, setLivroForm] = useState<any>({})

  useEffect(() => {
    // Só carregar se não houver dados em cache
    if (!cachedData) {
      carregarDados()
    } else {
      setLoading(false)
    }
  }, [obraId])

  // Selecionar automaticamente a primeira grua quando os dados carregarem
  useEffect(() => {
    if (obra && !gruaSelecionada && !loading) {
      const gruasDisponiveis = obra.gruasVinculadas || obra.grua_obra || []
      console.log('🔍 DEBUG LivroGruaObra - Selecionando grua:', {
        obraId: obra.id,
        gruasDisponiveis: gruasDisponiveis.length,
        gruas: gruasDisponiveis
      })
      
      if (gruasDisponiveis.length > 0) {
        const primeiraGrua = gruasDisponiveis[0]
        console.log('🔍 DEBUG - Primeira grua encontrada:', primeiraGrua)
        
        if (primeiraGrua.grua) {
          const gruaParaSelecionar = {
            ...primeiraGrua.grua,
            relacao: primeiraGrua,
            name: primeiraGrua.grua.modelo || primeiraGrua.grua.name || `Grua ${primeiraGrua.grua.id}`
          }
          console.log('✅ Selecionando grua (com grua.grua):', gruaParaSelecionar)
          setGruaSelecionada(gruaParaSelecionar)
          
          // Atualizar cache com grua selecionada
          if (onDataLoaded) {
            onDataLoaded({
              obra,
              documentos,
              gruaSelecionada: gruaParaSelecionar
            })
          }
        } else {
          const gruaParaSelecionar = {
            ...primeiraGrua,
            relacao: primeiraGrua
          }
          console.log('✅ Selecionando grua (direto):', gruaParaSelecionar)
          setGruaSelecionada(gruaParaSelecionar)
          
          // Atualizar cache com grua selecionada
          if (onDataLoaded) {
            onDataLoaded({
              obra,
              documentos,
              gruaSelecionada: gruaParaSelecionar
            })
          }
        }
      } else {
        console.log('⚠️ Nenhuma grua disponível para selecionar')
      }
    }
  }, [obra, gruaSelecionada, loading, documentos, onDataLoaded])

  const mapCategoriaLivroArquivo = (arquivo: any) => {
    const categoria = String(arquivo?.categoria || '').toLowerCase()
    const texto = `${String(arquivo?.nome_original || '')} ${String(arquivo?.descricao || '')}`.toLowerCase()

    if (categoria === 'manual') {
      if (texto.includes('montagem')) return 'manual_montagem'
      return 'manual_tecnico'
    }

    if (categoria === 'certificado') {
      if (texto.includes('aterramento')) return 'aterramento'
      return 'termo_entrega_tecnica'
    }

    if (categoria === 'outro') {
      if (texto.includes('aterramento')) return 'aterramento'
      if (texto.includes('plano') && texto.includes('carga')) return 'plano_carga'
      return 'outro'
    }

    return categoria || 'geral'
  }

  const obterTituloPadraoPorCategoria = (categoriaLivro: string, tituloOriginal: string) => {
    const tituloLimpo = (tituloOriginal || '').trim()
    if (tituloLimpo) {
      if (categoriaLivro === 'manual_tecnico' && !tituloLimpo.toLowerCase().includes('plano decargas')) return tituloLimpo
      if (categoriaLivro === 'manual_montagem' && !tituloLimpo.toLowerCase().includes('plano decargas')) return tituloLimpo
      if (categoriaLivro === 'termo_entrega_tecnica' && !tituloLimpo.toLowerCase().includes('plano decargas')) return tituloLimpo
      if (categoriaLivro === 'plano_carga') return tituloLimpo
      if (categoriaLivro === 'aterramento' && !tituloLimpo.toLowerCase().includes('plano decargas')) return tituloLimpo
    }

    switch (categoriaLivro) {
      case 'manual_tecnico':
        return 'Ficha Técnica do Equipamento.pdf'
      case 'manual_montagem':
        return 'Manual de Montagem.pdf'
      case 'termo_entrega_tecnica':
        return 'Termo de Entrega Técnica.pdf'
      case 'plano_carga':
        return 'Plano de Cargas.pdf'
      case 'aterramento':
        return 'Documento de Aterramento.pdf'
      default:
        return tituloLimpo || 'Arquivo.pdf'
    }
  }

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Verificar se a API está disponível
      if (!gruaObraApi) {
        throw new Error('gruaObraApi não está disponível')
      }
      
      // Carregar obra e gruas em paralelo
      const [obraResponse, gruasResponse] = await Promise.all([
        obrasApi.obterObra(parseInt(obraId)),
        gruaObraApi.buscarGruasPorObra(parseInt(obraId))
      ])
      
      const obraData = obraResponse.data || obraResponse
      
      // Converter para formato frontend
      const obraConvertida = converterObraBackendParaFrontend(obraData, {
        gruasVinculadas: [],
        funcionariosVinculados: obraData.grua_funcionario || []
      })
      
      // Garantir que sinaleiros sejam carregados (pode vir como sinaleiros_obra ou sinaleiros)
      if (obraData.sinaleiros_obra && !obraConvertida.sinaleiros) {
        obraConvertida.sinaleiros = obraData.sinaleiros_obra
      }
      
      setObra(obraConvertida)

      // Carregar documentos
      const docsResponse = await obrasDocumentosApi.listarPorObra(parseInt(obraId))
      let documentosData: any[] = []
      if (docsResponse.success && docsResponse.data) {
        documentosData = Array.isArray(docsResponse.data) ? docsResponse.data : [docsResponse.data]
      }

      // Carregar arquivos também e converter para formato de documentos
      try {
        const arquivosResponse = await obrasArquivosApi.listarPorObra(parseInt(obraId))
        if (arquivosResponse.success && arquivosResponse.data) {
          const arquivosComoDocumentos = arquivosResponse.data.map((arquivo: any) => {
            const categoriaLivro = mapCategoriaLivroArquivo(arquivo)
            return ({
            id: `arquivo_${arquivo.id}`,
            titulo: obterTituloPadraoPorCategoria(categoriaLivro, arquivo.nome_original || arquivo.descricao || ''),
            descricao: arquivo.descricao,
            categoria: categoriaLivro,
            caminho_arquivo: arquivo.caminho,
            arquivo_original: arquivo.caminho,
            created_at: arquivo.created_at
          })})
          documentosData = [...documentosData, ...arquivosComoDocumentos]
        }
      } catch (error) {
        console.log('Erro ao carregar arquivos:', error)
      }

      // Compatibilidade: carregar uploads legados da rota /api/arquivos/obra/:id
      // (usada por versões anteriores na criação de obra)
      try {
        const legacyResponse = await api.get(`/arquivos/obra/${obraId}`)
        const legacyData = legacyResponse?.data?.data
        if (legacyResponse?.data?.success && Array.isArray(legacyData)) {
          const legacyComoDocumentos = legacyData.map((arquivo: any) => {
            const categoriaLivro = mapCategoriaLivroArquivo(arquivo)
            return ({
            id: `legacy_${arquivo.id}`,
            titulo: obterTituloPadraoPorCategoria(categoriaLivro, arquivo.nome_original || arquivo.descricao || ''),
            descricao: arquivo.descricao,
            categoria: categoriaLivro,
            caminho_arquivo: arquivo.caminho,
            arquivo_original: arquivo.caminho,
            created_at: arquivo.created_at
          })})

          const caminhosAtuais = new Set(
            documentosData.map((d: any) => d.caminho_arquivo || d.arquivo_original).filter(Boolean)
          )
          const legacySemDuplicar = legacyComoDocumentos.filter(
            (d: any) => !caminhosAtuais.has(d.caminho_arquivo || d.arquivo_original)
          )

          documentosData = [...documentosData, ...legacySemDuplicar]
        }
      } catch (error) {
        console.log('Erro ao carregar arquivos legados:', error)
      }

      setDocumentos(documentosData)

      // Salvar dados em cache via callback
      if (onDataLoaded) {
        onDataLoaded({
          obra: obraConvertida,
          documentos: documentosData,
          gruaSelecionada: null // Será definida pelo useEffect abaixo
        })
      }

      // Processar gruas da API relacionamentos/grua-obra
      let gruasDisponiveis: any[] = []
      if (gruasResponse.success && gruasResponse.data && Array.isArray(gruasResponse.data)) {
        gruasDisponiveis = gruasResponse.data.map((relacao: any) => {
          const grua = relacao.grua || {}
          
          // Limpar e corrigir valores de fabricante e modelo
          let fabricante = (grua.fabricante || '').trim()
          let modelo = (grua.modelo || '').trim()
          
          // Remover prefixos/sufixos incorretos
          if (fabricante) {
            fabricante = fabricante.replace(/^Fabricante/i, '').trim()
          }
          if (modelo) {
            modelo = modelo.replace(/^Modelo/i, '').replace(/Samuel/i, '').trim()
          }
          
          // Construir nome da grua de forma segura
          let nameFinal = (grua.name || '').trim()
          if (!nameFinal || nameFinal.toLowerCase().includes('fabricante') || nameFinal.toLowerCase().includes('modelo')) {
            if (fabricante && modelo) {
              nameFinal = `${fabricante} ${modelo}`
            } else if (fabricante) {
              nameFinal = fabricante
            } else if (modelo) {
              nameFinal = modelo
            } else {
              nameFinal = `Grua ${grua.id || relacao.grua_id || 'N/A'}`
            }
          }
          
          return {
            id: grua.id || relacao.grua_id,
            name: nameFinal,
            modelo: modelo || grua.modelo || 'Modelo não informado',
            fabricante: fabricante || grua.fabricante || 'Fabricante não informado',
            tipo: grua.tipo || 'Tipo não informado',
            capacidade: grua.capacidade || 'Capacidade não informada',
            // Incluir todos os campos técnicos da grua
            ...grua,
            // Campos específicos da grua que podem estar na grua ou na relação
            altura_maxima: grua.altura_maxima || grua.altura_trabalho || grua.altura_final || relacao.altura_final,
            alcance_maximo: grua.alcance_maximo || relacao.capacidade_maxima_raio,
            numero_serie: grua.numero_serie || grua.num_serie,
            relacao: {
              ...relacao,
              // Incluir TODOS os dados de montagem da relação
              tipo_base: relacao.tipo_base,
              altura_inicial: relacao.altura_inicial,
              altura_final: relacao.altura_final,
              velocidade_giro: relacao.velocidade_giro,
              velocidade_elevacao: relacao.velocidade_elevacao,
              velocidade_translacao: relacao.velocidade_translacao,
              potencia_instalada: relacao.potencia_instalada,
              voltagem: relacao.voltagem,
              tipo_ligacao: relacao.tipo_ligacao,
              capacidade_ponta: relacao.capacidade_ponta,
              capacidade_maxima_raio: relacao.capacidade_maxima_raio,
              capacidade_1_cabo: relacao.capacidade_1_cabo,
              capacidade_2_cabos: relacao.capacidade_2_cabos,
              velocidade_rotacao: relacao.velocidade_rotacao,
              ano_fabricacao: relacao.ano_fabricacao,
              vida_util: relacao.vida_util,
              data_inicio_locacao: relacao.data_inicio_locacao,
              data_fim_locacao: relacao.data_fim_locacao,
              valor_locacao_mensal: relacao.valor_locacao_mensal,
              status: relacao.status,
              observacoes: relacao.observacoes,
              observacoes_montagem: relacao.observacoes_montagem,
              local_instalacao: relacao.local_instalacao,
              data_montagem: relacao.data_montagem,
              data_desmontagem: relacao.data_desmontagem
            }
          }
        })
      }
      
      // Também tentar usar grua_obra que vem na resposta da obra
      if (gruasDisponiveis.length === 0 && obraData.grua_obra && Array.isArray(obraData.grua_obra)) {
        gruasDisponiveis = obraData.grua_obra.map((relacao: any) => {
          const grua = relacao.grua || {}
          
          let fabricante = (grua.fabricante || '').trim()
          let modelo = (grua.modelo || '').trim()
          
          if (fabricante) {
            fabricante = fabricante.replace(/^Fabricante/i, '').trim()
          }
          if (modelo) {
            modelo = modelo.replace(/^Modelo/i, '').replace(/Samuel/i, '').trim()
          }
          
          let nameFinal = modelo || fabricante || `Grua ${grua.id || relacao.grua_id || 'N/A'}`
          
          return {
            id: grua.id || relacao.grua_id,
            name: nameFinal,
            modelo: modelo || grua.modelo || 'Modelo não informado',
            fabricante: fabricante || grua.fabricante || 'Fabricante não informado',
            tipo: grua.tipo || 'Tipo não informado',
            capacidade: grua.capacidade || 'Capacidade não informada',
            // Incluir todos os campos técnicos da grua
            ...grua,
            // Campos específicos da grua que podem estar na grua ou na relação
            altura_maxima: grua.altura_maxima || grua.altura_trabalho || grua.altura_final || relacao.altura_final,
            alcance_maximo: grua.alcance_maximo || relacao.capacidade_maxima_raio,
            numero_serie: grua.numero_serie || grua.num_serie,
            relacao: {
              ...relacao,
              // Incluir TODOS os campos da relação (incluindo dados de montagem)
              ...relacao,
              tipo_base: relacao.tipo_base,
              altura_inicial: relacao.altura_inicial,
              altura_final: relacao.altura_final,
              velocidade_giro: relacao.velocidade_giro,
              velocidade_elevacao: relacao.velocidade_elevacao,
              velocidade_translacao: relacao.velocidade_translacao,
              potencia_instalada: relacao.potencia_instalada,
              voltagem: relacao.voltagem,
              tipo_ligacao: relacao.tipo_ligacao,
              capacidade_ponta: relacao.capacidade_ponta,
              capacidade_maxima_raio: relacao.capacidade_maxima_raio,
              capacidade_1_cabo: relacao.capacidade_1_cabo,
              capacidade_2_cabos: relacao.capacidade_2_cabos,
              velocidade_rotacao: relacao.velocidade_rotacao,
              ano_fabricacao: relacao.ano_fabricacao,
              vida_util: relacao.vida_util,
              data_inicio_locacao: relacao.data_inicio_locacao,
              data_fim_locacao: relacao.data_fim_locacao,
              valor_locacao_mensal: relacao.valor_locacao_mensal,
              status: relacao.status,
              observacoes: relacao.observacoes,
              observacoes_montagem: relacao.observacoes_montagem,
              local_instalacao: relacao.local_instalacao,
              data_montagem: relacao.data_montagem,
              data_desmontagem: relacao.data_desmontagem
            }
          }
        })
      }
      
      // Se ainda não encontrou gruas, tentar usar obra.grua_obra diretamente
      if (gruasDisponiveis.length === 0 && obraConvertida.grua_obra && Array.isArray(obraConvertida.grua_obra)) {
        gruasDisponiveis = obraConvertida.grua_obra.map((relacao: any) => {
          const grua = relacao.grua || {}
          return {
            id: grua.id || relacao.grua_id,
            name: `${grua.fabricante || ''} ${grua.modelo || ''}`.trim() || `Grua ${grua.id || relacao.grua_id}`,
            modelo: grua.modelo || 'Modelo não informado',
            fabricante: grua.fabricante || 'Fabricante não informado',
            tipo: grua.tipo || 'Tipo não informado',
            capacidade: grua.capacidade || 'Capacidade não informada',
            ...grua,
            relacao: {
              ...relacao,
              ...relacao // Incluir todos os campos da relação
            }
          }
        })
      }
      
      // Atualizar obra com as gruas encontradas
      if (gruasDisponiveis.length > 0) {
        setObra({
          ...obraConvertida,
          gruasVinculadas: gruasDisponiveis
        })
        
        // Selecionar primeira grua se não houver nenhuma selecionada
        if (!gruaSelecionada) {
        setGruaSelecionada(gruasDisponiveis[0])
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

  const toNumberOrUndefined = (value: any) => {
    if (value === null || value === undefined || value === '') return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const toEditableValue = (value: any) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (
        normalized === 'não informado' ||
        normalized === 'nao informado' ||
        normalized === 'n/a' ||
        normalized === 'não informada' ||
        normalized === 'nao informada'
      ) {
        return ''
      }
    }
    return value
  }

  const firstFilled = (...values: any[]) => {
    for (const value of values) {
      if (value === null || value === undefined) continue
      if (typeof value === 'string' && value.trim() === '') continue
      return value
    }
    return undefined
  }

  const normalizarTipoLigacaoForm = (value: any) => {
    if (!value) return ''
    const texto = String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (texto.includes('tri')) return 'trifasica'
    if (texto.includes('mono')) return 'monofasica'
    return String(value)
  }

  const normalizeText = (value: any): string => {
    if (!value) return ''
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  const isFichaTecnicaDocumento = (doc: any) => {
    const texto = `${normalizeText(doc?.titulo)} ${normalizeText(doc?.descricao)} ${normalizeText(doc?.categoria)}`
    return (
      normalizeText(doc?.categoria) === 'manual_tecnico' ||
      texto.includes('ficha tecnica') ||
      texto.includes('dados tecnicos') ||
      (texto.includes('manual tecnico') && !texto.includes('montagem'))
    )
  }

  const isManualMontagemDocumento = (doc: any) => {
    const texto = `${normalizeText(doc?.titulo)} ${normalizeText(doc?.descricao)} ${normalizeText(doc?.categoria)}`
    return (
      normalizeText(doc?.categoria) === 'manual_montagem' ||
      (texto.includes('manual') && (texto.includes('montagem') || texto.includes('instalacao')))
    )
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

  const removerDocumento = async (documento: any) => {
    try {
      const idDocumento = documento?.id
      if (!idDocumento) {
        throw new Error('Documento inválido')
      }

      const idComoString = String(idDocumento)
      if (idComoString.startsWith('arquivo_')) {
        const arquivoId = parseInt(idComoString.replace('arquivo_', ''))
        if (Number.isNaN(arquivoId)) {
          throw new Error('ID de arquivo inválido')
        }
        await obrasArquivosApi.excluir(arquivoId)
      } else {
        const documentoId = parseInt(idComoString)
        if (Number.isNaN(documentoId)) {
          throw new Error('ID de documento inválido')
        }
        await obrasDocumentosApi.excluir(parseInt(obraId), documentoId)
      }

      toast({
        title: "Sucesso",
        description: "Arquivo removido com sucesso"
      })
      await carregarDados()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível remover o arquivo",
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

  // Função para fazer upload de arquivo
  const handleUploadArquivo = async (categoria: string, titulo: string, fileInput: HTMLInputElement) => {
    const file = fileInput.files?.[0]
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo",
        variant: "destructive"
      })
      return
    }

    try {
      // Validar tipo de arquivo (apenas PDF)
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo PDF",
          variant: "destructive"
        })
        return
      }

      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Enviando arquivo...",
        description: "Aguarde enquanto o arquivo é enviado"
      })

      // Mapear categoria para o formato da API
      let categoriaApi: 'geral' | 'manual' | 'certificado' | 'licenca' | 'contrato' | 'relatorio' | 'foto' | 'outro' = 'outro'
      if (categoria === 'manual_tecnico' || categoria === 'ficha_tecnica') {
        categoriaApi = 'manual'
      } else if (categoria === 'termo_entrega_tecnica') {
        categoriaApi = 'certificado'
      } else if (categoria === 'plano_carga') {
        categoriaApi = 'outro'
      }

      // Fazer upload usando obrasArquivosApi
      const response = await obrasArquivosApi.upload({
        obra_id: parseInt(obraId),
        arquivo: file,
        nome_original: file.name,
        descricao: titulo,
        categoria: categoriaApi,
        is_public: false
      })

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Arquivo enviado com sucesso"
        })

        // Recarregar documentos e arquivos
        await carregarDados()

        // Limpar input
        fileInput.value = ''
      } else {
        throw new Error(response.message || 'Erro ao fazer upload')
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do arquivo",
        variant: "destructive"
      })
    }
  }

  // Função para criar input de arquivo e disparar upload
  const criarInputUpload = (categoria: string, titulo: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.style.display = 'none'
    input.onchange = async () => {
      await handleUploadArquivo(categoria, titulo, input)
      if (document.body.contains(input)) {
        document.body.removeChild(input)
      }
    }
    document.body.appendChild(input)
    input.click()
  }

  const handleExportar = async () => {
    try {
      if (!obra || !gruaSelecionada) {
        toast({
          title: "Erro",
          description: "Não há dados suficientes para exportar",
          variant: "destructive"
        })
        return
      }

      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      const COR_BASE: [number, number, number] = [135, 27, 11] // #871b0b

      // ============================================
      // CAPA PADRÃO NR12 NR18
      // ============================================
      const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
      
      // Função auxiliar para adicionar nova página com logos
      const adicionarNovaPaginaComLogos = async () => {
        doc.addPage()
        return await adicionarLogosNoCabecalhoFrontend(doc, 10)
      }
      
      let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)

      // Box de cabeçalho com fundo - Capa padrão NR12 NR18
      const headerBoxY = yPos - 3
      const headerBoxHeight = 30
      doc.setFillColor(...COR_BASE) // Cor base #871b0b
      doc.roundedRect(14, headerBoxY, 182, headerBoxHeight, 2, 2, 'F')
      
      // Título principal (branco sobre fundo azul)
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('LIVRO DA GRUA', 105, yPos + 6, { align: 'center' })
      
      // Subtítulo NR12 NR18 (branco)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Conforme NR12 e NR18', 105, yPos + 14, { align: 'center' })
      
      // Subtítulo (branco)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Manual de Operação da Obra`, 105, yPos + 20, { align: 'center' })
      
      // Nome da obra (branco)
      doc.setFontSize(10)
      doc.text(obra.name || 'N/A', 105, yPos + 26, { align: 'center' })
      
      // Resetar cor do texto
      doc.setTextColor(0, 0, 0)
      yPos = headerBoxY + headerBoxHeight + 15

      // Informações da capa
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Este documento atende aos requisitos das Normas Regulamentadoras:', 105, yPos, { align: 'center' })
      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text('NR12 - Segurança no Trabalho em Máquinas e Equipamentos', 105, yPos, { align: 'center' })
      yPos += 6
      doc.text('NR18 - Condições e Meio Ambiente de Trabalho na Indústria da Construção', 105, yPos, { align: 'center' })
      yPos += 15

      // Limite máximo considerando rodapé
      // Rodapé está em 285mm (297mm - 12mm), então o conteúdo deve parar em 270mm para dar espaço
      const MAX_Y = 270 // 285mm (rodapé) - 15mm de margem de segurança

      const renderTabelaPares = (
        dados: Array<[string, any]>,
        ladoALado: boolean = true
      ) => {
        const linhas = ladoALado
          ? Array.from({ length: Math.ceil(dados.length / 2) }, (_, idx) => {
              const a = dados[idx * 2]
              const b = dados[idx * 2 + 1]
              return [
                a?.[0] || '',
                String(a?.[1] ?? 'N/A'),
                b?.[0] || '',
                b ? String(b?.[1] ?? 'N/A') : ''
              ]
            })
          : dados.map(([k, v]) => [k, String(v ?? 'N/A')])

        autoTable(doc, {
          startY: yPos,
          margin: { left: 14, right: 14 },
          head: ladoALado
            ? [['Campo', 'Valor', 'Campo', 'Valor']]
            : [['Campo', 'Valor']],
          body: linhas,
          styles: {
            fontSize: 8.5,
            cellPadding: 2.4,
            lineColor: [210, 210, 210],
            lineWidth: 0.1,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: COR_BASE,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          columnStyles: ladoALado
            ? {
                0: { cellWidth: 34, fontStyle: 'bold' },
                1: { cellWidth: 57 },
                2: { cellWidth: 34, fontStyle: 'bold' },
                3: { cellWidth: 57 }
              }
            : {
                0: { cellWidth: 45, fontStyle: 'bold' },
                1: { cellWidth: 137 }
              }
        })

        const lastAutoTable = (doc as any).lastAutoTable
        yPos = (lastAutoTable?.finalY || yPos) + 8
      }
      
      // ============================================
      // ÍNDICE DO LIVRO
      // ============================================
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const indiceY = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, indiceY, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('ÍNDICE DO LIVRO', 18, indiceY + 6)
      yPos = indiceY + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const indiceItens = [
        '1. Dados da Obra',
        '2. Equipamento - Grua',
        '3. Responsáveis e Equipe',
        '3.1. Responsável Técnico da Empresa Locadora',
        '3.2. Sinaleiros',
        '4. Localização e Ambiente',
        '5. Período de Locação',
        '6. Documentos e Certificações',
        '6.1. Dados da Montagem do(s) Equipamento(s)',
        '6.2. Fornecedor/Locador do Equipamento / Proprietário do Equipamento',
        '6.3. Responsável pela Manutenção da Grua',
        '6.4. Responsável(is) pela Montagem e Operação da(s) Grua(s)',
        '6.5. Dados Técnicos do Equipamento',
        '6.6. Manual de Montagem',
        '6.7. Entrega Técnica',
        '6.8. Plano de Cargas',
        '7. Configuração e Especificações Técnicas',
        '8. Observações Gerais'
      ]

      for (const item of indiceItens) {
        if (yPos > MAX_Y) {
          yPos = await adicionarNovaPaginaComLogos()
        }
        doc.text(`${item}`, 18, yPos)
        yPos += 6
      }

      yPos += 10

      // ============================================
      // INÍCIO DO CONTEÚDO
      // ============================================
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      // Box de informações da Grua
      const fabricante = (gruaSelecionada.fabricante || '').replace(/^Fabricante/i, '').trim()
      const modelo = (gruaSelecionada.modelo || '').replace(/^Modelo/i, '').replace(/Samuel/i, '').trim()
      const nomeGrua = fabricante && modelo ? `${fabricante} ${modelo}` : (gruaSelecionada.name || `Grua ${gruaSelecionada.id}`)
      
      // Verificar se há espaço suficiente para o box de informações (20mm) + data (6mm) + linha (10mm) + seção (50mm) = ~86mm
      if (yPos > MAX_Y - 86) {
        yPos = await adicionarNovaPaginaComLogos()
      }
      
      const infoBoxY = yPos
      const infoBoxHeight = 20
      doc.setFillColor(245, 247, 250) // Cinza claro
      doc.roundedRect(14, infoBoxY, 182, infoBoxHeight, 2, 2, 'F')
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 51, 51)
      doc.text('INFORMAÇÕES DA GRUA', 105, infoBoxY + 6, { align: 'center' })
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Grua: ${nomeGrua}`, 20, infoBoxY + 12)
      doc.text(`ID: ${String(gruaSelecionada.id || 'N/A')}`, 110, infoBoxY + 12)
      doc.text(`Tipo: ${String(gruaSelecionada.tipo || 'N/A')}`, 20, infoBoxY + 17)
      doc.text(`Capacidade: ${String(gruaSelecionada.capacidade || 'N/A')}`, 110, infoBoxY + 17)
      
      yPos = infoBoxY + infoBoxHeight + 8

      // Data de geração (pequeno, no canto)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        14,
        yPos
      )
      yPos += 6

      // Linha separadora decorativa
      doc.setDrawColor(...COR_BASE)
      doc.setLineWidth(1)
      doc.line(14, yPos, 196, yPos)
      yPos += 10

      // Verificar novamente se há espaço suficiente para a seção "1. DADOS DA OBRA"
      // A seção precisa de pelo menos 50mm de espaço (cabeçalho + conteúdo mínimo)
      if (yPos > MAX_Y - 50) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      // 1. DADOS DA OBRA
      const secaoY = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secaoY, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('1. DADOS DA OBRA', 18, secaoY + 6)
      yPos = secaoY + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const dadosObra = [
        [`Nome:`, obra.name || 'N/A'],
        [`Endereço:`, obra.location || obra.endereco || 'N/A'],
        [`Cidade:`, obra.cidade || 'N/A'],
        [`Estado:`, obra.estado || 'N/A'],
        [`Tipo:`, obra.tipo || 'N/A'],
        [`Status:`, obra.status || 'N/A'],
        [`Data de Início:`, obra.startDate ? formatarData(obra.startDate) : 'N/A'],
        [`Data de Fim:`, obra.endDate ? formatarData(obra.endDate) : 'N/A'],
        [`Orçamento:`, obra.budget ? formatarMoeda(parseFloat(obra.budget.toString().replace(',', '.'))) : 'N/A']
      ]
      renderTabelaPares(dadosObra, true)

      // 2. EQUIPAMENTO - GRUA
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao2Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao2Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('2. EQUIPAMENTO - GRUA', 18, secao2Y + 6)
      yPos = secao2Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const dadosGrua = [
        [`Identificação:`, gruaSelecionada.name || 'N/A'],
        [`Modelo:`, modelo || 'N/A'],
        [`Fabricante:`, fabricante || 'N/A'],
        [`Tipo:`, gruaSelecionada.tipo || 'N/A'],
        [`Número de Série:`, gruaSelecionada.numero_serie || gruaSelecionada.serial || 'N/A'],
        [`Ano de Fabricação:`, relacaoGrua.ano_fabricacao ? String(relacaoGrua.ano_fabricacao) : 'N/A'],
        [`Capacidade Máxima:`, gruaSelecionada.capacidade || 'N/A'],
        [`Capacidade na Ponta:`, relacaoGrua.capacidade_ponta ? `${relacaoGrua.capacidade_ponta} kg` : (gruaSelecionada.capacidade_ponta || 'N/A')],
        [`Altura Máxima:`, gruaSelecionada.altura_maxima || (relacaoGrua.altura ? `${relacaoGrua.altura} m` : 'N/A')],
        [`Alcance Máximo (Raio):`, gruaSelecionada.alcance_maximo || relacaoGrua.raio_operacao || relacaoGrua.raio || 'N/A'],
        [`Tipo de Base/Fundação:`, relacaoGrua.tipo_base || relacaoGrua.fundacao || obra?.dados_montagem_equipamento?.tipo_base || 'N/A']
      ]
      renderTabelaPares(dadosGrua, true)

      // 3. RESPONSÁVEIS E EQUIPE
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao3Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao3Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('3. RESPONSÁVEIS E EQUIPE', 18, secao3Y + 6)
      yPos = secao3Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setFont('helvetica', 'bold')
      doc.text('3.1. Responsável Técnico da Empresa Locadora', 18, yPos)
      yPos += 6
      doc.setFont('helvetica', 'normal')

      if (obra.responsavelTecnico || obra.responsavel_nome) {
        const responsavel = obra.responsavelTecnico || {}
        const dadosResponsavel = [
          [`Nome:`, responsavel.nome || obra.responsavel_nome || 'N/A'],
          [`CPF/CNPJ:`, responsavel.cpf_cnpj || 'N/A'],
          [`CREA:`, responsavel.crea || 'N/A'],
          [`Email:`, responsavel.email || 'N/A'],
          [`Telefone:`, responsavel.telefone || 'N/A']
        ]
        renderTabelaPares(dadosResponsavel, true)
      } else {
        doc.text('Não informado', 18, yPos)
        yPos += 6
      }

      yPos += 8

      // 3.2. SINALEIROS
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao4Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao4Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('3.2. SINALEIROS', 18, secao4Y + 6)
      yPos = secao4Y + 12

      doc.setTextColor(0, 0, 0)
      const sinaleiros = obra.sinaleiros || []
      if (sinaleiros && sinaleiros.length > 0) {
        const sinaleirosData = sinaleiros.map((s: any, index: number) => [
          `${index + 1}`,
          s.nome || 'N/A',
          s.tipo === 'principal' ? 'Principal' : s.tipo === 'reserva' ? 'Reserva' : 'N/A',
          (s.tipo_vinculo === 'interno' || s.tipo === 'principal') ? 'Interno' : 'Cliente',
          s.rg_cpf || s.cpf || s.rg || 'N/A',
          s.telefone || 'N/A',
          s.email || 'N/A'
        ])

        autoTable(doc, {
          head: [['#', 'Nome', 'Tipo', 'Vínculo', 'Documento', 'Telefone', 'Email']],
          body: sinaleirosData.map((row: any[]) => [row[0], row[1], row[2], row[3], row[4], row[5], row[6]]),
          startY: yPos,
          margin: { left: 14, right: 14 },
          styles: { 
            fontSize: 8,
            cellPadding: 2.2,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            overflow: 'linebreak'
          },
          headStyles: { 
            fillColor: COR_BASE,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 48 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 24, halign: 'center' },
            4: { cellWidth: 32 },
            5: { cellWidth: 24 },
            6: { cellWidth: 26 }
          }
        })

        // Atualizar yPos após a tabela
        const lastAutoTable = (doc as any).lastAutoTable
        if (lastAutoTable && lastAutoTable.finalY) {
          yPos = lastAutoTable.finalY + 10
        } else {
          yPos += 30 // Fallback se lastAutoTable não estiver disponível
        }
      } else {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('Não informado', 18, yPos)
        yPos += 6
      }

      yPos += 4

      // 4. LOCALIZAÇÃO E AMBIENTE
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao4AmbienteY = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao4AmbienteY, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('4. LOCALIZAÇÃO E AMBIENTE', 18, secao4AmbienteY + 6)
      yPos = secao4AmbienteY + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const dadosLocalizacaoAmbiente = [
        [`Endereço Completo:`, obra.endereco || obra.location || 'Não informado'],
        [`Cidade / Estado / CEP:`, `${obra.cidade || 'N/A'} / ${obra.estado || 'N/A'} / ${obra.cep || 'N/A'}`],
        [`Canteiro de Obras:`, obra.canteiro || 'Não informado'],
        [`Fundação da Grua:`, relacaoGrua?.fundacao || relacaoGrua?.fundacao_tipo || relacaoGrua?.tipo_base || obra?.dados_montagem_equipamento?.tipo_base || 'Não informado'],
        [`Dimensões da Fundação:`, relacaoGrua?.fundacao_dimensoes || 'Não informado'],
        [`Especificações da Fundação:`, relacaoGrua?.fundacao_especificacoes || 'Não informado'],
        [`Local de Instalação:`, relacaoGrua?.local_instalacao || relacaoGrua?.local || 'Não informado'],
        [`Coordenadas:`, relacaoGrua?.coordenadas || 'Não informado'],
        [`Condições do Ambiente:`, relacaoGrua?.condicoes_ambiente || relacaoGrua?.ambiente || relacaoGrua?.observacoes_montagem || obra?.observacoes || 'Não informado'],
        [`Modelo, Raio e Altura:`, `${gruaSelecionada.modelo || gruaSelecionada.model || 'Não informado'}${gruaSelecionada.alcance_maximo ? ` - Raio: ${gruaSelecionada.alcance_maximo}` : ''}${gruaSelecionada.altura_maxima ? ` - Altura: ${gruaSelecionada.altura_maxima}` : ''}`]
      ]
      renderTabelaPares(dadosLocalizacaoAmbiente, true)

      // 5. PERÍODO DE LOCAÇÃO
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao5LocacaoY = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao5LocacaoY, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('5. PERÍODO DE LOCAÇÃO', 18, secao5LocacaoY + 6)
      yPos = secao5LocacaoY + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const inicioLocacao = obra.startDate || relacaoGrua?.data_inicio_locacao
      const fimLocacao = obra.endDate || relacaoGrua?.data_fim_locacao
      const dadosPeriodoLocacao = [
        [`Data de Início:`, inicioLocacao ? formatarData(inicioLocacao) : 'Não informado'],
        [`Data de Fim:`, fimLocacao ? formatarData(fimLocacao) : 'Não informado'],
        [`Período Total:`, calcularPeriodoLocacao(inicioLocacao, fimLocacao)]
      ]
      renderTabelaPares(dadosPeriodoLocacao, true)

      // 6. DOCUMENTOS E CERTIFICAÇÕES
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao6Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao6Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('6. DOCUMENTOS E CERTIFICAÇÕES', 18, secao6Y + 6)
      yPos = secao6Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const documentosInfo = [
        [`CNO da Obra:`, obra.cno || obra.cno_obra || 'Não informado'],
        [`ART de Instalação:`, obra.art_numero || obra.artNumero || 'Não informado'],
        [`Apólice de Seguro:`, obra.apolice_numero || obra.apoliceNumero || 'Não informado']
      ]
      renderTabelaPares(documentosInfo, false)

      // 6.1. DADOS DA MONTAGEM DO(s) EQUIPAMENTO(s)
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao61Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao61Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.1. DADOS DA MONTAGEM DO(s) EQUIPAMENTO(s)', 18, secao61Y + 6)
      yPos = secao61Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      // Buscar dados de montagem da relação ou da obra
      const dadosMontagemObra = obra.dados_montagem_equipamento || {}
      const dadosMontagem = [
        [`Data de Montagem:`, relacaoGrua?.data_montagem ? formatarData(relacaoGrua.data_montagem) : relacaoGrua?.data_inicio_locacao ? formatarData(relacaoGrua.data_inicio_locacao) : 'Não informado'],
        [`Data de Desmontagem:`, relacaoGrua?.data_desmontagem ? formatarData(relacaoGrua.data_desmontagem) : relacaoGrua?.data_fim_locacao ? formatarData(relacaoGrua.data_fim_locacao) : 'Não informado'],
        [`Tipo de Base/Fundação:`, relacaoGrua?.tipo_base || dadosMontagemObra.tipo_base || relacaoGrua?.fundacao || 'Não informado'],
        [`Altura Inicial:`, relacaoGrua?.altura_inicial || dadosMontagemObra.altura_inicial ? `${relacaoGrua?.altura_inicial || dadosMontagemObra.altura_inicial}m` : 'Não informado'],
        [`Altura Final:`, relacaoGrua?.altura_final || dadosMontagemObra.altura_final ? `${relacaoGrua?.altura_final || dadosMontagemObra.altura_final}m` : 'Não informado'],
        [`Capacidade com 2 Cabos:`, relacaoGrua?.capacidade_1_cabo || dadosMontagemObra.capacidade_1_cabo ? `${relacaoGrua?.capacidade_1_cabo || dadosMontagemObra.capacidade_1_cabo} kg` : 'Não informado'],
        [`Capacidade com 4 Cabos:`, relacaoGrua?.capacidade_2_cabos || dadosMontagemObra.capacidade_2_cabos ? `${relacaoGrua?.capacidade_2_cabos || dadosMontagemObra.capacidade_2_cabos} kg` : 'Não informado'],
        [`Capacidade na Ponta:`, relacaoGrua?.capacidade_ponta || dadosMontagemObra.capacidade_ponta ? `${relacaoGrua?.capacidade_ponta || dadosMontagemObra.capacidade_ponta} kg` : 'Não informado'],
        [`Potência Instalada:`, relacaoGrua?.potencia_instalada || dadosMontagemObra.potencia_instalada ? `${relacaoGrua?.potencia_instalada || dadosMontagemObra.potencia_instalada} kVA` : 'Não informado'],
        [`Voltagem:`, relacaoGrua?.voltagem || dadosMontagemObra.voltagem || 'Não informado'],
        [`Tipo de Ligação:`, relacaoGrua?.tipo_ligacao || dadosMontagemObra.tipo_ligacao || 'Não informado'],
        [`Velocidade de Rotação:`, relacaoGrua?.velocidade_rotacao || dadosMontagemObra.velocidade_rotacao ? `${relacaoGrua?.velocidade_rotacao || dadosMontagemObra.velocidade_rotacao} rpm` : 'Não informado'],
        [`Velocidade de Elevação:`, relacaoGrua?.velocidade_elevacao || dadosMontagemObra.velocidade_elevacao ? `${relacaoGrua?.velocidade_elevacao || dadosMontagemObra.velocidade_elevacao} m/min` : 'Não informado'],
        [`Velocidade de Translação:`, relacaoGrua?.velocidade_translacao || dadosMontagemObra.velocidade_translacao ? `${relacaoGrua?.velocidade_translacao || dadosMontagemObra.velocidade_translacao} m/min` : 'Não informado'],
        [`Local de Instalação:`, relacaoGrua?.local_instalacao || obra.endereco || obra.location || 'Não informado']
      ]
      renderTabelaPares(dadosMontagem, true)
      
      yPos += 8

      // 6.2. PROPRIETÁRIO DO EQUIPAMENTO
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao62Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao62Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.2. FORNECEDOR/LOCADOR DO EQUIPAMENTO / PROPRIETÁRIO DO EQUIPAMENTO', 18, secao62Y + 6)
      yPos = secao62Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const proprietario = [
        [`Nome/Razão Social:`, 'IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA'],
        [`CNPJ:`, '20.053.969/0001-38'],
        [`Endereço:`, 'Rua Benevenuto Vieira, 48 - Jardim Aeroporto, ITU - SP, CEP: 13306-141'],
        [`Telefone:`, '(11) 98818-5951'],
        [`Email:`, 'info@gruascopa.com.br'],
        [`Fax:`, 'Não informado'],
        [`Responsável Técnico:`, relacaoGrua?.proprietario_nome || relacaoGrua?.empresa_locadora_responsavel_tecnico || 'NESTOR ALVAREZ GONZALEZ'],
        [`Nº do CREA:`, gruaSelecionada.proprietario_crea || relacaoGrua?.crea_responsavel || 'Não informado'],
        [`N° do CREA da Empresa:`, 'SP 2494244']
      ]
      renderTabelaPares(proprietario, true)
      
      yPos += 8

      // 6.3. RESPONSÁVEL PELA MANUTENÇÃO DA GRUA
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao63Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao63Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.3. RESPONSÁVEL PELA MANUTENÇÃO DA GRUA', 18, secao63Y + 6)
      yPos = secao63Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const dadosManutencao = [
        [`Razão Social:`, 'IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA'],
        [`Endereço Completo:`, 'Rua Benevenuto Vieira, 48 - Jardim Aeroporto, ITU - SP, CEP: 13306-141'],
        [`CNPJ:`, '20.053.969/0001-38'],
        [`E-mail:`, 'info@gruascopa.com.br'],
        [`Fone:`, '(11) 98818-5951'],
        [`Fax:`, 'Não informado'],
        [`Responsável Técnico:`, relacaoGrua?.empresa_manutencao_responsavel_tecnico || 'NESTOR ALVAREZ GONZALEZ'],
        [`Fone do Responsável:`, relacaoGrua?.empresa_manutencao_fone_responsavel || '(11) 98818-5951'],
        [`N° do CREA da Empresa:`, 'SP 2494244']
      ]
      renderTabelaPares(dadosManutencao, true)

      yPos += 8

      // 6.4. RESPONSÁVEL(is) PELA MONTAGEM E OPERAÇÃO
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao64Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao64Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.4. RESPONSÁVEL(is) PELA MONTAGEM E OPERAÇÃO DA(s) GRUA(s)', 18, secao64Y + 6)
      yPos = secao64Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const operador = funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador'))
      const montador = funcionariosGrua.find((f: any) => 
        f.funcionario?.cargo?.toLowerCase().includes('montagem') || 
        f.funcionario?.cargo?.toLowerCase().includes('montador')
      )
      const dadosEmpresaMontagem = [
        [`Razão Social:`, 'IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA'],
        [`Endereço Completo:`, 'Rua Benevenuto Vieira, 48 - Jardim Aeroporto, ITU - SP, CEP: 13306-141'],
        [`CNPJ:`, '20.053.969/0001-38'],
        [`E-mail:`, 'info@gruascopa.com.br'],
        [`Fone:`, '(11) 98818-5951'],
        [`Fax:`, 'Não informado'],
        [`Responsável Técnico:`, relacaoGrua?.empresa_montagem_responsavel_tecnico || 'ALEX MARCELO DA SILVA NASCIMENTO'],
        [`Nº do CREA:`, relacaoGrua?.empresa_montagem_crea || '5071184591'],
        [`Operador da Grua:`, operador ? `${operador.funcionario?.nome || 'N/A'} (${operador.funcionario?.cargo || 'N/A'})` : 'Não informado'],
        [`Responsável pela Montagem:`, montador ? `${montador.funcionario?.nome || 'N/A'} (${montador.funcionario?.cargo || 'N/A'})` : 'Não informado']
      ]
      renderTabelaPares(dadosEmpresaMontagem, true)

      yPos += 8

      // 6.5. DADOS TÉCNICOS DO EQUIPAMENTO
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao65Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao65Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.5. DADOS TÉCNICOS DO EQUIPAMENTO', 18, secao65Y + 6)
      yPos = secao65Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const fichaTecnica = documentos.find((doc: any) => isFichaTecnicaDocumento(doc))

      const dadosTecnicosEquipamento = [
        [`Ficha Técnica:`, fichaTecnica ? (fichaTecnica.titulo || 'Ficha Técnica do Equipamento') : 'Não cadastrada'],
        [`Descrição:`, fichaTecnica?.descricao || 'Não informado']
      ]
      renderTabelaPares(dadosTecnicosEquipamento, true)
      yPos += 8

      // 6.6. MANUAL DE MONTAGEM
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao66Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao66Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.6. MANUAL DE MONTAGEM', 18, secao66Y + 6)
      yPos = secao66Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const manualMontagem = documentos.find((doc: any) => isManualMontagemDocumento(doc))
        || documentos.find((doc: any) => isFichaTecnicaDocumento(doc))

      const dadosManualMontagem = [
        [`Manual de Montagem:`, manualMontagem ? (manualMontagem.titulo || 'Manual de Montagem') : 'Não informado'],
        [`Descrição:`, manualMontagem?.descricao || 'Não informado']
      ]
      renderTabelaPares(dadosManualMontagem, true)
      yPos += 8

      // 6.7. ENTREGA TÉCNICA
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao67Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao67Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.7. ENTREGA TÉCNICA', 18, secao67Y + 6)
      yPos = secao67Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const termoEntrega = documentos.find((doc: any) => 
        (doc.titulo?.toLowerCase().includes('entrega') && doc.titulo?.toLowerCase().includes('técnica')) ||
        (doc.titulo?.toLowerCase().includes('termo') && doc.titulo?.toLowerCase().includes('entrega'))
      )

      const termoAssinadoPor = termoEntrega?.assinaturas && termoEntrega.assinaturas.length > 0
        ? termoEntrega.assinaturas
            .filter((a: any) => a.status === 'assinado')
            .map((a: any) => a.user_nome || a.user_email)
            .join(', ')
        : 'Não informado'
      const dadosEntregaTecnica = [
        [`Termo de Entrega Técnica:`, termoEntrega ? (termoEntrega.titulo || 'Termo de Entrega Técnica') : 'Não encontrado'],
        [`Status:`, termoEntrega ? ((termoEntrega.status === 'assinado' || termoEntrega.arquivo_assinado) ? 'Assinado' : 'Pendente') : 'Pendente'],
        [`Assinado por:`, termoAssinadoPor]
      ]
      renderTabelaPares(dadosEntregaTecnica, true)
      yPos += 10

      // 6.8. PLANO DE CARGAS
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao68Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao68Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('6.8. PLANO DE CARGAS', 18, secao68Y + 6)
      yPos = secao68Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const planoCargas = documentos.find((doc: any) => 
        doc.categoria === 'plano_carga' ||
        (doc.titulo?.toLowerCase().includes('plano') && 
        doc.titulo?.toLowerCase().includes('carga'))
      )

      const anexosPlano = documentos.filter((doc: any) => 
        doc.titulo?.toLowerCase().includes('anexo') && 
        (doc.descricao?.toLowerCase().includes('plano') || doc.descricao?.toLowerCase().includes('carga'))
      )
      const dadosPlanoCargas = [
        [`Plano de Cargas:`, planoCargas ? (planoCargas.titulo || 'Plano de Cargas') : 'Não encontrado'],
        [`Descrição:`, planoCargas?.descricao || 'Não informado'],
        [`Anexos:`, anexosPlano.length > 0 ? anexosPlano.map((anexo: any, idx: number) => `${idx + 1}. ${anexo.titulo || `Anexo ${idx + 1}`}`).join(' | ') : 'Não informado'],
        [`Local de Instalação (referência):`, relacaoGrua?.local_instalacao || 'Não informado']
      ]
      renderTabelaPares(dadosPlanoCargas, true)
      yPos += 8

      // 7. CONFIGURAÇÃO E ESPECIFICAÇÕES TÉCNICAS
      if (yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      const secao7Y = yPos
      doc.setFillColor(...COR_BASE)
      doc.roundedRect(14, secao7Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('7. CONFIGURAÇÃO E ESPECIFICAÇÕES TÉCNICAS', 18, secao7Y + 6)
      yPos = secao7Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const configTecnica = [
        [`Raio de Operação:`, relacaoGrua?.raio_operacao || relacaoGrua?.raio || gruaSelecionada.alcance_maximo || 'N/A'],
        [`Altura de Operação:`, gruaSelecionada.altura_maxima || relacaoGrua?.altura || 'N/A'],
        [`Manual de Operação:`, relacaoGrua?.manual_operacao || 'Vinculado à obra'],
        [`Manual de Montagem:`, manualMontagem ? 'Disponível (ver seção 6.6)' : 'Não informado'],
        [`Procedimento de Montagem:`, relacaoGrua?.procedimento_montagem ? 'Disponível' : 'Não informado'],
        [`Procedimento de Operação:`, relacaoGrua?.procedimento_operacao ? 'Disponível' : 'Não informado'],
        [`Procedimento de Desmontagem:`, relacaoGrua?.procedimento_desmontagem ? 'Disponível' : 'Não informado'],
        [`Condições Especiais e Observações:`, relacaoGrua?.observacoes || obra?.observacoes || 'Não informado']
      ]

      renderTabelaPares(configTecnica, true)
      
      yPos += 8

      // 8. OBSERVAÇÕES GERAIS
      if ((obra.observacoes || relacaoGrua?.observacoes) && yPos > MAX_Y - 20) {
        yPos = await adicionarNovaPaginaComLogos()
      }

      if (obra.observacoes || relacaoGrua?.observacoes) {
        const secao8Y = yPos
        doc.setFillColor(...COR_BASE)
        doc.roundedRect(14, secao8Y, 182, 8, 2, 2, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('8. OBSERVAÇÕES GERAIS', 18, secao8Y + 6)
        yPos = secao8Y + 12

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        if (obra.observacoes) {
          if (yPos > MAX_Y) {
            yPos = await adicionarNovaPaginaComLogos()
          }
          
          doc.setFont('helvetica', 'bold')
          doc.text('Observações da Obra:', 18, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          const observacoesObra = doc.splitTextToSize(obra.observacoes, 170)
          for (const line of observacoesObra) {
            if (yPos > MAX_Y) {
              yPos = await adicionarNovaPaginaComLogos()
            }
            doc.text(line, 18, yPos)
            yPos += 5
          }
          yPos += 5
        }

        if (relacaoGrua?.observacoes) {
          if (yPos > MAX_Y) {
            yPos = await adicionarNovaPaginaComLogos()
          }
          
          doc.setFont('helvetica', 'bold')
          doc.text('Observações da Grua:', 18, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          const observacoesGrua = doc.splitTextToSize(relacaoGrua.observacoes, 170)
          for (const line of observacoesGrua) {
            if (yPos > MAX_Y) {
              yPos = await adicionarNovaPaginaComLogos()
            }
            doc.text(line, 18, yPos)
            yPos += 5
          }
        }
      }

      // Adicionar rodapé
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

      // Salvar PDF
      const nomeArquivo = `livro-grua-${gruaSelecionada.id}-${obra.name?.replace(/\s+/g, '-') || 'obra'}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(nomeArquivo)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo PDF baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF. Tente novamente.",
        variant: "destructive"
      })
    }
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
  const relacaoGruaBase = gruaSelecionada?.relacao || 
    obra.gruasVinculadas?.find((g: any) => 
      g.id === gruaSelecionada?.id || 
      g.grua_id === gruaSelecionada?.id || 
      g.grua?.id === gruaSelecionada?.id ||
      (g.grua && g.grua.id === gruaSelecionada?.id)
    )?.relacao ||
    obra.gruasVinculadas?.find((g: any) => 
      g.id === gruaSelecionada?.id || 
      g.grua_id === gruaSelecionada?.id || 
      g.grua?.id === gruaSelecionada?.id ||
      (g.grua && g.grua.id === gruaSelecionada?.id)
    ) ||
    obra.grua_obra?.find((g: any) => 
      g.grua_id === gruaSelecionada?.id || 
      g.grua?.id === gruaSelecionada?.id
    )

  // Valores padrão mínimos apenas para campos essenciais quando não disponíveis
  // Estes valores são usados apenas como fallback se a API não retornar os dados
  const valoresPadrao = {
    valor_locacao: 0,
    valor_locacao_mensal: 0
  }

  // Usar dados reais da API, com valores padrão mínimos apenas quando necessário
  const relacaoGrua = {
    ...relacaoGruaBase,
    // Garantir que valor_locacao tenha prioridade sobre valor_locacao_mensal
    valor_locacao: relacaoGruaBase?.valor_locacao || relacaoGruaBase?.valor_locacao_mensal || valoresPadrao.valor_locacao
  }
  
  // Usar sinaleiros reais da obra (pode vir como sinaleiros_obra ou sinaleiros)
  const sinaleirosDisponiveis = obra?.sinaleiros || obra?.sinaleiros_obra || []
  
  // Buscar funcionários vinculados à grua
  const funcionariosGrua = (obra.funcionariosVinculados || obra.grua_funcionario || []).filter((f: any) => {
    const fGruaId = f.grua_id || f.grua?.id
    const sGruaId = gruaSelecionada?.id
    return fGruaId === sGruaId || fGruaId?.toString() === sGruaId?.toString()
  }) || []

  const iniciarEdicaoLivro = () => {
    const dadosMontagemObra = obra?.dados_montagem_equipamento || {}

    setLivroForm({
      altura_maxima: toEditableValue(firstFilled(gruaSelecionada?.altura_maxima, relacaoGrua?.altura, relacaoGrua?.altura_final, dadosMontagemObra?.altura_final)),
      alcance_maximo: toEditableValue(firstFilled(gruaSelecionada?.alcance_maximo, relacaoGrua?.raio_operacao, relacaoGrua?.raio, relacaoGrua?.capacidade_maxima_raio, dadosMontagemObra?.raio_trabalho)),
      numero_serie: toEditableValue(gruaSelecionada?.numero_serie),
      tipo_base: toEditableValue(firstFilled(relacaoGrua?.tipo_base, dadosMontagemObra?.tipo_base, gruaSelecionada?.tipo_base)),
      altura_inicial: toEditableValue(firstFilled(relacaoGrua?.altura_inicial, dadosMontagemObra?.altura_inicial, gruaSelecionada?.altura_inicial)),
      altura_final: toEditableValue(firstFilled(relacaoGrua?.altura_final, dadosMontagemObra?.altura_final, gruaSelecionada?.altura_final)),
      capacidade_1_cabo: toEditableValue(firstFilled(relacaoGrua?.capacidade_1_cabo, dadosMontagemObra?.capacidade_1_cabo)),
      capacidade_2_cabos: toEditableValue(firstFilled(relacaoGrua?.capacidade_2_cabos, dadosMontagemObra?.capacidade_2_cabos)),
      capacidade_ponta: toEditableValue(firstFilled(relacaoGrua?.capacidade_ponta, dadosMontagemObra?.capacidade_ponta, gruaSelecionada?.capacidade_ponta)),
      capacidade_maxima_raio: toEditableValue(firstFilled(relacaoGrua?.capacidade_maxima_raio, dadosMontagemObra?.capacidade_maxima_raio, gruaSelecionada?.alcance_maximo)),
      velocidade_rotacao: toEditableValue(firstFilled(relacaoGrua?.velocidade_rotacao, relacaoGrua?.velocidade_giro, dadosMontagemObra?.velocidade_rotacao, gruaSelecionada?.velocidade_giro)),
      velocidade_elevacao: toEditableValue(firstFilled(relacaoGrua?.velocidade_elevacao, dadosMontagemObra?.velocidade_elevacao, gruaSelecionada?.velocidade_elevacao)),
      velocidade_translacao: toEditableValue(firstFilled(relacaoGrua?.velocidade_translacao, dadosMontagemObra?.velocidade_translacao, gruaSelecionada?.velocidade_translacao)),
      potencia_instalada: toEditableValue(firstFilled(relacaoGrua?.potencia_instalada, dadosMontagemObra?.potencia_instalada, gruaSelecionada?.potencia_instalada)),
      voltagem: toEditableValue(firstFilled(relacaoGrua?.voltagem, dadosMontagemObra?.voltagem, gruaSelecionada?.voltagem)),
      tipo_ligacao: toEditableValue(normalizarTipoLigacaoForm(firstFilled(relacaoGrua?.tipo_ligacao, dadosMontagemObra?.tipo_ligacao, gruaSelecionada?.tipo_ligacao))),
      ano_fabricacao: toEditableValue(relacaoGrua?.ano_fabricacao),
      vida_util: toEditableValue(firstFilled(relacaoGrua?.vida_util, gruaSelecionada?.vida_util)),
      fundacao: toEditableValue(relacaoGrua?.fundacao || relacaoGrua?.fundacao_tipo),
      canteiro: toEditableValue(obra?.canteiro),
      local_instalacao: toEditableValue(firstFilled(relacaoGrua?.local_instalacao, obra?.endereco, obra?.location)),
      condicoes_ambiente: toEditableValue(relacaoGrua?.condicoes_ambiente),
      raio_operacao: toEditableValue(firstFilled(relacaoGrua?.raio_operacao, relacaoGrua?.raio, dadosMontagemObra?.raio_trabalho, gruaSelecionada?.alcance_maximo)),
      altura_operacao: toEditableValue(firstFilled(relacaoGrua?.altura, dadosMontagemObra?.altura_final, gruaSelecionada?.altura_maxima)),
      manual_operacao: toEditableValue(firstFilled(relacaoGrua?.manual_operacao, 'Vinculado à obra')),
      procedimento_montagem: Boolean(relacaoGrua?.procedimento_montagem),
      procedimento_operacao: Boolean(relacaoGrua?.procedimento_operacao),
      procedimento_desmontagem: Boolean(relacaoGrua?.procedimento_desmontagem),
      data_desmontagem: relacaoGrua?.data_desmontagem ? String(relacaoGrua.data_desmontagem).split('T')[0] : '',
      observacoes_montagem: toEditableValue(relacaoGrua?.observacoes_montagem || relacaoGrua?.observacoes),
      observacoes_config: toEditableValue(relacaoGrua?.observacoes || obra?.observacoes),
      proprietario_responsavel_tecnico: toEditableValue(gruaSelecionada?.proprietario_responsavel_tecnico || relacaoGrua?.responsavel_tecnico),
      crea_responsavel: toEditableValue(gruaSelecionada?.proprietario_crea || relacaoGrua?.crea_responsavel)
    })
    setIsEditingLivro(true)
  }

  const salvarEdicaoLivro = async () => {
    const relacaoId = relacaoGrua?.id || gruaSelecionada?.relacao?.id
    if (!relacaoId) {
      toast({
        title: "Erro",
        description: "Relação da grua com a obra não encontrada para salvar.",
        variant: "destructive"
      })
      return
    }

    try {
      setSavingLivro(true)

      await gruaObraApi.atualizarRelacionamento(Number(relacaoId), {
        tipo_base: livroForm.tipo_base || undefined,
        altura_inicial: toNumberOrUndefined(livroForm.altura_inicial),
        altura_final: toNumberOrUndefined(livroForm.altura_final),
        capacidade_1_cabo: toNumberOrUndefined(livroForm.capacidade_1_cabo),
        capacidade_2_cabos: toNumberOrUndefined(livroForm.capacidade_2_cabos),
        capacidade_ponta: toNumberOrUndefined(livroForm.capacidade_ponta),
        capacidade_maxima_raio: toNumberOrUndefined(livroForm.capacidade_maxima_raio),
        velocidade_rotacao: toNumberOrUndefined(livroForm.velocidade_rotacao),
        velocidade_elevacao: toNumberOrUndefined(livroForm.velocidade_elevacao),
        velocidade_translacao: toNumberOrUndefined(livroForm.velocidade_translacao),
        potencia_instalada: toNumberOrUndefined(livroForm.potencia_instalada),
        voltagem: livroForm.voltagem || undefined,
        tipo_ligacao: livroForm.tipo_ligacao || undefined,
        ano_fabricacao: toNumberOrUndefined(livroForm.ano_fabricacao),
        vida_util: toNumberOrUndefined(livroForm.vida_util),
        fundacao: livroForm.fundacao || undefined,
        local_instalacao: livroForm.local_instalacao || undefined,
        condicoes_ambiente: livroForm.condicoes_ambiente || undefined,
        raio_operacao: toNumberOrUndefined(livroForm.raio_operacao),
        raio: toNumberOrUndefined(livroForm.raio_operacao),
        altura: toNumberOrUndefined(livroForm.altura_operacao),
        manual_operacao: livroForm.manual_operacao || undefined,
        procedimento_montagem: Boolean(livroForm.procedimento_montagem),
        procedimento_operacao: Boolean(livroForm.procedimento_operacao),
        procedimento_desmontagem: Boolean(livroForm.procedimento_desmontagem),
        data_desmontagem: livroForm.data_desmontagem || undefined,
        observacoes_montagem: livroForm.observacoes_montagem || undefined,
        observacoes: livroForm.observacoes_config || livroForm.observacoes_montagem || undefined,
        responsavel_tecnico: livroForm.proprietario_responsavel_tecnico || undefined,
        crea_responsavel: livroForm.crea_responsavel || undefined
      } as any)

      if (gruaSelecionada?.id) {
        await gruasApi.atualizarGrua(gruaSelecionada.id, {
          altura_maxima: livroForm.altura_maxima || undefined,
          alcance_maximo: livroForm.alcance_maximo || undefined,
          numero_serie: livroForm.numero_serie || undefined
        } as any)
      }

      // Atualiza campos da obra que também aparecem no Livro da Grua
      if ((obra?.canteiro || '') !== (livroForm.canteiro || '')) {
        await obrasApi.atualizarObra(parseInt(obraId), {
          canteiro: livroForm.canteiro || undefined
        } as any)
      }

      await carregarDados()
      setIsEditingLivro(false)

      toast({
        title: "Sucesso",
        description: "Dados do Livro da Grua atualizados."
      })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar os dados do Livro da Grua.",
        variant: "destructive"
      })
    } finally {
      setSavingLivro(false)
    }
  }

  const preencherDadosDebugLivro = () => {
    setLivroForm((prev: any) => ({
      ...prev,
      altura_maxima: prev.altura_maxima || '75',
      alcance_maximo: prev.alcance_maximo || '65',
      numero_serie: prev.numero_serie || 'DBG-GRUA-2026-001',
      tipo_base: prev.tipo_base || 'Chumbador',
      altura_inicial: prev.altura_inicial || '35',
      altura_final: prev.altura_final || '60',
      capacidade_1_cabo: prev.capacidade_1_cabo || '2500',
      capacidade_2_cabos: prev.capacidade_2_cabos || '4000',
      capacidade_ponta: prev.capacidade_ponta || '2000',
      capacidade_maxima_raio: prev.capacidade_maxima_raio || '5000',
      velocidade_rotacao: prev.velocidade_rotacao || '0.8',
      velocidade_elevacao: prev.velocidade_elevacao || '60',
      velocidade_translacao: prev.velocidade_translacao || '35',
      potencia_instalada: prev.potencia_instalada || '25',
      voltagem: prev.voltagem || '380',
      tipo_ligacao: prev.tipo_ligacao || 'trifasica',
      ano_fabricacao: prev.ano_fabricacao || '2020',
      vida_util: prev.vida_util || '20',
      fundacao: prev.fundacao || 'Base em concreto armado',
      canteiro: prev.canteiro || 'Canteiro principal - frente da obra',
      local_instalacao: prev.local_instalacao || 'Lado norte do canteiro',
      condicoes_ambiente: prev.condicoes_ambiente || 'Área isolada e sinalizada',
      raio_operacao: prev.raio_operacao || '60',
      altura_operacao: prev.altura_operacao || '70',
      manual_operacao: prev.manual_operacao || 'Manual operacional interno v1',
      procedimento_montagem: true,
      procedimento_operacao: true,
      procedimento_desmontagem: true,
      data_desmontagem: prev.data_desmontagem || '2026-12-31',
      proprietario_responsavel_tecnico: prev.proprietario_responsavel_tecnico || 'Eng. Teste Debug',
      crea_responsavel: prev.crea_responsavel || 'SP-000000',
      observacoes_montagem: prev.observacoes_montagem || 'Dados preenchidos automaticamente para validação.',
      observacoes_config: prev.observacoes_config || 'Configuração técnica validada em modo debug.'
    }))
  }

  return (
    <div className="space-y-4 print:space-y-4">
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
        
        // Se não houver gruas disponíveis
        if (gruasDisponiveis.length === 0) {
          return (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">Nenhuma grua vinculada a esta obra</p>
              </CardContent>
            </Card>
          )
        }
        
        // Se houver gruas mas nenhuma selecionada, selecionar a primeira automaticamente
        if (!gruaSelecionada && gruasDisponiveis.length > 0) {
          const primeiraGrua = gruasDisponiveis[0]
          if (primeiraGrua.grua) {
            setGruaSelecionada({
              ...primeiraGrua.grua,
              relacao: primeiraGrua,
              name: primeiraGrua.grua.modelo || primeiraGrua.grua.name || `Grua ${primeiraGrua.grua.id}`
            })
          } else {
            setGruaSelecionada({
              ...primeiraGrua,
              relacao: primeiraGrua
            })
          }
          return null // Retornar null enquanto está selecionando
        }
        
        return null
      })()}

      {(() => {
        const gruasDisponiveis = obra.gruasVinculadas || obra.grua_obra || []
        
        // Se não houver grua selecionada mas houver gruas disponíveis, mostrar mensagem
        if (!gruaSelecionada && gruasDisponiveis.length > 0) {
          return (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">Carregando informações da grua...</p>
              </CardContent>
            </Card>
          )
        }
        
        // Se não houver grua selecionada e não houver gruas, já foi tratado acima
        if (!gruaSelecionada) {
          return null
        }
        
        return null
      })()}

      {gruaSelecionada ? (
        <>
          <Card className="print:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Edição Rápida do Livro da Grua</span>
                {isEditingLivro ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={preencherDadosDebugLivro} disabled={savingLivro}>
                      Preencher tudo (debug)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingLivro(false)} disabled={savingLivro}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={salvarEdicaoLivro} disabled={savingLivro}>
                      {savingLivro ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={iniciarEdicaoLivro}>
                    <Settings className="w-4 h-4 mr-2" />
                    Editar campos pendentes
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            {isEditingLivro && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><Label>Altura Máxima</Label><Input value={livroForm.altura_maxima || ''} onChange={(e) => setLivroForm({ ...livroForm, altura_maxima: e.target.value })} /></div>
                  <div><Label>Alcance Máximo (Raio)</Label><Input value={livroForm.alcance_maximo || ''} onChange={(e) => setLivroForm({ ...livroForm, alcance_maximo: e.target.value })} /></div>
                  <div><Label>Número de Série</Label><Input value={livroForm.numero_serie || ''} onChange={(e) => setLivroForm({ ...livroForm, numero_serie: e.target.value })} /></div>
                  <div><Label>Tipo de Base</Label><Input value={livroForm.tipo_base || ''} onChange={(e) => setLivroForm({ ...livroForm, tipo_base: e.target.value })} /></div>
                  <div><Label>Altura Inicial (m)</Label><Input type="number" value={livroForm.altura_inicial ?? ''} onChange={(e) => setLivroForm({ ...livroForm, altura_inicial: e.target.value })} /></div>
                  <div><Label>Altura Final (m)</Label><Input type="number" value={livroForm.altura_final ?? ''} onChange={(e) => setLivroForm({ ...livroForm, altura_final: e.target.value })} /></div>
                  <div><Label>Capacidade com 2 Cabos (kg)</Label><Input type="number" value={livroForm.capacidade_1_cabo ?? ''} onChange={(e) => setLivroForm({ ...livroForm, capacidade_1_cabo: e.target.value })} /></div>
                  <div><Label>Capacidade com 4 Cabos (kg)</Label><Input type="number" value={livroForm.capacidade_2_cabos ?? ''} onChange={(e) => setLivroForm({ ...livroForm, capacidade_2_cabos: e.target.value })} /></div>
                  <div><Label>Capacidade Máx. por Raio (kg)</Label><Input type="number" value={livroForm.capacidade_maxima_raio ?? ''} onChange={(e) => setLivroForm({ ...livroForm, capacidade_maxima_raio: e.target.value })} /></div>
                  <div><Label>Voltagem</Label><Input value={livroForm.voltagem || ''} onChange={(e) => setLivroForm({ ...livroForm, voltagem: e.target.value })} /></div>
                  <div>
                    <Label>Tipo de Ligação</Label>
                    <Select value={livroForm.tipo_ligacao || undefined} onValueChange={(value) => setLivroForm({ ...livroForm, tipo_ligacao: value })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monofasica">Monofásica</SelectItem>
                        <SelectItem value="trifasica">Trifásica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Ano de Fabricação</Label><Input type="number" value={livroForm.ano_fabricacao ?? ''} onChange={(e) => setLivroForm({ ...livroForm, ano_fabricacao: e.target.value })} /></div>
                  <div><Label>Vida Útil (anos)</Label><Input type="number" value={livroForm.vida_util ?? ''} onChange={(e) => setLivroForm({ ...livroForm, vida_util: e.target.value })} /></div>
                  <div><Label>Fundação da Grua</Label><Input value={livroForm.fundacao || ''} onChange={(e) => setLivroForm({ ...livroForm, fundacao: e.target.value })} /></div>
                  <div><Label>Canteiro de Obras</Label><Input value={livroForm.canteiro || ''} onChange={(e) => setLivroForm({ ...livroForm, canteiro: e.target.value })} /></div>
                  <div><Label>Local de Instalação</Label><Input value={livroForm.local_instalacao || ''} onChange={(e) => setLivroForm({ ...livroForm, local_instalacao: e.target.value })} /></div>
                  <div><Label>Condições do Ambiente</Label><Input value={livroForm.condicoes_ambiente || ''} onChange={(e) => setLivroForm({ ...livroForm, condicoes_ambiente: e.target.value })} /></div>
                  <div><Label>Raio de Operação</Label><Input type="number" value={livroForm.raio_operacao ?? ''} onChange={(e) => setLivroForm({ ...livroForm, raio_operacao: e.target.value })} /></div>
                  <div><Label>Altura de Operação</Label><Input type="number" value={livroForm.altura_operacao ?? ''} onChange={(e) => setLivroForm({ ...livroForm, altura_operacao: e.target.value })} /></div>
                  <div><Label>Manual de Operação</Label><Input value={livroForm.manual_operacao || ''} onChange={(e) => setLivroForm({ ...livroForm, manual_operacao: e.target.value })} /></div>
                  <div>
                    <Label>Procedimento de Montagem</Label>
                    <Select value={livroForm.procedimento_montagem ? 'sim' : 'nao'} onValueChange={(value) => setLivroForm({ ...livroForm, procedimento_montagem: value === 'sim' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Procedimento de Operação</Label>
                    <Select value={livroForm.procedimento_operacao ? 'sim' : 'nao'} onValueChange={(value) => setLivroForm({ ...livroForm, procedimento_operacao: value === 'sim' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Procedimento de Desmontagem</Label>
                    <Select value={livroForm.procedimento_desmontagem ? 'sim' : 'nao'} onValueChange={(value) => setLivroForm({ ...livroForm, procedimento_desmontagem: value === 'sim' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Data de Desmontagem</Label><Input type="date" value={livroForm.data_desmontagem || ''} onChange={(e) => setLivroForm({ ...livroForm, data_desmontagem: e.target.value })} /></div>
                  <div><Label>Responsável Técnico (Fornecedor)</Label><Input value={livroForm.proprietario_responsavel_tecnico || ''} onChange={(e) => setLivroForm({ ...livroForm, proprietario_responsavel_tecnico: e.target.value })} /></div>
                  <div><Label>Nº CREA (Fornecedor)</Label><Input value={livroForm.crea_responsavel || ''} onChange={(e) => setLivroForm({ ...livroForm, crea_responsavel: e.target.value })} /></div>
                  <div className="lg:col-span-3">
                    <Label>Outras características / observações de montagem</Label>
                    <Textarea value={livroForm.observacoes_montagem || ''} onChange={(e) => setLivroForm({ ...livroForm, observacoes_montagem: e.target.value })} />
                  </div>
                  <div className="lg:col-span-3">
                    <Label>Condições Especiais e Observações (Seção 7)</Label>
                    <Textarea value={livroForm.observacoes_config || ''} onChange={(e) => setLivroForm({ ...livroForm, observacoes_config: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 1. DADOS DA OBRA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                1. Dados da Obra
              </CardTitle>
              <CardAction className="print:hidden">
                <Button 
                  variant="outline" 
                  onClick={handleExportar} 
                  className="h-9 px-4 py-2"
                  disabled={!obra || !gruaSelecionada}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </CardAction>
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
              
              {/* Responsável Técnico da Empresa que está Locando a Grua */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-3 font-semibold">Responsável Técnico da Empresa Locadora</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Responsável Técnico</p>
                    <p className="font-medium">
                      {obra.responsavel_tecnico?.nome || obra.responsavelTecnico?.nome || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">E-mail</p>
                    <p className="font-medium">
                      {obra.responsavel_tecnico?.email || obra.responsavelTecnico?.email || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Celular</p>
                    <p className="font-medium">
                      {obra.responsavel_tecnico?.telefone || obra.responsavelTecnico?.telefone || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">CREA</p>
                    <p className="font-medium">
                      {obra.responsavel_tecnico?.crea || obra.responsavelTecnico?.crea || 'Não informado'}
                    </p>
                  </div>
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
                  <p className="font-medium">{gruaSelecionada.alcance_maximo || relacaoGrua?.capacidade_maxima_raio || relacaoGrua?.raio_operacao || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Número de Série</p>
                  <p className="font-medium">{gruaSelecionada.numero_serie || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Base</p>
                  <p className="font-medium">{relacaoGrua?.tipo_base || obra.dados_montagem_equipamento?.tipo_base || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Altura Inicial (m)</p>
                  <p className="font-medium">{(relacaoGrua?.altura_inicial || obra.dados_montagem_equipamento?.altura_inicial) ? `${relacaoGrua?.altura_inicial || obra.dados_montagem_equipamento?.altura_inicial}m` : 'Não informado'}</p>
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
                  <p className="font-medium">{(relacaoGrua?.velocidade_translacao || obra.dados_montagem_equipamento?.velocidade_translacao) ? `${relacaoGrua?.velocidade_translacao || obra.dados_montagem_equipamento?.velocidade_translacao} m/min` : 'Não informado'}</p>
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
                  <p className="font-medium">{normalizarTipoLigacaoForm(relacaoGrua?.tipo_ligacao || obra.dados_montagem_equipamento?.tipo_ligacao) === 'monofasica' ? 'Monofásica' : normalizarTipoLigacaoForm(relacaoGrua?.tipo_ligacao || obra.dados_montagem_equipamento?.tipo_ligacao) === 'trifasica' ? 'Trifásica' : 'Não informado'}</p>
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
                  <p className="font-medium">{(relacaoGrua?.vida_util || gruaSelecionada?.vida_util) ? `${relacaoGrua?.vida_util || gruaSelecionada?.vida_util} anos` : 'Não informado'}</p>
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
                    {sinaleirosDisponiveis.length > 0 ? (
                      sinaleirosDisponiveis.map((s: any, idx: number) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Nome</p>
                              <p className="font-medium">{s.nome || 'Não informado'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tipo de Vínculo</p>
                              <Badge variant={s.tipo_vinculo === 'interno' || s.tipo === 'principal' ? 'default' : 'outline'}>
                                {s.tipo_vinculo === 'interno' || s.tipo === 'principal' ? 'Interno' : s.tipo_vinculo === 'cliente' || s.tipo === 'reserva' ? 'Indicado pelo Cliente' : s.tipo === 'principal' ? 'Principal' : s.tipo === 'reserva' ? 'Reserva' : 'Não informado'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">CPF</p>
                              <p className="font-medium">
                                {(() => {
                                  const documento = (s.rg_cpf || '').toString()
                                  const digitos = documento.replace(/\D/g, '')
                                  return s.cpf || (digitos.length === 11 ? documento : 'Não informado')
                                })()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">RG</p>
                              <p className="font-medium">
                                {(() => {
                                  const documento = (s.rg_cpf || '').toString()
                                  const digitos = documento.replace(/\D/g, '')
                                  return s.rg || (digitos.length >= 7 && digitos.length <= 10 ? documento : 'Não informado')
                                })()}
                              </p>
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
                  <p className="font-medium">
                    {relacaoGrua?.fundacao || relacaoGrua?.fundacao_tipo || relacaoGrua?.tipo_base || obra?.dados_montagem_equipamento?.tipo_base || 'Não informado'}
                  </p>
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
                  <p className="font-medium">
                    {relacaoGrua?.condicoes_ambiente || relacaoGrua?.ambiente || relacaoGrua?.observacoes_montagem || obra?.observacoes || 'Não informado'}
                  </p>
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
                  <p className="font-medium">{obra.startDate ? formatarData(obra.startDate) : (relacaoGrua?.data_inicio_locacao ? formatarData(relacaoGrua.data_inicio_locacao) : 'Não informado')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data de Fim</p>
                  <p className="font-medium">{obra.endDate ? formatarData(obra.endDate) : (relacaoGrua?.data_fim_locacao ? formatarData(relacaoGrua.data_fim_locacao) : 'Não informado')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Período Total</p>
                  <p className="font-medium">
                    {calcularPeriodoLocacao(obra.startDate || relacaoGrua?.data_inicio_locacao, obra.endDate || relacaoGrua?.data_fim_locacao)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. DOCUMENTOS */}
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

          {/* 6.1. DADOS DA MONTAGEM DO(s) EQUIPAMENTO(s) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                6.1. Dados da Montagem do(s) Equipamento(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="font-medium">{gruaSelecionada.tipo || relacaoGrua?.tipo || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Altura Inicial (m)</p>
                  <p className="font-medium">{(relacaoGrua?.altura_inicial || obra.dados_montagem_equipamento?.altura_inicial) ? `${relacaoGrua?.altura_inicial || obra.dados_montagem_equipamento?.altura_inicial} METROS` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Altura Final (m)</p>
                  <p className="font-medium">{(relacaoGrua?.altura_final || obra.dados_montagem_equipamento?.altura_final) ? `${relacaoGrua?.altura_final || obra.dados_montagem_equipamento?.altura_final} METROS` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Base</p>
                  <p className="font-medium">{relacaoGrua?.tipo_base || obra.dados_montagem_equipamento?.tipo_base || relacaoGrua?.fundacao || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacidade com 2 Cabos (kg)</p>
                  <p className="font-medium">{(relacaoGrua?.capacidade_1_cabo || obra.dados_montagem_equipamento?.capacidade_1_cabo) ? `${relacaoGrua?.capacidade_1_cabo || obra.dados_montagem_equipamento?.capacidade_1_cabo} KG` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacidade com 4 Cabos (kg)</p>
                  <p className="font-medium">{(relacaoGrua?.capacidade_2_cabos || obra.dados_montagem_equipamento?.capacidade_2_cabos) ? `${relacaoGrua?.capacidade_2_cabos || obra.dados_montagem_equipamento?.capacidade_2_cabos} KG` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacidade de Ponta (kg)</p>
                  <p className="font-medium">{(relacaoGrua?.capacidade_ponta || obra.dados_montagem_equipamento?.capacidade_ponta) ? `${relacaoGrua?.capacidade_ponta || obra.dados_montagem_equipamento?.capacidade_ponta} KG` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Potência Instalada (kVA)</p>
                  <p className="font-medium">{(relacaoGrua?.potencia_instalada || obra.dados_montagem_equipamento?.potencia_instalada) ? `${relacaoGrua?.potencia_instalada || obra.dados_montagem_equipamento?.potencia_instalada} kVA` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Voltagem</p>
                  <p className="font-medium">{relacaoGrua?.voltagem || obra.dados_montagem_equipamento?.voltagem || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Ligação</p>
                  <p className="font-medium">{relacaoGrua?.tipo_ligacao || obra.dados_montagem_equipamento?.tipo_ligacao || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Velocidade de Rotação (rpm)</p>
                  <p className="font-medium">{(relacaoGrua?.velocidade_rotacao || obra.dados_montagem_equipamento?.velocidade_rotacao) ? `${relacaoGrua?.velocidade_rotacao || obra.dados_montagem_equipamento?.velocidade_rotacao} rpm` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Velocidade de Elevação (m/min)</p>
                  <p className="font-medium">{(relacaoGrua?.velocidade_elevacao || obra.dados_montagem_equipamento?.velocidade_elevacao) ? `${relacaoGrua?.velocidade_elevacao || obra.dados_montagem_equipamento?.velocidade_elevacao} m/min` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Velocidade de Translação (m/min)</p>
                  <p className="font-medium">{(relacaoGrua?.velocidade_translacao || obra.dados_montagem_equipamento?.velocidade_translacao) ? `${relacaoGrua?.velocidade_translacao || obra.dados_montagem_equipamento?.velocidade_translacao} m/min` : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Marca, Modelo e Ano de Fabricação</p>
                  <p className="font-medium">
                    {gruaSelecionada.fabricante && gruaSelecionada.modelo && relacaoGrua?.ano_fabricacao
                      ? `${gruaSelecionada.fabricante}, ${gruaSelecionada.modelo}, ${relacaoGrua.ano_fabricacao}`
                      : gruaSelecionada.fabricante && gruaSelecionada.modelo
                        ? `${gruaSelecionada.fabricante}, ${gruaSelecionada.modelo}`
                        : 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data de Montagem</p>
                  <p className="font-medium">{relacaoGrua?.data_montagem ? formatarData(relacaoGrua.data_montagem) : relacaoGrua?.data_inicio_locacao ? formatarData(relacaoGrua.data_inicio_locacao) : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data de Desmontagem</p>
                  <p className="font-medium">{relacaoGrua?.data_desmontagem ? formatarData(relacaoGrua.data_desmontagem) : relacaoGrua?.data_fim_locacao ? formatarData(relacaoGrua.data_fim_locacao) : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Local de Instalação</p>
                  <p className="font-medium">{relacaoGrua?.local_instalacao || obra.endereco || obra.location || 'Não informado'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">Outras Características Singulares do Equipamento</p>
                  <p className="font-medium">{relacaoGrua?.caracteristicas_singulares || relacaoGrua?.observacoes_montagem || relacaoGrua?.observacoes || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.2. FORNECEDOR/LOCADOR DO EQUIPAMENTO / PROPRIETÁRIO DO EQUIPAMENTO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                6.2. Fornecedor/Locador do Equipamento / Proprietário do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Razão Social</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Nome Fantasia</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">IRBANA COPAS</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Endereço Completo</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">Rua Benevenuto Vieira, 48 - Jardim Aeroporto, ITU - SP, CEP: 13306-141</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">CNPJ</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">20.053.969/0001-38</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">E-mail</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">info@gruascopa.com.br</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Fone</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">(11) 98818-5951</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Fax</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">Não informado</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">Responsável Técnico</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">{gruaSelecionada.proprietario_responsavel_tecnico || relacaoGrua?.responsavel_tecnico || 'Não informado'}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-4 mt-8 print:hidden"
                      onClick={() => {
                        if (onRequestEdit) {
                          onRequestEdit()
                          return
                        }
                        toast({
                          title: "Edição indisponível",
                          description: "Use o botão 'Editar Obra' no topo da página.",
                          variant: "default"
                        })
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Nº do CREA</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{gruaSelecionada.proprietario_crea || relacaoGrua?.crea_responsavel || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">N° do CREA da Empresa</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">SP 2494244</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.3. RESPONSÁVEL PELA MANUTENÇÃO DA GRUA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                6.3. Responsável pela Manutenção da Grua
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                (permanece fixo os textos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Razão Social</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Endereço Completo</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">Rua Benevenuto Vieira, 48 - Jardim Aeroporto, ITU - SP, CEP: 13306-141</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">CNPJ</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">20.053.969/0001-38</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">E-mail</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">info@gruascopa.com.br</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Fone</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">(11) 98818-5951</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Fax</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">Não informado</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Responsável Técnico</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{relacaoGrua?.empresa_manutencao_responsavel_tecnico || 'NESTOR ALVAREZ GONZALEZ'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Fone do Responsável</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{relacaoGrua?.empresa_manutencao_fone_responsavel || '(11) 98818-5951'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">N° do CREA da Empresa</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">SP 2494244</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.4. RESPONSÁVEL(is) PELA MONTAGEM E OPERAÇÃO DA(s) GRUA(s) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                6.4. Responsável(is) pela Montagem e Operação da(s) Grua(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Dados da Empresa */}
                <div>
                  <p className="text-xs text-gray-500 mb-3 font-semibold">Dados da Empresa</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Razão Social</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">IRBANA COPAS SERVIÇOS DE MANUTENÇÃO E MONTAGEM LTDA</p>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-2">Endereço Completo</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">Rua Benevenuto Vieira, 48 - Jardim Aeroporto, ITU - SP, CEP: 13306-141</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">CNPJ</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">20.053.969/0001-38</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">E-mail</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">info@gruascopa.com.br</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Fone</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">(11) 98818-5951</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Fax</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">Não informado</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Responsável Técnico</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">{relacaoGrua?.empresa_montagem_responsavel_tecnico || 'ALEX MARCELO DA SILVA NASCIMENTO'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Nº do CREA</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">{relacaoGrua?.empresa_montagem_crea || '5071184591'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operador */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Operador da Grua</p>
                  {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador')) ? (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nome</p>
                          <p className="font-medium">
                            {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador'))?.funcionario?.nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cargo</p>
                          <p className="font-medium">
                            {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador'))?.funcionario?.cargo}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-500">Não informado</p>
                    </div>
                  )}
                </div>

                {/* Responsável pela Montagem */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Responsável pela Montagem</p>
                  {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('montagem') || f.funcionario?.cargo?.toLowerCase().includes('montador')) ? (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nome</p>
                          <p className="font-medium">
                            {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('montagem') || f.funcionario?.cargo?.toLowerCase().includes('montador'))?.funcionario?.nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cargo</p>
                          <p className="font-medium">
                            {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('montagem') || f.funcionario?.cargo?.toLowerCase().includes('montador'))?.funcionario?.cargo}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-500">Não informado</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.5. DADOS TÉCNICOS DO EQUIPAMENTO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                6.5. Dados Técnicos do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Ficha Técnica do Equipamento (PDF)</p>
                  {(() => {
                    const fichaTecnica = documentos.find((doc: any) => isFichaTecnicaDocumento(doc))
                    
                    if (fichaTecnica) {
                      return (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium">{fichaTecnica.titulo || 'Ficha Técnica do Equipamento'}</p>
                              {fichaTecnica.descricao && <p className="text-sm text-gray-600 mt-1">{fichaTecnica.descricao}</p>}
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                              {(fichaTecnica.arquivo_assinado || fichaTecnica.caminho_arquivo || fichaTecnica.arquivo_original) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadDocumento(fichaTecnica)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Baixar PDF
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => criarInputUpload('manual_tecnico', 'Ficha Técnica do Equipamento')}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Substituir PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removerDocumento(fichaTecnica)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="p-3 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm mb-2">Nenhuma ficha técnica cadastrada.</p>
                        <p className="text-xs text-gray-400">Um arquivo em PDF estará disponível para consulta após o upload.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 print:hidden"
                          onClick={() => criarInputUpload('manual_tecnico', 'Ficha Técnica do Equipamento')}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Fazer Upload de PDF
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.6. MANUAL DE MONTAGEM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                6.6. Manual de Montagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Manual de Montagem Disponível</p>
                  {(() => {
                    const manualMontagemDoc = documentos.find((doc: any) => isManualMontagemDocumento(doc))
                    const fichaTecnicaDoc = documentos.find((doc: any) => isFichaTecnicaDocumento(doc))
                    const manualMontagem = manualMontagemDoc || relacaoGrua?.manual_montagem || fichaTecnicaDoc
                    
                    if (manualMontagem) {
                      return (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{manualMontagem.titulo || 'Manual de Montagem'}</p>
                              {manualMontagem.descricao && <p className="text-sm text-gray-600 mt-1">{manualMontagem.descricao}</p>}
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                              {manualMontagem.arquivo_assinado || manualMontagem.caminho_arquivo || manualMontagem.arquivo_original ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadDocumento(manualMontagem)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Baixar
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => criarInputUpload('manual_tecnico', 'Manual de Montagem')}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Substituir PDF
                              </Button>
                              {manualMontagemDoc ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removerDocumento(manualMontagemDoc)}
                                >
                                  Remover
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="p-3 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm mb-2">Nenhum manual de montagem cadastrado.</p>
                        <p className="text-xs text-gray-400">Um arquivo em PDF estará disponível para consulta após o upload.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 print:hidden"
                          onClick={() => criarInputUpload('manual_tecnico', 'Manual de Montagem')}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Fazer Upload de PDF
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.7. ENTREGA TÉCNICA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                6.7. Entrega Técnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Termo de Entrega Técnica</p>
                  {(() => {
                    const termoEntrega = documentos.find((doc: any) => 
                      doc.categoria === 'termo_entrega_tecnica' ||
                      (doc.titulo?.toLowerCase().includes('entrega') && 
                      doc.titulo?.toLowerCase().includes('técnica'))
                    ) || documentos.find((doc: any) => 
                      doc.titulo?.toLowerCase().includes('termo') && 
                      doc.titulo?.toLowerCase().includes('entrega')
                    )
                    
                    if (termoEntrega) {
                      const isAssinado = termoEntrega.status === 'assinado' || termoEntrega.arquivo_assinado
                      
                      return (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">{termoEntrega.titulo || 'Termo de Entrega Técnica'}</p>
                                {isAssinado && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <ClipboardCheck className="w-3 h-3 mr-1" />
                                    Assinado
                                  </Badge>
                                )}
                              </div>
                              {termoEntrega.descricao && <p className="text-sm text-gray-600">{termoEntrega.descricao}</p>}
                              {termoEntrega.assinaturas && termoEntrega.assinaturas.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Assinado por: {termoEntrega.assinaturas.filter((a: any) => a.status === 'assinado').map((a: any) => a.user_nome || a.user_email).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                              {(termoEntrega.arquivo_assinado || termoEntrega.caminho_arquivo || termoEntrega.arquivo_original) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadDocumento(termoEntrega)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Baixar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => criarInputUpload('termo_entrega_tecnica', 'Termo de Entrega Técnica')}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Substituir PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removerDocumento(termoEntrega)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="p-3 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm mb-2">Termo de entrega técnica não encontrado.</p>
                        <p className="text-xs text-gray-400">Inclua o termo assinado por IRBANA em PDF para consulta e rastreabilidade.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 print:hidden"
                          onClick={() => criarInputUpload('termo_entrega_tecnica', 'Termo de Entrega Técnica')}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Fazer Upload de PDF
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6.8. PLANO DE CARGAS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                6.8. Plano de Cargas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const planoCargas = documentos.find((doc: any) => 
                    doc.categoria === 'plano_carga' ||
                    (doc.titulo?.toLowerCase().includes('plano') && 
                    doc.titulo?.toLowerCase().includes('carga'))
                  )
                  
                  if (planoCargas) {
                    return (
                      <div>
                        <div className="p-3 bg-gray-50 rounded-md mb-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium">{planoCargas.titulo || 'Plano de Cargas'}</p>
                              {planoCargas.descricao && <p className="text-sm text-gray-600 mt-1">{planoCargas.descricao}</p>}
                            </div>
                            <div className="flex items-center gap-2 print:hidden">
                              {(planoCargas.arquivo_assinado || planoCargas.caminho_arquivo || planoCargas.arquivo_original) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadDocumento(planoCargas)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Baixar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => criarInputUpload('plano_carga', 'Plano de Cargas')}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Substituir PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removerDocumento(planoCargas)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Anexos do plano de cargas */}
                        {documentos.filter((doc: any) => 
                          doc.titulo?.toLowerCase().includes('anexo') && 
                          (doc.descricao?.toLowerCase().includes('plano') || doc.descricao?.toLowerCase().includes('carga'))
                        ).length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Anexos do Plano de Cargas</p>
                            <div className="space-y-2">
                              {documentos.filter((doc: any) => 
                                doc.titulo?.toLowerCase().includes('anexo') && 
                                (doc.descricao?.toLowerCase().includes('plano') || doc.descricao?.toLowerCase().includes('carga'))
                              ).map((anexo: any, idx: number) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-md flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{anexo.titulo || `Anexo ${idx + 1}`}</p>
                                    {anexo.descricao && <p className="text-sm text-gray-600">{anexo.descricao}</p>}
                                  </div>
                                  {(anexo.arquivo_assinado || anexo.caminho_arquivo || anexo.arquivo_original) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => downloadDocumento(anexo)}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Baixar
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }
                  
                  // Se não encontrar plano de cargas, mostrar informações do local de instalação
                  return (
                    <div className="p-3 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm mb-2">Plano de cargas não encontrado.</p>
                      <p className="text-xs text-gray-500 mb-2">
                        Nota: A maioria das vezes os dados do local de instalação da grua ficam no plano de carga.
                      </p>
                      <p className="text-xs text-gray-400 mb-3">Faça upload do PDF para disponibilizar o documento na obra.</p>
                      {relacaoGrua?.local_instalacao && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">Local de Instalação (referência):</p>
                          <p className="font-medium">{relacaoGrua.local_instalacao}</p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="print:hidden"
                        onClick={() => criarInputUpload('plano_carga', 'Plano de Cargas')}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Fazer Upload de PDF
                      </Button>
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>

          {/* 7. CONFIGURAÇÃO E ESPECIFICAÇÕES */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                7. Configuração e Especificações Técnicas
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
                  <p className="text-xs text-gray-500">Manual de Montagem</p>
                  <p className="font-medium">
                    {documentos.find((doc: any) => doc.titulo?.toLowerCase().includes('manual') && doc.titulo?.toLowerCase().includes('montagem')) 
                      ? 'Disponível (ver seção 6.6)' 
                      : 'Não informado'}
                  </p>
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

          {/* 8. OBSERVAÇÕES GERAIS */}
          {(obra.observacoes || relacaoGrua?.observacoes) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  8. Observações Gerais
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

