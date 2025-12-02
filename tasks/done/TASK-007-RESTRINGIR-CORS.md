# 📋 TASK-007: Restringir CORS para Produção

**ID da Task:** TASK-007  
**Título:** Configurar CORS Restritivo para Ambiente de Produção  
**Fase:** 2  
**Módulo:** Segurança - Backend  
**Arquivo(s):** 
- `backend-api/src/server.js` (linha 139)
- `backend-api/.env.example`
- `backend-api/.env` (não commitado)

**Status:** ⏭️ Não Iniciado  
**Prioridade:** 🟡 MÉDIA  
**Responsável:** -  
**Data Início:** -  
**Data Fim Prevista:** -  
**Data Fim Real:** -

---

## 📝 Descrição

Restringir configuração de CORS no backend para permitir apenas origens específicas em produção. Atualmente, o CORS está configurado de forma permissiva, aceitando qualquer origem (`origin || '*'`), o que é um risco de segurança em produção.

A configuração deve:
- Permitir apenas origens configuradas via variável de ambiente
- Manter comportamento permissivo em desenvolvimento
- Validar origem antes de permitir requisições

---

## 🎯 Objetivos

- [ ] Configurar CORS para usar variável de ambiente
- [ ] Criar lista de origens permitidas
- [ ] Validar origem antes de permitir requisições
- [ ] Manter comportamento permissivo em desenvolvimento
- [ ] Documentar configuração
- [ ] Atualizar `.env.example`

---

## 📋 Situação Atual

### Configuração Atual

O arquivo `backend-api/src/server.js` (linha 139) contém:
```javascript
res.header('Access-Control-Allow-Origin', origin || '*')
```

**Problema:** Permite qualquer origem em produção, o que é um risco de segurança.

### Integrações Existentes

- ✅ CORS está configurado manualmente
- ✅ Headers CORS estão sendo enviados
- ⚠️ Configuração muito permissiva
- ⚠️ Não usa variável de ambiente

---

## 🔧 Ações Necessárias

### Backend

- [ ] Atualizar `backend-api/src/server.js` (linha 139):
  ```javascript
  // Configurar origens permitidas
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || []
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  // Em desenvolvimento, permitir localhost
  const devOrigins = ['http://localhost:3000', 'http://localhost:3001']
  
  // Determinar origem permitida
  let allowedOrigin = null
  if (isDevelopment) {
    // Em desenvolvimento, permitir localhost ou origem na lista
    if (origin && (devOrigins.includes(origin) || allowedOrigins.includes(origin))) {
      allowedOrigin = origin
    } else if (!origin) {
      // Se não há origin (ex: Postman), permitir em dev
      allowedOrigin = '*'
    }
  } else {
    // Em produção, apenas origens na lista
    if (origin && allowedOrigins.includes(origin)) {
      allowedOrigin = origin
    }
  }
  
  if (allowedOrigin) {
    res.header('Access-Control-Allow-Origin', allowedOrigin)
  }
  // Se não permitir, não enviar header (browser bloqueará)
  ```

- [ ] Adicionar validação mais robusta:
  - Validar formato de URL
  - Logar tentativas de acesso de origens não permitidas
  - Retornar erro 403 para origens não permitidas em produção

- [ ] Adicionar variável de ambiente:
  - `CORS_ORIGINS`: Lista de origens permitidas separadas por vírgula
  - Exemplo: `https://app.exemplo.com,https://www.exemplo.com`

- [ ] Atualizar `.env.example`:
  ```env
  # CORS - Origens permitidas (separadas por vírgula)
  CORS_ORIGINS=https://app.exemplo.com,https://www.exemplo.com
  ```

- [ ] Adicionar documentação sobre configuração

### Documentação

- [ ] Documentar no README:
  - Como configurar CORS
  - Exemplos de configuração
  - Comportamento em dev vs produção

---

## 🔌 Configuração

### Variável de Ambiente

```env
# Desenvolvimento (opcional, localhost é permitido automaticamente)
CORS_ORIGINS=http://localhost:3000

# Produção (obrigatório)
CORS_ORIGINS=https://app.exemplo.com,https://www.exemplo.com
```

### Comportamento

- **Desenvolvimento:** Permite localhost automaticamente + origens na lista
- **Produção:** Apenas origens na lista `CORS_ORIGINS`

---

## ✅ Critérios de Aceitação

- [ ] CORS restrito para produção
- [ ] Variável de ambiente `CORS_ORIGINS` configurada
- [ ] Comportamento permissivo mantido em desenvolvimento
- [ ] Origem validada antes de permitir requisições
- [ ] Tentativas de acesso não permitidas são logadas
- [ ] `.env.example` atualizado
- [ ] Documentação atualizada
- [ ] Testes em desenvolvimento funcionando
- [ ] Testes em produção funcionando apenas com origens permitidas

---

## 🧪 Casos de Teste

### Teste 1: Desenvolvimento - Localhost Permitido
**Dado:** Ambiente de desenvolvimento  
**Quando:** Requisição de `http://localhost:3000`  
**Então:** Deve permitir requisição

### Teste 2: Produção - Origem Permitida
**Dado:** Ambiente de produção com `CORS_ORIGINS=https://app.exemplo.com`  
**Quando:** Requisição de `https://app.exemplo.com`  
**Então:** Deve permitir requisição

### Teste 3: Produção - Origem Não Permitida
**Dado:** Ambiente de produção com `CORS_ORIGINS=https://app.exemplo.com`  
**Quando:** Requisição de `https://malicioso.com`  
**Então:** Não deve permitir requisição (sem header CORS)

### Teste 4: Produção - Múltiplas Origens
**Dado:** Ambiente de produção com múltiplas origens na lista  
**Quando:** Requisição de qualquer origem na lista  
**Então:** Deve permitir requisição

### Teste 5: Log de Tentativas Não Permitidas
**Dado:** Ambiente de produção  
**Quando:** Tentativa de acesso de origem não permitida  
**Então:** Deve logar tentativa

---

## 🔗 Dependências

### Bloqueada por:
- Nenhuma (pode ser executada independentemente)

### Bloqueia:
- Nenhuma (pode ser executada em paralelo)

### Relacionada com:
- TASK-008 - Implementar validação completa (parte de segurança)

---

## 📚 Referências

- `RELATORIO-AUDITORIA-COMPLETA-2025-02-02.md` - Seção "4.6 CORS"
- `backend-api/src/server.js` - Configuração atual

---

## 💡 Notas Técnicas

1. **Preflight Requests:** Garantir que requisições OPTIONS também validem origem.

2. **Credentials:** Se usar `Access-Control-Allow-Credentials: true`, não pode usar `*` como origem. Garantir que origem específica seja enviada.

3. **Múltiplas Origens:** Suportar lista de origens separadas por vírgula.

4. **Logging:** Em produção, logar tentativas de acesso não permitidas para monitoramento de segurança.

5. **Headers:** Manter outros headers CORS (métodos, headers permitidos, etc.).

---

## ⚠️ Riscos e Considerações

- **Risco 1:** Configuração incorreta pode bloquear requisições legítimas
  - **Mitigação:** Testar extensivamente, manter comportamento permissivo em dev

- **Risco 2:** Esquecer de adicionar nova origem em produção
  - **Mitigação:** Documentar processo, adicionar ao checklist de deploy

- **Risco 3:** Variável de ambiente não configurada em produção
  - **Mitigação:** Validar no startup, mostrar erro claro se não configurada

---

## 📊 Estimativas

**Tempo Estimado:** 2-3 horas  
**Complexidade:** Baixa  
**Esforço:** Pequeno

**Breakdown:**
- Implementação: 1 hora
- Testes: 30 minutos
- Documentação: 30 minutos
- Validação em ambientes: 30 minutos

---

## 🔄 Histórico de Mudanças

| Data | Autor | Mudança |
|------|-------|---------|
| 02/02/2025 | Sistema | Task criada |

---

## ✅ Checklist Final

- [ ] Código implementado
- [ ] Testes passando
- [ ] Code review realizado
- [ ] Documentação atualizada
- [ ] Deploy em dev
- [ ] Testes em dev
- [ ] Deploy em homologação
- [ ] Testes em homologação
- [ ] Aprovação do PO
- [ ] Deploy em produção
- [ ] Verificação em produção
- [ ] Task fechada

---

**Criado em:** 02/02/2025  
**Última Atualização:** 02/02/2025

