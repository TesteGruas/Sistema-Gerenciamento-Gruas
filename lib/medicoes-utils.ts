export const medicoesUtils = {
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  formatPeriodo(periodo: string): string {
    // Converte "2025-01" para "Janeiro 2025"
    const [year, month] = periodo.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  },

  getStatusColor(status: string): string {
    switch (status) {
      case 'finalizada': return 'bg-green-500';
      case 'pendente': return 'bg-yellow-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  },

  getStatusLabel(status: string): string {
    switch (status) {
      case 'finalizada': return 'Finalizada';
      case 'pendente': return 'Pendente';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  },

  getStatusIcon(status: string): string {
    switch (status) {
      case 'finalizada': return 'check-circle';
      case 'pendente': return 'clock';
      case 'cancelada': return 'x-circle';
      default: return 'clock';
    }
  },

  calculateTotals(medicoes: any[]): { total: number, finalizadas: number, pendentes: number } {
    const total = medicoes.reduce((sum, medicao) => sum + (medicao.valor_total || 0), 0);
    const finalizadas = medicoes
      .filter(m => m.status === 'finalizada')
      .reduce((sum, medicao) => sum + (medicao.valor_total || 0), 0);
    const pendentes = medicoes
      .filter(m => m.status === 'pendente')
      .reduce((sum, medicao) => sum + (medicao.valor_total || 0), 0);
    
    return { total, finalizadas, pendentes };
  },

  generateNumeroMedicao(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4);
    return `MED-${year}${month}-${timestamp}`;
  },

  validatePeriodo(periodo: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    return regex.test(periodo);
  },

  getPeriodoAtual(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  getPeriodosDisponiveis(): string[] {
    const periodos = [];
    const now = new Date();
    
    // Gerar últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      periodos.push(`${year}-${month}`);
    }
    
    return periodos;
  }
};

/** Moeda pt-BR em input: só dígitos; os dois últimos são centavos (ex.: digitar 100022 → 1.000,22). */
export function parseBrlMoneyDigitsInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export function formatBrlMoneyInputValue(n: number, emptyWhenZero?: boolean): string {
  if (emptyWhenZero && n === 0) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Quantidade / decimal: aceita vírgula decimal e ponto como milhar (1.234,56). */
export function parseBrlDecimalFlexible(raw: string): number {
  const s = raw.trim().replace(/\s/g, '');
  if (!s || s === ',' || s === '.') return 0;
  const normalized = s.includes(',')
    ? s.replace(/\./g, '').replace(',', '.')
    : s.replace(/,/g, '');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatBrlDecimalFlexible(n: number, emptyWhenZero?: boolean): string {
  if (emptyWhenZero && n === 0) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(n);
}
