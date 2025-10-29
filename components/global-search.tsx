"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Clock, Users, Building2, Package, DollarSign, FileText, Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { obrasApi } from '@/lib/api-obras'
import { clientesApi } from '@/lib/api-clientes'
import { funcionariosApi } from '@/lib/api-funcionarios'
import { gruasApi } from '@/lib/api-gruas'

// Tipos para os resultados da busca
interface SearchResult {
  id: string
  title: string
  description: string
  type: 'page' | 'client' | 'obra' | 'grua' | 'funcionario' | 'ponto' | 'financeiro' | 'relatorio' | 'notificacao'
  href: string
  icon: React.ComponentType<any>
  category: string
  metadata?: {
    status?: string
    date?: string
    value?: string
    priority?: string
  }
}

// Páginas fixas do sistema (pré-definidas)
const paginasFixas: SearchResult[] = [
  { id: 'dashboard', title: 'Dashboard', description: 'Visão geral do sistema', type: 'page', href: '/dashboard', icon: Clock, category: 'Sistema' },
  { id: 'clientes', title: 'Clientes', description: 'Gerenciar clientes', type: 'page', href: '/dashboard/clientes', icon: Users, category: 'Sistema' },
  { id: 'obras', title: 'Obras', description: 'Gerenciar obras', type: 'page', href: '/dashboard/obras', icon: Building2, category: 'Sistema' },
  { id: 'gruas', title: 'Controle de Gruas', description: 'Gerenciar equipamentos', type: 'page', href: '/dashboard/gruas', icon: Package, category: 'Sistema' },
  { id: 'ponto', title: 'Ponto Eletrônico', description: 'Controle de frequência', type: 'page', href: '/dashboard/ponto', icon: Clock, category: 'Sistema' },
  { id: 'financeiro', title: 'Financeiro', description: 'Gestão financeira', type: 'page', href: '/dashboard/financeiro', icon: DollarSign, category: 'Sistema' },
  { id: 'relatorios', title: 'Relatórios', description: 'Relatórios e análises', type: 'page', href: '/dashboard/relatorios', icon: FileText, category: 'Sistema' },
  { id: 'notificacoes', title: 'Notificações', description: 'Central de notificações', type: 'page', href: '/dashboard/notificacoes', icon: Bell, category: 'Sistema' },
]

// Ícones por tipo
const typeIcons = {
  page: Clock,
  client: Users,
  obra: Building2,
  grua: Package,
  funcionario: Users,
  ponto: Clock,
  financeiro: DollarSign,
  relatorio: FileText,
  notificacao: Bell
}

// Cores por tipo
const typeColors = {
  page: 'bg-blue-100 text-blue-700',
  client: 'bg-green-100 text-green-700',
  obra: 'bg-orange-100 text-orange-700',
  grua: 'bg-purple-100 text-purple-700',
  funcionario: 'bg-cyan-100 text-cyan-700',
  ponto: 'bg-yellow-100 text-yellow-700',
  financeiro: 'bg-emerald-100 text-emerald-700',
  relatorio: 'bg-indigo-100 text-indigo-700',
  notificacao: 'bg-red-100 text-red-700'
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Abrir busca com Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Função para buscar dados dinâmicos nas APIs
  const buscarDadosDinamicos = useCallback(async (searchTerm: string) => {
    const termoLower = searchTerm.toLowerCase()
    const resultados: SearchResult[] = []

    try {
      // Buscar páginas fixas
      const paginasEncontradas = paginasFixas.filter(item =>
        item.title.toLowerCase().includes(termoLower) ||
        item.description.toLowerCase().includes(termoLower)
      )
      resultados.push(...paginasEncontradas)

      // Buscar clientes
      try {
        const clientesResponse = await clientesApi.buscarClientes(searchTerm, 1, 5)
        const clientes = clientesResponse.data || []
        clientes.forEach(cliente => {
          resultados.push({
            id: `cliente-${cliente.id}`,
            title: cliente.nome,
            description: cliente.cnpj ? `CNPJ: ${cliente.cnpj}` : cliente.email || '',
            type: 'client' as const,
            href: `/dashboard/clientes/${cliente.id}`,
            icon: Users,
            category: 'Clientes',
            metadata: { status: cliente.status || 'Ativo' }
          })
        })
      } catch (error) {
        console.warn('Erro ao buscar clientes:', error)
      }

      // Buscar obras
      try {
        const obrasResponse = await obrasApi.listarObras({ 
          page: 1, 
          limit: 5 
        })
        const obras = obrasResponse.data || []
        obras.filter(obra => 
          obra.nome.toLowerCase().includes(termoLower) ||
          obra.endereco?.toLowerCase().includes(termoLower)
        ).forEach(obra => {
          resultados.push({
            id: `obra-${obra.id}`,
            title: obra.nome,
            description: obra.descricao || `${obra.cidade || ''} ${obra.estado || ''}`.trim(),
            type: 'obra' as const,
            href: `/dashboard/obras/${obra.id}`,
            icon: Building2,
            category: 'Obras',
            metadata: { 
              status: obra.status,
              date: obra.data_inicio 
            }
          })
        })
      } catch (error) {
        console.warn('Erro ao buscar obras:', error)
      }

      // Buscar funcionários
      try {
        const funcionariosResponse = await funcionariosApi.buscarFuncionarios(searchTerm)
        const funcionarios = funcionariosResponse.data || []
        funcionarios.forEach(func => {
          resultados.push({
            id: `func-${func.id}`,
            title: func.nome,
            description: `${func.cargo}${func.email ? ` - ${func.email}` : ''}`,
            type: 'funcionario' as const,
            href: `/dashboard/rh/${func.id}`,
            icon: Users,
            category: 'RH',
            metadata: { status: func.status }
          })
        })
      } catch (error) {
        console.warn('Erro ao buscar funcionários:', error)
      }

      // Buscar gruas
      try {
        const gruasResponse = await gruasApi.listarGruas({ limit: 5 })
        const gruas = gruasResponse.data || []
        gruas.filter(grua => 
          (grua.name || '').toLowerCase().includes(termoLower) ||
          (grua.modelo || '').toLowerCase().includes(termoLower) ||
          (grua.fabricante || '').toLowerCase().includes(termoLower)
        ).forEach(grua => {
          resultados.push({
            id: `grua-${grua.id}`,
            title: grua.name || `Grua ${grua.id}`,
            description: `${grua.modelo || ''}${grua.fabricante ? ` - ${grua.fabricante}` : ''}`.trim(),
            type: 'grua' as const,
            href: `/dashboard/gruas/${grua.id}`,
            icon: Package,
            category: 'Equipamentos',
            metadata: { status: grua.status }
          })
        })
      } catch (error) {
        console.warn('Erro ao buscar gruas:', error)
      }

      return resultados.slice(0, 8) // Limitar a 8 resultados
    } catch (error) {
      console.error('Erro na busca:', error)
      return resultados.slice(0, 8)
    }
  }, [])

  // Buscar resultados
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    
    // Debounce para evitar muitas chamadas
    const timeoutId = setTimeout(async () => {
      const resultados = await buscarDadosDinamicos(query)
      setResults(resultados)
      setSelectedIndex(0)
      setIsLoading(false)
    }, 300) // 300ms de debounce

    return () => clearTimeout(timeoutId)
  }, [query, buscarDadosDinamicos])

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex])
      }
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    router.push(result.href)
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      page: 'Página',
      client: 'Cliente',
      obra: 'Obra',
      grua: 'Grua',
      funcionario: 'Funcionário',
      ponto: 'Ponto',
      financeiro: 'Financeiro',
      relatorio: 'Relatório',
      notificacao: 'Notificação'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <>
      {/* Botão de busca */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative w-64 justify-start text-sm text-muted-foreground"
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Buscar em todo o sistema...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1.5 text-xs bg-muted text-muted-foreground rounded border">
          ⌘K
        </kbd>
      </Button>

      {/* Modal de busca */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-white rounded-lg shadow-xl border">
              {/* Input de busca */}
              <div className="flex items-center border-b px-4 py-3">
                <Search className="mr-3 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar clientes, obras, gruas, funcionários..."
                  className="border-0 shadow-none focus-visible:ring-0 text-base"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="ml-2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Resultados */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => {
                      const Icon = result.icon
                      const isSelected = index === selectedIndex
                      
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3">
                            <div className={`p-2 rounded-lg ${typeColors[result.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {result.title}
                              </h4>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {getTypeLabel(result.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {result.description}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-400">
                              <span>{result.category}</span>
                              {result.metadata?.status && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="capitalize">{result.metadata.status}</span>
                                </>
                              )}
                              {result.metadata?.date && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{new Date(result.metadata.date).toLocaleDateString('pt-BR')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : query.length >= 2 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Nenhum resultado encontrado</p>
                    <p className="text-xs text-gray-400 mt-1">Tente termos diferentes</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Search className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Digite para buscar</p>
                    <p className="text-xs text-gray-400 mt-1">Clientes, obras, gruas, funcionários...</p>
                  </div>
                )}
              </div>

              {/* Dicas de uso */}
              <div className="border-t px-4 py-2 bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>↑↓ Navegar</span>
                    <span>↵ Selecionar</span>
                    <span>Esc Fechar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">⌘K</kbd>
                    <span>para abrir</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
