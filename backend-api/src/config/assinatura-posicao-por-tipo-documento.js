/**
 * Fonte da verdade (persistida no repositório) para posição da assinatura por tipo de documento RH.
 * Chaves = `funcionario_documentos.tipo` (snake_case). `resolverRegraPorDocumento` usa isto quando
 * `tipo_documento` / equivalente é enviado (ex.: prévia `/api/rh/preview-assinatura-pdf`, cadastro com tipo).
 *
 * Sem `tipo_documento`, ainda há fallback por nome de arquivo em `PERFIS_ASSINATURA_DOCUMENTO`
 * (mesmos ajustes devem ser espelhados lá para quem assina só pelo nome do PDF).
 *
 * Ao adicionar tipo novo: incluir aqui e garantir `tipo_documento` na prévia ou no fluxo de assinatura.
 */

export const REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO = {
  acordo_compensacao: {
    descricao:
      'Acordo de compensação: detecta linha com duas colunas (funcionário à esquerda, empresa com LTDA etc. à direita) e posiciona na coluna do funcionário.',
    metodoAncora: 'duas_colunas_funcionario_esquerda',
    todasOcorrenciasColunaFuncionario: true,
    anchors: [/assinam/i],
    match: 'last',
    offsetXPoints: 0,
    /** Layout típico: faixa entre a data e o nome (acima de ANDERSON); valor maior que contrato experiência. */
    offsetYPoints: 56,
    gapAbaixoTextoPoints: 8,
    signatureHeight: 64
  },
  contrato_experiencia_prorrogacao: {
    descricao:
      'Contrato de experiência / prorrogação: mesma lógica de duas colunas; neste layout a empresa (IRBANA/LTDA) costuma ficar à esquerda e o nome do empregado à direita.',
    metodoAncora: 'duas_colunas_funcionario_esquerda',
    todasOcorrenciasColunaFuncionario: true,
    anchors: [/assinam/i],
    match: 'last',
    offsetXPoints: 0,
    /** Faixa entre a data e o nome do empregado (coluna ANDERSON); alinhado ao layout do PDF de prorrogação. */
    offsetYPoints: 56,
    gapAbaixoTextoPoints: 8,
    signatureHeight: 64
  },
  termo_responsabilidade: {
    descricao:
      'Termo com duas colunas no rodapé: assinatura à esquerda (nome); ignora «Polegar direito» à direita.',
    metodoAncora: 'rodape_coluna_esquerda',
    anchors: [/assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    /** Mais baixo que o vale se o PDF tiver mais espaço entre data e linha; aproxima da linha de assinatura. */
    offsetYPoints: 50,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 58
  },
  ficha_entrega_epis: {
    descricao:
      'Ficha de entrega de EPIs IRBANA: em geral 2 páginas (termo + tabela); assina no rodapé da coluna esquerda em cada página que tiver esse bloco.',
    metodoAncora: 'rodape_coluna_esquerda',
    /** Duas folhas com «Assinatura» / nome — não só a última página. */
    todasPaginasRodapeColunaEsquerda: true,
    anchors: [/assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    offsetYPoints: 50,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 58
  },
  solicitacao_vale_transporte: {
    descricao:
      'Vale transporte: linha inferior do PDF, trecho de texto mais à direita (nome), não o «Assinatura» da esquerda.',
    metodoAncora: 'rodape_mais_a_direita',
    anchors: [/assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    /** Sobe a assinatura da linha do nome para a faixa da linha de assinatura. */
    offsetYPoints: 64,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 58
  },
  ficha_registro_empregado: {
    descricao:
      'Ficha de registro de empregado (eSocial/IRBANA): fecho com duas colunas na última página — assinatura na coluna da «Data de Admissão» (esquerda), página 2 em PDFs de duas folhas.',
    metodoAncora: 'rodape_coluna_esquerda',
    /** 0-based: segunda página. */
    pageIndex: 1,
    anchors: [/assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    offsetYPoints: 50,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 58
  },
  certificado_padrao: {
    descricao:
      'Certificados NR / sinaleiro (layout padrão): 1.ª página no rótulo «ALUNO» no quadrante inferior esquerdo da folha; páginas seguintes — canto inferior direito. Se não houver «ALUNO» na 1.ª página, uma assinatura na última ocorrência no PDF.',
    metodoAncora: 'certificado_multipagina_aluno',
    anchors: [/^\s*ALUNO\s*:?\s*$/i],
    match: 'last',
    offsetXPoints: -32,
    offsetYPoints: 42,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 52,
    marginRightCanto: 44,
    marginBottomCanto: 40
  },
  certificado_nr12: {
    descricao:
      'Certificado NR-12 (modelo IRBANA): 1.ª página junto ao nome do instrutor (âncora «ANDERSON»/instrutor); páginas seguintes — canto inferior direito.',
    metodoAncora: 'certificado_nr12_multi',
    /** Linha de assinatura fica acima do texto do nome — sobe a imagem e puxa para a esquerda. */
    offsetXPoints: -52,
    offsetYPoints: 44,
    gapAbaixoTextoPoints: 5,
    signatureHeight: 52,
    marginRightCanto: 44,
    marginBottomCanto: 40
  }
}
