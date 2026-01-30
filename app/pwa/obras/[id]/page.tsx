"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Building2,
  Wrench, 
  BookOpen, 
  CheckCircle2,
  Wifi,
  WifiOff,
  Users,
  MapPin,
  Truck,
  FileText,
  Clock,
  AlertCircle,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Edit
} from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { obrasApi, Obra } from "@/lib/api-obras"
import { obrasDocumentosApi, DocumentoObra } from "@/lib/api-obras-documentos"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { usePermissions } from "@/hooks/use-permissions"
import { DocumentoUpload } from "@/components/documento-upload"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LivroGruaChecklistList } from "@/components/livro-grua-checklist-list"
import { LivroGruaManutencaoList } from "@/components/livro-grua-manutencao-list"
import { LivroGruaManutencao } from "@/components/livro-grua-manutencao"
import { LivroGruaObra } from "@/components/livro-grua-obra"
import { LivroGruaChecklistDiario } from "@/components/livro-grua-checklist-diario"
import LivroGruaList from "@/components/livro-grua-list"
import { livroGruaApi } from "@/lib/api-livro-grua"

export default function PWAObraDetalhesPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const obraId = Number(params.id)
  const { isSupervisor, isClient } = usePermissions()

  // Estados
  const [obra, setObra] = useState<Obra | null>(null)
  const [gruas, setGruas] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([])
  const [documentosAdicionaisEquipamento, setDocumentosAdicionaisEquipamento] = useState<{
    manual_tecnico?: any
    termo_entrega_tecnica?: any
    plano_carga?: any
    aterramento?: any
  }>({})
  const [loadingDocumentosAdicionais, setLoadingDocumentosAdicionais] = useState(false)
  const documentosAdicionaisCarregadosRef = useRef(false)
  const [livrosGruas, setLivrosGruas] = useState<Record<string, any[]>>({})
  const [loadingLivros, setLoadingLivros] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const carregandoObraRef = useRef(false)
  const [funcionarioModal, setFuncionarioModal] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNovoChecklistOpen, setIsNovoChecklistOpen] = useState(false)
  const [isEditarChecklistOpen, setIsEditarChecklistOpen] = useState(false)
  const [isVisualizarChecklistOpen, setIsVisualizarChecklistOpen] = useState(false)
  const [checklistSelecionado, setChecklistSelecionado] = useState<any>(null)
  const [gruaSelecionadaChecklist, setGruaSelecionadaChecklist] = useState<string>("")
  const [isNovaManutencaoOpen, setIsNovaManutencaoOpen] = useState(false)
  const [isEditarManutencaoOpen, setIsEditarManutencaoOpen] = useState(false)
  const [isVisualizarManutencaoOpen, setIsVisualizarManutencaoOpen] = useState(false)
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState<any>(null)
  const [gruaSelecionadaManutencao, setGruaSelecionadaManutencao] = useState<string>("")
  const [isInformacoesObraExpanded, setIsInformacoesObraExpanded] = useState(true)
  const [livroGruaObraData, setLivroGruaObraData] = useState<any>(null)
  
  // Estados para edição de documentos obrigatórios
  const [isEditingCNO, setIsEditingCNO] = useState(false)
  const [isEditingART, setIsEditingART] = useState(false)
  const [isEditingApolice, setIsEditingApolice] = useState(false)
  const [cnoArquivo, setCnoArquivo] = useState<File | null>(null)
  const [artArquivo, setArtArquivo] = useState<File | null>(null)
  const [apoliceArquivo, setApoliceArquivo] = useState<File | null>(null)
  const [cnoNumero, setCnoNumero] = useState<string>('')
  const [artNumero, setArtNumero] = useState<string>('')
  const [apoliceNumero, setApoliceNumero] = useState<string>('')
  const [salvandoDocumentos, setSalvandoDocumentos] = useState(false)

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carregar dados da obra
  const carregarObra = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (carregandoObraRef.current) {
      console.warn('⚠️ [PWA Obras] Carregamento já em andamento, ignorando chamada duplicada')
      return
    }
    
    carregandoObraRef.current = true
    
    try {
      setLoading(true)
      setError(null)

      // Se offline, tentar carregar do cache
      if (!isOnline) {
        const cachedObra = localStorage.getItem(`cached_obra_${obraId}`)
        if (cachedObra) {
          setObra(JSON.parse(cachedObra))
          setLoading(false)
          return
        }
      }

      // Buscar obra com relacionamentos
      const response = await obrasApi.obterObraComRelacionamentos(obraId)
      
      if (response.success && response.data) {
        setObra(response.data)

        // Extrair funcionários
        const funcionariosDaObra = response.data.funcionariosVinculados || []
        setFuncionarios(funcionariosDaObra)
      }

      // Buscar gruas da obra usando a API relacionamentos/grua-obra
      try {
        const gruasResponse = await gruaObraApi.buscarGruasPorObra(obraId)
        console.log('🔍 [PWA Obras] Resposta da API grua-obra:', gruasResponse)
        
        if (gruasResponse.success && gruasResponse.data && Array.isArray(gruasResponse.data)) {
          const gruasMapeadas = gruasResponse.data.map((relacao: any) => ({
            id: relacao.grua_id,
            name: relacao.grua?.modelo || relacao.grua_id,
            modelo: relacao.grua?.modelo,
            fabricante: relacao.grua?.fabricante,
            tipo: relacao.grua?.tipo,
            status: relacao.status,
            data_inicio_locacao: relacao.data_inicio_locacao,
            data_fim_locacao: relacao.data_fim_locacao,
            valor_locacao_mensal: relacao.valor_locacao_mensal,
            observacoes: relacao.observacoes
          }))
          console.log('🔍 [PWA Obras] Gruas mapeadas:', gruasMapeadas)
          setGruas(gruasMapeadas)

          // Carregar livros das gruas
          for (const grua of gruasMapeadas) {
            carregarLivroGrua(grua.id)
          }
        } else {
          console.warn('⚠️ [PWA Obras] Resposta da API não contém dados válidos:', gruasResponse)
        }
      } catch (error) {
        console.error('❌ [PWA Obras] Erro ao buscar gruas da obra:', error)
      }

      // Carregar documentos da obra (para supervisor e cliente)
      try {
        const documentosResponse = await obrasDocumentosApi.listarPorObra(obraId)
        console.log('🔍 [PWA Obras] Documentos carregados:', documentosResponse)
        if (documentosResponse.success) {
          const docs = Array.isArray(documentosResponse.data) 
            ? documentosResponse.data 
            : documentosResponse.data 
              ? [documentosResponse.data]
              : []
          console.log('🔍 [PWA Obras] Documentos processados:', docs)
          setDocumentos(docs)
        } else {
          console.warn('⚠️ [PWA Obras] Resposta de documentos não foi bem-sucedida:', documentosResponse)
          setDocumentos([])
        }
      } catch (err) {
        console.error('❌ [PWA Obras] Erro ao carregar documentos:', err)
        setDocumentos([])
      }

      // Carregar documentos adicionais do equipamento
      await carregarDocumentosAdicionaisEquipamento()

    } catch (err) {
      console.error('Erro ao carregar obra:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar obra'
      setError(errorMessage)
      
      // Tentar carregar do cache em caso de erro
      const cachedObra = localStorage.getItem(`cached_obra_${obraId}`)
      if (cachedObra) {
        setObra(JSON.parse(cachedObra))
      }
    } finally {
      setLoading(false)
      carregandoObraRef.current = false
    }
  }

  // Função para carregar livro da grua
  const carregarLivroGrua = async (gruaId: string) => {
    try {
      setLoadingLivros(prev => ({ ...prev, [gruaId]: true }))
      
      const response = await livroGruaApi.listarEntradas({
        grua_id: gruaId,
        limit: 50 // Limitar a 50 entradas mais recentes
      })
      
      if (response.success) {
        setLivrosGruas(prev => ({
          ...prev,
          [gruaId]: response.data
        }))
      }
    } catch (err) {
      console.error(`Erro ao carregar livro da grua ${gruaId}:`, err)
    } finally {
      setLoadingLivros(prev => ({ ...prev, [gruaId]: false }))
    }
  }

  // Função para carregar documentos adicionais do equipamento
  const carregarDocumentosAdicionaisEquipamento = async () => {
    if (!obraId || documentosAdicionaisCarregadosRef.current) {
      return
    }
    
    documentosAdicionaisCarregadosRef.current = true
    setLoadingDocumentosAdicionais(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      if (!token) {
        console.warn('Token não encontrado para carregar documentos adicionais')
        return
      }
      
      const categorias = ['manual_tecnico', 'termo_entrega_tecnica', 'plano_carga', 'aterramento']
      const documentos: any = {}
      
      // Processar categorias sequencialmente com delay para evitar rate limiting
      for (const categoria of categorias) {
        try {
          const url = `${apiUrl}/api/arquivos/obra/${obraId}?categoria=${categoria}`
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          // Tratar erro 429
          if (response.status === 429) {
            console.warn(`Rate limit atingido para ${categoria}, aguardando...`)
            await new Promise(resolve => setTimeout(resolve, 2000)) // Aguardar 2 segundos
            continue // Pular esta categoria por enquanto
          }
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data && data.data.length > 0) {
              documentos[categoria] = data.data[0]
            }
          }
          
          // Pequeno delay entre requisições para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error: any) {
          // Ignorar erros 429 silenciosamente
          if (!error.message?.includes('429') && !error.message?.includes('Muitas tentativas')) {
            console.error(`Erro ao carregar ${categoria}:`, error)
          }
        }
      }
      
      setDocumentosAdicionaisEquipamento(documentos)
    } catch (error) {
      console.error('Erro ao carregar documentos adicionais:', error)
    } finally {
      setLoadingDocumentosAdicionais(false)
    }
  }

  // Função para exportar livro da grua para PDF
  const exportarLivroGruaPDF = async (gruaId: string, gruaName: string) => {
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Adicionar logos no cabeçalho
      const { adicionarLogosNoCabecalhoFrontend } = await import('@/lib/utils/pdf-logos-frontend')
      let yPos = await adicionarLogosNoCabecalhoFrontend(doc, 10)

      // Título
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Livro da Grua', 105, yPos, { align: 'center' })
      yPos += 8

      // Informações da grua
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Grua: ${gruaName}`, 14, yPos)
      yPos += 6
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos)
      yPos += 10

      // Buscar entradas
      const entradas = livrosGruas[gruaId] || []
      
      if (entradas.length === 0) {
        doc.setFontSize(10)
        doc.text('Nenhuma entrada encontrada no livro da grua.', 14, yPos)
      } else {
        // Cabeçalhos da tabela
        const headers = ['Data', 'Hora', 'Tipo', 'Status', 'Descrição', 'Funcionário']
        const tableData = entradas.map(entrada => [
          new Date(entrada.data_entrada).toLocaleDateString('pt-BR'),
          entrada.hora_entrada || '-',
          entrada.tipo_entrada_display || entrada.tipo_entrada,
          entrada.status_entrada,
          entrada.descricao?.substring(0, 50) || '-',
          entrada.funcionario_nome || '-'
        ])

        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: yPos,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })
      }

      // Adicionar rodapé
      const { adicionarRodapeEmpresaFrontend } = await import('@/lib/utils/pdf-rodape-frontend')
      adicionarRodapeEmpresaFrontend(doc)

      // Salvar PDF
      const nomeArquivo = `livro-grua-${gruaName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(nomeArquivo)

      toast({
        title: "Exportação concluída!",
        description: "Arquivo PDF baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar o PDF",
        variant: "destructive"
      })
    }
  }

  // Handlers Checklist
  const handleNovoChecklist = (gruaId: string) => {
    setGruaSelecionadaChecklist(gruaId)
    setChecklistSelecionado(null)
    setIsNovoChecklistOpen(true)
  }

  const handleEditarChecklist = (checklist: any, gruaId: string) => {
    setGruaSelecionadaChecklist(gruaId)
    setChecklistSelecionado(checklist)
    setIsEditarChecklistOpen(true)
  }

  const handleVisualizarChecklist = (checklist: any) => {
    setChecklistSelecionado(checklist)
    setIsVisualizarChecklistOpen(true)
  }

  const handleExcluirChecklist = async (checklist: any) => {
    if (!checklist.id) return

    if (confirm(`Tem certeza que deseja excluir este checklist?`)) {
      try {
        await livroGruaApi.excluirEntrada(checklist.id)
        toast({
          title: "Checklist excluído",
          description: "O checklist foi excluído com sucesso.",
        })
        // Recarregar dados
        carregarObra()
      } catch (err) {
        console.error('Erro ao excluir checklist:', err)
        toast({
          title: "Erro",
          description: "Não foi possível excluir o checklist.",
          variant: "destructive"
        })
      }
    }
  }

  const handleSucessoChecklist = () => {
    setIsNovoChecklistOpen(false)
    setIsEditarChecklistOpen(false)
    setIsVisualizarChecklistOpen(false)
    setChecklistSelecionado(null)
    setGruaSelecionadaChecklist("")
    toast({
      title: "Sucesso",
      description: "Checklist salvo com sucesso.",
    })
    // Recarregar dados
    carregarObra()
  }

  // Handlers Manutenção
  const handleNovaManutencao = (gruaId: string) => {
    setGruaSelecionadaManutencao(gruaId)
    setManutencaoSelecionada(null)
    setIsNovaManutencaoOpen(true)
  }

  const handleEditarManutencao = (manutencao: any, gruaId: string) => {
    setGruaSelecionadaManutencao(gruaId)
    setManutencaoSelecionada(manutencao)
    setIsEditarManutencaoOpen(true)
  }

  const handleVisualizarManutencao = (manutencao: any) => {
    setManutencaoSelecionada(manutencao)
    setIsVisualizarManutencaoOpen(true)
  }

  const handleExcluirManutencao = async (manutencao: any) => {
    if (!manutencao.id) return

    if (confirm(`Tem certeza que deseja excluir esta manutenção?`)) {
      try {
        await livroGruaApi.excluirEntrada(manutencao.id)
        toast({
          title: "Manutenção excluída",
          description: "A manutenção foi excluída com sucesso.",
        })
        // Recarregar dados
        carregarObra()
      } catch (err) {
        console.error('Erro ao excluir manutenção:', err)
        toast({
          title: "Erro",
          description: "Não foi possível excluir a manutenção.",
          variant: "destructive"
        })
      }
    }
  }

  const handleSucessoManutencao = () => {
    setIsNovaManutencaoOpen(false)
    setIsEditarManutencaoOpen(false)
    setIsVisualizarManutencaoOpen(false)
    setManutencaoSelecionada(null)
    setGruaSelecionadaManutencao("")
    toast({
      title: "Sucesso",
      description: "Manutenção salva com sucesso.",
    })
    // Recarregar dados
    carregarObra()
  }

  // Função para salvar documentos obrigatórios
  const handleSalvarDocumentos = async () => {
    if (!obra) return

    setSalvandoDocumentos(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      
      let cnoArquivoUrl = obra.cno_arquivo || ''
      let artArquivoUrl = obra.art_arquivo || ''
      let apoliceArquivoUrl = obra.apolice_arquivo || ''

      // Fazer upload dos arquivos se houver novos
      if (cnoArquivo) {
        try {
          const formDataCno = new FormData()
          formDataCno.append('arquivo', cnoArquivo)
          formDataCno.append('categoria', 'cno')
          
          const uploadCnoResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obra.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataCno
          })
          
          if (uploadCnoResponse.ok) {
            const uploadCnoResult = await uploadCnoResponse.json()
            cnoArquivoUrl = uploadCnoResult.data?.caminho || uploadCnoResult.data?.arquivo || ''
          }
        } catch (error) {
          console.error('Erro ao fazer upload do CNO:', error)
        }
      }

      if (artArquivo) {
        try {
          const formDataArt = new FormData()
          formDataArt.append('arquivo', artArquivo)
          formDataArt.append('categoria', 'art')
          
          const uploadArtResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obra.id}`, {
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
        } catch (error) {
          console.error('Erro ao fazer upload da ART:', error)
        }
      }

      if (apoliceArquivo) {
        try {
          const formDataApolice = new FormData()
          formDataApolice.append('arquivo', apoliceArquivo)
          formDataApolice.append('categoria', 'apolice')
          
          const uploadApoliceResponse = await fetch(`${apiUrl}/api/arquivos/upload/${obra.id}`, {
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
        } catch (error) {
          console.error('Erro ao fazer upload da Apólice:', error)
        }
      }

      // Atualizar obra com os novos dados
      const updateData: any = {}
      
      if (cnoNumero || cnoArquivoUrl) {
        updateData.cno = cnoNumero || obra.cno || ''
        if (cnoArquivoUrl) updateData.cno_arquivo = cnoArquivoUrl
      }
      
      if (artNumero || artArquivoUrl) {
        updateData.art_numero = artNumero || obra.art_numero || ''
        if (artArquivoUrl) updateData.art_arquivo = artArquivoUrl
      }
      
      if (apoliceNumero || apoliceArquivoUrl) {
        updateData.apolice_numero = apoliceNumero || obra.apolice_numero || ''
        if (apoliceArquivoUrl) updateData.apolice_arquivo = apoliceArquivoUrl
      }

      if (Object.keys(updateData).length > 0) {
        const response = await obrasApi.atualizarObra(obra.id, updateData)
        
        if (response.success) {
          toast({
            title: "Sucesso",
            description: "Documentos atualizados com sucesso.",
          })
          
          // Resetar estados de edição
          setIsEditingCNO(false)
          setIsEditingART(false)
          setIsEditingApolice(false)
          setCnoArquivo(null)
          setArtArquivo(null)
          setApoliceArquivo(null)
          setCnoNumero('')
          setArtNumero('')
          setApoliceNumero('')
          
          // Recarregar obra
          await carregarObra()
        } else {
          throw new Error('Erro ao atualizar documentos')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar documentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar os documentos",
        variant: "destructive"
      })
    } finally {
      setSalvandoDocumentos(false)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    if (!obraId) return
    
    // Evitar múltiplas chamadas simultâneas
    let cancelled = false
    
    const loadData = async () => {
      documentosAdicionaisCarregadosRef.current = false // Resetar ref quando obraId mudar
      
      try {
        await carregarObra()
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao carregar obra:', error)
        }
      }
    }
    
    loadData()
    
    return () => {
      cancelled = true
    }
  }, [obraId]) // Remover isOnline das dependências para evitar recarregamentos desnecessários

  // Inicializar valores dos campos quando a obra for carregada
  useEffect(() => {
    if (obra && !isEditingCNO && !isEditingART && !isEditingApolice) {
      setCnoNumero(obra.cno || '')
      setArtNumero(obra.art_numero || '')
      setApoliceNumero(obra.apolice_numero || '')
    }
  }, [obra])

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando obra..." />
      </div>
    )
  }

  // Erro
  if (error && !obra) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar obra</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/pwa/obras')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Obras
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!obra) {
    return null
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Planejamento': { className: 'bg-gray-100 text-gray-800', text: 'Planejamento' },
      'Em Andamento': { className: 'bg-blue-100 text-blue-800', text: 'Em Andamento' },
      'Pausada': { className: 'bg-yellow-100 text-yellow-800', text: 'Pausada' },
      'Concluída': { className: 'bg-green-100 text-green-800', text: 'Concluída' },
      'Cancelada': { className: 'bg-red-100 text-red-800', text: 'Cancelada' }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.Planejamento
  }

  const formatarData = (data: string | undefined) => {
    if (!data) return 'Não informado'
    try {
      const dataObj = new Date(data)
      if (isNaN(dataObj.getTime())) return 'Não informado'
      return dataObj.toLocaleDateString('pt-BR')
    } catch {
      return 'Não informado'
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/pwa/obras')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {obra.nome}
          </h1>
          <p className="text-sm text-gray-600">
            {obra.endereco}, {obra.cidade} - {obra.estado}
          </p>
        </div>
      </div>

      {/* Informações da Obra */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Informações da Obra
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsInformacoesObraExpanded(!isInformacoesObraExpanded)}
              className="h-8 w-8 p-0"
            >
              {isInformacoesObraExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isInformacoesObraExpanded && (
          <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-600 mb-1">Status</p>
              <Badge className={getStatusBadge(obra.status).className}>
                {getStatusBadge(obra.status).text}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Tipo</p>
              <p className="font-medium">{obra.tipo}</p>
            </div>
            {obra.clientes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Cliente</p>
                <p className="font-medium">{obra.clientes.nome}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-600 mb-1">Data de Início</p>
              <p className="font-medium">{formatarData(obra.data_inicio)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Data de Fim</p>
              <p className="font-medium">{formatarData(obra.data_fim)}</p>
            </div>
            {obra.descricao && (
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Descrição</p>
                <p className="font-medium text-xs">{obra.descricao}</p>
              </div>
            )}
          </div>
        </CardContent>
        )}
      </Card>

      {/* Status de conexão */}
      {!isOnline && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800">
            Você está offline. Os dados serão sincronizados quando a conexão for restabelecida.
          </AlertDescription>
        </Alert>
      )}

      {/* Documentos Obrigatórios da Obra */}
      {obra && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentos Obrigatórios da Obra
              </CardTitle>
              {isClient() && (
                <div className="flex gap-2">
                  {(isEditingCNO || isEditingART || isEditingApolice) ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingCNO(false)
                          setIsEditingART(false)
                          setIsEditingApolice(false)
                          setCnoArquivo(null)
                          setArtArquivo(null)
                          setApoliceArquivo(null)
                          setCnoNumero(obra.cno || '')
                          setArtNumero(obra.art_numero || '')
                          setApoliceNumero(obra.apolice_numero || '')
                        }}
                        disabled={salvandoDocumentos}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSalvarDocumentos}
                        disabled={salvandoDocumentos || !isOnline}
                      >
                        {salvandoDocumentos ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingCNO(true)
                        setIsEditingART(true)
                        setIsEditingApolice(true)
                        setCnoNumero(obra.cno || '')
                        setArtNumero(obra.art_numero || '')
                        setApoliceNumero(obra.apolice_numero || '')
                      }}
                      disabled={!isOnline}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar Documentos
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CNO */}
            <div className="space-y-1 border-b pb-3">
              <p className="text-xs text-gray-600 mb-1">CNO (Cadastro Nacional de Obras)</p>
              {isClient() && isEditingCNO ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Número do CNO</Label>
                    <Input
                      value={cnoNumero}
                      onChange={(e) => setCnoNumero(e.target.value)}
                      placeholder="Digite o número do CNO"
                      className="mt-1"
                    />
                  </div>
                  <DocumentoUpload
                    label="Upload do Documento CNO (PDF)"
                    accept="application/pdf"
                    maxSize={10 * 1024 * 1024}
                    onUpload={(file) => setCnoArquivo(file)}
                    onRemove={() => setCnoArquivo(null)}
                    currentFile={cnoArquivo}
                    fileUrl={obra.cno_arquivo || null}
                    disabled={!isOnline}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{obra.cno || <span className="text-gray-400 italic">Não informado</span>}</span>
                  {obra.cno_arquivo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                          
                          const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(obra?.cno_arquivo || '')}`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          })
                          
                          if (urlResponse.ok) {
                            const urlData = await urlResponse.json()
                            if (urlData.success && urlData.data?.url) {
                              window.open(urlData.data.url, '_blank')
                            } else {
                              throw new Error('URL não retornada')
                            }
                          } else {
                            throw new Error('Erro ao gerar URL')
                          }
                        } catch (error) {
                          console.error('Erro ao baixar CNO:', error)
                          toast({
                            title: "Erro",
                            description: "Não foi possível baixar o arquivo do CNO",
                            variant: "destructive"
                          })
                        }
                      }}
                      disabled={!isOnline}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Baixar CNO
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* ART */}
            <div className="space-y-1 border-b pb-3">
              <p className="text-xs text-gray-600 mb-1">ART (Anotação de Responsabilidade Técnica)</p>
              {isClient() && isEditingART ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Número da ART</Label>
                    <Input
                      value={artNumero}
                      onChange={(e) => setArtNumero(e.target.value)}
                      placeholder="Digite o número da ART"
                      className="mt-1"
                    />
                  </div>
                  <DocumentoUpload
                    label="Upload do Documento ART (PDF)"
                    accept="application/pdf"
                    maxSize={10 * 1024 * 1024}
                    onUpload={(file) => setArtArquivo(file)}
                    onRemove={() => setArtArquivo(null)}
                    currentFile={artArquivo}
                    fileUrl={obra.art_arquivo || null}
                    disabled={!isOnline}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{obra.art_numero || <span className="text-gray-400 italic">Não informado</span>}</span>
                  {obra.art_arquivo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                          
                          const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(obra?.art_arquivo || '')}`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          })
                          
                          if (urlResponse.ok) {
                            const urlData = await urlResponse.json()
                            if (urlData.success && urlData.data?.url) {
                              window.open(urlData.data.url, '_blank')
                            } else {
                              throw new Error('URL não retornada')
                            }
                          } else {
                            throw new Error('Erro ao gerar URL')
                          }
                        } catch (error) {
                          console.error('Erro ao baixar ART:', error)
                          toast({
                            title: "Erro",
                            description: "Não foi possível baixar o arquivo da ART",
                            variant: "destructive"
                          })
                        }
                      }}
                      disabled={!isOnline}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Baixar ART
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Apólice */}
            <div className="space-y-1">
              <p className="text-xs text-gray-600 mb-1">Apólice de Seguro</p>
              {isClient() && isEditingApolice ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Número da Apólice</Label>
                    <Input
                      value={apoliceNumero}
                      onChange={(e) => setApoliceNumero(e.target.value)}
                      placeholder="Digite o número da Apólice"
                      className="mt-1"
                    />
                  </div>
                  <DocumentoUpload
                    label="Upload da Apólice de Seguro (PDF)"
                    accept="application/pdf"
                    maxSize={10 * 1024 * 1024}
                    onUpload={(file) => setApoliceArquivo(file)}
                    onRemove={() => setApoliceArquivo(null)}
                    currentFile={apoliceArquivo}
                    fileUrl={obra.apolice_arquivo || null}
                    disabled={!isOnline}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{obra.apolice_numero || <span className="text-gray-400 italic">Não informado</span>}</span>
                  {obra.apolice_arquivo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                          const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                          
                          const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(obra?.apolice_arquivo || '')}`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          })
                          
                          if (urlResponse.ok) {
                            const urlData = await urlResponse.json()
                            if (urlData.success && urlData.data?.url) {
                              window.open(urlData.data.url, '_blank')
                            } else {
                              throw new Error('URL não retornada')
                            }
                          } else {
                            throw new Error('Erro ao gerar URL')
                          }
                        } catch (error) {
                          console.error('Erro ao baixar Apólice:', error)
                          toast({
                            title: "Erro",
                            description: "Não foi possível baixar o arquivo da Apólice",
                            variant: "destructive"
                          })
                        }
                      }}
                      disabled={!isOnline}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Baixar Apólice
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos Adicionais do Equipamento */}
      {obra && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos Adicionais do Equipamento
            </CardTitle>
            <CardDescription className="text-xs">
              Documentos técnicos e de entrega do equipamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDocumentosAdicionais ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">Carregando documentos...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Manual Técnico */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Manual Técnico do Equipamento</label>
                  {documentosAdicionaisEquipamento.manual_tecnico ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{documentosAdicionaisEquipamento.manual_tecnico.nome_original}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                            const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                            
                            const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.manual_tecnico.caminho)}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            })
                            
                            if (urlResponse.ok) {
                              const urlData = await urlResponse.json()
                              if (urlData.success && urlData.data?.url) {
                                window.open(urlData.data.url, '_blank')
                              }
                            }
                          } catch (error) {
                            console.error('Erro ao baixar Manual Técnico:', error)
                            toast({
                              title: "Erro",
                              description: "Não foi possível baixar o arquivo",
                              variant: "destructive"
                            })
                          }
                        }}
                        disabled={!isOnline}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar Manual Técnico
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Não informado</span>
                  )}
                </div>

                {/* Termo de Entrega Técnica */}
                <div className="space-y-3 border-t pt-3">
                  <label className="text-sm font-medium text-gray-700">Termo de Entrega Técnica</label>
                  {documentosAdicionaisEquipamento.termo_entrega_tecnica ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{documentosAdicionaisEquipamento.termo_entrega_tecnica.nome_original}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                            const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                            
                            const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.termo_entrega_tecnica.caminho)}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            })
                            
                            if (urlResponse.ok) {
                              const urlData = await urlResponse.json()
                              if (urlData.success && urlData.data?.url) {
                                window.open(urlData.data.url, '_blank')
                              }
                            }
                          } catch (error) {
                            console.error('Erro ao baixar Termo de Entrega:', error)
                            toast({
                              title: "Erro",
                              description: "Não foi possível baixar o arquivo",
                              variant: "destructive"
                            })
                          }
                        }}
                        disabled={!isOnline}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar Termo de Entrega
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Não informado</span>
                  )}
                </div>

                {/* Plano de Carga */}
                <div className="space-y-3 border-t pt-3">
                  <label className="text-sm font-medium text-gray-700">Plano de Carga</label>
                  {documentosAdicionaisEquipamento.plano_carga ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{documentosAdicionaisEquipamento.plano_carga.nome_original}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                            const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                            
                            const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.plano_carga.caminho)}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            })
                            
                            if (urlResponse.ok) {
                              const urlData = await urlResponse.json()
                              if (urlData.success && urlData.data?.url) {
                                window.open(urlData.data.url, '_blank')
                              }
                            }
                          } catch (error) {
                            console.error('Erro ao baixar Plano de Carga:', error)
                            toast({
                              title: "Erro",
                              description: "Não foi possível baixar o arquivo",
                              variant: "destructive"
                            })
                          }
                        }}
                        disabled={!isOnline}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar Plano de Carga
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Não informado</span>
                  )}
                </div>

                {/* Documento de Aterramento */}
                <div className="space-y-3 border-t pt-3">
                  <label className="text-sm font-medium text-gray-700">Documento de Aterramento</label>
                  {documentosAdicionaisEquipamento.aterramento ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{documentosAdicionaisEquipamento.aterramento.nome_original}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                            const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                            
                            const urlResponse = await fetch(`${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documentosAdicionaisEquipamento.aterramento.caminho)}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            })
                            
                            if (urlResponse.ok) {
                              const urlData = await urlResponse.json()
                              if (urlData.success && urlData.data?.url) {
                                window.open(urlData.data.url, '_blank')
                              }
                            }
                          } catch (error) {
                            console.error('Erro ao baixar Documento de Aterramento:', error)
                            toast({
                              title: "Erro",
                              description: "Não foi possível baixar o arquivo",
                              variant: "destructive"
                            })
                          }
                        }}
                        disabled={!isOnline}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar Aterramento
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Não informado</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documentos da Obra - Documentos Adicionais */}
      {obra && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Documentos Adicionais da Obra
            </CardTitle>
            <CardDescription className="text-xs">
              Documentos adicionais relacionados à obra (contratos, anexos, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhum documento adicional encontrado</p>
                <p className="text-xs text-gray-400 mt-1">Os documentos adicionais aparecerão aqui quando forem adicionados à obra</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.map((documento) => (
                  <div
                    key={documento.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">
                          {documento.titulo || `Documento ${documento.id}`}
                        </h4>
                        {documento.descricao && (
                          <p className="text-xs text-gray-600 mb-2">{documento.descricao}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(documento.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <Badge
                            variant={
                              documento.status === 'assinado'
                                ? 'default'
                                : documento.status === 'aguardando_assinatura'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {documento.status === 'assinado'
                              ? 'Assinado'
                              : documento.status === 'aguardando_assinatura'
                              ? 'Aguardando'
                              : documento.status === 'em_assinatura'
                              ? 'Em Assinatura'
                              : documento.status === 'rejeitado'
                              ? 'Rejeitado'
                              : 'Rascunho'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {documento.caminho_arquivo && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                  
                                  const urlResponse = await fetch(
                                    `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documento.caminho_arquivo)}`,
                                    {
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      }
                                    }
                                  )
                                  
                                  if (urlResponse.ok) {
                                    const urlData = await urlResponse.json()
                                    if (urlData.success && urlData.data?.url) {
                                      window.open(urlData.data.url, '_blank')
                                    } else {
                                      throw new Error('URL não retornada')
                                    }
                                  } else {
                                    throw new Error('Erro ao gerar URL')
                                  }
                                } catch (error) {
                                  console.error('Erro ao visualizar documento:', error)
                                  toast({
                                    title: "Erro",
                                    description: "Não foi possível visualizar o documento",
                                    variant: "destructive"
                                  })
                                }
                              }}
                              disabled={!isOnline}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Visualizar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                                  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
                                  
                                  const urlResponse = await fetch(
                                    `${apiUrl}/api/arquivos/url-assinada?caminho=${encodeURIComponent(documento.caminho_arquivo)}`,
                                    {
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      }
                                    }
                                  )
                                  
                                  if (urlResponse.ok) {
                                    const urlData = await urlResponse.json()
                                    if (urlData.success && urlData.data?.url) {
                                      const link = document.createElement('a')
                                      link.href = urlData.data.url
                                      link.download = documento.arquivo_original || `documento_${documento.id}.pdf`
                                      document.body.appendChild(link)
                                      link.click()
                                      document.body.removeChild(link)
                                    } else {
                                      throw new Error('URL não retornada')
                                    }
                                  } else {
                                    throw new Error('Erro ao gerar URL')
                                  }
                                } catch (error) {
                                  console.error('Erro ao baixar documento:', error)
                                  toast({
                                    title: "Erro",
                                    description: "Não foi possível baixar o documento",
                                    variant: "destructive"
                                  })
                                }
                              }}
                              disabled={!isOnline}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Baixar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs para Livro Gruas, Checklist, Manutenções, Funcionários e Documentos */}
      <Tabs defaultValue="livro-grua" className="w-full">
        <TabsList className={`grid w-full ${isSupervisor() ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="livro-grua" className="flex items-center gap-1.5 text-xs px-2 sm:px-3">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Livro Grua</span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-1.5 text-xs px-2 sm:px-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Checklist</span>
          </TabsTrigger>
          <TabsTrigger value="manutencoes" className="flex items-center gap-1.5 text-xs px-2 sm:px-3">
            <Wrench className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Manutenções</span>
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="flex items-center gap-1.5 text-xs px-2 sm:px-3">
            <Users className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Funcionários</span>
          </TabsTrigger>
          {isSupervisor() && (
            <TabsTrigger value="documentos" className="flex items-center gap-1.5 text-xs px-2 sm:px-3">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Aba: Livro da Grua (completo) */}
        <TabsContent value="livro-grua" className="space-y-4">
          {obraId ? (
            <LivroGruaObra 
              obraId={obraId.toString()} 
              cachedData={livroGruaObraData}
              onDataLoaded={setLivroGruaObraData}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Obra não encontrada</h3>
                <p className="text-gray-600">Não foi possível carregar o livro da grua.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Gruas (lista simples) */}
        <TabsContent value="gruas" className="space-y-4">
          {gruas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua encontrada</h3>
                <p className="text-gray-600">Esta obra não possui gruas vinculadas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {gruas.map((grua) => {
                const entradas = livrosGruas[grua.id] || []
                const isLoading = loadingLivros[grua.id] || false
                const gruaName = grua.name || `Grua ${grua.id}`

                return (
                  <Card key={grua.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{gruaName}</CardTitle>
                          <CardDescription>
                            {grua.modelo || 'Modelo não informado'} • {grua.fabricante || 'Fabricante não informado'}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/pwa/gruas/${grua.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            onClick={() => exportarLivroGruaPDF(grua.id, gruaName)}
                            variant="outline"
                            size="sm"
                            disabled={isLoading || entradas.length === 0}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar PDF
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Informações da grua */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {grua.data_inicio_locacao && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Início:</span>
                              <span>{formatarData(grua.data_inicio_locacao)}</span>
                            </div>
                          )}
                          {grua.data_fim_locacao && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Fim:</span>
                              <span>{formatarData(grua.data_fim_locacao)}</span>
                            </div>
                          )}
                          {grua.valor_locacao_mensal && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <span className="font-medium">Valor Mensal:</span>
                              <span>R$ {grua.valor_locacao_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {grua.status && (
                            <div className="flex items-center gap-2">
                              <Badge className={
                                grua.status === 'Ativa' ? 'bg-green-100 text-green-800' :
                                grua.status === 'Concluída' ? 'bg-gray-100 text-gray-800' :
                                grua.status === 'Suspensa' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {grua.status}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Livro da grua */}
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Livro da Grua
                            {entradas.length > 0 && (
                              <Badge variant="outline" className="ml-2">
                                {entradas.length} {entradas.length === 1 ? 'entrada' : 'entradas'}
                              </Badge>
                            )}
                          </h4>
                          
                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600">Carregando livro da grua...</p>
                              </div>
                            </div>
                          ) : entradas.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500">
                              Nenhuma entrada encontrada no livro desta grua.
                            </div>
                          ) : (
                            <LivroGruaList
                              gruaId={grua.id}
                              modoCompacto={true}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Aba: Checklist */}
        <TabsContent value="checklist" className="space-y-4">
          {gruas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua encontrada</h3>
                <p className="text-gray-600">Adicione gruas à obra para visualizar checklists.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {gruas.map((grua) => (
                <Card key={grua.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{grua.name || `Grua ${grua.id}`}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LivroGruaChecklistList
                      gruaId={grua.id}
                      onNovoChecklist={() => handleNovoChecklist(grua.id)}
                      onEditarChecklist={(checklist) => handleEditarChecklist(checklist, grua.id)}
                      onVisualizarChecklist={handleVisualizarChecklist}
                      onExcluirChecklist={handleExcluirChecklist}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba: Manutenções */}
        <TabsContent value="manutencoes" className="space-y-4">
          {gruas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma grua encontrada</h3>
                <p className="text-gray-600">Adicione gruas à obra para visualizar manutenções.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {gruas.map((grua) => (
                <Card key={grua.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{grua.name || `Grua ${grua.id}`}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LivroGruaManutencaoList
                      gruaId={grua.id}
                      onNovaManutencao={() => handleNovaManutencao(grua.id)}
                      onEditarManutencao={(manutencao) => handleEditarManutencao(manutencao, grua.id)}
                      onVisualizarManutencao={handleVisualizarManutencao}
                      onExcluirManutencao={handleExcluirManutencao}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba: Funcionários */}
        <TabsContent value="funcionarios" className="space-y-4">
          {funcionarios.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário encontrado</h3>
                <p className="text-gray-600">Esta obra não possui funcionários vinculados.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border">
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="h-10 px-3 text-sm font-semibold">Nome</TableHead>
                      <TableHead className="h-10 px-3 text-sm font-semibold">Cargo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcionarios.map((funcionario) => {
                      const nome = funcionario.name || funcionario.funcionario?.nome || funcionario.funcionarios?.nome || 'Funcionário'
                      const cargo = funcionario.role || funcionario.funcionario?.cargo || funcionario.funcionarios?.cargo || 'Cargo não informado'
                      const id = funcionario.id || funcionario.funcionarioId || funcionario.funcionario_id

                      return (
                        <TableRow key={id} className="border-b hover:bg-gray-50">
                          <TableCell 
                            className="px-3 py-2.5 font-medium text-sm cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setFuncionarioModal(funcionario)
                              setIsModalOpen(true)
                            }}
                          >
                            <span className="truncate block max-w-[200px]">{nome}</span>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-sm text-gray-600">
                            <span className="truncate block max-w-[150px]">{cargo}</span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Documentos (apenas supervisor) */}
        {isSupervisor() && (
          <TabsContent value="documentos" className="space-y-4">
            {documentos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
                  <p className="text-gray-600">Esta obra não possui documentos.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {documentos.map((documento) => (
                  <Card key={documento.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{documento.titulo}</CardTitle>
                          {documento.descricao && (
                            <CardDescription className="mt-1">{documento.descricao}</CardDescription>
                          )}
                        </div>
                        <Badge className={
                          documento.status === 'assinado' ? 'bg-green-100 text-green-800' :
                          documento.status === 'aguardando_assinatura' ? 'bg-yellow-100 text-yellow-800' :
                          documento.status === 'em_assinatura' ? 'bg-blue-100 text-blue-800' :
                          documento.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {documento.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Criado em:</span>
                          <span>{formatarData(documento.created_at)}</span>
                        </div>
                        {documento.progresso_percentual !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Progresso de assinaturas</span>
                              <span className="font-medium">{documento.progresso_percentual}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${documento.progresso_percentual}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {documento.assinaturas && documento.assinaturas.length > 0 && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-600 mb-1">Assinaturas:</p>
                            <div className="space-y-1">
                              {documento.assinaturas.map((assinatura, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  {assinatura.status === 'assinado' ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-gray-400" />
                                  )}
                                  <span className={assinatura.status === 'assinado' ? 'text-green-700' : 'text-gray-600'}>
                                    {assinatura.user_nome || assinatura.user_email || 'Usuário'} - {assinatura.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Modal Novo Checklist */}
      <Dialog open={isNovoChecklistOpen} onOpenChange={setIsNovoChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Checklist Diário</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaChecklist && (
            <LivroGruaChecklistDiario
              gruaId={gruaSelecionadaChecklist}
              onSave={handleSucessoChecklist}
              onCancel={() => setIsNovoChecklistOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Editar Checklist */}
      <Dialog open={isEditarChecklistOpen} onOpenChange={setIsEditarChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Checklist Diário</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaChecklist && checklistSelecionado && (
            <LivroGruaChecklistDiario
              gruaId={gruaSelecionadaChecklist}
              checklist={checklistSelecionado}
              onSave={handleSucessoChecklist}
              onCancel={() => setIsEditarChecklistOpen(false)}
              modoEdicao={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Checklist */}
      <Dialog open={isVisualizarChecklistOpen} onOpenChange={setIsVisualizarChecklistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Checklist Diário</DialogTitle>
          </DialogHeader>
          {checklistSelecionado && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data</label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(checklistSelecionado.data || checklistSelecionado.data_entrada).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Funcionário</label>
                  <p className="text-sm mt-1">
                    {checklistSelecionado.funcionario_nome || 'Não informado'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Itens Verificados</label>
                <div className="mt-2 space-y-2">
                  {['cabos', 'polias', 'estrutura', 'movimentos', 'freios', 'limitadores', 'indicadores', 'aterramento'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${checklistSelecionado[item] ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-sm capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {checklistSelecionado.observacoes && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Observações</label>
                  <p className="text-sm mt-1">{checklistSelecionado.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Nova Manutenção */}
      <Dialog open={isNovaManutencaoOpen} onOpenChange={setIsNovaManutencaoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Manutenção</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaManutencao && (
            <LivroGruaManutencao
              gruaId={gruaSelecionadaManutencao}
              onSave={handleSucessoManutencao}
              onCancel={() => setIsNovaManutencaoOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Editar Manutenção */}
      <Dialog open={isEditarManutencaoOpen} onOpenChange={setIsEditarManutencaoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Manutenção</DialogTitle>
          </DialogHeader>
          {gruaSelecionadaManutencao && manutencaoSelecionada && (
            <LivroGruaManutencao
              gruaId={gruaSelecionadaManutencao}
              manutencao={manutencaoSelecionada}
              onSave={handleSucessoManutencao}
              onCancel={() => setIsEditarManutencaoOpen(false)}
              modoEdicao={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Manutenção */}
      <Dialog open={isVisualizarManutencaoOpen} onOpenChange={setIsVisualizarManutencaoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Manutenção</DialogTitle>
          </DialogHeader>
          {manutencaoSelecionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Data</label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(manutencaoSelecionada.data || manutencaoSelecionada.data_entrada).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Realizado Por</label>
                  <p className="text-sm mt-1">
                    {manutencaoSelecionada.realizado_por_nome || manutencaoSelecionada.funcionario_nome || 'Não informado'}
                  </p>
                </div>
                {manutencaoSelecionada.cargo && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Cargo</label>
                    <p className="text-sm mt-1">{manutencaoSelecionada.cargo}</p>
                  </div>
                )}
              </div>
              {manutencaoSelecionada.descricao && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Descrição</label>
                  <p className="text-sm mt-1">{manutencaoSelecionada.descricao}</p>
                </div>
              )}
              {manutencaoSelecionada.observacoes && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Observações</label>
                  <p className="text-sm mt-1">{manutencaoSelecionada.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Funcionário */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Funcionário</DialogTitle>
          </DialogHeader>
          {funcionarioModal && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Nome</label>
                <p className="text-sm font-medium mt-1">
                  {funcionarioModal.name || funcionarioModal.funcionario?.nome || funcionarioModal.funcionarios?.nome || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Cargo</label>
                <p className="text-sm mt-1">
                  {funcionarioModal.role || funcionarioModal.funcionario?.cargo || funcionarioModal.funcionarios?.cargo || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <p className="text-sm mt-1">
                  {funcionarioModal.email || funcionarioModal.funcionario?.email || funcionarioModal.funcionarios?.email || 'Não informado'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Telefone</label>
                <p className="text-sm mt-1">
                  {funcionarioModal.telefone || funcionarioModal.funcionario?.telefone || funcionarioModal.funcionarios?.telefone || 'Não informado'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

