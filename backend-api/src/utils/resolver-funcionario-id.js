import { supabaseAdmin } from '../config/supabase.js'

function limparCpf(cpf) {
  return String(cpf || '').replace(/\D/g, '')
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

/**
 * Garante um ID válido de `funcionarios`.
 * A listagem de RH às vezes expõe `usuarios.id` sem `funcionario_id`;
 * nesses casos tenta achar o funcionário real (por vínculo, e-mail ou CPF)
 * e religa o usuário órfão quando possível.
 *
 * @param {number|string} idInformado
 * @returns {Promise<{
 *   funcionarioId: number|null,
 *   funcionario: object|null,
 *   resolvidoDeUsuarioOrfao: boolean,
 *   usuarioId: number|null,
 *   motivo?: string
 * }>}
 */
export async function resolverFuncionarioId(idInformado) {
  const id = Number(idInformado)
  if (!Number.isInteger(id) || id <= 0) {
    return {
      funcionarioId: null,
      funcionario: null,
      resolvidoDeUsuarioOrfao: false,
      usuarioId: null,
      motivo: 'ID inválido'
    }
  }

  const { data: funcionarioDireto, error: erroDireto } = await supabaseAdmin
    .from('funcionarios')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (erroDireto) {
    throw erroDireto
  }

  if (funcionarioDireto) {
    return {
      funcionarioId: funcionarioDireto.id,
      funcionario: funcionarioDireto,
      resolvidoDeUsuarioOrfao: false,
      usuarioId: null
    }
  }

  const { data: usuario, error: erroUsuario } = await supabaseAdmin
    .from('usuarios')
    .select('id, nome, email, cpf, funcionario_id, status, deleted_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (erroUsuario) {
    throw erroUsuario
  }

  if (!usuario) {
    return {
      funcionarioId: null,
      funcionario: null,
      resolvidoDeUsuarioOrfao: false,
      usuarioId: null,
      motivo: 'Funcionário não encontrado'
    }
  }

  if (usuario.funcionario_id) {
    const { data: funcionarioVinculado, error: erroVinculo } = await supabaseAdmin
      .from('funcionarios')
      .select('*')
      .eq('id', usuario.funcionario_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (erroVinculo) throw erroVinculo

    if (funcionarioVinculado) {
      return {
        funcionarioId: funcionarioVinculado.id,
        funcionario: funcionarioVinculado,
        resolvidoDeUsuarioOrfao: true,
        usuarioId: usuario.id
      }
    }
  }

  let funcionarioEncontrado = null
  const email = normalizarEmail(usuario.email)
  const cpfDigits = limparCpf(usuario.cpf)

  if (email) {
    const { data: porEmail, error: erroEmail } = await supabaseAdmin
      .from('funcionarios')
      .select('*')
      .ilike('email', email)
      .is('deleted_at', null)
      .limit(5)

    if (erroEmail) throw erroEmail

    if (porEmail?.length === 1) {
      funcionarioEncontrado = porEmail[0]
    } else if (porEmail?.length > 1 && cpfDigits) {
      funcionarioEncontrado =
        porEmail.find((f) => limparCpf(f.cpf) === cpfDigits) || null
    }
  }

  if (!funcionarioEncontrado && cpfDigits.length >= 11) {
    const { data: candidatos, error: erroCpf } = await supabaseAdmin
      .from('funcionarios')
      .select('*')
      .is('deleted_at', null)
      .or(`cpf.eq.${cpfDigits},cpf.eq.${cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`)
      .limit(5)

    if (erroCpf) throw erroCpf

    const matches = (candidatos || []).filter((f) => limparCpf(f.cpf) === cpfDigits)
    if (matches.length === 1) {
      funcionarioEncontrado = matches[0]
    }
  }

  if (!funcionarioEncontrado) {
    return {
      funcionarioId: null,
      funcionario: null,
      resolvidoDeUsuarioOrfao: true,
      usuarioId: usuario.id,
      motivo:
        'Este ID é de um usuário do sistema sem vínculo com a tabela funcionarios. Cadastre/religue o colaborador antes de criar certificados.'
    }
  }

  // Religa usuário órfão ao funcionário real (só se ninguém mais estiver usando esse vínculo no próprio usuário)
  if (!usuario.funcionario_id) {
    const { error: erroLink } = await supabaseAdmin
      .from('usuarios')
      .update({
        funcionario_id: funcionarioEncontrado.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', usuario.id)
      .is('funcionario_id', null)

    if (erroLink) {
      console.warn('[resolverFuncionarioId] Falha ao religar usuário órfão:', erroLink.message)
    } else {
      console.log(
        `[resolverFuncionarioId] Usuário ${usuario.id} religado ao funcionário ${funcionarioEncontrado.id}`
      )
    }
  }

  return {
    funcionarioId: funcionarioEncontrado.id,
    funcionario: funcionarioEncontrado,
    resolvidoDeUsuarioOrfao: true,
    usuarioId: usuario.id
  }
}
