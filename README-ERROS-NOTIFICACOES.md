# README - Erros de Notificações e Aprovações

Este documento descreve os erros encontrados no sistema de notificações e aprovações de horas extras, suas causas e soluções.

## 📋 Índice

1. [Erro 22P02 - Invalid Input Syntax for Type Integer](#erro-22p02)
2. [Erro 23503 - Foreign Key Constraint Violation](#erro-23503)
3. [Soluções Propostas](#soluções-propostas)
4. [Prevenção de Erros Futuros](#prevenção)

---

## 🔴 Erro 22P02 - Invalid Input Syntax for Type Integer

### Descrição
```
code: '22P02'
message: 'invalid input syntax for type integer: "null"'
```

### Onde Ocorre
- Função: `buscarGestoresPorObra(obraId)` em `backend-api/src/utils/notificacoes.js`
- Contexto: Processamento de lembretes de aprovação de horas extras

### Causa Raiz
O erro ocorre quando a função `buscarGestoresPorObra` recebe a **string "null"** ao invés de um valor numérico ou `null` real. Isso acontece porque:

1. Alguns registros de ponto têm `funcionario.obra_atual_id` como `null` (funcionário sem obra atribuída)
2. Quando esse valor `null` é passado para a query SQL do Supabase, ele é convertido para a string `"null"` em vez de ser tratado como valor SQL `NULL`
3. A query tenta fazer `.eq('obra_atual_id', "null")`, o que causa o erro de tipo

### Código Problemático
```javascript
// backend-api/src/utils/notificacoes.js - linha 178
const gestores = await buscarGestoresPorObra(registro.funcionario.obra_atual_id);
```

```javascript
// backend-api/src/utils/notificacoes.js - linha 143
.eq('obra_atual_id', obraId)  // Se obraId for a string "null", causa erro
```

### Impacto
- Registros de funcionários sem obra atribuída não conseguem gerar lembretes
- Logs de erro poluem o console
- Sistema de notificações falha silenciosamente para esses casos

---

## 🔴 Erro 23503 - Foreign Key Constraint Violation

### Descrição
```
code: '23503'
message: 'insert or update on table "notificacoes" violates foreign key constraint "notificacoes_usuario_id_fkey"'
details: 'Key (usuario_id)=(4) is not present in table "usuarios".'
```

### Onde Ocorre
- Função: `criarNotificacaoLembrete(registro, gestor)` em `backend-api/src/utils/notificacoes.js`
- Contexto: Criação de notificações de lembrete para gestores

### Causa Raiz
O erro ocorre porque:

1. A função `buscarGestoresPorObra` retorna gestores da tabela `funcionarios` com seus IDs de funcionário
2. A função `criarNotificacaoLembrete` tenta inserir uma notificação usando `gestor.id` diretamente como `usuario_id`
3. Porém, `gestor.id` é um ID da tabela `funcionarios`, não da tabela `usuarios`
4. A tabela `notificacoes` tem uma constraint de chave estrangeira que exige que `usuario_id` exista na tabela `usuarios`
5. Se o funcionário não tiver um `user_id` correspondente na tabela `usuarios`, ou se o `user_id` for diferente do `id` do funcionário, a inserção falha

### Código Problemático
```javascript
// backend-api/src/utils/notificacoes.js - linha 82
usuario_id: gestor.id,  // gestor.id é um ID de funcionario, não de usuario
```

### Impacto
- Notificações não são criadas para gestores que são funcionários sem usuário correspondente
- Sistema de lembretes falha para esses casos
- Gestores não recebem notificações importantes

---

## ✅ Soluções Propostas

### Solução 1: Validar obra_atual_id antes de buscar gestores

**Arquivo**: `backend-api/src/utils/notificacoes.js`

```javascript
// Modificar a função enviarLembretesAprovacao
export async function enviarLembretesAprovacao() {
  try {
    console.log('Iniciando envio de lembretes de aprovação...');
    
    const registrosPendentes = await buscarRegistrosPendentesAntigos();
    
    if (registrosPendentes.length === 0) {
      console.log('Nenhum registro pendente antigo encontrado');
      return;
    }

    console.log(`Encontrados ${registrosPendentes.length} registros pendentes antigos`);

    for (const registro of registrosPendentes) {
      try {
        // VALIDAÇÃO: Verificar se o funcionário tem obra_atual_id válido
        const obraId = registro.funcionario?.obra_atual_id;
        
        if (!obraId || obraId === null || obraId === 'null') {
          console.warn(`Registro ${registro.id}: Funcionário sem obra atribuída, pulando...`);
          continue; // Pular este registro
        }

        // Buscar gestores da obra do funcionário
        const gestores = await buscarGestoresPorObra(obraId);
        
        if (!gestores || gestores.length === 0) {
          console.warn(`Registro ${registro.id}: Nenhum gestor encontrado para a obra ${obraId}`);
          continue;
        }

        // Enviar lembrete para cada gestor
        for (const gestor of gestores) {
          await criarNotificacaoLembrete(registro, gestor);
        }
      } catch (error) {
        console.error(`Erro ao processar registro ${registro.id}:`, error);
        // Continuar com os próximos registros mesmo se um falhar
      }
    }

    console.log('Envio de lembretes concluído');
  } catch (error) {
    console.error('Erro na função enviarLembretesAprovacao:', error);
    throw error;
  }
}
```

### Solução 2: Validar obraId na função buscarGestoresPorObra

**Arquivo**: `backend-api/src/utils/notificacoes.js`

```javascript
export async function buscarGestoresPorObra(obraId) {
  try {
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

    const { data, error } = await supabaseAdmin
      .from('funcionarios')
      .select('id, nome, cargo, email, user_id')
      .eq('obra_atual_id', obraIdNumero)
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

### Solução 3: Usar user_id ao invés de id do funcionário

**Arquivo**: `backend-api/src/utils/notificacoes.js`

```javascript
export async function criarNotificacaoLembrete(registro, gestor) {
  try {
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

    const { error } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        usuario_id: usuarioId, // Usar user_id validado
        tipo: 'info',
        titulo: 'Lembrete: Aprovação Pendente',
        mensagem: `Lembrete: ${registro.funcionario.nome} ainda tem ${registro.horas_extras}h extras aguardando aprovação há mais de 1 dia`,
        link: `/pwa/aprovacoes/${registro.id}`,
        lida: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao criar notificação de lembrete:', error);
      throw error;
    }

    console.log(`Notificação de lembrete criada para gestor ${gestor.nome}`);
  } catch (error) {
    console.error('Erro na função criarNotificacaoLembrete:', error);
    throw error;
  }
}
```

### Solução 4: Melhorar a query de busca de registros

**Arquivo**: `backend-api/src/utils/notificacoes.js`

```javascript
export async function buscarRegistrosPendentesAntigos() {
  try {
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);

    const { data, error } = await supabaseAdmin
      .from('registros_ponto')
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

---

## 🛡️ Prevenção de Erros Futuros

### 1. Validação de Dados
- Sempre validar valores `null` e `undefined` antes de usar em queries SQL
- Converter strings para números quando necessário
- Verificar existência de registros relacionados antes de criar foreign keys

### 2. Tratamento de Erros
- Implementar try-catch adequado em todas as funções assíncronas
- Logar erros com contexto suficiente para debug
- Continuar processamento mesmo quando alguns registros falharem

### 3. Testes
- Criar testes unitários para funções críticas
- Testar casos edge (valores null, undefined, strings inválidas)
- Testar integridade de foreign keys

### 4. Monitoramento
- Implementar alertas para erros recorrentes
- Monitorar taxa de sucesso de criação de notificações
- Rastrear registros que falham consistentemente

---

## 📊 Resumo dos Erros

| Erro | Código | Frequência | Severidade | Status |
|------|--------|------------|------------|--------|
| Invalid input syntax for integer | 22P02 | Alta | Média | ⚠️ Requer correção |
| Foreign key constraint violation | 23503 | Média | Alta | ⚠️ Requer correção |

---

## 🔧 Checklist de Implementação

- [ ] Adicionar validação de `obra_atual_id` em `enviarLembretesAprovacao`
- [ ] Adicionar validação de `obraId` em `buscarGestoresPorObra`
- [ ] Modificar `criarNotificacaoLembrete` para usar `user_id` validado
- [ ] Melhorar query de `buscarRegistrosPendentesAntigos` para filtrar registros sem obra
- [ ] Adicionar logs informativos para casos ignorados
- [ ] Testar com dados reais após implementação
- [ ] Monitorar logs por 24-48h após deploy

---

## 📝 Notas Adicionais

### Relação entre Funcionários e Usuários
- Um `funcionario` pode ter um `user_id` que referencia a tabela `usuarios`
- Nem todos os funcionários têm um usuário correspondente
- A tabela `notificacoes` requer que `usuario_id` exista na tabela `usuarios`
- Quando criar notificações para funcionários, sempre verificar se existe `user_id` válido

### Estrutura de Dados Esperada
```javascript
// Gestor retornado por buscarGestoresPorObra
{
  id: 123,              // ID do funcionário
  nome: "João Silva",
  cargo: "Supervisor",
  email: "joao@email.com",
  user_id: 4            // ID do usuário (pode ser null)
}

// Registro de ponto
{
  id: "REG703519B55F1",
  funcionario: {
    nome: "Maria",
    obra_atual_id: 5,    // Pode ser null
    user_id: 2           // Pode ser null
  }
}
```

---

**Última atualização**: 19/11/2025
**Autor**: Sistema de Documentação
**Versão**: 1.0

