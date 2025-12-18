"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Shield } from "lucide-react"
import { CardLoader } from "@/components/ui/loader"
import { usePermissions } from "@/hooks/use-permissions"

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const { hasPermission, loading: permissionsLoading, isAdmin } = usePermissions()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Aguardar carregamento das permissões
    setIsLoading(permissionsLoading)
  }, [permissionsLoading])
  
  // Verificar se é admin usando o hook de permissões
  const userIsAdmin = isAdmin() || hasPermission('*') || hasPermission('usuarios:*')

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

  if (!isLoading && !userIsAdmin) {
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
