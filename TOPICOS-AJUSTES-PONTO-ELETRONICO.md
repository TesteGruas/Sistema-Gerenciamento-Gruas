# 📋 Tópicos de Ajustes - Ponto Eletrônico e Relatórios

## 🎯 Resumo dos Ajustes Solicitados

Documento organizando os ajustes solicitados pelo cliente para o sistema de ponto eletrônico e relatórios.

---

## 1. 📅 Programação de Feriados e Finais de Semana

### 1.1. Feriados Nacionais
- [ ] Programar feriados nacionais automaticamente no sistema
- [ ] Sinalizar feriados nacionais no relatório do cartão de pontos
- [ ] Diferenciar feriado nacional de dia facultativo (dia facultativo não é feriado)

### 1.2. Finais de Semana
- [ ] Sinalizar sábados e domingos automaticamente no relatório
- [ ] Identificar e marcar corretamente no relatório final

### 1.3. Identificação no Início do Cartão de Ponto
- [ ] Ao iniciar o cartão de ponto, exibir pergunta: **"Hoje é feriado?"**
- [ ] Se a resposta for **SIM**, exibir segunda pergunta: **"Feriado estadual ou feriado nacional?"**
- [ ] Salvar a informação do tipo de feriado para cálculo correto de horas extras

### 1.4. Sinalização no Relatório
- [ ] No relatório final, sinalizar claramente:
  - Se é sábado
  - Se é domingo
  - Se é feriado (e qual tipo: nacional, estadual ou local)
- [ ] Informação deve aparecer de forma clara e explicativa no resumo

---

## 2. 🍽️ Horário de Almoço Automático

### 2.1. Entrada Automática
- [ ] Sistema deve automaticamente entrar em horário de almoço às **12:00**

### 2.2. Notificação Prévia
- [ ] Quando estiver chegando no horário (ex: **11:50**), enviar notificação para o operador
- [ ] Perguntar: **"Vai ter parada para almoçar ou será trabalho corrido?"**
- [ ] Opções: "Parada para almoço" ou "Trabalho corrido"

### 2.3. Confirmação pelo Encarregado
- [ ] No final do dia, o encarregado da obra precisa confirmar o trabalho corrido
- [ ] Sistema deve registrar essa confirmação

---

## 3. ⏰ Cálculo e Sinalização de Horas Extras

### 3.1. Horários de Trabalho Padrão
- **Segunda a Quinta-feira:** 07:00 às 17:00 (10 horas)
- **Sexta-feira:** 07:00 às 16:00 (9 horas)
- Qualquer hora trabalhada além desses horários = **Hora Extra**

### 3.2. Contabilização Automática
- [ ] Sistema deve identificar automaticamente quando o funcionário ultrapassar o horário padrão
- [ ] Contabilizar horas extras automaticamente
- [ ] Sinalizar as horas extras no relatório do cartão de pontos

### 3.3. Exemplo de Cálculo
- Se trabalha até 17:00 (segunda-quinta) = normal
- Se trabalha até 18:00 (segunda-quinta) = 1 hora extra
- Se trabalha até 18:30 (segunda-quinta) = 1h30 extra

---

## 4. 📊 Resumo de Horas Extras por Dia da Semana

### 4.1. Relatório Detalhado (Conforme PDF)
- [ ] Criar resumo completo no final do relatório mostrando:
  - **Segunda-feira:** Total de horas extras trabalhadas (ex: 1h30)
  - **Terça-feira:** Total de horas extras trabalhadas (ex: 2h00)
  - **Quarta-feira:** Total de horas extras trabalhadas (ex: 1h30)
  - **Quinta-feira:** Total de horas extras trabalhadas (ex: 0h30)
  - **Sexta-feira:** Total de horas extras trabalhadas (ex: 0h30)
  - **Sábado:** Total de horas extras trabalhadas (ex: 14h30)
  - **Domingo:** Total de horas extras trabalhadas (ex: 0h00)
  - **Feriados:** Total de horas extras trabalhadas

### 4.2. Formato do Resumo
- [ ] Exibir tabela similar ao PDF fornecido
- [ ] Mostrar:
  - Dia da semana
  - Total de horas extras
  - Percentual de acréscimo (se aplicável)
  - Total com acréscimos
  - Banco de horas (se aplicável)
  - Total final

### 4.3. Exemplo de Resumo Esperado
```
Segunda-feira: 1h30 extra
Terça-feira: 2h00 extra
Quarta-feira: 1h30 extra
Quinta-feira: 0h30 extra
Sexta-feira: 0h30 extra
Sábado: 14h30 extra
Domingo: 0h00 extra
Feriado: 6h30 extra
```

---

## 5. ✍️ Resumo de Assinaturas do Encarregado

### 5.1. Funcionalidade
- [ ] Perguntar ao encarregado se ele tem acesso ao resumo das assinaturas que fez no mês
- [ ] Se não tiver, implementar funcionalidade para visualizar:
  - Quantidade de assinaturas realizadas no mês
  - Lista de assinaturas com datas
  - Detalhes de cada assinatura

---

## 6. 📋 Relatório de Aluguéis

### 6.1. Informações a Exibir
- [ ] Mostrar **data de início do contrato**
- [ ] Mostrar **data que completa 1 ano de contrato** (aniversário do contrato)
- [ ] Calcular automaticamente quando o contrato completa 1 ano
- [ ] Sinalizar contratos próximos de completar 1 ano (ex: alerta 30 dias antes)

---

## 📝 Observações Importantes

### Sobre Feriados
- Dia facultativo **NÃO** é feriado
- É importante identificar o tipo de feriado (nacional, estadual, local) para cálculo correto de horas extras
- O cálculo de horas extras varia conforme o tipo de dia (normal, sábado, domingo, feriado)

### Sobre Horas Extras
- O cálculo deve considerar:
  - Horário padrão de trabalho (diferente para sexta-feira)
  - Tipo de dia (normal, sábado, domingo, feriado)
  - Percentuais de acréscimo conforme legislação trabalhista

### Sobre o Relatório
- O relatório final deve ser claro e completo
- Deve mostrar todas as informações necessárias para cálculo de folha de pagamento
- Formato deve ser similar ao PDF fornecido como referência

---

## 🔄 Fluxo Sugerido para Implementação

1. **Fase 1:** Programação de feriados e identificação de dias
2. **Fase 2:** Sistema de notificação de almoço e confirmação
3. **Fase 3:** Cálculo automático de horas extras
4. **Fase 4:** Geração de relatório completo com resumo
5. **Fase 5:** Relatório de assinaturas e aluguéis

---

**Data de Criação:** 2025-02-28  
**Status:** 📝 Aguardando Implementação
