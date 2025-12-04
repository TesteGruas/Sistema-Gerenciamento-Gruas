'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer, 
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  User,
  Eye,
  ExternalLink,
  CheckSquare,
  Loader2
} from 'lucide-react'
import { 
  apiAprovacoesHorasExtras,
  RegistroPontoAprovacao
} from '@/lib/api-aprovacoes-horas-extras'
import { useCurrentUser } from '@/hooks/use-current-user'
import { apiRegistrosPonto } from '@/lib/api-ponto-eletronico'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Funções utilitárias para formatação
function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR');
}

function formatarTempoRelativo(data: string): string {
  const agora = new Date();
  const dataComparacao = new Date(data);
  const diffMs = agora.getTime() - dataComparacao.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias === 0) return 'Hoje';
  if (diffDias === 1) return 'Ontem';
  if (diffDias < 7) return `${diffDias} dias atrás`;
  return formatarData(data);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Aprovado':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'Pendente Aprovação':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'Rejeitado':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

// Converter RegistroPontoAprovacao para formato compatível
interface AprovacaoDisplay {
  id: string;
  funcionario_id: string | number;
  data_trabalho: string;
  horas_extras: number;
  status: string;
  registro: {
    entrada: string;
    saida: string;
    horas_trabalhadas: number;
  };
  funcionario: {
    nome: string;
    cargo: string;
    obra: string;
  };
  supervisor?: {
    nome: string;
    cargo: string;
  };
  observacoes?: string;
  data_aprovacao?: string;
  data_limite?: string;
}

function converterParaDisplay(registro: RegistroPontoAprovacao): AprovacaoDisplay {
  return {
    id: registro.id,
    funcionario_id: registro.funcionario_id,
    data_trabalho: registro.data,
    horas_extras: registro.horas_extras,
    status: registro.status,
    registro: {
      entrada: registro.entrada || '08:00',
      saida: registro.saida || '17:00',
      horas_trabalhadas: registro.horas_trabalhadas || 0
    },
    funcionario: {
      nome: registro.funcionario?.nome || 'Funcionário',
      cargo: registro.funcionario?.cargo || 'Cargo',
      obra: registro.funcionario?.obra_atual_id?.toString() || 'Obra'
    },
    supervisor: registro.aprovador ? {
      nome: registro.aprovador.nome,
      cargo: 'Supervisor'
    } : undefined,
    observacoes: registro.observacoes,
    data_aprovacao: registro.data_aprovacao,
    data_limite: registro.created_at ? new Date(new Date(registro.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
  };
}

export default function PWAAprovacoesPage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useCurrentUser();
  const [aprovacoes, setAprovacoes] = useState<AprovacaoDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todas');
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [aprovacaoSelecionada, setAprovacaoSelecionada] = useState<AprovacaoDisplay | null>(null);

  // Carregar aprovações do funcionário logado
  useEffect(() => {
    const carregarAprovacoes = async () => {
      if (loadingUser || !user?.funcionario_id) return;
      
      setLoading(true);
      try {
        // Buscar registros com horas extras do funcionário atual
        const { data } = await apiRegistrosPonto.listar({
          funcionario_id: user.funcionario_id,
          status: 'Pendente Aprovação',
          limit: 100
        });
        
        // Converter para formato de display
        const aprovacoesConvertidas = data
          .filter(r => r.horas_extras && r.horas_extras > 0)
          .map(converterParaDisplay);
        
        setAprovacoes(aprovacoesConvertidas);
      } catch (error: any) {
        console.error('Erro ao carregar aprovações:', error);
        toast.error('Erro ao carregar aprovações de horas extras');
      } finally {
        setLoading(false);
      }
    };

    carregarAprovacoes();
  }, [user, loadingUser]);

  // Separar por status
  const pendentes = aprovacoes.filter(a => a.status === 'Pendente Aprovação');
  const aprovadas = aprovacoes.filter(a => a.status === 'Aprovado');
  const rejeitadas = aprovacoes.filter(a => a.status === 'Rejeitado');
  const canceladas: AprovacaoDisplay[] = []; // Canceladas não vêm da API atual

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (!user?.funcionario_id) return;
      
      const { data } = await apiRegistrosPonto.listar({
        funcionario_id: user.funcionario_id,
        limit: 100
      });
      
      const aprovacoesConvertidas = data
        .filter(r => r.horas_extras && r.horas_extras > 0)
        .map(converterParaDisplay);
      
      setAprovacoes(aprovacoesConvertidas);
    } catch (error: any) {
      toast.error('Erro ao atualizar aprovações');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalhes = (aprovacao: AprovacaoDisplay) => {
    // Se for aprovação pendente, vai direto para assinatura
    if (aprovacao.status === 'Pendente Aprovação') {
      router.push(`/pwa/aprovacao-assinatura?id=${aprovacao.id}`);
    } else {
      // Se for outro status, mostra detalhes
      setAprovacaoSelecionada(aprovacao);
      setShowDetalhes(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Pendente Aprovação':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'Rejeitado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'Aprovado';
      case 'Pendente Aprovação':
        return 'Aguardando Aprovação';
      case 'Rejeitado':
        return 'Rejeitado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusDescription = (aprovacao: AprovacaoDisplay) => {
    switch (aprovacao.status) {
      case 'Aprovado':
        return aprovacao.data_aprovacao && aprovacao.supervisor
          ? `Aprovado em ${formatarDataHora(aprovacao.data_aprovacao)} por ${aprovacao.supervisor.nome}`
          : 'Aprovado';
      case 'Pendente Aprovação':
        const isVencida = aprovacao.data_limite ? new Date(aprovacao.data_limite) < new Date() : false;
        return isVencida 
          ? 'Prazo expirado - será cancelado automaticamente'
          : aprovacao.data_limite 
            ? `Prazo limite: ${formatarDataHora(aprovacao.data_limite)}`
            : 'Aguardando aprovação';
      case 'Rejeitado':
        return aprovacao.data_aprovacao && aprovacao.supervisor
          ? `Rejeitado em ${formatarDataHora(aprovacao.data_aprovacao)}`
          : 'Rejeitado';
      default:
        return '';
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Carregando aprovações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0"
            onClick={(e) => {
              e.preventDefault()
              router.back()
            }}
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Minhas Aprovações</h1>
        </div>
        <p className="text-sm text-gray-600">Acompanhe o status das suas horas extras</p>
      </div>

      {/* Botão de Aprovação em Massa - Posição Fixa */}
      <div className="bg-white border-b border-gray-200 p-4">
        <Button
          onClick={() => router.push('/pwa/aprovacao-massa')}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
          disabled={loading}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Aprovação em Massa
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Resumo */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-600">{aprovacoes.reduce((acc, a) => acc + a.horas_extras, 0).toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Horas Extras</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{aprovacoes.length}</p>
                <p className="text-sm text-gray-600">Total de Solicitações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Atualizar */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todas" className="text-xs">
              Todas ({aprovacoes.length})
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="text-xs">
              Pendentes ({pendentes.length})
            </TabsTrigger>
            <TabsTrigger value="aprovadas" className="text-xs">
              Aprovadas ({aprovadas.length})
            </TabsTrigger>
            <TabsTrigger value="rejeitadas" className="text-xs">
              Outras ({rejeitadas.length + canceladas.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Todas */}
          <TabsContent value="todas" className="space-y-3">
            {aprovacoes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma aprovação
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Você ainda não possui horas extras para aprovação.
                  </p>
                </CardContent>
              </Card>
            ) : (
              aprovacoes.map(aprovacao => (
                <Card 
                  key={aprovacao.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleVerDetalhes(aprovacao)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(aprovacao.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatarData(aprovacao.data_trabalho)}</h3>
                        <p className="text-sm text-gray-600">{aprovacao.registro.entrada} - {aprovacao.registro.saida}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(aprovacao.status)}>
                      {getStatusText(aprovacao.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Horas Extras:</span>
                      <span className="font-bold text-orange-600">{aprovacao.horas_extras}h</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Trabalhado:</span>
                      <span className="font-medium">{aprovacao.registro.horas_trabalhadas}h</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {getStatusDescription(aprovacao)}
                    </div>

                    {aprovacao.observacoes && (
                      <div className="bg-gray-50 rounded p-2 mt-2">
                        <p className="text-xs text-gray-700">
                          <strong>Observações:</strong> {aprovacao.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tab Pendentes */}
          <TabsContent value="pendentes" className="space-y-3">
            {pendentes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Nenhuma aprovação pendente
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Não há horas extras aguardando aprovação.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendentes.map(aprovacao => (
                <Card 
                  key={aprovacao.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleVerDetalhes(aprovacao)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatarData(aprovacao.data_trabalho)}</h3>
                        <p className="text-sm text-gray-600">{aprovacao.registro.entrada} - {aprovacao.registro.saida}</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-50 text-orange-600 border-orange-200">
                      AGUARDANDO
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Horas Extras:</span>
                      <span className="font-bold text-orange-600">{aprovacao.horas_extras}h</span>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-xs text-orange-800 font-medium">
                          Aguardando aprovação do supervisor
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Prazo limite: {formatarDataHora(aprovacao.data_limite)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tab Aprovadas */}
          <TabsContent value="aprovadas" className="space-y-3">
            {aprovadas.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Nenhuma aprovação aprovada
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Não há horas extras aprovadas ainda.
                  </p>
                </CardContent>
              </Card>
            ) : (
              aprovadas.map(aprovacao => (
                <Card 
                  key={aprovacao.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleVerDetalhes(aprovacao)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatarData(aprovacao.data_trabalho)}</h3>
                        <p className="text-sm text-gray-600">{aprovacao.registro.entrada} - {aprovacao.registro.saida}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-50 text-green-600 border-green-200">
                      APROVADO
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Horas Extras:</span>
                      <span className="font-bold text-green-600">{aprovacao.horas_extras}h</span>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-800 font-medium">
                          Aprovado por {aprovacao.supervisor.nome}
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Em {formatarDataHora(aprovacao.data_aprovacao!)}
                      </p>
                    </div>

                    {aprovacao.observacoes && (
                      <div className="bg-blue-50 rounded p-2">
                        <p className="text-xs text-blue-700">
                          <strong>Observações:</strong> {aprovacao.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tab Outras (Rejeitadas + Canceladas) */}
          <TabsContent value="rejeitadas" className="space-y-3">
            {[...rejeitadas, ...canceladas].length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Nenhuma aprovação rejeitada ou cancelada
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Não há horas extras rejeitadas ou canceladas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              [...rejeitadas, ...canceladas].map(aprovacao => (
                <Card 
                  key={aprovacao.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleVerDetalhes(aprovacao)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {aprovacao.status === 'rejeitado' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Timer className="w-5 h-5 text-gray-600" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatarData(aprovacao.data_trabalho)}</h3>
                        <p className="text-sm text-gray-600">{aprovacao.registro.entrada} - {aprovacao.registro.saida}</p>
                      </div>
                    </div>
                    <Badge className={
                      aprovacao.status === 'rejeitado' 
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }>
                      {aprovacao.status === 'rejeitado' ? 'REJEITADO' : 'CANCELADO'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Horas Extras:</span>
                      <span className="font-bold text-gray-600">{aprovacao.horas_extras}h</span>
                    </div>

                    <div className={`border rounded p-2 ${
                      aprovacao.status === 'rejeitado' 
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {aprovacao.status === 'rejeitado' ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Timer className="w-4 h-4 text-gray-600" />
                        )}
                        <span className={`text-xs font-medium ${
                          aprovacao.status === 'rejeitado' ? 'text-red-800' : 'text-gray-800'
                        }`}>
                          {aprovacao.status === 'rejeitado' 
                            ? `Rejeitado por ${aprovacao.supervisor.nome}`
                            : 'Cancelado automaticamente'
                          }
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        aprovacao.status === 'rejeitado' ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        {aprovacao.status === 'rejeitado' 
                          ? `Em ${formatarDataHora(aprovacao.data_aprovacao!)}`
                          : 'Por prazo expirado'
                        }
                      </p>
                    </div>

                    {aprovacao.observacoes && (
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-700">
                          <strong>Motivo:</strong> {aprovacao.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Informações adicionais */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-semibold text-blue-800 text-sm">Informações</h4>
                <p className="text-blue-700 text-xs">
                  Última atualização: {formatarTempoRelativo(new Date().toISOString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Detalhes */}
        <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes da Aprovação
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre suas horas extras
              </DialogDescription>
            </DialogHeader>
            
            {aprovacaoSelecionada && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(aprovacaoSelecionada.status)}
                    <span className="font-medium">Status</span>
                  </div>
                  <Badge className={getStatusColor(aprovacaoSelecionada.status)}>
                    {getStatusText(aprovacaoSelecionada.status)}
                  </Badge>
                </div>

                {/* Informações principais */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Data do Trabalho:</span>
                    <span className="font-medium">{formatarData(aprovacaoSelecionada.data_trabalho)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-medium">
                      {aprovacaoSelecionada.registro.entrada} - {aprovacaoSelecionada.registro.saida}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Trabalhado:</span>
                    <span className="font-medium">{aprovacaoSelecionada.registro.horas_trabalhadas}h</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Horas Extras:</span>
                    <span className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Obra:</span>
                    <span className="font-medium">{aprovacaoSelecionada.funcionario.obra}</span>
                  </div>
                </div>

                {/* Informações de prazo */}
                {aprovacaoSelecionada.status === 'pendente' && (
                  <div className={`rounded-lg p-3 ${
                    new Date(aprovacaoSelecionada.data_limite) < new Date() 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`w-4 h-4 ${
                        new Date(aprovacaoSelecionada.data_limite) < new Date() 
                          ? 'text-red-600' 
                          : 'text-orange-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        new Date(aprovacaoSelecionada.data_limite) < new Date() 
                          ? 'text-red-800' 
                          : 'text-orange-800'
                      }`}>
                        {new Date(aprovacaoSelecionada.data_limite) < new Date() 
                          ? 'Prazo Expirado' 
                          : 'Aguardando Aprovação'
                        }
                      </span>
                    </div>
                    <p className={`text-xs ${
                      new Date(aprovacaoSelecionada.data_limite) < new Date() 
                        ? 'text-red-700' 
                        : 'text-orange-700'
                    }`}>
                      Prazo limite: {formatarDataHora(aprovacaoSelecionada.data_limite)}
                    </p>
                  </div>
                )}

                {/* Informações de aprovação */}
                {aprovacaoSelecionada.status === 'aprovado' && aprovacaoSelecionada.data_aprovacao && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm text-green-800">Aprovado</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Aprovado em {formatarDataHora(aprovacaoSelecionada.data_aprovacao)} por {aprovacaoSelecionada.supervisor.nome}
                    </p>
                  </div>
                )}

                {/* Observações */}
                {aprovacaoSelecionada.observacoes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-sm text-blue-800 mb-1">Observações</h4>
                    <p className="text-sm text-blue-700">{aprovacaoSelecionada.observacoes}</p>
                  </div>
                )}

                {/* Botão para Assinatura (se for pendente) */}
                {aprovacaoSelecionada.status === 'pendente' && (
                  <div className="pt-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setShowDetalhes(false);
                        router.push('/pwa/aprovacao-assinatura');
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Assinar e Aprovar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
