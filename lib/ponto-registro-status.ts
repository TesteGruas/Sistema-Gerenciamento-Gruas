/** Chave estável para comparar status de registro de ponto (acentos, espaços, maiúsculas). */
export function normalizePontoStatusKey(status: string | undefined): string {
  if (!status) return ""
  return status
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
}

export function isPendenteAssinaturaFuncionarioStatus(status: string | undefined): boolean {
  return (
    normalizePontoStatusKey(status) ===
    normalizePontoStatusKey("Pendente Assinatura Funcionário")
  )
}

export function isPendenteCorrecaoStatus(status: string | undefined): boolean {
  return normalizePontoStatusKey(status) === normalizePontoStatusKey("Pendente Correção")
}
