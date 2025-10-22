"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Briefcase,
  DollarSign,
  Users,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useCargos } from "@/hooks/use-cargos"
import { CreateCargoDialog } from "@/components/create-cargo-dialog"
import { EditCargoDialog } from "@/components/edit-cargo-dialog"
import { useToast } from "@/hooks/use-toast"
import { cargosApi, type Cargo } from "@/lib/api/cargos-api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CargosPage() {
  const { cargos, loading, error, carregarCargos } = useCargos()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [nivelFilter, setNivelFilter] = useState<string>("todos")
  const [statusFilter, setStatusFilter] = useState<string>("ativos")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Filtrar cargos
  const cargosFiltrados = cargos.filter(cargo => {
    const matchesSearch = cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cargo.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesNivel = nivelFilter === "todos" || cargo.nivel === nivelFilter
    
    const matchesStatus = statusFilter === "todos" || 
                         (statusFilter === "ativos" && cargo.ativo) ||
                         (statusFilter === "inativos" && !cargo.ativo)
    
    return matchesSearch && matchesNivel && matchesStatus
  })

  // Criar cargo
  const handleCreate = useCallback(async (data: any) => {
    try {
      setSubmitting(true)
      await cargosApi.criarCargo(data)
      
      toast({
        title: "Sucesso!",
        description: "Cargo criado com sucesso.",
      })
      
      setCreateDialogOpen(false)
      await carregarCargos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar cargo.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }, [carregarCargos, toast])

  // Editar cargo
  const handleEdit = useCallback(async (data: any) => {
    if (!selectedCargo) return
    
    try {
      setSubmitting(true)
      await cargosApi.atualizarCargo(selectedCargo.id, data)
      
      toast({
        title: "Sucesso!",
        description: "Cargo atualizado com sucesso.",
      })
      
      setEditDialogOpen(false)
      setSelectedCargo(null)
      await carregarCargos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cargo.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }, [selectedCargo, carregarCargos, toast])

  // Desativar cargo
  const handleDelete = useCallback(async () => {
    if (!selectedCargo) return
    
    try {
      setSubmitting(true)
      await cargosApi.deletarCargo(selectedCargo.id)
      
      toast({
        title: "Sucesso!",
        description: "Cargo desativado com sucesso.",
      })
      
      setDeleteDialogOpen(false)
      setSelectedCargo(null)
      await carregarCargos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar cargo.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }, [selectedCargo, carregarCargos, toast])

  // Reativar cargo
  const handleReactivate = useCallback(async (cargo: Cargo) => {
    try {
      await cargosApi.reativarCargo(cargo.id)
      
      toast({
        title: "Sucesso!",
        description: "Cargo reativado com sucesso.",
      })
      
      await carregarCargos()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao reativar cargo.",
        variant: "destructive",
      })
    }
  }, [carregarCargos, toast])

  // Formatar salário
  const formatarSalario = (valor?: number) => {
    if (!valor) return "Não definido"
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  // Badge de nível
  const getNivelBadge = (nivel: string) => {
    const colors: Record<string, string> = {
      'Operacional': 'bg-blue-100 text-blue-800',
      'Técnico': 'bg-green-100 text-green-800',
      'Supervisor': 'bg-yellow-100 text-yellow-800',
      'Gerencial': 'bg-purple-100 text-purple-800',
      'Diretoria': 'bg-red-100 text-red-800',
    }
    
    return (
      <Badge className={colors[nivel] || 'bg-gray-100 text-gray-800'}>
        {nivel}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8" />
            Gerenciamento de Cargos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os cargos do sistema de RH
          </p>
        </div>
        
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cargo
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Cargos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cargos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cargos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cargos.filter(c => c.ativo).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cargos Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cargos.filter(c => !c.ativo).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Níveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...new Set(cargos.map(c => c.nivel))].length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre os cargos por nome, nível ou status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={nivelFilter} onValueChange={setNivelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Níveis</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Gerencial">Gerencial</SelectItem>
                <SelectItem value="Diretoria">Diretoria</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativos">Apenas Ativos</SelectItem>
                <SelectItem value="inativos">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Cargos ({cargosFiltrados.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={carregarCargos}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && cargos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando cargos...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          ) : cargosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cargo encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Faixa Salarial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargosFiltrados.map((cargo) => (
                  <TableRow key={cargo.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cargo.nome}</div>
                        {cargo.descricao && (
                          <div className="text-sm text-muted-foreground">
                            {cargo.descricao}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getNivelBadge(cargo.nivel)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Min: {formatarSalario(cargo.salario_minimo)}</div>
                        <div>Máx: {formatarSalario(cargo.salario_maximo)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cargo.ativo ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCargo(cargo)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {cargo.ativo ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCargo(cargo)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(cargo)}
                          >
                            <RefreshCw className="w-4 h-4 text-green-600" />
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

      {/* Dialogs */}
      <CreateCargoDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        submitting={submitting}
      />

      {selectedCargo && (
        <EditCargoDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEdit}
          submitting={submitting}
          cargo={selectedCargo}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o cargo "{selectedCargo?.nome}"?
              <br /><br />
              O cargo não será excluído, apenas marcado como inativo e não aparecerá
              mais nos formulários de funcionários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

