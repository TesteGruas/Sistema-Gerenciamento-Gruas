"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Truck,
  CreditCard,
  BookOpen,
  FileCheck,
  Package
} from "lucide-react"
import { obrasApi, converterObraBackendParaFrontend } from "@/lib/api-obras"
import { obrasDocumentosApi } from "@/lib/api-obras-documentos"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { CardLoader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"

// Nota: Este componente usa gruaObraApi (não obraGruasApi) para buscar relacionamentos grua-obra

interface LivroGruaObraProps {
  obraId: string
  cachedData?: any
  onDataLoaded?: (data: any) => void
}

export function LivroGruaObra({ obraId, cachedData, onDataLoaded }: LivroGruaObraProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(!cachedData)
  const [obra, setObra] = useState<any>(cachedData?.obra || null)
  const [documentos, setDocumentos] = useState<any[]>(cachedData?.documentos || [])
  const [gruaSelecionada, setGruaSelecionada] = useState<any>(cachedData?.gruaSelecionada || null)

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
      setObra(obraConvertida)

      // Carregar documentos
      const docsResponse = await obrasDocumentosApi.listarPorObra(parseInt(obraId))
      let documentosData: any[] = []
      if (docsResponse.success && docsResponse.data) {
        documentosData = Array.isArray(docsResponse.data) ? docsResponse.data : [docsResponse.data]
        setDocumentos(documentosData)
      }

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
            modelo: modelo || 'Modelo não informado',
            fabricante: fabricante || 'Fabricante não informado',
            tipo: grua.tipo || 'Tipo não informado',
            capacidade: grua.capacidade || 'Capacidade não informada',
            relacao: relacao,
            // Campos da relação
            data_inicio_locacao: relacao.data_inicio_locacao,
            data_fim_locacao: relacao.data_fim_locacao,
            valor_locacao_mensal: relacao.valor_locacao_mensal,
            status: relacao.status,
            observacoes: relacao.observacoes
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
            modelo: modelo || 'Modelo não informado',
            fabricante: fabricante || 'Fabricante não informado',
            tipo: grua.tipo || 'Tipo não informado',
            capacidade: grua.capacidade || 'Capacidade não informada',
            relacao: relacao,
            data_inicio_locacao: relacao.data_inicio_locacao,
            data_fim_locacao: relacao.data_fim_locacao,
            valor_locacao_mensal: relacao.valor_locacao_mensal,
            status: relacao.status,
            observacoes: relacao.observacoes
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

      // ============================================
      // CAPA PADRÃO NR12 NR18
      // ============================================
      const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
      let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)

      // Box de cabeçalho com fundo - Capa padrão NR12 NR18
      const headerBoxY = yPos - 3
      const headerBoxHeight = 30
      doc.setFillColor(66, 139, 202) // Azul profissional
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

      // ============================================
      // ÍNDICE DO LIVRO
      // ============================================
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const indiceY = yPos
      doc.setFillColor(66, 139, 202)
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
        '3. Responsável Técnico',
        '4. Sinaleiros',
        '5. Parâmetros Técnicos',
        '6. Valores e Condições Comerciais',
        '7. Documentos e Certificações',
        '7.1. Dados da Montagem do(s) Equipamento(s)',
        '7.2. Proprietário do Equipamento',
        '7.3. Responsável pela Manutenção da Grua',
        '7.4. Responsável(is) pela Montagem e Operação da(s) Grua(s)',
        '7.5. Manual de Montagem',
        '7.6. Entrega Técnica',
        '7.7. Plano de Cargas',
        '8. Configuração e Especificações Técnicas',
        '9. Observações Gerais'
      ]

      indiceItens.forEach((item, index) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(`${item}`, 18, yPos)
        yPos += 6
      })

      yPos += 10

      // ============================================
      // INÍCIO DO CONTEÚDO
      // ============================================
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Box de informações da Grua
      const fabricante = (gruaSelecionada.fabricante || '').replace(/^Fabricante/i, '').trim()
      const modelo = (gruaSelecionada.modelo || '').replace(/^Modelo/i, '').replace(/Samuel/i, '').trim()
      const nomeGrua = fabricante && modelo ? `${fabricante} ${modelo}` : (gruaSelecionada.name || `Grua ${gruaSelecionada.id}`)
      
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
      doc.setDrawColor(66, 139, 202)
      doc.setLineWidth(1)
      doc.line(14, yPos, 196, yPos)
      yPos += 10

      // 1. DADOS DA OBRA
      const secaoY = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secaoY, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('1. DADOS DA OBRA', 18, secaoY + 6)
      yPos = secaoY + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      // Criar tabela com duas colunas
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

      // Dividir em duas colunas
      const col1XObra = 18
      const col2XObra = 110
      const linhaAlturaObra = 6
      
      dadosObra.forEach(([label, value], index) => {
        const linhaY = yPos + (index % 5) * linhaAlturaObra
        const coluna = Math.floor(index / 5)
        
        if (coluna === 1 && index % 5 === 0) {
          yPos += 5 * linhaAlturaObra + 2
        }
        
        const xPos = coluna === 0 ? col1XObra : col2XObra
        const currentY = coluna === 0 ? linhaY : yPos + (index % 5) * linhaAlturaObra
        
        doc.setFont('helvetica', 'bold')
        doc.text(label, xPos, currentY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), xPos + 35, currentY)
      })
      
      yPos += Math.ceil(dadosObra.length / 2) * linhaAlturaObra + 8

      // 2. EQUIPAMENTO - GRUA
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao2Y = yPos
      doc.setFillColor(66, 139, 202)
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
        [`Capacidade:`, gruaSelecionada.capacidade || 'N/A']
      ]

      dadosGrua.forEach(([label, value], index) => {
        const linhaY = yPos + index * 6
        doc.setFont('helvetica', 'bold')
        doc.text(label, 18, linhaY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), 18 + 40, linhaY)
      })
      
      yPos += dadosGrua.length * 6 + 8

      // 3. RESPONSÁVEL TÉCNICO
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao3Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao3Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('3. RESPONSÁVEL TÉCNICO', 18, secao3Y + 6)
      yPos = secao3Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
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

        dadosResponsavel.forEach(([label, value], index) => {
          const linhaY = yPos + index * 6
          doc.setFont('helvetica', 'bold')
          doc.text(label, 18, linhaY)
          doc.setFont('helvetica', 'normal')
          doc.text(String(value || 'N/A'), 18 + 40, linhaY)
        })
        yPos += dadosResponsavel.length * 6
      } else {
        doc.text('Não informado', 18, yPos)
        yPos += 6
      }

      yPos += 8

      // 4. SINALEIROS
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao4Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao4Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('4. SINALEIROS', 18, secao4Y + 6)
      yPos = secao4Y + 12

      doc.setTextColor(0, 0, 0)
      const sinaleiros = obra.sinaleiros || []
      if (sinaleiros && sinaleiros.length > 0) {
        const sinaleirosData = sinaleiros.map((s: any, index: number) => [
          `${index + 1}`,
          s.nome || 'N/A',
          s.tipo === 'principal' ? 'Principal' : 'Reserva',
          s.tipo_vinculo === 'interno' ? 'Interno' : 'Cliente'
        ])

        autoTable(doc, {
          head: [['#', 'Nome', 'Tipo', 'Vínculo']],
          body: sinaleirosData.map((row: any[]) => [row[0], row[1], row[2], row[3]]),
          startY: yPos,
          margin: { left: 14, right: 14 },
          styles: { 
            fontSize: 9,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 40, halign: 'center' },
            3: { cellWidth: 40, halign: 'center' }
          }
        })

        yPos = (doc as any).lastAutoTable.finalY + 10
      } else {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('Não informado', 18, yPos)
        yPos += 6
      }

      yPos += 4

      // 5. PARÂMETROS TÉCNICOS
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao5Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao5Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('5. PARÂMETROS TÉCNICOS', 18, secao5Y + 6)
      yPos = secao5Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const parametrosTecnicos = [
        [`Tipo de Base:`, relacaoGrua.tipo_base || 'N/A'],
        [`Altura Inicial:`, relacaoGrua.altura_inicial ? `${relacaoGrua.altura_inicial}m` : 'N/A'],
        [`Altura Final:`, relacaoGrua.altura_final ? `${relacaoGrua.altura_final}m` : 'N/A'],
        [`Velocidade de Giro:`, relacaoGrua.velocidade_giro ? `${relacaoGrua.velocidade_giro} rpm` : 'N/A'],
        [`Velocidade de Elevação:`, relacaoGrua.velocidade_elevacao ? `${relacaoGrua.velocidade_elevacao} m/min` : 'N/A'],
        [`Potência Instalada:`, relacaoGrua.potencia_instalada ? `${relacaoGrua.potencia_instalada} kVA` : 'N/A'],
        [`Voltagem:`, relacaoGrua.voltagem || 'N/A'],
        [`Tipo de Ligação:`, relacaoGrua.tipo_ligacao || 'N/A'],
        [`Capacidade na Ponta:`, relacaoGrua.capacidade_ponta ? `${relacaoGrua.capacidade_ponta} kg` : 'N/A'],
        [`Ano de Fabricação:`, relacaoGrua.ano_fabricacao ? String(relacaoGrua.ano_fabricacao) : 'N/A'],
        [`Vida Útil:`, relacaoGrua.vida_util ? `${relacaoGrua.vida_util} anos` : 'N/A']
      ]

      // Dividir em duas colunas
      const col1XTec = 18
      const col2XTec = 110
      const linhaAlturaTec = 6
      
      parametrosTecnicos.forEach(([label, value], index) => {
        const coluna = Math.floor(index / 6)
        const linha = index % 6
        
        if (coluna === 1 && linha === 0) {
          yPos += 6 * linhaAlturaTec + 2
        }
        
        const xPos = coluna === 0 ? col1XTec : col2XTec
        const currentY = coluna === 0 ? yPos + linha * linhaAlturaTec : yPos + linha * linhaAlturaTec
        
        doc.setFont('helvetica', 'bold')
        doc.text(label, xPos, currentY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), xPos + 45, currentY)
      })
      
      yPos += Math.ceil(parametrosTecnicos.length / 2) * linhaAlturaTec + 8

      // 6. VALORES E CONDIÇÕES COMERCIAIS
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao6Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao6Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('6. VALORES E CONDIÇÕES COMERCIAIS', 18, secao6Y + 6)
      yPos = secao6Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const valores = [
        [`Locação Mensal:`, formatarMoeda(relacaoGrua.valor_locacao || 0)],
        [`Operador:`, formatarMoeda(relacaoGrua.valor_operador || 0)],
        [`Manutenção:`, formatarMoeda(relacaoGrua.valor_manutencao || 0)],
        [`Montagem:`, formatarMoeda(relacaoGrua.valor_montagem || 0)],
        [`Desmontagem:`, formatarMoeda(relacaoGrua.valor_desmontagem || 0)],
        [`Transporte:`, formatarMoeda(relacaoGrua.valor_transporte || 0)],
        [`Caução:`, formatarMoeda(relacaoGrua.valor_caucao || 0)],
        [`Forma de Pagamento:`, relacaoGrua.forma_pagamento || 'N/A'],
        [`Prazo de Validade:`, relacaoGrua.prazo_validade ? `${relacaoGrua.prazo_validade} dias` : 'N/A']
      ]

      // Criar tabela para valores
      const valoresData = valores.map(([label, value]) => [label, value])
      
      autoTable(doc, {
        head: [['Item', 'Valor']],
        body: valoresData,
        startY: yPos,
        margin: { left: 14, right: 14 },
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: {
          0: { cellWidth: 100, fontStyle: 'bold' },
          1: { cellWidth: 80, halign: 'right' }
        }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10

      // 7. DOCUMENTOS E CERTIFICAÇÕES
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao7Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao7Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('7. DOCUMENTOS E CERTIFICAÇÕES', 18, secao7Y + 6)
      yPos = secao7Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const documentosInfo = [
        [`CNO da Obra:`, obra.cno || obra.cno_obra || 'Não informado'],
        [`ART de Instalação:`, obra.art_numero || obra.artNumero || 'Não informado'],
        [`Apólice de Seguro:`, obra.apolice_numero || obra.apoliceNumero || 'Não informado']
      ]

      documentosInfo.forEach(([label, value], index) => {
        const linhaY = yPos + index * 6
        doc.setFont('helvetica', 'bold')
        doc.text(label, 18, linhaY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), 18 + 50, linhaY)
      })
      
      yPos += documentosInfo.length * 6 + 8

      // 7.1. DADOS DA MONTAGEM DO(s) EQUIPAMENTO(s)
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao71Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao71Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('7.1. DADOS DA MONTAGEM DO(s) EQUIPAMENTO(s)', 18, secao71Y + 6)
      yPos = secao71Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const dadosMontagem = [
        [`Data de Montagem:`, relacaoGrua?.data_montagem ? formatarData(relacaoGrua.data_montagem) : relacaoGrua?.data_inicio_locacao ? formatarData(relacaoGrua.data_inicio_locacao) : 'Não informado'],
        [`Data de Desmontagem:`, relacaoGrua?.data_desmontagem ? formatarData(relacaoGrua.data_desmontagem) : relacaoGrua?.data_fim_locacao ? formatarData(relacaoGrua.data_fim_locacao) : 'Não informado'],
        [`Tipo de Base/Fundação:`, relacaoGrua?.tipo_base || relacaoGrua?.fundacao || 'Não informado'],
        [`Altura Inicial:`, relacaoGrua?.altura_inicial ? `${relacaoGrua.altura_inicial}m` : 'Não informado'],
        [`Altura Final:`, relacaoGrua?.altura_final ? `${relacaoGrua.altura_final}m` : 'Não informado'],
        [`Local de Instalação:`, relacaoGrua?.local_instalacao || obra.endereco || 'Não informado']
      ]

      dadosMontagem.forEach(([label, value], index) => {
        const linhaY = yPos + index * 6
        doc.setFont('helvetica', 'bold')
        doc.text(label, 18, linhaY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), 18 + 60, linhaY)
      })
      
      yPos += dadosMontagem.length * 6 + 8

      // 7.2. PROPRIETÁRIO DO EQUIPAMENTO
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao72Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao72Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('7.2. PROPRIETÁRIO DO EQUIPAMENTO', 18, secao72Y + 6)
      yPos = secao72Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const proprietario = [
        [`Nome/Razão Social:`, gruaSelecionada.proprietario_nome || obra.cliente?.nome || 'Não informado'],
        [`CNPJ:`, gruaSelecionada.proprietario_cnpj || obra.cliente?.cnpj || 'Não informado'],
        [`Endereço:`, gruaSelecionada.proprietario_endereco || obra.endereco || 'Não informado'],
        [`Telefone:`, gruaSelecionada.proprietario_telefone || obra.cliente?.telefone || 'Não informado'],
        [`Email:`, gruaSelecionada.proprietario_email || obra.cliente?.email || 'Não informado']
      ]

      proprietario.forEach(([label, value], index) => {
        const linhaY = yPos + index * 6
        doc.setFont('helvetica', 'bold')
        doc.text(label, 18, linhaY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), 18 + 50, linhaY)
      })
      
      yPos += proprietario.length * 6 + 8

      // 7.3. RESPONSÁVEL PELA MANUTENÇÃO DA GRUA
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao73Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao73Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('7.3. RESPONSÁVEL PELA MANUTENÇÃO DA GRUA', 18, secao73Y + 6)
      yPos = secao73Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const responsavelManutencao = funcionariosGrua.find((f: any) => 
        f.funcionario?.cargo?.toLowerCase().includes('manutenção') || 
        f.funcionario?.cargo?.toLowerCase().includes('técnico') || 
        f.funcionario?.cargo?.toLowerCase().includes('mecânico')
      )

      if (responsavelManutencao) {
        const dadosManutencao = [
          [`Nome:`, responsavelManutencao.funcionario?.nome || 'N/A'],
          [`Cargo:`, responsavelManutencao.funcionario?.cargo || 'N/A'],
          [`Telefone:`, responsavelManutencao.funcionario?.telefone || 'Não informado'],
          [`Email:`, responsavelManutencao.funcionario?.email || 'Não informado']
        ]

        dadosManutencao.forEach(([label, value], index) => {
          const linhaY = yPos + index * 6
          doc.setFont('helvetica', 'bold')
          doc.text(label, 18, linhaY)
          doc.setFont('helvetica', 'normal')
          doc.text(String(value || 'N/A'), 18 + 40, linhaY)
        })
        yPos += dadosManutencao.length * 6
      } else {
        doc.text('Não informado', 18, yPos)
        yPos += 6
      }

      yPos += 8

      // 7.4. RESPONSÁVEL(is) PELA MONTAGEM E OPERAÇÃO
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao74Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao74Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('7.4. RESPONSÁVEL(is) PELA MONTAGEM E OPERAÇÃO DA(s) GRUA(s)', 18, secao74Y + 6)
      yPos = secao74Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const operador = funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('operador'))
      const montador = funcionariosGrua.find((f: any) => 
        f.funcionario?.cargo?.toLowerCase().includes('montagem') || 
        f.funcionario?.cargo?.toLowerCase().includes('montador')
      )

      if (operador) {
        doc.setFont('helvetica', 'bold')
        doc.text('Operador da Grua:', 18, yPos)
        yPos += 6
        doc.setFont('helvetica', 'normal')
        doc.text(`Nome: ${operador.funcionario?.nome || 'N/A'}`, 25, yPos)
        yPos += 5
        doc.text(`Cargo: ${operador.funcionario?.cargo || 'N/A'}`, 25, yPos)
        yPos += 8
      }

      if (montador) {
        doc.setFont('helvetica', 'bold')
        doc.text('Responsável pela Montagem:', 18, yPos)
        yPos += 6
        doc.setFont('helvetica', 'normal')
        doc.text(`Nome: ${montador.funcionario?.nome || 'N/A'}`, 25, yPos)
        yPos += 5
        doc.text(`Cargo: ${montador.funcionario?.cargo || 'N/A'}`, 25, yPos)
        yPos += 8
      }

      if (!operador && !montador) {
        doc.text('Não informado', 18, yPos)
        yPos += 6
      }

      yPos += 8

      // 7.5. MANUAL DE MONTAGEM
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao75Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao75Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('7.5. MANUAL DE MONTAGEM', 18, secao75Y + 6)
      yPos = secao75Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const manualMontagem = documentos.find((doc: any) => 
        doc.titulo?.toLowerCase().includes('manual') && 
        (doc.titulo?.toLowerCase().includes('montagem') || doc.titulo?.toLowerCase().includes('instalação'))
      )

      if (manualMontagem) {
        doc.text(`Manual disponível: ${manualMontagem.titulo || 'Manual de Montagem'}`, 18, yPos)
      } else {
        doc.text('Não informado', 18, yPos)
      }
      yPos += 8

      // 7.6. ENTREGA TÉCNICA
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao76Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao76Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('7.6. ENTREGA TÉCNICA', 18, secao76Y + 6)
      yPos = secao76Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const termoEntrega = documentos.find((doc: any) => 
        (doc.titulo?.toLowerCase().includes('entrega') && doc.titulo?.toLowerCase().includes('técnica')) ||
        (doc.titulo?.toLowerCase().includes('termo') && doc.titulo?.toLowerCase().includes('entrega'))
      )

      if (termoEntrega) {
        const isAssinado = termoEntrega.status === 'assinado' || termoEntrega.arquivo_assinado
        doc.text(`Termo de Entrega Técnica: ${termoEntrega.titulo || 'Termo de Entrega Técnica'}`, 18, yPos)
        yPos += 6
        doc.text(`Status: ${isAssinado ? 'Assinado' : 'Pendente'}`, 18, yPos)
        if (termoEntrega.assinaturas && termoEntrega.assinaturas.length > 0) {
          yPos += 6
          doc.text(`Assinado por: ${termoEntrega.assinaturas.filter((a: any) => a.status === 'assinado').map((a: any) => a.user_nome || a.user_email).join(', ')}`, 18, yPos)
        }
      } else {
        doc.text('Termo de entrega técnica não encontrado. Inclua o termo assinado por IRBANA em anexo.', 18, yPos)
      }
      yPos += 10

      // 7.7. PLANO DE CARGAS
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao77Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao77Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('7.7. PLANO DE CARGAS', 18, secao77Y + 6)
      yPos = secao77Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const planoCargas = documentos.find((doc: any) => 
        doc.titulo?.toLowerCase().includes('plano') && 
        doc.titulo?.toLowerCase().includes('carga')
      )

      if (planoCargas) {
        doc.text(`Plano de Cargas: ${planoCargas.titulo || 'Plano de Cargas'}`, 18, yPos)
        yPos += 6
        if (planoCargas.descricao) {
          doc.text(`Descrição: ${planoCargas.descricao}`, 18, yPos)
          yPos += 6
        }
        
        // Anexos do plano de cargas
        const anexosPlano = documentos.filter((doc: any) => 
          doc.titulo?.toLowerCase().includes('anexo') && 
          (doc.descricao?.toLowerCase().includes('plano') || doc.descricao?.toLowerCase().includes('carga'))
        )

        if (anexosPlano.length > 0) {
          yPos += 6
          doc.setFont('helvetica', 'bold')
          doc.text('Anexos:', 18, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          anexosPlano.forEach((anexo: any, idx: number) => {
            doc.text(`${idx + 1}. ${anexo.titulo || `Anexo ${idx + 1}`}`, 25, yPos)
            yPos += 5
          })
        }
      } else {
        doc.text('Plano de cargas não encontrado.', 18, yPos)
        yPos += 6
        doc.setFontSize(8)
        doc.text('Nota: A maioria das vezes os dados do local de instalação da grua ficam no plano de carga.', 18, yPos)
        yPos += 5
        if (relacaoGrua?.local_instalacao) {
          doc.setFontSize(9)
          doc.text(`Local de Instalação (referência): ${relacaoGrua.local_instalacao}`, 18, yPos)
        }
      }
      yPos += 8

      // 8. CONFIGURAÇÃO E ESPECIFICAÇÕES TÉCNICAS
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      const secao8Y = yPos
      doc.setFillColor(66, 139, 202)
      doc.roundedRect(14, secao8Y, 182, 8, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('8. CONFIGURAÇÃO E ESPECIFICAÇÕES TÉCNICAS', 18, secao8Y + 6)
      yPos = secao8Y + 12

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const configTecnica = [
        [`Raio de Operação:`, relacaoGrua?.raio_operacao || relacaoGrua?.raio || gruaSelecionada.alcance_maximo || 'N/A'],
        [`Altura de Operação:`, gruaSelecionada.altura_maxima || relacaoGrua?.altura || 'N/A'],
        [`Manual de Operação:`, relacaoGrua?.manual_operacao || 'Vinculado à obra'],
        [`Manual de Montagem:`, manualMontagem ? 'Disponível (ver seção 7.5)' : 'Não informado']
      ]

      configTecnica.forEach(([label, value], index) => {
        const linhaY = yPos + index * 6
        doc.setFont('helvetica', 'bold')
        doc.text(label, 18, linhaY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value || 'N/A'), 18 + 50, linhaY)
      })
      
      yPos += configTecnica.length * 6 + 8

      // 9. OBSERVAÇÕES GERAIS
      if ((obra.observacoes || relacaoGrua?.observacoes) && yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      if (obra.observacoes || relacaoGrua?.observacoes) {
        const secao9Y = yPos
        doc.setFillColor(66, 139, 202)
        doc.roundedRect(14, secao9Y, 182, 8, 2, 2, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('9. OBSERVAÇÕES GERAIS', 18, secao9Y + 6)
        yPos = secao9Y + 12

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        if (obra.observacoes) {
          doc.setFont('helvetica', 'bold')
          doc.text('Observações da Obra:', 18, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          const observacoesObra = doc.splitTextToSize(obra.observacoes, 170)
          doc.text(observacoesObra, 18, yPos)
          yPos += observacoesObra.length * 5 + 5
        }

        if (relacaoGrua?.observacoes) {
          doc.setFont('helvetica', 'bold')
          doc.text('Observações da Grua:', 18, yPos)
          yPos += 6
          doc.setFont('helvetica', 'normal')
          const observacoesGrua = doc.splitTextToSize(relacaoGrua.observacoes, 170)
          doc.text(observacoesGrua, 18, yPos)
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
  const relacaoGruaBase = gruaSelecionada?.relacao || obra.gruasVinculadas?.find((g: any) => 
    g.id === gruaSelecionada?.id || 
    g.grua_id === gruaSelecionada?.id || 
    g.grua?.id === gruaSelecionada?.id ||
    (g.grua && g.grua.id === gruaSelecionada?.id)
  ) || obra.grua_obra?.find((g: any) => 
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
  
  // Usar sinaleiros reais da obra (já vêm da API)
  const sinaleirosDisponiveis = obra?.sinaleiros || []
  
  // Buscar funcionários vinculados à grua
  const funcionariosGrua = (obra.funcionariosVinculados || obra.grua_funcionario || []).filter((f: any) => {
    const fGruaId = f.grua_id || f.grua?.id
    const sGruaId = gruaSelecionada?.id
    return fGruaId === sGruaId || fGruaId?.toString() === sGruaId?.toString()
  }) || []

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

          {/* 7.1. DADOS DA MONTAGEM DO(s) EQUIPAMENTO(s) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                7.1. Dados da Montagem do(s) Equipamento(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Data de Montagem</p>
                  <p className="font-medium">{relacaoGrua?.data_montagem ? formatarData(relacaoGrua.data_montagem) : relacaoGrua?.data_inicio_locacao ? formatarData(relacaoGrua.data_inicio_locacao) : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data de Desmontagem</p>
                  <p className="font-medium">{relacaoGrua?.data_desmontagem ? formatarData(relacaoGrua.data_desmontagem) : relacaoGrua?.data_fim_locacao ? formatarData(relacaoGrua.data_fim_locacao) : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Base/Fundação</p>
                  <p className="font-medium">{relacaoGrua?.tipo_base || relacaoGrua?.fundacao || 'Não informado'}</p>
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
                  <p className="text-xs text-gray-500">Local de Instalação</p>
                  <p className="font-medium">{relacaoGrua?.local_instalacao || obra.endereco || 'Não informado'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500">Observações da Montagem</p>
                  <p className="font-medium">{relacaoGrua?.observacoes_montagem || relacaoGrua?.observacoes || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7.2. PROPRIETÁRIO DO EQUIPAMENTO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                7.2. Proprietário do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Nome/Razão Social</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{gruaSelecionada.proprietario_nome || obra.cliente?.nome || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">CNPJ</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{gruaSelecionada.proprietario_cnpj || obra.cliente?.cnpj || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Endereço</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{gruaSelecionada.proprietario_endereco || obra.endereco || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Telefone</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{gruaSelecionada.proprietario_telefone || obra.cliente?.telefone || 'Não informado'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Email</p>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium">{gruaSelecionada.proprietario_email || obra.cliente?.email || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7.3. RESPONSÁVEL PELA MANUTENÇÃO DA GRUA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                7.3. Responsável pela Manutenção da Grua
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico') || f.funcionario?.cargo?.toLowerCase().includes('mecânico')) ? (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Nome</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico') || f.funcionario?.cargo?.toLowerCase().includes('mecânico'))?.funcionario?.nome}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Cargo</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico') || f.funcionario?.cargo?.toLowerCase().includes('mecânico'))?.funcionario?.cargo}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Telefone</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico') || f.funcionario?.cargo?.toLowerCase().includes('mecânico'))?.funcionario?.telefone || 'Não informado'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Email</p>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">
                          {funcionariosGrua.find((f: any) => f.funcionario?.cargo?.toLowerCase().includes('manutenção') || f.funcionario?.cargo?.toLowerCase().includes('técnico') || f.funcionario?.cargo?.toLowerCase().includes('mecânico'))?.funcionario?.email || 'Não informado'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Não informado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 7.4. RESPONSÁVEL(is) PELA MONTAGEM E OPERAÇÃO DA(s) GRUA(s) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                7.4. Responsável(is) pela Montagem e Operação da(s) Grua(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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

          {/* 7.5. MANUAL DE MONTAGEM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                7.5. Manual de Montagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Manual de Montagem Disponível</p>
                  {(() => {
                    const manualMontagem = documentos.find((doc: any) => 
                      doc.titulo?.toLowerCase().includes('manual') && 
                      (doc.titulo?.toLowerCase().includes('montagem') || doc.titulo?.toLowerCase().includes('instalação'))
                    ) || relacaoGrua?.manual_montagem
                    
                    if (manualMontagem) {
                      return (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{manualMontagem.titulo || 'Manual de Montagem'}</p>
                              {manualMontagem.descricao && <p className="text-sm text-gray-600 mt-1">{manualMontagem.descricao}</p>}
                            </div>
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
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-gray-500">Não informado</p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7.6. ENTREGA TÉCNICA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                7.6. Entrega Técnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Termo de Entrega Técnica</p>
                  {(() => {
                    const termoEntrega = documentos.find((doc: any) => 
                      doc.titulo?.toLowerCase().includes('entrega') && 
                      doc.titulo?.toLowerCase().includes('técnica')
                    ) || documentos.find((doc: any) => 
                      doc.titulo?.toLowerCase().includes('termo') && 
                      doc.titulo?.toLowerCase().includes('entrega')
                    )
                    
                    if (termoEntrega) {
                      const isAssinado = termoEntrega.status === 'assinado' || termoEntrega.arquivo_assinado
                      
                      return (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
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
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-gray-500">Termo de entrega técnica não encontrado. Inclua o termo assinado por IRBANA em anexo.</p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7.7. PLANO DE CARGAS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                7.7. Plano de Cargas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const planoCargas = documentos.find((doc: any) => 
                    doc.titulo?.toLowerCase().includes('plano') && 
                    doc.titulo?.toLowerCase().includes('carga')
                  )
                  
                  if (planoCargas) {
                    return (
                      <div>
                        <div className="p-3 bg-gray-50 rounded-md mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{planoCargas.titulo || 'Plano de Cargas'}</p>
                              {planoCargas.descricao && <p className="text-sm text-gray-600 mt-1">{planoCargas.descricao}</p>}
                            </div>
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
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-500 mb-2">Plano de cargas não encontrado.</p>
                      <p className="text-xs text-gray-500">
                        Nota: A maioria das vezes os dados do local de instalação da grua ficam no plano de carga.
                      </p>
                      {relacaoGrua?.local_instalacao && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">Local de Instalação (referência):</p>
                          <p className="font-medium">{relacaoGrua.local_instalacao}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
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
                  <p className="text-xs text-gray-500">Manual de Montagem</p>
                  <p className="font-medium">
                    {documentos.find((doc: any) => doc.titulo?.toLowerCase().includes('manual') && doc.titulo?.toLowerCase().includes('montagem')) 
                      ? 'Disponível (ver seção 7.5)' 
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

