"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Shield, Plus, Edit, Trash2, Lock, Key, Save, RefreshCw } from 'lucide-react'

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
  created_at: string
  updated_at: string
}

interface PerfilPermissao {
  permissao_id: number
  permissoes: Permissao
}

export default function PerfisPermissoesPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'perfis' | 'permissoes'>('perfis')
  
  // Estados para Perfis
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [niveisDisponiveis, setNiveisDisponiveis] = useState<number[]>([])
  const [loadingPerfis, setLoadingPerfis] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    nivel_acesso: 1,
    status: 'Ativo' as 'Ativo' | 'Inativo'
  })

  // Estados para Permissões
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  const [perfilSelecionado, setPerfilSelecionado] = useState<number | null>(null)
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<number[]>([])
  const [loadingPermissoes, setLoadingPermissoes] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPerfis()
    loadPermissoes()
  }, [])

  // Verificar se há perfil na URL para abrir aba de permissões
  useEffect(() => {
    const perfilIdFromUrl = searchParams.get('perfil')
    if (perfilIdFromUrl && perfis.length > 0) {
      const perfilId = parseInt(perfilIdFromUrl)
      const perfilExiste = perfis.find(p => p.id === perfilId)
      if (perfilExiste) {
        setActiveTab('permissoes')
        setPerfilSelecionado(perfilId)
      }
    }
  }, [perfis, searchParams])

  useEffect(() => {
    if (perfilSelecionado && permissoes.length > 0) {
      loadPermissoesDoPerfil(perfilSelecionado)
    }
  }, [perfilSelecionado, permissoes])

  // ========== FUNÇÕES DE PERFIS ==========
  const loadPerfis = async () => {
    try {
      setLoadingPerfis(true)
      const response = await fetch('/api/permissoes/perfis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPerfis(data.data || [])
        
        const niveis = [...new Set((data.data || []).map((perfil: Perfil) => perfil.nivel_acesso))]
          .sort((a, b) => a - b)
        setNiveisDisponiveis(niveis)
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os perfis',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar perfis',
        variant: 'destructive'
      })
    } finally {
      setLoadingPerfis(false)
    }
  }

  const handleSubmitPerfil = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingPerfil
        ? `/api/permissoes/perfis/${editingPerfil.id}`
        : '/api/permissoes/perfis'
      
      const method = editingPerfil ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: editingPerfil
            ? 'Perfil atualizado com sucesso'
            : 'Perfil criado com sucesso'
        })
        setDialogOpen(false)
        resetForm()
        loadPerfis()
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao salvar perfil',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar perfil',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (perfil: Perfil) => {
    setEditingPerfil(perfil)
    setFormData({
      nome: perfil.nome,
      descricao: perfil.descricao || '',
      nivel_acesso: perfil.nivel_acesso,
      status: perfil.status
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) {
      return
    }

    try {
      const response = await fetch(`/api/permissoes/perfis/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Perfil excluído com sucesso'
        })
        loadPerfis()
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao excluir perfil',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao excluir perfil:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao excluir perfil',
        variant: 'destructive'
      })
    }
  }

  const handleGerenciarPermissoes = (perfilId: number) => {
    setPerfilSelecionado(perfilId)
    setActiveTab('permissoes')
  }

  const resetForm = () => {
    setEditingPerfil(null)
    setFormData({
      nome: '',
      descricao: '',
      nivel_acesso: 1,
      status: 'Ativo'
    })
  }

  const getNivelColor = (nivel: number) => {
    if (nivel >= 9) return 'bg-red-500'
    if (nivel >= 7) return 'bg-orange-500'
    if (nivel >= 5) return 'bg-yellow-500'
    if (nivel >= 3) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  // ========== FUNÇÕES DE PERMISSÕES ==========
  const loadPermissoes = async () => {
    try {
      setLoadingPermissoes(true)
      const response = await fetch('/api/permissoes/permissoes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPermissoes(data.data || [])
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as permissões',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar permissões',
        variant: 'destructive'
      })
    } finally {
      setLoadingPermissoes(false)
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
      setPermissoesSelecionadas(prev => 
        prev.filter(id => !permissoesDoModulo.includes(id))
      )
    } else {
      setPermissoesSelecionadas(prev => 
        [...new Set([...prev, ...permissoesDoModulo])]
      )
    }
  }

  const handleSalvarPermissoes = async () => {
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
    <ProtectedRoute permission="usuarios:visualizar">
      <div className="w-full h-full p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              Perfis e Permissões
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie perfis de acesso e suas permissões
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'perfis' | 'permissoes')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="perfis">
              <Shield className="w-4 h-4 mr-2" />
              Perfis
            </TabsTrigger>
            <TabsTrigger value="permissoes">
              <Lock className="w-4 h-4 mr-2" />
              Permissões
            </TabsTrigger>
          </TabsList>

          {/* Tab: Perfis */}
          <TabsContent value="perfis" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPerfil(null)
                    resetForm()
                    setDialogOpen(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleSubmitPerfil}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingPerfil ? 'Editar Perfil' : 'Novo Perfil'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingPerfil
                          ? 'Atualize as informações do perfil'
                          : 'Crie um novo perfil de acesso'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="nome">Nome do Perfil</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Ex: Gerente de Projetos"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          placeholder="Descreva as responsabilidades deste perfil"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="nivel_acesso">Nível de Acesso</Label>
                        <div className="space-y-2">
                          <Select
                            value={formData.nivel_acesso.toString()}
                            onValueChange={(value) => setFormData({ ...formData, nivel_acesso: parseInt(value) })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o nível" />
                            </SelectTrigger>
                            <SelectContent>
                              {niveisDisponiveis.map((nivel) => {
                                const perfilExistente = perfis.find(p => p.nivel_acesso === nivel)
                                return (
                                  <SelectItem key={nivel} value={nivel.toString()}>
                                    {nivel} - {perfilExistente?.nome || `Nível ${nivel}`}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Ou digite um novo nível:</span>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={formData.nivel_acesso}
                              onChange={(e) => {
                                const valor = parseInt(e.target.value) || 1
                                setFormData({ ...formData, nivel_acesso: valor })
                              }}
                              className="w-20"
                              placeholder="1-10"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: 'Ativo' | 'Inativo') => setFormData({ ...formData, status: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => {
                        setDialogOpen(false)
                        resetForm()
                      }}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingPerfil ? 'Atualizar' : 'Criar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tabela de Perfis */}
            <Card>
              <CardHeader>
                <CardTitle>Perfis Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os perfis de acesso do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPerfis ? (
                  <div className="w-full h-full flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : perfis.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum perfil cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Nível</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {perfis.map((perfil) => (
                        <TableRow key={perfil.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              {perfil.nome}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {perfil.descricao || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${getNivelColor(perfil.nivel_acesso)} text-white`}>
                              Nível {perfil.nivel_acesso}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={perfil.status === 'Ativo' ? 'default' : 'secondary'}>
                              {perfil.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleGerenciarPermissoes(perfil.id)}
                                title="Gerenciar Permissões"
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(perfil)}
                                title="Editar Perfil"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(perfil.id)}
                                disabled={['Admin', 'Gerente'].includes(perfil.nome)}
                                title="Excluir Perfil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

          {/* Tab: Permissões */}
          <TabsContent value="permissoes" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Gerenciar Permissões</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Configure as permissões de cada perfil de acesso
                </p>
              </div>

              {perfilSelecionado && (
                <Button onClick={handleSalvarPermissoes} disabled={saving}>
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
            {perfilSelecionado && !loadingPermissoes && (
              <div className="grid gap-4">
                {modulos.sort().map((modulo) => {
                  const permissoesDoModulo = permissoesPorModulo[modulo]
                  const todasSelecionadas = permissoesDoModulo.every(p => 
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

            {loadingPermissoes && (
              <div className="w-full h-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!perfilSelecionado && !loadingPermissoes && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Selecione um perfil para gerenciar suas permissões</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}

