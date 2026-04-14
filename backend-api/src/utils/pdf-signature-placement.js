import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createRequire } from 'module';
import { REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO } from '../config/assinatura-posicao-por-tipo-documento.js';

export { REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO };

const require = createRequire(import.meta.url);
try {
  GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
} catch {
  // Worker opcional; getTextContent costuma funcionar sem path válido em alguns ambientes
}

/**
 * Regras para localizar a assinatura no PDF (âncoras de texto em português).
 * @typedef {Object} RegraPosicaoAssinatura
 * @property {(string|RegExp)[]} [anchors] — trechos a procurar nos itens de texto
 * @property {'first'|'last'} [match] — primeira ou última ocorrência no documento
 * @property {number} [offsetXPoints] — deslocamento horizontal a partir do início do texto da âncora
 * @property {number} [offsetYPoints] — deslocamento vertical (pontos PDF; positivo = sobe a assinatura na página)
 * @property {number} [gapAbaixoTextoPoints] — espaço entre a base do texto e o topo da imagem da assinatura
 * @property {number} [signatureHeight] — altura desejada da assinatura (pontos PDF)
 * @property {number} [pageIndex] — forçar página (0-based). Com `rodape_coluna_esquerda`, usa só essa página (ex.: ficha de registro na 2.ª folha).
 * @property {'ancoras'|'duas_colunas_funcionario_esquerda'|'rodape_mais_a_direita'|'rodape_coluna_esquerda'|'certificado_nr12_multi'|'certificado_multipagina_aluno'} [metodoAncora] — certificado_nr12_multi: p.1 ANDERSON (fallback ALUNO); demais canto. certificado_multipagina_aluno: p.1 ALUNO; demais canto (demais certificados NR).
 * @property {boolean} [todasOcorrenciasColunaFuncionario] — se true, assina em cada linha com coluna empresa + funcionário (ex.: dois blocos ANDERSON no mesmo PDF)
 * @property {boolean} [todasPaginasRodapeColunaEsquerda] — se true, aplica rodape_coluna_esquerda em **cada página** que tiver rodapé na coluna esquerda (ex.: ficha EPIs: termo + tabela em páginas distintas)
 */

export const REGRA_ASSINATURA_PADRAO = {
  anchors: [/assinatura/i],
  match: 'last',
  offsetXPoints: 0,
  gapAbaixoTextoPoints: 8,
  signatureHeight: 72
};

/** Perfis por padrão no nome do arquivo ou título (ordem importa: primeiro match vence). */
export const PERFIS_ASSINATURA_DOCUMENTO = [
  {
    id: 'holerite',
    match: (nome) => /holerite|contracheque|folha\s*de\s*pagamento/i.test(nome || ''),
    regra: {
      anchors: [/assinatura/i, /recebi/i],
      match: 'last',
      offsetXPoints: 0,
      offsetYPoints: 0,
      gapAbaixoTextoPoints: 6,
      signatureHeight: 64
    }
  },
  {
    id: 'advertencia',
    match: (nome) => /advert[eê]ncia|notifica[cç][aã]o/i.test(nome || ''),
    regra: {
      anchors: [/assinatura/i, /funcion[aá]rio/i],
      match: 'last',
      offsetXPoints: 0,
      offsetYPoints: 0,
      gapAbaixoTextoPoints: 10,
      signatureHeight: 72
    }
  },
  {
    id: 'solicitacao_vale_transporte',
    match: (nome) =>
      /vale\s*transporte|solicitacao.*vale|valetransporte|solicita[cç][aã]o\s+vale/i.test(nome || ''),
    regra: {
      metodoAncora: 'rodape_mais_a_direita',
      anchors: [/assinatura/i],
      match: 'last',
      offsetXPoints: 0,
      offsetYPoints: 64,
      gapAbaixoTextoPoints: 6,
      signatureHeight: 58
    }
  },
  {
    id: 'acordo_compensacao',
    match: (nome) =>
      /acordo\s*de\s*compensa|compensa[cç][aã]o\s*de\s*horas|acordocompensacao/i.test(nome || ''),
    regra: {
      metodoAncora: 'duas_colunas_funcionario_esquerda',
      todasOcorrenciasColunaFuncionario: true,
      anchors: [/assinam/i],
      match: 'last',
      offsetXPoints: 0,
      offsetYPoints: 56,
      gapAbaixoTextoPoints: 8,
      signatureHeight: 64
    }
  },
  {
    id: 'contrato_experiencia_prorrogacao',
    /** Evita casar "contrato" + "experiente" etc.; só experiência/prorrogação no sentido trabalhista. */
    match: (nome) => {
      const n = nome || '';
      return (
        /prorroga[cç][aã]o\s+(do\s+)?contrato\s+de\s+experi/i.test(n) ||
        /contrato\s+de\s+experi.ncia/i.test(n) ||
        /experi.ncia.*prorroga[cç][aã]o/i.test(n) ||
        /prorroga[cç][aã]o.*experi.ncia/i.test(n) ||
        /contratoexperi/i.test(n)
      );
    },
    regra: {
      metodoAncora: 'duas_colunas_funcionario_esquerda',
      todasOcorrenciasColunaFuncionario: true,
      anchors: [/assinam/i],
      match: 'last',
      offsetXPoints: 0,
      offsetYPoints: 56,
      gapAbaixoTextoPoints: 8,
      signatureHeight: 64
    }
  },
  {
    id: 'termo_responsabilidade',
    match: (nome) =>
      /termo\s*responsabil|termoresponsab|responsabilidade.*termo/i.test(nome || ''),
    regra: {
      metodoAncora: 'rodape_coluna_esquerda',
      anchors: [/assinatura/i],
      match: 'last',
      offsetXPoints: 0,
      offsetYPoints: 50,
      gapAbaixoTextoPoints: 6,
      signatureHeight: 58
    }
  },
  {
    id: 'ficha_entrega_epis',
    match: (nome) =>
      /ficha\s*de\s*entrega|entrega\s*dos?\s*epis|epis\s*irbana|fichaentregaepis/i.test(nome || ''),
    regra: {
      metodoAncora: 'rodape_coluna_esquerda',
      todasPaginasRodapeColunaEsquerda: true,
      anchors: [/assinatura/i],
      match: 'last',
      offsetXPoints: 0,
      offsetYPoints: 50,
      gapAbaixoTextoPoints: 6,
      signatureHeight: 58
    }
  },
  {
    id: 'ficha_registro_empregado',
    match: (nome) =>
      /ficha\s*(de\s*)?registro|registro\s*de\s*empregad|fichaderegistro|ficha_registro/i.test(nome || ''),
    regra: {
      metodoAncora: 'rodape_coluna_esquerda',
      pageIndex: 1,
      offsetXPoints: 0,
      offsetYPoints: 50,
      gapAbaixoTextoPoints: 6,
      signatureHeight: 58
    }
  },
  {
    id: 'certificado_nr12',
    match: (nome) => /nr\s*0*12\b|nr12\b|certificado.*nr\s*12/i.test(nome || ''),
    regra: {
      metodoAncora: 'certificado_nr12_multi',
      offsetXPoints: -52,
      offsetYPoints: 44,
      gapAbaixoTextoPoints: 5,
      signatureHeight: 52,
      marginRightCanto: 44,
      marginBottomCanto: 40
    }
  },
  {
    id: 'certificado_padrao',
    match: (nome) =>
      /certificado|nr\s*0?\d+|sinaleiro|reciclagem|especifica[cç][aã]o/i.test(nome || ''),
    regra: {
      metodoAncora: 'certificado_multipagina_aluno',
      anchors: [/^\s*ALUNO\s*:?\s*$/i],
      match: 'last',
      offsetXPoints: -32,
      offsetYPoints: 42,
      gapAbaixoTextoPoints: 6,
      signatureHeight: 52,
      marginRightCanto: 44,
      marginBottomCanto: 40
    }
  }
];

/**
 * @param {{
 *   arquivo_original?: string,
 *   titulo?: string,
 *   tipo_documento?: string
 * }} documento — `tipo_documento` = valor de `funcionario_documentos.tipo` (ex.: acordo_compensacao)
 * @param {Partial<RegraPosicaoAssinatura>} override
 * @returns {RegraPosicaoAssinatura}
 */
export function resolverRegraPorDocumento(documento, override = {}) {
  const tipo =
    documento?.tipo_documento ||
    documento?.tipo_funcionario_documento ||
    documento?.tipoDocumento;
  if (tipo && REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO[tipo]) {
    const { descricao: _, ...regraTipo } = REGRAS_ASSINATURA_POR_TIPO_DOCUMENTO[tipo];
    return { ...REGRA_ASSINATURA_PADRAO, ...regraTipo, ...override };
  }

  const nome = `${documento?.arquivo_original || ''} ${documento?.titulo || ''}`;
  for (const perfil of PERFIS_ASSINATURA_DOCUMENTO) {
    if (perfil.match(nome)) {
      return { ...REGRA_ASSINATURA_PADRAO, ...perfil.regra, ...override };
    }
  }
  return { ...REGRA_ASSINATURA_PADRAO, ...override };
}

function normalizar(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function itemCombina(itemStr, anchor) {
  if (!itemStr) return false;
  if (typeof anchor === 'string') return normalizar(itemStr).includes(normalizar(anchor));
  return anchor.test(itemStr);
}

/** Evita o mesmo trecho contar várias vezes (várias regex). */
function dedupeCandidatosAncora(candidatos) {
  const seen = new Set();
  const out = [];
  for (const c of candidatos) {
    const k = `${c.pag.pageIndex}|${Number(c.item.x).toFixed(2)}|${Number(c.item.y).toFixed(2)}|${c.item.str}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

/**
 * Escolhe âncora pela geometria (última página + mais baixo na página), não pela ordem do stream do pdf.js.
 * Em PDF, Y aumenta para cima; o rodapé tem Y menor.
 * @param {'first'|'last'} match
 */
function escolherCandidatoAncoraPorGeometria(candidatos, match) {
  const list = dedupeCandidatosAncora(candidatos);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];

  if (match === 'first') {
    const minPage = Math.min(...list.map((c) => c.pag.pageIndex));
    const subset = list.filter((c) => c.pag.pageIndex === minPage);
    subset.sort((a, b) => b.item.y - a.item.y);
    return subset[0];
  }

  const maxPage = Math.max(...list.map((c) => c.pag.pageIndex));
  const subset = list.filter((c) => c.pag.pageIndex === maxPage);
  subset.sort((a, b) => a.item.y - b.item.y);
  return subset[0];
}

/**
 * Extrai texto por página e itens com posição (coordenadas PDF, origem inferior esquerda).
 * @param {Buffer|Uint8Array} pdfBuffer
 */
export async function extrairItensTextoPdf(pdfBuffer) {
  // pdf.js exige Uint8Array “puro”; Buffer no Node falha na validação
  const data = Buffer.isBuffer(pdfBuffer) ? new Uint8Array(pdfBuffer) : new Uint8Array(pdfBuffer);
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const paginas = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = [];
    let full = '';
    for (const raw of tc.items) {
      if (!('str' in raw) || raw.str === undefined) continue;
      const tr = raw.transform;
      const fontH = Math.hypot(tr[0], tr[1]) || 12;
      items.push({
        str: raw.str,
        x: tr[4],
        y: tr[5],
        fontSize: fontH,
        width: raw.width ?? 0
      });
      full += raw.str + ' ';
    }
    paginas.push({
      pageIndex: p - 1,
      pageHeight: vp.height,
      pageWidth: vp.width,
      text: full,
      items
    });
  }

  return { numPages, paginas };
}

/**
 * Localiza o rótulo «ALUNO» na 1.ª página no quadrante inferior esquerdo.
 * Coordenadas PDF: origem no canto inferior esquerdo; Y menor = mais em baixo na folha.
 * Quadrante: metade esquerda (X) × metade inferior (Y < altura/2), depois menor Y (linha de assinatura).
 * Fallback: metade esquerda em qualquer Y; por fim qualquer «ALUNO» na página (menor Y).
 * @param {{ pageWidth: number, pageHeight: number, items: Array<{ str?: string, x: number, y: number, width?: number, fontSize?: number }> }} pagina
 * @returns {{ str?: string, x: number, y: number, width?: number, fontSize?: number } | null}
 */
function encontrarItemAlunoQuadranteInferiorEsquerdo(pagina) {
  const w = pagina.pageWidth;
  const h = pagina.pageHeight;
  const alunoItems = pagina.items.filter((it) =>
    /^\s*ALUNO\s*:?\s*$/i.test(String(it.str || '').trim())
  );
  if (alunoItems.length === 0) return null;

  const limiteX = w * 0.5;
  const limiteY = h * 0.5;
  const noQuadrante = alunoItems.filter((it) => it.x < limiteX && it.y < limiteY);
  const soEsquerda = alunoItems.filter((it) => it.x < limiteX);

  const pool = noQuadrante.length ? noQuadrante : soEsquerda.length ? soEsquerda : alunoItems;
  return pool.reduce((a, b) => (a.y <= b.y ? a : b));
}

/**
 * Calcula posição (canto inferior esquerdo da imagem) para desenhar a assinatura abaixo do texto da âncora.
 */
function calcularRetanguloAssinatura(anchorItem, pageInfo, regra) {
  const baselineY = anchorItem.y;
  const fontSize = anchorItem.fontSize || 12;
  const gap = regra.gapAbaixoTextoPoints ?? 8;
  const sigH = regra.signatureHeight ?? 72;
  const offX = regra.offsetXPoints ?? 0;
  const offY = regra.offsetYPoints ?? 0;

  const baseTextoInferior = baselineY - fontSize * 0.28;
  const imageBottomY = baseTextoInferior - gap - sigH + offY;
  const x = anchorItem.x + offX;

  const minY = 24;
  const y = Math.max(minY, imageBottomY);

  let metodo = 'ancora_texto';
  if (regra.metodoAncora === 'rodape_mais_a_direita') metodo = 'rodape_mais_a_direita';
  else if (regra.metodoAncora === 'rodape_coluna_esquerda') metodo = 'rodape_coluna_esquerda';

  return {
    pageIndex: pageInfo.pageIndex,
    x,
    y,
    height: sigH,
    anchor: anchorItem.str?.slice(0, 80),
    metodo
  };
}

/**
 * Última linha de texto na parte inferior da página: usa o fragmento mais à direita (ex.: nome do
 * empregado em formulário com data à esquerda e nome à direita). Evita ancorar no «Assinatura» da coluna esquerda.
 */
function encontrarItemRodapeMaisADireita(pagina) {
  const items = pagina.items.filter((it) => it.str && /\S/.test(String(it.str)));
  if (items.length === 0) return null;

  const w = pagina.pageWidth;
  const ys = items.map((i) => i.y);
  const yMin = Math.min(...ys);
  const tolerancia = 14;
  const mesmaLinhaInferior = items.filter((it) => Math.abs(it.y - yMin) <= tolerancia);
  if (mesmaLinhaInferior.length === 0) return null;

  const candidatos = mesmaLinhaInferior.filter((it) => {
    const s = String(it.str).trim();
    if (s.length < 2) return false;
    if (/^\d{1,3}$/.test(s) && it.x > w - 52 && mesmaLinhaInferior.length > 2) return false;
    return true;
  });

  const pool = candidatos.length ? candidatos : mesmaLinhaInferior;
  pool.sort((a, b) => b.x - a.x);
  return pool[0] || null;
}

/**
 * Rodapé com duas colunas (ex.: assinatura à esquerda, «Polegar direito» à direita): só itens com
 * X na metade esquerda da página; na linha mais baixa dessa coluna, usa o fragmento mais à direita
 * (fim do nome), não o texto da coluna direita.
 */
function encontrarItemRodapeColunaEsquerda(pagina) {
  const items = pagina.items.filter((it) => it.str && /\S/.test(String(it.str)));
  if (items.length === 0) return null;

  const w = pagina.pageWidth;
  const limiteDir = w * 0.49;
  const esquerda = items.filter((it) => it.x < limiteDir);
  if (esquerda.length === 0) return null;

  const ys = esquerda.map((i) => i.y);
  const yMin = Math.min(...ys);
  const tolerancia = 14;
  const faixa = esquerda.filter((it) => Math.abs(it.y - yMin) <= tolerancia);

  const candidatos = faixa.filter((it) => String(it.str).trim().length >= 2);
  const pool = candidatos.length ? candidatos : faixa;
  pool.sort((a, b) => b.x - a.x);
  return pool[0] || null;
}

/** Padrões típicos de razão social / empresa na coluna direita (evita confundir com nome do funcionário). */
function pareceColunaEmpresa(str) {
  if (!str || str.length < 4) return false;
  const s = str.toUpperCase();
  return (
    /\bLTDA\b|\bS\.?\s*A\.?\b|\bEIRELI\b|\bME\b|\bEPP\b|SERV[IÍ]C|MANUT|IND[ÚU]ST|COMÉRCIO|COMERCIO/i.test(
      str
    ) ||
    /\bIRBANA\b|\bCOPAS\b|\bGRUAS\b|CONSTRUTORA/i.test(s)
  );
}

function juntarTextoCluster(cluster) {
  return cluster
    .map((it) => it.str)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Divide uma linha em colunas pelo espaço horizontal entre trechos (PDF costuma fragmentar nomes).
 * @param {number} gapMinPts
 */
function clusterLinhaPorGapHorizontal(sortedComNonSpace, gapMinPts = 28) {
  if (sortedComNonSpace.length < 2) return null;
  const clusters = [];
  let chunk = [sortedComNonSpace[0]];
  for (let i = 1; i < sortedComNonSpace.length; i++) {
    const prev = chunk[chunk.length - 1];
    const prevEnd = prev.x + (prev.width ?? 0);
    const gap = sortedComNonSpace[i].x - prevEnd;
    if (gap > gapMinPts) {
      clusters.push(chunk);
      chunk = [sortedComNonSpace[i]];
    } else {
      chunk.push(sortedComNonSpace[i]);
    }
  }
  clusters.push(chunk);
  return clusters;
}

function escolherFuncionarioEmClusters(clusters) {
  if (!clusters || clusters.length < 2) return null;
  const m0 = juntarTextoCluster(clusters[0]);
  const m1 = juntarTextoCluster(clusters[1]);
  const e0 = pareceColunaEmpresa(m0);
  const e1 = pareceColunaEmpresa(m1);
  if (e0 && !e1) return clusters[1][0];
  if (e1 && !e0) return clusters[0][0];
  return null;
}

/** Fallback: só dois itens “largos” na linha (PDF sem fragmentação). */
function escolherFuncionarioDoisExtremos(sortedComNonSpace) {
  if (sortedComNonSpace.length < 2) return null;
  const left = sortedComNonSpace[0];
  const right = sortedComNonSpace[sortedComNonSpace.length - 1];
  if (Math.abs(right.x - left.x) < 80) return null;
  if (pareceColunaEmpresa(right.str) && !pareceColunaEmpresa(left.str)) return left;
  if (pareceColunaEmpresa(left.str) && !pareceColunaEmpresa(right.str)) return right;
  return null;
}

/**
 * Todas as linhas da página com duas colunas (empresa × funcionário) — um âncora por faixa horizontal.
 */
function encontrarTodosItensFuncionarioDuasColunas(pagina) {
  const items = pagina.items.filter((it) => it.str && String(it.str).trim().length > 0);
  const tolerancia = 3.5;
  const grupos = [];

  for (const it of items) {
    let g = grupos.find((gr) => Math.abs(gr.yRef - it.y) <= tolerancia);
    if (!g) {
      g = { yRef: it.y, items: [] };
      grupos.push(g);
    }
    g.items.push(it);
  }

  const candidatos = [];

  for (const g of grupos) {
    if (g.items.length < 2) continue;
    const sorted = [...g.items].sort((a, b) => a.x - b.x);
    const comTexto = sorted.filter((it) => /\S/.test(it.str || ''));
    if (comTexto.length < 2) continue;

    const clusters = clusterLinhaPorGapHorizontal(comTexto);
    let pick = clusters && clusters.length >= 2 ? escolherFuncionarioEmClusters(clusters) : null;
    if (!pick) pick = escolherFuncionarioDoisExtremos(comTexto);

    if (pick) candidatos.push({ item: pick, yRef: g.yRef });
  }

  return candidatos.map((c) => c.item);
}

/**
 * Duas colunas na mesma linha (empresa vs funcionário). Fragmentação do PDF varia:
 * nomes inteiros em um item cada, ou várias palavras; empresa costuma ter LTDA/IRBANA etc.
 * Quando há várias linhas candidatas na mesma página, usa só a mais baixa (menor Y).
 */
function encontrarItemFuncionarioDuasColunas(pagina) {
  const todos = encontrarTodosItensFuncionarioDuasColunas(pagina);
  if (todos.length === 0) return null;
  const comY = todos.map((item) => ({ item, y: item.y }));
  comY.sort((a, b) => a.y - b.y);
  return comY[0].item;
}

/**
 * Todas as posições (uma por linha com coluna do funcionário) em todo o PDF.
 * @param {Buffer|Uint8Array} pdfBuffer
 * @param {Partial<RegraPosicaoAssinatura>} regra
 * @returns {Promise<Array<{ pageIndex: number, x: number, y: number, height: number, anchor?: string, metodo: string }>>}
 */
export async function encontrarTodasPosicoesDuasColunasFuncionario(pdfBuffer, regra = {}) {
  const r = { ...REGRA_ASSINATURA_PADRAO, ...regra };
  const { paginas } = await extrairItensTextoPdf(pdfBuffer);
  const out = [];
  for (const pag of paginas) {
    const itens = encontrarTodosItensFuncionarioDuasColunas(pag);
    for (const item of itens) {
      out.push(calcularRetanguloAssinatura(item, pag, r));
    }
  }
  return out;
}

/**
 * Uma assinatura por página que tenha rodapé detectável na coluna esquerda (mesma geometria que
 * `rodape_coluna_esquerda`, mas sem parar na primeira página a partir do fim).
 * @param {Buffer|Uint8Array} pdfBuffer
 * @param {Partial<RegraPosicaoAssinatura>} regra
 * @returns {Promise<Array<{ pageIndex: number, x: number, y: number, height: number, anchor?: string, metodo: string }>>}
 */
export async function encontrarTodasPosicoesRodapeColunaEsquerda(pdfBuffer, regra = {}) {
  const r = { ...REGRA_ASSINATURA_PADRAO, ...regra };
  const { paginas } = await extrairItensTextoPdf(pdfBuffer);
  const out = [];
  for (const pag of paginas) {
    if (typeof r.pageIndex === 'number' && r.pageIndex >= 0 && pag.pageIndex !== r.pageIndex) {
      continue;
    }
    const item = encontrarItemRodapeColunaEsquerda(pag);
    if (item) {
      out.push(calcularRetanguloAssinatura(item, pag, r));
    }
  }
  return out;
}

/**
 * Certificado NR-12 multipágina: p.1 no «ALUNO» do quadrante inferior esquerdo (se existir); senão ANDERSON; senão «ALUNO» na página; páginas 2+ canto inferior direito.
 * @param {Buffer|Uint8Array} pdfBuffer
 * @param {Partial<RegraPosicaoAssinatura>} regra
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function encontrarPosicoesCertificadoNr12MultiPagina(pdfBuffer, regra = {}) {
  const r = { ...REGRA_ASSINATURA_PADRAO, ...regra };
  const { paginas } = await extrairItensTextoPdf(pdfBuffer);
  const out = [];
  const sigH = r.signatureHeight ?? 56;

  const p0 = paginas[0];
  if (p0) {
    let pick = encontrarItemAlunoQuadranteInferiorEsquerdo(p0);
    if (!pick) {
      const andersonItems = p0.items.filter((it) => /ANDERSON/i.test(String(it.str || '').trim()));
      if (andersonItems.length) {
        pick = andersonItems.reduce((a, b) => (a.y <= b.y ? a : b));
      }
    }
    if (!pick) {
      const alunoItems = p0.items.filter((it) => /^\s*ALUNO\s*:?\s*$/i.test(String(it.str || '').trim()));
      if (alunoItems.length) {
        pick = alunoItems.reduce((a, b) => (a.y <= b.y ? a : b));
      }
    }
    if (pick) {
      const regraLinha = { ...r, metodoAncora: undefined };
      out.push(calcularRetanguloAssinatura(pick, p0, regraLinha));
    }
  }

  const mr = r.marginRightCanto ?? 44;
  const mb = r.marginBottomCanto ?? 40;
  for (let i = 1; i < paginas.length; i++) {
    const pag = paginas[i];
    out.push({
      pageIndex: pag.pageIndex,
      metodo: 'canto_inferior_direito_fixo',
      pageWidth: pag.pageWidth,
      marginRight: mr,
      marginBottom: mb,
      height: sigH,
      anchor: 'Canto inferior direito'
    });
  }

  return out;
}

/**
 * Certificados NR (exceto NR-12) multipágina: 1.ª página no rótulo «ALUNO» no quadrante inferior esquerdo;
 * páginas seguintes — canto inferior direito. Se não houver «ALUNO» na 1.ª página, usa uma única posição (última «ALUNO» no PDF), como antes.
 * @param {Buffer|Uint8Array} pdfBuffer
 * @param {Partial<RegraPosicaoAssinatura>} regra
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function encontrarPosicoesCertificadoMultipaginaAluno(pdfBuffer, regra = {}) {
  const r = { ...REGRA_ASSINATURA_PADRAO, ...regra };
  const { paginas } = await extrairItensTextoPdf(pdfBuffer);
  const out = [];
  const sigH = r.signatureHeight ?? 56;
  const mr = r.marginRightCanto ?? 44;
  const mb = r.marginBottomCanto ?? 40;

  const p0 = paginas[0];
  const pickP0 = p0 ? encontrarItemAlunoQuadranteInferiorEsquerdo(p0) : null;

  if (pickP0 && p0) {
    const regraLinha = { ...r, metodoAncora: undefined };
    out.push(calcularRetanguloAssinatura(pickP0, p0, regraLinha));
    for (let i = 1; i < paginas.length; i++) {
      const pag = paginas[i];
      out.push({
        pageIndex: pag.pageIndex,
        metodo: 'canto_inferior_direito_fixo',
        pageWidth: pag.pageWidth,
        marginRight: mr,
        marginBottom: mb,
        height: sigH,
        anchor: 'Canto inferior direito'
      });
    }
    return out;
  }

  const legacy = await encontrarPosicaoAssinaturaPorAncoras(pdfBuffer, {
    ...r,
    metodoAncora: undefined,
    anchors: r.anchors?.length ? r.anchors : [/^\s*ALUNO\s*:?\s*$/i],
    match: 'last'
  });
  if (legacy) {
    out.push(legacy);
  }
  return out;
}

/**
 * Encontra onde desenhar a assinatura com base em âncoras de texto.
 * @returns {Promise<{ pageIndex: number, x: number, y: number, height: number, anchor?: string, metodo: string } | null>}
 */
export async function encontrarPosicaoAssinaturaPorAncoras(pdfBuffer, regra = {}) {
  const r = { ...REGRA_ASSINATURA_PADRAO, ...regra };
  const anchors = r.anchors?.length ? r.anchors : REGRA_ASSINATURA_PADRAO.anchors;

  if (r.metodoAncora === 'rodape_coluna_esquerda') {
    const { paginas } = await extrairItensTextoPdf(pdfBuffer);
    if (typeof r.pageIndex === 'number' && r.pageIndex >= 0) {
      const pag = paginas[r.pageIndex];
      if (!pag) return null;
      const item = encontrarItemRodapeColunaEsquerda(pag);
      if (item) {
        return calcularRetanguloAssinatura(item, pag, r);
      }
      return null;
    }
    for (let i = paginas.length - 1; i >= 0; i--) {
      const pag = paginas[i];
      const item = encontrarItemRodapeColunaEsquerda(pag);
      if (item) {
        return calcularRetanguloAssinatura(item, pag, r);
      }
    }
  }

  if (r.metodoAncora === 'rodape_mais_a_direita') {
    const { paginas } = await extrairItensTextoPdf(pdfBuffer);
    for (let i = paginas.length - 1; i >= 0; i--) {
      const pag = paginas[i];
      const item = encontrarItemRodapeMaisADireita(pag);
      if (item) {
        return calcularRetanguloAssinatura(item, pag, r);
      }
    }
    /* fallback: âncora «Assinatura» + geometria */
  }

  if (r.metodoAncora === 'duas_colunas_funcionario_esquerda') {
    const { paginas } = await extrairItensTextoPdf(pdfBuffer);
    for (let i = paginas.length - 1; i >= 0; i--) {
      const pag = paginas[i];
      const item = encontrarItemFuncionarioDuasColunas(pag);
      if (item) {
        return calcularRetanguloAssinatura(item, pag, r);
      }
    }
    /* fallback: âncoras clássicas */
  }

  if (typeof r.pageIndex === 'number' && r.pageIndex >= 0) {
    const { paginas } = await extrairItensTextoPdf(pdfBuffer);
    const info = paginas[r.pageIndex];
    if (!info) return null;
    const anchorItem = info.items.find((it) => anchors.some((a) => itemCombina(it.str, a)));
    if (!anchorItem) return null;
    return calcularRetanguloAssinatura(anchorItem, info, r);
  }

  const { paginas } = await extrairItensTextoPdf(pdfBuffer);
  const candidatos = [];

  for (const pag of paginas) {
    for (const item of pag.items) {
      for (const anc of anchors) {
        if (itemCombina(item.str, anc)) {
          candidatos.push({ item, pag });
        }
      }
    }
  }

  if (candidatos.length === 0) return null;

  const escolhido = escolherCandidatoAncoraPorGeometria(candidatos, r.match || 'last');
  if (!escolhido) return null;
  return calcularRetanguloAssinatura(escolhido.item, escolhido.pag, r);
}

/**
 * Lista páginas cujo texto concatena corresponde ao filtro (útil para inspeção / agente).
 * @param {Buffer|Uint8Array} pdfBuffer
 * @param {RegExp | string} filtro
 */
export async function listarPaginasComConteudo(pdfBuffer, filtro) {
  const { paginas } = await extrairItensTextoPdf(pdfBuffer);
  const rx = typeof filtro === 'string' ? new RegExp(filtro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : filtro;
  return paginas
    .filter((p) => rx.test(p.text))
    .map((p) => ({
      pageIndex: p.pageIndex,
      trecho: p.text.slice(0, 500)
    }));
}
