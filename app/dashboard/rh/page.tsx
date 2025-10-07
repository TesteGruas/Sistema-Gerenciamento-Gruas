"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Building2,
  Shield,
  Edit,
  Trash2,
  Eye,
  Loader2
} from "lucide-react"
import { apiRH } from "@/lib/api-rh"
import { useToast } from "@/hooks/use-toast"

interface FuncionarioRH {
  id: number
  nome: string
  cpf: string
  cargo: string
  departamento: string
  salario: number
  data_admissao: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Demitido'
  turno?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral'
  obra_atual_id?: number
  created_at: string
  updated_at: string
  usuario?: {
    id: number
    nome: string
    email: string
    status: string
  }
  obra_atual?: {
    id: number
    nome: string
    status: string
    cliente: {
      nome: string
    }
  }
}

export default function RHPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDepartamento, setSelectedDepartamento] = useState("all")
  const [funcionarios, setFuncionarios] = useState<FuncionarioRH[]>([])
  const [loading, setLoading] = useState(true)
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const { toast } = useToast()

  // Carregar dados iniciais
  useEffect(() => {
    carregarFuncionarios()
    carregarEstatisticas()
  }, [])

  const carregarFuncionarios = async () => {
    try {
      setLoading(true)
      const response = await apiRH.listarFuncionarios({
        page: 1,
        limit: 100
      })
      setFuncionarios(response.data)
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarEstatisticas = async () => {
    try {
      const stats = await apiRH.obterEstatisticas()
      setEstatisticas(stats)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = (funcionario.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (funcionario.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || funcionario.status === selectedStatus
    const matchesDepartamento = selectedDepartamento === "all" || funcionario.departamento === selectedDepartamento
    
    return matchesSearch && matchesStatus && matchesDepartamento
  })

  const getCargoColor = (cargo: string) => {
    switch (cargo.toLowerCase()) {
      case 'operador': return 'bg-blue-100 text-blue-800'
      case 'sinaleiro': return 'bg-green-100 text-green-800'
      case 'técnico manutenção': return 'bg-purple-100 text-purple-800'
      case 'supervisor': return 'bg-orange-100 text-orange-800'
      case 'mecânico': return 'bg-yellow-100 text-yellow-800'
      case 'engenheiro': return 'bg-indigo-100 text-indigo-800'
      case 'chefe de obras': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCargoIcon = (cargo: string) => {
    switch (cargo.toLowerCase()) {
      case 'operador': return <Users className="w-4 h-4" />
      case 'sinaleiro': return <UserCheck className="w-4 h-4" />
      case 'técnico manutenção': return <Building2 className="w-4 h-4" />
      case 'supervisor': return <Shield className="w-4 h-4" />
      case 'mecânico': return <Building2 className="w-4 h-4" />
      case 'engenheiro': return <Building2 className="w-4 h-4" />
      case 'chefe de obras': return <Shield className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800'
      case 'Inativo': return 'bg-gray-100 text-gray-800'
      case 'Afastado': return 'bg-yellow-100 text-yellow-800'
      case 'Demitido': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo': return <UserCheck className="w-4 h-4" />
      case 'Inativo': return <UserX className="w-4 h-4" />
      case 'Afastado': return <UserX className="w-4 h-4" />
      case 'Demitido': return <UserX className="w-4 h-4" />
      default: return <UserX className="w-4 h-4" />
    }
  }

  const handleViewDetails = (funcionario: FuncionarioRH) => {
    window.location.href = `/dashboard/rh/${funcionario.id}`
  }

  const handleEdit = (funcionario: FuncionarioRH) => {
    window.location.href = `/dashboard/rh/${funcionario.id}/edit`
  }

  const stats = [
    { 
      title: "Total de Funcionários", 
      value: funcionarios.length, 
      icon: Users, 
      color: "bg-blue-500" 
    },
    { 
      title: "Funcionários Ativos", 
      value: funcionarios.filter(f => f.status === 'Ativo').length, 
      icon: UserCheck, 
      color: "bg-green-500" 
    },
    { 
      title: "Departamentos", 
      value: estatisticas ? Object.keys(estatisticas.por_departamento).length : 0, 
      icon: Building2, 
      color: "bg-purple-500" 
    },
    { 
      title: "Em Obras", 
      value: funcionarios.filter(f => f.obra_atual_id).length, 
      icon: Shield, 
      color: "bg-orange-500" 
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="text-gray-600">Gerenciamento de usuários e permissões</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/dashboard/usuarios'}
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar usuários</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                  <SelectItem value="Demitido">Demitido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {Array.from(new Set(funcionarios.map(f => f.departamento))).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setSelectedStatus("all")
                  setSelectedDepartamento("all")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionários ({filteredFuncionarios.length})</CardTitle>
          <CardDescription>Lista de todos os funcionários do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Obra Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{funcionario.nome}</div>
                        <div className="text-sm text-gray-500">{funcionario.email || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCargoColor(funcionario.cargo)}>
                        {getCargoIcon(funcionario.cargo)}
                        <span className="ml-1">{funcionario.cargo}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {funcionario.departamento}
                    </TableCell>
                    <TableCell>
                      {funcionario.obra_atual?.obra.nome || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(funcionario.status)}>
                        {getStatusIcon(funcionario.status)}
                        <span className="ml-1">{funcionario.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(funcionario)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(funcionario)}
                        >
                          <Edit className="w-4 h-4" />
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
  )
}
