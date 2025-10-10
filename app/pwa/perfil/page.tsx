"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  Calendar,
  MapPin,
  LogOut,
  Edit,
  Save,
  X,
  Camera,
  Clock,
  FileText,
  CheckCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { usePWAUser } from "@/hooks/use-pwa-user"

export default function PWAPerfilPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, pontoHoje, documentosPendentes, horasTrabalhadas, loading } = usePWAUser()
  
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    telefone: '',
    email: ''
  })

  useEffect(() => {
    if (user) {
      setUserData({
        telefone: (user as any).telefone || '',
        email: (user as any).email || ''
      })
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('refresh_token')
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    })
    
    router.push('/pwa/login')
  }

  const handleSave = async () => {
    try {
      // Aqui você faria a chamada para a API para atualizar os dados
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram salvas com sucesso",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar os dados",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Não foi possível carregar os dados do perfil</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      {/* Foto e Informações Principais */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Foto de Perfil */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <button 
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700"
                title="Alterar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Informações */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{user.nome}</h2>
              <p className="text-gray-600 mb-2">{user.cargo}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
                <Badge variant="outline">
                  ID: {user.id}
                </Badge>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas Hoje</p>
                <p className="text-lg font-bold text-gray-900">{horasTrabalhadas}</p>
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
                <p className="text-sm text-gray-600">Status Ponto</p>
                <p className="text-lg font-bold text-green-600">
                  {pontoHoje?.entrada ? 'Registrado' : 'Pendente'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Documentos</p>
                <p className="text-lg font-bold text-orange-600">{documentosPendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informações de contato e identificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                E-mail
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-900">{userData.email || 'Não informado'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="telefone">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </Label>
              {isEditing ? (
                <Input
                  id="telefone"
                  type="tel"
                  value={userData.telefone}
                  onChange={(e) => setUserData({...userData, telefone: e.target.value})}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-900">{userData.telefone || 'Não informado'}</p>
              )}
            </div>

            <div>
              <Label>
                <Briefcase className="w-4 h-4 inline mr-2" />
                Cargo
              </Label>
              <p className="mt-1 text-gray-900">{user.cargo}</p>
            </div>

            <div>
              <Label>
                <Calendar className="w-4 h-4 inline mr-2" />
                Data de Admissão
              </Label>
              <p className="mt-1 text-gray-900">
                {(user as any).dataAdmissao 
                  ? new Date((user as any).dataAdmissao).toLocaleDateString('pt-BR')
                  : 'Não informado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ponto Hoje */}
      {pontoHoje && (
        <Card>
          <CardHeader>
            <CardTitle>Registro de Ponto Hoje</CardTitle>
            <CardDescription>Horários registrados no dia de hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Entrada</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.entrada 
                    ? new Date(pontoHoje.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Saída Almoço</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.saida_almoco 
                    ? new Date(pontoHoje.saida_almoco).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Volta Almoço</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.volta_almoco 
                    ? new Date(pontoHoje.volta_almoco).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Saída</Label>
                <p className="font-medium text-gray-900">
                  {pontoHoje.saida 
                    ? new Date(pontoHoje.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Logout */}
      <Card className="border-red-200">
        <CardContent className="p-6">
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair do Aplicativo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

