'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Play,
  RotateCcw
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FluxoAprovacaoDemoPage() {
  const router = useRouter();
  const [etapaAtual, setEtapaAtual] = useState(0);

  const etapas = [
    {
      titulo: "Funcionário Registra Ponto",
      descricao: "João Silva trabalha até 17:30 (1.5h extras)",
      data: "25/10/2025",
      horario: "08:00 - 17:30",
      status: "Registrado",
      cor: "blue",
      detalhes: [
        "Entrada: 08:00",
        "Saída: 17:30", 
        "Total trabalhado: 9.5h",
        "Horas extras: 1.5h",
        "Sistema detecta automaticamente"
      ]
    },
    {
      titulo: "Sistema Cria Aprovação",
      descricao: "Aprovação enviada para Maria Santos (Supervisora)",
      data: "25/10/2025",
      horario: "17:30",
      status: "Pendente",
      cor: "orange",
      detalhes: [
        "Prazo: 7 dias (até 01/11/2025)",
        "Notificação enviada para supervisor",
        "Funcionário pode acompanhar status",
        "Aguardando análise"
      ]
    },
    {
      titulo: "Supervisor Analisa",
      descricao: "Maria Santos analisa a solicitação",
      data: "26/10/2025",
      horario: "09:00",
      status: "Em Análise",
      cor: "purple",
      detalhes: [
        "Visualiza detalhes do funcionário",
        "Verifica necessidade das horas extras",
        "Confirma dados do período",
        "Prepara para aprovação/rejeição"
      ]
    },
    {
      titulo: "Supervisor Assina Digitalmente",
      descricao: "Maria Santos aprova com assinatura digital",
      data: "26/10/2025",
      horario: "09:15",
      status: "Aprovado",
      cor: "green",
      detalhes: [
        "Assinatura digital obrigatória",
        "Confirmação de aprovação",
        "Notificação enviada ao funcionário",
        "Registro atualizado no sistema"
      ]
    },
    {
      titulo: "Funcionário Recebe Confirmação",
      descricao: "João Silva recebe notificação de aprovação",
      data: "26/10/2025",
      horario: "09:16",
      status: "Concluído",
      cor: "green",
      detalhes: [
        "Notificação push no PWA",
        "Status atualizado para 'Aprovado'",
        "Horas extras confirmadas",
        "Processo finalizado"
      ]
    }
  ];

  const proximaEtapa = () => {
    if (etapaAtual < etapas.length - 1) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const etapaAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const reiniciarFluxo = () => {
    setEtapaAtual(0);
  };

  const getCorClasses = (cor: string) => {
    switch (cor) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const etapa = etapas[etapaAtual];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🔄 Fluxo de Aprovação de Horas Extras
          </h1>
          <p className="text-gray-600">
            Demonstração do processo completo para 25/10/2025
          </p>
          <Badge variant="outline" className="text-sm">
            Etapa {etapaAtual + 1} de {etapas.length}
          </Badge>
        </div>

        {/* Controles */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={etapaAnterior}
                disabled={etapaAtual === 0}
              >
                ← Anterior
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reiniciarFluxo}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reiniciar
                </Button>
                <Button
                  onClick={proximaEtapa}
                  disabled={etapaAtual === etapas.length - 1}
                >
                  Próxima →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapa Atual */}
        <Card className={`${getCorClasses(etapa.cor)} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                etapa.cor === 'blue' ? 'bg-blue-600' :
                etapa.cor === 'orange' ? 'bg-orange-600' :
                etapa.cor === 'purple' ? 'bg-purple-600' :
                'bg-green-600'
              } text-white font-bold`}>
                {etapaAtual + 1}
              </div>
              {etapa.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-medium">{etapa.descricao}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Data:</span>
                <span className="font-bold">{etapa.data}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Horário:</span>
                <span className="font-bold">{etapa.horario}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge className={`${
                etapa.cor === 'blue' ? 'bg-blue-100 text-blue-800' :
                etapa.cor === 'orange' ? 'bg-orange-100 text-orange-800' :
                etapa.cor === 'purple' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {etapa.status}
              </Badge>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium mb-2">Detalhes da Etapa:</h4>
              <ul className="space-y-1">
                {etapa.detalhes.map((detalhe, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    {detalhe}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Resumo do Fluxo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Processo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Funcionário:</span>
                <span className="font-medium">João Silva</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Supervisor:</span>
                <span className="font-medium">Maria Santos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data do Trabalho:</span>
                <span className="font-medium">25/10/2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Horas Extras:</span>
                <span className="font-bold text-orange-600">1.5h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prazo de Aprovação:</span>
                <span className="font-medium">7 dias</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status Final:</span>
                <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/pwa/aprovacoes')}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Ver Minhas Aprovações
          </Button>
          <Button
            onClick={() => router.push('/pwa/aprovacao-detalhes')}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Testar Aprovação
          </Button>
        </div>

        {/* Informações */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-800 text-sm">Fluxo Completo</h4>
                <p className="text-blue-700 text-xs">
                  Este é o fluxo padrão para aprovação de horas extras com data válida de 14/01/2024.
                  Todas as etapas são obrigatórias e incluem assinatura digital.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
