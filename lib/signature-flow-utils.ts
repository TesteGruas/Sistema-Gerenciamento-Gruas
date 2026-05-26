import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function getSignatureStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    assinado: 'Assinado',
    pendente: 'Pendente',
    aguardando: 'Aguardando',
    rejeitado: 'Recusado',
    cancelado: 'Cancelado',
  }
  return labels[status] ?? status
}

export function getSignatureStatusClasses(status: string): string {
  switch (status) {
    case 'assinado':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pendente':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'aguardando':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'rejeitado':
    case 'cancelado':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function getSignatureStepIndicatorClasses(status: string): string {
  switch (status) {
    case 'assinado':
      return 'border-emerald-500 bg-emerald-500 text-white'
    case 'pendente':
      return 'border-amber-400 bg-white text-amber-700'
    case 'aguardando':
      return 'border-sky-500 bg-sky-500 text-white'
    case 'rejeitado':
    case 'cancelado':
      return 'border-red-500 bg-red-500 text-white'
    default:
      return 'border-muted-foreground/30 bg-muted text-muted-foreground'
  }
}

export function formatSignatureDate(date: string | undefined | null): string | null {
  if (!date) return null
  try {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return null
  }
}

export function getSignedFileDisplayName(arquivoUrl: string | undefined): string {
  if (!arquivoUrl) return 'Arquivo não disponível'

  if (arquivoUrl.includes('supabase.co/storage')) {
    const parts = arquivoUrl.split('/')
    const filename = parts[parts.length - 1]
    const match = filename.match(/assinado_\d+_([^.]+)\.(.+)$/)
    if (match) {
      return `documento_assinado.${match[2]}`
    }
    return filename
  }

  return arquivoUrl
}

export function getSignatureFlowStats(assinaturas: { status: string }[]) {
  const total = assinaturas.length
  const assinados = assinaturas.filter((a) => a.status === 'assinado').length
  const pendentes = total - assinados
  return { total, assinados, pendentes }
}
