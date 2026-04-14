/**
 * Data civil em America/Sao_Paulo (YYYY-MM-DD).
 * Evita `toISOString().split('T')[0]` no servidor em UTC, que desloca o dia para quem está no Brasil.
 */
export function dataYYYYMMDDAmericaSaoPaulo(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Ano, mês (1–12) e dia no calendário de America/Sao_Paulo.
 */
export function partesCalendarioAmericaSaoPaulo(date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = dtf.formatToParts(date);
  const p = {};
  for (const x of parts) {
    if (x.type !== 'literal') p[x.type] = x.value;
  }
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
  };
}

/**
 * Dia da semana (0 = domingo) para YYYY-MM-DD (calendário gregoriano, meio-dia UTC — independente do TZ do host).
 */
export function diaSemanaDeYYYYMMDD(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? '').trim());
  if (!m) {
    const d = new Date(ymd);
    return Number.isNaN(d.getTime()) ? 0 : d.getUTCDay();
  }
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return new Date(t).getUTCDay();
}

/** YYYY-MM-DD a partir de componentes locais do objeto Date (uso legado / intervalos derivados no host). */
export function formatYYYYMMDDComponentesLocais(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function ultimoDiaDoMesAno(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

export function primeiroDiaMesParaYYYYMMDD(year, month1to12) {
  return `${year}-${String(month1to12).padStart(2, '0')}-01`;
}

export function ultimoDiaMesParaYYYYMMDD(year, month1to12) {
  const ud = ultimoDiaDoMesAno(year, month1to12);
  return `${year}-${String(month1to12).padStart(2, '0')}-${String(ud).padStart(2, '0')}`;
}

/** Desloca m meses a partir de (ano, mês 1–12); m pode ser negativo. */
export function deslocarMes(ano, mes1a12, deltaMeses) {
  const idx = ano * 12 + (mes1a12 - 1) + deltaMeses;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** Primeiro e último dia do trimestre civil (jan-mar, abr-jun, …) que contém month1to12. */
export function intervaloTrimestreAno(year, month1to12) {
  const q = Math.floor((month1to12 - 1) / 3);
  const mesInicio = q * 3 + 1;
  const mesFim = mesInicio + 2;
  return {
    dataInicio: primeiroDiaMesParaYYYYMMDD(year, mesInicio),
    dataFim: ultimoDiaMesParaYYYYMMDD(year, mesFim),
  };
}

/** Soma dias a uma data civil YYYY-MM-DD (meio-dia UTC). */
export function ymdAddDays(ymd, deltaDays) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) return ymd;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0) + deltaDays * 86400000;
  const u = new Date(t);
  return `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, '0')}-${String(u.getUTCDate()).padStart(2, '0')}`;
}

/** Domingo a sábado da semana civil que contém `ymd` (domingo = início). */
export function intervaloSemanaDomingoSabadoAPartirDe(ymd) {
  const dow = diaSemanaDeYYYYMMDD(ymd);
  const inicio = ymdAddDays(ymd, -dow);
  const fim = ymdAddDays(inicio, 6);
  return { dataInicio: inicio, dataFim: fim };
}
