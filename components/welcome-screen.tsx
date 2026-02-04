"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  FileText, 
  Clock, 
  Shield, 
  User,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { usePermissions } from '@/hooks/use-permissions'

interface WelcomeScreenProps {
  user?: any
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user }) => {
  const { perfil, isAdmin, isManager, isOperator, isClient, level, userRole } = usePermissions()

  const getProfileInfo = () => {
    if (isAdmin()) {
      return {
        title: "Admin",
        description: "Acesso completo ao sistema (Nível 10)",
        icon: Shield,
        color: "bg-red-500",
        features: [
          "Dashboard completo",
          "Gestão de usuários",
          "Configurações do sistema",
          "Relatórios financeiros",
          "RH e folha de pagamento",
          "Todas as funcionalidades"
        ]
      }
    }
    
    if (isManager()) {
      return {
        title: "Gestores",
        description: "Acesso gerencial completo (Nível 9)",
        icon: Building2,
        color: "bg-blue-500",
        features: [
          "Dashboard gerencial",
          "Gestão de equipe",
          "Relatórios completos",
          "Financeiro e RH",
          "Aprovações e validações",
          "Clientes e obras"
        ]
      }
    }
    
    if (isOperator()) {
      return {
        title: "Operários",
        description: "Operação diária via APP (Nível 4)",
        icon: Clock,
        color: "bg-orange-500",
        features: [
          "Registro de ponto",
          "Espelho de ponto",
          "Visualização de documentos",
          "Assinatura digital",
          "Notificações",
          "Acesso via PWA/Mobile"
        ]
      }
    }
    
    if (isClient()) {
      return {
        title: "Clientes",
        description: "Acesso limitado (Nível 1)",
        icon: User,
        color: "bg-gray-500",
        features: [
          "Visualizar documentos",
          "Assinar documentos",
          "Acompanhar obras",
          "Notificações",
          "Comunicação"
        ]
      }
    }
    
    return {
      title: "Usuário",
      description: "Acesso básico ao sistema",
      icon: User,
      color: "bg-gray-500",
      features: ["Entre em contato com o administrador para atribuição de perfil"]
    }
  }

  const profileInfo = getProfileInfo()
  const IconComponent = profileInfo.icon

  const getAvailableModules = () => {
    const modules = []
    
    if (isAdmin() || isManager()) {
      modules.push(
        { name: "Dashboard", href: "/dashboard", icon: Building2 },
        { name: "Usuários", href: "/dashboard/usuarios", icon: Users },
        { name: "Gruas", href: "/dashboard/gruas", icon: Building2 },
        { name: "Obras", href: "/dashboard/obras", icon: Building2 },
        { name: "Ponto Eletrônico", href: "/dashboard/ponto-eletronico", icon: Clock },
        { name: "Documentos", href: "/dashboard/documentos", icon: FileText },
        { name: "Estoque", href: "/dashboard/estoque", icon: FileText },
        { name: "Financeiro", href: "/dashboard/financeiro", icon: FileText },
        { name: "RH", href: "/dashboard/rh", icon: Users },
        { name: "Relatórios", href: "/dashboard/relatorios", icon: FileText }
      )
    } else if (isClient()) {
      modules.push(
        { name: "Dashboard", href: "/dashboard", icon: Building2 },
        { name: "Gruas", href: "/dashboard/gruas", icon: Building2 },
        { name: "Obras", href: "/dashboard/obras", icon: Building2 },
        { name: "Ponto Eletrônico", href: "/dashboard/ponto-eletronico", icon: Clock },
        { name: "Documentos", href: "/dashboard/documentos", icon: FileText },
        { name: "Livros de Gruas", href: "/dashboard/livros-gruas", icon: FileText },
        { name: "Estoque", href: "/dashboard/estoque", icon: FileText }
      )
    } else if (isOperator()) {
      modules.push(
        { name: "App Móvel (PWA)", href: "/pwa", icon: Clock },
        { name: "Ponto Eletrônico", href: "/pwa/ponto", icon: Clock },
        { name: "Documentos", href: "/pwa/documentos", icon: FileText }
      )
    } else if (isClient()) {
      modules.push(
        { name: "Documentos", href: "/pwa/documentos", icon: FileText },
        { name: "Minhas Obras", href: "/dashboard/obras", icon: Building2 }
      )
    }
    
    return modules
  }

  const availableModules = getAvailableModules()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full ${profileInfo.color} text-white mr-4`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo à Irbana
              </h1>
              <p className="text-lg text-gray-600">
                Sistema de Gestão de Gruas
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${profileInfo.color} text-white`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{profileInfo.title}</CardTitle>
                <CardDescription className="text-base">
                  {profileInfo.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Recursos Disponíveis:</h4>
                <ul className="space-y-1">
                  {profileInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informações do Perfil:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nível de Acesso:</span>
                    <Badge variant="secondary">{level || perfil?.nivel_acesso || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <Badge variant="default">
                      {userRole || 'Não definido'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={perfil?.status === 'Ativo' ? 'default' : 'secondary'}>
                      {perfil?.status || 'Ativo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Módulos Disponíveis</CardTitle>
            <CardDescription>
              Acesse os módulos permitidos para seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableModules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableModules.map((module, index) => (
                  <Link key={index} href={module.href}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <module.icon className="w-8 h-8 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">{module.name}</h3>
                            <p className="text-sm text-gray-600">Acessar módulo</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Nenhum módulo disponível para seu perfil atual.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Entre em contato com o administrador para solicitar acesso.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Sistema de Gestão de Gruas - Irbana</p>
          <p>Para suporte, entre em contato com o administrador do sistema.</p>
        </div>
      </div>
    </div>
  )
}
