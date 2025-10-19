# Integração de Relatórios Financeiros - Frontend
## Implementação Concluída - 19/12/2024

## 📋 Resumo

Integrei os endpoints de relatórios financeiros existentes no backend com o frontend, criando uma interface completa para visualização e análise de dados financeiros e de impostos.

## 🚀 Endpoints Integrados

### **1. Relatório Financeiro Geral**
- **Endpoint**: `GET /api/relatorios/financeiro`
- **Funcionalidade**: Análise completa de vendas, compras e orçamentos
- **Agrupamento**: Por grua, obra, cliente ou mês
- **Status**: ✅ **Integrado**

### **2. Relatório de Impostos Financeiros**
- **Endpoint**: `GET /api/impostos-financeiros/relatorio`
- **Funcionalidade**: Análise de impostos por competência
- **Filtros**: Mês e ano
- **Status**: ✅ **Integrado**

## 🔧 Implementação Técnica

### **1. API de Relatórios (`lib/api-relatorios.ts`)**

#### **Interface Adicionada:**
```typescript
export interface RelatorioImpostos {
  competencia: string;
  total_impostos: number;
  total_pago: number;
  total_pendente: number;
  impostos_por_tipo: Array<{
    tipo: string;
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
  }>;
}
```

#### **Função Adicionada:**
```typescript
// Relatório de impostos financeiros
async impostos(params: {
  mes: number;
  ano: number;
}): Promise<{ success: boolean; data: RelatorioImpostos }> {
  const queryParams = new URLSearchParams();
  queryParams.append('mes', params.mes.toString());
  queryParams.append('ano', params.ano.toString());
  
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/api/impostos-financeiros/relatorio?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
```

### **2. Interface de Usuário (`app/dashboard/financeiro/relatorios/page.tsx`)**

#### **Nova Aba Adicionada:**
- **Aba "Impostos"** na interface de relatórios financeiros
- **Filtros de período** (mês e ano)
- **Cards de resumo** com métricas principais
- **Tabela detalhada** por tipo de imposto

#### **Funcionalidades Implementadas:**

##### **Filtros de Período:**
```typescript
// Seletores de mês e ano
<Select onValueChange={(value) => carregarRelatorioImpostos(parseInt(value), new Date().getFullYear())}>
  <SelectTrigger className="w-32">
    <SelectValue placeholder="Mês" />
  </SelectTrigger>
  <SelectContent>
    {Array.from({ length: 12 }, (_, i) => (
      <SelectItem key={i + 1} value={(i + 1).toString()}>
        {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

##### **Cards de Resumo:**
- **Total de Impostos**: Valor total dos impostos do período
- **Total Pago**: Valor dos impostos já pagos
- **Total Pendente**: Valor dos impostos pendentes
- **Taxa de Pagamento**: Percentual de impostos pagos

##### **Tabela Detalhada:**
- **Tipo de Imposto**: ICMS, IPI, PIS, COFINS, etc.
- **Valor Total**: Valor total do imposto
- **Valor Pago**: Valor já pago
- **Valor Pendente**: Valor ainda pendente
- **Status**: Badge indicando se está pago ou pendente

#### **Função de Carregamento:**
```typescript
const carregarRelatorioImpostos = async (mes?: number, ano?: number) => {
  try {
    setIsLoadingImpostos(true)
    
    const hoje = new Date()
    const mesAtual = mes || hoje.getMonth() + 1
    const anoAtual = ano || hoje.getFullYear()
    
    const response = await apiRelatorios.impostos({
      mes: mesAtual,
      ano: anoAtual
    })
    
    setRelatorioImpostos(response.data)
    
    toast({
      title: "Sucesso",
      description: "Relatório de impostos carregado com sucesso",
      variant: "default"
    })
  } catch (error: any) {
    console.error('Erro ao carregar relatório de impostos:', error)
    toast({
      title: "Erro",
      description: "Erro ao carregar relatório de impostos",
      variant: "destructive"
    })
  } finally {
    setIsLoadingImpostos(false)
  }
}
```

## 📊 Interface de Usuário

### **Estrutura da Nova Aba:**

#### **1. Cabeçalho:**
- **Título**: "Relatório de Impostos"
- **Descrição**: "Análise de impostos por competência"
- **Ícone**: Receipt (recibo)

#### **2. Filtros:**
- **Seletor de Mês**: Dropdown com todos os meses
- **Seletor de Ano**: Dropdown com últimos 5 anos
- **Botão Buscar**: Carrega o relatório com os filtros selecionados

#### **3. Cards de Resumo (4 colunas):**
- **Total de Impostos**: Valor total em azul
- **Total Pago**: Valor pago em verde
- **Total Pendente**: Valor pendente em laranja
- **Taxa de Pagamento**: Percentual em azul

#### **4. Tabela Detalhada:**
- **Colunas**: Tipo, Valor Total, Valor Pago, Valor Pendente, Status
- **Status**: Badge verde para "Pago", laranja para "Pendente"
- **Formatação**: Valores em reais com 2 casas decimais

## 🎯 Funcionalidades Implementadas

### **✅ Relatório Financeiro Geral:**
- **Já existia** e estava funcionando
- **Agrupamento** por grua, obra, cliente ou mês
- **Paginação** completa
- **Cálculos** de receita, lucro e margem

### **✅ Relatório de Impostos (NOVO):**
- **Filtros** por mês e ano
- **Resumo visual** com cards coloridos
- **Detalhamento** por tipo de imposto
- **Status** de pagamento
- **Taxa de pagamento** calculada automaticamente

## 📋 Dados Exibidos

### **Relatório de Impostos:**

#### **Resumo Geral:**
```json
{
  "competencia": "2024-12",
  "total_impostos": 15000.00,
  "total_pago": 12000.00,
  "total_pendente": 3000.00
}
```

#### **Detalhamento por Tipo:**
```json
{
  "impostos_por_tipo": [
    {
      "tipo": "ICMS",
      "valor_total": 8000.00,
      "valor_pago": 6000.00,
      "valor_pendente": 2000.00
    },
    {
      "tipo": "IPI",
      "valor_total": 7000.00,
      "valor_pago": 6000.00,
      "valor_pendente": 1000.00
    }
  ]
}
```

## 🚀 Como Usar

### **1. Acessar Relatórios:**
1. Navegar para `/dashboard/financeiro/relatorios`
2. Clicar na aba "Impostos"

### **2. Filtrar por Período:**
1. Selecionar o mês desejado
2. Selecionar o ano desejado
3. Clicar em "Buscar"

### **3. Visualizar Dados:**
- **Cards superiores**: Resumo geral do período
- **Tabela**: Detalhamento por tipo de imposto
- **Status**: Indicadores visuais de pagamento

## 🔧 Configuração

### **Variáveis de Ambiente:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### **Dependências:**
- `@/lib/api-relatorios` - API de relatórios
- `@/components/ui/*` - Componentes de interface
- `lucide-react` - Ícones

## 📊 Benefícios da Integração

### **Para o Usuário:**
- ✅ **Interface unificada** para todos os relatórios financeiros
- ✅ **Visualização clara** de impostos por período
- ✅ **Filtros intuitivos** por mês e ano
- ✅ **Métricas importantes** em destaque

### **Para o Sistema:**
- ✅ **Reutilização** de endpoints existentes
- ✅ **Consistência** na interface
- ✅ **Performance** otimizada
- ✅ **Manutenibilidade** melhorada

## 🎉 Status da Implementação

- ✅ **API de Relatórios**: Atualizada com endpoint de impostos
- ✅ **Interface de Usuário**: Nova aba "Impostos" adicionada
- ✅ **Filtros de Período**: Mês e ano implementados
- ✅ **Cards de Resumo**: 4 métricas principais
- ✅ **Tabela Detalhada**: Por tipo de imposto
- ✅ **Tratamento de Erros**: Feedback adequado ao usuário
- ✅ **Loading States**: Indicadores de carregamento
- ✅ **Responsividade**: Interface adaptável

## 🚀 Próximos Passos

### **Melhorias Futuras:**
1. **Gráficos**: Adicionar visualizações gráficas
2. **Exportação**: PDF e Excel dos relatórios
3. **Comparação**: Comparar períodos diferentes
4. **Alertas**: Notificações para impostos vencidos
5. **Histórico**: Gráfico de evolução dos impostos

### **Funcionalidades Adicionais:**
1. **Relatório de Fluxo de Caixa**: Integrar com dados de receitas/despesas
2. **Relatório de Rentabilidade**: Análise por obra/grua
3. **Dashboard Executivo**: Visão consolidada de todos os relatórios

## 📝 Conclusão

A integração dos endpoints de relatórios financeiros foi concluída com sucesso, proporcionando uma interface completa e intuitiva para análise de dados financeiros e de impostos. O sistema agora oferece uma experiência unificada para todos os tipos de relatórios financeiros, com filtros eficientes e visualizações claras dos dados mais importantes.
