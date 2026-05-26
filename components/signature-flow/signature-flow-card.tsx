'use client'

import { AssinaturaDocumento } from '@/lib/api-obras-documentos'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getSignatureFlowStats } from '@/lib/signature-flow-utils'
import { SignatureStepItem } from './signature-step-item'

interface SignatureFlowCardProps {
  assinaturas: AssinaturaDocumento[]
  currentUserId: number
  expandedAssinatura: string | null
  onToggleExpand: (userId: string) => void
  onDownloadArquivo: (url: string) => void
  onOpenUploadDialog: (assinaturaId: string) => void
  onOpenMainUploadDialog: () => void
  isLoading?: boolean
}

export function SignatureFlowCard({
  assinaturas,
  currentUserId,
  expandedAssinatura,
  onToggleExpand,
  onDownloadArquivo,
  onOpenUploadDialog,
  onOpenMainUploadDialog,
  isLoading,
}: SignatureFlowCardProps) {
  const sorted = [...assinaturas].sort((a, b) => a.ordem - b.ordem)
  const { total, assinados, pendentes } = getSignatureFlowStats(sorted)

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-4 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Fluxo de Assinaturas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe a ordem, status e arquivos assinados
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <StatPill label="Total" value={total} />
          <StatPill label="Assinados" value={assinados} variant="success" />
          <StatPill label="Pendentes" value={pendentes} variant="pending" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum assinante configurado.</p>
        ) : (
          <div role="list" aria-label="Fluxo de assinaturas">
            {sorted.map((assinatura, index) => {
              const userKey = assinatura.user_id.toString()
              const isCurrentUser = assinatura.user_id === currentUserId
              const isExpanded = expandedAssinatura === userKey

              return (
                <SignatureStepItem
                  key={assinatura.id}
                  assinatura={assinatura}
                  isLast={index === sorted.length - 1}
                  isCurrentUser={isCurrentUser}
                  isExpanded={isExpanded}
                  onToggleExpand={() => onToggleExpand(userKey)}
                  onDownloadArquivo={onDownloadArquivo}
                  onOpenUploadDialog={onOpenUploadDialog}
                  onOpenMainUploadDialog={onOpenMainUploadDialog}
                  isLoading={isLoading}
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatPill({
  label,
  value,
  variant = 'default',
}: {
  label: string
  value: number
  variant?: 'default' | 'success' | 'pending'
}) {
  const valueClass =
    variant === 'success'
      ? 'text-emerald-700'
      : variant === 'pending'
        ? 'text-amber-700'
        : 'text-foreground'

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-center">
      <p className={`text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
