"use client"

import React, { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Shield, Plus, Edit, Trash2, Users, Lock, Key } from 'lucide-react'
import Link from 'next/link'

interface Perfil {
  id: number
  nome: string
  descricao: string
  nivel_acesso: number
  status: 'Ativo' | 'Inativo'
  created_at: string
  updated_at: string
}

export default function PerfisPage() {
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [niveisDisponiveis, setNiveisDisponiveis] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    nivel_acesso: 1,
    status: 'Ativo' as 'Ativo' | 'Inativo'
  })

  useEffect(() => {
    loadPerfis()
  }, [])

  const loadPerfis = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/permissoes/perfis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPerfis(data.data || [])
        
        // Extrair níveis únicos dos perfis existentes
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
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

  const resetForm = () => {
    setEditingPerfil(null)
    setFormData({
      nome: '',
      descricao: '',
      nivel_acesso: 1,
      status: 'Ativo'
    })
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    resetForm()
  }

  const getNivelColor = (nivel: number) => {
    if (nivel >= 9) return 'bg-red-500'
    if (nivel >= 7) return 'bg-orange-500'
    if (nivel >= 5) return 'bg-yellow-500'
    if (nivel >= 3) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  return (
    <ProtectedRoute permission="usuarios:visualizar">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              Gerenciamento de Perfis
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie os perfis de acesso do sistema
            </p>
          </div>

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
              <form onSubmit={handleSubmit}>
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
                    />
                  </div>

                  <div>
                    <Label htmlFor="nivel_acesso">Nível de Acesso</Label>
                    <div className="space-y-2">
                      <Select
                        value={formData.nivel_acesso.toString()}
                        onValueChange={(value) => setFormData({ ...formData, nivel_acesso: parseInt(value) })}
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
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Níveis existentes: {niveisDisponiveis.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'Ativo' | 'Inativo') => setFormData({ ...formData, status: value })}
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
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
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
                          <Link href={`/dashboard/permissoes?perfil=${perfil.id}`}>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              title="Gerenciar Permissões"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                          </Link>
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
      </div>
    </ProtectedRoute>
  )
}

