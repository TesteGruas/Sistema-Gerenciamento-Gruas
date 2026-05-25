/**
 * Resolução de perfil PWA no backend.
 * Fonte de verdade: perfil ativo em usuario_perfis (perfilNome/role).
 */

import { normalizeRoleName } from '../config/roles.js'

function perfilNomeIndicaSupervisor(perfilNome) {
  const raw = String(perfilNome || '').trim().toLowerCase()
  return raw === 'supervisores' || raw === 'supervisor'
}

function perfilNomeIndicaCliente(perfilNome) {
  const raw = String(perfilNome || '').trim().toLowerCase()
  return raw === 'clientes' || raw === 'cliente' || raw === 'visualizador'
}

function perfilNomeIndicaOperario(perfilNome) {
  const raw = String(perfilNome || '').trim().toLowerCase()
  return (
    raw === 'operários' ||
    raw === 'operarios' ||
    raw === 'operário' ||
    raw === 'operario' ||
    raw === 'operador'
  )
}

/**
 * @param {object} params
 * @param {object|null} params.profile
 * @param {object|null} params.user
 * @param {Array} params.obrasResponsavel
 * @param {string|null} params.role - role normalizado (Clientes, Operários, ...)
 * @param {string|null} params.perfilNome - nome bruto do perfil no banco
 * @param {boolean} params.funcionarioAtivo - funcionário vinculado e status Ativo
 */
export function resolvePwaProfile({
  profile,
  user,
  obrasResponsavel = [],
  role = null,
  perfilNome = null,
  funcionarioAtivo = false,
}) {
  if (
    user?.pwa_profile === 'cliente' ||
    user?.pwa_profile === 'supervisor' ||
    user?.pwa_profile === 'tecnico'
  ) {
    return user.pwa_profile
  }

  const rawPerfil = perfilNome || profile?.perfil?.nome || null
  const normalizedRole = normalizeRoleName(role || rawPerfil)

  // 1) Perfil Cliente no sistema
  if (perfilNomeIndicaCliente(rawPerfil) || normalizedRole === 'Clientes') {
    return 'cliente'
  }

  // 2) Perfil Supervisor (nome bruto — normalizeRoleName mapeia Supervisor→Clientes)
  if (perfilNomeIndicaSupervisor(rawPerfil)) {
    return 'supervisor'
  }

  // 3) Operário com funcionário ativo
  if (
    (perfilNomeIndicaOperario(rawPerfil) || normalizedRole === 'Operários') &&
    funcionarioAtivo
  ) {
    return 'tecnico'
  }

  const tipo = user?.user_metadata?.tipo || profile?.user_metadata?.tipo

  // Fallback legado (sem perfil claro)
  if (tipo === 'cliente') return 'cliente'

  if (tipo === 'responsavel_obra' || (Array.isArray(obrasResponsavel) && obrasResponsavel.length > 0)) {
    return 'supervisor'
  }

  if (tipo === 'funcionario' && funcionarioAtivo) return 'tecnico'

  const funcionarioId =
    profile?.funcionario_id || user?.funcionario_id || user?.user_metadata?.funcionario_id
  if (funcionarioId && funcionarioAtivo && normalizedRole === 'Operários') {
    return 'tecnico'
  }

  return null
}

export async function isFuncionarioAtivo(supabaseAdmin, funcionarioId) {
  if (!funcionarioId) return false
  const { data, error } = await supabaseAdmin
    .from('funcionarios')
    .select('id, status')
    .eq('id', funcionarioId)
    .maybeSingle()
  if (error || !data) return false
  const status = String(data.status || '').toLowerCase()
  return status === 'ativo' || status === 'active'
}

export async function usuarioEhResponsavelObra(supabaseAdmin, email, obraId = null) {
  if (!email) return false

  let query = supabaseAdmin
    .from('responsaveis_obra')
    .select('id, obra_id')
    .eq('email', email)
    .eq('ativo', true)

  if (obraId != null) {
    query = query.eq('obra_id', obraId)
  }

  const { data, error } = await query.limit(1)
  if (error) {
    console.error('[pwa-profile] Erro ao verificar responsavel_obra:', error)
    return false
  }

  return Array.isArray(data) && data.length > 0
}
