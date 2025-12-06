"use client"

import { useState, useEffect } from "react"
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
  Eye
} from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { obrasApi, Obra } from "@/lib/api-obras"
import { obrasDocumentosApi, DocumentoObra } from "@/lib/api-obras-documentos"
import { gruaObraApi } from "@/lib/api-grua-obra"
import { usePermissions } from "@/hooks/use-permissions"
import { LivroGruaChecklistList } from "@/components/livro-grua-checklist-list"
import { LivroGruaManutencaoList } from "@/components/livro-grua-manutencao-list"
import { LivroGruaObra } from "@/components/livro-grua-obra"
import LivroGruaList from "@/components/livro-grua-list"
import { livroGruaApi } from "@/lib/api-livro-grua"

export default function PWAObraDetalhesPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const obraId = Number(params.id)
  const { isSupervisor } = usePermissions()

  // Estados
  const [obra, setObra] = useState<Obra | null>(null)
  const [gruas, setGruas] = useState<any[]>([])
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([])
  const [livrosGruas, setLivrosGruas] = useState<Record<string, any[]>>({})
  const [loadingLivros, setLoadingLivros] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [funcionarioModal, setFuncionarioModal] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

      // Carregar documentos (apenas para supervisor)
      if (isSupervisor()) {
        try {
          const documentosResponse = await obrasDocumentosApi.listarPorObra(obraId)
          if (documentosResponse.success) {
            const docs = Array.isArray(documentosResponse.data) 
              ? documentosResponse.data 
              : [documentosResponse.data]
            setDocumentos(docs)
          }
        } catch (err) {
          console.error('Erro ao carregar documentos:', err)
        }
      }

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

  // Carregar dados na inicialização
  useEffect(() => {
    if (obraId) {
      carregarObra()
    }
  }, [obraId, isOnline])

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
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
        </div>
      </div>

      {/* Informações da Obra */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Informações da Obra
          </CardTitle>
        </CardHeader>
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
            <LivroGruaObra obraId={obraId.toString()} />
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
                      onNovoChecklist={() => {}}
                      onEditarChecklist={() => {}}
                      onVisualizarChecklist={() => {}}
                      onExcluirChecklist={() => {}}
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
                      onNovaManutencao={() => {}}
                      onEditarManutencao={() => {}}
                      onVisualizarManutencao={() => {}}
                      onExcluirManutencao={() => {}}
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

