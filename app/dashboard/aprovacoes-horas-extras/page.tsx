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
  AlertTriangle
} from 'lucide-react'
import { CardAprovacao } from '@/components/card-aprovacao-horas-extras'
import { FiltrosAprovacoes } from '@/components/filtros-aprovacoes'
import { EstatisticasAprovacoes } from '@/components/estatisticas-aprovacoes'
import { 
  mockAprovacoes, 
  AprovacaoHorasExtras,
  formatarData,
  formatarTempoRelativo
} from '@/lib/mock-data-aprovacoes'

export default function AprovacoesHorasExtrasPage() {
  const [aprovacoes, setAprovacoes] = useState<AprovacaoHorasExtras[]>(mockAprovacoes);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
    funcionario: '',
    obra: ''
  });

  // Filtrar aprovações baseado nos filtros
  const aprovacoesFiltradas = aprovacoes.filter(aprovacao => {
    if (filtros.status && aprovacao.status !== filtros.status) return false;
    if (filtros.funcionario && !aprovacao.funcionario.nome.toLowerCase().includes(filtros.funcionario.toLowerCase())) return false;
    if (filtros.obra && aprovacao.funcionario.obra !== filtros.obra) return false;
    if (filtros.dataInicio && aprovacao.data_trabalho < filtros.dataInicio) return false;
    if (filtros.dataFim && aprovacao.data_trabalho > filtros.dataFim) return false;
    return true;
  });

  // Separar por status
  const pendentes = aprovacoesFiltradas.filter(a => a.status === 'pendente');
  const aprovadas = aprovacoesFiltradas.filter(a => a.status === 'aprovado');
  const rejeitadas = aprovacoesFiltradas.filter(a => a.status === 'rejeitado');
  const canceladas = aprovacoesFiltradas.filter(a => a.status === 'cancelado');

  const handleRefresh = async () => {
    setLoading(true);
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleAprovacaoChange = () => {
    // Simular atualização dos dados
    console.log('Aprovação alterada, atualizando lista...');
  };

  const handleExport = () => {
    // Simular exportação
    console.log('Exportando dados...');
  };

  const getStatusCount = (status: string) => {
    return aprovacoesFiltradas.filter(a => a.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprovações de Horas Extras</h1>
          <p className="text-gray-600">Gerencie as aprovações de horas extras dos funcionários</p>
        </div>
        <div className="flex gap-2">
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
              {/* Alertas para pendentes */}
              {pendentes.some(p => new Date(p.data_limite) < new Date()) && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div>
                        <h4 className="font-semibold text-red-800">Aprovações Vencidas</h4>
                        <p className="text-red-700 text-sm">
                          Algumas aprovações estão com prazo expirado e serão canceladas automaticamente.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de pendentes */}
              {pendentes.map(aprovacao => (
                <CardAprovacao
                  key={aprovacao.id}
                  aprovacao={aprovacao}
                  onAprovacaoChange={handleAprovacaoChange}
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
                  onAprovacaoChange={handleAprovacaoChange}
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
                  onAprovacaoChange={handleAprovacaoChange}
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
                  onAprovacaoChange={handleAprovacaoChange}
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
