'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Monitor, 
  Smartphone, 
  Eye, 
  Settings, 
  ArrowRight,
  Clock,
  CheckCircle,
  Users,
  TrendingUp
} from 'lucide-react'

// Verificar se está em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location.hostname === 'localhost')

export default function NavegacaoTestePage() {
  // Redirecionar em produção
  if (typeof window !== 'undefined' && !isDevelopment) {
    window.location.href = '/dashboard'
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 Sistema de Aprovação de Horas Extras
          </h1>
          <p className="text-lg text-gray-600">
            Navegação para páginas de teste e demonstração
          </p>
          <Badge variant="outline" className="text-sm">
            Versão de Desenvolvimento
          </Badge>
        </div>

        {/* Páginas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Dashboard de Aprovações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Interface completa para gestores e supervisores gerenciarem aprovações de horas extras.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Funcionalidades:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visualizar todas as aprovações</li>
                  <li>• Aprovar/rejeitar com assinatura digital</li>
                  <li>• Filtros avançados</li>
                  <li>• Estatísticas em tempo real</li>
                  <li>• Sistema de tabs por status</li>
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="default">Implementado</Badge>
                <Link href="/dashboard/aprovacoes-horas-extras">
                  <Button className="flex items-center gap-2">
                    Acessar Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* PWA */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                PWA Mobile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Aplicativo mobile para funcionários acompanharem suas aprovações de horas extras.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Funcionalidades:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visualizar aprovações pessoais</li>
                  <li>• Acompanhar status em tempo real</li>
                  <li>• Interface mobile otimizada</li>
                  <li>• Notificações de status</li>
                  <li>• Histórico completo</li>
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="default">Implementado</Badge>
                <Link href="/pwa/aprovacoes">
                  <Button className="flex items-center gap-2">
                    Acessar PWA
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Página de Demonstração */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Página de Demonstração Completa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Página única que demonstra todas as funcionalidades implementadas com dados mockados.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Inclui:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Visualização simulada do Dashboard</li>
                <li>• Visualização simulada do PWA</li>
                <li>• Estatísticas gerais do sistema</li>
                <li>• Lista de funcionalidades implementadas</li>
                <li>• Dados mockados utilizados</li>
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="default">Demonstração</Badge>
              <Link href="/teste-aprovacoes">
                <Button className="flex items-center gap-2">
                  Ver Demonstração
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Estatísticas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">5</p>
                <p className="text-sm text-gray-600">Aprovações Mockadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">2</p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">1</p>
                <p className="text-sm text-gray-600">Aprovadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">8.5h</p>
                <p className="text-sm text-gray-600">Horas Extras</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Componentes Criados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Componentes Implementados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Componentes Principais:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code>CardAprovacao</code> - Card de aprovação com ações</li>
                  <li>• <code>FiltrosAprovacoes</code> - Sistema de filtros avançados</li>
                  <li>• <code>EstatisticasAprovacoes</code> - Dashboard de estatísticas</li>
                  <li>• <code>SignaturePad</code> - Componente de assinatura (existente)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Páginas:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dashboard de Aprovações</li>
                  <li>• PWA Mobile</li>
                  <li>• Página de Demonstração</li>
                  <li>• Navegação de Teste</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                i
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Como Testar</h4>
                <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Acesse a <strong>Página de Demonstração</strong> para ver todas as funcionalidades</li>
                  <li>Use o <strong>Dashboard</strong> para simular a experiência de um gestor</li>
                  <li>Teste o <strong>PWA</strong> para ver a interface mobile</li>
                  <li>Experimente os filtros, assinatura digital e navegação entre tabs</li>
                  <li>Todos os dados são mockados para demonstração</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
