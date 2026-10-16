import jwt from 'jsonwebtoken';

const TIPO = 'assinatura_ponto_responsavel';

function segredo() {
  return process.env.JWT_SECRET || 'your-secret-key';
}

/** Token opaco do responsável que deve assinar o ponto. Não leva e-mail na URL. */
export function gerarTokenAssinaturaResponsavel({
  registroId,
  obraId,
  responsavelObraId,
  usuarioId,
}) {
  return jwt.sign(
    {
      tipo: TIPO,
      registro_id: String(registroId),
      obra_id: Number(obraId),
      responsavel_obra_id: responsavelObraId != null ? Number(responsavelObraId) : null,
      usuario_id: usuarioId != null ? Number(usuarioId) : null,
    },
    segredo(),
    { expiresIn: '7d' }
  );
}

export function lerTokenAssinaturaResponsavel(token) {
  if (!token || typeof token !== 'string') {
    const erro = new Error('Link de assinatura inválido.');
    erro.status = 400;
    throw erro;
  }
  try {
    const payload = jwt.verify(token.trim(), segredo());
    if (payload?.tipo !== TIPO || !payload.registro_id || !payload.obra_id) {
      const erro = new Error('Link de assinatura inválido.');
      erro.status = 400;
      throw erro;
    }
    if (!payload.responsavel_obra_id && !payload.usuario_id) {
      const erro = new Error('Link de assinatura inválido.');
      erro.status = 400;
      throw erro;
    }
    return payload;
  } catch (error) {
    if (error.status) throw error;
    const expirado = error?.name === 'TokenExpiredError';
    const erro = new Error(
      expirado
        ? 'Este link de assinatura expirou. Peça um novo aviso de ponto concluído.'
        : 'Link de assinatura inválido.'
    );
    erro.status = expirado ? 410 : 400;
    throw erro;
  }
}
