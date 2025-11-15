'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SignaturePad } from '@/components/signature-pad'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  AlertTriangle,
  User,
  Calendar,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiAprovacoesHorasExtras, type RegistroPontoAprovacao } from '@/lib/api-aprovacoes-horas-extras'
import { useUser } from '@/lib/user-context'
import { useToast } from '@/components/ui/use-toast'

function PWAAprovacaoDetalhesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showRejeitar, setShowRejeitar] = useState(false);
  const [observacoesRejeicao, setObservacoesRejeicao] = useState('');
  const [aprovacaoSelecionada, setAprovacaoSelecionada] = useState<RegistroPontoAprovacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const registroId = searchParams.get('id');

  useEffect(() => {
    if (registroId) {
      loadAprovacao();
    } else {
      setLoading(false);
    }
  }, [registroId]);

  const loadAprovacao = async () => {
    if (!registroId) return;

    setLoading(true);
    try {
      const { data } = await apiAprovacoesHorasExtras.listarPendentes();
      const aprovacao = data.find(a => a.id.toString() === registroId);
      
      if (aprovacao) {
        setAprovacaoSelecionada(aprovacao);
      } else {
        toast({
          title: 'Erro',
          description: 'Aprovação não encontrada',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar aprovação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a aprovação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (assinatura: string) => {
    if (!aprovacaoSelecionada || !currentUser) return;

    setIsProcessing(true);
    try {
      await apiAprovacoesHorasExtras.aprovarComAssinatura(
        aprovacaoSelecionada.id,
        {
          gestor_id: parseInt(currentUser.id),
          assinatura_digital: assinatura,
          observacoes_aprovacao: 'Aprovado via PWA'
        }
      );
      
      toast({
        title: 'Sucesso!',
        description: `Horas extras de ${aprovacaoSelecionada.funcionario?.nome} aprovadas com sucesso`,
        variant: 'default'
      });
      
      setShowAssinatura(false);
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      console.error('Erro ao aprovar horas extras:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao aprovar horas extras',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejeitar = async () => {
    if (!aprovacaoSelecionada) return;

    setIsProcessing(true);
    try {
      await apiAprovacoesHorasExtras.rejeitar(
        aprovacaoSelecionada.id,
        {
          motivo_rejeicao: observacoesRejeicao
        }
      );
      
      toast({
        title: 'Horas Extras Rejeitadas',
        description: `Horas extras de ${aprovacaoSelecionada.funcionario?.nome} foram rejeitadas`,
        variant: 'default'
      });
      
      setShowRejeitar(false);
      setObservacoesRejeicao('');
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      console.error('Erro ao rejeitar horas extras:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao rejeitar horas extras',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Pendente Aprovação':
      case 'pendente':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'Rejeitado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Carregando aprovação...</p>
        </div>
      </div>
    );
  }

  if (!registroId || !aprovacaoSelecionada) {
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
          <h1 className="text-xl font-bold text-gray-900">Aprovação de Horas Extras</h1>
        </div>
        <p className="text-sm text-gray-600">Analise e aprove ou rejeite as horas extras</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Resumo da Aprovação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(aprovacaoSelecionada.status)}
              Resumo da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações do funcionário */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">{aprovacaoSelecionada.funcionario.nome}</h3>
                  <p className="text-sm text-gray-600">{aprovacaoSelecionada.funcionario.cargo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Turno:</span>
                  <p className="font-medium">{aprovacaoSelecionada.funcionario?.turno || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">ID:</span>
                  <p className="font-medium">{aprovacaoSelecionada.funcionario_id}</p>
                </div>
              </div>
            </div>

            {/* Informações do trabalho */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Data</p>
                <p className="font-bold text-blue-800">{formatarData(aprovacaoSelecionada.data)}</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Horas Extras</p>
                <p className="font-bold text-orange-800">{aprovacaoSelecionada.horas_extras}h</p>
              </div>
            </div>

            {/* Detalhes do período */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Detalhes do Período</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Entrada:</span>
                  <p className="font-medium">{aprovacaoSelecionada.entrada}</p>
                </div>
                <div>
                  <span className="text-gray-600">Saída:</span>
                  <p className="font-medium">{aprovacaoSelecionada.saida}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Trabalhado:</span>
                  <p className="font-medium">{aprovacaoSelecionada.horas_trabalhadas}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas Extras:</span>
                  <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">
                  {aprovacaoSelecionada.status}
                </span>
              </div>
              <p className="text-sm text-orange-700">
                Data de criação: {formatarDataHora(aprovacaoSelecionada.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        {aprovacaoSelecionada.status === 'Pendente Aprovação' && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setShowAssinatura(true)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 h-12"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              Aprovar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejeitar(true)}
              disabled={isProcessing}
              className="h-12"
            >
              <X className="w-5 h-5 mr-2" />
              Rejeitar
            </Button>
          </div>
        )}

        {/* Informações adicionais */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-semibold text-blue-800 text-sm">Informações</h4>
                <p className="text-blue-700 text-xs">
                  Esta aprovação requer sua assinatura digital para ser confirmada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Assinatura */}
      <Dialog open={showAssinatura} onOpenChange={setShowAssinatura}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Horas Extras</DialogTitle>
            <DialogDescription>
              Assine digitalmente para aprovar as horas extras de <strong>{aprovacaoSelecionada.funcionario.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo da aprovação */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Resumo da Aprovação</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Funcionário:</span>
                  <p className="font-medium">{aprovacaoSelecionada.funcionario?.nome}</p>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-medium">{formatarData(aprovacaoSelecionada.data)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas Extras:</span>
                  <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Período:</span>
                  <p className="font-medium">{aprovacaoSelecionada.entrada} - {aprovacaoSelecionada.saida}</p>
                </div>
              </div>
            </div>

            {/* Componente de assinatura */}
            <SignaturePad
              title="Sua Assinatura"
              description="Assine para confirmar a aprovação"
              onSave={handleAprovar}
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
              Informe o motivo da rejeição das horas extras de <strong>{aprovacaoSelecionada.funcionario?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo da rejeição */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Resumo da Rejeição</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Funcionário:</span>
                  <p className="font-medium">{aprovacaoSelecionada.funcionario?.nome}</p>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-medium">{formatarData(aprovacaoSelecionada.data)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas Extras:</span>
                  <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Período:</span>
                  <p className="font-medium">{aprovacaoSelecionada.entrada} - {aprovacaoSelecionada.saida}</p>
                </div>
              </div>
            </div>

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
                onClick={handleRejeitar}
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
  );
}

export default function PWAAprovacaoDetalhesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <PWAAprovacaoDetalhesPageContent />
    </Suspense>
  );
}
