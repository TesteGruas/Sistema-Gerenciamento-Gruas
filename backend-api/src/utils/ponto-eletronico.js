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
 * Calcula as horas extras baseado nas horas trabalhadas
 * @param {number} horasTrabalhadas - Total de horas trabalhadas
 * @param {number} jornadaPadrao - Jornada padrão em horas (padrão: 8)
 * @returns {number} Horas extras
 */
function calcularHorasExtras(horasTrabalhadas, jornadaPadrao = 8) {
  return Math.max(0, horasTrabalhadas - jornadaPadrao);
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
  
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
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

export {
  calcularHorasTrabalhadas,
  calcularHorasExtras,
  determinarStatus,
  timeToMinutes,
  minutesToTime,
  gerarIdRegistro,
  gerarIdJustificativa,
  validarHorario,
  validarData,
  formatarDataBR,
  formatarHorario,
  calcularResumoPeriodo
};
