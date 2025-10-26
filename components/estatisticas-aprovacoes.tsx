'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer, 
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react'
import { AprovacaoHorasExtras } from '@/lib/mock-data-aprovacoes'

interface EstatisticasAprovacoesProps {
  aprovacoes: AprovacaoHorasExtras[];
}

export function EstatisticasAprovacoes({ aprovacoes }: EstatisticasAprovacoesProps) {
  // Calcular estatísticas
  const total = aprovacoes.length;
  const pendentes = aprovacoes.filter(a => a.status === 'pendente').length;
  const aprovadas = aprovacoes.filter(a => a.status === 'aprovado').length;
  const rejeitadas = aprovacoes.filter(a => a.status === 'rejeitado').length;
  const canceladas = aprovacoes.filter(a => a.status === 'cancelado').length;
  
  // Calcular horas extras totais
  const totalHorasExtras = aprovacoes.reduce((acc, aprovacao) => acc + aprovacao.horas_extras, 0);
  const horasExtrasAprovadas = aprovacoes
    .filter(a => a.status === 'aprovado')
    .reduce((acc, aprovacao) => acc + aprovacao.horas_extras, 0);
  
  // Calcular taxa de aprovação
  const taxaAprovacao = total > 0 ? ((aprovadas / total) * 100).toFixed(1) : '0';
  
  // Calcular aprovações vencidas
  const vencidas = aprovacoes.filter(a => 
    a.status === 'pendente' && new Date(a.data_limite) < new Date()
  ).length;
  
  // Calcular funcionários únicos
  const funcionariosUnicos = new Set(aprovacoes.map(a => a.funcionario_id)).size;

  const estatisticas = [
    {
      titulo: 'Total de Aprovações',
      valor: total,
      icone: Clock,
      cor: 'text-blue-600',
      bgCor: 'bg-blue-50',
      borderCor: 'border-blue-200'
    },
    {
      titulo: 'Pendentes',
      valor: pendentes,
      icone: AlertTriangle,
      cor: 'text-orange-600',
      bgCor: 'bg-orange-50',
      borderCor: 'border-orange-200'
    },
    {
      titulo: 'Aprovadas',
      valor: aprovadas,
      icone: CheckCircle,
      cor: 'text-green-600',
      bgCor: 'bg-green-50',
      borderCor: 'border-green-200'
    },
    {
      titulo: 'Rejeitadas',
      valor: rejeitadas,
      icone: XCircle,
      cor: 'text-red-600',
      bgCor: 'bg-red-50',
      borderCor: 'border-red-200'
    },
    {
      titulo: 'Canceladas',
      valor: canceladas,
      icone: Timer,
      cor: 'text-gray-600',
      bgCor: 'bg-gray-50',
      borderCor: 'border-gray-200'
    },
    {
      titulo: 'Vencidas',
      valor: vencidas,
      icone: AlertTriangle,
      cor: 'text-red-600',
      bgCor: 'bg-red-50',
      borderCor: 'border-red-200'
    }
  ];

  const metricas = [
    {
      titulo: 'Horas Extras Totais',
      valor: `${totalHorasExtras.toFixed(1)}h`,
      descricao: 'Soma de todas as horas extras',
      icone: TrendingUp,
      cor: 'text-purple-600',
      bgCor: 'bg-purple-50',
      borderCor: 'border-purple-200'
    },
    {
      titulo: 'Horas Aprovadas',
      valor: `${horasExtrasAprovadas.toFixed(1)}h`,
      descricao: 'Horas extras já aprovadas',
      icone: CheckCircle,
      cor: 'text-green-600',
      bgCor: 'bg-green-50',
      borderCor: 'border-green-200'
    },
    {
      titulo: 'Taxa de Aprovação',
      valor: `${taxaAprovacao}%`,
      descricao: 'Percentual de aprovações',
      icone: TrendingUp,
      cor: 'text-blue-600',
      bgCor: 'bg-blue-50',
      borderCor: 'border-blue-200'
    },
    {
      titulo: 'Funcionários',
      valor: funcionariosUnicos,
      descricao: 'Funcionários com horas extras',
      icone: Users,
      cor: 'text-indigo-600',
      bgCor: 'bg-indigo-50',
      borderCor: 'border-indigo-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Estatísticas por Status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das Aprovações</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {estatisticas.map((stat, index) => {
            const IconComponent = stat.icone;
            return (
              <Card key={index} className={`${stat.bgCor} ${stat.borderCor} border`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.titulo}</p>
                      <p className={`text-2xl font-bold ${stat.cor}`}>{stat.valor}</p>
                    </div>
                    <IconComponent className={`w-8 h-8 ${stat.cor}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Métricas Adicionais */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Gerais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricas.map((metrica, index) => {
            const IconComponent = metrica.icone;
            return (
              <Card key={index} className={`${metrica.bgCor} ${metrica.borderCor} border`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className={`w-6 h-6 ${metrica.cor}`} />
                    <Badge variant="outline" className="text-xs">
                      {metrica.descricao}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metrica.titulo}</p>
                    <p className={`text-2xl font-bold ${metrica.cor}`}>{metrica.valor}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Alertas */}
      {vencidas > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-800">Atenção!</h4>
                <p className="text-red-700">
                  Você tem <strong>{vencidas}</strong> aprovação(ões) com prazo expirado que precisam ser canceladas automaticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pendentes > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-600" />
              <div>
                <h4 className="font-semibold text-orange-800">Aprovações Pendentes</h4>
                <p className="text-orange-700">
                  Você tem <strong>{pendentes}</strong> aprovação(ões) aguardando sua análise.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
