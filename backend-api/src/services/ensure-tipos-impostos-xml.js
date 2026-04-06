import { XMLParser } from 'fast-xml-parser';

/** Descrições padrão quando o tipo é criado pela primeira vez */
const DESCRICOES_PADRAO = {
  ISSQN: 'Imposto Sobre Serviços de Qualquer Natureza',
  ICMS: 'Imposto sobre Circulação de Mercadorias e Serviços',
  ICMS_ST: 'ICMS Substituição Tributária',
  IPI: 'Imposto sobre Produtos Industrializados',
  PIS: 'Programa de Integração Social',
  COFINS: 'Contribuição para o Financiamento da Seguridade Social',
  INSS: 'Instituto Nacional do Seguro Social',
  IR: 'Imposto de Renda na fonte',
  IRPJ: 'Imposto de Renda Pessoa Jurídica',
  CSLL: 'Contribuição Social sobre o Lucro Líquido',
  CBS: 'Contribuição sobre Bens e Serviços',
  IBS: 'Imposto sobre Bens e Serviços',
  FCP: 'Fundo de Combate à Pobreza',
  FCP_ST: 'FCP — Substituição Tributária',
  OUTRAS_RETENCOES: 'Outras retenções indicadas no XML'
};

function normalizarNome(nome) {
  if (nome == null || nome === '') return null;
  const s = String(nome).trim().toUpperCase().replace(/\s+/g, '_');
  if (!s) return null;
  return s.length > 100 ? s.slice(0, 100) : s;
}

/**
 * Garante que cada nome exista em tipos_impostos (UNIQUE por nome).
 * Se já existir, não altera. Se não existir, insere com descrição padrão.
 */
export async function ensureTiposImpostos(supabaseAdmin, nomesBrutos) {
  const nomes = [...new Set((nomesBrutos || []).map(normalizarNome).filter(Boolean))];
  const criados = [];
  const existentes = [];

  for (const nome of nomes) {
    const { data: row, error: selErr } = await supabaseAdmin
      .from('tipos_impostos')
      .select('id, nome')
      .eq('nome', nome)
      .maybeSingle();

    if (selErr && selErr.code !== 'PGRST116') {
      console.error('[ensureTiposImpostos] select', nome, selErr);
      continue;
    }

    if (row) {
      existentes.push(nome);
      continue;
    }

    const descricao =
      DESCRICOES_PADRAO[nome] || `Tributo ${nome} (detectado em importação de XML)`;

    const { error: insErr } = await supabaseAdmin.from('tipos_impostos').insert({
      nome,
      descricao,
      ativo: true
    });

    if (insErr) {
      if (insErr.code === '23505' || String(insErr.message || '').includes('duplicate')) {
        existentes.push(nome);
        continue;
      }
      console.error('[ensureTiposImpostos] insert', nome, insErr);
      continue;
    }

    criados.push(nome);
  }

  return { criados, existentes, total: nomes.length };
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Totais ICMSTot da NF-e (autorizada). */
export function extrairNomesTributosNFeBuffer(xmlBuffer) {
  const nomes = [];
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      parseTrueNumberOnly: false,
      arrayMode: false
    });
    const jsonObj = parser.parse(xmlBuffer.toString('utf-8'));
    const nfeProc = jsonObj.nfeProc || jsonObj.NFe || jsonObj;
    const nfe = nfeProc.NFe || nfeProc;
    let infNFe = nfe?.infNFe || nfe;
    if (Array.isArray(infNFe)) infNFe = infNFe[0];
    if (!infNFe) return nomes;

    const total = infNFe.total || {};
    const icmsTot = total.ICMSTot || total.icmsTot || {};
    if (num(icmsTot.vICMS || icmsTot['vICMS'])) nomes.push('ICMS');
    if (num(icmsTot.vICMSDeson || icmsTot['vICMSDeson'])) nomes.push('ICMS');
    if (num(icmsTot.vST || icmsTot['vST'])) nomes.push('ICMS_ST');
    if (num(icmsTot.vIPI || icmsTot['vIPI'])) nomes.push('IPI');
    if (num(icmsTot.vPIS || icmsTot['vPIS'])) nomes.push('PIS');
    if (num(icmsTot.vCOFINS || icmsTot['vCOFINS'])) nomes.push('COFINS');
    if (num(icmsTot.vFCP || icmsTot['vFCP'])) nomes.push('FCP');
    if (num(icmsTot.vFCPST || icmsTot['vFCPST'])) nomes.push('FCP_ST');
  } catch (e) {
    console.error('[extrairNomesTributosNFeBuffer]', e.message);
  }
  return nomes;
}

/** Campos já parseados da NFS-e (ABRASF) no importar-xml. */
export function coletarNomesTributosNFSeDados(dadosNota) {
  const nomes = [];
  if (!dadosNota) return nomes;
  if (num(dadosNota.valor_issqn) || num(dadosNota.base_calculo_issqn)) nomes.push('ISSQN');
  if (num(dadosNota.valor_pis)) nomes.push('PIS');
  if (num(dadosNota.valor_cofins)) nomes.push('COFINS');
  if (num(dadosNota.valor_inss)) nomes.push('INSS');
  if (num(dadosNota.valor_ir)) nomes.push('IR');
  if (num(dadosNota.valor_csll)) nomes.push('CSLL');
  if (num(dadosNota.outras_retencoes)) nomes.push('OUTRAS_RETENCOES');
  return nomes;
}

/** Coleta nomes a partir de um item de nota fiscal (POST/PUT). */
export function coletarNomesTributoDoItem(item) {
  const nomes = [];
  if (!item) return nomes;
  if (num(item.valor_icms)) nomes.push('ICMS');
  if (num(item.valor_ipi)) nomes.push('IPI');
  if (num(item.valor_issqn)) nomes.push('ISSQN');
  if (num(item.valor_inss)) nomes.push('INSS');
  if (num(item.valor_cbs)) nomes.push('CBS');

  let din = item.impostos_dinamicos;
  if (typeof din === 'string') {
    try {
      din = JSON.parse(din);
    } catch {
      din = [];
    }
  }
  if (Array.isArray(din)) {
    for (const imp of din) {
      if (num(imp.valor_calculado) && imp.nome) {
        const raw = String(imp.nome).trim().toUpperCase().replace(/\s+/g, '_').slice(0, 100);
        if (raw) nomes.push(raw);
      }
    }
  }
  return nomes;
}

export async function ensureTiposImpostosFromImportacaoXml(supabaseAdmin, { tipoXML, dadosNota, xmlBuffer }) {
  let nomes = [];
  if (tipoXML === 'nfse') {
    nomes = coletarNomesTributosNFSeDados(dadosNota);
  } else if (tipoXML === 'nfe' && xmlBuffer) {
    nomes = extrairNomesTributosNFeBuffer(xmlBuffer);
  }
  if (nomes.length === 0) return { criados: [], existentes: [], total: 0 };
  return ensureTiposImpostos(supabaseAdmin, nomes);
}
