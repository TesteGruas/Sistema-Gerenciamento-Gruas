export const receitasUtils = {
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  },

  getTipoLabel(tipo: string): string {
    const labels = {
      locacao: 'Locação',
      servico: 'Serviço',
      venda: 'Venda'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  },

  getTipoColor(tipo: string): string {
    const colors = {
      locacao: 'bg-blue-500',
      servico: 'bg-purple-500',
      venda: 'bg-green-500'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-500';
  },

  getStatusLabel(status: string): string {
    const labels = {
      pendente: 'Pendente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada'
    };
    return labels[status as keyof typeof labels] || status;
  },

  getStatusColor(status: string): string {
    const colors = {
      pendente: 'bg-yellow-500',
      confirmada: 'bg-green-500',
      cancelada: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  },

  getStatusIcon(status: string) {
    const icons = {
      pendente: 'Clock',
      confirmada: 'CheckCircle',
      cancelada: 'XCircle'
    };
    return icons[status as keyof typeof icons] || 'Clock';
  },

  getTipoIcon(tipo: string) {
    const icons = {
      locacao: 'Building2',
      servico: 'Wrench',
      venda: 'ShoppingCart'
    };
    return icons[tipo as keyof typeof icons] || 'FileText';
  },

  calculateTotals(receitas: any[]) {
    const total = receitas.reduce((sum, receita) => sum + (receita.valor || 0), 0);
    const confirmadas = receitas
      .filter(r => r.status === 'confirmada')
      .reduce((sum, receita) => sum + (receita.valor || 0), 0);
    const pendentes = receitas
      .filter(r => r.status === 'pendente')
      .reduce((sum, receita) => sum + (receita.valor || 0), 0);
    const canceladas = receitas
      .filter(r => r.status === 'cancelada')
      .reduce((sum, receita) => sum + (receita.valor || 0), 0);

    return {
      total,
      confirmadas,
      pendentes,
      canceladas,
      count: receitas.length
    };
  },

  validateReceitaForm(form: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!form.obra_id) {
      errors.push('Obra é obrigatória');
    }

    if (!form.tipo) {
      errors.push('Tipo é obrigatório');
    }

    if (!form.descricao || form.descricao.trim().length === 0) {
      errors.push('Descrição é obrigatória');
    }

    if (!form.valor || form.valor <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!form.data_receita) {
      errors.push('Data da receita é obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  formatReceitaForExport(receita: any) {
    return {
      id: receita.id,
      obra: receita.obras?.nome || 'N/A',
      cliente: receita.obras?.clientes?.nome || 'N/A',
      funcionario: receita.funcionarios?.nome || 'N/A',
      tipo: this.getTipoLabel(receita.tipo),
      descricao: receita.descricao,
      valor: this.formatCurrency(receita.valor),
      data: this.formatDate(receita.data_receita),
      status: this.getStatusLabel(receita.status),
      observacoes: receita.observacoes || ''
    };
  }
};
