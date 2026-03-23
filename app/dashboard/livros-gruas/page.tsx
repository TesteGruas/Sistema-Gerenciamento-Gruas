"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Search, Wrench, Eye, AlertCircle } from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { livroGruaApi } from "@/lib/api-livro-grua"
import { useCurrentUser } from "@/hooks/use-current-user"
import { PaginationControl } from "@/components/ui/pagination-control"

interface GruaObraRelacao {
  id: number
  grua_id: string
  obra_id: number
  data_inicio_locacao: string
  data_fim_locacao?: string
  status: string
  valor_locacao_mensal?: number
  observacoes?: string
  grua: {
    id: string
    tipo: string
    modelo: string
    fabricante: string
  }
  obra: {
    id: number
    nome: string
    endereco: string
    cidade: string
    estado: string
    status: string
  }
}

function formatRelacaoDate(d?: string | null): string {
  if (!d) return "—"
  const t = new Date(d).getTime()
  if (Number.isNaN(t)) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

export default function LivrosGruasPage() {
  const router = useRouter()
  const { user, loading: userLoading, isAdmin } = useCurrentUser()
  
  // Estados principais
  const [relacoes, setRelacoes] = useState<GruaObraRelacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterObra, setFilterObra] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Estados para obras e status únicos (carregados separadamente)
  const [obrasUnicas, setObrasUnicas] = useState<any[]>([])
  const [statusUnicos, setStatusUnicos] = useState<string[]>([])

  // Flags para controlar carregamento e evitar chamadas duplicadas
  const [dadosIniciaisCarregados, setDadosIniciaisCarregados] = useState(false)
  const loadingRelacoesRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const prevSearchTermRef = useRef(searchTerm)
  const prevFilterObraRef = useRef(filterObra)
  const prevFilterStatusRef = useRef(filterStatus)

  // Carregar relações grua-obra
  const carregarRelacoes = async (page: number = currentPage, limit: number = itemsPerPage) => {
    try {
      setLoading(true)
      setError(null)

      // Aguardar carregamento do usuário
      if (userLoading) {
        return
      }

      if (!user) {
        setError('Usuário não autenticado. Faça login para acessar esta página.')
        return
      }

      // Buscar relações grua-obra (filtradas por perfil do usuário) com paginação e pesquisa
      console.log(`⏳ [Preload] Buscando relações grua-obra (página ${page}, ${limit} por página, busca: "${searchTerm}", obra: ${filterObra}, status: ${filterStatus})...`)
      const startTime = performance.now()
      const response = await livroGruaApi.listarRelacoesGruaObra(
        undefined, 
        page, 
        limit,
        searchTerm.trim() || undefined,
        filterObra !== 'all' ? filterObra : undefined,
        filterStatus !== 'all' ? filterStatus : undefined
      )
      const duration = Math.round(performance.now() - startTime)
      
      if (response.success && response.data) {
        console.log(`✅ [Preload] Relações grua-obra carregadas (${duration}ms) - ${response.data.length} registros`)
        setRelacoes(response.data)
        
        // Atualizar informações de paginação
        if (response.total !== undefined) {
          setTotalItems(response.total)
          setTotalPages(response.totalPages || Math.ceil(response.total / limit))
        } else {
          // Fallback: usar length dos dados se total não vier da API
          setTotalItems(response.data.length)
          setTotalPages(1)
        }
      } else {
        console.log('⚠️ [Preload] Nenhuma relação encontrada')
        setRelacoes([])
        setTotalItems(0)
        setTotalPages(0)
        if (page === 1) {
          setError('Nenhuma relação grua-obra encontrada para este usuário.')
        }
      }

    } catch (err) {
      console.error('Erro ao carregar relações:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(errorMessage)
      setRelacoes([])
      setTotalItems(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }
  
  // Handler para mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    carregarRelacoes(page, itemsPerPage)
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Handler para mudança de itens por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
    carregarRelacoes(1, newItemsPerPage)
  }

  // Usar dados diretamente da API (filtros já aplicados no backend)
  const relacoesFiltradas = relacoes

  // Carregar obras únicas e status únicos (uma vez)
  useEffect(() => {
    if (!dadosIniciaisCarregados || !user) return
    
    const carregarObrasEStatus = async () => {
      try {
        // Buscar todas as relações sem paginação para obter obras e status únicos
        const response = await livroGruaApi.listarRelacoesGruaObra(undefined, 1, 1000)
        if (response.success && response.data) {
          // Obter obras únicas
          const obrasMap = new Map()
          response.data.forEach((r: any) => {
            if (r.obra?.id && !obrasMap.has(r.obra.id)) {
              obrasMap.set(r.obra.id, r.obra)
            }
          })
          setObrasUnicas(Array.from(obrasMap.values()))
          
          // Obter status únicos
          const statusSet = new Set(response.data.map((r: any) => r.status).filter(Boolean))
          setStatusUnicos(Array.from(statusSet))
        }
      } catch (err) {
        console.error('Erro ao carregar obras e status:', err)
      }
    }
    
    carregarObrasEStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosIniciaisCarregados, user])

  // Carregar dados na inicialização - apenas uma vez
  useEffect(() => {
    // Evitar carregamento duplo - só carregar uma vez
    if (initialLoadDoneRef.current) return
    if (userLoading || loadingRelacoesRef.current) return
    if (!user) return
    
    initialLoadDoneRef.current = true
    loadingRelacoesRef.current = true
    carregarRelacoes(1, itemsPerPage).finally(() => {
      setDadosIniciaisCarregados(true)
      loadingRelacoesRef.current = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, isAdmin])
  
  // Recarregar quando filtros mudarem (com debounce)
  useEffect(() => {
    if (!dadosIniciaisCarregados) return
    
    // Verificar se houve mudança real nos filtros (não apenas no primeiro render)
    const searchChanged = prevSearchTermRef.current !== searchTerm
    const obraChanged = prevFilterObraRef.current !== filterObra
    const statusChanged = prevFilterStatusRef.current !== filterStatus
    
    // Se não houve mudança real, não executar (evita carregamento duplo no primeiro render)
    if (!searchChanged && !obraChanged && !statusChanged) {
      return
    }
    
    // Atualizar refs
    prevSearchTermRef.current = searchTerm
    prevFilterObraRef.current = filterObra
    prevFilterStatusRef.current = filterStatus
    
    const timer = setTimeout(() => {
      if (!loadingRelacoesRef.current) {
        setCurrentPage(1) // Reset para primeira página ao filtrar
        loadingRelacoesRef.current = true
        carregarRelacoes(1, itemsPerPage).finally(() => {
          loadingRelacoesRef.current = false
        })
      }
    }, 300) // Debounce de 300ms
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterObra, filterStatus, dadosIniciaisCarregados])

  // Tratamento de loading e erro
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader text="Carregando livros de gruas..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar dados</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => carregarRelacoes(currentPage, itemsPerPage)} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Livros de Gruas
          </h1>
          <p className="text-gray-600 mt-2">
            Acesse os livros de gruas por obra para funcionários
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b px-4 py-4 sm:px-6 sm:py-5">
            <p className="mb-3 text-sm font-semibold text-foreground">Filtros</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Grua, modelo, obra..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="obra">Obra</Label>
                <Select value={filterObra} onValueChange={setFilterObra}>
                  <SelectTrigger id="obra" className="mt-2">
                    <SelectValue placeholder="Todas as obras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as obras</SelectItem>
                    {obrasUnicas.map((obra) => (
                      <SelectItem key={obra?.id} value={obra?.id.toString()}>
                        {obra?.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {statusUnicos.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterObra("all")
                    setFilterStatus("all")
                  }}
                  className="mt-6 w-full md:mt-0"
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </div>

          {relacoesFiltradas.length > 0 ? (
            <>
              <div className="overflow-x-auto px-4 py-4 sm:px-6 sm:py-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Grua</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="min-w-[160px]">Obra</TableHead>
                      <TableHead className="min-w-[200px] hidden lg:table-cell">Local</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap">Período</TableHead>
                      <TableHead className="text-right min-w-[72px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relacoesFiltradas.map((relacao) => {
                      if (!relacao.grua || !relacao.obra) return null
                      const localStr = [relacao.obra.endereco, [relacao.obra.cidade, relacao.obra.estado].filter(Boolean).join("/")]
                        .filter(Boolean)
                        .join(" · ")
                      const periodo = `${formatRelacaoDate(relacao.data_inicio_locacao)} — ${relacao.data_fim_locacao ? formatRelacaoDate(relacao.data_fim_locacao) : "Em aberto"}`

                      return (
                        <TableRow key={relacao.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-start gap-2 min-w-0">
                              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                              <div className="min-w-0">
                                <p className="font-medium truncate" title={relacao.grua.id}>
                                  {relacao.grua.id || "—"}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {[relacao.grua.fabricante, relacao.grua.modelo].filter(Boolean).join(" · ") || "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={relacao.status === "Ativa" ? "default" : "secondary"} className="whitespace-nowrap">
                              {relacao.status || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="line-clamp-2 font-medium" title={relacao.obra.nome}>
                              {relacao.obra.nome || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                            <span className="line-clamp-2" title={localStr || undefined}>
                              {localStr || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{periodo}</TableCell>
                          <TableCell className="p-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              title="Abrir livro da grua"
                              onClick={() => router.push(`/dashboard/livros-gruas/${relacao.id}/livro`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 0 ? (
                <div className="border-t">
                  <PaginationControl
                    variant="plain"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemsPerPageOptions={[9, 18, 27, 36]}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-40" />
              <p className="font-medium text-foreground">Nenhuma relação encontrada</p>
              <p className="mt-1 text-sm">
                {searchTerm || filterObra !== "all" || filterStatus !== "all"
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Não há relações grua-obra cadastradas no momento."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
