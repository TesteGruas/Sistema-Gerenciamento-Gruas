"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Shield, Lock, Save, RefreshCw } from 'lucide-react'

interface Permissao {
  id: number
  nome: string
  descricao: string
  modulo: string
  acao: string
  recurso?: string
  status: 'Ativa' | 'Inativa'
}

interface Perfil {
  id: number
  nome: string
  descricao: string
  nivel_acesso: number
  status: 'Ativo' | 'Inativo'
}

interface PerfilPermissao {
  permissao_id: number
  permissoes: Permissao
}

export default function PermissoesPage() {
  const searchParams = useSearchParams()
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  const [perfilSelecionado, setPerfilSelecionado] = useState<number | null>(null)
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Pré-selecionar perfil da URL
  useEffect(() => {
    const perfilIdFromUrl = searchParams.get('perfil')
    if (perfilIdFromUrl && perfis.length > 0) {
      const perfilId = parseInt(perfilIdFromUrl)
      const perfilExiste = perfis.find(p => p.id === perfilId)
      if (perfilExiste) {
        setPerfilSelecionado(perfilId)
      }
    }
  }, [perfis, searchParams])

  useEffect(() => {
    if (perfilSelecionado) {
      loadPermissoesDoPerfil(perfilSelecionado)
    }
  }, [perfilSelecionado])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar perfis
      const perfisResponse = await fetch('/api/permissoes/perfis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      // Carregar permissões
      const permissoesResponse = await fetch('/api/permissoes/permissoes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (perfisResponse.ok && permissoesResponse.ok) {
        const perfisData = await perfisResponse.json()
        const permissoesData = await permissoesResponse.json()
        
        setPerfis(perfisData.data || [])
        setPermissoes(permissoesData.data || [])
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPermissoesDoPerfil = async (perfilId: number) => {
    try {
      const response = await fetch(`/api/permissoes/perfis/${perfilId}/permissoes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const permissoesIds = (data.data || []).map((pp: PerfilPermissao) => pp.permissoes.id)
        setPermissoesSelecionadas(permissoesIds)
      }
    } catch (error) {
      console.error('Erro ao carregar permissões do perfil:', error)
    }
  }

  const handleTogglePermissao = (permissaoId: number) => {
    setPermissoesSelecionadas(prev => {
      if (prev.includes(permissaoId)) {
        return prev.filter(id => id !== permissaoId)
      } else {
        return [...prev, permissaoId]
      }
    })
  }

  const handleToggleModulo = (modulo: string) => {
    const permissoesDoModulo = permissoes
      .filter(p => p.modulo === modulo && p.status === 'Ativa')
      .map(p => p.id)

    const todasSelecionadas = permissoesDoModulo.every(id => 
      permissoesSelecionadas.includes(id)
    )

    if (todasSelecionadas) {
      // Remover todas do módulo
      setPermissoesSelecionadas(prev => 
        prev.filter(id => !permissoesDoModulo.includes(id))
      )
    } else {
      // Adicionar todas do módulo
      setPermissoesSelecionadas(prev => 
        [...new Set([...prev, ...permissoesDoModulo])]
      )
    }
  }

  const handleSalvar = async () => {
    if (!perfilSelecionado) {
      toast({
        title: 'Aviso',
        description: 'Selecione um perfil primeiro',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch(`/api/permissoes/perfis/${perfilSelecionado}/permissoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          permissoes: permissoesSelecionadas
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Permissões atualizadas com sucesso'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao atualizar permissões',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar permissões',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Agrupar permissões por módulo
  const modulos = Array.from(new Set(permissoes.map(p => p.modulo)))
  const permissoesPorModulo = modulos.reduce((acc, modulo) => {
    acc[modulo] = permissoes.filter(p => p.modulo === modulo && p.status === 'Ativa')
    return acc
  }, {} as Record<string, Permissao[]>)

  const getModuloIcon = (modulo: string) => {
    const icons: Record<string, string> = {
      dashboard: '📊',
      usuarios: '👤',
      clientes: '👥',
      obras: '🏗️',
      gruas: '🏗️',
      livros_gruas: '📚',
      estoque: '📦',
      ponto_eletronico: '⏰',
      rh: '👷',
      financeiro: '💰',
      relatorios: '📈',
      historico: '📜',
      assinatura_digital: '✍️',
      notificacoes: '🔔'
    }
    return icons[modulo] || '📋'
  }

  const getModuloNome = (modulo: string) => {
    const nomes: Record<string, string> = {
      dashboard: 'Dashboard',
      usuarios: 'Usuários',
      clientes: 'Clientes',
      obras: 'Obras',
      gruas: 'Gruas',
      livros_gruas: 'Livros de Gruas',
      estoque: 'Estoque',
      ponto_eletronico: 'Ponto Eletrônico',
      rh: 'RH',
      financeiro: 'Financeiro',
      relatorios: 'Relatórios',
      historico: 'Histórico',
      assinatura_digital: 'Assinatura Digital',
      notificacoes: 'Notificações'
    }
    return nomes[modulo] || modulo
  }

  const perfilAtual = perfis.find(p => p.id === perfilSelecionado)

  return (
    <ProtectedRoute permission="usuarios:gerenciar_permissoes">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lock className="w-8 h-8 text-blue-600" />
              Gerenciamento de Permissões
            </h1>
            <p className="text-gray-600 mt-1">
              Configure as permissões de cada perfil de acesso
            </p>
          </div>

          {perfilSelecionado && (
            <Button onClick={handleSalvar} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Permissões
                </>
              )}
            </Button>
          )}
        </div>

        {/* Seleção de Perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione um Perfil</CardTitle>
            <CardDescription>
              Escolha o perfil para gerenciar suas permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={perfilSelecionado?.toString() || ''}
              onValueChange={(value) => setPerfilSelecionado(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {perfis.map((perfil) => (
                  <SelectItem key={perfil.id} value={perfil.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>{perfil.nome}</span>
                      <Badge variant="outline" className="ml-2">
                        Nível {perfil.nivel_acesso}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {perfilAtual && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900">{perfilAtual.nome}</h3>
                <p className="text-sm text-blue-700 mt-1">{perfilAtual.descricao}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-600 text-white">
                    Nível {perfilAtual.nivel_acesso}
                  </Badge>
                  <Badge variant="outline">
                    {permissoesSelecionadas.length} permissões selecionadas
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissões por Módulo */}
        {perfilSelecionado && !loading && (
          <div className="grid gap-4">
            {modulos.sort().map((modulo) => {
              const permissoesDoModulo = permissoesPorModulo[modulo]
              const todasSelecionadas = permissoesDoModulo.every(p => 
                permissoesSelecionadas.includes(p.id)
              )
              const algumasSelecionadas = permissoesDoModulo.some(p => 
                permissoesSelecionadas.includes(p.id)
              )

              return (
                <Card key={modulo}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{getModuloIcon(modulo)}</span>
                        {getModuloNome(modulo)}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleModulo(modulo)}
                      >
                        {todasSelecionadas ? 'Desmarcar Todas' : 'Selecionar Todas'}
                      </Button>
                    </div>
                    <CardDescription>
                      {permissoesDoModulo.length} permissões disponíveis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {permissoesDoModulo.map((permissao) => (
                        <div
                          key={permissao.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            id={`permissao-${permissao.id}`}
                            checked={permissoesSelecionadas.includes(permissao.id)}
                            onCheckedChange={() => handleTogglePermissao(permissao.id)}
                          />
                          <label
                            htmlFor={`permissao-${permissao.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <p className="font-medium text-sm">{permissao.nome}</p>
                            {permissao.descricao && (
                              <p className="text-xs text-gray-600 mt-1">
                                {permissao.descricao}
                              </p>
                            )}
                            <Badge variant="outline" className="mt-2 text-xs">
                              {permissao.acao}
                            </Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!perfilSelecionado && !loading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Selecione um perfil para gerenciar suas permissões</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}

