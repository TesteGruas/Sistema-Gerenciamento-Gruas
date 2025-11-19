/**
 * Templates de Textos Padrão para Orçamentos
 * Estes textos são pré-preenchidos mas podem ser editados
 */

export const TEMPLATES_ORCAMENTO = {
  escopo_incluso: `• Operador e sinaleiro por turno (carga horária mensal definida)
• Manutenção em horário normal de trabalho
• Treinamento, ART e documentação conforme NR-18
• Fornecimento de equipamento completo e em condições de uso
• Suporte técnico durante o período de locação`,

  responsabilidades_cliente: `• Fornecer energia 380V no local da instalação
• Disponibilizar sinaleiros para içamento quando necessário
• Acessos preparados para transporte e montagem
• Cumprimento das normas NR-18 e infraestrutura para instalação
• Área de estacionamento e manobra para transporte
• Responsável por danos causados por uso inadequado ou falta de manutenção preventiva`,

  condicoes_comerciais: `• Prazo de validade do orçamento: 30 dias
• Forma de pagamento: Mensal, vencimento no dia 10 de cada mês
• Multa por atraso: 2% ao mês
• Juros de mora: 1% ao mês
• Reajuste anual conforme índice IGP-M
• Caução: 10% do valor total da locação (retornável ao término do contrato)
• Retenção contratual: 10% do valor mensal até o término do contrato`,

  condicoes_gerais: `1. O equipamento permanece propriedade da locadora durante todo o período de locação.

2. O cliente é responsável pela guarda, conservação e uso adequado do equipamento, respondendo por perdas, danos ou extravios.

3. A locadora se responsabiliza pela manutenção preventiva e corretiva do equipamento, exceto danos causados por uso inadequado.

4. Em caso de necessidade de horas extras, estas serão cobradas conforme tabela de preços vigente.

5. O cliente deve comunicar imediatamente qualquer irregularidade ou necessidade de manutenção.

6. A locadora se reserva o direito de inspecionar o equipamento a qualquer momento.

7. O não pagamento das mensalidades acarretará na suspensão dos serviços e retirada do equipamento.

8. Este orçamento está sujeito à disponibilidade de equipamento e aprovação técnica do local de instalação.`,

  logistica: `• Transporte de ida e volta do equipamento até a obra
• Montagem e desmontagem do equipamento por equipe especializada
• Fornecimento de guindaste para montagem (quando necessário)
• Equipe técnica para acompanhamento da instalação
• Documentação técnica e certificados de conformidade
• Coordenação logística para entrega e retirada do equipamento`,

  garantias: `• Garantia de funcionamento do equipamento durante todo o período de locação
• Garantia de manutenção preventiva conforme cronograma estabelecido
• Garantia de disponibilidade de peças de reposição
• Garantia de suporte técnico 24 horas para emergências
• Garantia de substituição do equipamento em caso de avaria não reparável em até 48 horas
• Garantia de conformidade com normas técnicas (NR-18, ABNT, etc.)
• Garantia de seguro de responsabilidade civil e roubo/furto`
}

/**
 * Função para obter template com opção de personalização
 */
export function getTemplateOrcamento(
  campo: keyof typeof TEMPLATES_ORCAMENTO,
  personalizado?: string
): string {
  return personalizado || TEMPLATES_ORCAMENTO[campo] || ''
}

/**
 * Função para verificar se um texto é o template padrão
 */
export function isTemplatePadrao(
  campo: keyof typeof TEMPLATES_ORCAMENTO,
  texto: string
): boolean {
  const template = TEMPLATES_ORCAMENTO[campo]
  if (!template) return false
  
  // Remove espaços e quebras de linha para comparação
  const normalize = (str: string) => str.replace(/\s+/g, ' ').trim()
  return normalize(texto) === normalize(template)
}

