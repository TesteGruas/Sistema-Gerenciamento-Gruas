'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer, 
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { CardAprovacao } from '@/components/card-aprovacao-horas-extras'
import { FiltrosAprovacoes } from '@/components/filtros-aprovacoes'
import { EstatisticasAprovacoes } from '@/components/estatisticas-aprovacoes'
import { useAprovacoesHorasExtras } from '@/hooks/useAprovacoesHorasExtras'
import { formatarTempoRelativo } from '@/lib/utils-aprovacoes'
import { WhatsAppTestButton } from '@/components/whatsapp-test-button'

export default function AprovacoesHorasExtrasPage() {
  // Listar TODAS as aprovações pendentes (sem filtro de gestor)
  const { aprovacoes, loading, error, fetchAprovacoes, aprovar, rejeitar, refetch } = useAprovacoesHorasExtras();
  
  const [filtros, setFiltros] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
    funcionario: '',
    obra: ''
  });

  // Carregar aprovações ao montar o componente
  useEffect(() => {
    fetchAprovacoes(); // Sem gestor_id = lista todas
  }, [fetchAprovacoes]);

  // Filtrar aprovações baseado nos filtros
  const aprovacoesFiltradas = aprovacoes.filter(aprovacao => {
    const normalizedStatus = aprovacao.status.toLowerCase().replace(' ', '-');
    
    if (filtros.status && normalizedStatus !== filtros.status.toLowerCase()) return false;
    if (filtros.funcionario && !aprovacao.funcionario?.nome.toLowerCase().includes(filtros.funcionario.toLowerCase())) return false;
    if (filtros.dataInicio && aprovacao.data < filtros.dataInicio) return false;
    if (filtros.dataFim && aprovacao.data > filtros.dataFim) return false;
    return true;
  });

  // Separar por status (normalizar para comparação)
  const pendentes = aprovacoesFiltradas.filter(a => a.status === 'Pendente Aprovação');
  const aprovadas = aprovacoesFiltradas.filter(a => a.status === 'Aprovado');
  const rejeitadas = aprovacoesFiltradas.filter(a => a.status === 'Rejeitado');
  const canceladas = aprovacoesFiltradas.filter(a => a.status === 'Cancelado');

  const handleRefresh = async () => {
    await refetch();
  };

  const handleExport = () => {
    // TODO: Implementar exportação
    console.log('Exportando dados...');
  };

  const getStatusCount = (status: string) => {
    if (status === 'pendente') return pendentes.length;
    if (status === 'aprovado') return aprovadas.length;
    if (status === 'rejeitado') return rejeitadas.length;
    if (status === 'cancelado') return canceladas.length;
    return 0;
  };

  // Loading inicial
  if (loading && aprovacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        <p className="text-gray-600">Carregando aprovações...</p>
      </div>
    );
  }

  // Erro
  if (error && aprovacoes.length === 0) {
    return (
      <Card className="p-8">
        <CardContent className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar aprovações
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchAprovacoes()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprovações de Horas Extras</h1>
          <p className="text-gray-600">Gerencie as aprovações de horas extras dos funcionários</p>
        </div>
        <div className="flex gap-2">
          <WhatsAppTestButton variant="outline" size="sm" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <EstatisticasAprovacoes aprovacoes={aprovacoesFiltradas} />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FiltrosAprovacoes filtros={filtros} onFiltrosChange={setFiltros} />
        </CardContent>
      </Card>

      {/* Tabs com diferentes status */}
      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendentes" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendentes
            <Badge variant="secondary" className="ml-1">
              {getStatusCount('pendente')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aprovadas" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Aprovadas
            <Badge variant="default" className="ml-1">
              {getStatusCount('aprovado')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejeitadas" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Rejeitadas
            <Badge variant="destructive" className="ml-1">
              {getStatusCount('rejeitado')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="canceladas" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Canceladas
            <Badge variant="outline" className="ml-1">
              {getStatusCount('cancelado')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab Pendentes */}
        <TabsContent value="pendentes" className="space-y-4">
          {pendentes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma aprovação pendente
                </h3>
                <p className="text-gray-600">
                  Não há aprovações de horas extras aguardando sua análise no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Lista de pendentes */}
              {pendentes.map(aprovacao => (
                <CardAprovacao
                  key={aprovacao.id}
                  aprovacao={aprovacao}
                  onAprovar={aprovar}
                  onRejeitar={rejeitar}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Aprovadas */}
        <TabsContent value="aprovadas" className="space-y-4">
          {aprovadas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma aprovação aprovada
                </h3>
                <p className="text-gray-600">
                  Não há aprovações de horas extras aprovadas no período selecionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {aprovadas.map(aprovacao => (
                <CardAprovacao
                  key={aprovacao.id}
                  aprovacao={aprovacao}
                  onAprovar={aprovar}
                  onRejeitar={rejeitar}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Rejeitadas */}
        <TabsContent value="rejeitadas" className="space-y-4">
          {rejeitadas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma aprovação rejeitada
                </h3>
                <p className="text-gray-600">
                  Não há aprovações de horas extras rejeitadas no período selecionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejeitadas.map(aprovacao => (
                <CardAprovacao
                  key={aprovacao.id}
                  aprovacao={aprovacao}
                  onAprovar={aprovar}
                  onRejeitar={rejeitar}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Canceladas */}
        <TabsContent value="canceladas" className="space-y-4">
          {canceladas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma aprovação cancelada
                </h3>
                <p className="text-gray-600">
                  Não há aprovações de horas extras canceladas no período selecionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {canceladas.map(aprovacao => (
                <CardAprovacao
                  key={aprovacao.id}
                  aprovacao={aprovacao}
                  onAprovar={aprovar}
                  onRejeitar={rejeitar}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resumo da sessão */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div>
              <h4 className="font-semibold text-blue-800">Sistema de Aprovação Ativo</h4>
              <p className="text-blue-700 text-sm">
                Última atualização: {formatarTempoRelativo(new Date().toISOString())} • 
                Total de aprovações: {aprovacoesFiltradas.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
