'use client'

import { useState, useEffect } from 'react'
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
import { useRouter } from 'next/navigation'
import { apiAprovacoesHorasExtras, type RegistroPontoAprovacao } from '@/lib/api-aprovacoes-horas-extras'
import { useUser } from '@/lib/user-context'
import { useToast } from '@/components/ui/use-toast'

export default function PWAAprovacaoMassaPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [aprovacoesSelecionadas, setAprovacoesSelecionadas] = useState<(string | number)[]>([]);
  const [assinatura, setAssinatura] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState<{ [key: string]: boolean }>({});
  const [animacaoSelecao, setAnimacaoSelecao] = useState<string>('');
  const [aprovacoesPendentes, setAprovacoesPendentes] = useState<RegistroPontoAprovacao[]>([]);
  const [loadingAprovacoes, setLoadingAprovacoes] = useState(true);

  // Carregar aprovações pendentes
  useEffect(() => {
    loadAprovacoesPendentes();
  }, []);

  const loadAprovacoesPendentes = async () => {
    setLoadingAprovacoes(true);
    try {
      const { data } = await apiAprovacoesHorasExtras.listarPendentes({
        status: 'Pendente Aprovação'
      });
      setAprovacoesPendentes(data.filter(a => a.status === 'Pendente Aprovação'));
    } catch (error: any) {
      console.error('Erro ao carregar aprovações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as aprovações pendentes',
        variant: 'destructive'
      });
    } finally {
      setLoadingAprovacoes(false);
    }
  };

  const handleSelecionarTodas = () => {
    if (aprovacoesSelecionadas.length === aprovacoesPendentes.length) {
      setAprovacoesSelecionadas([]);
    } else {
      setAprovacoesSelecionadas(aprovacoesPendentes.map(a => a.id));
    }
  };

  const handleSelecionarAprovacao = (id: string) => {
    setAprovacoesSelecionadas(prev => 
      prev.includes(id) 
        ? prev.filter(aprovacaoId => aprovacaoId !== id)
        : [...prev, id]
    );
    
    // Animação de seleção
    setAnimacaoSelecao(id);
    setTimeout(() => setAnimacaoSelecao(''), 300);
  };

  const handleAprovarMassa = async () => {
    if (!assinatura.trim()) {
      toast({
        title: 'Assinatura Obrigatória',
        description: 'Por favor, assine digitalmente antes de aprovar.',
        variant: 'destructive'
      });
      return;
    }

    if (aprovacoesSelecionadas.length === 0) {
      toast({
        title: 'Seleção Vazia',
        description: 'Por favor, selecione pelo menos uma aprovação.',
        variant: 'destructive'
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await apiAprovacoesHorasExtras.aprovarLote({
        registro_ids: aprovacoesSelecionadas,
        observacoes: `Aprovado em massa com assinatura digital`
      });
      
      toast({
        title: 'Sucesso!',
        description: `${aprovacoesSelecionadas.length} aprovações realizadas com sucesso`,
        variant: 'default'
      });
      
      // Limpar seleções e voltar
      setAprovacoesSelecionadas([]);
      setAssinatura('');
      
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao aprovar horas extras:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao aprovar horas extras. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDetalhes = (id: string) => {
    setShowDetalhes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Aprovação em Massa</h1>
        </div>
        <p className="text-sm text-gray-600">Selecione múltiplas aprovações e assine uma única vez</p>
        
        {/* Instrução Visual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mx-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <p className="text-sm text-blue-800 font-medium">
              💡 Dica: Clique em qualquer lugar do card para selecionar/deselecionar
            </p>
          </div>
        </div>
      </div>

      <div className="px-2 py-1 space-y-2">
        {/* Loading State */}
        {loadingAprovacoes && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Carregando aprovações...</span>
          </div>
        )}

        {/* Controles de Seleção */}
        {!loadingAprovacoes && (
          <Card className="border-0 shadow-none">
            <CardContent className="px-3 py-3">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={handleSelecionarTodas}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    aprovacoesSelecionadas.length === aprovacoesPendentes.length && aprovacoesPendentes.length > 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}>
                    {aprovacoesSelecionadas.length === aprovacoesPendentes.length && aprovacoesPendentes.length > 0 && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {aprovacoesSelecionadas.length === aprovacoesPendentes.length && aprovacoesPendentes.length > 0
                      ? 'Desmarcar Todas' 
                      : 'Selecionar Todas'
                    }
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {aprovacoesSelecionadas.length} de {aprovacoesPendentes.length} selecionadas
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Aprovações */}
        {!loadingAprovacoes && aprovacoesPendentes.map(aprovacao => (
          <Card 
            key={aprovacao.id} 
            className={`border-0 shadow-none cursor-pointer transition-all duration-200 ${
              aprovacoesSelecionadas.includes(aprovacao.id) 
                ? 'bg-blue-50 border-2 border-blue-300' 
                : 'bg-white hover:bg-gray-50'
            } ${animacaoSelecao === aprovacao.id ? 'card-selected' : ''}`}
            onClick={() => handleSelecionarAprovacao(aprovacao.id)}
          >
            <CardContent className="px-3 py-3">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div 
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    aprovacoesSelecionadas.includes(aprovacao.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {aprovacoesSelecionadas.includes(aprovacao.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        aprovacoesSelecionadas.includes(aprovacao.id) 
                          ? 'bg-blue-200' 
                          : 'bg-blue-100'
                      }`}>
                        <User className={`w-3 h-3 transition-colors ${
                          aprovacoesSelecionadas.includes(aprovacao.id) 
                            ? 'text-blue-700' 
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-sm transition-colors ${
                          aprovacoesSelecionadas.includes(aprovacao.id) 
                            ? 'text-blue-900' 
                            : 'text-gray-900'
                        }`}>
                          {aprovacao.funcionario?.nome || 'Nome não disponível'}
                        </h3>
                        <p className={`text-xs transition-colors ${
                          aprovacoesSelecionadas.includes(aprovacao.id) 
                            ? 'text-blue-700' 
                            : 'text-gray-600'
                        }`}>
                          {aprovacao.funcionario?.cargo || 'Cargo não disponível'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Horas Extras</p>
                      <p className={`text-sm font-bold transition-colors ${
                        aprovacoesSelecionadas.includes(aprovacao.id) 
                          ? 'text-blue-600' 
                          : 'text-orange-600'
                      }`}>
                        {aprovacao.horas_extras}h
                      </p>
                    </div>
                  </div>

                  {/* Informações Básicas */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">Data:</span>
                      <span className="font-medium">{formatarData(aprovacao.data)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">Período:</span>
                      <span className="font-medium">{aprovacao.entrada} - {aprovacao.saida}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="rounded-lg p-2 mb-2 bg-orange-50 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        <span className="text-xs font-medium text-orange-800">
                          Aguardando Aprovação
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDetalhes(aprovacao.id.toString());
                        }}
                        className="p-1"
                      >
                        {showDetalhes[aprovacao.id.toString()] ? (
                          <ChevronUp className="w-3 h-3 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Detalhes Expandíveis */}
                  {showDetalhes[aprovacao.id.toString()] && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <h4 className="font-medium text-gray-700 mb-1 text-xs">Informações Detalhadas</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Total Trabalhado:</span>
                            <p className="font-medium">{aprovacao.horas_trabalhadas}h</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-medium">{aprovacao.status}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {!loadingAprovacoes && aprovacoesPendentes.length === 0 && (
          <Card className="border-0 shadow-none">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma aprovação pendente
              </h3>
              <p className="text-gray-500">
                Todas as horas extras já foram aprovadas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Componente de Assinatura - Layout Mobile */}
        {aprovacoesSelecionadas.length > 0 && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-1 px-3 pt-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Assinatura Digital para {aprovacoesSelecionadas.length} Aprovação(ões)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {/* Instruções */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <p className="text-xs text-green-800 font-medium">
                  📝 Uma única assinatura será aplicada a todas as aprovações selecionadas
                </p>
              </div>

              {/* Canvas de Assinatura - Mobile Otimizado */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-2">
                <SignaturePad
                  title=""
                  description=""
                  onSave={setAssinatura}
                  onCancel={() => setAssinatura('')}
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
        )}

        {/* Botão de Aprovação em Massa */}
        {aprovacoesSelecionadas.length > 0 && (
          <div className="sticky bottom-4 bg-white border-t border-gray-200 p-4 -mx-4">
            <Button
              onClick={handleAprovarMassa}
              disabled={!assinatura.trim() || isLoading}
              className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg font-semibold shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processando {aprovacoesSelecionadas.length} aprovação(ões)...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  Aprovar {aprovacoesSelecionadas.length} Horas Extras
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
                <h4 className="font-semibold text-blue-800 text-sm">Aprovação em Massa</h4>
                <p className="text-blue-700 text-xs">
                  Selecione múltiplas aprovações e assine uma única vez para aprovar todas simultaneamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estilos CSS para Mobile */}
        <style jsx>{`
          .mobile-signature {
            height: 200px;
            width: 100%;
          }
          
          @media (max-width: 640px) {
            .mobile-signature {
              height: 150px;
            }
          }

          /* Animação de seleção */
          .card-selected {
            animation: selectPulse 0.3s ease-out;
          }

          @keyframes selectPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
