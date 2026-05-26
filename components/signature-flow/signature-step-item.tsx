'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { AssinaturaDocumento } from '@/lib/api-obras-documentos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  formatSignatureDate,
  getSignatureStepIndicatorClasses,
} from '@/lib/signature-flow-utils'
import { SignatureStatusBadge } from './signature-status-badge'
import { SignatureDetails } from './signature-details'

interface SignatureStepItemProps {
  assinatura: AssinaturaDocumento
  isLast: boolean
  isCurrentUser: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onDownloadArquivo: (url: string) => void
  onOpenUploadDialog: (assinaturaId: string) => void
  onOpenMainUploadDialog: () => void
  isLoading?: boolean
}

export function SignatureStepItem({
  assinatura,
  isLast,
  isCurrentUser,
  isExpanded,
  onToggleExpand,
  onDownloadArquivo,
  onOpenUploadDialog,
  onOpenMainUploadDialog,
  isLoading,
}: SignatureStepItemProps) {
  const dataAssinatura = formatSignatureDate(assinatura.data_assinatura)
  const indicatorClasses = getSignatureStepIndicatorClasses(assinatura.status)

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
            indicatorClasses,
          )}
          aria-hidden
        >
          {assinatura.ordem}
        </div>
        {!isLast && (
          <div
            className="mt-1 w-px flex-1 min-h-[1rem] bg-border"
            aria-hidden
          />
        )}
      </div>

      <div
        className={cn(
          'mb-4 min-w-0 flex-1 rounded-xl border bg-card transition-colors',
          isCurrentUser ? 'border-sky-200 ring-1 ring-sky-100' : 'border-border',
          isExpanded && 'shadow-sm',
        )}
      >
        <div className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">
                  {assinatura.user_nome || 'Usuário não encontrado'}
                </p>
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs">
                    Você
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {[assinatura.user_cargo, assinatura.tipo].filter(Boolean).join(' · ')}
              </p>
              {assinatura.user_email && (
                <p className="truncate text-sm text-muted-foreground">{assinatura.user_email}</p>
              )}
              {dataAssinatura && (
                <p className="text-xs text-muted-foreground">Assinado em {dataAssinatura}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end xl:flex-row xl:items-center">
              <SignatureStatusBadge status={assinatura.status} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-10 text-foreground"
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Ver detalhes
                  </>
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <SignatureDetails
              assinatura={assinatura}
              isCurrentUser={isCurrentUser}
              onDownloadArquivo={onDownloadArquivo}
              onOpenUploadDialog={onOpenUploadDialog}
              onOpenMainUploadDialog={onOpenMainUploadDialog}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
