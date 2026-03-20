/**
 * Validação de telefone BR para WhatsApp (mesma regra do backend: telefone-brasil.js).
 * Telefone vazio = ok (opcional). Se houver qualquer dígito, exige formato completo.
 */
export function mensagemTelefoneBrWhatsappSePreenchido(telefone: string | null | undefined): string | null {
  if (telefone == null || String(telefone).trim() === '') return null

  let n = String(telefone).replace(/\D/g, '')
  if (!n) return null
  if (n.startsWith('0')) n = n.substring(1)

  if (n.startsWith('55')) {
    return n.length === 13
      ? null
      : 'Com código 55: informe 13 dígitos (55 + DDD + 9 dígitos do celular), ex.: 5581987440990.'
  }

  if (n.length === 11) return null

  if (n.length < 11) {
    return 'Informe 11 dígitos com DDD (celular), ex.: 81987440990 — sem o 55 no início.'
  }

  return 'Formato inválido. Use 11 dígitos com DDD ou 13 com 55 e DDD (ex.: 5581987440990).'
}
