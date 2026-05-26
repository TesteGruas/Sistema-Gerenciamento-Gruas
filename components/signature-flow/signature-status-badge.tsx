import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  getSignatureStatusClasses,
  getSignatureStatusLabel,
} from '@/lib/signature-flow-utils'

interface SignatureStatusBadgeProps {
  status: string
  className?: string
}

export function SignatureStatusBadge({ status, className }: SignatureStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium capitalize shrink-0',
        getSignatureStatusClasses(status),
        className,
      )}
    >
      {getSignatureStatusLabel(status)}
    </Badge>
  )
}
