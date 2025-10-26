'use client'

import { useState } from 'react'
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
  ChevronUp
} from 'lucide-react'
import { 
  mockAprovacoes, 
  AprovacaoHorasExtras,
  formatarData,
  formatarDataHora,
  getStatusColor
} from '@/lib/mock-data-aprovacoes'
import { useRouter } from 'next/navigation'

export default function PWAAprovacaoAssinaturaPage() {
  const router = useRouter();
  const [assinatura, setAssinatura] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);

  // Simular aprovação selecionada (em um app real, viria dos parâmetros da URL)
  const aprovacaoSelecionada = mockAprovacoes.find(a => a.data_trabalho === '2025-10-25' && a.status === 'pendente');

  const handleAprovar = async () => {
    if (!assinatura.trim()) {
      alert('Por favor, assine digitalmente antes de aprovar.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Aprovando horas extras:', aprovacaoSelecionada?.id, 'Assinatura:', assinatura);
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mostrar notificação de sucesso
      showSuccessNotification();
      
      // Voltar para a página anterior após 2 segundos
      setTimeout(() => {
        router.back();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao aprovar horas extras:', error);
      alert('Erro ao aprovar horas extras. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessNotification = () => {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-in';
    notification.innerHTML = `
      <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div>
        <p class="font-semibold">✅ Horas Extras Aprovadas!</p>
        <p class="text-sm opacity-90">Funcionário: ${aprovacaoSelecionada?.funcionario.nome}</p>
        <p class="text-sm opacity-90">Horas: ${aprovacaoSelecionada?.horas_extras}h</p>
      </div>
    `;
    
    // Adicionar estilos CSS para animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remover notificação após 3 segundos
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
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
          <h1 className="text-xl font-bold text-gray-900">Assinatura Digital</h1>
        </div>
        <p className="text-sm text-gray-600">Aprove as horas extras com sua assinatura digital</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Resumo Compacto da Aprovação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-lg">Aprovação de Horas Extras</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetalhes(!showDetalhes)}
                className="p-1"
              >
                {showDetalhes ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Resumo Principal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{aprovacaoSelecionada.funcionario.nome}</h3>
                  <p className="text-sm text-gray-600">{aprovacaoSelecionada.funcionario.cargo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Horas Extras</p>
                <p className="text-xl font-bold text-orange-600">{aprovacaoSelecionada.horas_extras}h</p>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">{formatarData(aprovacaoSelecionada.data_trabalho)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Período:</span>
                <span className="font-medium">{aprovacaoSelecionada.registro.entrada} - {aprovacaoSelecionada.registro.saida}</span>
              </div>
            </div>

            {/* Status */}
            <div className={`rounded-lg p-3 ${
              isVencida 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${
                  isVencida ? 'text-red-600' : 'text-orange-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isVencida ? 'text-red-800' : 'text-orange-800'
                }`}>
                  {isVencida ? 'Prazo Expirado' : 'Aguardando Aprovação'}
                </span>
              </div>
            </div>

            {/* Detalhes Expandíveis */}
            {showDetalhes && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                {/* Informações do funcionário */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Informações do Funcionário</h4>
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

                {/* Detalhes do período */}
                <div className="bg-white border rounded-lg p-3">
                  <h4 className="font-medium text-gray-700 mb-2">Detalhes do Período</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-1">Prazo de Aprovação</h4>
                  <p className="text-sm text-blue-700">
                    Prazo limite: {formatarDataHora(aprovacaoSelecionada.data_limite)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Componente de Assinatura - Layout Mobile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Assinatura Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Instruções */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                📝 Assine digitalmente para aprovar as horas extras
              </p>
            </div>

            {/* Canvas de Assinatura - Mobile Otimizado */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
              <SignaturePad
                title=""
                description=""
                onSave={setAssinatura}
                onCancel={() => setAssinatura('')}
                className="mobile-signature"
              />
            </div>

            {/* Status da Assinatura */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${assinatura ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {assinatura ? 'Assinatura realizada' : 'Aguardando assinatura'}
                </span>
              </div>
              {assinatura && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssinatura('')}
                  className="text-xs"
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
            height: 200px;
            width: 100%;
          }
          
          @media (max-width: 640px) {
            .mobile-signature {
              height: 150px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
