"use client"

import { useState } from 'react'
import { 
  X, 
  Check, 
  Trash2, 
  Calendar,
  User,
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Package,
  Building2,
  DollarSign,
  Users,
  ConeIcon as Crane,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Notificacao, NotificationType, formatarTempoRelativo } from '@/lib/api-notificacoes'

// Configuração de ícones e cores
const tipoConfig: Record<NotificationType, { 
  icon: any; 
  bg: string; 
  text: string; 
  badge: string;
  label: string;
}> = {
  info: { 
    icon: Info, 
    bg: 'bg-blue-100', 
    text: 'text-blue-700', 
    badge: 'bg-blue-500',
    label: 'Informação'
  },
  warning: { 
    icon: AlertTriangle, 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-700', 
    badge: 'bg-yellow-500',
    label: 'Aviso'
  },
  error: { 
    icon: AlertCircle, 
    bg: 'bg-red-100', 
    text: 'text-red-700', 
    badge: 'bg-red-500',
    label: 'Erro'
  },
  success: { 
    icon: CheckCircle, 
    bg: 'bg-green-100', 
    text: 'text-green-700', 
    badge: 'bg-green-500',
    label: 'Sucesso'
  },
  grua: { 
    icon: Crane, 
    bg: 'bg-purple-100', 
    text: 'text-purple-700', 
    badge: 'bg-purple-500',
    label: 'Gruas'
  },
  obra: { 
    icon: Building2, 
    bg: 'bg-orange-100', 
    text: 'text-orange-700', 
    badge: 'bg-orange-500',
    label: 'Obras'
  },
  financeiro: { 
    icon: DollarSign, 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700', 
    badge: 'bg-emerald-500',
    label: 'Financeiro'
  },
  rh: { 
    icon: Users, 
    bg: 'bg-cyan-100', 
    text: 'text-cyan-700', 
    badge: 'bg-cyan-500',
    label: 'RH'
  },
  estoque: { 
    icon: Package, 
    bg: 'bg-amber-100', 
    text: 'text-amber-700', 
    badge: 'bg-amber-500',
    label: 'Estoque'
  },
}

interface NotificacaoDetailModalProps {
  notificacao: Notificacao | null
  isOpen: boolean
  onClose: () => void
  onMarcarComoLida?: (id: string) => void
  onDeletar?: (id: string) => void
}

export function NotificacaoDetailModal({ 
  notificacao, 
  isOpen, 
  onClose, 
  onMarcarComoLida, 
  onDeletar 
}: NotificacaoDetailModalProps) {
  if (!notificacao) return null

  const config = tipoConfig[notificacao.tipo]
  const Icon = config.icon

  // Função para formatar destinatários
  const formatarDestinatarios = (notificacao: Notificacao) => {
    if (notificacao.destinatarios && notificacao.destinatarios.length > 0) {
      if (notificacao.destinatarios[0].tipo === 'geral') {
        return 'Todos os usuários'
      }
      
      if (notificacao.destinatarios.length === 1) {
        const dest = notificacao.destinatarios[0]
        const tipoFormatado = dest.tipo.charAt(0).toUpperCase() + dest.tipo.slice(1)
        const nome = dest.nome || 'N/A'
        return `${tipoFormatado} - ${nome}`
      }
      
      const tipos = notificacao.destinatarios.reduce((acc: any, dest: any) => {
        acc[dest.tipo] = (acc[dest.tipo] || 0) + 1
        return acc
      }, {})
      
      const resumo = Object.entries(tipos).map(([tipo, count]) => {
        const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1)
        return `${count} ${tipoFormatado}${count > 1 ? 's' : ''}`
      }).join(', ')
      
      return `${notificacao.destinatarios.length} destinatários (${resumo})`
    }
    
    if (notificacao.destinatario) {
      const tipoFormatado = notificacao.destinatario.tipo.charAt(0).toUpperCase() + notificacao.destinatario.tipo.slice(1)
      const nome = notificacao.destinatario.nome || 'N/A'
      return `${tipoFormatado} - ${nome}`
    }
    
    return 'Não especificado'
  }

  const handleMarcarComoLida = () => {
    if (onMarcarComoLida && !notificacao.lida) {
      onMarcarComoLida(notificacao.id)
    }
  }

  const handleDeletar = () => {
    if (onDeletar) {
      onDeletar(notificacao.id)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${config.bg} ${config.text}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {notificacao.titulo}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                {!notificacao.lida && (
                  <Badge variant="default" className="bg-blue-500 text-white text-xs">
                    Não lida
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mensagem Principal */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Mensagem</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">
                {notificacao.mensagem}
              </p>
            </div>
          </div>

          {/* Informações Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Remetente */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Remetente
              </h3>
              <p className="text-gray-900">
                {notificacao.remetente || 'Sistema'}
              </p>
            </div>

            {/* Destinatários */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Destinatários
              </h3>
              <p className="text-gray-900">
                {formatarDestinatarios(notificacao)}
              </p>
            </div>

            {/* Data de Criação */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Criação
              </h3>
              <p className="text-gray-900">
                {new Date(notificacao.data).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatarTempoRelativo(notificacao.data)}
              </p>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className="flex items-center gap-2">
                {notificacao.lida ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                )}
                <span className={`text-sm font-medium ${
                  notificacao.lida ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {notificacao.lida ? 'Lida' : 'Não lida'}
                </span>
              </div>
            </div>
          </div>

          {/* Link (se existir) */}
          {notificacao.link && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Link Relacionado</h3>
              <a 
                href={notificacao.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {notificacao.link}
              </a>
            </div>
          )}

          {/* Informações Técnicas */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Informações Técnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 text-gray-900 font-mono">{notificacao.id}</span>
              </div>
              {notificacao.created_at && (
                <div>
                  <span className="text-gray-500">Criado em:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {notificacao.updated_at && (
                <div>
                  <span className="text-gray-500">Atualizado em:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(notificacao.updated_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {!notificacao.lida && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarcarComoLida}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Marcar como lida
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeletar}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
