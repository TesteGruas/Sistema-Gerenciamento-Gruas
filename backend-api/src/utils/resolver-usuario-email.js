export function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase()
}

/**
 * Acha o usuário ativo pelo e-mail sem diferenciar maiúsculas.
 * Se houver mais de um, fica o que está ligado a um funcionário.
 */
function escolherUsuario(lista) {
  if (!lista?.length) return null
  const pontuacao = (usuario) =>
    (usuario.deleted_at ? 0 : 8) +
    (usuario.funcionario_id ? 4 : 0) +
    (usuario.eh_funcionario ? 2 : 0)
  const ordenada = [...lista].sort((a, b) => pontuacao(b) - pontuacao(a) || a.id - b.id)
  return ordenada[0]
}

export async function resolverUsuarioPorEmail(supabaseAdmin, email) {
  const emailNorm = normalizarEmail(email)
  if (!emailNorm) return null

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .ilike('email', emailNorm)

  if (error) {
    console.error('[resolverUsuarioPorEmail]', error.message)
    return null
  }

  const ativos = (data || []).filter((usuario) => !usuario.deleted_at)
  return escolherUsuario(ativos.length ? ativos : data)
}

export async function localizarUsuarioAuth(supabaseAdmin, email) {
  const emailNorm = normalizarEmail(email)
  if (!emailNorm) return null

  const admin = supabaseAdmin.auth.admin
  if (typeof admin.getUserByEmail === 'function') {
    try {
      const { data, error } = await admin.getUserByEmail(emailNorm)
      if (!error && data?.user) return data.user
    } catch {
      /* segue para a listagem */
    }
  }

  let page = 1
  while (page <= 25) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 })
    if (error) break
    const users = data?.users || []
    const achado = users.find((user) => normalizarEmail(user.email) === emailNorm)
    if (achado) return achado
    if (users.length < 200) break
    page += 1
  }
  return null
}

/** Remove o login do Supabase Auth para o e-mail poder ser usado de novo. */
export async function removerLoginAuthPorEmail(supabaseAdmin, email) {
  const authUser = await localizarUsuarioAuth(supabaseAdmin, email)
  if (!authUser?.id) return { removido: false }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)
  if (error) {
    console.warn('[removerLoginAuthPorEmail]', error.message)
    return { removido: false, erro: error.message }
  }
  return { removido: true }
}

export function mensagemErroCriacaoLogin(authError) {
  const msg = String(authError?.message || '').toLowerCase()
  const code = String(authError?.code || '').toLowerCase()
  if (
    code === 'email_exists' ||
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('email address has already') ||
    msg.includes('user already exists')
  ) {
    return 'Este e-mail já possui um login. Exclua o usuário antigo em Usuários ou use outro e-mail.'
  }
  return 'Não foi possível criar o login. Verifique o e-mail e tente novamente.'
}

/** Alinha o e-mail do Supabase Auth com o cadastro, já em minúsculas. */
export async function atualizarEmailNoAuth(supabaseAdmin, emailAnterior, emailNovo) {
  const novo = normalizarEmail(emailNovo)
  const anterior = normalizarEmail(emailAnterior)
  if (!novo || novo === anterior) return

  const authUser = await localizarUsuarioAuth(supabaseAdmin, anterior)
  if (!authUser || normalizarEmail(authUser.email) === novo) return
  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    email: novo,
    email_confirm: true
  })
  if (error) {
    console.warn('[atualizarEmailNoAuth]', error.message)
  }
}
