/**
 * Telefone brasileiro para WhatsApp (E.164 sem "+": 55 + DDD + 9 dígitos do celular).
 *
 * Não inventa DDD nem corrige dígitos: o número precisa estar completo no cadastro.
 * Se estiver incompleto, use {@link validarTelefoneWhatsappBrasil} e informe o usuário/admin.
 */

/**
 * @param {string|null|undefined} telefone
 * @returns {{ ok: boolean, e164: string|null, mensagem: string|null }}
 */
export function validarTelefoneWhatsappBrasil(telefone) {
  if (telefone == null || String(telefone).trim() === '') {
    return { ok: false, e164: null, mensagem: 'Telefone não informado no cadastro.' };
  }

  let n = String(telefone).replace(/\D/g, '');
  if (!n) {
    return { ok: false, e164: null, mensagem: 'Telefone inválido (sem dígitos).' };
  }

  if (n.startsWith('0')) n = n.substring(1);

  // Formato completo internacional BR: 55 + 11 dígitos nacionais = 13 dígitos
  if (n.startsWith('55')) {
    if (n.length === 13) {
      return { ok: true, e164: n, mensagem: null };
    }
    return {
      ok: false,
      e164: null,
      mensagem: `Número com código do país (55) incompleto (${n.length} dígitos). Cadastre 13 dígitos: 55 + DDD + 9 dígitos do celular (ex.: 5581987440990).`
    };
  }

  // 11 dígitos: DDD (2) + celular (9: começa com 9)
  if (n.length === 11) {
    return { ok: true, e164: `55${n}`, mensagem: null };
  }

  if (n.length < 11) {
    return {
      ok: false,
      e164: null,
      mensagem:
        'Telefone incompleto: falta DDD ou dígitos. Cadastre 11 dígitos com DDD (ex.: 81987440990), sem o 55.'
    };
  }

  return {
    ok: false,
    e164: null,
    mensagem:
      'Formato inválido: use 11 dígitos com DDD (celular) ou 13 dígitos com 55 e DDD (ex.: 5581987440990).'
  };
}

/**
 * @param {string|null|undefined} telefone
 * @returns {string|null} E.164 sem "+" ou null se inválido
 */
export function normalizarTelefoneBrasilParaWhatsApp(telefone) {
  const v = validarTelefoneWhatsappBrasil(telefone);
  if (!v.ok) {
    if (telefone != null && String(telefone).trim() !== '') {
      console.warn(`[telefone-brasil] ${v.mensagem} Valor informado: "${telefone}"`);
    }
    return null;
  }
  return v.e164;
}
