'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignaturePad } from '@/components/signature-pad'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { 
  apiAprovacoesHorasExtras,
  RegistroPontoAprovacao
} from '@/lib/api-aprovacoes-horas-extras'
import { apiRegistrosPonto } from '@/lib/api-ponto-eletronico'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

// Funções utilitárias
function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR');
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

function PWAAprovacaoAssinaturaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registroId = searchParams.get('id');
  const { user } = useCurrentUser();
  const [assinatura, setAssinatura] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAprovacao, setLoadingAprovacao] = useState(true);
  const [aprovacaoSelecionada, setAprovacaoSelecionada] = useState<RegistroPontoAprovacao | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);

  // Carregar aprovação selecionada
  useEffect(() => {
    const carregarAprovacao = async () => {
      if (!registroId || !user?.id) {
        toast.error('ID da aprovação não encontrado');
        router.push('/pwa/aprovacoes');
        return;
      }

      setLoadingAprovacao(true);
      try {
        const { data } = await apiRegistrosPonto.listar({
          funcionario_id: user.funcionario_id || user.id,
          limit: 100
        });
        
        const registro = data.find((r: any) => r.id === registroId);
        if (!registro || !registro.horas_extras || registro.horas_extras <= 0) {
          toast.error('Aprovação não encontrada ou sem horas extras');
          router.push('/pwa/aprovacoes');
          return;
        }

        if (registro.status !== 'Pendente Aprovação') {
          toast.error('Esta aprovação já foi processada');
          router.push('/pwa/aprovacoes');
          return;
        }

        setAprovacaoSelecionada(registro);
      } catch (error: any) {
        console.error('Erro ao carregar aprovação:', error);
        toast.error('Erro ao carregar dados da aprovação');
        router.push('/pwa/aprovacoes');
      } finally {
        setLoadingAprovacao(false);
      }
    };

    carregarAprovacao();
  }, [registroId, user, router]);

  const handleAprovar = async () => {
    if (!assinatura.trim()) {
      toast.error('Por favor, assine digitalmente antes de aprovar.');
      return;
    }

    if (!aprovacaoSelecionada || !user?.id) {
      toast.error('Dados inválidos para aprovação');
      return;
    }

    setIsLoading(true);
    
    try {
      const { message } = await apiAprovacoesHorasExtras.aprovarComAssinatura(
        aprovacaoSelecionada.id,
        {
          gestor_id: user.id,
          assinatura_digital: assinatura,
          observacoes_aprovacao: undefined
        }
      );

      toast.success(message || 'Horas extras aprovadas com sucesso!');
      
      // Redirecionar após sucesso
      setTimeout(() => {
        router.push('/pwa/aprovacoes');
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao aprovar horas extras:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao aprovar horas extras. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Função showSuccessNotification removida - usando toast agora

  if (!aprovacaoSelecionada) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Aprovação de Horas Extras</h1>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aprovação não encontrada
              </h3>
              <p className="text-gray-600">
                Não foi possível encontrar a aprovação solicitada.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isVencida = new Date(aprovacaoSelecionada.data_limite) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Assinatura Digital</h1>
        </div>
        <p className="text-sm text-gray-600">Aprove as horas extras com sua assinatura digital</p>
      </div>

      <div className="px-2 py-1 space-y-2">
        {/* Resumo Compacto da Aprovação */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-base">Aprovação de Horas Extras</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetalhes(!showDetalhes)}
                className="p-1"
              >
                {showDetalhes ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {/* Resumo Principal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{aprovacaoSelecionada.funcionario.nome}</h3>
                  <p className="text-xs text-gray-600">{aprovacaoSelecionada.funcionario.cargo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Horas Extras</p>
                <p className="text-lg font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">{formatarData(aprovacaoSelecionada.data_trabalho)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Período:</span>
                <span className="font-medium">{aprovacaoSelecionada.registro.entrada} - {aprovacaoSelecionada.registro.saida}</span>
              </div>
            </div>

            {/* Status */}
            <div className={`rounded-lg p-2 ${
              isVencida 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center gap-1">
                <AlertTriangle className={`w-3 h-3 ${
                  isVencida ? 'text-red-600' : 'text-orange-600'
                }`} />
                <span className={`text-xs font-medium ${
                  isVencida ? 'text-red-800' : 'text-orange-800'
                }`}>
                  {isVencida ? 'Prazo Expirado' : 'Aguardando Aprovação'}
                </span>
              </div>
            </div>

            {/* Detalhes Expandíveis */}
            {showDetalhes && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                {/* Informações do funcionário */}
                <div className="bg-gray-50 rounded-lg p-2">
                  <h4 className="font-medium text-gray-700 mb-1 text-xs">Informações do Funcionário</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Obra:</span>
                      <p className="font-medium">{aprovacaoSelecionada.funcionario.obra}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <p className="font-medium">{aprovacaoSelecionada.funcionario_id}</p>
                    </div>
                  </div>
                </div>

                {/* Detalhes do período */}
                <div className="bg-white border rounded-lg p-2">
                  <h4 className="font-medium text-gray-700 mb-1 text-xs">Detalhes do Período</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Entrada:</span>
                      <p className="font-medium">{aprovacaoSelecionada.registro.entrada}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Saída:</span>
                      <p className="font-medium">{aprovacaoSelecionada.registro.saida}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Trabalhado:</span>
                      <p className="font-medium">{aprovacaoSelecionada.registro.horas_trabalhadas}h</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Horas Extras:</span>
                      <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                    </div>
                  </div>
                </div>

                {/* Prazo detalhado */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <h4 className="font-medium text-blue-800 mb-1 text-xs">Prazo de Aprovação</h4>
                  <p className="text-xs text-blue-700">
                    Prazo limite: {formatarDataHora(aprovacaoSelecionada.data_limite)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Componente de Assinatura - Layout Mobile */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Assinatura Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {/* Instruções */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-xs text-green-800 font-medium">
                📝 Assine digitalmente para aprovar as horas extras
              </p>
            </div>

            {/* Canvas de Assinatura - Mobile Otimizado */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-2">
              <SignaturePad
                title=""
                description=""
                onSave={setAssinatura}
                onCancel={() => setAssinatura('')}
                className="mobile-signature"
              />
            </div>

            {/* Status da Assinatura */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${assinatura ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-xs font-medium text-gray-700">
                  {assinatura ? 'Assinatura realizada' : 'Aguardando assinatura'}
                </span>
              </div>
              {assinatura && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssinatura('')}
                  className="text-xs h-6 px-2"
                >
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botão de Aprovação - Mobile */}
        {aprovacaoSelecionada.status === 'pendente' && !isVencida && (
          <div className="sticky bottom-4 bg-white border-t border-gray-200 p-4 -mx-4">
            <Button
              onClick={handleAprovar}
              disabled={!assinatura.trim() || isLoading}
              className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg font-semibold shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  Aprovar Horas Extras
                </div>
              )}
            </Button>
          </div>
        )}

        {/* Informações */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-semibold text-blue-800 text-sm">Informações</h4>
                <p className="text-blue-700 text-xs">
                  Sua assinatura digital é obrigatória para confirmar a aprovação das horas extras.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estilos CSS para Mobile */}
        <style jsx>{`
          .mobile-signature {
            height: 250px;
            width: 100%;
          }
          
          @media (max-width: 640px) {
            .mobile-signature {
              height: 200px;
            }
          }
          
          @media (max-width: 480px) {
            .mobile-signature {
              height: 180px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function PWAAprovacaoAssinaturaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <PWAAprovacaoAssinaturaPageContent />
    </Suspense>
  );
}
