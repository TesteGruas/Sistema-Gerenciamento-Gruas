'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SignaturePad } from '@/components/signature-pad'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
  Loader2,
  XCircle,
  Pencil
} from 'lucide-react'
import { apiRegistrosPonto, type RegistroPonto } from '@/lib/api-ponto-eletronico'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Aprovado':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'Pendente Aprovação':
    case 'Pendente Assinatura':
    case 'Pendente Assinatura Funcionário':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'Pendente Correção':
      return 'text-red-600 bg-red-50 border-red-200';
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
  const [isRejecting, setIsRejecting] = useState(false);
  const [loadingAprovacao, setLoadingAprovacao] = useState(true);
  const [aprovacaoSelecionada, setAprovacaoSelecionada] = useState<RegistroPonto | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showRejeicao, setShowRejeicao] = useState(false);
  const [comentarioRejeicao, setComentarioRejeicao] = useState('');

  // Modal de edição de horas (para funcionário após rejeição)
  const [showEditarHoras, setShowEditarHoras] = useState(false);
  const [isCorrigindo, setIsCorrigindo] = useState(false);
  const [horasEditadas, setHorasEditadas] = useState({
    entrada: '',
    saida_almoco: '',
    volta_almoco: '',
    saida: ''
  });

  const isResponsavelObra = (() => {
    if (user?.is_responsavel_obra) return true;
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const tipo = userData?.user_metadata?.tipo || userData?.user?.user_metadata?.tipo;
        if (tipo === 'responsavel_obra') return true;
      }
    } catch { /* ignore */ }
    return false;
  })();

  const isFuncionarioDoRegistro = aprovacaoSelecionada?.status === 'Pendente Assinatura Funcionário' && !isResponsavelObra;
  const isPendenteCorrecao = aprovacaoSelecionada?.status === 'Pendente Correção' && !isResponsavelObra;

  useEffect(() => {
    const carregarAprovacao = async () => {
      if (!registroId) {
        toast.error('ID do registro não encontrado');
        router.push('/pwa/aprovacoes');
        return;
      }

      setLoadingAprovacao(true);
      try {
        const registro = await apiRegistrosPonto.obter(registroId);
        
        if (!registro) {
          toast.error('Registro não encontrado');
          router.push('/pwa/aprovacoes');
          return;
        }

        if (registro.status === 'Aprovado' && registro.assinatura_responsavel_path && registro.assinatura_funcionario_path) {
          toast.error('Este registro já foi completamente assinado');
          router.push('/pwa/aprovacoes');
          return;
        }

        setAprovacaoSelecionada(registro);

        // Pré-popular a modal de edição com os dados atuais
        setHorasEditadas({
          entrada: registro.entrada || '',
          saida_almoco: registro.saida_almoco || '',
          volta_almoco: registro.volta_almoco || '',
          saida: registro.saida || ''
        });
      } catch (error: any) {
        console.error('Erro ao carregar aprovação:', error);
        toast.error(error.response?.data?.message || 'Erro ao carregar dados da aprovação');
      } finally {
        setLoadingAprovacao(false);
      }
    };

    carregarAprovacao();
  }, [registroId, router]);

  const handleAprovar = async () => {
    if (!assinatura.trim()) {
      toast.error('Por favor, assine digitalmente antes de aprovar.');
      return;
    }
    if (!aprovacaoSelecionada) {
      toast.error('Dados inválidos para aprovação');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (isResponsavelObra) {
        result = await apiRegistrosPonto.assinarResponsavel(
          aprovacaoSelecionada.id,
          { assinatura_digital: assinatura }
        );
      } else if (isFuncionarioDoRegistro) {
        result = await apiRegistrosPonto.assinarFuncionario(
          aprovacaoSelecionada.id,
          { assinatura_digital: assinatura }
        );
      } else {
        result = await apiRegistrosPonto.assinar(
          aprovacaoSelecionada.id,
          { assinatura_digital: assinatura }
        );
      }

      toast.success(result.message || 'Registro assinado com sucesso!');
      setTimeout(() => router.push('/pwa/aprovacoes'), 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao assinar registro.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejeitar = async () => {
    if (!comentarioRejeicao.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    if (!aprovacaoSelecionada) return;

    setIsRejecting(true);
    try {
      const result = await apiRegistrosPonto.rejeitarResponsavel(
        aprovacaoSelecionada.id,
        { comentario: comentarioRejeicao.trim() }
      );
      toast.success(result.message || 'Registro rejeitado. O funcionário será notificado.');
      setShowRejeicao(false);
      setTimeout(() => router.push('/pwa/aprovacoes'), 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao rejeitar registro.';
      toast.error(errorMessage);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCorrigirHoras = async () => {
    if (!aprovacaoSelecionada) return;

    if (!horasEditadas.entrada || !horasEditadas.saida) {
      toast.error('Entrada e saída são obrigatórias');
      return;
    }

    setIsCorrigindo(true);
    try {
      const result = await apiRegistrosPonto.corrigirHoras(
        aprovacaoSelecionada.id,
        {
          entrada: horasEditadas.entrada,
          saida_almoco: horasEditadas.saida_almoco || undefined,
          volta_almoco: horasEditadas.volta_almoco || undefined,
          saida: horasEditadas.saida
        }
      );
      toast.success(result.message || 'Horas corrigidas! O responsável será notificado.');
      setShowEditarHoras(false);
      setTimeout(() => router.push('/pwa/aprovacoes'), 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao corrigir horas.';
      toast.error(errorMessage);
    } finally {
      setIsCorrigindo(false);
    }
  };

  if (loadingAprovacao) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Assinar Registro de Ponto</h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando registro...</h3>
              <p className="text-gray-600">Aguarde enquanto buscamos os dados do registro.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!aprovacaoSelecionada) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Assinar Registro de Ponto</h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Registro não encontrado</h3>
              <p className="text-gray-600 mb-4">Não foi possível encontrar o registro solicitado.</p>
              <Button onClick={() => router.push('/pwa/aprovacoes')}>Voltar para Aprovações</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">
            {isPendenteCorrecao ? 'Corrigir Horas' : 'Assinatura Digital'}
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          {isPendenteCorrecao 
            ? 'O responsável não concordou com as horas. Corrija e reenvie.'
            : 'Assine o registro de ponto com sua assinatura digital'}
        </p>
      </div>

      <div className="px-2 py-1 space-y-2">
        {/* Alerta de rejeição (quando o registro foi rejeitado) */}
        {isPendenteCorrecao && aprovacaoSelecionada.observacoes && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm">Motivo da rejeição</h4>
                  <p className="text-red-800 text-xs mt-1">{aprovacaoSelecionada.observacoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo Compacto */}
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-base">
                  {isPendenteCorrecao ? 'Registro a Corrigir' : 'Assinatura de Registro de Ponto'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDetalhes(!showDetalhes)} className="p-1">
                {showDetalhes ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{aprovacaoSelecionada.funcionario?.nome || 'Funcionário'}</h3>
                  <p className="text-xs text-gray-600">{aprovacaoSelecionada.funcionario?.cargo || 'Cargo'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Horas Trabalhadas</p>
                <p className="text-lg font-bold text-blue-600">{aprovacaoSelecionada.horas_trabalhadas || 0}h</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">{formatarData(aprovacaoSelecionada.data)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Período:</span>
                <span className="font-medium">{aprovacaoSelecionada.entrada || '-'} - {aprovacaoSelecionada.saida || '-'}</span>
              </div>
            </div>

            {/* Status */}
            <div className={`rounded-lg p-2 ${
              isPendenteCorrecao
                ? 'bg-red-50 border border-red-200'
                : aprovacaoSelecionada.status === 'Pendente Assinatura Funcionário'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-1">
                {isPendenteCorrecao 
                  ? <XCircle className="w-3 h-3 text-red-600" />
                  : <Clock className={`w-3 h-3 ${aprovacaoSelecionada.status === 'Pendente Assinatura Funcionário' ? 'text-green-600' : 'text-blue-600'}`} />
                }
                <span className={`text-xs font-medium ${
                  isPendenteCorrecao
                    ? 'text-red-800'
                    : aprovacaoSelecionada.status === 'Pendente Assinatura Funcionário' ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {isPendenteCorrecao
                    ? 'Não aprovado — corrija as horas abaixo'
                    : aprovacaoSelecionada.status === 'Pendente Assinatura Funcionário'
                      ? 'Responsável já assinou — aguardando sua assinatura'
                      : isResponsavelObra
                        ? 'Aguardando sua assinatura como responsável'
                        : 'Aguardando Assinatura'}
                </span>
              </div>
            </div>

            {/* Detalhes Expandíveis */}
            {showDetalhes && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-2">
                  <h4 className="font-medium text-gray-700 mb-1 text-xs">Informações do Funcionário</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <p className="font-medium">{aprovacaoSelecionada.funcionario_id}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-2">
                  <h4 className="font-medium text-gray-700 mb-1 text-xs">Detalhes do Período</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Entrada:</span>
                      <p className="font-medium">{aprovacaoSelecionada.entrada || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Saída:</span>
                      <p className="font-medium">{aprovacaoSelecionada.saida || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Saída Almoço:</span>
                      <p className="font-medium">{aprovacaoSelecionada.saida_almoco || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Volta Almoço:</span>
                      <p className="font-medium">{aprovacaoSelecionada.volta_almoco || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Trabalhado:</span>
                      <p className="font-medium">{aprovacaoSelecionada.horas_trabalhadas || 0}h</p>
                    </div>
                    {aprovacaoSelecionada.horas_extras && aprovacaoSelecionada.horas_extras > 0 && (
                      <div>
                        <span className="text-gray-600">Horas Extras:</span>
                        <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Se pendente de correção: mostrar botão para editar horas */}
        {isPendenteCorrecao && (
          <Card className="border-0 shadow-none">
            <CardContent className="px-3 pb-3 pt-3 space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                <p className="text-xs text-orange-800 font-medium">
                  📝 Corrija os horários e reenvie para o responsável aprovar novamente
                </p>
              </div>
              <Button
                onClick={() => setShowEditarHoras(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 h-14 text-lg font-semibold shadow-lg"
              >
                <Pencil className="w-5 h-5 mr-2" />
                Editar Horas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Componente de Assinatura (escondido se pendente correção) */}
        {!isPendenteCorrecao && (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-1 px-3 pt-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Assinatura Digital
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-800 font-medium">
                  {isResponsavelObra
                    ? '📝 Assine como responsável para confirmar as horas do funcionário'
                    : isFuncionarioDoRegistro
                      ? '📝 O responsável já assinou. Assine para validar seu registro de ponto'
                      : '📝 Assine digitalmente o registro de ponto'}
                </p>
              </div>

              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-2">
                <SignaturePad
                  title=""
                  description=""
                  onSave={setAssinatura}
                  onCancel={() => setAssinatura('')}
                  className="mobile-signature"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${assinatura ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs font-medium text-gray-700">
                    {assinatura ? 'Assinatura realizada' : 'Aguardando assinatura'}
                  </span>
                </div>
                {assinatura && (
                  <Button variant="outline" size="sm" onClick={() => setAssinatura('')} className="text-xs h-6 px-2">
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de ação */}
        {!isPendenteCorrecao && aprovacaoSelecionada.status !== 'Aprovado' && (
          <div className="sticky bottom-4 bg-white border-t border-gray-200 p-4 -mx-4 space-y-2">
            {/* Botão Assinar */}
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
                  {isResponsavelObra ? 'Assinar como Responsável' : isFuncionarioDoRegistro ? 'Assinar e Validar' : 'Assinar Registro'}
                </div>
              )}
            </Button>

            {/* Botão Não Concordo (apenas para responsável) */}
            {isResponsavelObra && (
              <Button
                variant="outline"
                onClick={() => setShowRejeicao(true)}
                disabled={isLoading}
                className="w-full border-red-300 text-red-700 hover:bg-red-50 h-12 font-semibold"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Não Concordo
              </Button>
            )}
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
                  {isPendenteCorrecao
                    ? 'Após corrigir, o registro será reenviado automaticamente para o responsável.'
                    : 'Sua assinatura digital é obrigatória para confirmar o registro de ponto.'}
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
            .mobile-signature { height: 200px; }
          }
          @media (max-width: 480px) {
            .mobile-signature { height: 180px; }
          }
        `}</style>
      </div>

      {/* Dialog: Não Concordo (Rejeição) */}
      <Dialog open={showRejeicao} onOpenChange={setShowRejeicao}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Não Concordo com as Horas
            </DialogTitle>
            <DialogDescription>
              Explique o motivo para que o funcionário possa corrigir os horários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Entrada:</span>
                  <span className="ml-1 font-medium">{aprovacaoSelecionada?.entrada || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Saída:</span>
                  <span className="ml-1 font-medium">{aprovacaoSelecionada?.saida || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Saída Almoço:</span>
                  <span className="ml-1 font-medium">{aprovacaoSelecionada?.saida_almoco || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Volta Almoço:</span>
                  <span className="ml-1 font-medium">{aprovacaoSelecionada?.volta_almoco || '-'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comentario" className="text-sm font-medium">
                Motivo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="comentario"
                placeholder="Ex: O horário de saída está incorreto, o funcionário saiu às 17:30 e não às 18:00..."
                value={comentarioRejeicao}
                onChange={(e) => setComentarioRejeicao(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowRejeicao(false); setComentarioRejeicao(''); }}
                className="flex-1"
                disabled={isRejecting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRejeitar}
                disabled={!comentarioRejeicao.trim() || isRejecting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isRejecting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  'Enviar Rejeição'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Horas (para funcionário) */}
      <Dialog open={showEditarHoras} onOpenChange={setShowEditarHoras}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-orange-600" />
              Editar Horas
            </DialogTitle>
            <DialogDescription>
              Corrija os horários e reenvie para aprovação do responsável.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {aprovacaoSelecionada?.observacoes && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700 font-medium">Motivo da rejeição:</p>
                <p className="text-sm text-red-900 mt-1">{aprovacaoSelecionada.observacoes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entrada" className="text-sm">Entrada *</Label>
                <Input
                  id="entrada"
                  type="time"
                  value={horasEditadas.entrada}
                  onChange={(e) => setHorasEditadas(prev => ({ ...prev, entrada: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saida_almoco" className="text-sm">Saída Almoço</Label>
                <Input
                  id="saida_almoco"
                  type="time"
                  value={horasEditadas.saida_almoco}
                  onChange={(e) => setHorasEditadas(prev => ({ ...prev, saida_almoco: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="volta_almoco" className="text-sm">Volta Almoço</Label>
                <Input
                  id="volta_almoco"
                  type="time"
                  value={horasEditadas.volta_almoco}
                  onChange={(e) => setHorasEditadas(prev => ({ ...prev, volta_almoco: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saida" className="text-sm">Saída *</Label>
                <Input
                  id="saida"
                  type="time"
                  value={horasEditadas.saida}
                  onChange={(e) => setHorasEditadas(prev => ({ ...prev, saida: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditarHoras(false)}
                className="flex-1"
                disabled={isCorrigindo}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCorrigirHoras}
                disabled={!horasEditadas.entrada || !horasEditadas.saida || isCorrigindo}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isCorrigindo ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  'Salvar e Reenviar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
