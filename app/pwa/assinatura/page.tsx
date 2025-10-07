"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  FileSignature, 
  CheckCircle,
  Clock,
  User,
  Calendar,
  Download,
  Upload,
  Eye,
  Wifi,
  WifiOff,
  Search,
  Filter
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Documento {
  id: string
  titulo: string
  tipo: string
  dataCriacao: string
  status: 'pendente' | 'assinado' | 'rejeitado'
  descricao: string
  arquivo: string
}

export default function PWAAssinaturaPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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

  // Carregar documentos
  useEffect(() => {
    // Simular carregamento de documentos
    const docs: Documento[] = [
      {
        id: "1",
        titulo: "Contrato de Prestação de Serviços",
        tipo: "Contrato",
        dataCriacao: "2024-01-15",
        status: "pendente",
        descricao: "Contrato para prestação de serviços de manutenção",
        arquivo: "contrato-prestacao-servicos.pdf"
      },
      {
        id: "2",
        titulo: "Termo de Responsabilidade",
        tipo: "Termo",
        dataCriacao: "2024-01-14",
        status: "assinado",
        descricao: "Termo de responsabilidade para uso de equipamentos",
        arquivo: "termo-responsabilidade.pdf"
      },
      {
        id: "3",
        titulo: "Relatório Mensal",
        tipo: "Relatório",
        dataCriacao: "2024-01-13",
        status: "pendente",
        descricao: "Relatório de atividades do mês de janeiro",
        arquivo: "relatorio-mensal-janeiro.pdf"
      }
    ]
    setDocumentos(docs)
  }, [])

  const handleAssinar = async (documentoId: string) => {
    setIsLoading(true)
    
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setDocumentos(prev => prev.map(doc => 
        doc.id === documentoId 
          ? { ...doc, status: 'assinado' as const }
          : doc
      ))

      toast({
        title: "Documento assinado!",
        description: "Assinatura digital aplicada com sucesso",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Erro ao assinar documento",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejeitar = async (documentoId: string) => {
    setIsLoading(true)
    
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setDocumentos(prev => prev.map(doc => 
        doc.id === documentoId 
          ? { ...doc, status: 'rejeitado' as const }
          : doc
      ))

      toast({
        title: "Documento rejeitado",
        description: "O documento foi marcado como rejeitado",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Erro ao rejeitar documento",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'assinado':
        return <Badge className="bg-green-100 text-green-800">Assinado</Badge>
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const filteredDocumentos = documentos.filter(doc => {
    const matchesSearch = doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "todos" || doc.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: documentos.length,
    pendentes: documentos.filter(d => d.status === 'pendente').length,
    assinados: documentos.filter(d => d.status === 'assinado').length,
    rejeitados: documentos.filter(d => d.status === 'rejeitado').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinatura Digital</h1>
          <p className="text-gray-600">Gerencie documentos para assinatura</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <span className="text-sm text-gray-600">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSignature className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-xl font-bold">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assinados</p>
                <p className="text-xl font-bold">{stats.assinados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileSignature className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejeitados</p>
                <p className="text-xl font-bold">{stats.rejeitados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar documentos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o nome do documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="filter">Filtrar por status</Label>
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <select
                  id="filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="assinado">Assinados</option>
                  <option value="rejeitado">Rejeitados</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <div className="space-y-4">
        {filteredDocumentos.map((documento) => (
          <Card key={documento.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileSignature className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{documento.titulo}</h3>
                      <p className="text-sm text-gray-500">{documento.tipo}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{documento.descricao}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(documento.dataCriacao).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>João Silva</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(documento.status)}
                  
                  {documento.status === 'pendente' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAssinar(documento.id)}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Assinar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejeitar(documento.id)}
                        disabled={isLoading}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredDocumentos.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "todos" 
                  ? "Tente ajustar os filtros de busca"
                  : "Não há documentos disponíveis no momento"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status de conexão */}
      {!isOnline && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-medium">Modo Offline</p>
                <p className="text-sm">As assinaturas serão sincronizadas quando a conexão for restabelecida.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
