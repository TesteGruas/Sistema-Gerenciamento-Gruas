"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Smartphone, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  Wifi,
  WifiOff,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PWALoginPage() {
  const [formData, setFormData] = useState({
    usuario: "",
    senha: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      setIsOnline(navigator.onLine)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simular autenticação (em produção, isso seria uma chamada real à API)
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (formData.usuario === "admin" && formData.senha === "123456") {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema IRBANA PWA",
          variant: "default"
        })
        router.push("/pwa/ponto")
      } else if (formData.usuario === "operador" && formData.senha === "123456") {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema IRBANA PWA",
          variant: "default"
        })
        router.push("/pwa/ponto")
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Verifique seu usuário e senha",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">IRBANA PWA</h1>
          <p className="text-gray-600">Sistema de Ponto e Assinatura</p>
        </div>

        {/* Status de conexão */}
        <div className="mb-6">
          <Alert className={isOnline ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription className={isOnline ? "text-green-800" : "text-red-800"}>
                {isOnline ? "Conectado" : "Desconectado - Modo offline"}
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Formulário de login */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="usuario"
                    name="usuario"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={formData.usuario}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="senha"
                    name="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !isOnline}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informações de teste */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Credenciais de Teste</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Admin:</strong> usuario: admin | senha: 123456</p>
              <p><strong>Operador:</strong> usuario: operador | senha: 123456</p>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades do PWA */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Ponto Eletrônico</h3>
              <p className="text-xs text-gray-500">Registre sua entrada e saída</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <User className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Assinatura Digital</h3>
              <p className="text-xs text-gray-500">Assine documentos digitalmente</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Sistema IRBANA - Versão PWA</p>
          <p>Funciona offline após o primeiro acesso</p>
        </div>
      </div>
    </div>
  )
}
