'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  X
} from 'lucide-react'
import { 
  mockAprovacoes, 
  AprovacaoHorasExtras,
  formatarData,
  formatarDataHora,
  getStatusColor
} from '@/lib/mock-data-aprovacoes'
import { useRouter } from 'next/navigation'

export default function PWAAprovacaoDetalhesPage() {
  const router = useRouter();
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [showRejeitar, setShowRejeitar] = useState(false);
  const [observacoesRejeicao, setObservacoesRejeicao] = useState('');

  // Simular aprovação selecionada (em um app real, viria dos parâmetros da URL)
  const aprovacaoSelecionada = mockAprovacoes.find(a => a.data_trabalho === '2025-10-25');

  const handleAprovar = async (assinatura: string) => {
    try {
      console.log('Aprovando horas extras:', aprovacaoSelecionada?.id, 'Assinatura:', assinatura);
      
      // Simular aprovação
      alert(`✅ Horas extras aprovadas com sucesso!\n\nFuncionário: ${aprovacaoSelecionada?.funcionario.nome}\nHoras: ${aprovacaoSelecionada?.horas_extras}h\nAssinatura: ${assinatura.substring(0, 50)}...`);
      
      setShowAssinatura(false);
      router.back();
    } catch (error) {
      console.error('Erro ao aprovar horas extras:', error);
    }
  };

  const handleRejeitar = async () => {
    try {
      console.log('Rejeitando horas extras:', aprovacaoSelecionada?.id, 'Observações:', observacoesRejeicao);
      
      // Simular rejeição
      alert(`❌ Horas extras rejeitadas!\n\nFuncionário: ${aprovacaoSelecionada?.funcionario.nome}\nMotivo: ${observacoesRejeicao}`);
      
      setShowRejeitar(false);
      setObservacoesRejeicao('');
      router.back();
    } catch (error) {
      console.error('Erro ao rejeitar horas extras:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pendente':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'rejeitado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelado':
        return <Timer className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

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
                  <span className="text-gray-600">Obra:</span>
                  <p className="font-medium">{aprovacaoSelecionada.funcionario.obra}</p>
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
                <p className="font-bold text-blue-800">{formatarData(aprovacaoSelecionada.data_trabalho)}</p>
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

            {/* Status e prazo */}
            <div className={`rounded-lg p-4 ${
              isVencida 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-5 h-5 ${
                  isVencida ? 'text-red-600' : 'text-orange-600'
                }`} />
                <span className={`font-medium ${
                  isVencida ? 'text-red-800' : 'text-orange-800'
                }`}>
                  {isVencida ? 'Prazo Expirado' : 'Aguardando Aprovação'}
                </span>
              </div>
              <p className={`text-sm ${
                isVencida ? 'text-red-700' : 'text-orange-700'
              }`}>
                Prazo limite: {formatarDataHora(aprovacaoSelecionada.data_limite)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        {aprovacaoSelecionada.status === 'pendente' && !isVencida && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setShowAssinatura(true)}
              className="bg-green-600 hover:bg-green-700 h-12"
            >
              <Check className="w-5 h-5 mr-2" />
              Aprovar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejeitar(true)}
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
                  <p className="font-medium">{aprovacaoSelecionada.funcionario.nome}</p>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-medium">{formatarData(aprovacaoSelecionada.data_trabalho)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas Extras:</span>
                  <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Período:</span>
                  <p className="font-medium">{aprovacaoSelecionada.registro.entrada} - {aprovacaoSelecionada.registro.saida}</p>
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
              Informe o motivo da rejeição das horas extras de <strong>{aprovacaoSelecionada.funcionario.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Resumo da rejeição */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Resumo da Rejeição</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Funcionário:</span>
                  <p className="font-medium">{aprovacaoSelecionada.funcionario.nome}</p>
                </div>
                <div>
                  <span className="text-gray-600">Data:</span>
                  <p className="font-medium">{formatarData(aprovacaoSelecionada.data_trabalho)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Horas Extras:</span>
                  <p className="font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
                </div>
                <div>
                  <span className="text-gray-600">Período:</span>
                  <p className="font-medium">{aprovacaoSelecionada.registro.entrada} - {aprovacaoSelecionada.registro.saida}</p>
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
