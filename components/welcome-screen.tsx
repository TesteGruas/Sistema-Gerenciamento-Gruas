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
  Eye,
  User,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { usePermissions } from '@/hooks/use-permissions'

interface WelcomeScreenProps {
  user?: any
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user }) => {
  const { perfil, isAdmin, isManager, isSupervisor, isOperator, isViewer, isClient } = usePermissions()

  const getProfileInfo = () => {
    if (isAdmin()) {
      return {
        title: "Administrador",
        description: "Acesso completo ao sistema",
        icon: Shield,
        color: "bg-red-500",
        features: [
          "Dashboard completo",
          "Gestão de usuários",
          "Relatórios financeiros",
          "Configurações do sistema"
        ]
      }
    }
    
    if (isManager()) {
      return {
        title: "Gerente",
        description: "Acesso gerencial com restrições administrativas",
        icon: Building2,
        color: "bg-blue-500",
        features: [
          "Dashboard gerencial",
          "Gestão de equipe",
          "Relatórios operacionais",
          "Aprovações"
        ]
      }
    }
    
    if (isSupervisor()) {
      return {
        title: "Supervisor",
        description: "Supervisão de operações e equipe",
        icon: Users,
        color: "bg-green-500",
        features: [
          "Obras atribuídas",
          "Espelho de ponto da equipe",
          "Controle de gruas",
          "Assinatura de documentos"
        ]
      }
    }
    
    if (isOperator()) {
      return {
        title: "Operador",
        description: "Operação diária do sistema",
        icon: Clock,
        color: "bg-orange-500",
        features: [
          "Acesso ao app móvel",
          "Registro de ponto",
          "Documentos operacionais",
          "Assinatura digital"
        ]
      }
    }
    
    if (isViewer()) {
      return {
        title: "Visualizador",
        description: "Acesso somente leitura",
        icon: Eye,
        color: "bg-purple-500",
        features: [
          "Visualizar obras",
          "Visualizar gruas",
          "Documentos de consulta",
          "Relatórios básicos"
        ]
      }
    }
    
    if (isClient()) {
      return {
        title: "Cliente",
        description: "Acesso limitado para visualização de suas obras",
        icon: User,
        color: "bg-gray-500",
        features: [
          "Suas obras",
          "Documentos da obra",
          "Status dos projetos",
          "Comunicação com a equipe"
        ]
      }
    }
    
    return {
      title: "Usuário",
      description: "Acesso básico ao sistema",
      icon: User,
      color: "bg-gray-500",
      features: []
    }
  }

  const profileInfo = getProfileInfo()
  const IconComponent = profileInfo.icon

  const getAvailableModules = () => {
    const modules = []
    
    if (isAdmin() || isManager()) {
      modules.push(
        { name: "Dashboard", href: "/dashboard", icon: Building2 },
        { name: "Obras", href: "/dashboard/obras", icon: Building2 },
        { name: "Clientes", href: "/dashboard/clientes", icon: Users },
        { name: "Financeiro", href: "/dashboard/financeiro", icon: FileText },
        { name: "Relatórios", href: "/dashboard/relatorios", icon: FileText },
        { name: "Usuários", href: "/dashboard/usuarios", icon: Users }
      )
    } else if (isSupervisor()) {
      modules.push(
        { name: "Obras", href: "/dashboard/obras", icon: Building2 },
        { name: "Controle de Gruas", href: "/dashboard/gruas", icon: Building2 },
        { name: "Livros de Gruas", href: "/dashboard/livros-gruas", icon: FileText },
        { name: "Ponto Eletrônico", href: "/dashboard/ponto", icon: Clock },
        { name: "RH", href: "/dashboard/rh", icon: Users },
        { name: "Assinatura Digital", href: "/dashboard/assinatura", icon: FileText }
      )
    } else if (isOperator()) {
      modules.push(
        { name: "Obras", href: "/dashboard/obras", icon: Building2 },
        { name: "Assinatura Digital", href: "/dashboard/assinatura", icon: FileText }
      )
    } else if (isViewer()) {
      modules.push(
        { name: "Obras", href: "/dashboard/obras", icon: Building2 },
        { name: "Livros de Gruas", href: "/dashboard/livros-gruas", icon: FileText }
      )
    } else if (isClient()) {
      modules.push(
        { name: "Minhas Obras", href: "/dashboard/obras", icon: Building2 },
        { name: "Documentos", href: "/dashboard/documentos", icon: FileText }
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
                    <Badge variant="secondary">{perfil?.nivel_acesso || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={perfil?.status === 'Ativo' ? 'default' : 'secondary'}>
                      {perfil?.status || 'N/A'}
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
