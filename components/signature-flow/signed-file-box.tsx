import { Download, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSignedFileDisplayName } from '@/lib/signature-flow-utils'

interface SignedFileBoxProps {
  arquivoUrl: string
  onDownload: (url: string) => void
  disabled?: boolean
}

export function SignedFileBox({ arquivoUrl, onDownload, disabled }: SignedFileBoxProps) {
  const fileName = getSignedFileDisplayName(arquivoUrl)

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
            <FileSignature className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              Documento assinado disponível para download
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10 shrink-0 w-full sm:w-auto"
          disabled={disabled}
          onClick={() => onDownload(arquivoUrl)}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar arquivo
        </Button>
      </div>
    </div>
  )
}
