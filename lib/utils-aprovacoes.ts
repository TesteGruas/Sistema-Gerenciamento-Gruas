// Utilitários para aprovações de horas extras

/**
 * Retorna a cor baseada no status da aprovação
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'aprovado':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pendente':
    case 'pendente aprovação':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'rejeitado':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelado':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Formata uma data no padrão brasileiro (dd/mm/aaaa)
 */
export function formatarData(data: string | Date): string {
  try {
    const date = typeof data === 'string' ? new Date(data) : data;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Formata uma data e hora no padrão brasileiro (dd/mm/aaaa às HH:mm)
 */
export function formatarDataHora(data: string | Date): string {
  try {
    const date = typeof data === 'string' ? new Date(data) : data;
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Formata o tempo relativo (ex: "há 2 horas", "há 3 dias")
 */
export function formatarTempoRelativo(data: string | Date): string {
  try {
    const agora = new Date();
    const dataPassada = typeof data === 'string' ? new Date(data) : data;
    const diferencaMs = agora.getTime() - dataPassada.getTime();
    
    const segundos = Math.floor(diferencaMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    
    if (meses > 0) {
      return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    }
    if (semanas > 0) {
      return `há ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`;
    }
    if (dias > 0) {
      return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    }
    if (horas > 0) {
      return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    }
    if (minutos > 0) {
      return `há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    }
    return 'agora mesmo';
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Normaliza o status para comparação
 */
export function normalizarStatus(status: string): string {
  const normalizado = status.toLowerCase().trim();
  if (normalizado === 'pendente aprovação') return 'pendente';
  return normalizado;
}

/**
 * Verifica se um prazo está vencido
 */
export function isPrazoVencido(dataLimite: string | Date): boolean {
  try {
    const limite = typeof dataLimite === 'string' ? new Date(dataLimite) : dataLimite;
    return limite < new Date();
  } catch (error) {
    return false;
  }
}

/**
 * Calcula o tempo restante até uma data limite
 */
export function calcularTempoRestante(dataLimite: string | Date): string {
  try {
    const agora = new Date();
    const limite = typeof dataLimite === 'string' ? new Date(dataLimite) : dataLimite;
    const diferencaMs = limite.getTime() - agora.getTime();
    
    if (diferencaMs <= 0) {
      return 'Prazo expirado';
    }
    
    const horas = Math.floor(diferencaMs / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
      return `${dias} ${dias === 1 ? 'dia' : 'dias'} restante${dias === 1 ? '' : 's'}`;
    }
    if (horas > 0) {
      return `${horas} ${horas === 1 ? 'hora' : 'horas'} restante${horas === 1 ? '' : 's'}`;
    }
    return 'Menos de 1 hora';
  } catch (error) {
    return 'Data inválida';
  }
}

