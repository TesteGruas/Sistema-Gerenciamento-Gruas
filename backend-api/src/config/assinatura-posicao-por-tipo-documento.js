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
  termo_reconhecimento_ciencia: {
    descricao:
      'Termo de Reconhecimento e Ciência: linha «Assinatura» alinhada um pouco à esquerda do centro.',
    metodoAncora: 'assinatura_centralizada',
    anchors: [/assinatura do funcion[aá]rio/i, /assinatura\s*:/i, /assinatura/i],
    match: 'last',
    /** Negativo = esquerda (centro da página + offset). */
    offsetXPoints: -52,
    offsetYPoints: 42,
    gapAbaixoTextoPoints: 8,
    signatureHeight: 56,
    centralizarHorizontal: true
  },
  recibo_vale_refeicao: {
    descricao:
      'Recibo / Ajuda de Custo – Vale Refeição: assinatura centralizada acima do rótulo do funcionário.',
    metodoAncora: 'assinatura_centralizada',
    anchors: [/assinatura do funcion[aá]rio/i, /assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    /** Sobe a imagem para ficar sobre a linha, sem cobrir «Assinatura do Funcionário». */
    offsetYPoints: 58,
    gapAbaixoTextoPoints: 8,
    signatureHeight: 52,
    centralizarHorizontal: true
  },
  recibo_vale_transporte: {
    descricao:
      'Recibo / Ajuda de Custo – Vale Transporte: assinatura centralizada acima do rótulo do funcionário.',
    metodoAncora: 'assinatura_centralizada',
    anchors: [/assinatura do funcion[aá]rio/i, /assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    offsetYPoints: 58,
    gapAbaixoTextoPoints: 8,
    signatureHeight: 52,
    centralizarHorizontal: true
  },
  recibo_horas_extras: {
    descricao:
      'Recibo / Pagamento de Horas Extras: assinatura centralizada acima de «Assinatura do Funcionário».',
    metodoAncora: 'assinatura_centralizada',
    anchors: [/assinatura do funcion[aá]rio/i, /assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    offsetYPoints: 58,
    gapAbaixoTextoPoints: 8,
    signatureHeight: 52,
    centralizarHorizontal: true
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
      'Certificados NR / sinaleiro: 1.ª página — linha «Assinatura do trabalhador» (LD Group; NR18 novo no centro); senão «ALUNO» / Vetor; senão canto inferior esquerdo.',
    metodoAncora: 'certificado_multipagina_aluno',
    anchors: [/^\s*ALUNO\s*:?\s*$/i, /Assinatura do trabalhador/i],
    match: 'last',
    offsetXPoints: -32,
    offsetYPoints: 42,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 44,
    linhaGapAcimaPoints: 2,
    marginLeftCanto: 80,
    marginBottomCanto: 40
  },
  /** NR-18 (LD Group): fecho com linha «Assinatura do trabalhador» — layout novo costuma ser centralizado. */
  certificado_nr18: {
    descricao:
      'Certificado NR-18: 1.ª página — linha «Assinatura do trabalhador» centrada na faixa do rótulo (layout LD Group).',
    metodoAncora: 'certificado_multipagina_aluno',
    anchors: [/Assinatura do trabalhador/i, /^\s*ALUNO\s*:?\s*$/i],
    match: 'last',
    signatureHeight: 42,
    linhaGapAcimaPoints: 2,
    marginLeftCanto: 80,
    marginBottomCanto: 40
  },
  certificado_nr12: {
    descricao:
      'Certificado NR-12: 1.ª página — linha «Assinatura do trabalhador» (LD Group); senão «ALUNO» / «ANDERSON» / Vetor; senão canto inferior esquerdo.',
    metodoAncora: 'certificado_nr12_multi',
    /** Linha de assinatura fica acima do texto do nome — sobe a imagem e puxa para a esquerda. */
    offsetXPoints: -52,
    offsetYPoints: 44,
    gapAbaixoTextoPoints: 5,
    signatureHeight: 44,
    linhaGapAcimaPoints: 2,
    marginLeftCanto: 80,
    marginBottomCanto: 40
  },
  /**
   * Ordem de Serviço / OS NR-1 (LD Group): com texto usa linha «Assinatura do Colaborador»;
   * scan sem texto — caixa fixa ~y=602. Não cobre Emitente nem o carimbo SST.
   */
  certificado_ordem_servico: {
    descricao:
      'Ordem de Serviço (NR-1): última página — linha «Assinatura do Colaborador» centrada; fallback caixa scan y≈602.',
    metodoAncora: 'caixa_fixa_a4_trabalhador_151',
    caixaSomenteUltimaPagina: true,
    linhaSomenteUltimaPagina: true,
    caixaAnchorLabel: 'Assinatura do Colaborador (OS NR-1)',
    /**
     * Fallback scan LD Group ≈ y=595–597.
     * Caixa logo acima da linha (não no branco abaixo do formulário).
     */
    caixaX: 70,
    caixaY: 602,
    caixaWidth: 200,
    caixaHeight: 52,
    caixaPageWidth: 595,
    caixaPageHeight: 842,
    caixaToleranciaPts: 8,
    /** Com texto pesquisável (layout LD Group). */
    anchors: [/Assinatura do Colaborador/i, /Assinatura do Trabalhador/i],
    linhaRotulos: [/Assinatura do Colaborador/i, /Assinatura do Trabalhador/i],
    match: 'last',
    offsetXPoints: 0,
    offsetYPoints: 0,
    gapAbaixoTextoPoints: 4,
    signatureHeight: 48
  },
  /**
   * ASO (Atestado de Saúde Ocupacional): com texto ancora na linha «Assinatura do funcionário»;
   * scan sem texto — caixa fixa na célula esquerda (sem cobrir o médico à direita).
   */
  aso: {
    descricao:
      'ASO: linha «Assinatura do funcionário» centrada na célula esquerda; fallback caixa A4 calibrada (~y=278).',
    metodoAncora: 'caixa_fixa_a4_trabalhador_151',
    caixaPrimeirasPaginas: 1,
    /**
     * Célula esquerda do fecho (PDF LD Group com texto: linha ≈ y=272, x≈84, w≈147).
     */
    caixaX: 84,
    caixaY: 278,
    caixaWidth: 147,
    caixaHeight: 48,
    caixaPageWidth: 595,
    caixaPageHeight: 842,
    caixaToleranciaPts: 8,
    anchors: [/Assinatura do funcion[aá]rio/i],
    linhaRotulos: [/Assinatura do funcion[aá]rio/i],
    match: 'last',
    signatureHeight: 48
  },
  /** Documentos de demissão / rescisão: formulário eSocial A4 sem AcroForm — campo 151 (trabalhador). */
  demissao_termo_rescisao: {
    descricao:
      'Termo de rescisão: PDF oficial A4 (595×841), 3 páginas com o mesmo rodapé — carimbar no campo 151 (47,333 — 240×38 pt).',
    metodoAncora: 'caixa_fixa_a4_trabalhador_151',
    caixaPrimeirasPaginas: 3,
    caixaX: 47,
    caixaY: 333,
    caixaWidth: 240,
    caixaHeight: 38,
    caixaPageWidth: 595,
    caixaPageHeight: 841
  },
  demissao_termo_quitacao: {
    descricao: 'Termo de quitação: mesmo layout eSocial do termo de rescisão (campo 151 nas 3 primeiras páginas).',
    metodoAncora: 'caixa_fixa_a4_trabalhador_151',
    caixaPrimeirasPaginas: 3,
    caixaX: 47,
    caixaY: 333,
    caixaWidth: 240,
    caixaHeight: 38,
    caixaPageWidth: 595,
    caixaPageHeight: 841
  },
  demissao_aviso_previo: {
    descricao:
      'Aviso prévio do empregador (IRBANA, duas vias na mesma folha): assinatura do empregado abaixo do rótulo «Empregado e seu Representante Legal» / «Quando Menor» — uma cópia por ocorrência (tipicamente 2).',
    todasOcorrenciasAncora: true,
    anchors: [
      /Empregado\s+e\s+seu\s+Representante\s+Legal/i,
      /Representante\s+Legal\s*\(\s*Quando\s+Menor\s*\)/i
    ],
    match: 'last',
    offsetXPoints: 0,
    offsetYPoints: 30,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 56
  },
  /** CD IRBANA: PDF sem AcroForm — carimbar na caixa do campo 151 (trabalhador), A4; páginas 1–3. */
  demissao_comunicacao_desligamento: {
    descricao:
      'CD: sem campo de assinatura nativo; imagem centralizada na caixa fixa do campo 151 (47,333 — 240×38 pt, A4 595×841), primeiras 3 páginas.',
    metodoAncora: 'caixa_fixa_a4_trabalhador_151',
    caixaPrimeirasPaginas: 3,
    caixaX: 47,
    caixaY: 333,
    caixaWidth: 240,
    caixaHeight: 38,
    caixaPageWidth: 595,
    caixaPageHeight: 841
  },
  demissao_padrao: {
    descricao: 'Demissão genérica: rodapé coluna esquerda (âncora «Assinatura»).',
    metodoAncora: 'rodape_coluna_esquerda',
    anchors: [/assinatura/i],
    match: 'last',
    offsetXPoints: 0,
    offsetYPoints: 50,
    gapAbaixoTextoPoints: 6,
    signatureHeight: 58
  }
}
