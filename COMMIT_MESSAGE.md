# Commit: Implementação de Impostos Dinâmicos e Integração de Boletos com Notas Fiscais

## Descrição

Implementação completa de sistema de impostos dinâmicos para itens de notas fiscais, correção do cálculo de valor líquido, integração de boletos com notas fiscais e ajustes na interface de contas a receber/pagar.

## Mudanças Principais

### 1. Sistema de Impostos Dinâmicos
- **Migration**: Adicionado campo `impostos_dinamicos` (JSONB) na tabela `notas_fiscais_itens`
- **Frontend**: Interface completa para criar, editar e remover impostos personalizados por item
- **Backend**: Validação e processamento de impostos dinâmicos com cálculo automático de valores
- **Funcionalidades**:
  - Adicionar múltiplos impostos personalizados por item
  - Campos: nome, tipo, base de cálculo, alíquota e valor calculado
  - Cálculo automático do valor baseado na base de cálculo e alíquota
  - Remoção individual de impostos
  - Integração com cálculo de valor líquido do item

### 2. Cálculo de Valor Líquido
- **Correção**: Valor líquido da nota fiscal agora é calculado somando os valores líquidos dos itens
- **Migration**: Script para recalcular valores líquidos de notas fiscais existentes
- **Backend**: Atualização automática de `valor_liquido` ao criar/atualizar itens
- **Impacto**: Notas fiscais agora mostram corretamente o valor após descontos de impostos

### 3. Integração Boletos ↔ Notas Fiscais
- **Migration**: Adicionado campo `nota_fiscal_id` na tabela `boletos`
- **Backend**: Criação automática de boleto ao criar nota fiscal
  - Notas de saída → Boleto tipo "receber"
  - Notas de entrada → Boleto tipo "pagar"
  - Valor do boleto usa `valor_liquido` da nota fiscal
- **Endpoints**: 
  - `GET /api/notas-fiscais/:id/boletos` - Lista boletos de uma nota fiscal
  - Boletos incluem relacionamento com notas fiscais nas queries

### 4. Contas a Receber/Pagar
- **Correção**: Uso de `valor_liquido` ao invés de `valor_total` em contas a receber
- **Remoção**: Orçamentos removidos da lista de contas a receber
- **Adição**: Notas fiscais de entrada agora aparecem em contas a pagar
- **Backend**: Queries atualizadas para incluir `valor_liquido` e filtrar corretamente

### 5. Ajustes de Interface
- **Padding**: Ajustado padding do layout financeiro de `p-1` para `p-4 sm:p-6`
- **UX**: Melhor espaçamento em todas as páginas do módulo financeiro

## Arquivos Criados

### Migrations
- `backend-api/database/migrations/20250125_add_impostos_dinamicos_notas_fiscais_itens.sql`
- `backend-api/database/migrations/20250125_recalcular_valor_liquido_notas_fiscais.sql`
- `backend-api/database/migrations/20250125_add_nota_fiscal_id_boletos.sql`

### Scripts
- `backend-api/scripts/executar-recalcular-valor-liquido.js`

## Arquivos Modificados

### Backend
- `backend-api/src/routes/notas-fiscais.js`
  - Adicionado suporte a impostos dinâmicos no schema de validação
  - Cálculo automático de valor líquido incluindo impostos dinâmicos
  - Criação automática de boleto ao criar nota fiscal
  - Endpoint para listar boletos de uma nota fiscal
  - Atualização de valor líquido da nota ao criar/atualizar itens

- `backend-api/src/routes/boletos.js`
  - Adicionado `nota_fiscal_id` no schema de validação
  - Queries incluem relacionamento com notas fiscais
  - Filtros atualizados para incluir `nota_fiscal_id` e `tipo`

- `backend-api/src/routes/contas-receber.js`
  - Uso de `valor_liquido` ao invés de `valor_total`
  - Queries atualizadas para buscar `valor_liquido` das notas fiscais

- `backend-api/src/routes/contas-pagar.js`
  - Adicionado suporte para notas fiscais de entrada
  - Transformação de notas fiscais em formato de contas a pagar
  - Uso de `valor_liquido` quando disponível

### Frontend
- `app/dashboard/financeiro/notas-fiscais/page.tsx`
  - Interface para gerenciar impostos dinâmicos
  - Funções para adicionar/remover/atualizar impostos
  - Cálculo automático incluindo impostos dinâmicos
  - Parse de impostos dinâmicos ao carregar itens

- `app/dashboard/financeiro/contas-receber/page.tsx`
  - Removida renderização de orçamentos
  - Atualizado useMemo para não incluir orçamentos
  - Removido código de visualização de orçamentos

- `app/dashboard/financeiro/layout.tsx`
  - Ajustado padding de `p-1` para `p-4 sm:p-6`

## Impacto

### Funcionalidades Novas
✅ Criar impostos personalizados por item de nota fiscal
✅ Cada nota fiscal tem boleto associado automaticamente
✅ Valor líquido calculado corretamente (descontando todos os impostos)
✅ Notas fiscais aparecem em contas a receber/pagar com valor correto

### Correções
✅ Valor líquido agora reflete corretamente os descontos de impostos
✅ Orçamentos não aparecem mais em contas a receber
✅ Notas fiscais de entrada aparecem em contas a pagar
✅ Padding adequado em todas as páginas financeiras

## Testes Recomendados

1. **Impostos Dinâmicos**:
   - Criar nota fiscal com item
   - Adicionar impostos dinâmicos (ex: PIS, COFINS)
   - Verificar cálculo automático do valor
   - Verificar valor líquido do item

2. **Valor Líquido**:
   - Criar nota com item de R$7.000,00
   - Adicionar ISS R$350 e INSS R$770
   - Verificar se valor líquido é R$5.880,00

3. **Boletos**:
   - Criar nota fiscal de saída → Verificar boleto tipo "receber"
   - Criar nota fiscal de entrada → Verificar boleto tipo "pagar"
   - Verificar valor do boleto igual ao valor líquido

4. **Contas a Receber/Pagar**:
   - Verificar notas fiscais de saída em contas a receber
   - Verificar notas fiscais de entrada em contas a pagar
   - Verificar valores usando valor líquido
   - Confirmar que orçamentos não aparecem

## Migrations a Executar

```sql
-- 1. Adicionar campo de impostos dinâmicos
-- backend-api/database/migrations/20250125_add_impostos_dinamicos_notas_fiscais_itens.sql

-- 2. Recalcular valores líquidos existentes
-- backend-api/database/migrations/20250125_recalcular_valor_liquido_notas_fiscais.sql

-- 3. Adicionar relacionamento com boletos
-- backend-api/database/migrations/20250125_add_nota_fiscal_id_boletos.sql
```

## Observações

- As migrations devem ser executadas na ordem apresentada
- O script de recálculo pode ser executado via Node.js ou diretamente no SQL Editor
- Boletos são criados automaticamente, mas podem ser editados manualmente depois
- Impostos dinâmicos são opcionais e não afetam notas fiscais existentes
