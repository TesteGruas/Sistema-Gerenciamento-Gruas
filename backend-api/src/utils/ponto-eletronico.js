/**
 * Utilitários para o módulo de ponto eletrônico
 */

/**
 * Calcula as horas trabalhadas baseado nos horários de entrada, saída e intervalos
 * @param {string} entrada - Horário de entrada (HH:MM)
 * @param {string} saida - Horário de saída (HH:MM)
 * @param {string} saidaAlmoco - Horário de saída para almoço (HH:MM) - opcional
 * @param {string} voltaAlmoco - Horário de volta do almoço (HH:MM) - opcional
 * @returns {number} Total de horas trabalhadas
 */
function calcularHorasTrabalhadas(entrada, saida, saidaAlmoco, voltaAlmoco) {
  // Apenas entrada e saída são obrigatórios
  if (!entrada || !saida) {
    return 0;
  }

  try {
    // Converter horários para minutos desde meia-noite
    const entradaMinutos = timeToMinutes(entrada);
    const saidaMinutos = timeToMinutes(saida);

    // Calcular total de minutos entre entrada e saída
    let totalMinutos = saidaMinutos - entradaMinutos;

    // Se houver horários de almoço, descontar o intervalo
    if (saidaAlmoco && voltaAlmoco) {
      const saidaAlmocoMinutos = timeToMinutes(saidaAlmoco);
      const voltaAlmocoMinutos = timeToMinutes(voltaAlmoco);
      const intervaloAlmoco = voltaAlmocoMinutos - saidaAlmocoMinutos;
      totalMinutos -= intervaloAlmoco;
    }
    
    // Converter para horas com 2 casas decimais
    const horas = totalMinutos / 60;
    return Math.max(0, Math.round(horas * 100) / 100);
  } catch (error) {
    console.error('Erro ao calcular horas trabalhadas:', error);
    return 0;
  }
}

/**
 * Calcula as horas extras baseado nas horas trabalhadas e tipo de dia
 * @param {string} entrada - Horário de entrada (HH:MM)
 * @param {string} saida - Horário de saída (HH:MM)
 * @param {string} tipoDia - Tipo do dia: 'normal', 'sabado', 'domingo', 'feriado_nacional', 'feriado_estadual', 'feriado_local'
 * @param {number} horasTrabalhadas - Total de horas trabalhadas (opcional, será calculado se não fornecido)
 * @param {string} saidaAlmoco - Horário de saída para almoço (opcional)
 * @param {string} voltaAlmoco - Horário de volta do almoço (opcional)
 * @returns {number} Horas extras
 */
function calcularHorasExtras(entrada, saida, tipoDia = 'normal', horasTrabalhadas = null, saidaAlmoco = null, voltaAlmoco = null) {
  if (!entrada || !saida) {
    return 0;
  }

  // Se horas trabalhadas não foi fornecido, calcular
  if (horasTrabalhadas === null) {
    horasTrabalhadas = calcularHorasTrabalhadas(entrada, saida, saidaAlmoco, voltaAlmoco);
  }

  // Determinar jornada padrão baseado no tipo de dia e horário de entrada
  let jornadaPadrao = 8; // Padrão antigo (mantido para compatibilidade)
  let horarioFimPadrao = '17:00'; // Horário padrão de fim

  // Se for dia normal (segunda a quinta), jornada é 07:00 às 17:00 (10 horas)
  // Se for sexta-feira, jornada é 07:00 às 16:00 (9 horas)
  if (tipoDia === 'normal') {
    const entradaMinutos = timeToMinutes(entrada);
    const entradaEsperada = timeToMinutes('07:00');
    
    // Se entrou próximo de 07:00, considerar jornada completa
    if (Math.abs(entradaMinutos - entradaEsperada) <= 30) {
      // Verificar dia da semana pela data (se disponível) ou assumir padrão
      // Por padrão, assumimos segunda-quinta (10h) ou sexta (9h)
      // Como não temos a data aqui, vamos usar uma lógica baseada no horário de saída
      const saidaMinutos = timeToMinutes(saida);
      const saidaPadraoSegQui = timeToMinutes('17:00');
      const saidaPadraoSex = timeToMinutes('16:00');
      
      // Se saiu próximo de 16:00, é sexta-feira (9h)
      if (Math.abs(saidaMinutos - saidaPadraoSex) <= 30) {
        jornadaPadrao = 9;
        horarioFimPadrao = '16:00';
      } else {
        // Caso contrário, assume segunda-quinta (10h)
        jornadaPadrao = 10;
        horarioFimPadrao = '17:00';
      }
    }
  } else if (tipoDia === 'sabado' || tipoDia === 'domingo' || tipoDia === 'feriado_nacional' || tipoDia === 'feriado_estadual' || tipoDia === 'feriado_local') {
    // Finais de semana e feriados: qualquer hora trabalhada é extra
    jornadaPadrao = 0;
  }

  // Calcular horas extras baseado na jornada padrão
  const horasExtras = Math.max(0, horasTrabalhadas - jornadaPadrao);
  
  // Se for dia normal e passou do horário padrão de fim, calcular horas extras adicionais
  if (tipoDia === 'normal' && horarioFimPadrao) {
    const saidaMinutos = timeToMinutes(saida);
    const fimPadraoMinutos = timeToMinutes(horarioFimPadrao);
    
    if (saidaMinutos > fimPadraoMinutos) {
      // Horas extras = tempo trabalhado além do horário padrão
      const minutosExtras = saidaMinutos - fimPadraoMinutos;
      const horasExtrasAlemFim = minutosExtras / 60;
      return Math.max(horasExtras, horasExtrasAlemFim);
    }
  }

  return horasExtras;
}

/**
 * Determina o status do registro baseado nos horários e horas extras
 * @param {string} entrada - Horário de entrada
 * @param {string} saida - Horário de saída
 * @param {number} horasExtras - Horas extras
 * @param {number} horasTrabalhadas - Total de horas trabalhadas
 * @param {string} horarioEntradaEsperado - Horário esperado de entrada (opcional)
 * @returns {string} Status do registro
 */
function determinarStatus(entrada, saida, horasExtras, horasTrabalhadas, horarioEntradaEsperado = '08:00') {
  if (!entrada) {
    return 'Falta';
  }

  if (!saida) {
    return 'Em Andamento';
  }

  try {
    // Calcular atraso em minutos (tolerância de 15 minutos)
    const entradaMinutos = timeToMinutes(entrada);
    const entradaEsperadaMinutos = timeToMinutes(horarioEntradaEsperado);
    const atrasoMinutos = entradaMinutos - entradaEsperadaMinutos;

    // Se tem atraso maior que 15 minutos
    if (atrasoMinutos > 15) {
      // Se tem horas extras, ainda precisa de aprovação
      if (horasExtras > 0) {
        return 'Pendente Aprovação';
      }
      return 'Atraso';
    }

    // Se tem horas extras, precisa de aprovação
    if (horasExtras > 0) {
      return 'Pendente Aprovação';
    }

    // Verificar se cumpriu a carga horária mínima (7.5 horas considerando tolerância)
    if (horasTrabalhadas < 7.5) {
      return 'Incompleto';
    }

    return 'Completo';
  } catch (error) {
    console.error('Erro ao determinar status:', error);
    return 'Completo';
  }
}

/**
 * Converte horário (HH:MM) para minutos desde meia-noite
 * @param {string} time - Horário no formato HH:MM
 * @returns {number} Minutos desde meia-noite
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos para horário (HH:MM)
 * @param {number} minutes - Minutos desde meia-noite
 * @returns {string} Horário no formato HH:MM
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Gera um ID único para registros de ponto
 * @param {string} prefix - Prefixo do ID (padrão: 'REG')
 * @returns {string} ID único
 */
function gerarIdRegistro(prefix = 'REG') {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp.slice(-6)}${random}`;
}

/**
 * Gera um ID único para justificativas
 * @param {string} prefix - Prefixo do ID (padrão: 'JUST')
 * @returns {string} ID único
 */
function gerarIdJustificativa(prefix = 'JUST') {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp.slice(-6)}${random}`;
}

/**
 * Valida se um horário está no formato correto (HH:MM)
 * @param {string} time - Horário para validar
 * @returns {boolean} True se válido
 */
function validarHorario(time) {
  if (!time) return false;
  
  // Aceita HH:MM ou HH:MM:SS
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return regex.test(time);
}

/**
 * Normaliza um horário para o formato HH:MM (remove segundos se existir)
 * @param {string} time - Horário no formato HH:MM ou HH:MM:SS
 * @returns {string} Horário no formato HH:MM
 */
function normalizarHorario(time) {
  if (!time) return time;
  
  // Se o horário tem segundos (HH:MM:SS), remove-os
  if (time.length > 5 && time.includes(':')) {
    return time.substring(0, 5);
  }
  
  return time;
}

/**
 * Valida se uma data está no formato correto (YYYY-MM-DD)
 * @param {string} date - Data para validar
 * @returns {boolean} True se válido
 */
function validarData(date) {
  if (!date) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
}

/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY)
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada
 */
function formatarDataBR(date) {
  if (!date) return '';
  
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formata um horário para exibição (HH:MM)
 * @param {string} time - Horário no formato HH:MM
 * @returns {string} Horário formatado
 */
function formatarHorario(time) {
  if (!time) return '';
  return time;
}

/**
 * Calcula o total de horas trabalhadas em um período
 * @param {Array} registros - Array de registros de ponto
 * @param {string} dataInicio - Data de início (YYYY-MM-DD)
 * @param {string} dataFim - Data de fim (YYYY-MM-DD)
 * @returns {Object} Resumo das horas
 */
function calcularResumoPeriodo(registros, dataInicio, dataFim) {
  const resumo = {
    totalHoras: 0,
    totalHorasExtras: 0,
    diasTrabalhados: 0,
    atrasos: 0,
    faltas: 0,
    registros: []
  };

  registros.forEach(registro => {
    if (registro.data >= dataInicio && registro.data <= dataFim) {
      resumo.totalHoras += parseFloat(registro.horas_trabalhadas || 0);
      resumo.totalHorasExtras += parseFloat(registro.horas_extras || 0);
      resumo.diasTrabalhados++;
      
      if (registro.status === 'Atraso') {
        resumo.atrasos++;
      } else if (registro.status === 'Falta') {
        resumo.faltas++;
      }
      
      resumo.registros.push(registro);
    }
  });

  return resumo;
}

/**
 * Calcula resumo agregado de justificativas
 * @param {Array} justificativas - Array de justificativas
 * @param {string} dataInicio - Data de início (YYYY-MM-DD)
 * @param {string} dataFim - Data de fim (YYYY-MM-DD)
 * @returns {Object} Resumo das justificativas
 */
function calcularResumoJustificativas(justificativas, dataInicio, dataFim) {
  const resumo = {
    total_justificativas: justificativas.length,
    por_status: {},
    por_tipo: {},
    por_funcionario: []
  };

  // Mapear justificativas por funcionário
  const funcionariosMap = {};

  justificativas.forEach(justificativa => {
    // Agrupar por status
    if (!resumo.por_status[justificativa.status]) {
      resumo.por_status[justificativa.status] = 0;
    }
    resumo.por_status[justificativa.status]++;
    
    // Agrupar por tipo
    if (!resumo.por_tipo[justificativa.tipo]) {
      resumo.por_tipo[justificativa.tipo] = 0;
    }
    resumo.por_tipo[justificativa.tipo]++;
    
    // Agrupar por funcionário
    const funcionarioId = justificativa.funcionario_id;
    if (!funcionariosMap[funcionarioId]) {
      funcionariosMap[funcionarioId] = {
        funcionario_id: funcionarioId,
        nome: justificativa.funcionario?.nome || 'Desconhecido',
        total_justificativas: 0,
        por_status: {},
        por_tipo: {}
      };
    }
    
    funcionariosMap[funcionarioId].total_justificativas++;
    
    // Status por funcionário
    if (!funcionariosMap[funcionarioId].por_status[justificativa.status]) {
      funcionariosMap[funcionarioId].por_status[justificativa.status] = 0;
    }
    funcionariosMap[funcionarioId].por_status[justificativa.status]++;
    
    // Tipo por funcionário
    if (!funcionariosMap[funcionarioId].por_tipo[justificativa.tipo]) {
      funcionariosMap[funcionarioId].por_tipo[justificativa.tipo] = 0;
    }
    funcionariosMap[funcionarioId].por_tipo[justificativa.tipo]++;
  });

  // Converter map de funcionários para array
  resumo.por_funcionario = Object.values(funcionariosMap);

  return resumo;
}

/**
 * Calcula tendência mensal comparando com o mês anterior
 * @param {number} mes - Mês atual (1-12)
 * @param {number} ano - Ano atual
 * @param {number} totalAtual - Total de justificativas do mês atual
 * @param {Object} supabase - Instância do Supabase
 * @returns {Object} Tendência mensal
 */
async function calcularTendenciaMensal(mes, ano, totalAtual, supabase) {
  try {
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    const anoAnterior = mes === 1 ? ano - 1 : ano;
    
    const dataInicioAnterior = `${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}-01`;
    const ultimoDiaMesAnterior = new Date(anoAnterior, mesAnterior, 0).getDate();
    const dataFimAnterior = `${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}-${ultimoDiaMesAnterior}`;
    
    const { data: justificativasAnterior, error } = await supabase
      .from('justificativas')
      .select('id')
      .gte('data', dataInicioAnterior)
      .lte('data', dataFimAnterior);
    
    if (error) {
      console.error('Erro ao buscar justificativas do mês anterior:', error);
      return {
        crescimento: 0,
        comparacao_mes_anterior: 'Dados indisponíveis'
      };
    }
    
    const totalAnterior = justificativasAnterior?.length || 0;
    const diferenca = totalAtual - totalAnterior;
    const crescimento = totalAnterior > 0 ? ((diferenca / totalAnterior) * 100).toFixed(1) : 0;
    
    const sinal = diferenca > 0 ? '+' : '';
    const comparacao = `${sinal}${diferenca} justificativas`;
    
    return {
      crescimento: parseFloat(crescimento),
      comparacao_mes_anterior: comparacao
    };
  } catch (error) {
    console.error('Erro ao calcular tendência mensal:', error);
    return {
      crescimento: 0,
      comparacao_mes_anterior: 'Erro ao calcular'
    };
  }
}

/**
 * Agrupa justificativas por critério específico
 * @param {Array} justificativas - Array de justificativas
 * @param {string} criterio - Critério de agrupamento (funcionario, tipo, status, dia, semana)
 * @returns {Object} Dados agrupados
 */
function agruparJustificativasPor(justificativas, criterio) {
  const agrupamento = {};

  if (criterio === 'funcionario') {
    justificativas.forEach(just => {
      const key = just.funcionario_id;
      if (!agrupamento[key]) {
        agrupamento[key] = {
          funcionario_id: just.funcionario_id,
          nome: just.funcionario?.nome || 'Desconhecido',
          total_justificativas: 0,
          por_status: {},
          por_tipo: {}
        };
      }
      agrupamento[key].total_justificativas++;
      
      // Status
      if (!agrupamento[key].por_status[just.status]) {
        agrupamento[key].por_status[just.status] = 0;
      }
      agrupamento[key].por_status[just.status]++;
      
      // Tipo
      if (!agrupamento[key].por_tipo[just.tipo]) {
        agrupamento[key].por_tipo[just.tipo] = 0;
      }
      agrupamento[key].por_tipo[just.tipo]++;
    });
    
    return { funcionario: Object.values(agrupamento) };
  }
  
  if (criterio === 'tipo') {
    justificativas.forEach(just => {
      const key = just.tipo;
      if (!agrupamento[key]) {
        agrupamento[key] = { tipo: key, total: 0, por_status: {} };
      }
      agrupamento[key].total++;
      if (!agrupamento[key].por_status[just.status]) {
        agrupamento[key].por_status[just.status] = 0;
      }
      agrupamento[key].por_status[just.status]++;
    });
    
    return { tipo: Object.values(agrupamento) };
  }
  
  if (criterio === 'status') {
    justificativas.forEach(just => {
      const key = just.status;
      if (!agrupamento[key]) {
        agrupamento[key] = { status: key, total: 0, por_tipo: {} };
      }
      agrupamento[key].total++;
      if (!agrupamento[key].por_tipo[just.tipo]) {
        agrupamento[key].por_tipo[just.tipo] = 0;
      }
      agrupamento[key].por_tipo[just.tipo]++;
    });
    
    return { status: Object.values(agrupamento) };
  }
  
  if (criterio === 'dia') {
    justificativas.forEach(just => {
      const key = just.data;
      if (!agrupamento[key]) {
        agrupamento[key] = { data: key, total: 0, por_tipo: {}, por_status: {} };
      }
      agrupamento[key].total++;
      
      if (!agrupamento[key].por_tipo[just.tipo]) {
        agrupamento[key].por_tipo[just.tipo] = 0;
      }
      agrupamento[key].por_tipo[just.tipo]++;
      
      if (!agrupamento[key].por_status[just.status]) {
        agrupamento[key].por_status[just.status] = 0;
      }
      agrupamento[key].por_status[just.status]++;
    });
    
    return { dia: Object.values(agrupamento).sort((a, b) => a.data.localeCompare(b.data)) };
  }
  
  if (criterio === 'semana') {
    justificativas.forEach(just => {
      const date = new Date(just.data + 'T00:00:00');
      const weekNumber = getWeekNumber(date);
      const key = `Semana ${weekNumber}`;
      
      if (!agrupamento[key]) {
        agrupamento[key] = { semana: key, total: 0, por_tipo: {}, por_status: {} };
      }
      agrupamento[key].total++;
      
      if (!agrupamento[key].por_tipo[just.tipo]) {
        agrupamento[key].por_tipo[just.tipo] = 0;
      }
      agrupamento[key].por_tipo[just.tipo]++;
      
      if (!agrupamento[key].por_status[just.status]) {
        agrupamento[key].por_status[just.status] = 0;
      }
      agrupamento[key].por_status[just.status]++;
    });
    
    return { semana: Object.values(agrupamento) };
  }
  
  return {};
}

/**
 * Calcula número da semana do ano
 * @param {Date} date - Data
 * @returns {number} Número da semana
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Calcula estatísticas avançadas de justificativas
 * @param {Array} justificativas - Array de justificativas
 * @param {Object} periodo - Objeto com data_inicio e data_fim
 * @returns {Object} Estatísticas avançadas
 */
function calcularEstatisticasAvancadas(justificativas, periodo) {
  const stats = {
    total_justificativas: justificativas.length,
    media_mensal: 0,
    tendencia: {
      crescimento_percentual: 0,
      comparacao_mes_anterior: 'N/A'
    },
    distribuicao: {
      por_status: {},
      por_tipo: {},
      por_dia_semana: {
        'Segunda': 0,
        'Terça': 0,
        'Quarta': 0,
        'Quinta': 0,
        'Sexta': 0,
        'Sábado': 0,
        'Domingo': 0
      }
    },
    funcionarios: {
      total_com_justificativas: 0,
      maior_frequencia: null,
      media_por_funcionario: 0
    },
    tempo_medio_aprovacao: {
      horas: 0,
      dias: 0
    }
  };

  if (justificativas.length === 0) {
    return stats;
  }

  // Calcular média mensal
  const dataInicio = new Date(periodo.data_inicio);
  const dataFim = new Date(periodo.data_fim);
  const mesesDiferenca = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12 + 
                         (dataFim.getMonth() - dataInicio.getMonth()) + 1;
  stats.media_mensal = (justificativas.length / mesesDiferenca).toFixed(1);

  // Distribuição por status e tipo
  justificativas.forEach(just => {
    // Por status
    if (!stats.distribuicao.por_status[just.status]) {
      stats.distribuicao.por_status[just.status] = 0;
    }
    stats.distribuicao.por_status[just.status]++;

    // Por tipo
    if (!stats.distribuicao.por_tipo[just.tipo]) {
      stats.distribuicao.por_tipo[just.tipo] = 0;
    }
    stats.distribuicao.por_tipo[just.tipo]++;

    // Por dia da semana
    const date = new Date(just.data + 'T00:00:00');
    const diaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];
    stats.distribuicao.por_dia_semana[diaSemana]++;
  });

  // Análise de funcionários
  const funcionariosMap = {};
  justificativas.forEach(just => {
    const funcId = just.funcionario_id;
    if (!funcionariosMap[funcId]) {
      funcionariosMap[funcId] = {
        funcionario_id: funcId,
        nome: just.funcionario?.nome || 'Desconhecido',
        total_justificativas: 0
      };
    }
    funcionariosMap[funcId].total_justificativas++;
  });

  const funcionariosArray = Object.values(funcionariosMap);
  stats.funcionarios.total_com_justificativas = funcionariosArray.length;
  stats.funcionarios.media_por_funcionario = (justificativas.length / funcionariosArray.length).toFixed(1);

  // Funcionário com maior frequência
  if (funcionariosArray.length > 0) {
    stats.funcionarios.maior_frequencia = funcionariosArray.reduce((max, func) => 
      func.total_justificativas > max.total_justificativas ? func : max
    );
  }

  // Tempo médio de aprovação (apenas para justificativas aprovadas)
  const aprovadas = justificativas.filter(just => 
    just.status === 'Aprovada' && just.data_aprovacao && just.created_at
  );

  if (aprovadas.length > 0) {
    let totalHoras = 0;
    aprovadas.forEach(just => {
      const criacao = new Date(just.created_at);
      const aprovacao = new Date(just.data_aprovacao);
      const diferencaMs = aprovacao - criacao;
      totalHoras += diferencaMs / (1000 * 60 * 60); // Converter para horas
    });

    const mediaHoras = totalHoras / aprovadas.length;
    stats.tempo_medio_aprovacao.horas = parseFloat(mediaHoras.toFixed(2));
    stats.tempo_medio_aprovacao.dias = parseFloat((mediaHoras / 24).toFixed(2));
  }

  return stats;
}

export {
  calcularHorasTrabalhadas,
  calcularHorasExtras,
  determinarStatus,
  timeToMinutes,
  minutesToTime,
  gerarIdRegistro,
  gerarIdJustificativa,
  validarHorario,
  normalizarHorario,
  validarData,
  formatarDataBR,
  formatarHorario,
  calcularResumoPeriodo,
  calcularResumoJustificativas,
  calcularTendenciaMensal,
  agruparJustificativasPor,
  calcularEstatisticasAvancadas
};
