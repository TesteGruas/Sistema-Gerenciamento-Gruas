# Relatório de Implementação: Erros de Notificações e Aprovações

## 📊 Status Geral

**Data da Análise:** 2025-02-02  
**Arquivo Analisado:** `README-ERROS-NOTIFICACOES.md`  
**Versão:** 1.0

---

## 📋 Resumo Executivo

Este documento analisa a implementação das soluções propostas para corrigir os erros de notificações e aprovações de horas extras. O documento descreve dois erros críticos (22P02 e 23503) e propõe 4 soluções para corrigi-los.

**Status Geral:** ❌ **0% RESOLVIDO**

**Todas as soluções propostas ainda não foram implementadas.**

---

## 🔴 Erros Identificados

### 1. Erro 22P02 - Invalid Input Syntax for Type Integer

**Status:** ❌ **NÃO RESOLVIDO**

**Descrição:**
- Código: `22P02`
- Mensagem: `invalid input syntax for type integer: "null"`
- Ocorre quando `buscarGestoresPorObra` recebe a string `"null"` ao invés de um valor numérico ou `null` real

**Causa Raiz:**
- Registros de ponto com `funcionario.obra_atual_id` como `null`
- Valor `null` convertido para string `"null"` em queries SQL
- Query tenta fazer `.eq('obra_atual_id', "null")`, causando erro de tipo

**Impacto:**
- Registros de funcionários sem obra atribuída não conseguem gerar lembretes
- Logs de erro poluem o console
- Sistema de notificações falha silenciosamente

---

### 2. Erro 23503 - Foreign Key Constraint Violation

**Status:** ❌ **NÃO RESOLVIDO**

**Descrição:**
- Código: `23503`
- Mensagem: `insert or update on table "notificacoes" violates foreign key constraint "notificacoes_usuario_id_fkey"`
- Ocorre quando tenta inserir notificação com `usuario_id` que não existe na tabela `usuarios`

**Causa Raiz:**
- `buscarGestoresPorObra` retorna gestores da tabela `funcionarios` com IDs de funcionário
- `criarNotificacaoLembrete` usa `gestor.id` diretamente como `usuario_id`
- `gestor.id` é ID de `funcionarios`, não de `usuarios`
- Se funcionário não tiver `user_id` correspondente, inserção falha

**Impacto:**
- Notificações não são criadas para gestores sem usuário correspondente
- Sistema de lembretes falha para esses casos
- Gestores não recebem notificações importantes

---

## ✅ Soluções Propostas vs Implementação

### Solução 1: Validar obra_atual_id antes de buscar gestores

**Status:** ❌ **NÃO IMPLEMENTADO**

**Arquivo:** `backend-api/src/utils/notificacoes.js`

**Código Proposto:**
```javascript
// VALIDAÇÃO: Verificar se o funcionário tem obra_atual_id válido
const obraId = registro.funcionario?.obra_atual_id;

if (!obraId || obraId === null || obraId === 'null') {
  console.warn(`Registro ${registro.id}: Funcionário sem obra atribuída, pulando...`);
  continue; // Pular este registro
}
```

**Código Atual (linha 236-244):**
```javascript
for (const registro of registrosPendentes) {
  try {
    // Buscar gestores da obra do funcionário
    const gestores = await buscarGestoresPorObra(registro.funcionario.obra_atual_id);
    
    // Enviar lembrete para cada gestor
    for (const gestor of gestores) {
      await criarNotificacaoLembrete(registro, gestor);
    }
  } catch (error) {
    console.error(`Erro ao processar registro ${registro.id}:`, error);
    // Continuar com os próximos registros mesmo se um falhar
  }
}
```

**Análise:**
- ❌ Não há validação de `obra_atual_id` antes de chamar `buscarGestoresPorObra`
- ❌ Não verifica se `obra_atual_id` é `null` ou string `"null"`
- ❌ Não pula registros sem obra atribuída
- ⚠️ Tem try-catch que captura o erro, mas não previne o erro

**Impacto:** ❌ Alto - Erro 22P02 ainda ocorre

---

### Solução 2: Validar obraId na função buscarGestoresPorObra

**Status:** ❌ **NÃO IMPLEMENTADO**

**Arquivo:** `backend-api/src/utils/notificacoes.js`

**Código Proposto:**
```javascript
// VALIDAÇÃO: Verificar se obraId é válido
if (!obraId || obraId === null || obraId === 'null' || isNaN(obraId)) {
  console.warn(`[buscarGestoresPorObra] obraId inválido: ${obraId}`);
  return [];
}

// Converter para número se necessário
const obraIdNumero = parseInt(obraId, 10);

if (isNaN(obraIdNumero)) {
  console.warn(`[buscarGestoresPorObra] Não foi possível converter obraId para número: ${obraId}`);
  return [];
}
```

**Código Atual (linha 199-218):**
```javascript
export async function buscarGestoresPorObra(obraId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, email')
      .eq('obra_atual_id', obraId)
      .eq('status', 'Ativo')
      .in('cargo', ['Supervisor', 'Técnico Manutenção', 'Gerente', 'Coordenador']);

    if (error) {
      console.error('Erro ao buscar gestores por obra:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro na função buscarGestoresPorObra:', error);
    throw error;
  }
}
```

**Análise:**
- ❌ Não há validação de `obraId` antes de usar na query
- ❌ Não verifica se `obraId` é `null`, `'null'`, ou `NaN`
- ❌ Não converte para número
- ❌ Usa `obraId` diretamente em `.eq('obra_atual_id', obraId)` sem validação

**Impacto:** ❌ Alto - Erro 22P02 ainda ocorre

---

### Solução 3: Usar user_id ao invés de id do funcionário

**Status:** ❌ **NÃO IMPLEMENTADO**

**Arquivo:** `backend-api/src/utils/notificacoes.js`

**Código Proposto:**
```javascript
// VALIDAÇÃO: Verificar se o gestor tem user_id válido
const usuarioId = gestor.user_id || gestor.id;

if (!usuarioId) {
  console.warn(`[criarNotificacaoLembrete] Gestor ${gestor.nome} (ID: ${gestor.id}) não possui user_id válido`);
  return; // Não criar notificação se não houver user_id
}

// Verificar se o usuário existe na tabela usuarios
const { data: usuario, error: usuarioError } = await supabaseAdmin
  .from('usuarios')
  .select('id')
  .eq('id', usuarioId)
  .single();

if (usuarioError || !usuario) {
  console.warn(`[criarNotificacaoLembrete] Usuário ${usuarioId} não encontrado na tabela usuarios`);
  return; // Não criar notificação se o usuário não existir
}
```

**Código Atual (linha 131-162):**
```javascript
export async function criarNotificacaoLembrete(registro, gestor) {
  try {
    const titulo = 'Lembrete: Aprovação Pendente';
    const mensagem = `Lembrete: ${registro.funcionario.nome} ainda tem ${registro.horas_extras}h extras aguardando aprovação há mais de 1 dia`;
    const link = `/pwa/aprovacoes/${registro.id}`;

    const { error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: gestor.id,  // ❌ Usa gestor.id diretamente (ID de funcionario)
        tipo: 'info',
        titulo,
        mensagem,
        link,
        lida: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao criar notificação de lembrete:', error);
      throw error;
    }

    console.log(`Notificação de lembrete criada para gestor ${gestor.nome}`);
    
    // Enviar via WhatsApp
    await enviarNotificacaoWhatsApp(gestor.id, titulo, mensagem, link);
  } catch (error) {
    console.error('Erro na função criarNotificacaoLembrete:', error);
    throw error;
  }
}
```

**Análise:**
- ❌ Usa `gestor.id` diretamente como `usuario_id` (linha 140)
- ❌ Não verifica se `gestor.user_id` existe
- ❌ Não valida se o usuário existe na tabela `usuarios`
- ❌ Não retorna silenciosamente se não houver `user_id` válido
- ❌ `buscarGestoresPorObra` não retorna `user_id` no select (linha 203)

**Impacto:** ❌ Alto - Erro 23503 ainda ocorre

---

### Solução 4: Melhorar a query de busca de registros

**Status:** ❌ **NÃO IMPLEMENTADO**

**Arquivo:** `backend-api/src/utils/notificacoes.js`

**Código Proposto:**
```javascript
.select(`
  *,
  funcionario:funcionarios!fk_registros_ponto_funcionario(
    nome, 
    cargo, 
    obra_atual_id,
    user_id
  )
`)
.eq('status', 'Pendente Aprovação')
.lt('created_at', umDiaAtras.toISOString())
.not('funcionarios.obra_atual_id', 'is', null); // Filtrar apenas registros com obra
```

**Código Atual (linha 168-192):**
```javascript
export async function buscarRegistrosPendentesAntigos() {
  try {
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);

    const { data, error } = await supabaseAdmin
      .from('registros_ponto')
      .select(`
        *,
        funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, obra_atual_id)
      `)
      .eq('status', 'Pendente Aprovação')
      .lt('created_at', umDiaAtras.toISOString());

    if (error) {
      console.error('Erro ao buscar registros pendentes antigos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro na função buscarRegistrosPendentesAntigos:', error);
    throw error;
  }
}
```

**Análise:**
- ❌ Não inclui `user_id` no select (linha 177)
- ❌ Não filtra registros sem obra (não tem `.not('funcionarios.obra_atual_id', 'is', null)`)
- ❌ Retorna registros com `obra_atual_id` null, que causam erro posterior

**Impacto:** ❌ Médio - Contribui para o erro 22P02

---

## 📊 Comparação: Soluções Propostas vs Implementação

| Solução | Proposta | Implementada | Status |
|---------|----------|--------------|--------|
| **Solução 1: Validar obra_atual_id** | ✅ Sim | ❌ Não | ❌ Pendente |
| **Solução 2: Validar obraId em buscarGestoresPorObra** | ✅ Sim | ❌ Não | ❌ Pendente |
| **Solução 3: Usar user_id validado** | ✅ Sim | ❌ Não | ❌ Pendente |
| **Solução 4: Filtrar registros sem obra** | ✅ Sim | ❌ Não | ❌ Pendente |

**Taxa de Implementação:** 0% (0 de 4 soluções implementadas)

---

## 🔍 Análise Detalhada do Código Atual

### Função: `enviarLembretesAprovacao()`

**Localização:** `backend-api/src/utils/notificacoes.js` (linhas 223-256)

**Problemas Identificados:**
1. ❌ Linha 239: Chama `buscarGestoresPorObra(registro.funcionario.obra_atual_id)` sem validação
2. ❌ Não verifica se `obra_atual_id` é `null` ou string `"null"`
3. ❌ Não pula registros sem obra atribuída
4. ⚠️ Tem try-catch que captura erro, mas não previne

**Código Problemático:**
```javascript
// Linha 239 - PROBLEMA: obra_atual_id pode ser null ou "null"
const gestores = await buscarGestoresPorObra(registro.funcionario.obra_atual_id);
```

---

### Função: `buscarGestoresPorObra(obraId)`

**Localização:** `backend-api/src/utils/notificacoes.js` (linhas 199-218)

**Problemas Identificados:**
1. ❌ Linha 204: Usa `obraId` diretamente em `.eq('obra_atual_id', obraId)` sem validação
2. ❌ Não verifica se `obraId` é `null`, `'null'`, ou `NaN`
3. ❌ Não converte para número
4. ❌ Linha 203: Não retorna `user_id` no select (necessário para Solução 3)

**Código Problemático:**
```javascript
// Linha 204 - PROBLEMA: obraId pode ser null ou "null"
.eq('obra_atual_id', obraId)

// Linha 203 - PROBLEMA: Não retorna user_id
.select('id, nome, cargo, email')
```

---

### Função: `criarNotificacaoLembrete(registro, gestor)`

**Localização:** `backend-api/src/utils/notificacoes.js` (linhas 131-162)

**Problemas Identificados:**
1. ❌ Linha 140: Usa `gestor.id` diretamente como `usuario_id` (ID de funcionario, não de usuario)
2. ❌ Não verifica se `gestor.user_id` existe
3. ❌ Não valida se o usuário existe na tabela `usuarios`
4. ❌ Não retorna silenciosamente se não houver `user_id` válido
5. ❌ Linha 157: Também usa `gestor.id` para WhatsApp

**Código Problemático:**
```javascript
// Linha 140 - PROBLEMA: gestor.id é ID de funcionario, não de usuario
usuario_id: gestor.id,

// Linha 157 - PROBLEMA: Também usa gestor.id para WhatsApp
await enviarNotificacaoWhatsApp(gestor.id, titulo, mensagem, link);
```

---

### Função: `buscarRegistrosPendentesAntigos()`

**Localização:** `backend-api/src/utils/notificacoes.js` (linhas 168-192)

**Problemas Identificados:**
1. ❌ Linha 177: Não inclui `user_id` no select (necessário para validação)
2. ❌ Não filtra registros sem obra (não tem `.not('funcionarios.obra_atual_id', 'is', null)`)
3. ❌ Retorna registros com `obra_atual_id` null, que causam erro posterior

**Código Problemático:**
```javascript
// Linha 177 - PROBLEMA: Não inclui user_id e não filtra null
.select(`
  *,
  funcionario:funcionarios!fk_registros_ponto_funcionario(nome, cargo, obra_atual_id)
`)
// FALTA: .not('funcionarios.obra_atual_id', 'is', null)
```

---

## 🛡️ Prevenção de Erros Futuros

### Status de Implementação

| Item | Status | Observações |
|------|--------|-------------|
| **Validação de Dados** | ❌ Não implementado | Validações propostas não foram implementadas |
| **Tratamento de Erros** | ⚠️ Parcial | Try-catch existe mas não previne erros |
| **Testes** | ❌ Não implementado | Não há testes específicos para esses erros |
| **Monitoramento** | ❌ Não implementado | Não há alertas para erros recorrentes |

---

## 📊 Resumo dos Erros (Atualizado)

| Erro | Código | Frequência | Severidade | Status | Solução Implementada |
|------|--------|------------|------------|--------|---------------------|
| Invalid input syntax for integer | 22P02 | Alta | Média | ❌ **Ainda ocorre** | ❌ Não |
| Foreign key constraint violation | 23503 | Média | Alta | ❌ **Ainda ocorre** | ❌ Não |

---

## 🔧 Checklist de Implementação

### Solução 1: Validar obra_atual_id
- [ ] Adicionar validação de `obra_atual_id` em `enviarLembretesAprovacao`
- [ ] Verificar se `obra_atual_id` é `null` ou string `"null"`
- [ ] Pular registros sem obra atribuída com log informativo

### Solução 2: Validar obraId
- [ ] Adicionar validação de `obraId` em `buscarGestoresPorObra`
- [ ] Verificar se `obraId` é `null`, `'null'`, ou `NaN`
- [ ] Converter para número se necessário
- [ ] Retornar array vazio se inválido

### Solução 3: Usar user_id validado
- [ ] Modificar `buscarGestoresPorObra` para retornar `user_id` no select
- [ ] Modificar `criarNotificacaoLembrete` para usar `gestor.user_id`
- [ ] Validar se `user_id` existe antes de criar notificação
- [ ] Verificar se usuário existe na tabela `usuarios`
- [ ] Retornar silenciosamente se não houver `user_id` válido

### Solução 4: Filtrar registros sem obra
- [ ] Adicionar `user_id` no select de `buscarRegistrosPendentesAntigos`
- [ ] Adicionar filtro `.not('funcionarios.obra_atual_id', 'is', null)`
- [ ] Garantir que apenas registros com obra sejam retornados

### Testes e Monitoramento
- [ ] Adicionar logs informativos para casos ignorados
- [ ] Testar com dados reais após implementação
- [ ] Monitorar logs por 24-48h após deploy
- [ ] Criar testes unitários para funções críticas
- [ ] Testar casos edge (valores null, undefined, strings inválidas)

---

## 📝 Notas Técnicas

### Relação entre Funcionários e Usuários

**Estrutura Atual:**
- Um `funcionario` pode ter um `user_id` que referencia a tabela `usuarios`
- Nem todos os funcionários têm um usuário correspondente
- A tabela `notificacoes` requer que `usuario_id` exista na tabela `usuarios`
- Quando criar notificações para funcionários, sempre verificar se existe `user_id` válido

**Problema Identificado:**
- `buscarGestoresPorObra` não retorna `user_id` no select
- `criarNotificacaoLembrete` usa `gestor.id` (ID de funcionario) como `usuario_id`
- Isso causa erro de foreign key quando funcionário não tem usuário correspondente

---

## 🎯 Próximos Passos Recomendados

### Prioridade CRÍTICA

1. **Implementar Solução 2: Validar obraId**
   - Adicionar validação em `buscarGestoresPorObra`
   - Previne erro 22P02
   - Impacto: Alto, esforço: Baixo

2. **Implementar Solução 1: Validar obra_atual_id**
   - Adicionar validação em `enviarLembretesAprovacao`
   - Previne erro 22P02
   - Impacto: Alto, esforço: Baixo

3. **Implementar Solução 3: Usar user_id validado**
   - Modificar `buscarGestoresPorObra` para retornar `user_id`
   - Modificar `criarNotificacaoLembrete` para validar `user_id`
   - Previne erro 23503
   - Impacto: Alto, esforço: Médio

### Prioridade ALTA

4. **Implementar Solução 4: Filtrar registros sem obra**
   - Melhorar query de `buscarRegistrosPendentesAntigos`
   - Previne erro 22P02 na origem
   - Impacto: Médio, esforço: Baixo

5. **Adicionar Testes**
   - Testes unitários para funções críticas
   - Testar casos edge (null, undefined, strings inválidas)
   - Impacto: Médio, esforço: Médio

### Prioridade MÉDIA

6. **Melhorar Logs**
   - Adicionar logs informativos para casos ignorados
   - Facilitar debug e monitoramento
   - Impacto: Médio, esforço: Baixo

7. **Implementar Monitoramento**
   - Alertas para erros recorrentes
   - Monitorar taxa de sucesso de criação de notificações
   - Impacto: Médio, esforço: Médio

---

## ✅ Conclusão

**Status Geral:** ❌ **0% RESOLVIDO**

Nenhuma das soluções propostas no README foi implementada. Os erros 22P02 e 23503 ainda ocorrem no código atual.

**Pontos Críticos:**
- ❌ Validação de `obra_atual_id` não implementada
- ❌ Validação de `obraId` não implementada
- ❌ Uso de `user_id` validado não implementado
- ❌ Filtro de registros sem obra não implementado

**Impacto:**
- ❌ Erros ainda ocorrem em produção
- ❌ Sistema de notificações falha silenciosamente
- ❌ Gestores não recebem notificações importantes
- ❌ Logs de erro poluem o console

**Recomendação:**
Implementar todas as 4 soluções propostas com prioridade CRÍTICA para corrigir os erros e melhorar a confiabilidade do sistema de notificações.

---

**Última Atualização:** 2025-02-02  
**Próxima Revisão:** Após implementação das soluções

