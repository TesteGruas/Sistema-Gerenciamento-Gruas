'use client'

import { CheckCircle, ExternalLink, Upload } from 'lucide-react'
import { AssinaturaDocumento } from '@/lib/api-obras-documentos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatSignatureDate } from '@/lib/signature-flow-utils'
import { SignatureStatusBadge } from './signature-status-badge'
import { SignedFileBox } from './signed-file-box'

interface SignatureDetailsProps {
  assinatura: AssinaturaDocumento
  isCurrentUser: boolean
  onDownloadArquivo: (url: string) => void
  onOpenUploadDialog: (assinaturaId: string) => void
  onOpenMainUploadDialog: () => void
  isLoading?: boolean
}

export function SignatureDetails({
  assinatura,
  isCurrentUser,
  onDownloadArquivo,
  onOpenUploadDialog,
  onOpenMainUploadDialog,
  isLoading,
}: SignatureDetailsProps) {
  const dataAssinatura = formatSignatureDate(assinatura.data_assinatura)
  const dataEnvio = formatSignatureDate(assinatura.data_envio)

  return (
    <div className="space-y-5 border-t border-border pt-4">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailItem label="Nome completo" value={assinatura.user_nome || 'N/A'} />
        <DetailItem label="Cargo" value={assinatura.user_cargo || 'N/A'} />
        <DetailItem label="E-mail" value={assinatura.user_email || 'N/A'} />
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tipo
          </dt>
          <dd className="mt-1">
            <Badge variant="outline" className="capitalize">
              {assinatura.tipo}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <SignatureStatusBadge status={assinatura.status} />
            {dataEnvio && (
              <span className="text-xs text-muted-foreground">Enviado em {dataEnvio}</span>
            )}
          </dd>
        </div>
        {dataAssinatura && (
          <DetailItem label="Data de assinatura" value={dataAssinatura} />
        )}
      </dl>

      {assinatura.docu_sign_link && (
        <div>
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Link DocuSign
          </Label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={assinatura.docu_sign_link}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-10 shrink-0"
              onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {assinatura.arquivo_assinado ? (
        <SignedFileBox
          arquivoUrl={assinatura.arquivo_assinado}
          onDownload={onDownloadArquivo}
          disabled={isLoading}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4">
          <p className="text-sm text-muted-foreground">
            Nenhum arquivo assinado enviado para este responsável.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 min-h-10"
            onClick={() => onOpenUploadDialog(assinatura.id.toString())}
          >
            <Upload className="mr-2 h-4 w-4" />
            Enviar arquivo assinado
          </Button>
        </div>
      )}

      {assinatura.observacoes && (
        <div>
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Observações
          </Label>
          <p className="mt-1 rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground">
            {assinatura.observacoes}
          </p>
        </div>
      )}

      {isCurrentUser && assinatura.status === 'aguardando' && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4">
          <p className="text-sm font-medium text-sky-900">É sua vez de assinar</p>
          <p className="mt-1 text-xs text-sky-700">
            Acesse o DocuSign, assine o documento e envie o arquivo assinado.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {assinatura.docu_sign_link && (
              <Button
                type="button"
                size="sm"
                className="min-h-10 flex-1"
                onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir DocuSign
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-10 flex-1"
              onClick={onOpenMainUploadDialog}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload assinado
            </Button>
          </div>
        </div>
      )}

      {isCurrentUser && assinatura.status === 'pendente' && (
        <p className="text-sm text-muted-foreground">
          Aguardando sua vez — você será notificado quando for possível assinar.
        </p>
      )}

      {isCurrentUser && assinatura.status === 'rejeitado' && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm font-medium text-red-900">Documento recusado</p>
          <p className="mt-1 text-xs text-red-700">
            Entre em contato com o administrador para mais informações.
          </p>
          {assinatura.docu_sign_link && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 min-h-10"
              onClick={() => window.open(assinatura.docu_sign_link, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver no DocuSign
            </Button>
          )}
        </div>
      )}

      {assinatura.email_enviado && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>E-mail de notificação enviado</span>
          {assinatura.data_email_enviado && (
            <span className="text-xs">
              em {formatSignatureDate(assinatura.data_email_enviado)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}
