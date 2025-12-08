# 📚 Contexto do Projeto para IA

Este documento explica como passar o contexto completo do projeto para a IA, permitindo que ela tenha conhecimento detalhado sobre o sistema e possa responder dúvidas técnicas e funcionais com precisão.

## 🎯 Objetivo

O sistema de contexto permite que a IA:
- ✅ Conheça todos os endpoints da API
- ✅ Entenda a estrutura de páginas do frontend
- ✅ Saiba quais componentes existem
- ✅ Responda perguntas técnicas sobre o código
- ✅ Oriente usuários sobre funcionalidades específicas
- ✅ Explique fluxos e processos do sistema

## 🚀 Como Funciona

### 1. Geração do Contexto

O script `gerar-contexto-ia.js` analisa automaticamente:
- **Rotas da API**: Extrai todos os endpoints (GET, POST, PUT, DELETE, PATCH) e suas descrições
- **Páginas do Frontend**: Identifica todas as páginas e suas rotas
- **Componentes**: Lista os componentes principais do sistema
- **Módulos**: Organiza tudo por módulos (Obras, Gruas, RH, etc.)

### 2. Arquivos Gerados

O script gera dois arquivos:

1. **`src/config/contexto-ia.json`**: Contexto estruturado em JSON (para referência)
2. **`src/config/contexto-ia-prompt.txt`**: Prompt formatado para incluir no SYSTEM_PROMPT

### 3. Uso Automático

O arquivo `chat-ia.js` carrega automaticamente o contexto ao iniciar o servidor e o inclui no SYSTEM_PROMPT enviado para a IA.

## 📋 Passo a Passo

### Passo 1: Instalar Dependência

```bash
cd backend-api
npm install
```

A dependência `glob` será instalada automaticamente.

### Passo 2: Gerar o Contexto

Execute o script de geração:

```bash
npm run gerar-contexto-ia
```

Você verá uma saída como:

```
🚀 Iniciando geração de contexto para IA...

🔍 Analisando rotas da API...
🔍 Analisando páginas do frontend...
🔍 Analisando componentes...
✅ Contexto JSON salvo em: backend-api/src/config/contexto-ia.json
✅ Prompt formatado salvo em: backend-api/src/config/contexto-ia-prompt.txt

📊 Estatísticas:
   - Rotas encontradas: 150+
   - Páginas encontradas: 80+
   - Componentes encontrados: 150+
   - Módulos: 10

✨ Contexto gerado com sucesso!
```

### Passo 3: Reiniciar o Servidor

Após gerar o contexto, reinicie o servidor backend:

```bash
npm run dev
```

O servidor carregará automaticamente o contexto e a IA terá acesso a todas as informações.

### Passo 4: Testar

Faça uma pergunta técnica para a IA:

- "Quais endpoints existem para gerenciar obras?"
- "Como funciona o cadastro de gruas no sistema?"
- "Quais são as rotas da API de RH?"
- "Explique o fluxo de aprovação de horas extras"

## 🔄 Atualização do Contexto

### Quando Atualizar

Atualize o contexto sempre que:
- ✅ Adicionar novas rotas na API
- ✅ Criar novas páginas no frontend
- ✅ Adicionar novos componentes principais
- ✅ Modificar estrutura de módulos
- ✅ Fazer mudanças significativas no sistema

### Como Atualizar

Simplesmente execute novamente:

```bash
npm run gerar-contexto-ia
```

E reinicie o servidor. O contexto será atualizado automaticamente.

## 📊 Estrutura do Contexto

O contexto gerado inclui:

### Informações Gerais
- Nome e descrição do sistema
- Stack tecnológico (Frontend, Backend, Banco de Dados, etc.)

### Módulos Detalhados
Para cada módulo (Obras, Gruas, RH, etc.):
- Descrição do módulo
- Lista de endpoints da API com métodos HTTP
- Descrições dos endpoints
- Páginas do frontend relacionadas

### Estatísticas
- Total de rotas
- Total de páginas
- Total de componentes
- Número de módulos

## 🎨 Exemplo de Uso

### Antes (sem contexto)
**Usuário**: "Como cadastrar uma obra?"
**IA**: "Para cadastrar uma obra, você pode usar o módulo de Obras do sistema..."

### Depois (com contexto)
**Usuário**: "Como cadastrar uma obra?"
**IA**: "Para cadastrar uma obra, você pode usar o endpoint `POST /api/obras` que aceita os seguintes campos: nome, cliente_id, endereco, cidade, estado, tipo, etc. A página correspondente está em `/dashboard/obras/nova`. O sistema valida os dados usando Joi e armazena no banco PostgreSQL..."

## 🔍 Verificação

Para verificar se o contexto foi carregado corretamente, verifique os logs do servidor:

```
✅ [Chat IA] Contexto do sistema carregado com sucesso
```

Se aparecer:

```
⚠️ [Chat IA] Arquivo de contexto não encontrado. Execute: npm run gerar-contexto-ia
```

Execute o script de geração novamente.

## 🛠️ Troubleshooting

### Erro: "glob is not defined"

**Solução**: Instale a dependência:
```bash
npm install glob
```

### Erro: "Cannot find module"

**Solução**: Certifique-se de estar no diretório `backend-api` ao executar o script.

### Contexto não está sendo carregado

**Solução**:
1. Verifique se os arquivos foram gerados em `backend-api/src/config/`
2. Reinicie o servidor
3. Verifique os logs do servidor

### Contexto desatualizado

**Solução**: Execute `npm run gerar-contexto-ia` novamente e reinicie o servidor.

## 📝 Notas Importantes

1. **Tamanho do Prompt**: O contexto pode aumentar significativamente o tamanho do prompt. O Google Gemini tem limites de tokens, mas o contexto gerado é otimizado para ser conciso.

2. **Performance**: O contexto é carregado uma vez ao iniciar o servidor, não impacta a performance das requisições.

3. **Privacidade**: O contexto contém apenas informações sobre a estrutura do código, não dados sensíveis ou informações de usuários.

4. **Atualização Automática**: Considere adicionar o script ao CI/CD para atualizar o contexto automaticamente após mudanças no código.

## 🚀 Próximos Passos

Após configurar o contexto, a IA poderá:
- ✅ Responder perguntas técnicas sobre o código
- ✅ Explicar como usar funcionalidades específicas
- ✅ Orientar sobre APIs e endpoints
- ✅ Ajudar desenvolvedores a entender o sistema
- ✅ Fornecer informações detalhadas sobre módulos

## 📚 Referências

- [Documentação do Chat IA](./CHAT-IA-CONFIGURACAO.md)
- [Guia Rápido](./CHAT-IA-USO-RAPIDO.md)
- [Troubleshooting](./CHAT-IA-TROUBLESHOOTING.md)

---

**Última atualização**: 2025-01-26
**Versão**: 1.0.0
