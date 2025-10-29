'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SignaturePad } from '@/components/signature-pad'
import { 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Loader2
} from 'lucide-react'
import { RegistroPontoAprovacao } from '@/lib/api-aprovacoes-horas-extras'
import { getStatusColor, formatarData, formatarDataHora, formatarTempoRelativo } from '@/lib/utils-aprovacoes'

interface CardAprovacaoProps {
  aprovacao: RegistroPontoAprovacao;
  onAprovar: (registro_id: string, assinatura: string, observacoes?: string) => Promise<boolean>;
  onRejeitar: (registro_id: string, motivo: string) => Promise<boolean>;
  showActions?: boolean;
}

export function CardAprovacao({ aprovacao, onAprovar, onRejeitar, showActions = true }: CardAprovacaoProps) {
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showRejeitar, setShowRejeitar] = useState(false);
  const [observacoesRejeicao, setObservacoesRejeicao] = useState('');
  const [loadingAprovar, setLoadingAprovar] = useState(false);
  const [loadingRejeitar, setLoadingRejeitar] = useState(false);

  const handleAprovar = async (assinatura: string) => {
    setLoadingAprovar(true);
    try {
      const success = await onAprovar(aprovacao.id, assinatura, '');
      
      if (success) {
        setShowAssinatura(false);
      }
    } finally {
      setLoadingAprovar(false);
    }
  };

  const handleRejeitar = async () => {
    if (!observacoesRejeicao.trim()) {
      return;
    }

    setLoadingRejeitar(true);
    try {
      const success = await onRejeitar(aprovacao.id, observacoesRejeicao);
      
      if (success) {
        setShowRejeitar(false);
        setObservacoesRejeicao('');
      }
    } finally {
      setLoadingRejeitar(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'aprovado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pendente aprovação':
      case 'pendente':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'rejeitado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelado':
        return <Timer className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusForColor = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'pendente aprovação') return 'pendente';
    return normalizedStatus;
  };

  return (
    <>
      <Card className="p-6">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {getStatusIcon(aprovacao.status)}
              <div>
                <CardTitle className="text-lg">{aprovacao.funcionario?.nome || 'Funcionário'}</CardTitle>
                <p className="text-sm text-gray-600">{aprovacao.funcionario?.cargo || ''}</p>
              </div>
            </div>
            <Badge className={getStatusColor(getStatusForColor(aprovacao.status))}>
              {aprovacao.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Informações principais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">{formatarData(aprovacao.data)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Horas:</span>
                <span className="font-medium">{aprovacao.entrada} - {aprovacao.saida || '...'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Turno:</span>
                <span className="font-medium">{aprovacao.funcionario?.turno || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Extras:</span>
                <span className="font-bold text-orange-600">{aprovacao.horas_extras}h</span>
              </div>
            </div>
          </div>

          {/* Detalhes do registro */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Detalhes do Registro</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Entrada:</span>
                <p className="font-medium">{aprovacao.entrada}</p>
              </div>
              <div>
                <span className="text-gray-600">Saída:</span>
                <p className="font-medium">{aprovacao.saida || 'Não registrada'}</p>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <p className="font-medium">{aprovacao.horas_trabalhadas}h</p>
              </div>
            </div>
          </div>

          {/* Informações de pendente */}
          {aprovacao.status === 'Pendente Aprovação' && (
            <div className="rounded-lg p-3 bg-orange-100 border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Aguardando Aprovação
                </span>
              </div>
              <p className="text-xs mt-1 text-orange-700">
                Solicitado em {formatarDataHora(aprovacao.created_at)}
              </p>
            </div>
          )}

          {/* Observações */}
          {aprovacao.observacoes && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-blue-800 mb-1">Observações</h4>
              <p className="text-sm text-blue-700">{aprovacao.observacoes}</p>
            </div>
          )}

          {/* Informações de aprovação */}
          {aprovacao.status === 'Aprovado' && aprovacao.data_aprovacao && aprovacao.aprovador && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm text-green-800">Aprovado</span>
              </div>
              <p className="text-xs text-green-700">
                Aprovado em {formatarDataHora(aprovacao.data_aprovacao)} por {aprovacao.aprovador.nome}
              </p>
            </div>
          )}

          {/* Ações para supervisores */}
          {showActions && aprovacao.status === 'Pendente Aprovação' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => setShowAssinatura(true)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Check className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRejeitar(true)}
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Assinatura */}
      <Dialog open={showAssinatura} onOpenChange={(open) => !loadingAprovar && setShowAssinatura(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aprovar Horas Extras</DialogTitle>
            <DialogDescription>
              Assine digitalmente para aprovar as horas extras de <strong>{aprovacao.funcionario?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo da aprovação */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Resumo da Aprovação</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Funcionário:</span>
                  <p className="font-medium">{aprovacao.funcionario?.nome}</p>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-medium">{formatarData(aprovacao.data)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas Extras:</span>
                  <p className="font-bold text-orange-600">{aprovacao.horas_extras}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Período:</span>
                  <p className="font-medium">{aprovacao.entrada} - {aprovacao.saida || '...'}</p>
                </div>
              </div>
            </div>

            {loadingAprovar && (
              <div className="flex items-center justify-center py-4 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando aprovação...
              </div>
            )}

            {/* Componente de assinatura */}
            {!loadingAprovar && (
              <SignaturePad
                title="Assinatura do Supervisor"
                description="Sua assinatura confirma a aprovação das horas extras"
                onSave={handleAprovar}
                onCancel={() => setShowAssinatura(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejeitar} onOpenChange={(open) => !loadingRejeitar && setShowRejeitar(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Horas Extras</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição das horas extras de <strong>{aprovacao.funcionario?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo da rejeição */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Resumo da Rejeição</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Funcionário:</span>
                  <p className="font-medium">{aprovacao.funcionario?.nome}</p>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-medium">{formatarData(aprovacao.data)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas Extras:</span>
                  <p className="font-bold text-orange-600">{aprovacao.horas_extras}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Período:</span>
                  <p className="font-medium">{aprovacao.entrada} - {aprovacao.saida || '...'}</p>
                </div>
              </div>
            </div>

            {/* Campo de observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Rejeição * (mínimo 10 caracteres)
              </label>
              <Textarea
                placeholder="Descreva o motivo da rejeição das horas extras..."
                value={observacoesRejeicao}
                onChange={(e) => setObservacoesRejeicao(e.target.value)}
                rows={4}
                className="w-full"
                disabled={loadingRejeitar}
              />
              <p className="text-xs text-gray-500 mt-1">
                {observacoesRejeicao.length} caracteres
              </p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowRejeitar(false)}
                disabled={loadingRejeitar}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejeitar}
                disabled={!observacoesRejeicao.trim() || observacoesRejeicao.length < 10 || loadingRejeitar}
              >
                {loadingRejeitar ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Rejeitar Horas Extras
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

