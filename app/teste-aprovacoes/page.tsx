'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SignaturePad } from '@/components/signature-pad'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Monitor, 
  Smartphone, 
  Eye, 
  Settings, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  AlertTriangle,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Check,
  X
} from 'lucide-react'
import { formatarData, formatarTempoRelativo } from '@/lib/utils-aprovacoes'

// AVISO: Esta página é apenas para testes e desenvolvimento
// Em produção, esta página deve ser removida ou protegida com verificação de ambiente

// Verificar se está em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location.hostname === 'localhost')

const mockAprovacoes: any[] = []
const mockNotificacoes: any[] = []
type AprovacaoHorasExtras = any

export default function TesteAprovacoesPage() {
  // Redirecionar em produção
  if (typeof window !== 'undefined' && !isDevelopment) {
    window.location.href = '/dashboard'
    return null
  }
  const [activeView, setActiveView] = useState<'dashboard' | 'pwa'>('dashboard');
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showRejeitar, setShowRejeitar] = useState(false);
  const [aprovacaoSelecionada, setAprovacaoSelecionada] = useState<AprovacaoHorasExtras | null>(null);
  const [observacoesRejeicao, setObservacoesRejeicao] = useState('');

  const estatisticas = {
    total: mockAprovacoes.length,
    pendentes: mockAprovacoes.filter(a => a.status === 'pendente').length,
    aprovadas: mockAprovacoes.filter(a => a.status === 'aprovado').length,
    rejeitadas: mockAprovacoes.filter(a => a.status === 'rejeitado').length,
    canceladas: mockAprovacoes.filter(a => a.status === 'cancelado').length,
    horasExtras: mockAprovacoes.reduce((acc, a) => acc + a.horas_extras, 0),
    funcionarios: new Set(mockAprovacoes.map(a => a.funcionario_id)).size
  };

  const notificacoesNaoLidas = mockNotificacoes.filter(n => !n.lida).length;

  const handleAprovar = (aprovacao: AprovacaoHorasExtras) => {
    setAprovacaoSelecionada(aprovacao);
    setShowAssinatura(true);
  };

  const handleRejeitar = (aprovacao: AprovacaoHorasExtras) => {
    setAprovacaoSelecionada(aprovacao);
    setShowRejeitar(true);
  };

  const handleAssinaturaConfirmada = (assinatura: string) => {
    console.log('Aprovando horas extras:', aprovacaoSelecionada?.id, 'Assinatura:', assinatura);
    setShowAssinatura(false);
    setAprovacaoSelecionada(null);
    // Simular notificação de sucesso
    alert(`✅ Horas extras aprovadas com sucesso!\n\nFuncionário: ${aprovacaoSelecionada?.funcionario.nome}\nHoras: ${aprovacaoSelecionada?.horas_extras}h\nAssinatura: ${assinatura.substring(0, 50)}...`);
  };

  const handleRejeicaoConfirmada = () => {
    console.log('Rejeitando horas extras:', aprovacaoSelecionada?.id, 'Observações:', observacoesRejeicao);
    setShowRejeitar(false);
    setObservacoesRejeicao('');
    setAprovacaoSelecionada(null);
    // Simular notificação de sucesso
    alert(`❌ Horas extras rejeitadas!\n\nFuncionário: ${aprovacaoSelecionada?.funcionario.nome}\nMotivo: ${observacoesRejeicao}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 Sistema de Aprovação de Horas Extras
          </h1>
          <p className="text-lg text-gray-600">
            Demonstração das funcionalidades implementadas
          </p>
          <Badge variant="outline" className="text-sm">
            Versão de Teste - Dados Mockados
          </Badge>
        </div>

        {/* Estatísticas Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resumo Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estatisticas.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{estatisticas.pendentes}</p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estatisticas.aprovadas}</p>
                <p className="text-sm text-gray-600">Aprovadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{estatisticas.rejeitadas}</p>
                <p className="text-sm text-gray-600">Rejeitadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{estatisticas.canceladas}</p>
                <p className="text-sm text-gray-600">Canceladas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{estatisticas.horasExtras.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Horas Extras</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{estatisticas.funcionarios}</p>
                <p className="text-sm text-gray-600">Funcionários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seletor de Visualização */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={activeView === 'dashboard' ? 'default' : 'outline'}
                onClick={() => setActiveView('dashboard')}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Dashboard (Gestores/Supervisores)
              </Button>
              <Button
                variant={activeView === 'pwa' ? 'default' : 'outline'}
                onClick={() => setActiveView('pwa')}
                className="flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                PWA (Funcionários)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visualização Dashboard */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Dashboard de Aprovações - Gestores/Supervisores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simulação da página de aprovações */}
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  {/* Header simulado */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">Aprovações de Horas Extras</h2>
                      <p className="text-gray-600">Gerencie as aprovações de horas extras dos funcionários</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                      { label: 'Pendentes', value: estatisticas.pendentes, color: 'orange' },
                      { label: 'Aprovadas', value: estatisticas.aprovadas, color: 'green' },
                      { label: 'Rejeitadas', value: estatisticas.rejeitadas, color: 'red' },
                      { label: 'Canceladas', value: estatisticas.canceladas, color: 'gray' },
                      { label: 'Vencidas', value: 1, color: 'red' },
                      { label: 'Funcionários', value: estatisticas.funcionarios, color: 'blue' }
                    ].map((stat, index) => (
                      <div key={index} className="text-center p-3 bg-gray-50 rounded">
                        <p className={`text-xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Filtros simulados */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filtros:</span>
                    <Badge variant="outline">Status: Pendente</Badge>
                    <Badge variant="outline">Obra: Centro</Badge>
                    <Badge variant="outline">Período: Últimos 30 dias</Badge>
                  </div>

                  {/* Tabs simuladas */}
                  <Tabs defaultValue="pendentes">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="pendentes" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pendentes
                        <Badge variant="secondary">{estatisticas.pendentes}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="aprovadas" className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Aprovadas
                        <Badge variant="default">{estatisticas.aprovadas}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="rejeitadas" className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Rejeitadas
                        <Badge variant="destructive">{estatisticas.rejeitadas}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="canceladas" className="flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        Canceladas
                        <Badge variant="outline">{estatisticas.canceladas}</Badge>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pendentes" className="space-y-3 mt-4">
                      {mockAprovacoes.filter(a => a.status === 'pendente').map(aprovacao => (
                        <div key={aprovacao.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-orange-600" />
                              <div>
                                <h3 className="font-semibold">{aprovacao.funcionario.nome}</h3>
                                <p className="text-sm text-gray-600">{aprovacao.funcionario.cargo}</p>
                              </div>
                            </div>
                            <Badge className="bg-orange-50 text-orange-600 border-orange-200">
                              PENDENTE
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Data:</span>
                              <p className="font-medium">{formatarData(aprovacao.data_trabalho)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Horas Extras:</span>
                              <p className="font-bold text-orange-600">{aprovacao.horas_extras}h</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Período:</span>
                              <p className="font-medium">{aprovacao.registro.entrada} - {aprovacao.registro.saida}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Obra:</span>
                              <p className="font-medium">{aprovacao.funcionario.obra}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAprovar(aprovacao)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRejeitar(aprovacao)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Visualização PWA */}
        {activeView === 'pwa' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  PWA - Aplicativo Mobile para Funcionários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simulação da interface PWA */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  {/* Header PWA */}
                  <div className="bg-white border-b p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Button variant="ghost" size="sm" className="p-0">
                        ←
                      </Button>
                      <h2 className="text-lg font-bold">Minhas Aprovações</h2>
                    </div>
                    <p className="text-sm text-gray-600">Acompanhe o status das suas horas extras</p>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Resumo */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-xl font-bold text-orange-600">2.5h</p>
                          <p className="text-sm text-gray-600">Horas Extras</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-blue-600">2</p>
                          <p className="text-sm text-gray-600">Solicitações</p>
                        </div>
                      </div>
                    </div>

                    {/* Tabs PWA */}
                    <Tabs defaultValue="todas">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="todas" className="text-xs">Todas (2)</TabsTrigger>
                        <TabsTrigger value="pendentes" className="text-xs">Pendentes (1)</TabsTrigger>
                        <TabsTrigger value="aprovadas" className="text-xs">Aprovadas (1)</TabsTrigger>
                        <TabsTrigger value="outras" className="text-xs">Outras (0)</TabsTrigger>
                      </TabsList>

                      <TabsContent value="todas" className="space-y-3 mt-4">
                        {/* Aprovação Pendente */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-orange-600" />
                              <div>
                                <h3 className="font-semibold">15/01/2024</h3>
                                <p className="text-sm text-gray-600">08:00 - 18:30</p>
                              </div>
                            </div>
                            <Badge className="bg-orange-50 text-orange-600 border-orange-200">
                              AGUARDANDO
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Horas Extras:</span>
                              <span className="font-bold text-orange-600">2.5h</span>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded p-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <span className="text-xs text-orange-800 font-medium">
                                  Aguardando aprovação do supervisor
                                </span>
                              </div>
                              <p className="text-xs text-orange-700 mt-1">
                                Prazo limite: 22/01/2024 18:30
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Aprovação Aprovada */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div>
                                <h3 className="font-semibold">14/01/2024</h3>
                                <p className="text-sm text-gray-600">08:00 - 17:00</p>
                              </div>
                            </div>
                            <Badge className="bg-green-50 text-green-600 border-green-200">
                              APROVADO
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Horas Extras:</span>
                              <span className="font-bold text-green-600">1.0h</span>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded p-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-800 font-medium">
                                  Aprovado por Maria Santos
                                </span>
                              </div>
                              <p className="text-xs text-green-700 mt-1">
                                Em 15/01/2024 09:30
                              </p>
                            </div>
                            <div className="bg-blue-50 rounded p-2">
                              <p className="text-xs text-blue-700">
                                <strong>Observações:</strong> Aprovado conforme necessidade da obra
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Informações */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <div>
                          <h4 className="font-semibold text-blue-800 text-sm">Informações</h4>
                          <p className="text-blue-700 text-xs">
                            Última atualização: {formatarTempoRelativo(new Date().toISOString())}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Funcionalidades Implementadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Funcionalidades Implementadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  titulo: 'Dashboard de Aprovações',
                  descricao: 'Interface completa para gestores aprovarem horas extras',
                  status: 'Implementado',
                  cor: 'green'
                },
                {
                  titulo: 'Assinatura Digital',
                  descricao: 'Componente de assinatura obrigatória para aprovações',
                  status: 'Implementado',
                  cor: 'green'
                },
                {
                  titulo: 'Sistema de Filtros',
                  descricao: 'Filtros por status, funcionário, obra e período',
                  status: 'Implementado',
                  cor: 'green'
                },
                {
                  titulo: 'PWA Mobile',
                  descricao: 'Interface mobile para funcionários acompanharem aprovações',
                  status: 'Implementado',
                  cor: 'green'
                },
                {
                  titulo: 'Notificações',
                  descricao: 'Sistema de notificações automáticas',
                  status: 'Mockado',
                  cor: 'yellow'
                },
                {
                  titulo: 'Cancelamento Automático',
                  descricao: 'Job para cancelar aprovações vencidas',
                  status: 'Planejado',
                  cor: 'blue'
                },
                {
                  titulo: 'Relatórios',
                  descricao: 'Relatórios e exportação de dados',
                  status: 'Planejado',
                  cor: 'blue'
                },
                {
                  titulo: 'API Backend',
                  descricao: 'Endpoints para CRUD de aprovações',
                  status: 'Planejado',
                  cor: 'blue'
                },
                {
                  titulo: 'Banco de Dados',
                  descricao: 'Tabelas para aprovações e notificações',
                  status: 'Planejado',
                  cor: 'blue'
                }
              ].map((func, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{func.titulo}</h3>
                    <Badge 
                      variant={func.cor === 'green' ? 'default' : func.cor === 'yellow' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {func.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{func.descricao}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links para Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Links para Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Dashboard (Gestores/Supervisores)</h3>
                <div className="space-y-1">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Monitor className="w-4 h-4 mr-2" />
                    /dashboard/aprovacoes-horas-extras
                  </Button>
                  <p className="text-xs text-gray-600">
                    Interface completa com filtros, estatísticas e ações de aprovação
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">PWA (Funcionários)</h3>
                <div className="space-y-1">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Smartphone className="w-4 h-4 mr-2" />
                    /pwa/aprovacoes
                  </Button>
                  <p className="text-xs text-gray-600">
                    Interface mobile para funcionários acompanharem suas aprovações
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Mockados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Dados Mockados Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Aprovações de Horas Extras</h3>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <p><strong>Total:</strong> {mockAprovacoes.length} aprovações</p>
                  <p><strong>Funcionários:</strong> João Silva, Pedro Costa, Ana Oliveira, Roberto Lima</p>
                  <p><strong>Status:</strong> Pendente, Aprovado, Rejeitado, Cancelado</p>
                  <p><strong>Período:</strong> 10/01/2024 a 15/01/2024</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Notificações</h3>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <p><strong>Total:</strong> {mockNotificacoes.length} notificações</p>
                  <p><strong>Não lidas:</strong> {notificacoesNaoLidas} notificações</p>
                  <p><strong>Tipos:</strong> Nova aprovação, Aprovado, Rejeitado, Cancelado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Assinatura */}
        <Dialog open={showAssinatura} onOpenChange={setShowAssinatura}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Aprovar Horas Extras</DialogTitle>
              <DialogDescription>
                Assine digitalmente para aprovar as horas extras de <strong>{aprovacaoSelecionada?.funcionario.nome}</strong>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Resumo da aprovação */}
              {aprovacaoSelecionada && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Resumo da Aprovação</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Funcionário:</span>
                      <p className="font-medium">{aprovacaoSelecionada.funcionario.nome}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Data:</span>
                      <p className="font-medium">{formatarData(aprovacaoSelecionada.data_trabalho)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Horas Extras:</span>
                      <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Período:</span>
                      <p className="font-medium">{aprovacaoSelecionada.registro.entrada} - {aprovacaoSelecionada.registro.saida}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Componente de assinatura */}
              <SignaturePad
                title="Assinatura do Supervisor"
                description="Sua assinatura confirma a aprovação das horas extras"
                onSave={handleAssinaturaConfirmada}
                onCancel={() => setShowAssinatura(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Rejeição */}
        <Dialog open={showRejeitar} onOpenChange={setShowRejeitar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Horas Extras</DialogTitle>
              <DialogDescription>
                Informe o motivo da rejeição das horas extras de <strong>{aprovacaoSelecionada?.funcionario.nome}</strong>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Resumo da rejeição */}
              {aprovacaoSelecionada && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Resumo da Rejeição</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Funcionário:</span>
                      <p className="font-medium">{aprovacaoSelecionada.funcionario.nome}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Data:</span>
                      <p className="font-medium">{formatarData(aprovacaoSelecionada.data_trabalho)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Horas Extras:</span>
                      <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Período:</span>
                      <p className="font-medium">{aprovacaoSelecionada.registro.entrada} - {aprovacaoSelecionada.registro.saida}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo de observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Rejeição *
                </label>
                <Textarea
                  placeholder="Descreva o motivo da rejeição das horas extras..."
                  value={observacoesRejeicao}
                  onChange={(e) => setObservacoesRejeicao(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRejeitar(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleRejeicaoConfirmada}
                  disabled={!observacoesRejeicao.trim()}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar Horas Extras
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
