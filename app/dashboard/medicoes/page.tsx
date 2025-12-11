"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Calculator, 
  Search, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter,
  Building2,
  Crane,
  FileText,
  Plus,
  Receipt,
  FileCheck,
  RefreshCw,
  Upload
} from "lucide-react"
import { ExportButton } from "@/components/export-button"
import { medicoesMensaisApi, MedicaoMensal, MedicaoMensalCreate, MedicaoDocumento } from "@/lib/api-medicoes-mensais"
import { gruasApi } from "@/lib/api-gruas"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Grua {
  id: string | number
  name: string
  modelo?: string
  fabricante?: string
}

export default function MedicoesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [medicoes, setMedicoes] = useState<MedicaoMensal[]>([])
  const [gruas, setGruas] = useState<Grua[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGruas, setLoadingGruas] = useState(false)
  const [activeTab, setActiveTab] = useState<"todas" | "por-grua">("todas")
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [gruaFilter, setGruaFilter] = useState<string>("all")
  const [periodoFilter, setPeriodoFilter] = useState("")
  
  // Estados de diálogos
  const [selectedMedicao, setSelectedMedicao] = useState<MedicaoMensal | null>(null)
  const [isEnviarDialogOpen, setIsEnviarDialogOpen] = useState(false)
  const [emailEnvio, setEmailEnvio] = useState("")
  const [telefoneEnvio, setTelefoneEnvio] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    carregarMedicoes()
    carregarGruas()
  }, [])

  const carregarMedicoes = async () => {
    try {
      setLoading(true)
      const filters: any = { limit: 1000 }
      if (gruaFilter !== "all") {
        filters.grua_id = gruaFilter
      }
      if (periodoFilter) {
        filters.periodo = periodoFilter
      }
      if (statusFilter !== "all") {
        filters.status = statusFilter
      }
      
      const response = await medicoesMensaisApi.listar(filters)
      if (response.success) {
        setMedicoes(response.data || [])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar medições",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarGruas = async () => {
    try {
      setLoadingGruas(true)
      const response = await gruasApi.listarGruas({ limit: 1000 })
      if (response.success) {
        setGruas(response.data || [])
      }
    } catch (error: any) {
      console.error("Erro ao carregar gruas:", error)
    } finally {
      setLoadingGruas(false)
    }
  }


  const handleEnviar = async () => {
    if (!selectedMedicao) return

    try {
      setEnviando(true)
      const response = await medicoesMensaisApi.enviar(selectedMedicao.id, emailEnvio || undefined, telefoneEnvio || undefined)
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Medição enviada ao cliente com sucesso"
        })
        setIsEnviarDialogOpen(false)
        setEmailEnvio("")
        setTelefoneEnvio("")
        await carregarMedicoes()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar medição",
        variant: "destructive"
      })
    } finally {
      setEnviando(false)
    }
  }


  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      finalizada: { label: "Finalizada", variant: "default" },
      enviada: { label: "Enviada", variant: "secondary" },
      cancelada: { label: "Cancelada", variant: "destructive" }
    }
    const statusInfo = statusMap[status] || statusMap.pendente
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getAprovacaoBadge = (statusAprovacao?: string | null) => {
    if (!statusAprovacao) return null
    const aprovacaoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pendente: { label: "Aguardando Aprovação", variant: "secondary" },
      aprovada: { label: "Aprovada", variant: "default" },
      rejeitada: { label: "Rejeitada", variant: "destructive" }
    }
    const aprovacaoInfo = aprovacaoMap[statusAprovacao] || aprovacaoMap.pendente
    return <Badge variant={aprovacaoInfo.variant}>{aprovacaoInfo.label}</Badge>
  }

  const filteredMedicoes = useMemo(() => {
    return medicoes.filter(medicao => {
      const matchesSearch = 
        medicao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicao.periodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicao.obras?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicao.gruas?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || medicao.status === statusFilter
      const matchesGrua = gruaFilter === "all" || String(medicao.grua_id) === gruaFilter
      const matchesPeriodo = !periodoFilter || medicao.periodo === periodoFilter
      
      return matchesSearch && matchesStatus && matchesGrua && matchesPeriodo
    })
  }, [medicoes, searchTerm, statusFilter, gruaFilter, periodoFilter])

  // Agrupar medições por grua
  const medicoesPorGrua = useMemo(() => {
    const agrupadas: Record<string, { grua: Grua; medicoes: MedicaoMensal[] }> = {}
    
    filteredMedicoes.forEach(medicao => {
      if (medicao.grua_id && medicao.gruas) {
        const gruaId = String(medicao.grua_id)
        if (!agrupadas[gruaId]) {
          agrupadas[gruaId] = {
            grua: {
              id: medicao.grua_id,
              name: medicao.gruas.name,
              modelo: medicao.gruas.modelo,
              fabricante: medicao.gruas.fabricante
            },
            medicoes: []
          }
        }
        agrupadas[gruaId].medicoes.push(medicao)
      }
    })
    
    return Object.values(agrupadas).sort((a, b) => 
      a.grua.name.localeCompare(b.grua.name)
    )
  }, [filteredMedicoes])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  // Gerar período atual no formato YYYY-MM
  const getPeriodoAtual = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medições</h1>
          <p className="text-gray-600">Gerencie todas as medições do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            dados={filteredMedicoes}
            tipo="medicoes"
            nomeArquivo="medicoes"
            filtros={{
              grua_id: gruaFilter !== "all" ? gruaFilter : undefined,
              periodo: periodoFilter || undefined,
              status: statusFilter !== "all" ? statusFilter : undefined
            }}
            titulo="Relatório de Medições"
            variant="outline"
          />
          <Button asChild>
            <Link href="/dashboard/medicoes/nova">
              <Plus className="w-4 h-4 mr-2" />
              Nova Medição
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por número, período, obra ou grua..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gruaFilter} onValueChange={setGruaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Grua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Gruas</SelectItem>
                {gruas.map((grua) => (
                  <SelectItem key={grua.id} value={String(grua.id)}>
                    {grua.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <Label>Período (YYYY-MM)</Label>
              <Input
                type="text"
                placeholder="2025-01"
                value={periodoFilter}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9-]/g, '')
                  if (value.length <= 7) {
                    setPeriodoFilter(value)
                  }
                }}
                pattern="\d{4}-\d{2}"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setGruaFilter("all")
                setPeriodoFilter("")
              }}
            >
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={carregarMedicoes}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "todas" | "por-grua")}>
        <TabsList>
          <TabsTrigger value="todas">Todas as Medições</TabsTrigger>
          <TabsTrigger value="por-grua">Agrupadas por Grua</TabsTrigger>
        </TabsList>

        {/* Tab: Todas as Medições */}
        <TabsContent value="todas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medições ({filteredMedicoes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredMedicoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma medição encontrada</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Grua</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aprovação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicoes.map((medicao) => (
                      <TableRow key={medicao.id}>
                        <TableCell className="font-medium">{medicao.numero}</TableCell>
                        <TableCell>{medicao.periodo}</TableCell>
                        <TableCell>
                          {medicao.gruas ? (
                            <div className="flex items-center gap-2">
                              <Crane className="w-4 h-4" />
                              <span>{medicao.gruas.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {medicao.obras ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>{medicao.obras.nome}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(medicao.valor_total || 0)}</TableCell>
                        <TableCell>{getStatusBadge(medicao.status)}</TableCell>
                        <TableCell>{getAprovacaoBadge(medicao.status_aprovacao)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                router.push(`/dashboard/medicoes/${medicao.id}`)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {medicao.status === 'finalizada' && medicao.status !== 'enviada' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMedicao(medicao)
                                  setIsEnviarDialogOpen(true)
                                }}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
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
        </TabsContent>

        {/* Tab: Agrupadas por Grua */}
        <TabsContent value="por-grua" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">Carregando...</div>
              </CardContent>
            </Card>
          ) : medicoesPorGrua.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">Nenhuma medição encontrada</div>
              </CardContent>
            </Card>
          ) : (
            medicoesPorGrua.map((grupo) => (
              <Card key={String(grupo.grua.id)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crane className="w-6 h-6 text-blue-600" />
                      <div>
                        <CardTitle>{grupo.grua.name}</CardTitle>
                        <CardDescription>
                          {grupo.grua.modelo && grupo.grua.fabricante && (
                            `${grupo.grua.fabricante} - ${grupo.grua.modelo}`
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{grupo.medicoes.length} medição(ões)</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Obra</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aprovação</TableHead>
                        <TableHead>Documentos</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grupo.medicoes.map((medicao) => (
                        <TableRow key={medicao.id}>
                          <TableCell className="font-medium">{medicao.numero}</TableCell>
                          <TableCell>{medicao.periodo}</TableCell>
                          <TableCell>
                            {medicao.obras ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                <span>{medicao.obras.nome}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(medicao.valor_total || 0)}</TableCell>
                          <TableCell>{getStatusBadge(medicao.status)}</TableCell>
                          <TableCell>{getAprovacaoBadge(medicao.status_aprovacao)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              {medicao.status === 'finalizada' || medicao.status === 'enviada' ? (
                                <>
                                  {medicao.documentos?.some(d => d.tipo_documento === 'nf_servico') ? (
                                    <Badge variant="default" className="text-xs">
                                      <Receipt className="w-3 h-3 mr-1" />
                                      NF Serviço
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <Receipt className="w-3 h-3 mr-1" />
                                      NF Serviço
                                    </Badge>
                                  )}
                                  {medicao.documentos?.some(d => d.tipo_documento === 'nf_locacao') ? (
                                    <Badge variant="default" className="text-xs">
                                      <FileCheck className="w-3 h-3 mr-1" />
                                      NF Locação
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <FileCheck className="w-3 h-3 mr-1" />
                                      NF Locação
                                    </Badge>
                                  )}
                                  {medicao.documentos?.some(d => d.tipo_documento === 'boleto') ? (
                                    <Badge variant="default" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Boleto
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Boleto
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">Pendente</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  router.push(`/dashboard/medicoes/${medicao.id}`)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {medicao.status === 'finalizada' && medicao.status !== 'enviada' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMedicao(medicao)
                                    setIsEnviarDialogOpen(true)
                                  }}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>


      {/* Dialog de Envio */}
      <Dialog open={isEnviarDialogOpen} onOpenChange={setIsEnviarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Medição ao Cliente</DialogTitle>
            <DialogDescription>
              Informe o e-mail e telefone para envio das notificações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={emailEnvio}
                onChange={(e) => setEmailEnvio(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input
                id="telefone"
                value={telefoneEnvio}
                onChange={(e) => setTelefoneEnvio(e.target.value)}
                placeholder="5511999999999"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnviarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
