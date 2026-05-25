/**
 * Resolve vínculo entre usuário (login) e registro em clientes.
 * Ordem: contato_usuario_id → contato_email → email da empresa.
 */

export async function buscarClientePorUsuario(supabaseAdmin, { usuarioId, email }) {
  if (!usuarioId) return null

  const { data: porVinculoDireto } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .eq('contato_usuario_id', usuarioId)
    .maybeSingle()

  if (porVinculoDireto) return porVinculoDireto

  const emailNorm = String(email || '').toLowerCase().trim()
  if (!emailNorm) return null

  const { data: porContatoEmail } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .ilike('contato_email', emailNorm)
    .maybeSingle()

  if (porContatoEmail) return porContatoEmail

  const { data: porEmailEmpresa } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .ilike('email', emailNorm)
    .maybeSingle()

  return porEmailEmpresa || null
}

export async function vincularClienteAoUsuario(supabaseAdmin, clienteId, usuarioId) {
  if (!clienteId || !usuarioId) return

  await supabaseAdmin
    .from('clientes')
    .update({
      contato_usuario_id: usuarioId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clienteId)
    .is('contato_usuario_id', null)
}

export async function buscarClientePorUsuarioComAutoVinculo(
  supabaseAdmin,
  { usuarioId, email },
  { autoVincular = false } = {}
) {
  const cliente = await buscarClientePorUsuario(supabaseAdmin, { usuarioId, email })
  if (!cliente) return null

  if (autoVincular && !cliente.contato_usuario_id && usuarioId) {
    await vincularClienteAoUsuario(supabaseAdmin, cliente.id, usuarioId)
    return { ...cliente, contato_usuario_id: usuarioId }
  }

  return cliente
}
