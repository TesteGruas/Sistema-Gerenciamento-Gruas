'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

/** Ex.: 14:40:00 → 14:40 — economiza uma linha na UI compacta */
function formatarHoraCurta(t: string | null | undefined): string {
  if (!t || t === '-') return '-';
  const s = String(t).trim();
  return s.length >= 8 && s[2] === ':' && s[5] === ':' ? s.slice(0, 5) : s;
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

  const statusAtual = (aprovacaoSelecionada?.status || '').trim();
  const statusNormalizado = statusAtual
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const isStatusPendenteCorrecao = statusNormalizado === 'pendente correcao';
  const isStatusAprovado = statusNormalizado === 'aprovado';
  const responsavelJaAssinou = Boolean(aprovacaoSelecionada?.assinatura_responsavel_path);
  const funcionarioJaAssinou = Boolean(aprovacaoSelecionada?.assinatura_funcionario_path);
  const aguardandoAssinaturaFuncionario = responsavelJaAssinou && !funcionarioJaAssinou;
  const registroFinalizado = isStatusAprovado || (responsavelJaAssinou && funcionarioJaAssinou);

  const isFuncionarioDoRegistro = !isResponsavelObra && aguardandoAssinaturaFuncionario && !registroFinalizado;
  const isPendenteCorrecao = isStatusPendenteCorrecao && !isResponsavelObra;
  const aguardandoAssinaturaResponsavel = !isResponsavelObra && !responsavelJaAssinou && !registroFinalizado;
  const canResponsavelAssinar = isResponsavelObra && !responsavelJaAssinou && !registroFinalizado;
  const canAssinar = canResponsavelAssinar || isFuncionarioDoRegistro;

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
    if (!canAssinar) {
      toast.error('Este registro ainda aguarda a assinatura do responsável da obra.');
      return;
    }

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
        throw new Error('Registro aguardando assinatura do responsável');
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
      <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-gray-50 p-4">
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
      <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-gray-50 p-4">
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

  const showBottomActionsBar =
    !isPendenteCorrecao && aprovacaoSelecionada.status !== 'Aprovado';

  return (
    <div className="flex flex-col overflow-hidden bg-gray-50 -mx-4 min-h-0 h-[calc(100dvh-10rem)] max-h-[calc(100dvh-10rem)]">
      {/* Header compacto — uma linha + subtítulo curto */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-2 py-1.5">
        <div className="flex items-center gap-1.5 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">
              {isPendenteCorrecao ? 'Corrigir horas' : 'Assinar ponto'}
            </h1>
            <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">
              {isPendenteCorrecao
                ? 'Ajuste os horários e reenvie.'
                : 'Desenhe, Aplicar, depois Salvar abaixo.'}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo: sem rolagem (overflow hidden) */}
      <div
        className={`flex-1 min-h-0 overflow-hidden px-2 py-1.5 space-y-1.5 max-w-lg mx-auto w-full ${
          showBottomActionsBar
            ? 'pb-[calc(4rem+8px+env(safe-area-inset-bottom,0px)+4.25rem)]'
            : 'pb-4'
        }`}
      >
        {/* Alerta de rejeição (quando o registro foi rejeitado) */}
        {isPendenteCorrecao && aprovacaoSelecionada.observacoes && (
          <Card className="border-red-300 bg-red-50 gap-0 py-0 shadow-sm">
            <CardContent className="p-2">
              <div className="flex items-start gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="font-semibold text-red-900 text-[11px]">Motivo</h4>
                  <p className="text-red-800 text-[10px] leading-snug line-clamp-3">{aprovacaoSelecionada.observacoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo — gap-0 py-0 evita o py-6 padrão do Card */}
        <Card className="border border-gray-200/80 shadow-none gap-0 py-0">
          <CardHeader className="px-2.5 pt-2 pb-0 space-y-0">
            <CardTitle className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {isPendenteCorrecao ? 'Registro' : 'Ponto'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDetalhes(!showDetalhes)} className="h-7 w-7 p-0 shrink-0">
                {showDetalhes ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2.5 pb-2 pt-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-xs leading-tight truncate">{aprovacaoSelecionada.funcionario?.nome || 'Funcionário'}</h3>
                  <p className="text-[10px] text-gray-500 truncate">{aprovacaoSelecionada.funcionario?.cargo || '—'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-gray-500 leading-none">Total</p>
                <p className="text-sm font-bold text-blue-600 leading-tight">{aprovacaoSelecionada.horas_trabalhadas || 0}h</p>
              </div>
            </div>

            <p className="text-[10px] text-gray-600 leading-tight">
              <span className="text-gray-600">{formatarData(aprovacaoSelecionada.data)}</span>
              <span className="mx-1 text-gray-300">·</span>
              <span className="font-medium text-gray-800">
                {formatarHoraCurta(aprovacaoSelecionada.entrada)} – {formatarHoraCurta(aprovacaoSelecionada.saida)}
              </span>
            </p>

            <div
              className={`rounded-md px-1.5 py-1 ${
                isPendenteCorrecao
                  ? 'bg-red-50 border border-red-200'
                  : aguardandoAssinaturaFuncionario
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <p
                className={`text-[10px] font-medium leading-snug ${
                  isPendenteCorrecao
                    ? 'text-red-800'
                    : aguardandoAssinaturaFuncionario
                      ? 'text-green-800'
                      : 'text-blue-800'
                }`}
              >
                {isPendenteCorrecao
                  ? 'Corrija as horas abaixo.'
                  : aguardandoAssinaturaFuncionario
                    ? 'Responsável assinou — falta a sua.'
                    : isResponsavelObra
                      ? 'Assine como responsável.'
                      : 'Aguardando assinatura.'}
              </p>
            </div>

            {showDetalhes && (
              <div className="space-y-1 pt-1 border-t border-gray-100">
                <p className="text-[10px] text-gray-500">ID func. {aprovacaoSelecionada.funcionario_id}</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                  <div>
                    <span className="text-gray-500">Entrada:</span>{' '}
                    <span className="font-medium">{formatarHoraCurta(aprovacaoSelecionada.entrada)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Saída:</span>{' '}
                    <span className="font-medium">{formatarHoraCurta(aprovacaoSelecionada.saida)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Almoço:</span>{' '}
                    <span className="font-medium">
                      {formatarHoraCurta(aprovacaoSelecionada.saida_almoco)} / {formatarHoraCurta(aprovacaoSelecionada.volta_almoco)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Extras:</span>{' '}
                    <span className="font-medium">{aprovacaoSelecionada.horas_extras || 0}h</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Se pendente de correção: mostrar botão para editar horas */}
        {isPendenteCorrecao && (
          <Card className="border-0 shadow-none gap-0 py-0">
            <CardContent className="px-3 pb-2 pt-2 space-y-2">
              <div className="bg-orange-50 border border-orange-200 rounded-md px-2 py-1">
                <p className="text-[10px] text-orange-800 font-medium leading-snug">
                  Ajuste os horários e reenvie ao responsável.
                </p>
              </div>
              <Button
                onClick={() => setShowEditarHoras(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 h-10 text-sm font-semibold"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar horas
              </Button>
            </CardContent>
          </Card>
        )}

        {!isPendenteCorrecao && (
          <Card className="border border-gray-200/80 shadow-none gap-0 py-0">
            <CardHeader className="px-2.5 pt-2 pb-0 space-y-0">
              <CardTitle className="flex items-center gap-1.5 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                Assinatura
              </CardTitle>
              <CardDescription className="text-[10px] leading-snug line-clamp-2">
                {isResponsavelObra
                  ? 'Desenhe → Aplicar → Salvar (rodapé).'
                  : isFuncionarioDoRegistro
                    ? 'Desenhe → Aplicar → Salvar abaixo.'
                    : aguardandoAssinaturaResponsavel
                      ? 'Aguardando o responsável assinar.'
                      : 'Desenhe e confirme.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2.5 pb-2 pt-1 space-y-1.5">
              <div className="rounded-lg bg-muted/40 p-1.5 ring-1 ring-border/50">
                <SignaturePad
                  compact
                  compactDense
                  showCancelButton={false}
                  title=""
                  description=""
                  applyLabel="Aplicar"
                  onSave={setAssinatura}
                  onCancel={() => setAssinatura('')}
                />
              </div>

              <div className="flex items-center gap-1.5 px-0.5">
                <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${assinatura ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                  {assinatura ? 'Pronto — toque em Salvar abaixo.' : 'Desenhe e toque em Aplicar.'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {showBottomActionsBar && (
        <div
          className="fixed inset-x-0 z-40 border-t border-gray-200/90 bg-background/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.06)] px-2.5 pt-2 pb-2 max-w-lg mx-auto w-full box-border bottom-[calc(4rem+10px+env(safe-area-inset-bottom,0px))]"
          aria-label="Ações de assinatura"
        >
          <div
            className={
              isResponsavelObra
                ? 'flex flex-row gap-2 items-stretch'
                : 'flex flex-col'
            }
          >
            {isResponsavelObra && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejeicao(true)}
                disabled={isLoading}
                className="flex-1 min-w-0 border-red-300 text-red-700 hover:bg-red-50 h-10 text-xs font-semibold px-2"
              >
                <XCircle className="w-4 h-4 mr-1 shrink-0" />
                <span className="truncate">Não concordo</span>
              </Button>
            )}
            <Button
              onClick={handleAprovar}
              disabled={!canAssinar || !assinatura.trim() || isLoading}
              className={
                isResponsavelObra
                  ? 'flex-1 min-w-0 bg-green-600 hover:bg-green-700 h-10 text-sm font-semibold shadow-sm px-2'
                  : 'w-full bg-green-600 hover:bg-green-700 h-10 text-sm font-semibold shadow-sm'
              }
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 w-full">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="truncate">Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 w-full min-w-0">
                  <Check className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {aguardandoAssinaturaResponsavel && !isResponsavelObra
                      ? 'Aguardando…'
                      : 'Salvar'}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      )}

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
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  return (
    <Suspense fallback={
      <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-gray-50 flex items-center justify-center -mx-4">
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
