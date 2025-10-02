"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Shield } from "lucide-react"
import { CardLoader } from "@/components/ui/loader"

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Simular verificação de permissão de admin
    // Em uma implementação real, isso viria de um contexto de autenticação
    const checkAdminPermission = async () => {
      try {
        // Simular delay de verificação
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock: verificar se o usuário atual é admin
        // Em uma implementação real, isso seria verificado via API ou contexto
        const currentUserRole = localStorage.getItem('userRole') || 'funcionario_nivel_1'
        
        if (currentUserRole === 'admin') {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Erro ao verificar permissão de admin:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminPermission()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-96">
          <CardContent className="p-6">
            <CardLoader text="Verificando permissões..." />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Acesso Negado
                </h2>
                <p className="text-gray-600 mb-4">
                  Você não tem permissão para acessar esta área.
                </p>
                <p className="text-sm text-gray-500">
                  Apenas administradores podem gerenciar usuários do sistema.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
