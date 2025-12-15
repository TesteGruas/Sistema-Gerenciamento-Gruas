# 📋 Tópicos de Ajustes - Cartão de Ponto e Relatórios

Este documento lista os ajustes solicitados pelo cliente para o sistema de cartão de ponto e relatórios.

---

## 1. 🗓️ Feriados Nacionais e Finais de Semana

### 1.1. Programação Automática
- [ ] Programar feriados nacionais automaticamente no sistema
- [ ] Programar finais de semana (sábados e domingos) automaticamente
- [ ] **Importante:** Dia facultativo NÃO é feriado (distinguir corretamente)
- [ ] Sinalizar no relatório do cartão de pontos quando o dia é:
  - Feriado nacional
  - Feriado estadual
  - Feriado local
  - Sábado
  - Domingo
  - Dia normal

### 1.2. Identificação no Início do Cartão de Ponto
- [ ] Ao iniciar o cartão de ponto, exibir pergunta: **"Hoje é feriado?"**
  - Se resposta for **SIM**, exibir segunda pergunta:
    - **"É feriado estadual ou feriado nacional?"**
  - Se resposta for **NÃO**, continuar fluxo normal
- [ ] Armazenar essa informação no registro do ponto
- [ ] Exibir essa informação claramente no relatório final

### 1.3. Sinalização no Relatório
- [ ] No resumo do cartão de pontos, informar claramente:
  - Tipo de dia (Normal, Feriado Nacional, Feriado Estadual, Feriado Local, Sábado, Domingo)
  - Impacto no cálculo de horas extras (diferentes percentuais de acréscimo)

---

## 2. 🍽️ Horário de Almoço - Notificação e Confirmação

### 2.1. Entrada Automática de Almoço
- [ ] Sistema deve automaticamente registrar entrada de almoço às **12:00**
- [ ] Quando estiver se aproximando do horário (ex: **11:50**), enviar notificação ao operador perguntando:
  - **"Vai ter parada para almoçar ou será trabalho corrido?"**
- [ ] Opções de resposta:
  - **"Sim, vou parar para almoçar"** → Sistema registra almoço normalmente
  - **"Não, será trabalho corrido"** → Sistema marca como trabalho corrido

### 2.2. Confirmação pelo Encarregado
- [ ] No final do dia, o **encarregado da obra** precisa confirmar o trabalho corrido
- [ ] Criar interface para encarregado revisar e confirmar registros de trabalho corrido
- [ ] Registrar data/hora e responsável pela confirmação

---

## 3. ⏰ Sinalização de Horas Extras

### 3.1. Identificação Automática
- [ ] Definir horário padrão de trabalho (ex: até **17:00**)
- [ ] Qualquer trabalho após esse horário deve ser automaticamente identificado como **hora extra**
- [ ] Calcular e contabilizar horas extras automaticamente

### 3.2. Exibição no Relatório
- [ ] No relatório do cartão de pontos, sinalizar claramente:
  - Horas trabalhadas normais
  - Horas extras trabalhadas
  - Percentual de acréscimo aplicado (conforme tipo de dia)
- [ ] Exibir totais de horas extras no resumo mensal

### 3.3. Cálculo por Tipo de Dia
- [ ] Aplicar percentuais corretos de acréscimo conforme tipo de dia:
  - **Domingo:** 100% de acréscimo
  - **Sábado:** 60% de acréscimo (conforme exemplo do PDF)
  - **Feriado Nacional:** 100% de acréscimo
  - **Feriado Estadual/Local:** Definir percentual
  - **Dia Normal:** 0% de acréscimo (após 17:00)

---

## 4. 📊 Resumo de Assinaturas do Encarregado

### 4.1. Funcionalidade
- [ ] Criar funcionalidade para encarregado visualizar resumo das assinaturas que fez no mês
- [ ] Exibir:
  - Quantidade de assinaturas realizadas
  - Período (mês/ano)
  - Lista de assinaturas com detalhes (data, documento, etc.)

### 4.2. Interface
- [ ] Criar página/seção no dashboard para encarregados
- [ ] Permitir filtro por mês/ano
- [ ] Exportar relatório (PDF/Excel) se necessário

---

## 5. 📋 Relatório de Aluguéis

### 5.1. Informações a Exibir
- [ ] **Data de início do contrato**
- [ ] **Data que completa 1 ano de contrato** (data de início + 1 ano)
- [ ] Status do contrato (ativo, encerrado, próximo ao vencimento)
- [ ] Dias restantes até completar 1 ano (se ainda não completou)

### 5.2. Interface
- [ ] Criar/atualizar relatório na seção de Aluguéis
- [ ] Exibir informações de forma clara e organizada
- [ ] Permitir filtros e ordenação
- [ ] Destacar contratos próximos ao vencimento (ex: últimos 30 dias)

---

## 6. 📄 Referência - Exemplo de Relatório

Baseado no PDF fornecido (RESUMO DE HORAS 112025 ANDERSON RAEL.pdf), o relatório deve conter:

### 6.1. Informações do Funcionário
- Nome
- Departamento
- Cargo
- Matrícula
- Saldo do mês anterior (horas extras, horas negativas)

### 6.2. Registro Diário
- Data e dia da semana
- Classificação do dia (Normal, Feriado, etc.)
- Horários: Início, Intervalo (almoço), Fim
- Horas trabalhadas (+)
- Horas negativas (-)
- Horas extras

### 6.3. Totais por Tipo de Dia
- Domingo: horas extras, acréscimo (100%), total
- Segunda: horas extras, acréscimo (0%), total
- Terça: horas extras, acréscimo (0%), total
- Quarta: horas extras, acréscimo (0%), total
- Quinta: horas extras, acréscimo (0%), total
- Sexta: horas extras, acréscimo (0%), total
- Sábado: horas extras, acréscimo (60%), total
- Feriado: horas extras, acréscimo (100%), total
- **Total geral com acréscimos**

---

## 📝 Observações Importantes

1. **Dia Facultativo ≠ Feriado:** O sistema deve distinguir corretamente entre dia facultativo e feriado oficial.

2. **Cálculo de Horas Extras:** O cálculo deve considerar:
   - Horário padrão de trabalho (ex: 17:00)
   - Tipo de dia (normal, feriado, final de semana)
   - Percentual de acréscimo correto para cada tipo

3. **Trabalho Corrido:** Quando o operador informa que será trabalho corrido, o sistema não deve descontar intervalo de almoço, mas o encarregado deve confirmar no final do dia.

4. **Notificações:** As notificações sobre almoço devem ser enviadas próximo ao horário (11:50) para dar tempo do operador responder antes das 12:00.

---

**Data de Criação:** 2025-02-28  
**Status:** Aguardando implementação

