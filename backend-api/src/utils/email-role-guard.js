/**
 * Impede o mesmo e-mail em roles incompatíveis (Cliente vs Operário vs Supervisor).
 */

import { supabaseAdmin } from '../config/supabase.js'
import { normalizeRoleName } from '../config/roles.js'

const TARGET_CLIENTE = 'cliente'
const TARGET_OPERARIO = 'operario'
const TARGET_SUPERVISOR = 'supervisor'

function perfilEhSupervisor(nome) {
  const raw = String(nome || '').trim().toLowerCase()
  return raw === 'supervisores' || raw === 'supervisor'
}

function perfilEhCliente(nome) {
  const raw = String(nome || '').trim().toLowerCase()
  return raw === 'clientes' || raw === 'cliente' || raw === 'visualizador'
}

function perfilEhOperario(nome) {
  const raw = String(nome || '').trim().toLowerCase()
  return (
    raw === 'operários' ||
    raw === 'operarios' ||
    raw === 'operário' ||
    raw === 'operario' ||
    raw === 'operador'
  )
}

async function getUsuarioByEmail(email) {
  const emailNorm = String(email || '').toLowerCase().trim()
  if (!emailNorm) return null
  const { data } = await supabaseAdmin
    .from('usuarios')
    .select('id, email, nome, funcionario_id, eh_funcionario')
    .ilike('email', emailNorm)
    .maybeSingle()
  return data
}

async function getPerfisAtivos(usuarioId) {
  const { data } = await supabaseAdmin
    .from('usuario_perfis')
    .select('perfis(nome)')
    .eq('usuario_id', usuarioId)
    .eq('status', 'Ativa')
  return (data || []).map((row) => row.perfis?.nome).filter(Boolean)
}

async function hasResponsavelObraAtivo(email) {
  const emailNorm = String(email || '').toLowerCase().trim()
  const { data } = await supabaseAdmin
    .from('responsaveis_obra')
    .select('id')
    .ilike('email', emailNorm)
    .eq('ativo', true)
    .limit(1)
  return Array.isArray(data) && data.length > 0
}

async function hasFuncionarioAtivo(usuario) {
  if (!usuario?.funcionario_id) return false
  const { data } = await supabaseAdmin
    .from('funcionarios')
    .select('id, status')
    .eq('id', usuario.funcionario_id)
    .maybeSingle()
  if (!data) return false
  const status = String(data.status || '').toLowerCase()
  return status === 'ativo' || status === 'active'
}

/**
 * @param {string} email
 * @param {'cliente'|'operario'|'supervisor'} targetRole
 * @param {number|null} ignoreUsuarioId - ignorar ao atualizar o mesmo usuário
 */
export async function assertEmailAvailableForRole(email, targetRole, ignoreUsuarioId = null) {
  const usuario = await getUsuarioByEmail(email)
  const responsavelObra = await hasResponsavelObraAtivo(email)

  if (!usuario && !responsavelObra) {
    return { allowed: true }
  }

  const perfis = usuario ? await getPerfisAtivos(usuario.id) : []
  const funcionarioAtivo = usuario ? await hasFuncionarioAtivo(usuario) : false
  const isSameUser = ignoreUsuarioId != null && usuario?.id === ignoreUsuarioId

  const temCliente = perfis.some(perfilEhCliente)
  const temSupervisor = perfis.some(perfilEhSupervisor)
  const temOperario = perfis.some(perfilEhOperario) || (funcionarioAtivo && perfis.some((p) => normalizeRoleName(p) === 'Operários'))

  if (targetRole === TARGET_CLIENTE) {
    if (isSameUser) {
      return { allowed: true }
    }
    if (temOperario || funcionarioAtivo) {
      return {
        allowed: false,
        conflict: 'operario',
        message:
          'Este e-mail já está cadastrado como funcionário/operário. Use outro e-mail ou remova o vínculo anterior.',
      }
    }
    if (temSupervisor || responsavelObra) {
      return {
        allowed: false,
        conflict: 'supervisor',
        message:
          'Este e-mail já está cadastrado como responsável de obra/supervisor. Use outro e-mail ou remova o vínculo anterior.',
      }
    }
  }

  if (targetRole === TARGET_OPERARIO) {
    if (temCliente) {
      return {
        allowed: false,
        conflict: 'cliente',
        message:
          'Este e-mail já está cadastrado como Cliente. Use outro e-mail ou remova o vínculo anterior.',
      }
    }
    if (temSupervisor || responsavelObra) {
      return {
        allowed: false,
        conflict: 'supervisor',
        message:
          'Este e-mail já está cadastrado como responsável de obra/supervisor. Use outro e-mail ou remova o vínculo anterior.',
      }
    }
  }

  if (targetRole === TARGET_SUPERVISOR) {
    if (temCliente) {
      return {
        allowed: false,
        conflict: 'cliente',
        message:
          'Este e-mail já está cadastrado como Cliente. Use outro e-mail ou remova o vínculo anterior.',
      }
    }
    if (temOperario || funcionarioAtivo) {
      return {
        allowed: false,
        conflict: 'operario',
        message:
          'Este e-mail já está cadastrado como funcionário/operário. Use outro e-mail ou remova o vínculo anterior.',
      }
    }
  }

  return { allowed: true }
}

export async function limparVinculosIncompatiblesComCliente(email, usuarioId) {
  const emailNorm = String(email || '').toLowerCase().trim()

  await supabaseAdmin
    .from('responsaveis_obra')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .ilike('email', emailNorm)
    .eq('ativo', true)

  await supabaseAdmin
    .from('usuarios')
    .update({
      funcionario_id: null,
      eh_funcionario: false,
      cargo: null,
      turno: null,
      data_admissao: null,
      salario: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', usuarioId)
}

export async function atualizarAuthMetadataCliente(email, nome) {
  const emailNorm = String(email || '').toLowerCase().trim()
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    console.error('[email-role-guard] listUsers:', listError)
    return
  }
  const authUser = listData.users.find((u) => u.email?.toLowerCase() === emailNorm)
  if (!authUser) return

  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    user_metadata: {
      nome: nome || authUser.user_metadata?.nome,
      tipo: 'cliente',
      email_verified: authUser.user_metadata?.email_verified ?? true,
    },
  })
  if (error) {
    console.error('[email-role-guard] updateUserById metadata cliente:', error)
  }
}

export { TARGET_CLIENTE, TARGET_OPERARIO, TARGET_SUPERVISOR }
